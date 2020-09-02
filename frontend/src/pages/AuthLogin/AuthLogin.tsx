import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthForm } from 'components';
import { Button } from '@trussworks/react-uswds';
import { useAuthContext } from 'context';
import { AmplifyAuthenticator, AmplifySignUp } from '@aws-amplify/ui-react';
import { Translations, onAuthUIStateChange } from '@aws-amplify/ui-components';
import { I18n } from "aws-amplify";

I18n.putVocabulariesForLanguage("en-US", {
  [Translations.TOTP_HEADER_TEXT]: "Set up 2FA by scanning the QR code with a TOTP app:",
  [Translations.TOTP_LABEL]: "Enter 2FA security code:",
});

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
