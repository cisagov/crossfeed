import { Domain, connectToDatabase } from '../../models';

/** Helper function to fetch all domains that have IPs set. */
export default async (organizationId?: String): Promise<Domain[]> => {
  await connectToDatabase();

  let domains = Domain.createQueryBuilder('domain')
    .leftJoinAndSelect('domain.organization', 'organization')
    .andWhere('ip IS NOT NULL');

  if (organizationId) {
    domains = domains.andWhere('domain.organization=:org', {
      org: organizationId
    });
  }

  return domains.getMany();
};
