import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthForm } from 'components';
import { Button } from '@trussworks/react-uswds';
import { useAuthContext } from 'context';
import { parse } from 'query-string';

interface Errors extends Partial<FormData> {
  global?: string;
}

export const AuthCallback: React.FC = () => {
  const { apiPost } = useAuthContext();
  const [errors, setErrors] = useState<Errors>({});

  React.useEffect(() => {
    const parsed = parse(window.location.search);
    if (!parsed.state || !parsed.code) {
      setErrors({
        global: 'Something went wrong logging in.'
      });
      return;
    }
    try {
      apiPost('/auth/callback', {
        body: {
          state: parsed.state,
          code: parsed.code,
          nonce: localStorage.getItem('nonce'),
          origState: localStorage.getItem('state')
        }
      }).then(result => {
        console.log(result);
      });
    } catch (e) {
      setErrors({
        global: 'Something went wrong logging in.'
      });
    }
  }, []);

  return (
    <AuthForm>
      <h1>Logging in...</h1>
      {errors.global && <p className="text-error">{errors.global}</p>}
    </AuthForm>
  );
};
