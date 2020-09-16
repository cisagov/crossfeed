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
  const { apiPost, login } = useAuthContext();
  const { push: historyPush } = useHistory();

  const handleLoginGovCB = useCallback(async () => {
    const { state, code } = parse(window.location.search);
    const nonce = localStorage.getItem('nonce');
    const origState = localStorage.getItem('state');

    try {
      const { token } = await apiPost<cbResponse>('/auth/callback', {
        body: {
          state,
          code,
          nonce,
          origState
        }
      });
      await login(token);
      localStorage.removeItem('nonce');
      localStorage.removeItem('state');
    } catch (e) {
    } finally {
      // route guard on '/' will respond appropriately
      historyPush('/');
    }
  }, [apiPost, historyPush, login]);

  useEffect(() => {
    handleLoginGovCB();
  }, [handleLoginGovCB]);

  return <div></div>;
};
