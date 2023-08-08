import sanitizeChunking from '../../helpers/sanitizeChunking';
import { CommandOptions } from '../../ecs-client';
import { connectToDatabase, Organization, Scan } from '../../../models';
import * as nock from 'nock';

const RealDate = Date;

jest.setTimeout(30000);

describe('sanitize chunking', () => {
  let organization;
  let scan;
  let connection;
  beforeEach(async () => {
    connection = await connectToDatabase();
    global.Date.now = jest.fn(() => new Date('2023-08-08T00:00:00Z').getTime());
    organization = await Organization.create({
      name: 'test-' + Math.random(),
      rootDomains: ['test-' + Math.random()],
      ipBlocks: [],
      isPassive: false
    }).save();
    scan = await Scan.create({
      name: 'testScan',
      arguments: {},
      frequency: 999
    }).save();
  });
  afterEach(async () => {
    global.Date = RealDate;
    await connection.close();
  });
  afterAll(async () => {
    nock.cleanAll();
  });
  test('basic test', async () => {
    const commandOptions: CommandOptions = {
      organizationId: organization.id,
      scanName: 'scanName',
      scanId: scan.id,
      scanTaskId: 'scanTaskId',
      chunkNumber: 0,
      numChunks: 100
    };
    const sanitizedOptions = await sanitizeChunking(commandOptions);
    expect(sanitizedOptions).toEqual(commandOptions);
  });
  test('numChunks must be defined', async () => {
    const commandOptions: CommandOptions = {
      organizationId: organization.id,
      scanName: 'scanName',
      scanId: scan.id,
      scanTaskId: 'scanTaskId',
      chunkNumber: 0
    };
    await expect(sanitizeChunking(commandOptions)).rejects.toThrow(
      'Chunks not specified.'
    );
  });
  test('numChunks is capped at 100', async () => {
    const commandOptions: CommandOptions = {
      organizationId: organization.id,
      scanName: 'scanName',
      scanId: scan.id,
      scanTaskId: 'scanTaskId',
      chunkNumber: 0,
      numChunks: 101
    };
    const sanitizedOptions = await sanitizeChunking(commandOptions);
    expect(sanitizedOptions.numChunks).toEqual(100);
  });
  test('chunkNumber must be defined', async () => {
    const commandOptions: CommandOptions = {
      organizationId: organization.id,
      scanName: 'scanName',
      scanId: scan.id,
      scanTaskId: 'scanTaskId',
      numChunks: 1
    };
    await expect(sanitizeChunking(commandOptions)).rejects.toThrow(
      'Chunks not specified.'
    );
  });
  test('chunkNumber must be less than numChunks', async () => {
    const commandOptions: CommandOptions = {
      organizationId: organization.id,
      scanName: 'scanName',
      scanId: scan.id,
      scanTaskId: 'scanTaskId',
      chunkNumber: 1,
      numChunks: 1
    };
    await expect(sanitizeChunking(commandOptions)).rejects.toThrow(
      'Invalid chunk number.'
    );
  });
  test('chunkNumber must be less than 100', async () => {
    const commandOptions: CommandOptions = {
      organizationId: organization.id,
      scanName: 'scanName',
      scanId: scan.id,
      scanTaskId: 'scanTaskId',
      chunkNumber: 100,
      numChunks: 100
    };
    await expect(sanitizeChunking(commandOptions)).rejects.toThrow(
      'Invalid chunk number.'
    );
  });
});
