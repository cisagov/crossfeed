import React from 'react';
import {
  createMuiTheme,
  MuiThemeProvider as ThemeProvider
} from '@material-ui/core';

const theme = createMuiTheme({
  palette: {
    primary: {
      main: '#07648D'
    },
    secondary: {
      main: '#28A0CB'
    },
    background: {
      default: '#EFF1F5'
    }
  }
});

export const CFThemeProvider: React.FC = ({ children }) => {
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
};
