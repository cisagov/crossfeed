import { User, connectToDatabase } from '../src/models';
import { handler as autodisable } from '../src/tasks/autoDisableAccounts';

describe('auto disable', () => {
  beforeAll(async () => {
    await connectToDatabase();
  });
  const INACTIVE_THRESHOLD = 60;
  it(`auto disable should disable accounts that last logged in over ${INACTIVE_THRESHOLD} days ago`, async () => {
    const days_over_thresh = [0, 1, 50, 200, 365];
    const users: User[] = [];
    for (let i = 0; i < days_over_thresh.length; i++) {
      const inactiveDate = new Date();
      inactiveDate.setDate(
        inactiveDate.getDate() - INACTIVE_THRESHOLD - days_over_thresh[i]
      );
      const user = await User.create({
        firstName: Math.random().toString(),
        lastName: '',
        email: Math.random() + '@crossfeed.cisa.gov',
        dateAcceptedTerms: new Date('2020-08-03T13:58:31.715Z'),
        lastLoggedIn: inactiveDate
      }).save();
      users.push(user);
    }
    const response = await autodisable('', {} as any, () => null);
    for (let i = 0; i < users.length; i++) {
      const retrievedUser = await User.findOneOrFail({
        email: users[i].email
      });
      expect(retrievedUser.disabled).toEqual(true);
    }
  });
  it(`auto disable should not disable accounts that last logged in under ${INACTIVE_THRESHOLD} days ago`, async () => {
    const days_back = [0, 1, 15, 30, 59];
    const users: User[] = [];
    for (let i = 0; i < days_back.length; i++) {
      const inactiveDate = new Date();
      inactiveDate.setDate(inactiveDate.getDate() - days_back[i]);
      const user = await User.create({
        firstName: Math.random().toString(),
        lastName: '',
        email: Math.random() + '@crossfeed.cisa.gov',
        dateAcceptedTerms: new Date('2020-08-03T13:58:31.715Z'),
        lastLoggedIn: inactiveDate
      }).save();
      users.push(user);
    }
    const response = await autodisable('', {} as any, () => null);
    for (let i = 0; i < users.length; i++) {
      const retrievedUser = await User.findOneOrFail({
        email: users[i].email
      });
      expect(retrievedUser.disabled).toEqual(false);
    }
  });
});
