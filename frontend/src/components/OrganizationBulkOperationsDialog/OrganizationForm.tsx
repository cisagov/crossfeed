import React, { useState } from 'react';
import { Organization } from 'types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  Button
} from '@material-ui/core';

export interface OrganizationBulkOperationsDialogValues {
  totalResults: number;
  confirmation: string;
  confirmationReply: string;
}

export const OrganizationBulkOperationsDialog: React.FC<{
  totalResults: number;
  open: boolean;
  setOpen: (open: boolean) => void;
  onSubmit: (values: Object) => Promise<void>;
}> = ({ totalResults, open, setOpen, onSubmit }) => {
  const defaultValues = () => ({
    totalResults: totalResults,
    confirmation: 'I UNDERSTAND WHAT I AM DOING',
    confirmationReply: ''
  });

  const [values, setValues] =
    useState<OrganizationBulkOperationsDialogValues>(defaultValues);

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
        You are bulk editing {totalResults} records.
      </DialogTitle>
      <DialogContent>
        <p>{values.confirmation}</p>
        <TextField
          margin="dense"
          id="ipBlocks"
          name="ipBlocks"
          label="Please type the following confirmation statement listed above to continue"
          type="text"
          fullWidth
          value={values.confirmationReply}
          onChange={onTextChange}
        />
        <br></br>
        <br></br>
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
              //parameters here
              foo: true
            });
            setOpen(false);
          }}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};
