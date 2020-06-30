import { Domain, Service, SSLInfo, WebInfo } from '../models';
import { InsertResult } from 'typeorm';

export const saveDomainToDb = async (domain: Domain): Promise<Domain> => {
  const { generatedMaps } = await Domain.createQueryBuilder()
    .insert()
    .values(domain)
    .onConflict(
      `
        ("name") DO UPDATE 
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
          SET "frameworks" = excluded."frameworks",
              "cms" = excluded."cms",
              "widgets" = excluded."widgets",
              "fonts" = excluded."fonts",
              "analytics" = excluded."analytics",
              "webServers" = excluded."webServers",
              "operatingSystems" = excluded."operatingSystems",
              "socialUrls" = excluded."socialUrls",
              "gaKeys" = excluded."gaKeys"
      `
    )
    .execute();
