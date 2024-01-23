import { Handler, SQSRecord } from 'aws-lambda';
import * as AWS from 'aws-sdk';
import { integer } from 'aws-sdk/clients/cloudfront';

const ecs = new AWS.ECS();
const sqs = new AWS.SQS();

async function updateServiceAndQueue(
  queueUrl: string,
  serviceName: string,
  desiredCount: integer,
  message_body: any, // Add this parameter
  clusterName: string // Add this parameter
) {
  // Place message in scan specific queue
  await placeMessageInQueue(queueUrl, message_body);

  // Check if Fargate is running desired count and start if not
  await updateServiceDesiredCount(clusterName, serviceName, desiredCount);

  // After processing each message, check if the SQS queue is empty
  const sqsAttributes = await sqs
    .getQueueAttributes({
      QueueUrl: queueUrl,
      AttributeNames: ['ApproximateNumberOfMessages']
    })
    .promise();

  const approximateNumberOfMessages = parseInt(
    sqsAttributes.Attributes?.ApproximateNumberOfMessages || '0',
    10
  );

  // If the queue is empty, scale down to zero tasks
  if (approximateNumberOfMessages === 0) {
    await updateServiceDesiredCount(clusterName, serviceName, 0);
  }
}

export async function updateServiceDesiredCount(
  clusterName: string,
  serviceName: string,
  desiredCountNum: integer
) {
  try {
    const describeServiceParams = {
      cluster: clusterName,
      services: [serviceName]
    };
    const serviceDescription = await ecs
      .describeServices(describeServiceParams)
      .promise();
    if (
      serviceDescription &&
      serviceDescription.services &&
      serviceDescription.services.length > 0
    ) {
      const service = serviceDescription.services[0];

      // Check if the desired task count is less than # provided
      if (service.desiredCount !== desiredCountNum) {
        const updateServiceParams = {
          cluster: clusterName,
          service: serviceName,
          desiredCount: desiredCountNum // Set to desired # of Fargate tasks
        };

        await ecs.updateService(updateServiceParams).promise();
      }
    }
  } catch (error) {
    console.error('Error: ', error);
  }
}

async function placeMessageInQueue(queueUrl: string, message: any) {
  const sendMessageParams = {
    QueueUrl: queueUrl,
    MessageBody: JSON.stringify(message)
  };

  await sqs.sendMessage(sendMessageParams).promise();
}

export const handler: Handler = async (event) => {
  try {
    let desiredCount;
    const clusterName = process.env.PE_CLUSTER_NAME!;

    // Get the Control SQS record and message body
    const sqsRecord: SQSRecord = event.Records[0];
    const message_body = JSON.parse(sqsRecord.body);
    console.log(message_body);

    if (message_body.scriptType === 'shodan') {
      desiredCount = 5;
      await updateServiceAndQueue(
        process.env.SHODAN_QUEUE_URL!,
        process.env.SHODAN_SERVICE_NAME!,
        desiredCount,
        message_body,
        clusterName
      );
    } else if (message_body.scriptType === 'dnstwist') {
      desiredCount = 10;
      await updateServiceAndQueue(
        process.env.DNSTWIST_QUEUE_URL!,
        process.env.DNSTWIST_SERVICE_NAME!,
        desiredCount,
        message_body,
        clusterName
      );
    } else {
      console.log(
        'Shodan and DNSTwist are the only script types available right now.'
      );
    }
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify(error)
    };
  }
};
