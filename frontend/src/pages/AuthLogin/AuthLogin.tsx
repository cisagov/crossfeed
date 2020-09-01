import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthForm } from 'components';
import { Button } from '@trussworks/react-uswds';
import { useAuthContext } from 'context';
import { AmplifyAuthenticator, AmplifySignUp } from '@aws-amplify/ui-react';
import { onAuthUIStateChange } from '@aws-amplify/ui-components';

interface Errors extends Partial<FormData> {
  global?: string;
}

export const AuthLogin: React.FC = () => {
  const { apiPost, refreshUser } = useAuthContext();
  const [errors, setErrors] = useState<Errors>({});

  useEffect(() => {
    return onAuthUIStateChange((nextAuthState, authData) => {
        refreshUser();
    });
  }, [refreshUser]);

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

  if (process.env.REACT_APP_USE_COGNITO) {
    return (
    <AuthForm>
      <h1>Welcome to Crossfeed</h1>
      <AmplifyAuthenticator>
      <AmplifySignUp
          slot="sign-up"
          formFields={[
            { type: "email" },
            { type: "password" },
          ]}
          usernameAlias="email"
        />
      </AmplifyAuthenticator>
    </AuthForm>);
  }

  return (
    <AuthForm onSubmit={onSubmit}>
      <h1>Welcome to Crossfeed</h1>
      {errors.global && <p className="text-error">{errors.global}</p>}
      <Button type="submit" size="big">
        Login with Login.gov
      </Button>
      <br></br>
      <Link to="#" onClick={onSubmit}>
        New to Crossfeed? Register with Login.gov
      </Link>
    </AuthForm>
  );
};
