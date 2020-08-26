import {
  IsInt,
  IsPositive,
  IsString,
  IsIn,
  ValidateNested,
  isUUID,
  IsOptional,
  IsObject
} from 'class-validator';
import { Type } from 'class-transformer';
import { ScanTask, connectToDatabase } from '../models';
import { validateBody, wrapHandler, NotFound, Unauthorized } from './helpers';
import { SelectQueryBuilder } from 'typeorm';
import { isGlobalViewAdmin, isGlobalWriteAdmin } from './auth';
import ECSClient from '../tasks/ecs-client';

const PAGE_SIZE = parseInt(process.env.PAGE_SIZE ?? '') || 25;

class ScanTaskFilters {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  status?: string;
}

class ScanTaskSearch {
  @IsInt()
  @IsPositive()
  page: number = 1;

  @IsString()
  @IsIn(['createdAt', 'finishedAt'])
  sort: string = 'createdAt';

  @IsString()
  @IsIn(['ASC', 'DESC'])
  order: 'ASC' | 'DESC' = 'DESC';

  @Type(() => ScanTaskFilters)
  @ValidateNested()
  @IsObject()
  @IsOptional()
  filters?: ScanTaskFilters;

  filterResultQueryset(qs: SelectQueryBuilder<ScanTask>) {
    if (this.filters?.name) {
      qs.andWhere('scan.name ILIKE :name', {
        name: `${this.filters?.name}`
      });
    }
    if (this.filters?.status) {
      qs.andWhere('scan_task.status ILIKE :status', {
        status: `${this.filters?.status}`
      });
    }
    return qs;
  }

  async getResults(event) {
    const qs = ScanTask.createQueryBuilder('scan_task')
      .leftJoinAndSelect('scan_task.scan', 'scan')
      .orderBy(`scan_task.${this.sort}`, this.order)
      .skip(PAGE_SIZE * (this.page - 1))
      .take(PAGE_SIZE);

    this.filterResultQueryset(qs);
    return await qs.getMany();
  }

  filterCountQueryset(qs: SelectQueryBuilder<ScanTask>) {
    return this.filterResultQueryset(qs);
  }

  async getCount(event) {
    const qs = ScanTask.createQueryBuilder('scan_task').leftJoinAndSelect(
      'scan_task.scan',
      'scan'
    );
    this.filterCountQueryset(qs);
    return await qs.getCount();
  }
}

export const list = wrapHandler(async (event) => {
  if (!isGlobalViewAdmin(event)) {
    return Unauthorized;
  }
  await connectToDatabase();
  const search = await validateBody(ScanTaskSearch, event.body);
  const [result, count] = await Promise.all([
    search.getResults(event),
    search.getCount(event)
  ]);
  return {
    statusCode: 200,
    body: JSON.stringify({
      result,
      count
    })
  };
});

export const kill = wrapHandler(async (event) => {
  if (!isGlobalWriteAdmin(event)) {
    return Unauthorized;
  }
  const id = event.pathParameters?.scanTaskId;

  if (!id || !isUUID(id)) {
    return NotFound;
  }
  await connectToDatabase();
  const scanTask = await ScanTask.findOne(id);
  if (!scanTask) {
    return NotFound;
  }
  if (scanTask.status === 'failed' || scanTask.status === 'finished') {
    return {
      statusCode: 400,
      body: 'ScanTask has already finished.'
    };
  }
  if (scanTask) {
    scanTask.status = 'failed';
    scanTask.output = 'Manually stopped at ' + new Date().toISOString();
    await ScanTask.save(scanTask);
  }
  return {
    statusCode: 200,
    body: JSON.stringify({})
  };
});

export const logs = wrapHandler(async (event) => {
  if (!isGlobalViewAdmin(event)) {
    return Unauthorized;
  }
  const id = event.pathParameters?.scanTaskId;

  if (!id || !isUUID(id)) {
    return NotFound;
  }
  await connectToDatabase();
  const scanTask = await ScanTask.findOne(id);
  if (!scanTask || !scanTask.fargateTaskArn) {
    return NotFound;
  }
  const ecsClient = await new ECSClient();
  const logs = await ecsClient.getLogs(scanTask.fargateTaskArn);
  return {
    statusCode: 200,
    body: logs || ''
  };
});
