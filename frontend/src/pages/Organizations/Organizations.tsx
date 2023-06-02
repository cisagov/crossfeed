import oldClasses from './Organizations.module.scss';
import React, { useCallback, useState } from 'react';
import { ImportExport } from 'components';
import { Organization } from 'types';
import { useAuthContext } from 'context';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  makeStyles
} from '@material-ui/core';
import { OrganizationList } from 'components/OrganizationList';

export const Organizations: React.FC = () => {
  const { user, apiGet, apiPost } = useAuthContext();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogText, setDialogText] = useState('');
  const [successCount, setSuccessCount] = useState(0);
  const [failureCount, setFailureCount] = useState(0);
  const classes = useStyles();

  const handleClose = () => {
    window.location.reload();
    setDialogOpen(false);
  };

  const setWarningMessage = () => {
    setDialogText('There was an error');
  };

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
                // TODO: use a batch call here instead.
                const createdOrganizations = [];
                for (const result of results) {
                  try {
                    createdOrganizations.push(
                      await apiPost('/organizations/', {
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
                    setSuccessCount((e) => e + 1);
                  } catch (e: any) {
                    console.error('Error uploading Entry: ' + e);
                    setFailureCount((e) => e + 1);
                    setWarningMessage();
                  }
                }
                if (!dialogText.includes('error')) {
                  setDialogText('All Organizations Successfully Entered');
                }
                setDialogOpen(true);
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
      <Dialog open={dialogOpen} onClose={handleClose}>
        <DialogTitle id="alert-dialog-title">
          {'Organization Upload Feedback:'}
        </DialogTitle>
        <DialogContent>
          <div> Successful uploads: {successCount}</div>
          <div> Failed uploads: {failureCount}</div>
          <div> {dialogText} </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} autoFocus>
            Close
          </Button>
        </DialogActions>
      </Dialog>
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
