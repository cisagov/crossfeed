import {
  handler as updateScanTaskStatus,
  EventBridgeEvent
} from '../tasks/updateScanTaskStatus';

/**
 * Listens for Docker events and converts start / stop events to corresponding Fargate EventBridge events,
 * so that they can be handled by the updateScanTaskStatus lambda function.
 *
 * This function is only used for runs during local development in order to simulate EventBridge events.
 */
export const listenForDockerEvents = async () => {
  const Docker = require('dockerode');
  const docker: any = new Docker();
  const stream = await docker.getEvents();
  stream.on('data', async (chunk: any) => {
    const message = JSON.parse(Buffer.from(chunk).toString('utf-8'));
    if (message.from !== 'crossfeed-worker') {
      return;
    }
    let payload: EventBridgeEvent;
    if (message.status === 'start') {
      payload = {
        detail: {
          stopCode: '',
          stoppedReason: '',
          taskArn: message.Actor.Attributes.name,
          lastStatus: 'RUNNING',
          containers: [{}]
        }
      };
    } else if (message.status === 'die') {
      payload = {
        detail: {
          stopCode: 'EssentialContainerExited',
          stoppedReason: 'Essential container in task exited',
          taskArn: message.Actor.Attributes.name,
          lastStatus: 'STOPPED',
          containers: [
            {
              exitCode: Number(message.Actor.Attributes.exitCode)
            }
          ]
        }
      };
    } else {
      return;
    }
    await setTimeout(
      () => updateScanTaskStatus(payload, {} as any, () => null),
      1000
    );
  });
};
