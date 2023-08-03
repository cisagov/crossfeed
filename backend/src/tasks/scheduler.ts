import { Handler } from 'aws-lambda';
import { connectToDatabase, Scan, Organization, ScanTask } from '../models';
import ECSClient from './ecs-client';
import { SCAN_SCHEMA } from '../api/scans';
import { In, IsNull, Not } from 'typeorm';
import getScanOrganizations from './helpers/getScanOrganizations';
import { chunk } from 'lodash';

class Scheduler {
  ecs: ECSClient;
  numExistingTasks: number;
  numLaunchedTasks: number;
  maxConcurrentTasks: number;
  scans: Scan[];
  organizations: Organization[];
  queuedScanTasks: ScanTask[];
  orgsPerScanTask: number;

  constructor() {}

  async initialize({
    scans,
    organizations,
    queuedScanTasks,
    orgsPerScanTask
  }: {
    scans: Scan[];
    organizations: Organization[];
    queuedScanTasks: ScanTask[];
    orgsPerScanTask: number;
  }) {
    this.scans = scans;
    this.organizations = organizations;
    this.queuedScanTasks = queuedScanTasks;
    this.ecs = new ECSClient();
    this.numExistingTasks = await this.ecs.getNumTasks();
    this.numLaunchedTasks = 0;
    this.maxConcurrentTasks = Number(process.env.FARGATE_MAX_CONCURRENCY!);
    this.orgsPerScanTask = orgsPerScanTask;

    console.log('Number of running Fargate tasks: ', this.numExistingTasks);
    console.log('Number of queued scan tasks: ', this.queuedScanTasks.length);
  }

