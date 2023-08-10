import { handler as scheduler } from '../scheduler';
import {
  connectToDatabase,
  Scan,
  Organization,
  ScanTask,
  OrganizationTag
} from '../../models';

jest.mock('../ecs-client');
const { runCommand, getNumTasks } = require('../ecs-client');

describe('scheduler', () => {
  let connection;
  beforeAll(async () => {
    connection = await connectToDatabase();
  });
  afterAll(async () => {
    await connection.close();
  });
  test('should run a scan for the first time', async () => {
    let scan = await Scan.create({
      name: 'findomain',
      arguments: {},
      frequency: 999
    }).save();
    const organization = await Organization.create({
      name: 'test-' + Math.random(),
      rootDomains: ['test-' + Math.random()],
      ipBlocks: [],
      isPassive: false
    }).save();

    await scheduler(
      {
        scanId: scan.id,
        organizationIds: [organization.id]
      },
      {} as any,
      () => void 0
    );

    expect(runCommand).toHaveBeenCalledTimes(1);
    expect(runCommand).toHaveBeenCalledWith(
      expect.objectContaining({
        organizations: [
          {
            id: organization.id,
            name: organization.name
          }
        ],
        scanId: scan.id,
        scanName: scan.name
      })
    );

    const scanTask = await ScanTask.findOne(
      runCommand.mock.calls[0][0].scanTaskId
    );
    expect(scanTask?.status).toEqual('requested');
    expect(scanTask?.fargateTaskArn).toEqual('mock_task_arn');

    scan = (await Scan.findOne(scan.id))!;
    expect(scan.lastRun).toBeTruthy();
  });
  describe('scheduling', () => {
    test('should not run a scan when a scantask for that scan and organization is already in progress', async () => {
      let scan = await Scan.create({
        name: 'findomain',
        arguments: {},
        frequency: 999
      }).save();
      const organization = await Organization.create({
        name: 'test-' + Math.random(),
        rootDomains: ['test-' + Math.random()],
        ipBlocks: [],
        isPassive: false
      }).save();
      await ScanTask.create({
        organization,
        scan,
        type: 'fargate',
        status: 'created'
      }).save();

      await scheduler(
        {
          scanId: scan.id,
          organizationIds: [organization.id]
        },
        {} as any,
        () => void 0
      );

      expect(runCommand).toHaveBeenCalledTimes(0);
      scan = (await Scan.findOne(scan.id))!;
      expect(scan.lastRun).toBeFalsy();
    });
    test('should run a scan when a scantask for that scan and another organization is already in progress', async () => {
      const scan = await Scan.create({
        name: 'findomain',
        arguments: {},
        frequency: 999
      }).save();
      const organization = await Organization.create({
        name: 'test-' + Math.random(),
        rootDomains: ['test-' + Math.random()],
        ipBlocks: [],
        isPassive: false
      }).save();
      await ScanTask.create({
        organization: undefined,
        scan,
        type: 'fargate',
        status: 'created'
      }).save();

      await scheduler(
        {
          scanId: scan.id,
          organizationIds: [organization.id]
        },
        {} as any,
        () => void 0
      );

      expect(runCommand).toHaveBeenCalledTimes(1);
    });
    test('should not run a scan when a scantask for that scan and organization finished too recently', async () => {
      const scan = await Scan.create({
        name: 'findomain',
        arguments: {},
        frequency: 999
      }).save();
      const organization = await Organization.create({
        name: 'test-' + Math.random(),
        rootDomains: ['test-' + Math.random()],
        ipBlocks: [],
        isPassive: false
      }).save();
      await ScanTask.create({
        organization,
        scan,
        type: 'fargate',
        status: 'finished',
        finishedAt: new Date()
      }).save();

      await scheduler(
        {
          scanId: scan.id,
          organizationIds: [organization.id]
        },
        {} as any,
        () => void 0
      );

      expect(runCommand).toHaveBeenCalledTimes(0);
    });
    test('should not run a scan when a scantask for that scan and organization finished too recently, and a failed scan occurred afterwards that does not have a finishedAt column', async () => {
      const scan = await Scan.create({
        name: 'findomain',
        arguments: {},
        frequency: 999
      }).save();
      const organization = await Organization.create({
        name: 'test-' + Math.random(),
        rootDomains: ['test-' + Math.random()],
        ipBlocks: [],
        isPassive: false
      }).save();
      await ScanTask.create({
        organization,
        scan,
        type: 'fargate',
        status: 'finished',
        finishedAt: new Date()
      }).save();
      await ScanTask.create({
        organization,
        scan,
        type: 'fargate',
        status: 'failed',
        createdAt: new Date()
      }).save();

      await scheduler(
        {
          scanId: scan.id,
          organizationIds: [organization.id]
        },
        {} as any,
        () => void 0
      );

      expect(runCommand).toHaveBeenCalledTimes(0);
    });
    test('should not run a scan when a scantask for that scan and organization failed too recently', async () => {
      const scan = await Scan.create({
        name: 'findomain',
        arguments: {},
        frequency: 999
      }).save();
      const organization = await Organization.create({
        name: 'test-' + Math.random(),
        rootDomains: ['test-' + Math.random()],
        ipBlocks: [],
        isPassive: false
      }).save();
      await ScanTask.create({
        organization,
        scan,
        type: 'fargate',
        status: 'failed',
        finishedAt: new Date()
      }).save();

      await scheduler(
        {
          scanId: scan.id,
          organizationIds: [organization.id]
        },
        {} as any,
        () => void 0
      );

      expect(runCommand).toHaveBeenCalledTimes(0);
    });
    test('should not run a scan when scan is a SingleScan and has finished', async () => {
      const scan = await Scan.create({
        name: 'findomain',
        arguments: {},
        frequency: 999,
        isSingleScan: true,
        manualRunPending: false
      }).save();
      const organization = await Organization.create({
        name: 'test-' + Math.random(),
        rootDomains: ['test-' + Math.random()],
        ipBlocks: [],
        isPassive: false
      }).save();
      await ScanTask.create({
        organization,
        scan,
        type: 'fargate',
        status: 'finished',
        finishedAt: new Date()
      }).save();

      await scheduler(
        {
          scanId: scan.id,
          organizationIds: [organization.id]
        },
        {} as any,
        () => void 0
      );

      expect(runCommand).toHaveBeenCalledTimes(0);
    });
    test('should not run a scan when scan is a SingleScan and has not run yet', async () => {
      const scan = await Scan.create({
        name: 'findomain',
        arguments: {},
        frequency: 999,
        isSingleScan: true,
        manualRunPending: false
      }).save();
      const organization = await Organization.create({
        name: 'test-' + Math.random(),
        rootDomains: ['test-' + Math.random()],
        ipBlocks: [],
        isPassive: false
      }).save();

      await scheduler(
        {
          scanId: scan.id,
          organizationIds: [organization.id]
        },
        {} as any,
        () => void 0
      );

      expect(runCommand).toHaveBeenCalledTimes(1);
    });
    test('should always run a scan when scan has manualRunPending set to true', async () => {
      let scan = await Scan.create({
        name: 'findomain',
        arguments: {},
        frequency: 1,
        isSingleScan: true,
        manualRunPending: true
      }).save();
      const organization = await Organization.create({
        name: 'test-' + Math.random(),
        rootDomains: ['test-' + Math.random()],
        ipBlocks: [],
        isPassive: false
      }).save();
      await ScanTask.create({
        organization,
        scan,
        type: 'fargate',
        status: 'finished',
        finishedAt: new Date()
      }).save();

      await scheduler(
        {
          scanId: scan.id,
          organizationIds: [organization.id]
        },
        {} as any,
        () => void 0
      );

      expect(runCommand).toHaveBeenCalledTimes(1);

      // Ensure scheduler set manualRunPending back to false
      scan = (await Scan.findOne({ id: scan.id })) as Scan;
      expect(scan.manualRunPending).toEqual(false);
    });
    test('should run a scan when a scantask for that scan and organization finished and sufficient time has passed', async () => {
      const scan = await Scan.create({
        name: 'findomain',
        arguments: {},
        frequency: 100
      }).save();
      const organization = await Organization.create({
        name: 'test-' + Math.random(),
        rootDomains: ['test-' + Math.random()],
        ipBlocks: [],
        isPassive: false
      }).save();
      const finishedAt = new Date();
      finishedAt.setSeconds(finishedAt.getSeconds() - 101);
      await ScanTask.create({
        organization,
        scan,
        type: 'fargate',
        status: 'finished',
        finishedAt
      }).save();

      await scheduler(
        {
          scanId: scan.id,
          organizationIds: [organization.id]
        },
        {} as any,
        () => void 0
      );

      expect(runCommand).toHaveBeenCalledTimes(1);
    });
    test('should run a scan when a scantask for that scan and organization failed and sufficient time has passed', async () => {
      const scan = await Scan.create({
        name: 'findomain',
        arguments: {},
        frequency: 100
      }).save();
      const organization = await Organization.create({
        name: 'test-' + Math.random(),
        rootDomains: ['test-' + Math.random()],
        ipBlocks: [],
        isPassive: false
      }).save();
      const finishedAt = new Date();
      finishedAt.setSeconds(finishedAt.getSeconds() - 101);
      await ScanTask.create({
        organization,
        scan,
        type: 'fargate',
        status: 'failed',
        finishedAt
      }).save();

      await scheduler(
        {
          scanId: scan.id,
          organizationIds: [organization.id]
        },
        {} as any,
        () => void 0
      );

      expect(runCommand).toHaveBeenCalledTimes(1);
    });
  });
  describe('granular scans', () => {
    test('should run a granular scan only on associated organizations', async () => {
      const organization = await Organization.create({
        name: 'test-' + Math.random(),
        rootDomains: ['test-' + Math.random()],
        ipBlocks: [],
        isPassive: false
      }).save();
      const organization2 = await Organization.create({
        name: 'test-' + Math.random(),
        rootDomains: ['test-' + Math.random()],
        ipBlocks: [],
        isPassive: false
      }).save();
      const organization3 = await Organization.create({
        name: 'test-' + Math.random(),
        rootDomains: ['test-' + Math.random()],
        ipBlocks: [],
        isPassive: false
      }).save();
      const scan = await Scan.create({
        name: 'findomain',
        arguments: {},
        frequency: 999,
        isGranular: true,
        organizations: [organization, organization2]
      }).save();

      await scheduler(
        {
          scanId: scan.id
        },
        {} as any,
        () => void 0
      );

      expect(runCommand).toHaveBeenCalledTimes(2);
      expect(runCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          organizations: [{ id: organization.id, name: organization.name }],
          scanId: scan.id,
          scanName: scan.name
        })
      );
      expect(runCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          organizations: [{ id: organization2.id, name: organization2.name }],
          scanId: scan.id,
          scanName: scan.name
        })
      );

      let scanTask = await ScanTask.findOne(
        runCommand.mock.calls[0][0].scanTaskId
      );
      expect(scanTask?.status).toEqual('requested');

      scanTask = await ScanTask.findOne(runCommand.mock.calls[1][0].scanTaskId);
      expect(scanTask?.status).toEqual('requested');
    });
    test('should run a granular scan on associated tags', async () => {
      const tag1 = await OrganizationTag.create({
        name: 'test-' + Math.random()
      }).save();
      const tag2 = await OrganizationTag.create({
        name: 'test-' + Math.random()
      }).save();
      const organization = await Organization.create({
        name: 'test-' + Math.random(),
        rootDomains: ['test-' + Math.random()],
        ipBlocks: [],
        isPassive: false,
        tags: [tag1]
      }).save();
      const organization2 = await Organization.create({
        name: 'test-' + Math.random(),
        rootDomains: ['test-' + Math.random()],
        ipBlocks: [],
        isPassive: false,
        tags: [tag1]
      }).save();
      const organization3 = await Organization.create({
        name: 'test-' + Math.random(),
        rootDomains: ['test-' + Math.random()],
        ipBlocks: [],
        isPassive: false,
        tags: [tag2]
      }).save();
      const scan = await Scan.create({
        name: 'findomain',
        arguments: {},
        frequency: 999,
        isGranular: true,
        tags: [tag1]
      }).save();

      await scheduler(
        {
          scanId: scan.id
        },
        {} as any,
        () => void 0
      );

      expect(runCommand).toHaveBeenCalledTimes(2);
      expect(runCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          organizations: [{ id: organization.id, name: organization.name }],
          scanId: scan.id,
          scanName: scan.name
        })
      );
      expect(runCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          organizations: [{ id: organization2.id, name: organization2.name }],
          scanId: scan.id,
          scanName: scan.name
        })
      );

      let scanTask = await ScanTask.findOne(
        runCommand.mock.calls[0][0].scanTaskId
      );
      expect(scanTask?.status).toEqual('requested');

      scanTask = await ScanTask.findOne(runCommand.mock.calls[1][0].scanTaskId);
      expect(scanTask?.status).toEqual('requested');
    });
    test('should only run a scan once if an organization and its tag are both enabled', async () => {
      const tag1 = await OrganizationTag.create({
        name: 'test-' + Math.random()
      }).save();
      const tag2 = await OrganizationTag.create({
        name: 'test-' + Math.random()
      }).save();
      const organization = await Organization.create({
        name: 'test-' + Math.random(),
        rootDomains: ['test-' + Math.random()],
        ipBlocks: [],
        isPassive: false,
        tags: [tag1]
      }).save();
      const organization2 = await Organization.create({
        name: 'test-' + Math.random(),
        rootDomains: ['test-' + Math.random()],
        ipBlocks: [],
        isPassive: false,
        tags: [tag1]
      }).save();
      const organization3 = await Organization.create({
        name: 'test-' + Math.random(),
        rootDomains: ['test-' + Math.random()],
        ipBlocks: [],
        isPassive: false,
        tags: [tag2]
      }).save();
      const scan = await Scan.create({
        name: 'findomain',
        arguments: {},
        frequency: 999,
        isGranular: true,
        organizations: [organization, organization2],
        tags: [tag1]
      }).save();

      await scheduler(
        {
          scanId: scan.id
        },
        {} as any,
        () => void 0
      );

      expect(runCommand).toHaveBeenCalledTimes(2);
      expect(runCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          organizations: [{ id: organization.id, name: organization.name }],
          scanId: scan.id,
          scanName: scan.name
        })
      );
      expect(runCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          organizations: [{ id: organization2.id, name: organization2.name }],
          scanId: scan.id,
          scanName: scan.name
        })
      );

      let scanTask = await ScanTask.findOne(
        runCommand.mock.calls[0][0].scanTaskId
      );
      expect(scanTask?.status).toEqual('requested');

      scanTask = await ScanTask.findOne(runCommand.mock.calls[1][0].scanTaskId);
      expect(scanTask?.status).toEqual('requested');
    });
  });
  describe('global scans', () => {
    test('should run a global scan for the first time', async () => {
      jest.setTimeout(30000);
      const scan = await Scan.create({
        name: 'censysIpv4',
        arguments: {},
        frequency: 999
      }).save();

      await scheduler(
        {
          scanId: scan.id
        },
        {} as any,
        () => void 0
      );

      // Calls scan in chunks
      expect(runCommand).toHaveBeenCalledTimes(20);
      expect(runCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          organizations: [],
          scanId: scan.id,
          scanName: scan.name
        })
      );

      const scanTask = await ScanTask.findOne(
        runCommand.mock.calls[0][0].scanTaskId
      );
      expect(scanTask?.status).toEqual('requested');
      expect(scanTask?.organization).toBeUndefined();
    });
    test('should not run a global scan when a scantask for it is already in progress', async () => {
      const scan = await Scan.create({
        name: 'censysIpv4',
        arguments: {},
        frequency: 999
      }).save();
      await ScanTask.create({
        scan,
        type: 'fargate',
        status: 'created'
      }).save();

      await scheduler(
        {
          scanId: scan.id
        },
        {} as any,
        () => void 0
      );

      expect(runCommand).toHaveBeenCalledTimes(0);
    });
  });
  describe('concurrency', () => {
    afterAll(() => {
      getNumTasks.mockImplementation(() => 0);
    });
    test('should not run scan if max concurrency has already been reached', async () => {
      const scan = await Scan.create({
        name: 'findomain',
        arguments: {},
        frequency: 999
      }).save();
      const organization = await Organization.create({
        name: 'test-' + Math.random(),
        rootDomains: ['test-' + Math.random()],
        ipBlocks: [],
        isPassive: false
      }).save();

      getNumTasks.mockImplementation(() => 100);
      await scheduler(
        {
          scanId: scan.id,
          organizationIds: [organization.id]
        },
        {} as any,
        () => void 0
      );
      expect(runCommand).toHaveBeenCalledTimes(0);

      expect(
        await ScanTask.count({
          where: {
            scan,
            status: 'queued'
          }
        })
      ).toEqual(1);

      // Should not queue any additional scans.
      await scheduler(
        {
          scanId: scan.id,
          organizationIds: [organization.id]
        },
        {} as any,
        () => void 0
      );
      expect(runCommand).toHaveBeenCalledTimes(0);
      expect(
        await ScanTask.count({
          where: {
            scan,
            status: 'queued'
          }
        })
      ).toEqual(1);

      // Queue has opened up.
      getNumTasks.mockImplementation(() => 0);
      await scheduler(
        {
          scanId: scan.id,
          organizationIds: [organization.id]
        },
        {} as any,
        () => void 0
      );

      expect(runCommand).toHaveBeenCalledTimes(1);
    });

    test('should run only one, not two scans, if only one more scan remaining before max concurrency is reached', async () => {
      const scan = await Scan.create({
        name: 'findomain',
        arguments: {},
        frequency: 999
      }).save();
      const scan2 = await Scan.create({
        name: 'findomain',
        arguments: {},
        frequency: 999
      }).save();
      const organization = await Organization.create({
        name: 'test-' + Math.random(),
        rootDomains: ['test-' + Math.random()],
        ipBlocks: [],
        isPassive: false
      }).save();

      getNumTasks.mockImplementation(() => 99);
      await scheduler(
        {
          scanIds: [scan.id, scan2.id],
          organizationIds: [organization.id]
        },
        {} as any,
        () => void 0
      );
      expect(runCommand).toHaveBeenCalledTimes(1);

      expect(
        (await ScanTask.count({
          where: {
            scan,
            status: 'queued'
          }
        })) +
          (await ScanTask.count({
            where: {
              scan: scan2,
              status: 'queued'
            }
          }))
      ).toEqual(1);

      // Queue has opened up.
      getNumTasks.mockImplementation(() => 90);
      await scheduler(
        {
          scanIds: [scan.id, scan2.id],
          organizationIds: [organization.id]
        },
        {} as any,
        () => void 0
      );
      expect(runCommand).toHaveBeenCalledTimes(2);
    });

    test('should run part of a chunked (20) scan if less than 20 scans remaining before concurrency is reached, then run the rest of them only when concurrency opens back up', async () => {
      const scan = await Scan.create({
        name: 'censysIpv4',
        arguments: {},
        frequency: 999
      }).save();
      const organization = await Organization.create({
        name: 'test-' + Math.random(),
        rootDomains: ['test-' + Math.random()],
        ipBlocks: [],
        isPassive: false
      }).save();

      // Only 10/20 scantasks will run at first
      getNumTasks.mockImplementation(() => 90);
      await scheduler(
        {
          scanId: scan.id,
          organizationIds: [organization.id]
        },
        {} as any,
        () => void 0
      );
      expect(runCommand).toHaveBeenCalledTimes(10);

      expect(
        await ScanTask.count({
          where: {
            scan,
            status: 'queued'
          }
        })
      ).toEqual(10);

      // Should run the remaining 10 queued scantasks.
      getNumTasks.mockImplementation(() => 0);
      await scheduler(
        {
          scanId: scan.id,
          organizationIds: [organization.id]
        },
        {} as any,
        () => void 0
      );
      expect(runCommand).toHaveBeenCalledTimes(20);

      expect(
        await ScanTask.count({
          where: {
            scan,
            status: 'queued'
          }
        })
      ).toEqual(0);

      // No more scantasks remaining to be run.
      getNumTasks.mockImplementation(() => 0);
      await scheduler(
        {
          scanId: scan.id,
          organizationIds: [organization.id]
        },
        {} as any,
        () => void 0
      );
      expect(runCommand).toHaveBeenCalledTimes(20);
    });
  });
  test('should not run a global scan when a scantask for it is already in progress, even if scantasks have finished before / after it', async () => {
    const scan = await Scan.create({
      name: 'censysIpv4',
      arguments: {},
      frequency: 999
    }).save();
    await ScanTask.create({
      scan,
      type: 'fargate',
      status: 'finished',
      createdAt: '2000-08-03T13:58:31.634Z'
    }).save();
    await ScanTask.create({
      scan,
      type: 'fargate',
      status: 'created',
      createdAt: '2000-05-03T13:58:31.634Z'
    }).save();
    await ScanTask.create({
      scan,
      type: 'fargate',
      status: 'finished',
      createdAt: '2000-01-03T13:58:31.634Z'
    }).save();

    await scheduler(
      {
        scanId: scan.id
      },
      {} as any,
      () => void 0
    );

    expect(runCommand).toHaveBeenCalledTimes(0);
  });
  test('should not change lastRun time of the second scan if the first scan runs', async () => {
    // Make scan run before scan2. Scan2 should have already run, and doesn't need to run again.
    // The scheduler should not change scan2.lastRun during its second call
    const scan = await Scan.create({
      name: 'findomain',
      arguments: {},
      frequency: 1,
      lastRun: new Date(0)
    }).save();
    let scan2 = await Scan.create({
      name: 'findomain',
      arguments: {},
      frequency: 999,
      lastRun: new Date()
    }).save();
    const organization = await Organization.create({
      name: 'test-' + Math.random(),
      rootDomains: ['test-' + Math.random()],
      ipBlocks: [],
      isPassive: false
    }).save();

    // Run scheduler on scan2, this establishes a finished recent scantask for scan2
    await scheduler(
      {
        scanIds: [scan2.id],
        organizationIds: [organization.id]
      },
      {} as any,
      () => void 0
    );
    scan2 = (await Scan.findOne(scan2.id))!;
    expect(runCommand).toHaveBeenCalledTimes(1);

    // Run scheduler on both scans, scan should be run, but scan2 should be skipped
    await scheduler(
      {
        scanIds: [scan.id, scan2.id],
        organizationIds: [organization.id]
      },
      {} as any,
      () => void 0
    );
    expect(runCommand).toHaveBeenCalledTimes(2);

    const newscan2 = (await Scan.findOne(scan2.id))!;

    // Expect scan2's lastRun was not edited during the second call to scheduler
    expect(newscan2.lastRun).toEqual(scan2.lastRun);
  });
  describe('org batching', () => {
    test('should run one scantask per org by default', async () => {
      const scan = await Scan.create({
        name: 'findomain',
        arguments: {},
        frequency: 999
      }).save();
      const organization = await Organization.create({
        name: 'test-' + Math.random(),
        rootDomains: ['test-' + Math.random()],
        ipBlocks: [],
        isPassive: false
      }).save();
      const organization2 = await Organization.create({
        name: 'test-' + Math.random(),
        rootDomains: ['test-' + Math.random()],
        ipBlocks: [],
        isPassive: false
      }).save();
      const organization3 = await Organization.create({
        name: 'test-' + Math.random(),
        rootDomains: ['test-' + Math.random()],
        ipBlocks: [],
        isPassive: false
      }).save();

      await scheduler(
        {
          scanId: scan.id,
          organizationIds: [organization.id, organization2.id, organization3.id]
        },
        {} as any,
        () => void 0
      );

      expect(runCommand).toHaveBeenCalledTimes(3);
      expect(runCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          organizations: [
            {
              id: organization.id,
              name: organization.name
            }
          ],
          scanId: scan.id,
          scanName: scan.name
        })
      );
      expect(runCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          organizations: [
            {
              id: organization2.id,
              name: organization2.name
            }
          ],
          scanId: scan.id,
          scanName: scan.name
        })
      );
      expect(runCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          organizations: [
            {
              id: organization3.id,
              name: organization3.name
            }
          ],
          scanId: scan.id,
          scanName: scan.name
        })
      );
    });

    test('should batch two orgs per scantask when specified', async () => {
      const scan = await Scan.create({
        name: 'findomain',
        arguments: {},
        frequency: 999
      }).save();
      const organization = await Organization.create({
        name: 'test-' + Math.random(),
        rootDomains: ['test-' + Math.random()],
        ipBlocks: [],
        isPassive: false
      }).save();
      const organization2 = await Organization.create({
        name: 'test-' + Math.random(),
        rootDomains: ['test-' + Math.random()],
        ipBlocks: [],
        isPassive: false
      }).save();
      const organization3 = await Organization.create({
        name: 'test-' + Math.random(),
        rootDomains: ['test-' + Math.random()],
        ipBlocks: [],
        isPassive: false
      }).save();

      await scheduler(
        {
          scanId: scan.id,
          organizationIds: [
            organization.id,
            organization2.id,
            organization3.id
          ],
          orgsPerScanTask: 2
        },
        {} as any,
        () => void 0
      );

      expect(runCommand).toHaveBeenCalledTimes(2);
      expect(runCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          organizations: [
            {
              id: organization.id,
              name: organization.name
            },
            {
              id: organization2.id,
              name: organization2.name
            }
          ],
          scanId: scan.id,
          scanName: scan.name
        })
      );
      expect(runCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          organizations: [
            {
              id: organization3.id,
              name: organization3.name
            }
          ],
          scanId: scan.id,
          scanName: scan.name
        })
      );
    });
  });
});
