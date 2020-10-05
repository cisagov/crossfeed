import React from 'react';
import {
  createMuiTheme,
  MuiThemeProvider as ThemeProvider
} from '@material-ui/core';

const theme = createMuiTheme({
  palette: {
    primary: {
      main: '#07648D'
    }
  }
});

export const CFThemeProvider: React.FC = ({ children }) => {
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
};
