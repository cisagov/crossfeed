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
import { plainToClass, Type } from 'class-transformer';
import { Vulnerability, connectToDatabase, User } from '../models';
import { validateBody, wrapHandler, NotFound } from './helpers';
import { SelectQueryBuilder, In } from 'typeorm';
import {
  getOrgMemberships,
  isGlobalViewAdmin,
  isGlobalWriteAdmin
} from './auth';
import S3Client from '../tasks/s3-client';
import * as Papa from 'papaparse';

const PAGE_SIZE = parseInt(process.env.PAGE_SIZE ?? '') || 25;

class VulnerabilityFilters {
  @IsUUID()
  @IsOptional()
  id?: string;

  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  domain?: string;

  @IsString()
  @IsOptional()
  severity?: string;

  @IsString()
  @IsOptional()
  cpe?: string;

  @IsString()
  @IsOptional()
  state?: string;

  @IsString()
  @IsOptional()
  substate?: string;

  @IsUUID()
  @IsOptional()
  organization?: string;
}

class VulnerabilitySearch {
  @IsInt()
  @IsPositive()
  page: number = 1;

  @IsString()
  @IsIn([
    'title',
    'createdAt',
    'severity',
    'cvss',
    'state',
    'createdAt',
    'domain'
  ])
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
    if (this.filters?.domain) {
      qs.andWhere('domain.name ILIKE :name', {
        name: `%${this.filters.domain}%`
      });
    }
    if (this.filters?.severity) {
      qs.andWhere('vulnerability.severity=:severity', {
        severity: this.filters.severity
      });
    }
    if (this.filters?.cpe) {
      qs.andWhere('vulnerability.cpe ILIKE :cpe', {
        cpe: `%${this.filters.cpe}%`
      });
    }
    if (this.filters?.state) {
      qs.andWhere('vulnerability.state=:state', {
        state: this.filters.state
      });
    }
    if (this.filters?.substate) {
      qs.andWhere('vulnerability.substate=:substate', {
        substate: this.filters.substate
      });
    }
    if (this.filters?.organization) {
      qs.andWhere('organization.id = :org', {
        org: this.filters.organization
      });
    }
    return qs;
  }

  async getResults(event) {
    const pageSize = this.pageSize || PAGE_SIZE;
    const sort =
      this.sort === 'domain'
        ? 'domain.name'
        : this.sort === 'severity'
        ? 'vulnerability.cvss'
        : `vulnerability.${this.sort}`;
    let qs = Vulnerability.createQueryBuilder('vulnerability')
      .leftJoinAndSelect('vulnerability.domain', 'domain')
      .leftJoinAndSelect('domain.organization', 'organization')
      .leftJoinAndSelect('vulnerability.service', 'service')
      .orderBy(sort, this.order);

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

export const update = wrapHandler(async (event) => {
  await connectToDatabase();
  const id = event.pathParameters?.vulnerabilityId;
  if (!isUUID(id) || !event.body) {
    return NotFound;
  }
  const vuln = await Vulnerability.findOne(
    { id },
    { relations: ['domain', 'domain.organization'] }
  );
  let isAuthorized = false;
  if (vuln && vuln.domain.organization && vuln.domain.organization.id) {
    isAuthorized =
      isGlobalWriteAdmin(event) ||
      getOrgMemberships(event).includes(vuln.domain.organization.id);
  }
  if (vuln && isAuthorized) {
    const body = JSON.parse(event.body);
    const user = await User.findOne({
      id: event.requestContext.authorizer!.id
    });
    if (body.substate) {
      vuln.setState(body.substate, false, user ? user : null);
    }
    if (body.notes) vuln.notes = body.notes;
    if (body.comment) {
      vuln.actions.unshift({
        type: 'comment',
        automatic: false,
        userId: user ? user.id : null,
        userName: user ? user.fullName : null,
        date: new Date(),
        value: body.comment
      });
    }
    vuln.save();

    return {
      statusCode: 200,
      body: JSON.stringify(vuln)
    };
  }
  return {
    statusCode: 404,
    body: ''
  };
});

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

export const export_ = wrapHandler(async (event) => {
  await connectToDatabase();
  const search = await validateBody(VulnerabilitySearch, event.body);
  const [result, count] = await search.getResults(event);
  const client = new S3Client();
  const url = await client.saveCSV(
    Papa.unparse({
      fields: [
        'organization',
        'domain',
        'title',
        'description',
        'cve',
        'cwe',
        'cpe',
        'description',
        'cvss',
        'severity',
        'state',
        'substate',
        'lastSeen',
        'createdAt',
        'id'
      ],
      data: result.map((e) => ({
        ...e,
        organization: e.domain?.organization?.name,
        domain: e.domain?.name
      }))
    }),
    'vulnerabilities'
  );

  return {
    statusCode: 200,
    body: JSON.stringify({
      url
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
