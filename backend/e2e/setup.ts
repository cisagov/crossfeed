import { handler as syncdb } from '../src/tasks/syncdb';
import * as setup from "jest-environment-puppeteer/setup";

export default async () => {
  await setup();
  console.warn('Syncing test db...');
  await (syncdb as any)('dangerouslyforce');
  console.warn('Done syncing test db.');
};
