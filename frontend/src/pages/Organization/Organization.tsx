import React, { useEffect, useState, useCallback } from 'react';
import { Link, Route, useParams, Switch } from 'react-router-dom';
import { useAuthContext } from 'context';
import oldClasses from './styles.module.scss';
import {
  Organization as OrganizationType,
  Role,
  ScanTask,
  User,
  Scan,
  ScanSchema,
  OrganizationTag
} from 'types';
import { Column } from 'react-table';
import { Subnav, Table } from 'components';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { Label, TextInput, Dropdown } from '@trussworks/react-uswds';
import {
  Chip,
  makeStyles,
  Switch as SwitchInput,
  Button,
  TextField,
  Paper,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle
} from '@material-ui/core';
import { ChevronRight } from '@material-ui/icons';
import { Autocomplete, createFilterOptions } from '@material-ui/lab';

interface Errors extends Partial<OrganizationType> {
  global?: string;
}

interface AutocompleteType extends Partial<OrganizationTag> {
  title?: string;
}

export const Organization: React.FC = () => {
  const {
    apiGet,
    apiPut,
    apiPost,
    user,
    setFeedbackMessage
  } = useAuthContext();
  const { organizationId } = useParams<{ organizationId: string }>();
  const [organization, setOrganization] = useState<OrganizationType>();
  const [tags, setTags] = useState<AutocompleteType[]>([]);
  const [userRoles, setUserRoles] = useState<Role[]>([]);
  const [scanTasks, setScanTasks] = useState<ScanTask[]>([]);
  const [scans, setScans] = useState<Scan[]>([]);
  const [scanSchema, setScanSchema] = useState<ScanSchema>({});
  const [errors, setErrors] = useState<Errors>({});
  const [newUserValues, setNewUserValues] = useState<{
    firstName: string;
    lastName: string;
    email: string;
    organization?: OrganizationType;
    role: string;
  }>({
    firstName: '',
    lastName: '',
    email: '',
    role: ''
  });
  const classes = useStyles();
  const [tagValue, setTagValue] = React.useState<AutocompleteType | null>(null);
  const [inputValue, setInputValue] = React.useState('');
  const [dialog, setDialog] = React.useState<{
    open: boolean;
    type?: 'rootDomains' | 'ipBlocks' | 'tags';
    label?: string;
  }>({ open: false });

  const dateAccessor = (date?: string) => {
    return !date || new Date(date).getTime() === new Date(0).getTime()
      ? 'Never'
      : `${formatDistanceToNow(parseISO(date))} ago`;
  };

  const userRoleColumns: Column<Role>[] = [
    {
      Header: 'Name',
      accessor: ({ user }) => user.fullName,
      width: 200,
      disableFilters: true,
      id: 'name'
    },
    {
      Header: 'Email',
      accessor: ({ user }) => user.email,
      width: 150,
      minWidth: 150,
      id: 'email',
      disableFilters: true
    },
    {
      Header: 'Role',
      accessor: ({ approved, role, user }) => {
        if (approved) {
          if (user.invitePending) {
            return 'Invite pending';
          } else if (role === 'admin') {
            return 'Administrator';
          } else {
            return 'Member';
          }
        }
        return 'Pending approval';
      },
      width: 50,
      minWidth: 50,
      id: 'approved',
      disableFilters: true
    },
    {
      Header: 'Action',
      id: 'action',
      Cell: ({ row }: { row: { index: number } }) => {
        const isApproved =
          !organization?.userRoles[row.index] ||
          organization?.userRoles[row.index].approved;
        return isApproved ? (
          <Link
            to="#"
            onClick={() => {
              removeUser(row.index);
            }}
          >
            <p>Remove</p>
          </Link>
        ) : (
          <Link
            to="#"
            onClick={() => {
              approveUser(row.index);
            }}
          >
            <p>Approve</p>
          </Link>
        );
      },
      disableFilters: true
    }
  ];

  const scanColumns: Column<Scan>[] = [
    {
      Header: 'Name',
      accessor: 'name',
      width: 150,
      id: 'name',
      disableFilters: true
    },
    {
      Header: 'Description',
      accessor: ({ name }) => scanSchema[name] && scanSchema[name].description,
      width: 200,
      minWidth: 200,
      id: 'description',
      disableFilters: true
    },
    {
      Header: 'Mode',
      accessor: ({ name }) =>
        scanSchema[name] && scanSchema[name].isPassive ? 'Passive' : 'Active',
      width: 150,
      minWidth: 150,
      id: 'mode',
      disableFilters: true
    },
    {
      Header: 'Action',
      id: 'action',
      maxWidth: 100,
      Cell: ({ row }: { row: { index: number } }) => {
        if (!organization) return;
        const enabled = organization.granularScans.find(
          (scan) => scan.id === scans[row.index].id
        );
        return (
          <Button
            type="button"
            onClick={() => {
              updateScan(scans[row.index], !enabled);
            }}
          >
            {enabled ? 'Disable' : 'Enable'}
          </Button>
        );
      },
      disableFilters: true
    }
  ];

  const scanTaskColumns: Column<ScanTask>[] = [
    {
      Header: 'ID',
      accessor: 'id',
      disableFilters: true
    },
    {
      Header: 'Status',
      accessor: 'status',
      disableFilters: true
    },
    {
      Header: 'Type',
      accessor: 'type',
      disableFilters: true
    },
    {
      Header: 'Name',
      accessor: ({ scan }) => scan?.name,
      disableFilters: true
    },
    {
      Header: 'Created At',
      accessor: ({ createdAt }) => dateAccessor(createdAt),
      disableFilters: true,
      disableSortBy: true
    },
    {
      Header: 'Requested At',
      accessor: ({ requestedAt }) => dateAccessor(requestedAt),
      disableFilters: true,
      disableSortBy: true
    },
    {
      Header: 'Started At',
      accessor: ({ startedAt }) => dateAccessor(startedAt),
      disableFilters: true,
      disableSortBy: true
    },
    {
      Header: 'Finished At',
      accessor: ({ finishedAt }) => dateAccessor(finishedAt),
      disableFilters: true,
      disableSortBy: true
    },
    {
      Header: 'Output',
      accessor: 'output',
      disableFilters: true
    }
  ];

  const fetchOrganization = useCallback(async () => {
    try {
      const organization = await apiGet<OrganizationType>(
        `/organizations/${organizationId}`
      );
      organization.scanTasks.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setOrganization(organization);
      setUserRoles(organization.userRoles);
      setScanTasks(organization.scanTasks);
      const tags = await apiGet<OrganizationTag[]>(`/organizations/tags`);
      setTags(tags);
    } catch (e) {
      console.error(e);
    }
  }, [apiGet, setOrganization, organizationId]);

  const fetchScans = useCallback(async () => {
    try {
      let { scans, schema } = await apiGet<{
        scans: Scan[];
        schema: ScanSchema;
      }>('/granularScans/');

      if (user?.userType !== 'globalAdmin')
        scans = scans.filter(
          (scan) =>
            scan.name !== 'censysIpv4' && scan.name !== 'censysCertificates'
        );

      setScans(scans);
      setScanSchema(schema);
    } catch (e) {
      console.error(e);
    }
  }, [apiGet, user]);

  const approveUser = async (user: number) => {
    try {
      await apiPost(
        `/organizations/${organization?.id}/roles/${organization?.userRoles[user].id}/approve`,
        {}
      );
      const copy = userRoles.map((role, id) =>
        id === user ? { ...role, approved: true } : role
      );
      setUserRoles(copy);
    } catch (e) {
      console.error(e);
    }
  };

  const removeUser = async (user: number) => {
    try {
      await apiPost(
        `/organizations/${organization?.id}/roles/${userRoles[user].id}/remove`,
        {}
      );
      const copy = userRoles.filter((_, ind) => ind !== user);
      setUserRoles(copy);
    } catch (e) {
      console.error(e);
    }
  };

  const updateOrganization = async (body: any) => {
    try {
      console.log(organization);
      const org = await apiPut('/organizations/' + organization?.id, {
        body: organization
      });
      setOrganization(org);
      setFeedbackMessage({
        message: 'Organization successfully updated',
        type: 'success'
      });
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

  const updateScan = async (scan: Scan, enabled: boolean) => {
    try {
      if (!organization) return;
      await apiPost(
        `/organizations/${organization?.id}/granularScans/${scan.id}/update`,
        {
          body: {
            enabled
          }
        }
      );
      setOrganization({
        ...organization,
        granularScans: enabled
          ? organization.granularScans.concat([scan])
          : organization.granularScans.filter(
              (granularScan) => granularScan.id !== scan.id
            )
      });
    } catch (e) {
      setErrors({
        global:
          e.status === 422
            ? 'Error when updating scan.'
            : e.message ?? e.toString()
      });
      console.error(e);
    }
  };

  useEffect(() => {
    fetchOrganization();
  }, [fetchOrganization]);

  const onInviteUserSubmit: React.FormEventHandler = async (e) => {
    e.preventDefault();
    try {
      let body = {
        firstName: newUserValues.firstName,
        lastName: newUserValues.lastName,
        email: newUserValues.email,
        organization: organization?.id,
        organizationAdmin: newUserValues.role === 'admin'
      };
      const user: User = await apiPost('/users/', {
        body
      });
      let newRole = user.roles[user.roles.length - 1];
      newRole.user = user;
      if (userRoles.find((role) => role.user.id === user.id)) {
        setUserRoles(
          userRoles.map((role) => (role.user.id === user.id ? newRole : role))
        );
      } else {
        setUserRoles(userRoles.concat([newRole]));
      }
    } catch (e) {
      setErrors({
        global:
          e.status === 422
            ? 'Error when submitting user entry.'
            : e.message ?? e.toString()
      });
      console.log(e);
    }
  };

  const onInviteUserTextChange: React.ChangeEventHandler<
    HTMLInputElement | HTMLSelectElement
  > = (e) => onInviteUserChange(e.target.name, e.target.value);

  const onInviteUserChange = (name: string, value: any) => {
    setNewUserValues((values) => ({
      ...values,
      [name]: value
    }));
  };
  const filter = createFilterOptions<AutocompleteType>();

  const ListInput = (props: {
    type: 'rootDomains' | 'ipBlocks' | 'tags';
    label: string;
  }) => {
    if (!organization) return <></>;
    const elements: (string | OrganizationTag)[] = organization[props.type];
    return (
      <div className={oldClasses.headerRow}>
        <label>{props.label}</label>
        <span>
          {elements &&
            elements.map((value: string | OrganizationTag, index: number) => (
              <Chip
                className={classes.chipDisabled}
                key={index}
                label={typeof value === 'string' ? value : value.name}
                onDelete={() => {
                  organization[props.type].splice(index, 1);
                  setOrganization({ ...organization });
                }}
              ></Chip>
            ))}
          <Chip
            label="ADD"
            variant="outlined"
            color="secondary"
            onClick={() => {
              setDialog({
                open: true,
                type: props.type,
                label: props.label
              });
            }}
          />
        </span>
      </div>
    );
  };

  if (!organization) return null;

  const views = [
    <Paper className={classes.settingsWrapper}>
      <Dialog
        open={dialog.open}
        onClose={() => setDialog({ open: false })}
        aria-labelledby="form-dialog-title"
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle id="form-dialog-title">
          Add {dialog.label && dialog.label.slice(0, -1)}
        </DialogTitle>
        <DialogContent>
          {dialog.type === 'tags' ? (
            <>
              <DialogContentText>
                Select an existing tag or add a new one.
              </DialogContentText>
              <Autocomplete
                value={tagValue}
                onChange={(event, newValue) => {
                  if (typeof newValue === 'string') {
                    setTagValue({
                      name: newValue
                    });
                  } else {
                    setTagValue(newValue);
                  }
                }}
                filterOptions={(options, params) => {
                  const filtered = filter(options, params);
                  // Suggest the creation of a new value
                  if (
                    params.inputValue !== '' &&
                    !filtered.find(
                      (tag) =>
                        tag.name?.toLowerCase() ===
                        params.inputValue.toLowerCase()
                    )
                  ) {
                    filtered.push({
                      name: params.inputValue,
                      title: `Add "${params.inputValue}"`
                    });
                  }
                  return filtered;
                }}
                selectOnFocus
                clearOnBlur
                handleHomeEndKeys
                options={tags}
                getOptionLabel={(option) => {
                  return option.name ?? '';
                }}
                renderOption={(option) => {
                  if (option.title) return option.title;
                  return option.name ?? '';
                }}
                fullWidth
                freeSolo
                renderInput={(params) => (
                  <TextField {...params} variant="outlined" />
                )}
              />
            </>
          ) : (
            <TextField
              autoFocus
              margin="dense"
              id="name"
              label={dialog.label && dialog.label.slice(0, -1)}
              type="text"
              fullWidth
              onChange={(e) => setInputValue(e.target.value)}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => setDialog({ open: false })}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              if (dialog.type && dialog.type !== 'tags') {
                if (inputValue) {
                  organization[dialog.type].push(inputValue);
                  setOrganization({ ...organization });
                }
              } else {
                if (tagValue) {
                  if (!organization.tags) organization.tags = [];
                  organization.tags.push(tagValue as any);
                  setOrganization({ ...organization });
                }
              }
              setDialog({ open: false });
              setInputValue('');
              setTagValue(null);
            }}
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>
      <ListInput label="Root Domains" type="rootDomains"></ListInput>
      <ListInput label="IP Blocks" type="ipBlocks"></ListInput>
      <ListInput label="Tags" type="tags"></ListInput>
      <div className={oldClasses.headerRow}>
        <label>Passive Mode</label>
        <span>
          <SwitchInput
            checked={organization.isPassive}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              setOrganization({
                ...organization,
                isPassive: event.target.checked
              });
            }}
            color="primary"
          />
        </span>
      </div>
      <Button variant="outlined" onClick={fetchOrganization}>
        Cancel
      </Button>{' '}
      <Button variant="contained" color="primary" onClick={updateOrganization}>
        Save
      </Button>
    </Paper>,
    <>
      <Table<Role> columns={userRoleColumns} data={userRoles} />
      <h2>Invite a user</h2>
      <form onSubmit={onInviteUserSubmit} className={oldClasses.form}>
        {errors.global && <p className={oldClasses.error}>{errors.global}</p>}
        <Label htmlFor="firstName">First Name</Label>
        <TextInput
          required
          id="firstName"
          name="firstName"
          className={oldClasses.textField}
          type="text"
          value={newUserValues.firstName}
          onChange={onInviteUserTextChange}
        />
        <Label htmlFor="lastName">Last Name</Label>
        <TextInput
          required
          id="lastName"
          name="lastName"
          className={oldClasses.textField}
          type="text"
          value={newUserValues.lastName}
          onChange={onInviteUserTextChange}
        />
        <Label htmlFor="email">Email</Label>
        <TextInput
          required
          id="email"
          name="email"
          className={oldClasses.textField}
          type="text"
          value={newUserValues.email}
          onChange={onInviteUserTextChange}
        />
        <Label htmlFor="role">Organization Role</Label>
        <Dropdown
          required
          id="role"
          name="role"
          className={oldClasses.textField}
          onChange={onInviteUserTextChange}
          value={newUserValues.role}
        >
          <option key="standard" value="standard">
            Standard
          </option>
          <option key="admin" value="admin">
            Administrator
          </option>
        </Dropdown>
        <br></br>
        <Button type="submit" color="primary">
          Invite User
        </Button>
      </form>
    </>,
    <>
      <Table<Scan> columns={scanColumns} data={scans} fetchData={fetchScans} />
      <h2>Organization Scan History</h2>
      <Table<ScanTask> columns={scanTaskColumns} data={scanTasks} />
    </>
  ];

  return (
    <div>
      <div className={classes.header}>
        <h1 className={classes.headerLabel}>
          <Link
            to="/organizations"
            style={{
              textDecoration: 'none',
              color: '#C9C9C9'
            }}
          >
            Organizations
          </Link>
          <ChevronRight
            style={{
              verticalAlign: 'middle',
              lineHeight: '100%',
              fontSize: '26px'
            }}
          ></ChevronRight>
          <span style={{ color: '#07648D' }}>{organization.name}</span>
        </h1>
        <Subnav
          items={[
            {
              title: 'Settings',
              path: `/organizations/${organizationId}`,
              exact: true
            },
            {
              title: 'Members',
              path: `/organizations/${organizationId}/members`
            },
            { title: 'Scans', path: `/organizations/${organizationId}/scans` }
          ]}
          styles={{
            background: '#F9F9F9'
          }}
        ></Subnav>
      </div>
      <div className={oldClasses.root}>
        <Switch>
          <Route
            path="/organizations/:organizationId"
            exact
            render={() => views[0]}
          />
          <Route
            path="/organizations/:organizationId/members"
            render={() => views[1]}
          />
          <Route
            path="/organizations/:organizationId/scans"
            render={() => views[2]}
          />
        </Switch>
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
    paddingBottom: '0.5rem',
    marginLeft: '15%',
    color: '#C9C9C9',
    fontWeight: 500,
    fontStyle: 'normal',
    fontSize: '24px'
  },
  chipDisabled: {
    background: '#C4C4C4',
    color: 'white',
    marginRight: '10px'
  },
  settingsWrapper: {
    boxSizing: 'border-box',
    border: '0px',
    boxShadow: 'none',
    borderRadius: '0px',
    padding: '25px',
    maxWidth: '900px',
    margin: '0 auto'
  }
}));

export default Organization;
