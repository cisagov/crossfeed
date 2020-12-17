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
import { Domain, connectToDatabase, Webpage } from '../models';
import { validateBody, wrapHandler, NotFound } from './helpers';
import { SelectQueryBuilder, In } from 'typeorm';
import { isGlobalViewAdmin, getOrgMemberships } from './auth';
import S3Client from '../tasks/s3-client';
import * as Papa from 'papaparse';
import { json } from 'body-parser';

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
  vulnerability?: string;
}

class DomainSearch {
  @IsInt()
  @IsPositive()
  page: number = 1;

  @IsString()
  @IsIn(['name', 'reverseName', 'ip', 'updatedAt', 'id'])
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

  filterResultQueryset(qs: SelectQueryBuilder<Domain>) {
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
      qs.andWhere('domain."organizationId" = :org', {
        org: this.filters.organization
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
      .orderBy(`domain.${this.sort}`, this.order)
      .groupBy(
        'domain.id, domain.ip, domain.name, domain."organizationId", services.id, vulnerabilities.id'
      );
    if (pageSize !== -1) {
      qs = qs.skip(pageSize * (this.page - 1)).take(pageSize);
    }

    if (!isGlobalViewAdmin(event)) {
      qs.andHaving('domain."organizationId" IN (:...orgs)', {
        orgs: getOrgMemberships(event)
      });
    }

    this.filterResultQueryset(qs);
    return await qs.getMany();
  }

  filterCountQueryset(qs: SelectQueryBuilder<Domain>) {
    if (this.filters?.reverseName) {
      qs.andWhere('domain.name ILIKE :name', {
        name: `%${this.filters?.reverseName}%`
      });
    }
    if (this.filters?.ip) {
      qs.andWhere('domain.ip LIKE :ip', { ip: `%${this.filters?.ip}%` });
    }
    if (this.filters?.port) {
      qs.andWhere('services.port = :port', {
        port: this.filters?.port
      });
    }
    if (this.filters?.service) {
      qs.andWhere('services.service ILIKE :service', {
        service: `%${this.filters?.service}%`
      });
    }
    if (this.filters?.organization) {
      qs.andWhere('domain."organizationId" = :org', {
        org: this.filters.organization
      });
    }
    if (this.filters?.vulnerability) {
      qs.andWhere('vulnerabilities.title ILIKE :title', {
        title: `%${this.filters?.vulnerability}%`
      });
    }
  }

  async getCount(event) {
    const qs = Domain.createQueryBuilder('domain')
      .leftJoin('domain.services', 'services')
      .leftJoin('domain.vulnerabilities', 'vulnerabilities', "state = 'open'");
    if (!isGlobalViewAdmin(event)) {
      qs.andWhere('domain."organizationId" IN (:...orgs)', {
        orgs: getOrgMemberships(event)
      });
    }
    this.filterCountQueryset(qs);
    return await qs.getCount();
  }
}

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
  const [result, count] = await Promise.all([
    search.getResults(event),
    search.getCount(event)
  ]);
  const client = new S3Client();
  const url = await client.saveCSV(
    Papa.unparse({
      fields: [
        'name',
        'ip',
        'id',
        'ports',
        'services',
        'createdAt',
        'updatedAt'
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
  // separate database call so that we don't have to remove all the webpages from the "result" object prior to returning it to the frontend
  const domainWebpages = await Domain.findOne(
    { id, ...where },
    {
      relations: ['webpages']
    }
  );
  let topLevelDirectories: string[] = [];
  //if domain has webpages, generate the tree in backend, and send only the top level directory names to the front end
  if (domainWebpages?.webpages) {
    const webpages = generateWebpageTree(domainWebpages?.webpages);

    topLevelDirectories = Object.keys(webpages);
    topLevelDirectories.shift(); //removes "undefined" value which represents the root directory
  }

  return {
    statusCode: result ? 200 : 404,
    body: result
      ? JSON.stringify({
          result: result,
          webdirectories: topLevelDirectories
        })
      : ''
  };
});
// used to generate the sitemap tree in the backend to reduce data sent over the network
export const generateWebpageTree = (pages: any[]) => {
  const tree: any = {};
  for (const page of pages) {
    const url = new URL(page.url);
    const parts = url.pathname.split('/').filter((path) => path !== '');
    let root = tree;
    for (let i = 0; i < parts.length - 1; i++) {
      if (parts[i] in root) root = root[parts[i]];
      else {
        root[parts[i]] = {};
        root = root[parts[i]];
      }
    }
    root[parts[parts.length - 1]] = page;
  }
  return tree;
};

let nested: any = [];
const treeToList = (tree: any) => {
  Object.keys(tree).map((key) => {
    //console.log(key);
    if (tree[key] && tree[key]['url']) {
      nested.push({
        key: key,
        value: tree[key]['url']
      });

      treeToList(tree[key]);
    }
  });
  return nested;
};

//API handler for generating a specific branch of the site map tree, and returning a list of {page name: url}.
export const sites = wrapHandler(async (event) => {
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

  const domainWebpages = await Domain.findOne(
    { id, ...where },
    {
      relations: ['webpages']
    }
  );
  let result: any = {};
  const directory = event.pathParameters?.directory;
  if (domainWebpages?.webpages && directory) {
    const webpages = generateWebpageTree(domainWebpages?.webpages);

    nested = [];

    result = webpages[directory];

    const webpageList = treeToList(result);
    console.log(webpageList);

    result = webpageList;
  }

  return {
    statusCode: result ? 200 : 404,
    body: result ? JSON.stringify({ result: result }) : ''
  };
});
