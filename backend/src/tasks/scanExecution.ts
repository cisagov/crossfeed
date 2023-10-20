import { Handler, SQSRecord } from 'aws-lambda';
import * as AWS from 'aws-sdk';

const ecs = new AWS.ECS();
const sqs = new AWS.SQS();

export const handler: Handler = async (event) => {
  try {
    // Get the SQS record and message body
    const sqsRecord: SQSRecord = event.Records[0];
    const body: string = sqsRecord.body;

    console.log(body);

    let commandOptions;
    if (body === 'SHODAN') {
      commandOptions = './worker/shodan.sh';
    } else {
      commandOptions = body;
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
