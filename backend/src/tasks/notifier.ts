import { Handler } from 'aws-lambda';
import {
  connectToDatabase,
  Scan,
  Organization,
  ScanTask,
  Alert,
  Vulnerability,
  Domain
} from '../models';
import { SCAN_SCHEMA } from '../api/scans';
import { In, MoreThan, IsNull, Not, SelectQueryBuilder } from 'typeorm';
import { addSeconds } from 'date-fns';

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
      nextNotifiedAt: MoreThan(new Date(Date.now()))
    },
    relations: ['user', 'user.roles'],
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

    if (alert.type === 'newDomain') {
      const cnt = await filterQuery(
        Domain.createQueryBuilder('domain').andWhere(
          'domain.createdAt > :date',
          {
            date: alert.notifiedAt
          }
        )
      ).getCount();
      console.warn('domains found', cnt);
    } else if (alert.type === 'newVulnerability') {
      const cnt = await filterQuery(
        Vulnerability.createQueryBuilder('vulnerability')
          .leftJoinAndSelect('vulnerability.domain', 'domain')
          .andWhere('vulnerability.createdAt > :date', {
            date: alert.notifiedAt
          })
      ).getCount();
      console.warn('vulns found', cnt);
    } else {
      console.error('Invalid alert type ' + alert.type);
    }
    // TODO: send email
    alert.notifiedAt = newNotifiedAt;
    alert.nextNotifiedAt = addSeconds(newNotifiedAt, alert.frequency);
  }

  console.log('Finished running notifier.');
};
