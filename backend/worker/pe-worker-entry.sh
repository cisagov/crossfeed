#!/bin/bash

set -e

echo "Starting pe-worker-entry.sh script"
echo "$AWS_REGION"
echo "$SERVICE_QUEUE_URL"

curl -i -u "guest:guest" http://rabbitmq:15672/api/queues

echo "Running $SERVICE_TYPE"

# Check if the QUEUE_URL environment variable is set
if [ -z "$SERVICE_QUEUE_URL" ]; then
  echo "SERVICE_QUEUE_URL environment variable is not set. Exiting."
  exit 1
fi

# Function to retrieve a message from RabbitMQ queue
get_rabbitmq_message() {
  echo "Calling get_rabbitmq_message..."
  curl -i -u "guest:guest" \
       -H "content-type:application/json" \
       -X POST "http://rabbitmq:15672/api/queues/%2F/$SERVICE_QUEUE_URL/get" \
       --data '{"count": 1, "requeue": true, "encoding": "auto", "ackmode": "ack_requeue_true"}'
}


while true; do
  # Receive message from the Scan specific queue
  if [ "$IS_LOCAL" = true ]; then
    echo "Running local RabbitMQ logic..."
    # Call the function and capture the response
    RESPONSE=$(get_rabbitmq_message)
    echo "Response from get_rabbitmq_message: $RESPONSE"
    # Extract the message from the response
    MESSAGE=$(echo "$RESPONSE" | jq -r '.[0].payload')
  else
    echo "Running live SQS logic..."
    MESSAGE=$(aws sqs receive-message --queue-url "$SERVICE_QUEUE_URL")
  fi

  # Check if there are no more messages. If no more, then exit Fargate container
  if [ -z "$MESSAGE" ]; then
    echo "No more messages in the queue. Exiting."
    break
  fi

  echo "$MESSAGE"
  # Extract the org_name from the message body
  if [ "$IS_LOCAL" = true ]; then
    ORG=$(echo "$MESSAGE" | jq -r '.payload | fromjson | .org')
  else
      ORG=$(echo "$MESSAGE" | jq -r '.Body.org')
  fi

  if [ "$SERVICE_TYPE" = "shodan" ]; then
    COMMAND="pe-source shodan --soc_med_included --org=\"$ORG\""
  elif [ "$SERVICE_TYPE" = "dnstwist" ]; then 
    COMMAND="pe-source dnstwist --org=\"$ORG\""
  else
    echo "Unsupported SERVICE_TYPE: $SERVICE_TYPE"
    break
  fi

  echo "Running $COMMAND"

  # Run the pe-source command
  eval "$COMMAND"

  # Delete the processed message from the queue
  if [ "$IS_LOCAL" = true ]; then
    DELIVERY_TAG=$(echo "$MESSAGE" | jq -r '.delivery_tag')
    rabbitmqadmin --username=quest --password=guest ack queue="$SERVICE_QUEUE_URL" delivery_tag="$DELIVERY_TAG"

  else
    RECEIPT_HANDLE=$(echo "$MESSAGE" | jq -r '.ReceiptHandle')
    aws sqs delete-message --queue-url "$SERVICE_QUEUE_URL" --receipt-handle "$RECEIPT_HANDLE"
  fi
done
