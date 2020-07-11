import { Domain, Service, Organization } from '../models';
import { InsertResult } from 'typeorm';

export const saveDomainToDb = async (domain: Domain): Promise<Domain> => {
  const updatedValues = Object.keys(domain)
    .map((key) => {
      if (key == 'name') return '';
      else if (key == 'organization') return 'organizationId';
      return domain[key] !== null ? key : '';
    })
    .filter((key) => key !== '');
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

/** Helper function to return all root domains for all organizations */
export const getRootDomains = async (
  includePassive: boolean
): Promise<
  {
    name: string;
    organization: Organization;
  }[]
> => {
  const organizations = await Organization.find();
  const allDomains: {
    name: string;
    organization: Organization;
  }[] = [];

  for (const org of organizations) {
    if (includePassive || !org.isPassive) {
      for (const domain of org.rootDomains)
        allDomains.push({ name: domain, organization: org });
    }
  }
  return allDomains;
};
