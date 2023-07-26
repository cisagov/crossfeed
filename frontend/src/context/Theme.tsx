import React from 'react';
import {
  createTheme,
  ThemeProvider,
  Theme,
  StyledEngineProvider,
  adaptV4Theme
} from '@mui/material';

declare module '@mui/styles/defaultTheme' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface DefaultTheme extends Theme {}
}

const theme = createTheme(
  adaptV4Theme({
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
  })
);

// type ProviderProps = {
//   children: React.ReactNode;
// }

export const CFThemeProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </StyledEngineProvider>
  );
};
