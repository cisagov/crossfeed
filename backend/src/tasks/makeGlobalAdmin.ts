import { Handler } from 'aws-lambda';
import { connectToDatabase, User } from '../models';

export const handler: Handler = async (event) => {
  const connection = await connectToDatabase(true);
  console.log(event);
  if (event.email) {
    const user = await User.findOne({
      email: event.email
    });
    if (user) {
      user.userType = 'globalAdmin';
      await User.save(user);
    }
  }
};
