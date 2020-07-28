import { Domain, connectToDatabase } from '../../models';

/** Helper function to fetch all domains */
export default async (): Promise<Domain[]> => {
  await connectToDatabase();

  const qs = Domain.createQueryBuilder('domain').select('name', 'ip');

  return await qs.getMany();
};
