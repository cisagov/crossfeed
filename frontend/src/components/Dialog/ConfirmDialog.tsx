import React from 'react';
import {
  Button,
  Dialog as MuiDialog,
  DialogActions,
  DialogContent,
  DialogTitle
} from '@mui/material';

type DialogComponentProps = {
  isOpen: boolean;
  onClose?: (...args: any[]) => void;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  content: React.ReactNode;
  disabled?: boolean;
  screenWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
};

const ConfirmDialog: React.FC<DialogComponentProps> = ({
  isOpen,
  onClose,
  onConfirm,
  onCancel,
  title,
  content,
  disabled = false,
  screenWidth = 'sm'
}) => {
  return (
    <MuiDialog open={isOpen} onClose={onClose} fullWidth maxWidth={screenWidth}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>{content}</DialogContent>
      <DialogActions sx={{ pb: 3, pr: 3 }}>
        <Button size="large" variant="text" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          size="large"
          variant="contained"
          onClick={onConfirm}
          disabled={disabled}
        >
          Confirm
        </Button>
      </DialogActions>
    </MuiDialog>
  );
};

export default ConfirmDialog;
