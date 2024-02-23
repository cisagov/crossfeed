import { createConnection, Connection } from 'typeorm';
import {
  Domain,
  Service,
  Vulnerability,
  Scan,
  Organization,
  User,
  Role,
  ScanTask,
  Webpage,
  ApiKey,
  SavedSearch,
  OrganizationTag,
  Cpe,
  Cve
} from '.';

let connection: Connection | null = null;

const connectDb = async (logging?: boolean) => {
  const connection = createConnection({
    type: 'postgres',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT ?? ''),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    entities: [
      Cpe,
      Cve,
      Domain,
      Service,
      Vulnerability,
      Scan,
      Organization,
      User,
      Role,
      ScanTask,
      Webpage,
      ApiKey,
      SavedSearch,
      OrganizationTag
    ],
    synchronize: false,
    name: 'default',
    dropSchema: false,
    logging: logging ?? false,
    cache: true
  });
  return connection;
};

export const connectToDatabase = async (logging?: boolean) => {
  if (!connection?.isConnected) {
    connection = await connectDb(logging);
  }
  return connection;
};
