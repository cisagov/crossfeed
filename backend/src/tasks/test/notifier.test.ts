import { handler as notifier } from '../notifier';
import {
  connectToDatabase,
  Scan,
  Alert,
  AlertType,
  Organization,
  ScanTask,
  User,
  Domain,
  Role,
  Vulnerability
} from '../../models';

jest.mock('../../api/helpers');
const { sendEmail } = require('../../api/helpers');

describe('scheduler', () => {
  let user;
  let organization;
  beforeEach(async () => {
    await connectToDatabase();
    user = await User.create({
      firstName: '',
      lastName: '',
      email: Math.random() + '@crossfeed.cisa.gov',
      userType: 'standard'
    }).save();
    organization = await Organization.create({
      name: 'test-' + Math.random(),
      rootDomains: ['test-' + Math.random()],
      ipBlocks: [],
      isPassive: false
    }).save();
    const role = await Role.create({
      role: 'user',
      approved: true,
      user,
      organization
    }).save();
  });
  test('should notify a user when new domains are found', async () => {
    const alert = await Alert.create({
      type: AlertType.NEW_DOMAIN,
      frequency: 10,
      notifiedAt: new Date(Date.now()),
      nextNotifiedAt: new Date(Date.now()),
      user
    }).save();
    const domain = await Domain.create({
      name: 'first_file_testdomain1',
      ip: '153.126.148.60',
      organization
    }).save();

    await notifier(
      {
        alertIds: [alert.id]
      },
      {} as any,
      () => void 0
    );

    expect(sendEmail).toHaveBeenCalledTimes(1);
    expect(sendEmail).toHaveBeenCalledWith(
      user.email,
      expect.stringContaining('1 new domain found'),
      expect.stringContaining('1 new domain was found')
    );

    const alertNew = (await Alert.findOne(alert.id)) as Alert;
    expect(alertNew.nextNotifiedAt!.getTime()).toBeGreaterThan(
      alert.nextNotifiedAt!.getTime()
    );
    expect(alertNew.notifiedAt!.getTime()).toBeGreaterThan(
      alert.notifiedAt!.getTime()
    );
  });

  test('should notify a user when new vulns are found', async () => {
    const alert = await Alert.create({
      type: AlertType.NEW_VULNERABILITY,
      frequency: 10,
      notifiedAt: new Date(Date.now()),
      nextNotifiedAt: new Date(Date.now()),
      user
    }).save();
    const domain = await Domain.create({
      name: 'first_file_testdomain1',
      ip: '153.126.148.60',
      organization,
      createdAt: '2000-05-03T13:58:31.634Z'
    }).save();
    await Vulnerability.create({
      domain,
      cve: 'CVE-123',
      title: '123',
      description: '123'
    }).save();
    await Vulnerability.create({
      domain,
      cve: 'CVE-124',
      title: '124',
      description: '124'
    }).save();

    await notifier(
      {
        alertIds: [alert.id]
      },
      {} as any,
      () => void 0
    );

    expect(sendEmail).toHaveBeenCalledTimes(1);
    expect(sendEmail).toHaveBeenCalledWith(
      user.email,
      expect.stringContaining('2 new vulnerabilities found'),
      expect.stringContaining('2 new vulnerabilities were found')
    );

    const alertNew = (await Alert.findOne(alert.id)) as Alert;
    expect(alertNew.nextNotifiedAt!.getTime()).toBeGreaterThan(
      alert.nextNotifiedAt!.getTime()
    );
    expect(alertNew.notifiedAt!.getTime()).toBeGreaterThan(
      alert.notifiedAt!.getTime()
    );
  });

  test('should not notify a user if domains / vulns are old', async () => {
    const alert = await Alert.create({
      type: AlertType.NEW_DOMAIN,
      frequency: 10,
      notifiedAt: new Date(Date.now()),
      nextNotifiedAt: new Date(Date.now()),
      user
    }).save();
    const alert2 = await Alert.create({
      type: AlertType.NEW_VULNERABILITY,
      frequency: 10,
      notifiedAt: new Date(Date.now()),
      nextNotifiedAt: new Date(Date.now()),
      user
    }).save();

    const domain = await Domain.create({
      name: 'first_file_testdomain1',
      ip: '153.126.148.60',
      organization,
      createdAt: '2000-05-03T13:58:31.634Z'
    }).save();
    await Vulnerability.create({
      domain,
      cve: 'CVE-123',
      title: '123',
      description: '123',
      createdAt: '2000-05-03T13:58:31.634Z'
    }).save();

    await notifier(
      {
        alertIds: [alert.id]
      },
      {} as any,
      () => void 0
    );

    expect(sendEmail).toHaveBeenCalledTimes(0);
  });

  test('should notify multiple times if multiple alerts are triggered, then should not notify a user again if alerts have already been triggered', async () => {
    const alert = await Alert.create({
      type: AlertType.NEW_DOMAIN,
      frequency: 1000,
      notifiedAt: new Date(Date.now()),
      nextNotifiedAt: new Date(Date.now()),
      user
    }).save();

    const alert2 = await Alert.create({
      type: AlertType.NEW_VULNERABILITY,
      frequency: 1000,
      notifiedAt: new Date(Date.now()),
      nextNotifiedAt: new Date(Date.now()),
      user
    }).save();

    const domain = await Domain.create({
      name: 'first_file_testdomain1',
      ip: '153.126.148.60',
      organization
    }).save();
    await Vulnerability.create({
      domain,
      cve: 'CVE-123',
      title: '123',
      description: '123'
    }).save();

    await notifier(
      {
        alertIds: [alert.id, alert2.id]
      },
      {} as any,
      () => void 0
    );

    expect(sendEmail).toHaveBeenCalledTimes(2);
    (sendEmail as jest.Mock).mockClear();

    // Should not send additional emails, because alerts only trigger every 1000 seconds

    await notifier(
      {
        alertIds: [alert.id, alert2.id]
      },
      {} as any,
      () => void 0
    );

    expect(sendEmail).toHaveBeenCalledTimes(0);
  });
});
