import React, { useEffect, useState, useCallback } from 'react';
import * as OrganizationStyles from './style';
import { Link, Route, useParams, Switch } from 'react-router-dom';
import { useAuthContext } from 'context';
import {
  Organization as OrganizationType,
  Role,
  ScanTask,
  User,
  Scan,
  ScanSchema,
  OrganizationTag,
  PendingDomain
} from 'types';
import { Column } from 'react-table';
import { Subnav, Table } from 'components';
// @ts-ignore:next-line
import { formatDistanceToNow, parseISO } from 'date-fns';
import {
  Chip,
  Switch as SwitchInput,
  Button,
  TextField,
  Paper,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup
} from '@mui/material';
import { ChevronRight, ControlPoint } from '@mui/icons-material';
import { Autocomplete } from '@mui/material';
import { createFilterOptions } from '@mui/material/useAutocomplete';
import { OrganizationList } from 'components/OrganizationList';

interface AutocompleteType extends Partial<OrganizationTag> {
  title?: string;
}

export const Organization: React.FC = () => {
  const { apiGet, apiPut, apiPost, user, setFeedbackMessage } =
    useAuthContext();
  const { organizationId } = useParams<{ organizationId: string }>();
  const [organization, setOrganization] = useState<OrganizationType>();
  const [tags, setTags] = useState<AutocompleteType[]>([]);
  const [userRoles, setUserRoles] = useState<Role[]>([]);
  const [scanTasks, setScanTasks] = useState<ScanTask[]>([]);
  const [scans, setScans] = useState<Scan[]>([]);
  const [scanSchema, setScanSchema] = useState<ScanSchema>({});
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

  const [tagValue, setTagValue] = React.useState<AutocompleteType | null>(null);
  const [inputValue, setInputValue] = React.useState('');
  const [dialog, setDialog] = React.useState<{
    open: boolean;
    type?: 'rootDomains' | 'ipBlocks' | 'tags';
    label?: string;
    stage?: number;
    domainVerificationStatusMessage?: string;
  }>({ open: false });

  const dateAccessor = (date?: string) => {
    return !date || new Date(date).getTime() === new Date(0).getTime()
      ? 'None'
      : `${formatDistanceToNow(parseISO(date))} ago`;
  };

  const organizationClasses = OrganizationStyles.organizationClasses;
  const Root = OrganizationStyles.OrganizationRoot;

  const userRoleColumns: Column<Role>[] = [
    {
      Header: 'Name',
      accessor: ({ user }) => user?.fullName,
      width: 200,
      disableFilters: true,
      id: 'name'
    },
    {
      Header: 'Email',
      accessor: ({ user }) => user?.email,
      width: 150,
      minWidth: 150,
      id: 'email',
      disableFilters: true
    },
    {
      Header: 'Role',
      accessor: ({ approved, role, user }) => {
        if (approved) {
          if (user?.invitePending) {
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
      Header: () => {
        return (
          <Root style={{ justifyContent: 'flex-center' }}>
            <Button color="secondary" onClick={() => setDialog({ open: true })}>
              <ControlPoint style={{ marginRight: '10px' }}></ControlPoint>
              Add member
            </Button>
          </Root>
        );
      },
      id: 'action',
      Cell: ({ row }: { row: { index: number } }) => {
        const isApproved =
          !organization?.userRoles[row.index] ||
          organization?.userRoles[row.index].approved;
        return (
          <>
            {isApproved ? (
              <Button
                onClick={() => {
                  removeUser(row.index);
                }}
                color="secondary"
              >
                <p>Remove</p>
              </Button>
            ) : (
              <Button
                onClick={() => {
                  approveUser(row.index);
                }}
                color="secondary"
              >
                <p>Approve</p>
              </Button>
            )}
          </>
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
        if (!organization) return null;
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
      const response = await apiGet<{
        scans: Scan[];
        schema: ScanSchema;
      }>('/granularScans/');
      let { scans } = response;
      const { schema } = response;

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
        { body: {} }
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
        { body: {} }
      );
      const copy = userRoles.filter((_, ind) => ind !== user);
      setUserRoles(copy);
    } catch (e) {
      console.error(e);
    }
  };

  const updateOrganization = async (body: any) => {
    try {
      const org = await apiPut('/organizations/' + organization?.id, {
        body: organization
      });
      setOrganization(org);
      setFeedbackMessage({
        message: 'Organization successfully updated',
        type: 'success'
      });
    } catch (e: any) {
      setFeedbackMessage({
        message:
          e.status === 422
            ? 'Error updating organization'
            : e.message ?? e.toString(),
        type: 'error'
      });
      console.error(e);
    }
  };

  const updateOrganizationV2 = async (body: any) => {
    try {
      const org = await apiPut('/organizations/v2/' + organization?.id, {
        body: organization
      });
      setOrganization(org);
      setFeedbackMessage({
        message: 'Organization successfully updated',
        type: 'success'
      });
    } catch (e: any) {
      setFeedbackMessage({
        message:
          e.status === 422
            ? 'Error updating organization'
            : e.message ?? e.toString(),
        type: 'error'
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
    } catch (e: any) {
      setFeedbackMessage({
        message:
          e.status === 422 ? 'Error updating scan' : e.message ?? e.toString(),
        type: 'error'
      });
      console.error(e);
    }
  };

  const initiateDomainVerification = async (domain: string) => {
    try {
      if (!organization) return;
      const pendingDomains: PendingDomain[] = await apiPost(
        `/organizations/${organization?.id}/initiateDomainVerification`,
        {
          body: { domain }
        }
      );
      setOrganization({ ...organization, pendingDomains });
    } catch (e: any) {
      setFeedbackMessage({
        message:
          e.status === 422
            ? 'Error creating domain'
            : e.message ?? e.toString(),
        type: 'error'
      });
      console.error(e);
    }
  };

  const checkDomainVerification = async (domain: string) => {
    try {
      if (!organization) return;
      const resp: { success: boolean; organization?: OrganizationType } =
        await apiPost(
          `/organizations/${organization?.id}/checkDomainVerification`,
          {
            body: { domain }
          }
        );
      if (resp.success && resp.organization) {
        setOrganization(resp.organization);
        setDialog({ open: false });
        setFeedbackMessage({
          message: 'Domain ' + inputValue + ' successfully verified!',
          type: 'success'
        });
      } else {
        setDialog({
          ...dialog,
          domainVerificationStatusMessage:
            'Record not yet found. Note that DNS records may take up to 72 hours to propagate. You can come back later to check the verification status.'
        });
      }
    } catch (e: any) {
      setFeedbackMessage({
        message:
          e.status === 422
            ? 'Error verifying domain'
            : e.message ?? e.toString(),
        type: 'error'
      });
      console.error(e);
    }
  };

  useEffect(() => {
    fetchOrganization();
  }, [fetchOrganization]);

  const onInviteUserSubmit = async () => {
    try {
      const body = {
        firstName: newUserValues.firstName,
        lastName: newUserValues.lastName,
        email: newUserValues.email,
        organization: organization?.id,
        organizationAdmin: newUserValues.role === 'admin'
      };
      const user: User = await apiPost('/users/', {
        body
      });
      const newRole = user.roles[user.roles.length - 1];
      newRole.user = user;
      if (userRoles.find((role) => role.user.id === user.id)) {
        setUserRoles(
          userRoles.map((role) => (role.user.id === user.id ? newRole : role))
        );
      } else {
        setUserRoles(userRoles.concat([newRole]));
      }
    } catch (e: any) {
      setFeedbackMessage({
        message:
          e.status === 422 ? 'Error inviting user' : e.message ?? e.toString(),
        type: 'error'
      });
      console.log(e);
    }
  };

  const onInviteUserTextChange: React.ChangeEventHandler<
    HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
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
    if (!organization) return null;
    const elements: (string | OrganizationTag)[] = organization[props.type];
    return (
      <div className={organizationClasses.headerRow}>
        <label>{props.label}</label>
        <span>
          {elements &&
            elements.map((value: string | OrganizationTag, index: number) => (
              <Chip
                color={'primary'}
                className={organizationClasses.chip}
                key={index}
                label={typeof value === 'string' ? value : value.name}
                onDelete={() => {
                  organization[props.type].splice(index, 1);
                  setOrganization({ ...organization });
                }}
              ></Chip>
            ))}
          {props.type === 'rootDomains' &&
            organization.pendingDomains.map((domain, index: number) => (
              <Chip
                className={organizationClasses.chip}
                style={{ backgroundColor: '#C4C4C4' }}
                key={index}
                label={domain.name + ' (verification pending)'}
                onDelete={() => {
                  organization.pendingDomains.splice(index, 1);
                  setOrganization({ ...organization });
                }}
                onClick={() => {
                  setInputValue(domain.name);
                  setDialog({
                    open: true,
                    type: props.type,
                    label: props.label,
                    stage: 1
                  });
                }}
              ></Chip>
            ))}
          {(props.type === 'rootDomains' ||
            user?.userType === 'globalAdmin') && (
            <Chip
              label="ADD"
              style={{ marginTop: '10px' }}
              variant="outlined"
              color="secondary"
              onClick={() => {
                setDialog({
                  open: true,
                  type: props.type,
                  label: props.label,
                  stage: 0
                });
              }}
            />
          )}
        </span>
      </div>
    );
  };

  if (!organization) return null;

  const views = [
    <Paper className={organizationClasses.settingsWrapper} key={0}>
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
                  if (typeof option === 'string') {
                    return option;
                  }
                  return (option as AutocompleteType).name ?? '';
                }}
                renderOption={(props, option) => {
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
          ) : dialog.type === 'rootDomains' && dialog.stage === 1 ? (
            <>
              <DialogContentText>
                Add the following TXT record to {inputValue}&apos;s DNS
                configuration and click Verify.
              </DialogContentText>
              <TextField
                style={{ width: '100%' }}
                value={
                  organization.pendingDomains.find(
                    (domain) => domain.name === inputValue
                  )?.token
                }
                onFocus={(event) => {
                  event.target.select();
                }}
              />
              {dialog.domainVerificationStatusMessage && (
                <>
                  <br></br>
                  <br></br>
                  <DialogContentText>
                    {dialog.domainVerificationStatusMessage}
                  </DialogContentText>
                </>
              )}
            </>
          ) : user?.userType === 'globalAdmin' ? (
            <>
              <DialogContentText>
                Separate multiple entries by commas.
              </DialogContentText>
              <TextField
                autoFocus
                margin="dense"
                id="name"
                inputProps={{ maxLength: 255 }}
                label={dialog.label && dialog.label.slice(0, -1)}
                type="text"
                fullWidth
                onChange={(e) => setInputValue(e.target.value)}
              />
            </>
          ) : dialog.type === 'rootDomains' && dialog.stage === 0 ? (
            <>
              <DialogContentText>
                In order to add a root domain, you will need to verify ownership
                of the domain.
              </DialogContentText>
              <TextField
                autoFocus
                margin="dense"
                id="name"
                label={dialog.label && dialog.label.slice(0, -1)}
                type="text"
                fullWidth
                onChange={(e) => setInputValue(e.target.value)}
              />
            </>
          ) : (
            <></>
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
              if (
                dialog.type === 'rootDomains' &&
                user?.userType !== 'globalAdmin'
              ) {
                if (dialog.stage === 0) {
                  // Start verification process
                  initiateDomainVerification(inputValue);
                  setDialog({ ...dialog, stage: 1 });
                  return;
                } else {
                  checkDomainVerification(inputValue);
                  return;
                }
              } else if (dialog.type && dialog.type !== 'tags') {
                if (inputValue) {
                  // Allow adding multiple values with a comma delimiter
                  organization[dialog.type].push(
                    ...inputValue.split(',').map((e) => e.trim())
                  );
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
            {dialog.type === 'rootDomains' && user?.userType !== 'globalAdmin'
              ? dialog.stage === 0
                ? 'Next'
                : 'Verify'
              : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
      <TextField
        value={organization.name}
        disabled
        variant="filled"
        InputProps={{
          className: organizationClasses.orgName
        }}
      ></TextField>
      <ListInput label="Root Domains" type="rootDomains"></ListInput>
      <ListInput label="IP Blocks" type="ipBlocks"></ListInput>
      {user?.userType === 'globalAdmin' && (
        <ListInput label="Tags" type="tags"></ListInput>
      )}
      <div className={organizationClasses.headerRow}>
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
      <div className={organizationClasses.buttons}>
        <Link to={`/organizations`}>
          <Button
            variant="outlined"
            style={{ marginRight: '10px', color: '#565C65' }}
          >
            Cancel
          </Button>
        </Link>
        <Button
          variant="contained"
          onClick={updateOrganization}
          style={{ background: '#565C65', color: 'white' }}
        >
          Save
        </Button>
      </div>
    </Paper>,
    <React.Fragment key={1}>
      <Table<Role> columns={userRoleColumns} data={userRoles} />
      <Dialog
        open={dialog.open}
        onClose={() => setDialog({ open: false })}
        aria-labelledby="form-dialog-title"
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle id="form-dialog-title">Add Member</DialogTitle>
        <DialogContent>
          <p style={{ color: '#3D4551' }}>
            Organization members can view Organization-specific vulnerabilities,
            domains, and notes. Organization administrators can additionally
            manage members and update the organization.
          </p>
          <TextField
            margin="dense"
            id="firstName"
            name="firstName"
            inputProps={{ maxLength: 50 }}
            label="First Name"
            type="text"
            fullWidth
            value={newUserValues.firstName}
            onChange={onInviteUserTextChange}
            variant="filled"
            InputProps={{
              className: organizationClasses.textField
            }}
          />
          <TextField
            margin="dense"
            id="lastName"
            name="lastName"
            label="Last Name"
            inputProps={{ maxLength: 50 }}
            type="text"
            fullWidth
            value={newUserValues.lastName}
            onChange={onInviteUserTextChange}
            variant="filled"
            InputProps={{
              className: organizationClasses.textField
            }}
          />
          <TextField
            margin="dense"
            id="email"
            name="email"
            label="Email"
            inputProps={{ maxLength: 100 }}
            type="text"
            fullWidth
            value={newUserValues.email}
            onChange={onInviteUserTextChange}
            variant="filled"
            InputProps={{
              className: organizationClasses.textField
            }}
          />
          <br></br>
          <br></br>
          <FormLabel component="legend">Role</FormLabel>
          <RadioGroup
            aria-label="role"
            name="role"
            value={newUserValues.role}
            onChange={onInviteUserTextChange}
          >
            <FormControlLabel
              value="standard"
              control={<Radio color="primary" />}
              label="Standard"
            />
            <FormControlLabel
              value="admin"
              control={<Radio color="primary" />}
              label="Administrator"
            />
          </RadioGroup>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => setDialog({ open: false })}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={async () => {
              onInviteUserSubmit();
              setDialog({ open: false });
            }}
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </React.Fragment>,
    <React.Fragment key={2}>
      <OrganizationList parent={organization}></OrganizationList>
    </React.Fragment>,
    <React.Fragment key={3}>
      <Table<Scan> columns={scanColumns} data={scans} fetchData={fetchScans} />
      <h2>Organization Scan History</h2>
      <Table<ScanTask> columns={scanTaskColumns} data={scanTasks} />
    </React.Fragment>
  ];

  let navItems = [
    {
      title: 'Settings',
      path: `/organizations/${organizationId}`,
      exact: true
    },
    {
      title: 'Members',
      path: `/organizations/${organizationId}/members`
    }
  ];

  if (!organization.parent) {
    navItems = navItems.concat([
      // { title: 'Teams', path: `/organizations/${organizationId}/teams` },
      // { title: 'Scans', path: `/organizations/${organizationId}/scans` }
    ]);
  }

  return (
    <div>
      <div className={organizationClasses.header}>
        <h1 className={organizationClasses.headerLabel}>
          <Link to="/organizations">Organizations</Link>
          {organization.parent && (
            <>
              <ChevronRight></ChevronRight>
              <Link to={'/organizations/' + organization.parent.id}>
                {organization.parent.name}
              </Link>
            </>
          )}
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
          items={navItems}
          styles={{
            background: '#F9F9F9'
          }}
        ></Subnav>
      </div>
      <Root className={organizationClasses.root}>
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
            path="/organizations/:organizationId/teams"
            render={() => views[2]}
          />
          <Route
            path="/organizations/:organizationId/scans"
            render={() => views[3]}
          />
        </Switch>
      </Root>
    </div>
  );
};

export default Organization;
