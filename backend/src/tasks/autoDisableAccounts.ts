import { Handler } from 'aws-lambda';
import { DataSync } from 'aws-sdk';
import { Raw } from 'typeorm';
import { updateLanguageServiceSourceFile } from 'typescript';
import { connectToDatabase, User } from '../models';

/*
 * This handler finds all users in the database who last logged in
 * before a set number of days, and sets those users' 'disabled'
 * fields to true.
 */

const INACTIVE_THRESHOLD = 60; // Number of days since last log in to be considered inactive

export const handler: Handler = async (event) => {
  await connectToDatabase(true);
  const inactiveDate = new Date();
  inactiveDate.setDate(inactiveDate.getDate() - INACTIVE_THRESHOLD);
  await User.createQueryBuilder()
    .update(User)
    .set({ disabled: true })
    .where('lastLoggedIn < :inactiveDate', { inactiveDate: inactiveDate })
    .execute();
};
