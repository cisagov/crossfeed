import React from 'react';
import {
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Grid
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

type DialogComponentProps = {
  isOpen: boolean;
  handleClick: () => void;
  icon: React.ReactNode;
  title: React.ReactNode;
  content: React.ReactNode;
  screenWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
};

const InfoDialog: React.FC<DialogComponentProps> = ({
  isOpen,
  handleClick,
  title,
  content,
  screenWidth = 'sm'
}) => {
  return (
    <Dialog open={isOpen} fullWidth maxWidth={screenWidth}>
      <Grid sx={{ textAlign: 'center' }}>
        <DialogTitle sx={{ fontSize: 20 }}>
          <Grid item sx={{ mt: 2 }}>
            <CheckCircleOutlineIcon color="success" sx={{ fontSize: '80px' }} />
          </Grid>
          <Grid item>{title}</Grid>
        </DialogTitle>
        <DialogContent>
          <Grid item>
            <DialogContent>{content}</DialogContent>
          </Grid>
          <Grid item sx={{ mt: 3, mb: 1 }}>
            <Button
              sx={{ width: '30%' }}
              onClick={handleClick}
              size="large"
              variant="contained"
            >
              Ok
            </Button>
          </Grid>
        </DialogContent>
      </Grid>
    </Dialog>
  );
};

export default InfoDialog;
