import oldClasses from './Organizations.module.scss';
import React, { useCallback, useState } from 'react';
import { ImportExport } from 'components';
import { Organization, OrganizationTag } from 'types';
import { useAuthContext } from 'context';
import { makeStyles } from '@material-ui/core';
import { OrganizationList } from 'components/OrganizationList';
import { resourceLimits } from 'worker_threads';

export const Organizations: React.FC = () => {
  const { user, apiGet, apiPost, setFeedbackMessage } = useAuthContext();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const classes = useStyles();

  const fetchOrganizations = useCallback(async () => {
    try {
      const rows = await apiGet<Organization[]>('/organizations/');
      setOrganizations(rows);
    } catch (e) {
      console.error(e);
    }
  }, [apiGet]);

  React.useEffect(() => {
    fetchOrganizations();
  }, [apiGet, fetchOrganizations]);

  return (
    <div>
      <div className={classes.header}>
        <h1 className={classes.headerLabel}>Organizations</h1>
      </div>
      <div className={oldClasses.root}>
        <OrganizationList></OrganizationList>
        {user?.userType === 'globalAdmin' && (
          <>
            <ImportExport<Organization>
              name="organizations"
              fieldsToExport={[
                'name',
                'rootDomains',
                'ipBlocks',
                'isPassive',
                'tags'
              ]}
              onImport={async (results) => {
                const createdOrganizations = [];
                // TODO: use a batch call here instead.
                // format the results objects first
                for (const result of results) {
                  result.ipBlocks = (
                    (result.ipBlocks as unknown as string) || ''
                  ).split(',');
                  result.rootDomains = (
                    (result.rootDomains as unknown as string) || ''
                  ).split(',');

                  result.tags = ((result.tags as unknown as string) || '')
                    .split(',')
                    .map((tag) => ({
                      name: tag,
                      id: '',
                      organizations: [],
                      scans: []
                    }));
                }
                console.log('Org', results);

                // if results is large, break into 100-org chunks
                const chunkSize = 100;
                for (let i = 0; i < results.length; i += chunkSize) {
                  const chunk = results.slice(i, i + chunkSize);
                  console.log('Chunk', chunk);
                  try {
                    const created_org = await apiPost('/organizations/', {
                      body: chunk
                    });
                    createdOrganizations.push(created_org);
                  } catch (e: any) {
                    setFeedbackMessage({
                      message: 'Error Importing Organization Data',
                      type: 'error'
                    });
                    break;
                  }
                  // do whatever
                }

                setOrganizations(organizations.concat(...createdOrganizations));
              }}
              getDataToExport={() =>
                organizations.map(
                  (org) =>
                    ({
                      ...org,
                      tags: org.tags.map((tag) => tag.name)
                    } as any)
                )
              }
            />
          </>
        )}
      </div>
    </div>
  );
};

const useStyles = makeStyles((theme) => ({
  header: {
    background: '#F9F9F9'
  },
  headerLabel: {
    margin: 0,
    paddingTop: '1.5rem',
    paddingBottom: '1rem',
    marginLeft: '15%',
    fontWeight: 500,
    fontStyle: 'normal',
    fontSize: '24px',
    color: '#07648D'
  }
}));

export default Organizations;
