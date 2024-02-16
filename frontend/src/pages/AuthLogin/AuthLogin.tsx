import React, { useEffect, useState } from 'react';
import { AuthForm } from 'components';
import { useAuthContext } from 'context';
import { Button } from '@trussworks/react-uswds';
import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  Grid,
  Link,
  Typography
} from '@mui/material';
import { RegisterForm } from 'components/Register/RegisterForm';
import { CrossfeedWarning } from 'components/WarningBanner';
import { Authenticator, useAuthenticator } from '@aws-amplify/ui-react';
import { I18n } from 'aws-amplify';

const TOTP_ISSUER = process.env.REACT_APP_TOTP_ISSUER;
I18n.putVocabulariesForLanguage('en-US', {
  'Setup TOTP': 'Set up 2FA',
  'Confirm TOTP Code': 'Enter 2FA Code'
});

interface Errors extends Partial<FormData> {
  global?: string;
}
export const AuthLogin: React.FC<{ showSignUp?: boolean }> = ({
  showSignUp = false
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
  // const platformNotification = (
  //   <Grid item xs={12}>
  //     <Alert severity="warning">
  //       <AlertTitle>
  //         {' '}
  //         PLATFORM NOTIFICATION: Temporary Downtime During Crossfeed Migration
  //       </AlertTitle>
  //       <Typography variant="caption"></Typography>
  //       The Crossfeed environment is moving. The migration will require a a
  //       temporary downtime of approximately one week. The downtime will begin on
  //       Wednesday, October 25, through the day Wednesday, November 01. For
  //       additional information, please click{' '}
  //       <a href="https://s3.amazonaws.com/crossfeed.cyber.dhs.gov/Notice.pdf">
  //         here
  //       </a>
  //       .
  //     </Alert>
  //   </Grid>
  // );
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
      <Grid container>
        {/* platformNotification should go here */}
        <Grid item xs={12} py={5}>
          <Typography variant="h3" textAlign="center">
            Welcome to Crossfeed
          </Typography>
        </Grid>
        <Grid item xs={12}>
          <Authenticator
            loginMechanisms={['email']}
            formFields={formFields}
            /* Hide the sign up button unless we are 1) on the /signup page or 2) in development mode. */
            /* hideSignUp={
                !showSignUp && !(process.env.NODE_ENV === 'development')
              }*/
            // Hide sign up button unless we are in development mode.
            hideSignUp={true}
          />
        </Grid>
        <Grid item xs={12}>
          {open && (
            <RegisterForm
              open={open}
              onClose={onClose}
              setRegisterSuccess={setRegisterSuccess}
            />
          )}
          {RegistrationSuccessDialog}
          <Box pt={3} display="flex" justifyContent="center">
            <Typography display="inline">New to Crossfeed?&nbsp;</Typography>
            <Link
              underline="hover"
              style={{ cursor: 'pointer' }}
              onClick={() => setOpen(true)}
            >
              Register Now
            </Link>
          </Box>
        </Grid>
        <Grid item xs={12}>
          <CrossfeedWarning />
        </Grid>
      </Grid>
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
