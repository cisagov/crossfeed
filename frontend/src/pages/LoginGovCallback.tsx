import React, { useCallback, useEffect } from 'react';
import { parse } from 'query-string';
import { useAuthContext } from 'context';
import { User } from 'types';
import { useHistory } from 'react-router-dom';

type cbResponse = {
  token: string;
  user: User;
};

export const LoginGovCallback: React.FC = () => {
  const { apiPost, login, refreshUser } = useAuthContext();
  const history = useHistory();

  const handleLoginGovCB = useCallback(async () => {
    const { state, code } = parse(window.location.search);
    const nonce = localStorage.getItem('nonce');
    const origState = localStorage.getItem('state');

    try {
      const { token, user } = await apiPost<cbResponse>('/auth/callback', {
        body: {
          state,
          code,
          nonce,
          origState
        }
      });
      await login(token, user);
      localStorage.removeItem('nonce');
      localStorage.removeItem('state');
      await refreshUser();
    } finally {
      // route guard on '/' will respond appropriately
      history.push('/');
    }
  }, [apiPost, history, login, refreshUser]);

  useEffect(() => {
    handleLoginGovCB();
  }, [handleLoginGovCB]);

  return <div>Loading...</div>;
};
