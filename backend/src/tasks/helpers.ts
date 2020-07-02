import { Domain, Service, SSLInfo, WebInfo, Organization } from '../models';
import { InsertResult } from 'typeorm';

export const saveDomainToDb = async (domain: Domain): Promise<Domain> => {
  const updatedValues = Object.keys(domain).filter(
    (key) => domain[key] !== null && key !== 'name'
  );
  const { generatedMaps } = await Domain.createQueryBuilder()
    .insert()
    .values(domain)
    .onConflict(
      `
          ("name") DO UPDATE
          SET ${updatedValues
            .map((val) => `"${val}" = excluded."${val}",`)
            .join('\n')}
              "updatedAt" = now()
        `
    )
    .execute();
  return generatedMaps[0] as Domain;
};

export const saveServicesToDb = (services: Service[]): Promise<InsertResult> =>
  Service.createQueryBuilder()
    .insert()
    .values(services)
    .onConflict(
      `
        ("domainId","port") DO UPDATE
        SET "lastSeen" = excluded."lastSeen",
            "banner" = excluded."banner",
            "service" = excluded."service"
      `
    )
    .execute();

export const saveSSLInfosToDb = (info: SSLInfo): Promise<InsertResult> =>
  SSLInfo.createQueryBuilder()
    .insert()
    .values(info)
    .onConflict(
      `
        ("domainId") DO UPDATE
        SET "protocol" = excluded."protocol",
            "issuerOrg" = excluded."issuerOrg",
            "issuerCN" = excluded."issuerCN",
            "validFrom" = excluded."validFrom",
            "validTo" = excluded."validTo",
            "altNames" = excluded."altNames",
            "fingerprint" = excluded."fingerprint"
      `
    )
    .execute();

export const saveWebInfoToDb = (info: WebInfo): Promise<InsertResult> =>
  WebInfo.createQueryBuilder()
    .insert()
    .values(info)
    .onConflict(
      `
        ("domainId") DO UPDATE
          SET "technologies" = excluded."technologies"
      `
    )
    .execute();

/** Helper function to fetch all live websites (port 80 or 443) */
export const getLiveWebsites = async (
  includePassive: boolean
): Promise<(Domain & { ports: number[] })[]> => {
  const qs = Domain.createQueryBuilder('domain')
    .select(['domain.id as id', 'ip', 'name', '"updatedAt"'])
    .addSelect('array_agg(services.port)', 'ports')
    .leftJoin('domain.services', 'services')
    .groupBy('domain.id, domain.ip, domain.name');

  qs.andHaving(
    "COUNT(CASE WHEN services.port = '443' OR services.port = '80' THEN 1 END) >= 1"
  );

  if (!includePassive) {
    qs.andHaving('NOT domain.isPassive');
  }

  return await qs.getRawMany();
};

/** Helper function to return all root domains for all organizations */
export const getRootDomains = async (
  includePassive: boolean
): Promise<
  {
    name: string;
    isPassive: boolean;
  }[]
> => {
  const organizations = await Organization.find();
  const allDomains: {
    name: string;
    isPassive: boolean;
  }[] = [];

  for (const org of organizations) {
    if (includePassive || !org.isPassive) {
      for (const domain of org.rootDomains)
        allDomains.push({ name: domain, isPassive: org.isPassive });
    }
  }
  return allDomains;
};
