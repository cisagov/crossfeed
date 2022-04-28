import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthForm } from 'components';
import { Button } from '@trussworks/react-uswds';
import { useAuthContext } from 'context';
import {
  AmplifyAuthenticator,
  AmplifySignUp,
  AmplifySelectMfaType,
  AmplifySignIn
} from '@aws-amplify/ui-react';
import { Translations, onAuthUIStateChange } from '@aws-amplify/ui-components';
import { I18n } from 'aws-amplify';

const TOTP_ISSUER_PREFIX = process.env.REACT_APP_TOTP_ISSUER;

I18n.putVocabulariesForLanguage('en-US', {
  [Translations.TOTP_HEADER_TEXT]:
    'Set up 2FA by scanning the QR code with an authenticator app on your phone:',
  [Translations.TOTP_LABEL]: 'Enter 2FA security code from the app:',
  [Translations.TOTP_ISSUER]: TOTP_ISSUER_PREFIX,
  [Translations.CONFIRM_TOTP_CODE]: 'Enter 2FA Code',
  [Translations.CONFIRM_SIGN_UP_CODE_LABEL]: 'Email Confirmation Code',
  [Translations.CONFIRM_SIGN_UP_CODE_PLACEHOLDER]:
    'Enter code sent to your email address',
  [Translations.CODE_LABEL]: 'Enter code:', // 2FA prompt and reset password label
  [Translations.LESS_THAN_TWO_MFA_VALUES_MESSAGE]: ''
});

interface Errors extends Partial<FormData> {
  global?: string;
}

export const AuthLogin: React.FC<{ showSignUp?: boolean }> = ({
  showSignUp = false
}) => {
  const { apiPost, refreshUser } = useAuthContext();
  const [errors, setErrors] = useState<Errors>({});

  useEffect(() => {
    return onAuthUIStateChange((nextAuthState, authData) => {
      if (nextAuthState === 'TOTPSetup') {
        // We want to set the issuer to have the email address, so that the authenticator app will show the email address.
        // userDataKey is in the format: "CognitoIdentityServiceProvider.[app_client_id].email@gmail.com.userData"
        const email = (authData as any).userDataKey?.match(
          /^.*?\..*?\.(.*?)\.userData$/
        )[1];
        if (email) {
          I18n.putVocabulariesForLanguage('en-US', {
            [Translations.TOTP_ISSUER]: `${TOTP_ISSUER_PREFIX}: ${email}`
          });
        } else {
          I18n.putVocabulariesForLanguage('en-US', {
            [Translations.TOTP_ISSUER]: TOTP_ISSUER_PREFIX
          });
        }
      }
      refreshUser();
    });
  }, [refreshUser]);

  const onSubmit: React.FormEventHandler = async (e) => {
    e.preventDefault();
    try {
      const { redirectUrl, state, nonce } = await apiPost('/auth/login', {
        body: {}
      });
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
        <AmplifyAuthenticator usernameAlias="email">
          <AmplifySelectMfaType MFATypes={{ TOTP: true }} />
          {/* Hide the sign up button unless we are 1) on the /signup page or 2) in development mode. */}
          <AmplifySignIn
            slot="sign-in"
            hideSignUp={
              !showSignUp && !(process.env.NODE_ENV === 'development')
            }
          />
          <AmplifySignUp
            slot="sign-up"
            formFields={[{ type: 'email' }, { type: 'password' }]}
            usernameAlias="email"
          />
        </AmplifyAuthenticator>
      </AuthForm>
    );
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
