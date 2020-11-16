import { In } from 'typeorm';
import { Domain, connectToDatabase } from '../../models';

/** Helper function to fetch all domains */
export default async (organizations?: string[]): Promise<Domain[]> => {
  await connectToDatabase();

  return Domain.find({
    select: ['id', 'name', 'ip', 'organization'],
    where: organizations ? { organization: In(organizations) } : {},
    relations: ['organization']
  });
};
