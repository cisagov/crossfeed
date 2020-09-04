import { useState, useEffect } from 'react';

export const usePersistentState = (key: string, defaultValue?: any) => {
  const [state, setState] = useState(
    () => JSON.parse(localStorage.getItem(key) ?? '') ?? defaultValue
  );

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(state));
  }, [state, key]);

  return [state, setState];
};
