import { useState, useEffect, SetStateAction } from 'react';

export const usePersistentState = <T extends any = any>(
  key: string,
  defaultValue?: any
): [T, React.Dispatch<SetStateAction<T>>] => {
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
  }, [state, key]);

  return [state, setState];
};
