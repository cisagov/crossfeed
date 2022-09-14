import { Handler } from 'aws-lambda';
import { Raw } from 'typeorm';
import { connectToDatabase, User } from '../models';

const INACTIVE_THRESHOLD = 60;

export const handler: Handler = async (event) => {
  await connectToDatabase(true);
  var inactiveDate = new Date();
  inactiveDate.setDate(inactiveDate.getDate() - INACTIVE_THRESHOLD);
  const users = await User.find({
    lastLoggedIn: Raw((alias) => `${alias} < :date`, { date: inactiveDate })
  });
  for (let i = 0; i < users.length; i++) {
    users[i].disabled = true;
    await User.save(users[i]);
  }
  return users;
};
