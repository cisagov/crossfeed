import React, { useEffect, useState } from 'react';
import { useAuthContext } from 'context';
import { Link } from 'react-router-dom';
import { Alert, Button } from '@trussworks/react-uswds';
import classes from './Alerts.module.css';

// Sync with backend type
interface Alerts {
  pendingDomains: {
    count: number;
  } | null;
}

const Alerts = () => {
  const { user, currentOrganization, apiGet } = useAuthContext();
  const [alerts, setAlerts] = useState<Alerts | undefined>(undefined);

  useEffect(() => {
    if (!user || !currentOrganization) return;
    (async () => {
      const result = await apiGet<Alerts>(
        `/alerts?organizationId=${currentOrganization.id}`
      );
      setAlerts(result);
    })();
  }, [user, currentOrganization]);
  if (!alerts) {
    return null;
  }
  return (
    <div className={classes.root}>
      {alerts.pendingDomains && (
        <Alert
          type="info"
          heading="New subdomains found"
          cta={
            <Link to="/organization/review-domains">
              <Button type="button" outline>
                Review domains
              </Button>
            </Link>
          }
        >
          {alerts.pendingDomains.count} new subdomains have been found for your
          organization. Please review and confirm that you would like these
          domains to remain on Crossfeed.
        </Alert>
      )}
    </div>
  );
};

export default Alerts;
