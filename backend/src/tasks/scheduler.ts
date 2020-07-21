import { Handler } from 'aws-lambda';
import { connectToDatabase, Scan, Organization, ScanTask } from '../models';
import { Lambda, Credentials } from 'aws-sdk';
import ECSClient from './ecs-client';
import { SCAN_SCHEMA } from '../api/scans';
import { In } from 'typeorm';

const launchScanTask = async ({ organization = undefined, scan, chunkNumber, numChunks }: { organization?: Organization, scan: Scan, chunkNumber?: number, numChunks?: number }) => {
  const { type, global } = SCAN_SCHEMA[scan.name];
  const ecsClient = new ECSClient();
  const scanTask = await ScanTask.save(
    ScanTask.create({
      organization: global ? undefined: organization,
      scan,
      type,
      status: 'created'
    })
  );
  try {
    const commandOptions = {
      organizationId: organization?.id,
      organizationName: organization?.name,
      scanId: scan.id,
      scanName: scan.name,
      scanTaskId: scanTask.id,
      numChunks,
      chunkNumber
    };
    if (type === 'fargate') {
      const result = await ecsClient.runCommand(commandOptions);
      if (result.tasks!.length === 0) {
        console.error(result.failures);
        throw new Error(
          `Failed to start fargate task for scan ${scan.name} -- got ${
            result.failures!.length
          } failures.`
        );
      }
      console.log(`Successfully invoked ${scan.name} scan with fargate.`);
    } else {
      throw new Error('Invalid type ' + type);
    }
    scanTask.input = JSON.stringify(commandOptions);
    scanTask.status = 'requested';
    scanTask.requestedAt = new Date();
  } catch (error) {
    console.error(`Error invoking ${scan.name} scan.`);
    console.error(error);
    scanTask.output = JSON.stringify(error);
    scanTask.status = 'failed';
  } finally {
    await scanTask.save();
  }
}

const shouldRunScan = async ({ organization, scan }: { organization?: Organization, scan: Scan }) => {
  const { isPassive, global } = SCAN_SCHEMA[scan.name];
  // Don't run non-passive scans on passive organizations.
  if (organization?.isPassive && !isPassive) {
    return false;
  }
  const lastRunningScanTask = await ScanTask.findOne(
    {
      organization: global ? undefined: { id: organization?.id },
      scan: { id: scan.id },
      status: In(['created', 'requested', 'started'])
    },
    {
      order: {
        createdAt: 'DESC'
      }
    }
  );
  const lastFinishedScanTask = await ScanTask.findOne(
    {
      organization: global ? undefined: { id: organization?.id },
      scan: { id: scan.id },
      status: 'finished'
    },
    {
      order: {
        finishedAt: 'DESC'
      }
    }
  );
  if (lastRunningScanTask) {
    // Don't run another task if the latest task is already running.
    if (
      !lastFinishedScanTask ||
      lastRunningScanTask.createdAt > lastFinishedScanTask.createdAt
    ) {
      return false;
    }
  }
  if (
    lastFinishedScanTask &&
    lastFinishedScanTask.finishedAt &&
    lastFinishedScanTask.finishedAt.getTime() >=
      new Date().getTime() - 1000 * scan.frequency
  ) {
    return false;
  }

  return true;
}

export const handler: Handler = async (event) => {

  await connectToDatabase();

  const scans = await Scan.find();
  const organizations = await Organization.find();
  for (const scan of scans) {
    if (!SCAN_SCHEMA[scan.name]) {
      console.error('Invalid scan name ', scan.name);
      continue;
    }
    const { global, numChunks } = SCAN_SCHEMA[scan.name];

    if (global) {
      // Global scans are not associated with an organization.
      if (typeof event !== 'string') { // Skip these checks (always run the scan) if invoking scans directly from the command line.
        continue;
        if (!(await shouldRunScan({ scan }))) {
          continue;
        }
      }
      if (numChunks) {
        for (let chunkNumber = 0; chunkNumber < numChunks; chunkNumber++) {
          await launchScanTask({ scan, chunkNumber, numChunks: numChunks });
        }
      } else {
        await launchScanTask({ scan });
      }
    } else {
      for (const organization of organizations) {
        if (typeof event !== 'string') { // Skip these checks (always run the scan) if invoking scans directly from the command line.
          if (!(await shouldRunScan({ organization, scan }))) {
            continue;
          }
        }
        await launchScanTask({ organization, scan });
      }
    }
    scan.lastRun = new Date();
    scan.save();
  }
};
