#!/bin/bash

set -e

echo "Starting pe-worker-entry.sh script"

echo "Running $SERVICE_TYPE"

# Check if the QUEUE_URL environment variable is set
if [ -z "$SERVICE_QUEUE_URL" ]; then
  echo "SERVICE_QUEUE_URL environment variable is not set. Exiting."
  exit 1
fi

while true; do
  # Receive message from the Scan specific queue
  MESSAGE=$(aws sqs receive-message --queue-url "$SERVICE_QUEUE_URL")

  # Check if there are no more messages. If no more, then exit Fargate container
  if [ -z "$MESSAGE" ]; then
    echo "No more messages in the queue. Exiting."
    break
  fi

  # Extract the org_name from the message body
  ORG=$(echo "$MESSAGE" | jq -r '.Body.org')

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
  RECEIPT_HANDLE=$(echo "$MESSAGE" | jq -r '.ReceiptHandle')
  aws sqs delete-message --queue-url "$SERVICE_QUEUE_URL" --receipt-handle "$RECEIPT_HANDLE"
done
