import {
  IsInt,
  IsPositive,
  IsString,
  IsIn,
  ValidateNested,
  isUUID,
  IsOptional,
  IsObject,
  IsNumber
} from 'class-validator';
import { Type } from 'class-transformer';
import { Vulnerability, connectToDatabase } from '../models';
import { validateBody, wrapHandler, NotFound } from './helpers';
import { SelectQueryBuilder } from 'typeorm';

const PAGE_SIZE = parseInt(process.env.PAGE_SIZE ?? '') || 25;

class VulnerabilityFilters {
  @IsString()
  @IsOptional()
  title?: string;

  @IsNumber()
  @IsOptional()
  cvssLowerBound?: number;

  @IsNumber()
  @IsOptional()
  cvssUpperBound?: number;

  @IsString()
  @IsOptional()
  state?: string;
}

class VulnerabilitySearch {
  @IsInt()
  @IsPositive()
  page: number = 1;

  @IsString()
  @IsIn(['title', 'createdAt', 'cvss', 'state'])
  @IsOptional()
  sort: string = 'name';

  @IsString()
  @IsIn(['ASC', 'DESC'])
  order: 'ASC' | 'DESC' = 'DESC';

  @Type(() => VulnerabilityFilters)
  @ValidateNested()
  @IsObject()
  @IsOptional()
  filters?: VulnerabilityFilters;

  filterResultQueryset(qs: SelectQueryBuilder<Vulnerability>) {
    if (this.filters?.title) {
      qs.andWhere('vulnerability.title ILIKE :title', {
        title: `%${this.filters.title}%`
      });
    }
    if (this.filters?.cvssLowerBound) {
      qs.andWhere('vulnerability.cvss>=:cvssLowerBound', {
        cvssLowerBound: this.filters.cvssLowerBound
      });
    }
    if (this.filters?.cvssUpperBound) {
      qs.andWhere('vulnerability.cvss<=:cvssUpperBound', {
        cvssUpperBound: this.filters.cvssUpperBound
      });
    }
    if (this.filters?.state) {
      qs.andWhere('vulnerability.state=:state', {
        state: this.filters.state
      });
    }
    return qs;
  }

  async getResults() {
    const qs = Vulnerability.createQueryBuilder('vulnerability')
      .leftJoinAndSelect('vulnerability.domain', 'domain')
      .orderBy(`vulnerability.${this.sort}`, this.order)
      .skip(PAGE_SIZE * (this.page - 1))
      .take(PAGE_SIZE);

    this.filterResultQueryset(qs);
    return await qs.getManyAndCount();
  }
}

export const list = wrapHandler(async (event) => {
  await connectToDatabase();
  const search = await validateBody(VulnerabilitySearch, event.body);
  const [result, count] = await search.getResults();
  return {
    statusCode: 200,
    body: JSON.stringify({
      result,
      count
    })
  };
});

export const get = wrapHandler(async (event) => {
  await connectToDatabase();
  const id = event.pathParameters?.vulnerabilityId;
  if (!isUUID(id)) {
    return NotFound;
  }

  const result = await Vulnerability.findOne(id);

  return {
    statusCode: result ? 200 : 404,
    body: result ? JSON.stringify(result) : ''
  };
});
