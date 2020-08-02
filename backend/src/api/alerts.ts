import { connectToDatabase, Domain } from '../models';
import { wrapHandler } from './helpers';
import { isOrgAdmin } from './auth';

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

  const alerts: Alerts = {
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
