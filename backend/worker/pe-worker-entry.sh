#!/bin/sh

set -e

# Check if the SHODAN_QUEUE_URL environment variable is set
if [ -z "$SHODAN_QUEUE_URL" ]; then
  echo "SHODAN_QUEUE_URL environment variable is not set. Exiting."
  exit 1
fi

while true; do
  # Receive message from the Shodan queue
  MESSAGE=$(aws sqs receive-message --queue-url "$SHODAN_QUEUE_URL")

  # Check if there are no more messages
  if [ -z "$MESSAGE" ]; then
    echo "No more messages in the queue. Exiting."
    break
  fi

  # Extract the org_name from the message body
  ORG=$(echo "$MESSAGE" | jq -r '.Body.org')

  # Run the pe-source command
  pe-source shodan --soc_med_included --org="$ORG"

  # Delete the processed message from the queue
  RECEIPT_HANDLE=$(echo "$MESSAGE" | jq -r '.ReceiptHandle')
  aws sqs delete-message --queue-url YOUR_SHODAN_QUEUE_URL --receipt-handle "$RECEIPT_HANDLE"
done