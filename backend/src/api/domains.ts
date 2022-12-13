import {
  IsInt,
  IsPositive,
  IsString,
  IsIn,
  ValidateNested,
  isUUID,
  IsOptional,
  IsObject,
  IsUUID
} from 'class-validator';
import { Type } from 'class-transformer';
import { Domain, connectToDatabase } from '../models';
import { validateBody, wrapHandler, NotFound } from './helpers';
import { SelectQueryBuilder, In } from 'typeorm';
import {
  isGlobalViewAdmin,
  getOrgMemberships,
  getTagOrganizations
} from './auth';
import S3Client from '../tasks/s3-client';
import * as Papa from 'papaparse';

const PAGE_SIZE = parseInt(process.env.PAGE_SIZE ?? '') || 25;

class DomainFilters {
  @IsString()
  @IsOptional()
  port?: string;

  @IsString()
  @IsOptional()
  service?: string;

  @IsString()
  @IsOptional()
  reverseName?: string;

  @IsString()
  @IsOptional()
  ip?: string;

  @IsUUID()
  @IsOptional()
  organization?: string;

  @IsString()
  @IsOptional()
  organizationName?: string;

  @IsString()
  @IsOptional()
  vulnerability?: string;

  @IsUUID()
  @IsOptional()
  tag?: string;
}

class DomainSearch {
  @IsInt()
  @IsPositive()
  page: number = 1;

  @IsString()
  @IsIn(['name', 'reverseName', 'ip', 'createdAt', 'updatedAt', 'id'])
  sort: string = 'name';

  @IsString()
  @IsIn(['ASC', 'DESC'])
  order: 'ASC' | 'DESC' = 'DESC';

  @Type(() => DomainFilters)
  @ValidateNested()
  @IsObject()
  @IsOptional()
  filters?: DomainFilters;

  @IsInt()
  @IsOptional()
  // If set to -1, returns all results.
  pageSize?: number;

  async filterResultQueryset(qs: SelectQueryBuilder<Domain>, event) {
    if (this.filters?.reverseName) {
      qs.andWhere('domain.name ILIKE :name', {
        name: `%${this.filters?.reverseName}%`
      });
    }
    if (this.filters?.ip) {
      qs.andWhere('domain.ip LIKE :ip', { ip: `%${this.filters?.ip}%` });
    }
    if (this.filters?.port) {
      qs.andHaving('COUNT(CASE WHEN services.port = :port THEN 1 END) >= 1', {
        port: this.filters?.port
      });
    }
    if (this.filters?.service) {
      qs.andHaving(
        'COUNT(CASE WHEN services.products->>0 ILIKE :service THEN 1 END) >= 1',
        { service: `%${this.filters?.service}%` }
      );
    }
    if (this.filters?.organization) {
      qs.andWhere('organization.id = :org', {
        org: this.filters.organization
      });
    }
    if (this.filters?.organizationName) {
      qs.andWhere('organization.name ILIKE :name', {
        name: `%${this.filters?.organizationName}%`
      });
    }
    if (this.filters?.tag) {
      qs.andWhere('organization.id IN (:...orgs)', {
        orgs: await getTagOrganizations(event, this.filters.tag)
      });
    }
    if (this.filters?.vulnerability) {
      qs.andHaving(
        'COUNT(CASE WHEN vulnerabilities.title ILIKE :title THEN 1 END) >= 1',
        {
          title: `%${this.filters?.vulnerability}%`
        }
      );
    }
    return qs;
  }

  async getResults(event) {
    const pageSize = this.pageSize || PAGE_SIZE;
    let qs = Domain.createQueryBuilder('domain')
      .leftJoinAndSelect('domain.services', 'services')
      .leftJoinAndSelect(
        'domain.vulnerabilities',
        'vulnerabilities',
        "state = 'open'"
      )
      .leftJoinAndSelect('domain.organization', 'organization')
      .orderBy(`domain.${this.sort}`, this.order)
      .groupBy(
        'domain.id, domain.ip, domain.name, organization.id, services.id, vulnerabilities.id'
      );
    if (pageSize !== -1) {
      qs = qs.skip(pageSize * (this.page - 1)).take(pageSize);
    }

    if (!isGlobalViewAdmin(event)) {
      qs.andWhere('organization.id IN (:...orgs)', {
        orgs: getOrgMemberships(event)
      });
    }

    await this.filterResultQueryset(qs, event);
    return qs.getManyAndCount();
  }
}

/**
 * @swagger
 *
 * /domain/search:
 *  post:
 *    description: List domains by specifying a filter.
 *    tags:
 *    - Domains
 */
export const list = wrapHandler(async (event) => {
  if (!isGlobalViewAdmin(event) && getOrgMemberships(event).length === 0) {
    return {
      statusCode: 200,
      body: JSON.stringify({
        result: [],
        count: 0
      })
    };
  }
  await connectToDatabase();
  const search = await validateBody(DomainSearch, event.body);
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
 * /domain/export:
 *  post:
 *    description: Export domains to a CSV file by specifying a filter.
 *    tags:
 *    - Domains
 */
export const export_ = wrapHandler(async (event) => {
  if (!isGlobalViewAdmin(event) && getOrgMemberships(event).length === 0) {
    return {
      statusCode: 200,
      body: JSON.stringify({
        result: [],
        count: 0
      })
    };
  }
  await connectToDatabase();
  const search = await validateBody(DomainSearch, event.body);
  let [result] = await search.getResults(event);
  const client = new S3Client();
  result = result.map((res: any) => {
    res.organization = res.organization.name;
    res.ports = res.services.map((service) => service.port).join(', ');
    const products: { [key: string]: string } = {};
    for (const service of res.services) {
      for (const product of service.products) {
        if (product.name)
          products[product.name.toLowerCase()] =
            product.name + (product.version ? ` ${product.version}` : '');
      }
    }
    res.products = Object.values(products).join(', ');
    return res;
  });
  const url = await client.saveCSV(
    Papa.unparse({
      fields: [
        'name',
        'ip',
        'id',
        'ports',
        'products',
        'createdAt',
        'updatedAt',
        'organization'
      ],
      data: result
    }),
    'domains'
  );

  return {
    statusCode: 200,
    body: JSON.stringify({
      url
    })
  };
});

/**
 * @swagger
 *
 * /domain/{id}:
 *  get:
 *    description: Get information about a particular domain.
 *    parameters:
 *      - in: path
 *        name: id
 *        description: Domain id
 *    tags:
 *    - Domains
 */
export const get = wrapHandler(async (event) => {
  let where = {};
  if (isGlobalViewAdmin(event)) {
    where = {};
  } else {
    where = { organization: In(getOrgMemberships(event)) };
  }
  await connectToDatabase();
  const id = event.pathParameters?.domainId;
  if (!isUUID(id)) {
    return NotFound;
  }

  const result = await Domain.findOne(
    { id, ...where },
    {
      relations: ['services', 'organization', 'vulnerabilities']
    }
  );

  return {
    statusCode: result ? 200 : 404,
    body: result ? JSON.stringify(result) : ''
  };
});
