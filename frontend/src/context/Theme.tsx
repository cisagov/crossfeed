import React from 'react';
import {
  createTheme,
  ThemeProvider,
  Theme,
  StyledEngineProvider
} from '@mui/material/styles';

declare module '@mui/material/styles' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface DefaultTheme extends Theme {}
}

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

interface CFThemeProviderProps {
  children: React.ReactNode;
}
export const CFThemeProvider: React.FC<CFThemeProviderProps> = ({
  children
}) => {
  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </StyledEngineProvider>
  );
};
