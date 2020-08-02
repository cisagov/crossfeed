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
  const organizationId = event.queryStringParameters?.organizationId;

  if (!isOrgAdmin(event, organizationId)) {
    return {
      statusCode: 200,
      body: JSON.stringify({})
    };
  }

  await connectToDatabase();

  let alerts: Alerts = {
    pendingDomains: null
  };

  const numPendingDomains = await Domain.count({
    where: {
      organization: {
        id: organizationId
      },
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
    body: JSON.stringify(alerts)
  };
});
