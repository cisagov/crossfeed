import { useState, useEffect, SetStateAction, useMemo } from 'react';
import Cookies from 'universal-cookie';

export const usePersistentState = <T extends any = any>(
  key: string,
  defaultValue?: any
): [T, React.Dispatch<SetStateAction<T>>] => {
  const cookies = useMemo(() => new Cookies(), []);

  const [state, setState] = useState<T>(() => {
    const existing = localStorage.getItem(key);
    try {
      return existing ? JSON.parse(existing) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(state));
    if (key === 'token') {
      cookies.set('crossfeed-token', state, {
        domain: process.env.REACT_APP_COOKIE_DOMAIN,
        sameSite: 'strict',
        secure: true
      });
    }
  }, [state, key, cookies]);

  return [state, setState];
};
