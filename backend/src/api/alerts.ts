import { Organization, connectToDatabase, Domain } from '../models';
import { wrapHandler, NotFound } from './helpers';
import { isOrgAdmin } from './auth';
import { In } from 'typeorm';

// Sync with frontend type
interface Alerts {
  pendingDomains: {
    count: number;
  } | null;
}

export const get = wrapHandler(async (event) => {
  const id = event.queryStringParameters?.organizationId;

  if (!isOrgAdmin(event, id)) {
    console.error(id);
    return {
      statusCode: 200,
      body: JSON.stringify({})
    };
  }

  await connectToDatabase();
  const organization = await Organization.findOne(id, {
    loadRelationIds: {
      relations: ['domains']
    }
  });

  if (!organization) {
    return NotFound;
  }

  let alerts: Alerts = {
    pendingDomains: null
  };

  const numPendingDomains = await Domain.count({
    where: {
      id: In(organization.domains),
      status: 'pending'
    }
  });
  if (numPendingDomains > 0) {
    alerts.pendingDomains = {
      count: numPendingDomains
    };
  }

  return {
    statusCode: 200,
    body: alerts ? JSON.stringify(alerts) : ''
  };
});
