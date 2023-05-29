import {
  handler as updateScanTaskStatus,
  EventBridgeEvent
} from '../updateScanTaskStatus';
import { connectToDatabase, Scan, ScanTask } from '../../models';

let scan;
let connection;
beforeAll(async () => {
  connection = await connectToDatabase();
  scan = await Scan.create({
    name: 'findomain',
    arguments: {},
    frequency: 999
  }).save();
});
afterAll(async () => {
  await connection.close();
});

const createSampleEvent = ({
  lastStatus,
  taskArn,
  exitCode = 0
}): EventBridgeEvent => ({
  detail: {
    attachments: [],
    availabilityZone: 'us-east-1b',
    clusterArn:
      'arn:aws:ecs:us-east-1:563873274798:cluster/crossfeed-staging-worker',
    containers: [
      {
        containerArn:
          'arn:aws:ecs:us-east-1:563873274798:container/75d926f3-c850-4722-a143-639f02ff4756',
        exitCode: exitCode,
        lastStatus: lastStatus,
        name: 'main',
        image:
          '563873274798.dkr.ecr.us-east-1.amazonaws.com/crossfeed-staging-worker:latest',
        imageDigest:
          'sha256:080467614c0d7d5a5b092023b762931095308ae1dec8e54481fbd951f9784391',
        runtimeId: 'eeccdb34-d8cf-49e7-b379-1cf4f123c0ee-3935363592',
        taskArn:
          'arn:aws:ecs:us-east-1:563873274798:task/crossfeed-staging-worker/eeccdb34-d8cf-49e7-b379-1cf4f123c0ee',
        networkInterfaces: [
          {
            attachmentId: '5ff58204-1180-48ab-a62e-0a65a17cc4ef',
            privateIpv4Address: '10.0.3.61'
          }
        ],
        cpu: '0'
      }
    ],
    launchType: 'FARGATE',
    cpu: '256',
    memory: '512',
    desiredStatus: 'STOPPED',
    group: 'family:crossfeed-staging-worker',
    lastStatus: lastStatus,
    overrides: {
      containerOverrides: [
        {
          environment: [],
          name: 'main'
        }
      ]
    },
    connectivity: 'CONNECTED',
    stoppedReason: 'Essential container in task exited',
    stopCode: 'EssentialContainerExited',
    taskArn: taskArn,
    taskDefinitionArn:
      'arn:aws:ecs:us-east-1:563873274798:task-definition/crossfeed-staging-worker:2',
    version: 5,
    platformVersion: '1.4.0'
  }
});

test('starting event', async () => {
  const taskArn = Math.random() + '';
  let scanTask = await ScanTask.create({
    scan,
    type: 'fargate',
    status: 'requested',
    fargateTaskArn: taskArn
  }).save();
  await updateScanTaskStatus(
    createSampleEvent({ lastStatus: 'RUNNING', taskArn }),
    {} as any,
    () => null
  );
  scanTask = (await ScanTask.findOne(scanTask.id))!;
  expect(scanTask.status).toEqual('started');
});

test('finished event', async () => {
  const taskArn = Math.random() + '';
  let scanTask = await ScanTask.create({
    scan,
    type: 'fargate',
    status: 'started',
    fargateTaskArn: taskArn
  }).save();
  await updateScanTaskStatus(
    createSampleEvent({ lastStatus: 'STOPPED', taskArn, exitCode: 0 }),
    {} as any,
    () => null
  );
  scanTask = (await ScanTask.findOne(scanTask.id))!;
  expect(scanTask.status).toEqual('finished');
  expect(scanTask.finishedAt).toBeTruthy();
  expect(scanTask.output).toContain('EssentialContainerExited');
});

test('failed event', async () => {
  const taskArn = Math.random() + '';
  let scanTask = await ScanTask.create({
    scan,
    type: 'fargate',
    status: 'started',
    fargateTaskArn: taskArn
  }).save();
  await updateScanTaskStatus(
    createSampleEvent({ lastStatus: 'STOPPED', taskArn, exitCode: 1 }),
    {} as any,
    () => null
  );
  scanTask = (await ScanTask.findOne(scanTask.id))!;
  expect(scanTask.status).toEqual('failed');
});
