import React, { useState } from 'react';
import { useHistory, Link, useLocation } from 'react-router-dom';
import { AuthForm } from 'components';
import { Button, TextInput, Label } from '@trussworks/react-uswds';
import { useAuthContext } from 'context/AuthContext';

interface FormData {
  username: string;
  password: string;
}

interface Errors extends Partial<FormData> {
  global?: string;
}

interface LocationState {
  message?: string;
}

export const AuthLogin: React.FC = () => {
  const history = useHistory();
  const location = useLocation<LocationState>();
  const { login } = useAuthContext();
  const [values, setValues] = useState<FormData>({
    username: '',
    password: ''
  });
  const [errors, setErrors] = useState<Errors>({});

  return (
    <AuthForm>
      <h1>Welcome to Crossfeed</h1>
      {location.state?.message && <p>{location.state.message}</p>}
      {errors.global && <p className="text-error">{errors.global}</p>}
      <a href={`${process.env.REACT_APP_API_URL}/auth/login`}>
        <Button type="submit" size="big">
          Login with Login.gov
        </Button>
      </a>
      <br></br>
      <Link to="/register">New to Crossfeed? Register with Login.gov</Link>
    </AuthForm>
  );
};
