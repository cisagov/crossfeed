import { domain } from 'process';
import { connectToDatabase, Domain } from '../../models';
import * as fs from 'fs';

export default async (path: string): Promise<void> => {
  const domainId = path.split('/')[path.split('/').length - 1].split('.')[0];
  const jsonData = await fs.promises.readFile(path);
  await connectToDatabase();
  await Domain.createQueryBuilder()
    .update(domain)
    .set({ trustymailResults: () => `'${jsonData}'` })
    .where('id = :id', { id: domainId })
    .execute();
  // Delete file after saving to db
  fs.unlink(path, (err) => {
    if (err) throw err;
  });
};
