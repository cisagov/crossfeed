import { Domain, connectToDatabase } from '../../models';

/** Helper function to fetch all domains that have IPs set. */
// TODO: make this per-organization specific.
export default async (organizationId: String): Promise<Domain[]> => {
  await connectToDatabase();

  const domains = await Domain.createQueryBuilder('domain')
    .leftJoinAndSelect('domain.organization', 'organization')
    .andWhere('domain.organization=:org', { org: organizationId })
    .andWhere('ip IS NOT NULL')
    .getMany();

  return domains;
};
