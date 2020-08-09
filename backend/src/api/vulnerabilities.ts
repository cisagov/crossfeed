import {
  IsInt,
  IsPositive,
  IsString,
  IsIn,
  ValidateNested,
  isUUID,
  IsOptional,
  IsObject,
  IsNumber,
  IsUUID
} from 'class-validator';
import { Type } from 'class-transformer';
import { Vulnerability, connectToDatabase } from '../models';
import { validateBody, wrapHandler, NotFound } from './helpers';
import { SelectQueryBuilder, In } from 'typeorm';
import { getOrgMemberships, isGlobalViewAdmin } from './auth';

const PAGE_SIZE = parseInt(process.env.PAGE_SIZE ?? '') || 25;

class VulnerabilityFilters {
  @IsUUID()
  @IsOptional()
  id?: string;

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
  sort: string = 'createdAt';

  @IsString()
  @IsIn(['ASC', 'DESC'])
  order: 'ASC' | 'DESC' = 'DESC';

  @Type(() => VulnerabilityFilters)
  @ValidateNested()
  @IsObject()
  @IsOptional()
  filters?: VulnerabilityFilters;

  @IsInt()
  @IsOptional()
  // If set to -1, returns all results.
  pageSize?: number;

  filterResultQueryset(qs: SelectQueryBuilder<Vulnerability>) {
    if (this.filters?.id) {
      qs.andWhere('vulnerability.id = :id', {
        id: this.filters.id
      });
    }
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

  async getResults(event) {
    const pageSize = this.pageSize || PAGE_SIZE;
    let qs = Vulnerability.createQueryBuilder('vulnerability')
      .leftJoinAndSelect('vulnerability.domain', 'domain')
      .leftJoinAndSelect('domain.organization', 'organization')
      .orderBy(`vulnerability.${this.sort}`, this.order);

    if (pageSize !== -1) {
      qs = qs.skip(pageSize * (this.page - 1)).take(pageSize);
    }

    this.filterResultQueryset(qs);
    if (!isGlobalViewAdmin(event)) {
      qs.andWhere('organization.id IN (:...orgs)', {
        orgs: getOrgMemberships(event)
      });
    }
    return await qs.getManyAndCount();
  }
}

export const list = wrapHandler(async (event) => {
  await connectToDatabase();
  const search = await validateBody(VulnerabilitySearch, event.body);
  const [result, count] = await search.getResults(event);
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

  // Need to use QueryBuilder because typeorm doesn't support nested
  // relations filtering -- see https://github.com/typeorm/typeorm/issues/3890
  const search = new VulnerabilitySearch();
  search.filters = new VulnerabilityFilters();
  search.filters.id = id;
  const [result] = await search.getResults(event);

  return {
    statusCode: result.length ? 200 : 404,
    body: result.length ? JSON.stringify(result[0]) : ''
  };
});
