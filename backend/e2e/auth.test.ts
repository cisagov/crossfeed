import { createUserToken } from '../test/util';
import { userTokenBody } from '../src/api/auth';
import {
  User,
  connectToDatabase,
  Domain,
  Organization,
  Role
} from '../src/models';
import { setToken, downloadAndReadFile } from './utils';

describe('index when logged in', () => {
  beforeAll(async () => {
    await connectToDatabase();
  });

  it('shows private beta banner for user with no orgs', async () => {
    const email = Math.random() + '@crossfeed.cisa.gov';
    const user = await User.create({
      firstName: '',
      lastName: '',
      email
    }).save();
    const token = createUserToken(userTokenBody(user));
    await setToken(page, token);

    await page.goto('http://localhost');
    await page.waitForXPath(
      "//*[contains(text(), 'Crossfeed is currently in private beta.')]"
    );
    expect(await page.content()).not.toContain('Finish Creating Account');
  });

  it('shows "finish creating account" banner for globalAdmin user', async () => {
    const email = Math.random() + '@crossfeed.cisa.gov';
    const user = await User.create({
      firstName: '',
      lastName: '',
      email,
      userType: 'globalAdmin'
    }).save();
    const token = createUserToken(userTokenBody(user));
    await setToken(page, token);

    await page.goto('http://localhost');
    await page.waitForXPath(
      "//*[contains(text(), 'Crossfeed is currently in private beta.')]"
    );
    expect(await page.content()).toContain('Finish Creating Account');
  });

  it('shows domain list for user with orgs, user can download domains', async () => {
    const email = Math.random() + '@crossfeed.cisa.gov';
    const organization = await Organization.create({
      name: 'test-' + Math.random(),
      rootDomains: ['test-' + Math.random()],
      ipBlocks: [],
      isPassive: false
    }).save();
    const user = await User.create({
      firstName: 'Firstname',
      lastName: 'Lastname',
      email
    }).save();
    const role = await Role.create({
      role: 'user',
      approved: true,
      organization,
      user
    }).save();
    const domain = await Domain.create({
      name: 'test-' + Math.random(),
      organization
    }).save();
    const token = createUserToken(userTokenBody(user));
    await setToken(page, token);

    await page.goto('http://localhost');
    await page.waitForXPath(
      `//*[contains(text(), 'Dashboard - ${organization.name}')]`
    );
    await page.waitForXPath(`//*[contains(text(), '${domain.name}')]`);

    const contents = await downloadAndReadFile(page, async () => {
      const button = await page.$x(
        "//button[contains(text(), 'Export as CSV')]"
      );
      await button[0].click();
    });

    const lines = contents.split('\n');
    expect(lines.length).toEqual(2);
    expect(lines[1].indexOf(domain.name)).toEqual(0);
  });
});
