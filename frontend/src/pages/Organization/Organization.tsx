import React, { useState }from 'react';
import * as OrganizationStyles from './style';
import * as authContextOrg from './authContextOrg';
import { useParams } from 'react-router-dom';
import { scanColumns } from './Columns/scanColumns';
import { scanTaskColumns } from './Columns/scanTaskColumns';
import { userRoleColumns } from './Columns/userRoleColumns';
import { onInviteUserSubmit, onInviteUserTextChange } from './userActions';
import { initiateDomainVerification, checkDomainVerification } from './domainVerifications';
import { fetchScans, updateOrganization } from './FetchAndUpdate';
import { Link, Route, Switch } from 'react-router-dom';
import {
  Organization as OrganizationType, 
  OrganizationTag,
  Scan,
  ScanSchema,
  ScanTask,
  Role } from 'types';
import { Subnav, Table } from 'components';
// @ts-ignore:next-line
// import { formatDistanceToNow, parseISO } from 'date-fns';
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
import { ChevronRight } from '@mui/icons-material';
import { Autocomplete } from '@mui/material';
import { createFilterOptions } from '@mui/material/useAutocomplete';
import { OrganizationList } from 'components/OrganizationList';



const organizationId  = useParams<{ organizationId: string }>();
const [organization, setOrganization] = useState<OrganizationType>();
const [tags, setTags] = useState<AutocompleteType[]>([]);
const [userRoles, setUserRoles] = useState<Role[]>([]);
const [scans, setScans] = useState<Scan[]>([]);
const [scanTasks, setScanTasks] = useState<ScanTask[]>([]);
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



const organizationClasses = OrganizationStyles.organizationClasses;
const OrganizationRoot = OrganizationStyles.OrganizationRoot;



interface AutocompleteType extends Partial<OrganizationTag> {
  title?: string;
}

export const Organization: React.FC = () => {  
  // useEffect(() => {
  //   fetchOrganization();
  // }, [fetchOrganization]);
  const user = authContextOrg.user;

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
      <OrganizationRoot className={organizationClasses.root}>
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
      </OrganizationRoot>
    </div>
  );
};

export default Organization;
