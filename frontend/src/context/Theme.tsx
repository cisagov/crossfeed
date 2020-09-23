import React from 'react';
import {
  createMuiTheme,
  MuiThemeProvider as ThemeProvider
} from '@material-ui/core';

const theme = createMuiTheme({
  palette: {
    primary: {
      main: '#122D5D'
    }
  }
});

export const CFThemeProvider: React.FC = ({ children }) => {
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
};
