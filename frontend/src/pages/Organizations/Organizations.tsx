import oldClasses from './Organizations.module.scss';
import { styled } from '@mui/material/styles';
import React, { useCallback, useState } from 'react';
import { ImportExport } from 'components';
import { Organization } from 'types';
import { useAuthContext } from 'context';
import { OrganizationList } from 'components/OrganizationList';
import { Typography } from '@mui/material';

const PREFIX = 'Organizations';

const classes = {
  header: `${PREFIX}-header`,
  headerLabel: `${PREFIX}-headerLabel`
};

const Root = styled('div')(({ theme }) => ({
  [`& .${classes.header}`]: {
    background: '#F9F9F9'
  },

  [`& .${classes.headerLabel}`]: {
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

export const Organizations: React.FC = () => {
  const { user, apiGet, apiPost } = useAuthContext();
  const [organizations, setOrganizations] = useState<Organization[]>([]);

  const fetchOrganizations = useCallback(async () => {
    try {
      const rows = await apiGet<Organization[]>('/v2/organizations/');
      setOrganizations(rows);
    } catch (e) {
      console.error(e);
    }
  }, [apiGet]);

  React.useEffect(() => {
    fetchOrganizations();
  }, [apiGet, fetchOrganizations]);

  return (
    <Root>
      <div className={oldClasses.root}>
        <Typography variant="h4" mt={5} mb={3} fontWeight="medium">
          Organizations
        </Typography>
        <OrganizationList></OrganizationList>
        {user?.userType === 'globalAdmin' && (
          <>
            <ImportExport<Organization>
              name="organizations"
              fieldsToExport={[
                'name',
                'acronym',
                'rootDomains',
                'ipBlocks',
                'isPassive',
                'tags',
                'country',
                'state',
                'stateFips',
                'stateName',
                'county',
                'countyFips'
              ]}
              onImport={async (results) => {
                // TODO: use a batch call here instead.
                const createdOrganizations = [];
                for (const result of results) {
                  try {
                    createdOrganizations.push(
                      await apiPost('/organizations_upsert/', {
                        body: {
                          ...result,
                          // These fields are initially parsed as strings, so they need
                          // to be converted to arrays.
                          ipBlocks: (
                            (result.ipBlocks as unknown as string) || ''
                          ).split(','),
                          rootDomains: (
                            (result.rootDomains as unknown as string) || ''
                          ).split(','),
                          tags: ((result.tags as unknown as string) || '')
                            .split(',')
                            .map((tag) => ({
                              name: tag
                            }))
                        }
                      })
                    );
                  } catch (e: any) {
                    console.error('Error uploading Entry: ' + e);
                  }
                }
                setOrganizations(organizations.concat(...createdOrganizations));
                window.location.reload();
              }}
              getDataToExport={() =>
                organizations.map(
                  (org) =>
                    ({
                      ...org,
                      tags: org.tags.map((tag) => tag.name)
                    }) as any
                )
              }
            />
          </>
        )}
      </div>
      <br />
    </Root>
  );
};

export default Organizations;
