import { Handler } from 'aws-lambda';
import { connectToDatabase, User, UserType } from '../models';
import logger from '../tools/lambda-logger';

export const handler: Handler = async (event, context) => {
  logger.info('makeGlobalAdmin function started', { context });
  await connectToDatabase();
  if (event.email) {
    const user = await User.findOne({
      email: event.email
    });
    if (user) {
      user.userType = event.role || UserType.GLOBAL_ADMIN;
      await User.save(user);
    }
  }
  logger.info('Success', { context });
};
