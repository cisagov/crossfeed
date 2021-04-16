import { handler as syncdb } from '../tasks/syncdb';

/**
 * Runs syncdb locally. This script is called from running "npm run syncdb".
 * Call "npm run syncdb -- -d dangerouslyforce" to force dropping and
 * recreating the SQL database.
 * Call "npm run syncdb -- -d populate" to populate the database
 * with some sample data.
 * */

process.env.DB_HOST = 'db';
process.env.DB_USERNAME = 'crossfeed';
process.env.DB_PASSWORD = 'password';
process.env.ELASTICSEARCH_ENDPOINT = 'http://es:9200';

syncdb(process.argv[2] === '-d' ? process.argv[3] : '', {} as any, () => null);
