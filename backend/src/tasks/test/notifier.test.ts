import { handler as notifier } from '../notifier';
import { connectToDatabase, Scan, Alert, AlertType, Organization, ScanTask, User, Domain, Role } from '../../models';

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
            userType: 'globalAdmin'
        }).save();
        organization = await Organization.create({
            name: 'test-' + Math.random(),
            rootDomains: ['test-' + Math.random()],
            ipBlocks: [],
            isPassive: false
        }).save();
        const role = await Role.create({
            role: 'user',
            approved: false,
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
        });
        const domain = await Domain.create({
            name: 'first_file_testdomain1',
            ip: '153.126.148.60',
            organization
        });

        await notifier(
            {
                alertIds: [alert.id]
            },
            {} as any,
            () => void 0
        );

        expect(sendEmail).toHaveBeenCalledTimes(1);
        // expect(runCommand).toHaveBeenCalledWith(
        //     expect.objectContaining({
        //         organizationId: organization.id,
        //         scanId: scan.id,
        //         scanName: scan.name
        //     })
        // );

        const alertNew = await Alert.findOne(alert.id) as Alert;
        expect(alertNew.nextNotifiedAt!.getTime()).toBeGreaterThan(alert.nextNotifiedAt!.getTime());
    });

});
