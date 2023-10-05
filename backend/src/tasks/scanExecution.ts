import { Handler, SQSRecord } from 'aws-lambda';
import * as AWS from 'aws-sdk';

const ecs = new AWS.ECS();
const sqs = new AWS.SQS();

export const handler: Handler = async (event) => {
  try {
    // Get the SQS record and message body
    const sqsRecord: SQSRecord = event.Records[0];
    const commandOptions: string = sqsRecord.body;

    console.log(commandOptions);

    // Get the ARN of the SQS queue from the event
    const sqsQueueArn: string | undefined = sqsRecord.eventSourceARN;

    if (!sqsQueueArn) {
      throw new Error('SQS Queue ARN not found in event');
    }

    // Describe the SQS queue to get its URL
    const sqsQueue = {
      QueueUrl: sqsQueueArn // Use the ARN as the QueueUrl
    };
    const queueAttributesResponse = await sqs
      .getQueueAttributes(sqsQueue)
      .promise();
    const sqsQueueUrl = queueAttributesResponse.Attributes?.QueueUrl;
    console.log(sqsQueueUrl);
    if (!sqsQueueUrl) {
      throw new Error('SQS Queue URL not found');
    }

    // Run command in queue message in Fargate
    const params: AWS.ECS.RunTaskRequest = {
      cluster: process.env.FARGATE_CLUSTER_NAME!,
      taskDefinition: process.env.FARGATE_TASK_DEFINITION_NAME!,
      launchType: 'FARGATE',
      networkConfiguration: {
        awsvpcConfiguration: {
          assignPublicIp: 'ENABLED',
          securityGroups: [process.env.FARGATE_SG_ID!],
          subnets: [process.env.FARGATE_SUBNET_ID!]
        }
      },
      platformVersion: '1.4.0',
      overrides: {
        containerOverrides: [
          {
            name: 'main', // from task definition
            command: [commandOptions] // Pass the command options as an array
          }
        ]
      }
    };
    const data = await ecs.runTask(params).promise();
    console.log('Fargate task started:', data);

    // Send a message to the SQS queue to trigger processing
    const sqsParams: AWS.SQS.SendMessageRequest = {
      MessageBody: 'Start processing...',
      QueueUrl: sqsQueueUrl
    };
    await sqs.sendMessage(sqsParams).promise();

    return {
      statusCode: 200,
      body: JSON.stringify('Fargate task started and message sent to SQS queue')
    };
  } catch (error) {
    console.error('Error starting Fargate task:', error);
    return {
      statusCode: 500,
      body: JSON.stringify('Error starting Fargate task')
    };
  }
};
