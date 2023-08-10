import { connectToDatabase, Domain } from '../../models';
import * as fs from 'fs';

// TODO: Find a way to only send one query to the db
export default async (path: string): Promise<void> => {
  const jsonData = await fs.promises.readFile(path, 'utf8');
  const jsonObject = JSON.parse(jsonData)[0];
  jsonObject.updatedAt = new Date();
  const domainId = path.split('/')[path.split('/').length - 1].split('.')[0];
  await connectToDatabase();
  await Domain.createQueryBuilder()
    .update(Domain)
    .set({
      trustymailResults: () => `'${JSON.stringify(jsonObject)}'`
    })
    .where('id = :id', { id: domainId })
    .execute();
  fs.unlink(path, (err) => {
    if (err) throw err;
  });
};
