import { Domain, connectToDatabase } from '../../models';

/** Helper function to fetch all domains */
export default async (): Promise<Domain[]> => {
  await connectToDatabase();

  return Domain.find({
    select: ['id', 'name', 'ip', 'organization']
  });
};