  launchSingleScanTask = async ({
    organizations = [],
    scan,
    chunkNumber,
    numChunks,
    scanTask
  }: {
    organizations?: Organization[];
    scan: Scan;
    chunkNumber?: number;
    numChunks?: number;
    scanTask?: ScanTask;
  }) => {
    const { type, global } = SCAN_SCHEMA[scan.name];

    const ecsClient = new ECSClient();
    scanTask =
      scanTask ??
      (await ScanTask.create({
        organizations: global ? [] : organizations,
        scan,
        type,
        status: 'created'
      }).save());

    const commandOptions = scanTask.input
      ? JSON.parse(scanTask.input)
      : {
          organizations: organizations.map((e) => ({ name: e.name, id: e.id })),
          scanId: scan.id,
          scanName: scan.name,
          scanTaskId: scanTask.id,
          numChunks,
          chunkNumber,
          isSingleScan: scan.isSingleScan
        };

    scanTask.input = JSON.stringify(commandOptions);

    if (this.reachedScanLimit()) {
      scanTask.status = 'queued';
      if (!scanTask.queuedAt) {
        scanTask.queuedAt = new Date();
      }
      console.log(
        'Reached maximum concurrency, queueing scantask',
        scanTask.id
      );
      await scanTask.save();
      return;
    }

    try {
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
            `Successfully invoked ${scan.name} scan with fargate on ${organizations.length} organizations, with ECS task ARN ${taskArn}` +
              (commandOptions.numChunks
                ? `, Chunk ${commandOptions.chunkNumber}/${commandOptions.numChunks}`
                : '')
          );
        }
      } else {
        throw new Error('Invalid type ' + type);
      }
      scanTask.status = 'requested';
      scanTask.requestedAt = new Date();
      this.numLaunchedTasks++;
    } catch (error) {
      console.error(`Error invoking ${scan.name} scan.`);
      console.error(error);
      scanTask.output = JSON.stringify(error);
      scanTask.status = 'failed';
      scanTask.finishedAt = new Date();
    }
    await scanTask.save();
  };

  launchScanTask = async ({
    organizations = [],
    scan
  }: {
    organizations?: Organization[];
    scan: Scan;
  }) => {
    let { numChunks } = SCAN_SCHEMA[scan.name];
    if (numChunks) {
      if (typeof jest === 'undefined' && process.env.IS_LOCAL) {
        // For running server on localhost -- doesn't apply in jest tests, though.
        numChunks = 1;
      }
      // Sanitizes numChunks to protect against arbitrarily large numbers
      numChunks = numChunks > 100 ? 100 : numChunks;
      for (let chunkNumber = 0; chunkNumber < numChunks; chunkNumber++) {
        await this.launchSingleScanTask({
          organizations,
          scan,
          chunkNumber,
          numChunks: numChunks
        });
      }
    } else {
      await this.launchSingleScanTask({ organizations, scan });
    }
  };

  reachedScanLimit() {
    return (
      this.numExistingTasks + this.numLaunchedTasks >= this.maxConcurrentTasks
    );
  }

  async run() {
    for (const scan of this.scans) {
      const prev_numLaunchedTasks = this.numLaunchedTasks;

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
      } else {
        const organizations = scan.isGranular
          ? getScanOrganizations(scan)
          : this.organizations;
        const orgsToLaunch: Organization[] = [];
        for (const organization of organizations) {
          if (!(await shouldRunScan({ organization, scan }))) {
            continue;
          }
          orgsToLaunch.push(organization);
        }
        // Split the organizations in orgsToLaunch into chunks of size
        // this.orgsPerScanTask, then launch organizations for each one.
        for (const orgs of chunk(orgsToLaunch, this.orgsPerScanTask)) {
          await this.launchScanTask({ organizations: orgs, scan });
        }
      }
      console.log(
        'Launched',
        this.numLaunchedTasks,
        'scanTasks for scan',
        scan.name
      );
      // If at least 1 new scan task was launched for this scan, update the scan
      if (this.numLaunchedTasks > prev_numLaunchedTasks) {
        scan.lastRun = new Date();
        scan.manualRunPending = false;
        await scan.save();
      }
    }
  }

  async runQueued() {
    for (const scanTask of this.queuedScanTasks) {
      await this.launchSingleScanTask({ scanTask, scan: scanTask.scan });
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
  if (organization?.isPassive && !isPassive) {
    // Don't run non-passive scans on passive organizations.
    return false;
  }
  if (scan.manualRunPending) {
    // Always run these scans.
    return true;
  }
  const filterQuery = (qs) => {
    /**
     * Perform a filter to find a matching ScanTask that ran on the current org.
     * The first filter checks for ScanTasks with the "organization" property set to the current org,
     * and the second filter checks for ScanTasks that are assigned to multiple orgnaizations.
     */
    if (global) {
      return qs;
    } else {
      return qs.andWhere(
        '(scan_task."organizationId" = :org OR organizations.id = :org)',
        {
          org: organization?.id
        }
      );
    }
  };
  const lastRunningScanTask = await filterQuery(
    ScanTask.createQueryBuilder('scan_task')
      .leftJoinAndSelect('scan_task.organizations', 'organizations')
      .where('scan_task."scanId" = :id', { id: scan.id })
      .andWhere('scan_task.status IN (:...statuses)', {
        statuses: ['created', 'queued', 'requested', 'started']
      })
      .groupBy('scan_task.id,organizations.id')
      .orderBy('scan_task."createdAt"', 'DESC')
  ).getOne();

  if (lastRunningScanTask) {
    // Don't run another task if there's already a running or queued task.
    return false;
  }
  const lastFinishedScanTask = await filterQuery(
    ScanTask.createQueryBuilder('scan_task')
      .leftJoinAndSelect('scan_task.organizations', 'organizations')
      .andWhere('scan_task."scanId" = :id', { id: scan.id })
      .andWhere('scan_task.status IN (:...statuses)', {
        statuses: ['finished', 'failed']
      })
      .andWhere('scan_task."finishedAt" IS NOT NULL')
      .groupBy('scan_task.id,organizations.id')
      .orderBy('scan_task."finishedAt"', 'DESC')
  ).getOne();

  if (
    lastFinishedScanTask &&
    lastFinishedScanTask.finishedAt &&
    lastFinishedScanTask.finishedAt.getTime() >=
      new Date().getTime() - 1000 * scan.frequency
  ) {
    return false;
  }
  if (
    lastFinishedScanTask &&
    lastFinishedScanTask.finishedAt &&
    scan.isSingleScan
  ) {
    // Should not run a scan if the scan is a singleScan
    // and has already run once before.
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

  // If specified, limits scheduling to list of organizations
  // (includes global scans on all organizations as well).
  organizationIds?: string[];

  // Number of organizations that should be batched into each ScanTask.
  // Increase this number when there are many organizations, in order to batch
  // many organizations into a smaller number of ScanTasks, rather than having
  // to have one ScanTask per organization.
  // Defaults to process.env.SCHEDULER_ORGS_PER_SCANTASK or 1.
  orgsPerScanTask?: number;
}

export const handler: Handler<Event> = async (event) => {
  await connectToDatabase();
  console.log('Running scheduler...');

  const scanIds = event.scanIds || [];
  if (event.scanId) {
    scanIds.push(event.scanId);
  }
  const scanWhere = scanIds.length ? { id: In(scanIds) } : {};
  const orgWhere = event.organizationIds?.length
    ? { id: In(event.organizationIds) }
    : {};
  const scans = await Scan.find({
    where: scanWhere,
    relations: ['organizations', 'tags', 'tags.organizations']
  });
  const organizations = await Organization.find({
    where: orgWhere
  });

  const queuedScanTasks = await ScanTask.find({
    where: {
      scan: scanWhere,
      status: 'queued'
    },
    order: {
      queuedAt: 'ASC'
    },
    relations: ['scan']
  });

  const scheduler = new Scheduler();
  await scheduler.initialize({
    scans,
    organizations,
    queuedScanTasks,
    orgsPerScanTask:
      event.orgsPerScanTask ||
      parseInt(process.env.SCHEDULER_ORGS_PER_SCANTASK || '') ||
      1
  });
  await scheduler.runQueued();
  await scheduler.run();
  console.log('Finished running scheduler.');
};
