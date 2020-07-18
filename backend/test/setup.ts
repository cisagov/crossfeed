import { handler as syncdb } from '../src/tasks/syncdb';

export default async () => {
  console.warn('Syncing test db...');
  await (syncdb as any)("dangerouslyforce");
  console.warn('Done syncing test db.');
};
