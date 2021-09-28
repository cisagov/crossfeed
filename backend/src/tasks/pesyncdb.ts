import { Client } from 'pg';
import { Handler } from 'aws-lambda';
import { readFileSync } from 'fs';

import { connectToDatabase } from '../models';
import * as path from 'path';

const PE_DATA_SCHEMA_PATH = path.join(__dirname, 'pe-data-schema.sql');

/*
 * Generates initial P&E database.
 */

export const handler: Handler = async (event) => {
  const connection = await connectToDatabase();

  // Create P&E database and user.
  try {
    await connection.query(
      `CREATE USER ${process.env.PE_DB_USERNAME} WITH PASSWORD '${process.env.PE_DB_PASSWORD}';`
    );
    await connection.query(
      `CREATE DATABASE ${process.env.PE_DB_NAME} owner ${process.env.PE_DB_USERNAME};`
    );
  } catch (e) {
    console.log(
      "Create user / database failed. This means that the database already exists, so you're OK."
    ); // , e);
  }

  // Connect to the PE database.
  const client = new Client({
    user: process.env.PE_DB_USERNAME,
    host: process.env.DB_HOST,
    database: process.env.PE_DB_NAME,
    password: process.env.PE_DB_PASSWORD
  });
  client.connect();

  // Drop all tables in the PE database.
  await client.query(`drop owned by ${process.env.PE_DB_USERNAME}`);

  // Generate initial PE tables.
  const sql = String(readFileSync(PE_DATA_SCHEMA_PATH));
  await client.query(sql);
};
