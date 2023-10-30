import { Handler, SQSRecord } from 'aws-lambda';
import * as AWS from 'aws-sdk';
import { integer } from 'aws-sdk/clients/cloudfront';

const ecs = new AWS.ECS();
const sqs = new AWS.SQS();

export const handler: Handler = async (event) => {

  try {
    let desiredCount;
    const clusterName = process.env.FARGATE_CLUSTER_NAME!;

    // Get the Control SQS record and message body
    const sqsRecord: SQSRecord = event.Records[0];
    const message_body = JSON.parse(sqsRecord.body);
    console.log(message_body);

    if (message_body.scriptType! === 'shodan') {

      // Place message in Shodan Queue
      await placeMessageInQueue(process.env.SHODAN_QUEUE_URL!, message_body);

      // Check if Fargate is running desired count and start if not
      desiredCount = 5;

      await startFargateTask(clusterName, process.env.SHODAN_SERVICE_NAME!, desiredCount)
    } else {
      console.log("Shodan is the only script type available right now.")
    }

  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify(error)
    };
  }
};


async function startFargateTask(clusterName: string, serviceName: string, desiredCountNum: integer) {
  try {
    const describeServiceParams = {
      cluster: clusterName,
      services: [serviceName],
    };

    const serviceDescription = await ecs.describeServices(describeServiceParams).promise();

    if (serviceDescription && serviceDescription.services && serviceDescription.services.length > 0) {
      const service = serviceDescription.services[0];

      // Check if the desired task count is less than # provided
      if (service.desiredCount! < desiredCountNum) {
        const updateServiceParams = {
          cluster: clusterName,
          service: serviceName,
          desiredCount: desiredCountNum, // Set to desired # of Fargate tasks
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
    MessageBody: JSON.stringify(message),
  };

  await sqs.sendMessage(sendMessageParams).promise();
}