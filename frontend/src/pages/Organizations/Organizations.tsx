import oldClasses from './Organizations.module.scss';
import React, { useCallback, useState } from 'react';
import { ModalContainer, Overlay, Modal } from '@trussworks/react-uswds';
import { ImportExport } from 'components';
import { Add } from '@material-ui/icons';
import { Organization } from 'types';
import { useAuthContext } from 'context';
import { OrganizationForm } from 'components/OrganizationForm';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid,
  makeStyles,
  Paper,
  TextField,
  Button
} from '@material-ui/core';
import { useHistory } from 'react-router-dom';
import { Autocomplete } from '@material-ui/lab';

interface Errors extends Partial<Organization> {
  global?: string;
}

export const Organizations: React.FC = () => {
  const { user, apiGet, apiPost, apiDelete } = useAuthContext();
  const [showModal, setShowModal] = useState<Boolean>(false);
  const [selectedRow, setSelectedRow] = useState<number>(0);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const classes = useStyles();
  const history = useHistory();
  const [errors, setErrors] = useState<Errors>({});
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchOrganizations = useCallback(async () => {
    try {
      let rows = await apiGet<Organization[]>('/organizations/');
      setOrganizations(rows);
    } catch (e) {
      console.error(e);
    }
  }, [apiGet]);

  const deleteRow = async (index: number) => {
    try {
      let row = organizations[index];
      await apiDelete(`/organizations/${row.id}`);
      setOrganizations(
        organizations.filter((organization) => organization.id !== row.id)
      );
    } catch (e) {
      setErrors({
        global:
          e.status === 422
            ? 'Unable to delete organization'
            : e.message ?? e.toString()
      });
      console.log(e);
    }
  };

  const onSubmit = async (body: Object) => {
    try {
      const org = await apiPost('/organizations/', {
        body
      });
      setOrganizations(organizations.concat(org));
    } catch (e) {
      setErrors({
        global:
          e.status === 422
            ? 'Error when submitting organization entry.'
            : e.message ?? e.toString()
      });
      console.error(e);
    }
  };

  React.useEffect(() => {
    document.addEventListener('keyup', (e) => {
      //Escape
      if (e.keyCode === 27) {
        setShowModal(false);
      }
    });
    fetchOrganizations();
  }, [apiGet, fetchOrganizations]);

  return (
    <div>
      <div className={classes.header}>
        <h1 className={classes.headerLabel}>Organizations</h1>
      </div>
      <div className={oldClasses.root}>
        <Grid
          container
          spacing={2}
          style={{ margin: '0 auto', marginTop: '1rem', maxWidth: '1000px' }}
        >
          <Grid item>
            <Paper
              elevation={0}
              classes={{ root: classes.cardRoot }}
              style={{ border: '1px dashed #C9C9C9', textAlign: 'center' }}
              onClick={() => setDialogOpen(true)}
            >
              <h1>Create New Organization</h1>
              <p>
                <Add></Add>
              </p>
            </Paper>
          </Grid>
          {organizations.map((org) => (
            <Grid item key={org.id}>
              <Paper
                elevation={0}
                classes={{ root: classes.cardRoot }}
                onClick={() => {
                  history.push('/organizations/' + org.id);
                }}
              >
                <h1>{org.name}</h1>
                <p>{org.userRoles ? org.userRoles.length : 0} members</p>
                {org.tags && org.tags.length > 0 && (
                  <p>Tags: {org.tags.map((tag) => tag.name).join(', ')}</p>
                )}
              </Paper>
            </Grid>
          ))}
        </Grid>
        <OrganizationForm
          onSubmit={onSubmit}
          open={dialogOpen}
          setOpen={setDialogOpen}
          type="create"
        ></OrganizationForm>
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
                let createdOrganizations = [];
                for (let result of results) {
                  createdOrganizations.push(
                    await apiPost('/organizations/', {
                      body: {
                        ...result,
                        // These fields are initially parsed as strings, so they need
                        // to be converted to arrays.
                        ipBlocks: (
                          ((result.ipBlocks as unknown) as string) || ''
                        ).split(','),
                        rootDomains: (
                          ((result.rootDomains as unknown) as string) || ''
                        ).split(','),
                        tags: (((result.tags as unknown) as string) || '')
                          .split(',')
                          .map((tag) => ({
                            name: tag
                          }))
                      }
                    })
                  );
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
  },
  cardRoot: {
    cursor: 'pointer',
    boxSizing: 'border-box',
    border: '2px solid #DCDEE0',
    height: 150,
    width: 200,
    borderRadius: '5px',
    padding: '1rem',
    color: '#3D4551',
    '& h1': {
      fontSize: '20px',
      margin: 0
    },
    '& p': {
      fontSize: '14px'
    }
  }
}));

export default Organizations;
