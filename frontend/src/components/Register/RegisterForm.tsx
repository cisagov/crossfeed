import React, { useEffect, useState } from 'react';
import * as registerFormStyles from './registerFormStyle';
import { useAuthContext } from 'context';
import {
  CircularProgress,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  Button
} from '@mui/material';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import { Save } from '@mui/icons-material';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import { User } from 'types';

const StyledDialog = registerFormStyles.StyledDialog;

// State options (Keep casing as it matches region options in backend)
const STATE_OPTIONS = [
  'Connecticut',
  'Maine',
  'Massachusetts',
  'New Hampshire',
  'Rhode Island',
  'Vermont',
  'New Jersey',
  'New York',
  'Puerto Rico',
  'Virgin Islands',
  'Delaware',
  'Maryland',
  'Pennsylvania',
  'Virginia',
  'District of Columbia',
  'West Virginia',
  'Alabama',
  'Florida',
  'Georgia',
  'Kentucky',
  'Mississippi',
  'North Carolina',
  'South Carolina',
  'Tennessee',
  'Illinois',
  'Indiana',
  'Michigan',
  'Minnesota',
  'Ohio',
  'Wisconsin',
  'Arkansas',
  'Louisiana',
  'New Mexico',
  'Oklahoma',
  'Texas',
  'Iowa',
  'Kansas',
  'Missouri',
  'Nebraska',
  'Colorado',
  'Montana',
  'North Dakota',
  'South Dakota',
  'Utah',
  'Wyoming',
  'Arizona',
  'California',
  'Hawaii',
  'Nevada',
  'Guam',
  'American Samoa',
  'Commonwealth Northern Mariana Islands',
  'Republic of Marshall Islands',
  'Federal States of Micronesia',
  'Alaska',
  'Idaho',
  'Oregon',
  'Washington'
];

export interface RegisterFormValues {
  firstName: string;
  lastName: string;
  email: string;
  state: string;
}

export interface ApiResponse {
  result: User;
  count: number;
  url?: string;
}

export const RegisterForm: React.FC<{
  open: boolean;
  onClose: () => void;
}> = ({ open, onClose }) => {
  // Set default Values
  const defaultValues = () => ({
    firstName: '',
    lastName: '',
    email: '',
    state: ''
  });

  const { apiPost, setFeedbackMessage } = useAuthContext();

  const registerUserPost = async (body: Object) => {
    try {
      const requestOptions: RequestInit = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      };
      const response = await fetch(process.env.REACT_APP_API_URL + '/users/register',
        requestOptions);
      const data = await response.json();
      // Handle the response data here
      console.log(data);
      return data
    } catch (error) {
      // Handle any errors here
      console.error(error);
    }
  };

  const [values, setValues] = useState<RegisterFormValues>(defaultValues);
  const [errorRequestMessage, setErrorRequestMessage] = useState<string>('');
  const [errorEmailMessage, setEmailErrorMessage] = useState<string>(
    'Email entry error. Please try again.'
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Register User API Post
  // const registerUserApiPost = async (body: Object) => {
  //   try {
  //     const user = await registerUserPost('/users/register', {
  //       body
  //     });
  //     return user;
  //   } catch (e: any) {
  //     setFeedbackMessage({
  //       message:
  //         e.status === 422
  //           ? 'Error registering user.'
  //           : e.message ?? e.toString(),
  //       type: 'error'
  //     });
  //     console.error(e);
  //   }
  // };

  const onTextChange: React.ChangeEventHandler<
    HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
  > = (e) => onChange(e.target.name, e.target.value);

  const onChange = (name: string, value: any) => {
    setValues((values) => ({
      ...values,
      [name]: value
    }));
  };

  const handleChange = (event: SelectChangeEvent) => {
    setValues((values) => ({
      ...values,
      [event.target.name]: event.target.value
    }));
  };

  const isDisabled = () => {
    if (Object.values(values).every((value) => value) && !errorEmailMessage) {
      return false;
    } else {
      return true;
    }
  };

  const onSave = async () => {
    setIsLoading(true);
    console.log('values: ', values);
    console.log('This is where we will send the values to post.');
    const body = {
      firstName: values.firstName,
      lastName: values.lastName,
      email: values.email,
      state: values.state
    };
    const registeredUser = await registerUserPost(body);
    if (registeredUser !== undefined) {
      console.log('User Registered Successfully');
      setIsLoading(false);
      onClose();
    } else {
      console.log('User Register Failed');
      setErrorRequestMessage(
        'Something went wrong registering. Please try again.'
      );
      setIsLoading(false);
    }
  };

  const validateEmail = (email: string) => {
    // email format
    // const regexEmail = /\S+@\S+\.\S+/;
    const regexEmail =
      /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
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
    if (values && values.email) {
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
      <DialogTitle id="form-dialog-title">Register with Crossfeed</DialogTitle>
      <DialogContent>
        {errorRequestMessage && (
          <p className="text-error">{errorRequestMessage}</p>
        )}
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
        <FormControl fullWidth>
          <InputLabel id="state-select-label">State</InputLabel>
          <Select
            labelId="state-select-label"
            id="state"
            value={values.state}
            name="state"
            label="State"
            onChange={handleChange}
          >
            {STATE_OPTIONS.map((state: string, index: number) => (
              <MenuItem value={state}>{state}</MenuItem>
            ))}
          </Select>
        </FormControl>
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
              <CircularProgress color="secondary" size={16} />
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
