import { Handler } from 'aws-lambda';
import { connectToDatabase, ScanTask } from '../models';
import { Task } from 'aws-sdk/clients/ecs';
import pRetry from 'p-retry';

export type EventBridgeEvent = {
  detail: Task & {
    stopCode?: string;
    stoppedReason?: string;
    taskArn: string;
    lastStatus: FargateTaskStatus;
    containers: {
      exitCode?: number;
    }[];
  };
};

type FargateTaskStatus =
  | 'PROVISIONING'
  | 'PENDING'
  | 'RUNNING'
  | 'DEPROVISIONING'
  | 'STOPPED';

export const handler: Handler<EventBridgeEvent> = async (
  event: EventBridgeEvent
) => {
  const { taskArn, lastStatus } = event.detail;
  await connectToDatabase();
  const scanTask = await pRetry(
    () =>
      ScanTask.findOne({
        fargateTaskArn: taskArn
      }),
    { retries: 3 }
  );
  if (!scanTask) {
    throw new Error(`Couldn't find scan with task arn ${taskArn}.`);
  }
  const oldStatus = scanTask.status;
  if (lastStatus === 'RUNNING') {
    scanTask.status = 'started';
  } else if (lastStatus === 'STOPPED') {
    if (event.detail.containers![0]?.exitCode === 0) {
      scanTask.status = 'finished';
    } else {
      scanTask.status = 'failed';
    }
    scanTask.output = `${event.detail.stopCode}: ${event.detail.stoppedReason}`;
    scanTask.finishedAt = new Date();
  } else {
    return;
  }
  console.log(
    `Updating status of ScanTask ${scanTask.id} from ${oldStatus} to ${scanTask.status}.`
  );
  await scanTask.save();
};
