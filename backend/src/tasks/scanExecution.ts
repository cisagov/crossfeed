import { Handler, SQSRecord } from 'aws-lambda';
import * as AWS from 'aws-sdk';
import { integer } from 'aws-sdk/clients/cloudfront';
import { connect } from 'amqplib';

const ecs = new AWS.ECS();
const sqs = new AWS.SQS();
let docker;
if (process.env.IS_LOCAL) {
  docker = require('dockerode');
}

const toSnakeCase = (input) => input.replace(/ /g, '-');

async function updateServiceAndQueue(
  queueUrl: string,
  serviceName: string,
  desiredCount: integer,
  message_body: any, // Add this parameter
  clusterName: string // Add this parameter
) {
  // Place message in scan specific queue
  if (process.env.IS_LOCAL) {
    // If running locally, use RabbitMQ instead of SQS
    console.log('Publishing to rabbitMQ');
    await publishToRabbitMQ(queueUrl, message_body);
    console.log('Done publishing to rabbitMQ');
  } else {
    // Place in AWS SQS queue
    console.log('Publishing to scan specific queue');
    await placeMessageInQueue(queueUrl, message_body);
  }

  // Check if Fargate is running desired count and start if not
  await updateServiceDesiredCount(
    clusterName,
    serviceName,
    desiredCount,
    queueUrl
  );
  console.log('Done');
}

export async function updateServiceDesiredCount(
  clusterName: string,
  serviceName: string,
  desiredCountNum: integer,
  queueUrl: string
) {
  try {
    if (process.env.IS_LOCAL) {
      console.log('starting local containers');
      await startLocalContainers(desiredCountNum, serviceName, queueUrl);
    } else {
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
          console.log('Setting desired count.');
          const updateServiceParams = {
            cluster: clusterName,
            service: serviceName,
            desiredCount: desiredCountNum // Set to desired # of Fargate tasks
          };

          await ecs.updateService(updateServiceParams).promise();
        } else {
          console.log('Desired count already set.');
        }
      }
    }
  } catch (error) {
    console.error('Error: ', error);
  }
}

async function startLocalContainers(
  count: number,
  serviceName: string,
  queueUrl: string
) {
  // Start 'count' number of local Docker containers
  for (let i = 0; i < count; i++) {
    try {
      const containerName = toSnakeCase(
        `crossfeed_worker_${serviceName}_${i}_` +
          Math.floor(Math.random() * 10000000)
      );
      const container = await docker!.createContainer({
        // We need to create unique container names to avoid conflicts.
        name: containerName,
        Image: 'pe-worker',
        HostConfig: {
          // In order to use the host name "db" to access the database from the
          // crossfeed-worker image, we must launch the Docker container with
          // the Crossfeed backend network.
          NetworkMode: 'crossfeed_backend',
          Memory: 4000000000 // Limit memory to 4 GB. We do this locally to better emulate fargate memory conditions. TODO: In the future, we could read the exact memory from SCAN_SCHEMA to better emulate memory requirements for each scan.
        },
        Env: [
          `DB_DIALECT=${process.env.DB_DIALECT}`,
          `DB_HOST=${process.env.DB_HOST}`,
          `IS_LOCAL=true`,
          `DB_PORT=${process.env.DB_PORT}`,
          `DB_NAME=${process.env.DB_NAME}`,
          `DB_USERNAME=${process.env.DB_USERNAME}`,
          `DB_PASSWORD=${process.env.DB_PASSWORD}`,
          `PE_DB_NAME=${process.env.PE_DB_NAME}`,
          `PE_DB_USERNAME=${process.env.PE_DB_USERNAME}`,
          `PE_DB_PASSWORD=${process.env.PE_DB_PASSWORD}`,
          `CENSYS_API_ID=${process.env.CENSYS_API_ID}`,
          `CENSYS_API_SECRET=${process.env.CENSYS_API_SECRET}`,
          `WORKER_USER_AGENT=${process.env.WORKER_USER_AGENT}`,
          `SHODAN_API_KEY=${process.env.SHODAN_API_KEY}`,
          `HIBP_API_KEY=${process.env.HIBP_API_KEY}`,
          `SIXGILL_CLIENT_ID=${process.env.SIXGILL_CLIENT_ID}`,
          `SIXGILL_CLIENT_SECRET=${process.env.SIXGILL_CLIENT_SECRET}`,
          `INTELX_API_KEY=${process.env.INTELX_API_KEY}`,
          `PE_SHODAN_API_KEYS=${process.env.PE_SHODAN_API_KEYS}`,
          `WORKER_SIGNATURE_PUBLIC_KEY=${process.env.WORKER_SIGNATURE_PUBLIC_KEY}`,
          `WORKER_SIGNATURE_PRIVATE_KEY=${process.env.WORKER_SIGNATURE_PRIVATE_KEY}`,
          `ELASTICSEARCH_ENDPOINT=${process.env.ELASTICSEARCH_ENDPOINT}`,
          `AWS_ACCESS_KEY_ID=${process.env.AWS_ACCESS_KEY_ID}`,
          `AWS_SECRET_ACCESS_KEY=${process.env.AWS_SECRET_ACCESS_KEY}`,
          `AWS_REGION=${process.env.AWS_REGION}`,
          `LG_API_KEY=${process.env.LG_API_KEY}`,
          `LG_WORKSPACE_NAME=${process.env.LG_WORKSPACE_NAME}`,
          `SERVICE_QUEUE_URL=${queueUrl}`,
          `SERVICE_TYPE=${serviceName}`
        ]
      } as any);
      await container.start();
      console.log(`done starting container ${i}`);
    } catch (e) {
      console.error(e);
    }
  }
}

// Place message in AWS SQS Queue
async function placeMessageInQueue(queueUrl: string, message: any) {
  const sendMessageParams = {
    QueueUrl: queueUrl,
    MessageBody: JSON.stringify(message)
  };

  await sqs.sendMessage(sendMessageParams).promise();
}

// Function to connect to RabbitMQ and publish a message
async function publishToRabbitMQ(queue: string, message: any) {
  const connection = await connect('amqp://rabbitmq');
  const channel = await connection.createChannel();

  await channel.assertQueue(queue, { durable: true });
  await channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)));

  await channel.close();
  await connection.close();
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
      desiredCount = 30;
      await updateServiceAndQueue(
        process.env.DNSTWIST_QUEUE_URL!,
        process.env.DNSTWIST_SERVICE_NAME!,
        desiredCount,
        message_body,
        clusterName
      );
    } else if (message_body.scriptType === 'hibp') {
      desiredCount = 20;
      await updateServiceAndQueue(
        process.env.HIBP_QUEUE_URL!,
        process.env.HIBP_SERVICE_NAME!,
        desiredCount,
        message_body,
        clusterName
      );
    } else if (message_body.scriptType === 'intelx') {
      desiredCount = 10;
      await updateServiceAndQueue(
        process.env.INTELX_QUEUE_URL!,
        process.env.INTELX_SERVICE_NAME!,
        desiredCount,
        message_body,
        clusterName
      );
    } else if (message_body.scriptType === 'cybersixgill') {
      desiredCount = 10;
      await updateServiceAndQueue(
        process.env.CYBERSIXGILL_QUEUE_URL!,
        process.env.CYBERSIXGILL_SERVICE_NAME!,
        desiredCount,
        message_body,
        clusterName
      );
    } else {
      console.log(
        'Shodan, DNSTwist, HIBP, and Cybersixgill are the only script types available right now.'
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
