import { Handler } from 'aws-lambda';
import { connectToDatabase } from '../models';

/*
 * Generates initial P&E database.
 */

export const handler: Handler = async (event) => {
  const connection = await connectToDatabase();

  if (
    !process.env.PE_DB_USERNAME ||
    !process.env.PE_DB_PASSWORD ||
    !process.env.PE_DB_NAME ||
    !process.env.DATABASE_NAME
  ) {
    throw Error(
      'PE_DB_USERNAME, PE_DB_PASSWORD, PE_DB_NAME, DATABASE_NAME must be set.'
    );
  }

  // Create P&E database and user.
  try {
    await connection.query(
      `CREATE USER ${process.env.PE_DB_USERNAME} WITH PASSWORD '${process.env.PE_DB_PASSWORD}';`
    );
  } catch (e) {
    console.log(
      "Create user failed. This usually means that the user already exists, so you're OK if that was the case. Here's the exact error:",
      e
    );
  }
  try {
    await connection.query(
      `GRANT ${process.env.PE_DB_USERNAME} to ${process.env.DB_USERNAME};`
    );
  } catch (e) {
    console.log('Grant role failed. Error:', e);
  }
  try {
    await connection.query(
      `CREATE DATABASE ${process.env.PE_DB_NAME} owner ${process.env.PE_DB_USERNAME};`
    );
  } catch (e) {
    console.log(
      "Create database failed. This usually means that the database already exists, so you're OK if that was the case. Here's the exact error:",
      e
    );
  }

  console.log('Done.');
};
