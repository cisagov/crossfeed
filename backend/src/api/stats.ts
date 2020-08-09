import {
  IsInt,
  ValidateNested,
  IsOptional,
  IsObject,
  IsUUID
} from 'class-validator';
import { Type } from 'class-transformer';
import { Domain, connectToDatabase, Vulnerability } from '../models';
import { validateBody, wrapHandler } from './helpers';
import { SelectQueryBuilder } from 'typeorm';
import { isGlobalViewAdmin, getOrgMemberships } from './auth';

const PAGE_SIZE = parseInt(process.env.PAGE_SIZE ?? '') || 25;

interface Point {
  id: string;
  label: string;
  value: number;
}

interface Stats {
  domains: {
    services: Point[];
    ports: Point[];
    numVulnerabilities: Point[];
    total: number;
  };
  vulnerabilities: {
    severity: Point[];
  };
}

class StatsFilters {
  @IsUUID()
  @IsOptional()
  organization?: string;
}

class StatsSearch {
  @Type(() => StatsFilters)
  @ValidateNested()
  @IsObject()
  @IsOptional()
  filters?: StatsFilters;

  @IsInt()
  @IsOptional()
  // If set to -1, returns all results.
  pageSize?: number;

  filterResultQueryset(qs: SelectQueryBuilder<Domain>) {
    return qs;
  }

  async getResults() {
    // let qs = Service.createQueryBuilder('domain')
    //   .leftJoinAndSelect('domain.services', 'services')
    //   .groupBy("services.")
    //   .leftJoinAndSelect('domain.organization', 'organization')
    //   .leftJoinAndSelect('domain.vulnerabilities', 'vulnerabilities')
    //   .orderBy(`domain.${this.sort}`, this.order)
    //   .groupBy(
    //     'domain.id, domain.ip, domain.name, organization.id, services.id, vulnerabilities.id'
    //   );
    // if (pageSize !== -1) {
    //   qs = qs.skip(pageSize * (this.page - 1)).take(pageSize);
    // }

    // if (!isGlobalViewAdmin(event)) {
    //   qs.andHaving('domain.organization IN (:...orgs)', {
    //     orgs: getOrgMemberships(event)
    //   });
    // }

    // this.filterResultQueryset(qs);
    // return await qs.getMany();

    return {};
  }
}

export const get = wrapHandler(async (event) => {
  await connectToDatabase();
  const search = await validateBody(StatsSearch, event.body);

  const performQuery = async (qs: SelectQueryBuilder<any>) => {
    if (!isGlobalViewAdmin(event)) {
      qs.andWhere('organization.id IN (:...orgs)', {
        orgs: getOrgMemberships(event)
      });
    }
    if (search.filters?.organization) {
      qs.andWhere('organization.id = :org', {
        org: search.filters?.organization
      });
    }

    return (await qs.getRawMany()).map((e) => ({
      id: e.id,
      value: Number(e.value),
      label: e.id,
      ...e
    }));
  };

  const services = await performQuery(
    Domain.createQueryBuilder('domain')
      .innerJoinAndSelect('domain.organization', 'organization')
      .innerJoinAndSelect('domain.services', 'services')
      .select('services.service as id, count(*) as value')
      .groupBy('services.service')
  );
  const ports = await performQuery(
    Domain.createQueryBuilder('domain')
      .innerJoinAndSelect('domain.organization', 'organization')
      .innerJoinAndSelect('domain.services', 'services')
      .select('services.port as id, count(*) as value')
      .groupBy('services.port')
      .orderBy('services.port', 'DESC')
  );
  const numVulnerabilities = await performQuery(
    Domain.createQueryBuilder('domain')
      .innerJoinAndSelect('domain.organization', 'organization')
      .innerJoinAndSelect('domain.services', 'services')
      .select('domain.name as id, count(*) as value')
      .groupBy('domain.id')
      .orderBy('value', 'DESC')
  );
  const severity = await performQuery(
    Vulnerability.createQueryBuilder('vulnerability')
      .leftJoinAndSelect('vulnerability.domain', 'domain')
      .leftJoinAndSelect('domain.organization', 'organization')
      .select('vulnerability.cvss as id, count(*) as value')
      .groupBy('vulnerability.cvss')
      .orderBy('vulnerability.cvss', 'ASC')
  );
  const result: Stats = {
    domains: {
      services,
      ports,
      numVulnerabilities,
      total: await Domain.count({})
    },
    vulnerabilities: {
      severity
    }
  };
  return {
    statusCode: 200,
    body: JSON.stringify({
      result
    })
  };
});
