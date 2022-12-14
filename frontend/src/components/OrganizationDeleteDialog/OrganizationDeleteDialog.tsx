import React, { useState } from 'react';
import { makeStyles } from '@material-ui/core';
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

export interface OrganizationDeleteDialogValues {
  name: string;
  typedNameConfirm: string;
}

export const OrganizationDeleteDialog: React.FC<{
  organization?: Organization;
  open: boolean;
  setOpen: (open: boolean) => void;
  onSubmit: (values: Object) => Promise<void>;
  type: string;
}> = ({ organization, onSubmit, type, open, setOpen }) => {
  const defaultValues = () => ({
    name: organization ? organization.name : '',
    typedNameConfirm: ''
  });

  const classes = useStyles();
  const [values, setValues] =
    useState<OrganizationDeleteDialogValues>(defaultValues);

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
      <DialogTitle id="form-dialog-title">Delete Organization</DialogTitle>
      <DialogContent>
        <h2>Are you sure you would like to delete</h2>
        <h3>{values.name}</h3>
        <TextField
          margin="dense"
          id="typedNameConfirm"
          name="typedNameConfirm"
          label="Please type the organization name to confirm"
          type="text"
          fullWidth
          value={values.typedNameConfirm}
          onChange={onTextChange}
        />
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" onClick={() => setOpen(false)}>
          Cancel
        </Button>
        <Button
          variant="outlined"
          className={classes.deleteButton}
          disabled={values.typedNameConfirm !== values.name}
          onClick={async () => {
            await onSubmit({
              name: values.name
            });
            if (!organization) setValues(defaultValues);
            setOpen(false);
          }}
        >
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
};
const useStyles = makeStyles((theme) => ({
  deleteButton: {
    '&:not(:disabled)': {
      color: 'white',
      backgroundColor: '#b50909'
    }
  }
}));
