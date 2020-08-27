import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthForm } from 'components';
import { Button } from '@trussworks/react-uswds';
import { useAuthContext } from 'context';

interface Errors extends Partial<FormData> {
  global?: string;
}

export const AuthLogin: React.FC = () => {
  const { apiPost } = useAuthContext();
  const [errors, setErrors] = useState<Errors>({});

  const onSubmit: React.FormEventHandler = async e => {
    e.preventDefault();
    try {
      const { redirectUrl, state, nonce } = await apiPost('/auth/login', {});
      localStorage.setItem('state', state);
      localStorage.setItem('nonce', nonce);
      window.location.href = redirectUrl;
    } catch (e) {
      console.error(e);
      setErrors({
        global: 'Something went wrong logging in.'
      });
    }
  };

  return (
    <AuthForm onSubmit={onSubmit}>
      <h1>Welcome to Crossfeed</h1>
      {errors.global && <p className="text-error">{errors.global}</p>}
      {process.env.REACT_APP_USE_COGNITO && <>
        <a href={`https://${process.env.REACT_APP_USER_POOL_DOMAIN}.auth.us-east-1.amazoncognito.com/login?response_type=code&client_id=${encodeURIComponent(process.env.REACT_APP_USER_POOL_CLIENT_ID!)}&redirect_uri=${encodeURIComponent(window.location.origin)}`}>
        <Button type="button" size="big">
          Login
        </Button>
        </a>
      </>}
      
      {!process.env.REACT_APP_USE_COGNITO && <>
      <Button type="submit" size="big">
        Login with Login.gov
      </Button>
      <br></br>
      <Link to="#" onClick={onSubmit}>
        New to Crossfeed? Register with Login.gov
      </Link>
      </>}
    </AuthForm>
  );
};
