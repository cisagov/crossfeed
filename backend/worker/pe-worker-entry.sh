#!/bin/bash

set -e

echo "Starting pe-worker-entry.sh script"
echo "$SERVICE_QUEUE_URL"

echo "Running $SERVICE_TYPE"

# Check if the QUEUE_URL environment variable is set
if [ -z "$SERVICE_QUEUE_URL" ]; then
  echo "SERVICE_QUEUE_URL environment variable is not set. Exiting."
  exit 1
fi

# Function to retrieve a message from RabbitMQ queue
get_rabbitmq_message() {
  curl -s -u "guest:guest" \
       -H "content-type:application/json" \
       -X POST "http://rabbitmq:15672/api/queues/%2F/$SERVICE_QUEUE_URL/get" \
       --data '{"count": 1, "requeue": false, "encoding": "auto", "ackmode": "ack_requeue_false"}'
}


while true; do
  # Receive message from the Scan specific queue
  if [ "$IS_LOCAL" = true ]; then
    echo "Running local RabbitMQ logic..."
    # Call the function and capture the response
    RESPONSE=$(get_rabbitmq_message) &&
    echo "Response from get_rabbitmq_message: $RESPONSE" &&
    # Extract the JSON payload from the response body
    MESSAGE=$(echo "$RESPONSE" | jq -r '.[0].payload')
    MESSAGE=$(echo "$MESSAGE" | sed 's/\\"/"/g')
    echo "MESSAGE: $MESSAGE"

  else
    echo "Running live SQS logic..."
    MESSAGE=$(aws sqs receive-message --queue-url "$SERVICE_QUEUE_URL" --output json --max-number-of-messages 1)
    echo "MESSAGE: $MESSAGE"
  fi

  # Check if there are no more messages. If no more, then exit Fargate container
  if [ -z "$MESSAGE" ] || [ "$MESSAGE" == "null" ];  then
    echo "No more messages in the queue. Exiting."
    break
  fi

  # Extract the org_name from the message body
  if [ "$IS_LOCAL" = true ]; then
    ORG=$(echo "$MESSAGE" | jq -r '.org')
  else
    ORG=$(echo "$MESSAGE" | jq -r '.Messages[0].Body | fromjson | .org')
  fi

  if [[ "$SERVICE_TYPE" = *"shodan"*  ]]; then
    COMMAND="pe-source shodan --soc_med_included --org=$ORG"
  elif [[ "$SERVICE_TYPE" = *"dnstwist"* ]]; then 
    COMMAND="pe-source dnstwist --org=$ORG"
  elif [[ "$SERVICE_TYPE" = *"hibp"* ]]; then 
    COMMAND="pe-source hibp --org=$ORG"
  elif [[ "$SERVICE_TYPE" = *"intelx"* ]]; then 
    COMMAND="pe-source intelx --org=$ORG --soc_med_included"
  elif [[ "$SERVICE_TYPE" = *"cybersixgill"* ]]; then 
    COMMAND="pe-source cybersixgill --org=$ORG --soc_med_included"
  else
    echo "Unsupported SERVICE_TYPE: $SERVICE_TYPE"
    break
  fi

  echo "Running $COMMAND"

  # Run the pe-source command
  eval "$COMMAND" &&

  cat /app/pe_reports_logging.log

  # Delete the processed message from the queue
  if [ "$IS_LOCAL" = true ]; then
    echo "Done with $ORG"

  else
    RECEIPT_HANDLE=$(echo "$MESSAGE" | jq -r '.Messages[0].ReceiptHandle')
    aws sqs delete-message --queue-url "$SERVICE_QUEUE_URL" --receipt-handle "$RECEIPT_HANDLE"
    echo "Done with $ORG"
  fi
done