import React, { useCallback, useEffect, useState } from 'react';
import * as registerFormStyles from './registerFormStyle';
import { Organization, OrganizationTag } from 'types';
import {
  Autocomplete,
  CircularProgress,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  Switch,
  Button,
  FormControlLabel,
  Box,
  Chip,
  Grid,
  createFilterOptions
} from '@mui/material';
import { Save } from '@mui/icons-material';

import { useAuthContext } from 'context';

const classes = registerFormStyles.classes;
const StyledDialog = registerFormStyles.StyledDialog;

interface AutocompleteType extends Partial<OrganizationTag> {
  title?: string;
}

export interface RegisterFormValues {
  firstName: string;
  lastName: string;
  email: string;
}

export const RegisterForm: React.FC<{
  open: boolean;
  onClose: () => void;
}> = ({open, onClose}) => { 
  const defaultValues = () => ({
    firstName: '',
    lastName: '',
    email: ''
  });
  const [values, setValues] = useState<RegisterFormValues>(defaultValues);
  // const [errorMessage, setErrorMessage] = useState<string>('');
  const [errorRequestMessage, setErrorRequestMessage] = useState<string>('');
  const [errorEmailMessage, setEmailErrorMessage] = useState<string>('Email entry error. Please try again.');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const onTextChange: React.ChangeEventHandler<
    HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
  > = (e) => onChange(e.target.name, e.target.value);

  const onChange = (name: string, value: any) => {
    setValues((values) => ({
      ...values,
      [name]: value
    }));
  };

  const isDisabled = () => {
    if (Object.values(values).every(value => value) && !errorEmailMessage) {
      return false;
    } else {
      return true;
    }
  };

  const onSave = async () => {
    setIsLoading(true);
    console.log('values: ', values);
    console.log('This is where we will send the values to post.');
    // makeRequest should be "await someApiCallToBeSuccessfulOrFail" 
    const makeRequest = {data: {user: {firstName: 'test', lastName: 'test', email: 'test@email.com'}}}
    const successfulRequest = makeRequest.data;
    if(makeRequest && makeRequest.data){
      console.log('User Registered Successfully');
      onClose();
    }else{
      console.log('User Register Failed');
      setErrorRequestMessage('Something went wrong registering. Please try again.');
      setIsLoading(false);
    }
  }

  const validateEmail = (email: string) => {
    // email format
    // const regexEmail = /\S+@\S+\.\S+/;
    const regexEmail =  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
    let error = false;
    if (email && regexEmail.test(email)) {
      setEmailErrorMessage('');
      error = false;
    } else {
      setEmailErrorMessage('Email is not valid.');
      error = true;
    }
    return error;
  };

  useEffect(() => {
    if (
      values &&
      values.email
    ) {
      validateEmail(values.email);
    }
  }, [values]);

  return (
    <StyledDialog
      open={open}
      onClose={() => onClose}
      aria-labelledby="form-dialog-title"
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle id="form-dialog-title">
        Register with Crossfeed
      </DialogTitle>
      <DialogContent>
        {errorRequestMessage && <p className="text-error">{errorRequestMessage}</p>}
        <TextField
          margin="dense"
          id="firstName"
          inputProps={{ maxLength: 250 }}
          name="firstName"
          label="First Name"
          type="text"
          fullWidth
          value={values.firstName}
          onChange={onTextChange}
        />
        <TextField
          margin="dense"
          id="lastName"
          inputProps={{ maxLength: 250 }}
          name="lastName"
          label="Last Name"
          type="text"
          fullWidth
          value={values.lastName}
          onChange={onTextChange}
        />
        <TextField
          error={errorEmailMessage ? true : false}
          margin="dense"
          id="email"
          inputProps={{ maxLength: 250 }}
          name="email"
          label="Email"
          type="text"
          fullWidth
          value={values.email}
          onChange={onTextChange}
          helperText={errorEmailMessage ? errorEmailMessage : null}
        />
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" onClick={onClose}>
          Cancel
        </Button>
        <Button
          disabled={isDisabled()}
          variant="contained"
          color="primary"
          onClick={onSave}
          startIcon={
            isLoading ? (
              <CircularProgress color='secondary' size={16} />
            ) : (
              <Save />
            )
          }
        >
          Register
        </Button>
      </DialogActions>
    </StyledDialog>
  );
};
