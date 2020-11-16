import { plainToClass } from 'class-transformer';
import { Domain, connectToDatabase, Service } from '../../models';

export class LiveDomain extends Domain {
  url: string;
  service: Service;
}

/** Helper function to fetch all live websites (port 80 or 443) */
export const getLiveWebsites = async (
  organizationId?: string,
  organizationIds: string[] = [],
  onlySSL: boolean = false
): Promise<LiveDomain[]> => {
  await connectToDatabase();

  if (organizationId) {
    organizationIds = [organizationId];
  }

  if (organizationIds.length === 0) {
    return [];
  }

  const qs = Domain.createQueryBuilder('domain')
    .leftJoinAndSelect('domain.services', 'services')
    .leftJoinAndSelect('domain.organization', 'organization')
    .andWhere('domain.organization IN (:...orgs)', { orgs: organizationIds })
    .groupBy('domain.id, domain.ip, domain.name, organization.id, services.id');

  if (onlySSL) {
    qs.andHaving("COUNT(CASE WHEN services.port = '443' THEN 1 END) >= 1");
  } else {
    qs.andHaving(
      "COUNT(CASE WHEN services.port = '443' OR services.port = '80' THEN 1 END) >= 1"
    );
  }

  const websites = await qs.getMany();

  return websites.map((domain) => {
    const live = domain as LiveDomain;
    const ports = domain.services.map((service) => service.port);
    let service: Service;
    if (ports.includes(443))
      service = domain.services.find((service) => service.port === 443)!;
    else service = domain.services.find((service) => service.port === 80)!;
    const url =
      service.port === 443 ? `https://${domain.name}` : `http://${domain.name}`;
    live.url = url;
    live.service = service;
    return live;
  });
};
