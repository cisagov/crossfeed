import { ValidateNested, IsOptional, IsObject, IsUUID } from 'class-validator';
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
    byOrg: Point[];
    latestVulnerabilities: Vulnerability[];
    mostCommonVulnerabilities: Vulnerability[];
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

/**
 * @swagger
 *
 * /stats:
 *  get:
 *    description: Get stats.
 *    tags:
 *    - Stats
 */
export const get = wrapHandler(async (event) => {
  await connectToDatabase();
  const search = await validateBody(StatsSearch, event.body);

  const filterQuery = (
    qs: SelectQueryBuilder<any>
  ): SelectQueryBuilder<any> => {
    if (!isGlobalViewAdmin(event)) {
      qs.andWhere('domain."organizationId" IN (:...orgs)', {
        orgs: getOrgMemberships(event)
      });
    }
    if (search.filters?.organization) {
      qs.andWhere('domain."organizationId" = :org', {
        org: search.filters?.organization
      });
    }
    return qs;
  };

  const performQuery = async (qs: SelectQueryBuilder<any>) => {
    qs = filterQuery(qs);
    return (await qs.getRawMany()).map((e) => ({
      id: String(e.id),
      value: Number(e.value),
      label: String(e.id)
    })) as { id: string; value: number; label: string }[];
  };

  const MAX_RESULTS = 50;

  const services = await performQuery(
    Domain.createQueryBuilder('domain')
      .innerJoinAndSelect('domain.services', 'services')
      .where('services.service IS NOT NULL')
      .select('services.service as id, count(*) as value')
      .groupBy('services.service')
      .orderBy('value', 'DESC')
  );
  const ports = await performQuery(
    Domain.createQueryBuilder('domain')
      .innerJoinAndSelect('domain.services', 'services')
      .select('services.port as id, count(*) as value')
      .groupBy('services.port')
      .orderBy('value', 'DESC')
  );
  const numVulnerabilities = await performQuery(
    Domain.createQueryBuilder('domain')
      .innerJoinAndSelect('domain.vulnerabilities', 'vulnerabilities')
      .andWhere("vulnerabilities.state = 'open'")
      .select(
        "CONCAT(domain.name, '|', vulnerabilities.severity) as id, count(*) as value"
      )
      .groupBy('vulnerabilities.severity, domain.id')
      .orderBy('value', 'DESC')
      .limit(MAX_RESULTS)
  );
  const latestVulnerabilities = await filterQuery(
    Vulnerability.createQueryBuilder('vulnerability')
      .leftJoinAndSelect('vulnerability.domain', 'domain')
      .andWhere("vulnerability.state = 'open'")
      .orderBy('vulnerability.createdAt', 'ASC')
      .limit(MAX_RESULTS)
  ).getMany();
  const mostCommonVulnerabilities = await filterQuery(
    Vulnerability.createQueryBuilder('vulnerability')
      .leftJoinAndSelect('vulnerability.domain', 'domain')
      .andWhere("vulnerability.state = 'open'")
      .select(
        'vulnerability.title, vulnerability.description, vulnerability.severity, count(*) as count'
      )
      .groupBy(
        'vulnerability.title, vulnerability.description, vulnerability.severity'
      )
      .orderBy('count', 'DESC')
  ).getRawMany();
  const severity = await performQuery(
    Vulnerability.createQueryBuilder('vulnerability')
      .leftJoinAndSelect('vulnerability.domain', 'domain')
      .andWhere("vulnerability.state = 'open'")
      .select('vulnerability.severity as id, count(*) as value')
      .groupBy('vulnerability.severity')
      .orderBy('vulnerability.severity', 'ASC')
  );
  const total = await performQuery(
    Domain.createQueryBuilder('domain').select('count(*) as value')
  );
  const byOrg = (
    await filterQuery(
      Domain.createQueryBuilder('domain')
        .innerJoinAndSelect('domain.organization', 'organization')
        .innerJoinAndSelect('domain.vulnerabilities', 'vulnerabilities')
        .andWhere("vulnerabilities.state = 'open'")
        .select(
          'organization.name as id, organization.id as "orgId", count(*) as value'
        )
        .groupBy('organization.name, organization.id')
        .orderBy('value', 'DESC')
    ).getRawMany()
  ).map((e) => ({
    id: String(e.id),
    orgId: String(e.orgId),
    value: Number(e.value),
    label: String(e.id)
  }));
  const result: Stats = {
    domains: {
      services,
      ports: ports,
      numVulnerabilities: numVulnerabilities,
      total: total[0].value
    },
    vulnerabilities: {
      severity,
      byOrg,
      latestVulnerabilities,
      mostCommonVulnerabilities
    }
  };
  return {
    statusCode: 200,
    body: JSON.stringify({
      result
    })
  };
});
