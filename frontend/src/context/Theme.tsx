import React, { useEffect, useMemo } from 'react';
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

// const theme = createTheme({
//   palette: {
//     primary: {
//       main: '#07648D'
//     },
//     secondary: {
//       main: '#28A0CB'
//     },
//     background: {
//       default: '#EFF1F5'
//     }
//   },
//   breakpoints: {
//     values: {
//       xs: 0,
//       sm: 600,
//       md: 960,
//       lg: 1330,
//       xl: 1920
//     }
//   }
// });

type CFThemeContextType = {
  switchDarkMode: () => void;
};

export const CFThemeContext = React.createContext<CFThemeContextType>({
  switchDarkMode: () => {}
});

export function CFThemeContextProvider({ children }: CFThemeProviderProps) {
  const [mode, setMode] = React.useState<'light' | 'dark'>('light');

  const switchDarkMode = () => {
    setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };

  useEffect(() => {
    const mediaQuery = window.matchMedia(
      '(prefers-color-scheme: dark)'
    ).matches;
    if (mediaQuery) {
      setMode('dark');
    } else {
      setMode('light');
    }
  }, []);

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
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
      }),
    [mode]
  );

  return (
    <StyledEngineProvider injectFirst>
      <CFThemeContext.Provider value={{ switchDarkMode }}>
        <ThemeProvider theme={theme}>{children}</ThemeProvider>
      </CFThemeContext.Provider>
    </StyledEngineProvider>
  );
}

interface CFThemeProviderProps {
  children: React.ReactNode;
}
// export const CFThemeProvider: React.FC<CFThemeProviderProps> = ({
//   children
// }) => {
//   return (
//     <StyledEngineProvider injectFirst>
//       <ThemeProvider theme={theme}>{children}</ThemeProvider>
//     </StyledEngineProvider>
//   );
// };
