import {
  Paper,
  TableContainer,
  TextareaAutosize,
  Chip,
  MenuItem,
  Menu,
  AlertTitle
} from '@mui/material';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthForm } from 'components';
import { Button } from '@trussworks/react-uswds';
import { useAuthContext } from 'context';
import { Alert } from '@mui/material';
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
        <Alert onClose={() => {}} severity="warning">
          <AlertTitle>
            <h2 className="platform_notice">PLATFORM NOTIFICATION</h2>
          </AlertTitle>
          <h3>
            Important Notice: Temporary Downtime During Crossfeed Migration
          </h3>
          <p>
            The Crossfeed environment is moving. The migration will require a
            temporary downtime of approximately one week.
          </p>
          <p>
            The downtime will begin on Wednesday, October 25, through the end of
            day Wednesday, November 01.
          </p>
          <p>
            For additional information, please click
            <a href="https://s3.amazonaws.com/crossfeed.cyber.dhs.gov/Notice.pdf">
              {' '}
              here.
            </a>
          </p>
        </Alert>
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
            <div className="warning_header">WARNING</div>
            <div className="warning_logo">
              <img src="/img/CISA_LOGO.png"></img>
            </div>
            <div className="warning_notification">
              Crossfeed is hosted by Department of Homeland Security (DHS)
              Cybersecurity and Infrastructure Security Agency (CISA)
              Cybersecurity Division (CSD) Vulnerability Management (VM) Attack
              Surface Management (ASM) Automation Capabilities team.
              Unauthorized use of this system is prohibited. US Government
              computer systems may be monitored for all unlawful purposes,
              including to ensure that their use is authorized, for management
              of the system, to facilitate protection against unauthorized
              access, and to verify security procedures, survivability, and
              operational security. All information, including personal
              information, placed or sent over this system may be monitored.
              Monitoring includes actives attacks by authorized US Government
              entities to test or verify the security of this system.
            </div>
            <div className="warning_notification">
              {' '}
              Use of the computer system, authorized or unauthorized,
              constitutes consent to monitoring of this system. Unauthorized use
              may subject you to criminal prosecution. Evidence of unauthorized
              use collected during monitoring may be used for administrivia,
              criminal, or other adverse action. Use of this system constitutes
              to monitoring for these purposes. Use of this system implies
              understanding of these items and conditions.
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
