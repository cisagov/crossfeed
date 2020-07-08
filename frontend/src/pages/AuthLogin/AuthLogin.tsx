import React, { useState } from 'react';
import { useHistory, Link, useLocation } from 'react-router-dom';
import { AuthForm } from 'components';
import { Button, TextInput, Label } from '@trussworks/react-uswds';
import { useAuthContext } from 'context/AuthContext';

interface Errors extends Partial<FormData> {
  global?: string;
}

interface LocationState {
  message?: string;
}

export const AuthLogin: React.FC = () => {
  const history = useHistory();
  const location = useLocation<LocationState>();

  const onSubmit: React.FormEventHandler = async e => {
    e.preventDefault();
    window.location.href = `${process.env.REACT_APP_API_URL}/auth/login`;
  };

  return (
    <AuthForm onSubmit={onSubmit}>
      <h1>Welcome to Crossfeed</h1>
      {location.state?.message && <p>{location.state.message}</p>}
      <Button type="submit" size="big">
        Login with Login.gov
      </Button>
      <br></br>
      <Link to="/register">New to Crossfeed? Register with Login.gov</Link>
    </AuthForm>
  );
};
