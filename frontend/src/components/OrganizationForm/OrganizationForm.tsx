import React, { useState } from 'react';
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

export interface OrganizationFormValues {
  name: string;
  rootDomains: string;
  ipBlocks: string;
  isPassive: boolean;
  tags: OrganizationTag[];
}

export const OrganizationForm: React.FC<{
  organization?: Organization;
  open: boolean;
  setOpen: (open: boolean) => void;
  onSubmit: (values: Object) => Promise<void>;
  type: string;
  parentOrganization?: Organization;
}> = ({ organization, onSubmit, type, open, setOpen, parentOrganization }) => {
  const defaultValues = () => ({
    name: organization ? organization.name : '',
    rootDomains: organization ? organization.rootDomains.join(', ') : '',
    ipBlocks: organization ? organization.ipBlocks.join(', ') : '',
    isPassive: organization ? organization.isPassive : false,
    tags: []
  });

  const [values, setValues] = useState<OrganizationFormValues>(defaultValues);

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
        Create new {parentOrganization ? 'Team' : 'Organization'}
      </DialogTitle>
      <DialogContent>
        <TextField
          margin="dense"
          id="name"
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
              parentOrganization: parentOrganization
                ? parentOrganization.id
                : undefined
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
