import React, { useEffect, useState } from 'react';
import { AuthForm } from 'components';
import { Button } from '@trussworks/react-uswds';
import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  Link,
  Typography
} from '@mui/material';
import { useAuthContext } from 'context';
import {
  Authenticator,
  ThemeProvider,
  useAuthenticator
} from '@aws-amplify/ui-react';
import { I18n } from 'aws-amplify';

import { RegisterForm } from 'components/Register/RegisterForm';

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

export const AuthLoginCreate: React.FC<{ showSignUp?: boolean }> = ({
  showSignUp = true
}) => {
  const { apiPost, refreshUser } = useAuthContext();
  const [errors, setErrors] = useState<Errors>({});
  const [open, setOpen] = useState<boolean>(false);
  const [registerSuccess, setRegisterSuccess] = useState<boolean>(false);
  // Once a user signs in, call refreshUser() so that the callback is called and the user gets signed in.
  const { authStatus } = useAuthenticator((context) => [context.isPending]);
  useEffect(() => {
    refreshUser();
  }, [refreshUser, authStatus]);

  const formFields = {
    signIn: {
      username: {
        label: 'Email',
        placeholder: 'Enter your email address',
        required: true,
        autoFocus: true
      },
      password: {
        label: 'Password',
        placeholder: 'Enter your password',
        required: true
      }
    },
    confirmSignIn: {
      confirmation_code: {
        label: 'Confirmation Code',
        placeholder: 'Enter code from your authenticator app',
        autoFocus: true
      }
    },
    resetPassword: {
      username: {
        label: 'Email',
        placeholder: 'Enter your email address',
        required: true,
        autoFocus: true
      }
    },
    confirmResetPassword: {
      confirmation_code: {
        label: 'Confirmation Code',
        placeholder: 'Enter code sent to your email address',
        autoFocus: true
      }
    },
    confirmSignUp: {
      confirmation_code: {
        label: 'Confirmation Code',
        placeholder: 'Enter code sent to your email address',
        autoFocus: true
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
          'Set up 2FA by scanning the QR code with an authenticator app on your phone.',
        autoFocus: true
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

  const onClose = () => {
    setOpen(false);
  };

  const RegistrationSuccessDialog = (
    <Dialog
      open={registerSuccess}
      onClose={() => setRegisterSuccess(false)}
      maxWidth="xs"
    >
      <DialogTitle textAlign="center">REQUEST SENT</DialogTitle>
      <DialogContent>
        Thank you for requesting a Crossfeed account, you will receive
        notification once this request is approved.
      </DialogContent>
    </Dialog>
  );

  if (process.env.REACT_APP_USE_COGNITO) {
    return (
      <AuthForm as="div">
        <h1>Welcome to Crossfeed</h1>

        <ThemeProvider theme={amplifyTheme}>
          <Authenticator
            formFields={formFields}
            initialState="signUp"
            /* Hide the sign up button unless we are 1) on the /signup page or 2) in development mode. */
            hideSignUp={
              !showSignUp && !(process.env.NODE_ENV === 'development')
            }
          />
          {/* <AmplifyButton onClick={() => alert('hello')}>
            Register
          </AmplifyButton> */}

          {open && (
            <RegisterForm
              open={open}
              onClose={onClose}
              setRegisterSuccess={setRegisterSuccess}
            />
          )}
          {RegistrationSuccessDialog}
          <Box pt={3} pb={3} display="flex" justifyContent="center">
            <Typography display="inline">New to Crossfeed?&nbsp;</Typography>
            <Link
              underline="hover"
              style={{ cursor: 'pointer' }}
              onClick={() => setOpen(true)}
            >
              Register Now
            </Link>
          </Box>

          <div className="banner_header">**Warning**</div>
          <div className="banner_login">
            {' '}
            This system contains U.S. Government Data. Unauthorized use of this
            system is prohibited. Use of this computer system, authorized or
            unauthorized, constitutes consent to monitoring of this system.
          </div>
          <div className="banner_login">
            {' '}
            This computer system, including all related equipment, networks, and
            network devices (specifically including Internet access) are
            provided only for authorized U.S. Government use. U.S. Government
            computer systems may be monitored for all lawful purposes, including
            to ensure that their use is authorized, for management of the
            system, to facilitate protection against unauthorized access, and to
            verify security procedures, survivability, and operational security.
            Monitoring includes active attacks by authorized U.S. Government
            entities to test or verify the security of this system. During
            monitoring, information may be examined, recorded, copied and used
            for authorized purposes. All information, including personal
            information, placed or sent over this system may be monitored.
          </div>
          <div className="banner_login">
            {' '}
            Unauthorized use may subject you to criminal prosecution. Evidence
            of unauthorized use collected during monitoring may be used for
            administrative, criminal, or other adverse action. Use of this
            system constitutes consent to monitoring for these purposes.
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
      <Typography>
        <h5>New to Crossfeed? Register with Login.gov</h5>
      </Typography>
      {open && (
        <RegisterForm
          open={open}
          onClose={onClose}
          setRegisterSuccess={setRegisterSuccess}
        />
      )}
      {RegistrationSuccessDialog}
      <Button type="submit" size="big" onClick={() => setOpen(true)}>
        Register
      </Button>
    </AuthForm>
  );
};
