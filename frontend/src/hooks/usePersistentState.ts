import { useState, useEffect, SetStateAction } from 'react';

export const usePersistentState = <T extends any = undefined>(
  key: string,
  defaultValue?: any
): [T, React.Dispatch<SetStateAction<T>>] => {
  const [state, setState] = useState<T>(() => {
    const existing = localStorage.getItem(key);
    return existing ? JSON.parse(existing) : defaultValue;
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(state));
  }, [state, key]);

  return [state, setState];
};
