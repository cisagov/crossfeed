import { handler as syncdb } from '../src/tasks/syncdb';
import { User, connectToDatabase, UserType } from '../src/models';
import { DUMMY_USER_ID } from './util';

export default async () => {
  console.warn('Syncing test db...');
  await (syncdb as any)('dangerouslyforce');
  console.warn('Done syncing test db.');
  await connectToDatabase();
  await User.create({
    firstName: '',
    lastName: '',
    email: Math.random() + '@crossfeed.cisa.gov',
    id: DUMMY_USER_ID,
    userType: UserType.STANDARD
  }).save();
};
