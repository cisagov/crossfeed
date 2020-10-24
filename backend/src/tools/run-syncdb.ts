import { handler as syncdb } from '../tasks/syncdb';

/**
 * Runs syncdb locally. This script is called from running "npm run syncdb".
 * Call "npm run syncdb -- -d dangerouslyforce" to force dropping and
 * recreating the SQL database.
 * */

process.env.DB_HOST = 'localhost';
process.env.DB_USERNAME = 'crossfeed';
process.env.DB_PASSWORD = 'password';
process.env.ELASTICSEARCH_ENDPOINT = 'http://localhost:9200';

syncdb(
  process.argv[3] === '-d' && process.argv[4] === 'dangerouslyforce'
    ? 'dangerouslyforce'
    : '',
  {} as any,
  () => null
);
