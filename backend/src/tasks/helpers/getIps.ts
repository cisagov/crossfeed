import { Domain, connectToDatabase } from '../../models';

/** Helper function to fetch all domains that have IPs set. */
// TODO: make this per-organization specific.
export default async (): Promise<Domain[]> => {
  await connectToDatabase();

  const domains = await Domain.createQueryBuilder('domain')
    .leftJoinAndSelect('domain.organization', 'organization')
    .andWhere('NOT organization."isPassive"')
    .andWhere('ip IS NOT NULL')
    .getMany();

  return domains;
};
