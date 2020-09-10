import { handler as scheduler } from '../scheduler';
import { connectToDatabase, Scan, Organization, ScanTask } from '../../models';

jest.mock('../ecs-client');
const { runCommand, getNumTasks } = require('../ecs-client');

describe('scheduler', () => {
  beforeAll(async () => {
    await connectToDatabase();
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
        organizationId: organization.id
      },
      {} as any,
      () => void 0
    );

    expect(runCommand).toHaveBeenCalledTimes(1);
    expect(runCommand).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: organization.id,
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
          organizationId: organization.id
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
          organizationId: organization.id
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
          organizationId: organization.id
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
          organizationId: organization.id
        },
        {} as any,
        () => void 0
      );

      expect(runCommand).toHaveBeenCalledTimes(0);
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
          organizationId: organization.id
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
          organizationId: organization.id
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
          organizationId: organization.id,
          scanId: scan.id,
          scanName: scan.name
        })
      );
      expect(runCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: organization2.id,
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
          organizationId: undefined,
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
          organizationId: organization.id
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
          organizationId: organization.id
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
          organizationId: organization.id
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
          organizationId: organization.id
        },
        {} as any,
        () => void 0
      );
      expect(runCommand).toHaveBeenCalledTimes(1);

      expect(
        await ScanTask.count({
          where: {
            scan: scan2,
            status: 'queued'
          }
        })
      ).toEqual(1);

      // Queue has opened up.
      getNumTasks.mockImplementation(() => 90);
      await scheduler(
        {
          scanIds: [scan.id, scan2.id],
          organizationId: organization.id
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
          organizationId: organization.id
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
          organizationId: organization.id
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
          organizationId: organization.id
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
});
