import React, { useState } from 'react';
import { AuthForm } from 'components';
import { useAuthContext } from 'context';
import { parse } from 'query-string';
import { useHistory } from 'react-router-dom';

interface Errors extends Partial<FormData> {
  global?: string;
}

export const AuthCallback: React.FC = () => {
  const { login, apiPost } = useAuthContext();
  const [errors, setErrors] = useState<Errors>({});
  const history = useHistory();

  const callback = async () => {
    console.log('called');
    const parsed = parse(window.location.search);
    if (errors.global || !parsed.state || !parsed.code) {
      setErrors({
        global: 'Something went wrong logging in.'
      });
      return;
    }
    try {
      const { existing, token, user } = await apiPost('/auth/callback', {
        body: {
          state: parsed.state,
          code: parsed.code,
          nonce: localStorage.getItem('nonce'),
          origState: localStorage.getItem('state')
        }
      });
      login(token, user);
      console.log(existing);

      if (existing) {
        history.push('/');
      } else {
        history.push('/create-account');
      }
    } catch (e) {
      setErrors({
        global: 'Something went wrong logging in.'
      });
    }
  };

  React.useEffect(() => {
    callback();
  }, []);

  return (
    <AuthForm>
      <h1>Logging in...</h1>
      {errors.global && <p className="text-error">{errors.global}</p>}
    </AuthForm>
  );
};
