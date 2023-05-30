import React, { useCallback, useState } from 'react';
import { Organization, OrganizationTag } from 'types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  Switch,
  Button,
  FormControlLabel
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { Autocomplete } from '@material-ui/lab';
import { useAuthContext } from 'context';

export interface OrganizationFormValues {
  parentId: any;
  name: string;
  rootDomains: string;
  ipBlocks: string;
  isPassive: boolean;
  tags: OrganizationTag[];
  organizations: Organization[];
}

export const OrganizationForm: React.FC<{
  organization?: Organization;
  open: boolean;
  setOpen: (open: boolean) => void;
  onSubmit: (values: Object) => Promise<void>;
  type: string;
  parent?: Organization;
  organizations: Organization[];
}> = ({ organization, onSubmit, open, setOpen, parent, organizations }) => {
  const defaultValues = () => ({
    name: organization ? organization.name : '',
    rootDomains: organization ? organization.rootDomains.join(', ') : '',
    ipBlocks: organization ? organization.ipBlocks.join(', ') : '',
    isPassive: organization ? organization.isPassive : false,
    tags: [],
    organizations: [],
    parentId: undefined
  });

  const [values, setValues] = useState<OrganizationFormValues>(defaultValues);
  const classes = useStyles();
  const { apiGet, currentOrganization, showAllOrganizations } =
    useAuthContext();

  const [allOrganizations, setAllOrganizations] = useState<Organization[]>([]);

  const fetchAllOrganizations = useCallback(async () => {
    try {
      const rows = await apiGet<Organization[]>('/organizations?all=true');
      setAllOrganizations(rows);
    } catch (e) {
      console.error(e);
    }
  }, [apiGet]);

  React.useEffect(() => {
    fetchAllOrganizations();
  }, [apiGet, fetchAllOrganizations]);

  const onTextChange: React.ChangeEventHandler<
    HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
  > = (e) => onChange(e.target.name, e.target.value);

  const onChange = (name: string, value: any) => {
    setValues((values) => ({
      ...values,
      [name]: value
    }));
  };

  return (
    <Dialog
      open={open}
      onClose={() => setOpen(false)}
      aria-labelledby="form-dialog-title"
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle id="form-dialog-title">
        Create new {parent ? 'Team' : 'Organization'}
      </DialogTitle>
      <DialogContent>
        <TextField
          margin="dense"
          id="name"
          inputProps={{ maxLength: 250 }}
          name="name"
          label="Organization Name"
          type="text"
          fullWidth
          value={values.name}
          onChange={onTextChange}
        />
        <TextField
          margin="dense"
          id="rootDomains"
          name="rootDomains"
          label="Root Domains"
          type="text"
          fullWidth
          value={values.rootDomains}
          onChange={onTextChange}
        />
        <TextField
          margin="dense"
          id="ipBlocks"
          name="ipBlocks"
          label="IP Blocks"
          type="text"
          fullWidth
          value={values.ipBlocks}
          onChange={onTextChange}
        />
        {
          <>
            <div className={classes.spacing} />
            <Autocomplete
              getOptionSelected={(option, value) =>
                option.name === value.name ||
                value.name === 'Select Organization Parent'
              }
              options={allOrganizations}
              autoComplete={false}
              classes={{
                option: classes.option
              }}
              value={
                showAllOrganizations
                  ? { name: 'Select Organization Parent' }
                  : currentOrganization ?? undefined
              }
              filterOptions={(options, state) => {
                // If already selected, show all
                if (
                  options.find(
                    (option) =>
                      option.name.toLowerCase() ===
                      state.inputValue.toLowerCase()
                  )
                ) {
                  return options;
                }
                return options.filter((option) =>
                  option.name
                    .toLowerCase()
                    .includes(state.inputValue.toLowerCase())
                );
              }}
              disableClearable
              blurOnSelect
              selectOnFocus
              getOptionLabel={(option) => option.name}
              renderOption={(option) => (
                <React.Fragment>{option.name}</React.Fragment>
              )}
              onChange={(
                event: any,
                value:
                  | Organization
                  | {
                      name: string;
                    }
                  | undefined
              ) => {
                console.log(value);
                if (typeof value === 'string') {
                  console.log('String');
                } else if (typeof value !== 'string') {
                  if (typeof value !== 'undefined') {
                    setValues((values) => ({
                      ...values,
                      parentId: value
                    }));
                  }
                }
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  fullWidth
                  label="Parent Organization"
                  inputProps={{
                    ...params.inputProps,
                    id: 'autocomplete-input',
                    autoComplete: 'new-password' // disable autocomplete and autofill
                  }}
                />
              )}
            />
          </>
        }
        <br></br>
        <br></br>
        <FormControlLabel
          control={
            <Switch
              checked={values.isPassive}
              name="isPassive"
              onChange={(e) => {
                onChange(e.target.name, e.target.checked);
              }}
              color="primary"
            />
          }
          label="Passive Mode"
        />
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" onClick={() => setOpen(false)}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={async () => {
            await onSubmit({
              rootDomains:
                values.rootDomains === ''
                  ? []
                  : values.rootDomains
                      .split(',')
                      .map((domain) => domain.trim()),
              ipBlocks:
                values.ipBlocks === ''
                  ? []
                  : values.ipBlocks.split(',').map((ip) => ip.trim()),
              name: values.name,
              isPassive: values.isPassive,
              tags: values.tags,
              parent: values?.parentId?.id ? values.parentId.id : undefined
            });
            if (!organization) setValues(defaultValues);
            setOpen(false);
          }}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const useStyles = makeStyles((theme) => ({
  inner: {
    maxWidth: 1440,
    width: '250%',
    margin: '0 auto'
  },
  menuButton: {
    marginLeft: theme.spacing(2),
    display: 'block',
    [theme.breakpoints.up('lg')]: {
      display: 'none'
    }
  },
  logo: {
    width: 150,
    padding: theme.spacing(),
    paddingLeft: 0,
    [theme.breakpoints.down('xl')]: {
      display: 'flex'
    }
  },
  spacing: {
    flexGrow: 1
  },
  activeLink: {
    '&:after': {
      content: "''",
      position: 'absolute',
      bottom: 0,
      left: 0,
      width: '100%',
      height: 2,
      backgroundColor: 'white'
    }
  },
  activeMobileLink: {
    fontWeight: 700,
    '&:after': {
      content: "''",
      position: 'absolute',
      top: 0,
      bottom: 0,
      left: 0,
      height: '100%',
      width: 2,
      backgroundColor: theme.palette.primary.main
    }
  },
  link: {
    position: 'relative',
    color: 'white',
    textDecoration: 'none',
    margin: `0 ${theme.spacing()}px`,
    padding: theme.spacing(),
    borderBottom: '2px solid transparent',
    fontWeight: 600
  },
  userLink: {
    [theme.breakpoints.down('sm')]: {
      display: 'flex'
    },
    [theme.breakpoints.up('lg')]: {
      display: 'flex',
      alignItems: 'center',
      marginLeft: '1rem',
      '& svg': {
        marginRight: theme.spacing()
      },
      border: 'none',
      textDecoration: 'none'
    }
  },
  lgNav: {
    display: 'none',
    [theme.breakpoints.down('xl')]: {
      display: 'inline'
    }
  },
  mobileNav: {
    padding: `${theme.spacing(2)}px ${theme.spacing()}px`
  },
  selectOrg: {
    border: '1px solid #000000',
    borderRadius: '5px',
    width: '200px',
    padding: '3px',
    marginLeft: '20px',
    '& svg': {
      color: 'white'
    },
    '& input': {
      color: 'white',
      width: '100%'
    },
    '& input:focus': {
      outlineWidth: 0
    },
    '& fieldset': {
      borderStyle: 'none'
    },
    height: '45px'
  },
  option: {
    fontSize: 15
  }
}));
