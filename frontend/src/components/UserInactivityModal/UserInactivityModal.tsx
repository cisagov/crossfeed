import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  Typography
} from '@mui/material';

interface InactiveUserModalProps {
  isOpen: boolean;
  onCountdownEnd: (shouldLogout: boolean) => void;
  countdown: number;
}

const InactiveUserModal = ({
  isOpen,
  onCountdownEnd,
  countdown
}: InactiveUserModalProps) => {
  const [remainingTime, setRemainingTime] = useState(countdown);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setRemainingTime(countdown);

    const countdownInterval = setInterval(() => {
      setRemainingTime((prevTime) => prevTime - 1);
    }, 1000);

    return () => {
      clearInterval(countdownInterval);
    };
  }, [isOpen, countdown]);

  useEffect(() => {
    if (remainingTime === 0) {
      onCountdownEnd(true);
    }
  }, [remainingTime, onCountdownEnd]);

  return (
    <Dialog open={isOpen}>
      <DialogContent>
        <Typography variant="h6">
          You have been inactive for a while.
        </Typography>
        <Typography variant="body1">
          You will be logged out in {remainingTime} seconds.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button color="primary" onClick={() => onCountdownEnd(false)}>
          Stay logged in
        </Button>
        <Button color="secondary" onClick={() => onCountdownEnd(true)}>
          Log out
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default InactiveUserModal;
