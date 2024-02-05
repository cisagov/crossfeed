// sendMessage.js
const amqp = require('amqplib');

async function sendMessageToControlQueue(message) {
  const connection = await amqp.connect('amqp://localhost');
  const channel = await connection.createChannel();
  const controlQueue = 'ControlQueue';

  await channel.assertQueue(controlQueue, { durable: true });

  // Simulate sending a message to the ControlQueue
  channel.sendToQueue(controlQueue, Buffer.from(JSON.stringify(message)), {
    persistent: true
  });

  console.log('Message sent to ControlQueue:', message);

  setTimeout(() => {
    connection.close();
  }, 500);
}

// Simulate sending a message
const message = {
  scriptType: 'shodan',
  org: 'DHS'
};
sendMessageToControlQueue(message);
