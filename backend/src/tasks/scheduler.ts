import { Handler } from 'aws-lambda';
import { connectToDatabase, Scan, Organization, ScanTask } from '../models';
import ECSClient from './ecs-client';
import { SCAN_SCHEMA } from '../api/scans';
import { In } from 'typeorm';

const launchSingleScanTask = async ({
  organization = undefined,
  scan,
  chunkNumber,
  numChunks
}: {
  organization?: Organization;
  scan: Scan;
  chunkNumber?: number;
  numChunks?: number;
}) => {
  const { type, global } = SCAN_SCHEMA[scan.name];

  const ecsClient = new ECSClient();
  const scanTask = await ScanTask.create({
    organization: global ? undefined : organization,
    scan,
    type,
    status: 'created'
  }).save();
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
      const taskArn = result.tasks![0].taskArn;
      scanTask.fargateTaskArn = taskArn;
      if (typeof jest === 'undefined') {
        console.log(
          `Successfully invoked ${scan.name} scan with fargate, with ECS task ARN ${taskArn}. ` +
            (numChunks ? ` Chunk ${chunkNumber}/${numChunks}` : '')
        );
      }
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
};

const launchScanTask = async ({
  organization = undefined,
  scan
}: {
  organization?: Organization;
  scan: Scan;
}) => {
  let { numChunks } = SCAN_SCHEMA[scan.name];
  if (numChunks) {
    if (typeof jest === 'undefined' && process.env.IS_LOCAL) {
      // For running server on localhost -- doesn't apply in jest tests, though.
      numChunks = 1;
    }
    for (let chunkNumber = 0; chunkNumber < numChunks; chunkNumber++) {
      await launchSingleScanTask({
        organization,
        scan,
        chunkNumber,
        numChunks: numChunks
      });
    }
  } else {
    await launchSingleScanTask({ organization, scan });
  }
};

const shouldRunScan = async ({
  organization,
  scan
}: {
  organization?: Organization;
  scan: Scan;
}) => {
  const { isPassive, global } = SCAN_SCHEMA[scan.name];
  // Don't run non-passive scans on passive organizations.
  if (organization?.isPassive && !isPassive) {
    return false;
  }
  const orgFilter = global ? {} : { organization: { id: organization?.id } };
  const lastRunningScanTask = await ScanTask.findOne(
    {
      scan: { id: scan.id },
      status: In(['created', 'requested', 'started']),
      ...orgFilter
    },
    {
      order: {
        createdAt: 'DESC'
      }
    }
  );
  if (lastRunningScanTask) {
    // Don't run another task if there's already a running task.
    return false;
  }
  const lastFinishedScanTask = await ScanTask.findOne(
    {
      scan: { id: scan.id },
      status: 'finished',
      ...orgFilter
    },
    {
      order: {
        finishedAt: 'DESC'
      }
    }
  );
  if (
    lastFinishedScanTask &&
    lastFinishedScanTask.finishedAt &&
    lastFinishedScanTask.finishedAt.getTime() >=
      new Date().getTime() - 1000 * scan.frequency
  ) {
    return false;
  }

  return true;
};

// These two arguments are currently used only for testing purposes.
interface Event {
  // If specified, limits scheduling to a particular scan
  scanId?: string;

  // If specified, limits scheduling to a particular organization
  // (includes global scans on all organizations as well)
  organizationId?: string;
}

export const handler: Handler<Event> = async (event) => {
  await connectToDatabase();
  console.log('Running scheduler...');

  const scans = await Scan.find({
    where: event.scanId ? { id: event.scanId } : {},
    relations: ['organizations']
  });
  const organizations = await Organization.find(
    event.organizationId ? { id: event.organizationId } : {}
  );
  for (const scan of scans) {
    if (!SCAN_SCHEMA[scan.name]) {
      console.error('Invalid scan name ', scan.name);
      continue;
    }
    const { global } = SCAN_SCHEMA[scan.name];
    let launchedScan = false;

    if (global) {
      // Global scans are not associated with an organization.
      if (!(await shouldRunScan({ scan }))) {
        continue;
      }
      launchedScan = true;
      await launchScanTask({ scan });
    } else if (scan.isGranular) {
      for (const organization of scan.organizations) {
        if (!(await shouldRunScan({ organization, scan }))) {
          continue;
        }
        launchedScan = true;
        await launchScanTask({ organization, scan });
      }
    } else {
      for (const organization of organizations) {
        if (!(await shouldRunScan({ organization, scan }))) {
          continue;
        }
        launchedScan = true;
        await launchScanTask({ organization, scan });
      }
    }
    if (launchedScan) {
      scan.lastRun = new Date();
      await scan.save();
    }
  }

  console.log('Finished running scheduler.');
};
