import {
  IsInt,
  IsPositive,
  IsString,
  IsIn,
  ValidateNested,
  isUUID,
  IsUUID,
  IsOptional,
  IsObject
} from 'class-validator';
import { Type } from 'class-transformer';
import { ScanTask, connectToDatabase } from '../models';
import { validateBody, wrapHandler, NotFound, Unauthorized } from './helpers';
import { SelectQueryBuilder } from 'typeorm';
import {
  getTagOrganizations,
  isGlobalViewAdmin,
  isGlobalWriteAdmin
} from './auth';
import ECSClient from '../tasks/ecs-client';

const PAGE_SIZE = parseInt(process.env.PAGE_SIZE ?? '') || 25;

class ScanTaskFilters {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsUUID()
  @IsOptional()
  organization?: string;

  @IsUUID()
  @IsOptional()
  tag?: string;
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

  async filterResultQueryset(qs: SelectQueryBuilder<ScanTask>, event) {
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
    if (this.filters?.organization) {
      qs.andWhere('organization.id = :org', {
        org: this.filters.organization
      });
    }
    if (this.filters?.tag) {
      qs.andWhere('organization.id IN (:...orgs)', {
        orgs: await getTagOrganizations(event, this.filters.tag)
      });
    }
    return qs;
  }

  async getResults(event) {
    const qs = ScanTask.createQueryBuilder('scan_task')
      .leftJoinAndSelect('scan_task.scan', 'scan')
      .leftJoinAndSelect('scan_task.organizations', 'organization')
      .orderBy(`scan_task.${this.sort}`, this.order)
      .skip(PAGE_SIZE * (this.page - 1))
      .take(PAGE_SIZE);

    await this.filterResultQueryset(qs, event);
    return qs.getManyAndCount();
  }
}

/**
 * @swagger
 *
 * /scan-tasks/search:
 *  post:
 *    description: List scantasks by specifying a filter.
 *    tags:
 *    - Scan Tasks
 */
export const list = wrapHandler(async (event) => {
  if (!isGlobalViewAdmin(event)) {
    return Unauthorized;
  }
  await connectToDatabase();
  const search = await validateBody(ScanTaskSearch, event.body);
  const [result, count] = await search.getResults(event);
  return {
    statusCode: 200,
    body: JSON.stringify({
      result,
      count
    })
  };
});

/**
 * @swagger
 *
 * /scan-tasks/{id}/kill:
 *  delete:
 *    description: Kill a particular scantask. Calling this endpoint does not kill the actual Fargate task, but just marks the task as "failed" in the database.
 *    parameters:
 *      - in: path
 *        name: id
 *        description: Scantask id
 *    tags:
 *    - Scan Tasks
 */
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
    scanTask.finishedAt = new Date();
    scanTask.output = 'Manually stopped at ' + new Date().toISOString();
    await ScanTask.save(scanTask);
  }
  return {
    statusCode: 200,
    body: JSON.stringify({})
  };
});

/**
 * @swagger
 *
 * /scan-tasks/{id}/logs:
 *  get:
 *    description: Retrieve logs from a particular scantask.
 *    parameters:
 *      - in: path
 *        name: id
 *        description: Scantask id
 *    tags:
 *    - Scan Tasks
 */
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
