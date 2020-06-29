import { Domain, Service, SSLInfo, WebInfo } from '../models';
import { InsertResult } from 'typeorm';

export const saveDomainToDb = async (domain: Domain): Promise<Domain> => {
  const { generatedMaps } = await Domain.createQueryBuilder()
    .insert()
    .values(domain)
    .onConflict(
      `
        ("name","ip") DO UPDATE 
        SET "screenshot" = excluded."screenshot",
            "asn" = excluded."asn",
            "country" = excluded."country",
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

// Helper function to fetch all live websites (port 80 or 443)
export const getLiveWebsites = async (): Promise<any[]> => {
  const qs = Domain.createQueryBuilder('domain')
    .select(['domain.id as id', 'ip', 'name', '"updatedAt"'])
    .addSelect('array_agg(services.port)', 'ports')
    .leftJoin('domain.services', 'services')
    .groupBy('domain.id, domain.ip, domain.name');

  qs.andHaving(
    "COUNT(CASE WHEN services.port = '443' OR services.port = '80' THEN 1 END) >= 1"
  );

  return await qs.getRawMany();
};
