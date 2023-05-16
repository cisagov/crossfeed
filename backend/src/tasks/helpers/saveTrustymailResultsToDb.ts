import { domain } from 'process';
import { connectToDatabase, Domain } from '../../models';
import * as fs from 'fs';

// TODO: Find a way to only send one query to the db
export default async (path: string): Promise<void> => {
  const domainId = path.split('/')[path.split('/').length - 1].split('.')[0];
  const jsonData = await fs.promises.readFile(path);
  await connectToDatabase();
  await Domain.createQueryBuilder()
    .update(domain)
    .set({
      trustymailResults: () => `'${jsonData}'`
    })
    .where('id = :id', { id: domainId })
    .execute();
  Domain.createQueryBuilder()
    .update(domain)
    .set({
      trustymailResults: () =>
        `jsonb_set("trustymailResults"::jsonb, '{0,Timestamp}', to_jsonb(current_timestamp::timestamp), true)`
    })
    .where('id = :id', { id: domainId })
    .execute();
  // Delete file after saving to db
  fs.unlink(path, (err) => {
    if (err) throw err;
  });
};
