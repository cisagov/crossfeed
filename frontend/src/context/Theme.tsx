import React from 'react';
import {
  createTheme,
  MuiThemeProvider as ThemeProvider
} from '@material-ui/core';

const theme = createTheme({
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
  },
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 960,
      lg: 1330,
      xl: 1920
    }
  }
});

export const CFThemeProvider: React.FC = ({ children }) => {
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
};
