import { handler as scheduler } from '../scheduler';
import { connectToDatabase, Scan, Organization, ScanTask } from '../../models';

jest.mock('../ecs-client');
const { runCommand } = require('../ecs-client');

describe('scheduler', () => {
  beforeAll(async () => {
    await connectToDatabase();
  });
  test('should run a scan for the first time', async () => {
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
  });
  test('should not run a scan when a scantask for that scan and organization is already in progress', async () => {
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
