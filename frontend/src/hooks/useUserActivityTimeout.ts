import { useState, useEffect } from 'react';

export const useUserActivityTimeout = (timeout: number, loggedIn: boolean) => {
  const [lastActivityTime, setLastActivityTime] = useState<Date>(new Date());
  const [isTimedOut, setIsTimedOut] = useState<boolean>(false);
  const [resetKey, setResetKey] = useState<number>(0);

  // This function will be used to reset the timeout externally
  const resetTimeout = () => {
    setIsTimedOut(false);
    setResetKey((key) => key + 1);
  };

  useEffect(() => {
    const updateLastActivityTime = () => setLastActivityTime(new Date());

    window.addEventListener('mousemove', updateLastActivityTime);
    window.addEventListener('keydown', updateLastActivityTime);

    return () => {
      window.removeEventListener('mousemove', updateLastActivityTime);
      window.removeEventListener('keydown', updateLastActivityTime);
    };
  }, []);

  useEffect(() => {
    const checkLastActivityTime = () => {
      if (loggedIn) {
        const now = new Date();
        const timeSinceLastActivity =
          now.getTime() - lastActivityTime.getTime();
        if (timeSinceLastActivity > timeout) {
          setIsTimedOut(true);
        }
      }
    };

    const intervalId = setInterval(checkLastActivityTime, 1000);

    return () => clearInterval(intervalId);
  }, [lastActivityTime, timeout, resetKey, loggedIn]);

  return { isTimedOut, resetTimeout };
};
