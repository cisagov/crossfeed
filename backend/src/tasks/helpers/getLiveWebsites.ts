import { Domain, connectToDatabase } from '../../models';

/** Helper function to fetch all live websites (port 80 or 443) */
export default async (organizationId: string): Promise<Domain[]> => {
  await connectToDatabase();

  const qs = Domain.createQueryBuilder('domain')
    .leftJoinAndSelect('domain.services', 'services')
    .leftJoinAndSelect('domain.organization', 'organization')
    .andWhere('domain.organization=:org', { org: organizationId })
    .groupBy('domain.id, domain.ip, domain.name, organization.id, services.id');

  qs.andHaving(
    "COUNT(CASE WHEN services.port = '443' OR services.port = '80' THEN 1 END) >= 1"
  );

  return await qs.getMany();
};
