import React, { useState } from 'react';
import { Organization } from 'types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  makeStyles
} from '@material-ui/core';
import { Alert, AlertProps } from '@material-ui/lab';
import { ExpandMore } from '@material-ui/icons';
import { FaTrash } from 'react-icons/fa';
import { ColumnFilter } from 'components/ColumnFilter';

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
  const classes = useStyles();
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
      onClose={() => {
        setOpen(false);
      }}
      aria-labelledby="form-dialog-title"
      maxWidth="md"
      fullWidth
    >
      <DialogTitle id="form-dialog-title">
        You are bulk editing {totalResults} organizations, as defined by your
        current search/filter terms.
      </DialogTitle>
      <DialogContent>
        <Accordion
          onChange={() => {
            //Reset confirm text if the user navigates away
            setValues(defaultValues);
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMore />}
            aria-controls="panel1a-content"
            id="panel1a-header"
            className="warning-button"
          >
            <span>
              <FaTrash></FaTrash> BULK DELETE
            </span>
          </AccordionSummary>
          <AccordionDetails className={classes.vertical}>
            <Alert severity="error">
              <h4>Are you absolutely sure?</h4>
              You are about to delete {totalResults} organizations. This is not
              reversible.
              <br /> To continue, please type the following confirmation in the
              box below:
              <p>
                <span className={classes.code}>{values.confirmation}</span>
              </p>
            </Alert>

            <TextField
              margin="dense"
              label="Please type the following confirmation statement to continue"
              type="text"
              fullWidth
              id="confirmationReply"
              name="confirmationReply"
              value={values.confirmationReply}
              onChange={onTextChange}
            />
            <Button
              variant="contained"
              color="primary"
              disabled={values.confirmationReply !== values.confirmation}
              className="warning-button"
              onClick={async () => {
                await onSubmit({
                  //parameters here
                  foo: true
                });
                setOpen(false);
              }}
            >
              DELETE ORGANIZTAIONS
            </Button>
          </AccordionDetails>
        </Accordion>

        <DialogActions>
          <Button variant="outlined" onClick={() => setOpen(false)}>
            Cancel
          </Button>
        </DialogActions>
      </DialogContent>
    </Dialog>
  );
};

const useStyles = makeStyles(() => ({
  summary: {
    backgroundColor: 'gray'
  },
  vertical: {
    flexDirection: 'column'
  },
  code: {
    padding: '2px 4px',
    color: '#1f1e24',
    backgroundColor: '#ececef',
    borderRadius: '4px'
  }
}));
