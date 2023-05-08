import { domain } from 'process';
import { connectToDatabase, Domain } from '../../models';

export default async (domainId: string, jsonData: Buffer): Promise<void> => {
  await connectToDatabase();
  Domain.createQueryBuilder()
    .update(domain)
    .set({ trustymailResults: () => `'${jsonData}'` })
    .where('id = :id', { id: domainId })
    .execute();
};
