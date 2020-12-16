import { Handler } from 'aws-lambda';
import {
  connectToDatabase,
  Alert,
  AlertType,
  Vulnerability,
  Domain
} from '../models';
import { SCAN_SCHEMA } from '../api/scans';
import {
  In,
  MoreThan,
  IsNull,
  Not,
  SelectQueryBuilder,
  LessThanOrEqual
} from 'typeorm';
import { addSeconds } from 'date-fns';
import { sendEmail } from '../api/helpers';

// These arguments are currently used only for testing purposes.
interface Event {
  // If specified, limits notification to list of alerts.
  alertIds?: string[];
}

export const handler: Handler<Event> = async (event) => {
  await connectToDatabase();
  console.log('Running notifier...');

  const alertIds = event.alertIds || [];
  const where = alertIds.length ? { id: In(alertIds) } : {};

  const alerts = await Alert.find({
    where: {
      ...where,
      nextNotifiedAt: LessThanOrEqual(new Date(Date.now()))
    },
    relations: ['user', 'user.roles', 'user.roles.organization'],
    order: {
      nextNotifiedAt: 'DESC'
    }
  });

  for (const alert of alerts) {
    const newNotifiedAt = new Date(Date.now());

    const filterQuery = (
      qs: SelectQueryBuilder<any>
    ): SelectQueryBuilder<any> => {
      if (
        !(
          alert.user.userType === 'globalView' ||
          alert.user.userType === 'globalAdmin'
        )
      ) {
        qs.andWhere('domain."organizationId" IN (:...orgs)', {
          orgs: alert.user.roles.map((e) => e.organization.id)
        });
      }
      return qs;
    };

    if (alert.type === AlertType.NEW_DOMAIN) {
      const count = await filterQuery(
        Domain.createQueryBuilder('domain').andWhere(
          'domain.createdAt > :date',
          {
            date: alert.notifiedAt
          }
        )
      ).getCount();
      if (count > 0) {
        await sendEmail(
          alert.user.email,
          `Crossfeed - ${count} ${
            count === 1 ? 'new domain found' : 'new domains found'
          }`,
          `${count} ${
            count === 1 ? 'new domain was found' : 'new domains were found'
          } on Crossfeed. Please check ${
            process.env.FRONTEND_DOMAIN
          } to see details on the latest notifications.`
        );
      }
    } else if (alert.type === AlertType.NEW_VULNERABILITY) {
      const count = await filterQuery(
        Vulnerability.createQueryBuilder('vulnerability')
          .leftJoinAndSelect('vulnerability.domain', 'domain')
          .andWhere('vulnerability.createdAt > :date', {
            date: alert.notifiedAt
          })
      ).getCount();
      if (count > 0) {
        await sendEmail(
          alert.user.email,
          `Crossfeed - ${count} ${
            count === 1
              ? 'new vulnerability found'
              : 'new vulnerabilities found'
          }`,
          `${count} ${
            count === 1
              ? 'new vulnerability was found'
              : 'new vulnerabilities were found'
          } on Crossfeed. Please check ${
            process.env.FRONTEND_DOMAIN
          } to see details on the latest notifications.`
        );
      }
    } else {
      console.error('Invalid alert type ' + alert.type);
    }
    alert.notifiedAt = newNotifiedAt;
    alert.nextNotifiedAt = addSeconds(newNotifiedAt, alert.frequency);
    await alert.save();
  }

  console.log('Finished running notifier.');
};
