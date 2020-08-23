import { Handler } from 'aws-lambda';
import { connectToDatabase, Scan, Organization, ScanTask } from '../models';
import ECSClient from './ecs-client';
import { SCAN_SCHEMA } from '../api/scans';
import { In } from 'typeorm';

class Scheduler {
  ecs: ECSClient;
  numExistingTasks: number;
  numLaunchedTasks: number;
  maxConcurrentTasks: number;
  scans: Scan[];
  organizations: Organization[];

  constructor() {}

  async initialize({
    scans,
    organizations
  }: {
    scans: Scan[];
    organizations: Organization[];
  }) {
    this.scans = scans;
    this.organizations = organizations;
    this.ecs = new ECSClient();
    this.numExistingTasks = await this.ecs.getNumTasks();
    this.numLaunchedTasks = 0;
    this.maxConcurrentTasks = Number(process.env.FARGATE_MAX_CONCURRENCY!);

    console.log('Number of running Fargate tasks: ', this.numExistingTasks);
  }

  launchSingleScanTask = async ({
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
            `Successfully invoked ${scan.name} scan with fargate, with ECS task ARN ${taskArn}` +
              (numChunks ? `, Chunk ${chunkNumber}/${numChunks}` : '')
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
    this.numLaunchedTasks++;
  };

  launchScanTask = async ({
    organization = undefined,
    scan
  }: {
    organization?: Organization;
    scan: Scan;
  }) => {
    if (this.reachedScanLimit()) {
      return;
    }
    let { numChunks } = SCAN_SCHEMA[scan.name];
    if (numChunks) {
      if (typeof jest === 'undefined' && process.env.IS_LOCAL) {
        // For running server on localhost -- doesn't apply in jest tests, though.
        numChunks = 1;
      }
      if (
        this.numExistingTasks + this.numLaunchedTasks + numChunks >=
        this.maxConcurrentTasks
      ) {
        return;
      }
      for (let chunkNumber = 0; chunkNumber < numChunks; chunkNumber++) {
        await this.launchSingleScanTask({
          organization,
          scan,
          chunkNumber,
          numChunks: numChunks
        });
      }
    } else {
      await this.launchSingleScanTask({ organization, scan });
    }
  };

  reachedScanLimit() {
    return (
      this.numExistingTasks + this.numLaunchedTasks >= this.maxConcurrentTasks
    );
  }

  async run() {
    for (const scan of this.scans) {
      if (!SCAN_SCHEMA[scan.name]) {
        console.error('Invalid scan name ', scan.name);
        continue;
      }
      const { global } = SCAN_SCHEMA[scan.name];
      if (global) {
        // Global scans are not associated with an organization.
        if (!(await shouldRunScan({ scan }))) {
          continue;
        }
        await this.launchScanTask({ scan });
        if (this.reachedScanLimit()) {
          break;
        }
      } else if (scan.isGranular) {
        for (const organization of scan.organizations) {
          if (!(await shouldRunScan({ organization, scan }))) {
            continue;
          }
          await this.launchScanTask({ organization, scan });
          if (this.reachedScanLimit()) {
            break;
          }
        }
      } else {
        for (const organization of this.organizations) {
          if (!(await shouldRunScan({ organization, scan }))) {
            continue;
          }
          await this.launchScanTask({ organization, scan });
          if (this.reachedScanLimit()) {
            break;
          }
        }
      }
      if (this.numLaunchedTasks > 0) {
        scan.lastRun = new Date();
        await scan.save();
      }
      if (this.reachedScanLimit()) {
        console.warn(
          'Reached maximum scan concurrency: ',
          this.maxConcurrentTasks
        );
        break;
      }
    }
  }
}

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

  // If specified, limits scheduling to list of scans.
  scanIds?: string[];

  // If specified, limits scheduling to a particular organization
  // (includes global scans on all organizations as well)
  organizationId?: string;
}

export const handler: Handler<Event> = async (event) => {
  await connectToDatabase();
  console.log('Running scheduler...');

  const scanIds = event.scanIds || [];
  if (event.scanId) {
    scanIds.push(event.scanId);
  }
  const scans = await Scan.find({
    where: scanIds.length ? { id: In(scanIds) } : {},
    relations: ['organizations']
  });
  const organizations = await Organization.find(
    event.organizationId ? { id: event.organizationId } : {}
  );

  const scheduler = new Scheduler();
  await scheduler.initialize({ scans, organizations });
  await scheduler.run();
  console.log('Finished running scheduler.');
};
