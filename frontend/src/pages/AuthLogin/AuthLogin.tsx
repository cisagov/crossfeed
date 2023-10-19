import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthForm } from 'components';
import { Button } from '@trussworks/react-uswds';
import { useAuthContext } from 'context';
import {
  Authenticator,
  ThemeProvider,
  useAuthenticator
} from '@aws-amplify/ui-react';
import { I18n } from 'aws-amplify';

const TOTP_ISSUER = process.env.REACT_APP_TOTP_ISSUER;

// Strings come from https://github.com/aws-amplify/amplify-ui/blob/main/packages/ui/src/i18n/dictionaries/authenticator/en.ts
I18n.putVocabulariesForLanguage('en-US', {
  'Setup TOTP': 'Set up 2FA',
  'Confirm TOTP Code': 'Enter 2FA Code'
});

const amplifyTheme = {
  name: 'my-theme'
};

interface Errors extends Partial<FormData> {
  global?: string;
}

export const AuthLogin: React.FC<{ showSignUp?: boolean }> = ({
  showSignUp = false
}) => {
  const { apiPost, refreshUser } = useAuthContext();
  const [errors, setErrors] = useState<Errors>({});

  // Once a user signs in, call refreshUser() so that the callback is called and the user gets signed in.
  const { authStatus } = useAuthenticator((context) => [context.isPending]);
  useEffect(() => {
    refreshUser();
  }, [refreshUser, authStatus]);

  const formFields = {
    confirmSignIn: {
      confirmation_code: {
        label: 'Enter 2FA Code from your authenticator app'
      }
    },
    confirmResetPassword: {
      confirmation_code: {
        label: 'Enter code sent to your email address'
      }
    },
    setupTOTP: {
      QR: {
        // Set the issuer and name so that the authenticator app shows them.
        // TODO: Set the issuer to the email, once this is resolved: https://github.com/aws-amplify/amplify-ui/issues/3387.
        totpIssuer: TOTP_ISSUER
        // totpUsername: email,
      },
      confirmation_code: {
        label:
          'Set up 2FA by scanning the QR code with an authenticator app on your phone.'
      }
    }
  };

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
      <AuthForm as="div">
        <h1>Welcome to Crossfeed</h1>
        <ThemeProvider theme={amplifyTheme}>
          <Authenticator
            loginMechanisms={['email']}
            formFields={formFields}
            /* Hide the sign up button unless we are 1) on the /signup page or 2) in development mode. */
            hideSignUp={
              !showSignUp && !(process.env.NODE_ENV === 'development')
            }
          />
          <div className="notification_box">
            <div className="platform_header">PLATFORM NOTIFICATION</div>
            <div className="notification_header">
              Important Notice: Temporary Downtime During Crossfeed Migration
            </div>
            <div className="temp_notification">
              {' '}
              The Crossfeed environment is moving. The migration will require a
              temporary downtime of approximately one week.
            </div>
            <div className="temp_notification">
              {' '}
              The downtime will begin on Wednesday, October 25, through the end
              of day Wednesday, November 01.{' '}
            </div>
            <div className="temp_notification">
              For additional information, please click{' '}
              <a href="https://s3.amazonaws.com/crossfeed.cyber.dhs.gov/Notice.pdf">
                here
              </a>
            </div>
          </div>
          <div className="banner_box">
            <div className="banner_header">**Warning**</div>
            <div className="banner_login">
              {' '}
              This system contains U.S. Government Data. Unauthorized use of
              downtime will begin on Monday, October 23, through the end of
              Monday, Monday, Monday, Monday, October 30. unauthorized,
              constitutes system.
            </div>
            <div className="banner_login">
              {' '}
              This computer system, including all related equipment, networks,
              (specifically including Internet access) are provided only for
              authorized U.S. Government use. U.S. Government computer systems
              monitored for all lawful purposes, authorized, for management of
              the system, system, to system, to system, to facilitate protection
              against unauthorized access, and verify security procedures,
              procedures, procedures, procedures, survivability, operational
              operational operational operational Monitoring includes active
              attacks by authorized U.S. Government entities to test or verify
              the security the security of this system. During monitoring,
              monitoring, information may be examined, examined, recorded,
              copied and used for authorized information, including personal
              information, placed or sent over or sent over or sent over this
              system may be may be may be monitored.
            </div>
            <div className="banner_login">
              {' '}
              Unauthorized use may subject you to criminal prosecution. Evidence
              unauthorized use collected during monitoring may be used for
              administrative, criminal, or other adverse action. Use of this
              constitutes consent to monitoring for these purposes.
            </div>
          </div>
        </ThemeProvider>
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
      <Link to="#" onClick={onSubmit}>
        New to Crossfeed? Register with Login.gov
      </Link>
    </AuthForm>
  );
};
