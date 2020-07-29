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
import { SelectQueryBuilder, In } from 'typeorm';
import { isGlobalViewAdmin, getOrgMemberships } from './auth';

const PAGE_SIZE = parseInt(process.env.PAGE_SIZE ?? '') || 25;

class ScanTaskFilters {
  @IsString()
  @IsOptional()
  name?: string;
}

class ScanTaskSearch {
  @IsInt()
  @IsPositive()
  page: number = 1;

  @IsString()
  @IsIn(['name'])
  sort: string = 'name';

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
        name: `%${this.filters?.name}%`
      });
    }
    return qs;
  }

  async getResults(event) {
    const qs = ScanTask.createQueryBuilder('scan_task')
      .leftJoinAndSelect('scan_task.scan', 'scan')
      .skip(PAGE_SIZE * (this.page - 1))
      .take(PAGE_SIZE);

    this.filterResultQueryset(qs);
    return await qs.getMany();
  }

  filterCountQueryset(qs: SelectQueryBuilder<ScanTask>) {
    if (this.filters?.name) {
      qs.andWhere('scan.name ILIKE :name', {
        name: `%${this.filters?.name}%`
      });
    }
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
