import { domain } from 'process';
import { connectToDatabase, Domain } from '../../models';
import * as fs from 'fs';

export default async (domainId, path): Promise<void> => {
  await connectToDatabase();
  Domain.createQueryBuilder()
    .update(domain)
    .set({ trustymailResults: () => `${fs.readFileSync(path)}` })
    .where('id = :id', { id: domainId })
    .execute();
};
