import { handler as pesyncdb } from '../tasks/pesyncdb';

/**
 * Runs pesyncdb locally. This script is called from running "npm run pesyncdb".
 * */

process.env.DB_HOST = 'db';
process.env.DB_USERNAME = 'crossfeed';
process.env.DB_PASSWORD = 'password';
process.env.DB_NAME = 'crossfeed';
process.env.PE_DB_NAME = 'pe';
process.env.PE_DB_USERNAME = 'pe';
process.env.PE_DB_PASSWORD = 'password';

pesyncdb('', {} as any, () => null);
