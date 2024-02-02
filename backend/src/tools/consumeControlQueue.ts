// Script to setup Control Queue locally so when messages are sent to it,
// the scanExecution lambda is triggered
import { handler as scanExecution } from '../tasks/scanExecution';
const amqp = require('amqplib');
import * as dotenv from 'dotenv';
import * as path from 'path';

async function consumeControlQueue() {
  // Load the environment variables from the .env file
  const envPath = path.resolve(__dirname, '../../.env');
  dotenv.config({ path: envPath });
  console.log(process.env.SHODAN_QUEUE_URL);

  // Connect to RabbitMQ
  const connection = await amqp.connect('amqp://rabbitmq');
  const channel = await connection.createChannel();
  const controlQueue = 'ControlQueue';

  await channel.assertQueue(controlQueue, { durable: true });

  console.log('Waiting for messages from ControlQueue...');

  channel.consume(controlQueue, (message) => {
    if (message !== null) {
      const payload = JSON.parse(message.content.toString());

      // Trigger your local Lambda function here
      console.log('Received message:', payload);

      // Call scanExecution with the payload from message
      scanExecution(
        { Records: [{ body: JSON.stringify(payload) }] },
        {} as any,
        () => null
      );

      channel.ack(message);
    }
  });
}

consumeControlQueue();
