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
      id: String(e.id),
      value: Number(e.value),
      label: String(e.id)
    })) as { id: string; value: number; label: string }[];
  };

  const services = await performQuery(
    Domain.createQueryBuilder('domain')
      .innerJoinAndSelect('domain.organization', 'organization')
      .innerJoinAndSelect('domain.services', 'services')
      .select('services.service as id, count(*) as value')
      .groupBy('services.service')
      .orderBy('value', 'DESC')
  );
  const ports = await performQuery(
    Domain.createQueryBuilder('domain')
      .innerJoinAndSelect('domain.organization', 'organization')
      .innerJoinAndSelect('domain.services', 'services')
      .select('services.port as id, count(*) as value')
      .groupBy('services.port')
      .orderBy('value', 'DESC')
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
  const total = await performQuery(
    Domain.createQueryBuilder('domain')
      .innerJoinAndSelect('domain.organization', 'organization')
      .select('count(*) as value')
  );
  const result: Stats = {
    domains: {
      services,
      ports: ports,
      numVulnerabilities: numVulnerabilities,
      total: total[0].value
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
