import { handler as autodisable } from '../tasks/autoDisableAccounts';

/**
 * Runs autodisable locally. This script is called from running "npm run autodisable".
 * */

process.env.DB_HOST = 'db';
process.env.DB_USERNAME = 'crossfeed';
process.env.DB_PASSWORD = 'password';

autodisable('', {} as any, () => null);
