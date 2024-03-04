import React, { useEffect, useMemo, useState } from 'react';
import {
  createTheme,
  ThemeProvider,
  Theme,
  StyledEngineProvider
} from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { PaletteMode } from '@mui/material';
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
  const [mode, setMode] = useState<PaletteMode>('light');

  const switchDarkMode = () => {
    setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };

  useEffect(() => {
    console.log(window.matchMedia('(prefers-color-scheme: dark)').matches);
    const prefersDarkMode = window.matchMedia(
      '(prefers-color-scheme: dark)'
    ).matches;
    setMode(prefersDarkMode ? 'dark' : 'light');
    console.log('prefersDarkMode', prefersDarkMode);
  }, []);

  console.log('mode', mode);

  const getDesignTokens = (mode: PaletteMode) => ({
    palette: {
      mode,
      ...(mode === 'light'
        ? {
            primary: {
              main: '#07648D'
            },
            secondary: {
              main: '#28A0CB'
            },
            background: {
              default: '#EFF1F5'
            },
            text: {
              primary: '#000'
            }
          }
        : {
            primary: {
              main: '#07648D'
            },
            secondary: {
              main: '#28A0CB'
            },
            background: {
              default: '#1E1E1E'
            },
            text: {
              primary: '#fff'
            }
          }),
      breakpoints: {
        values: {
          xs: 0,
          sm: 600,
          md: 960,
          lg: 1330,
          xl: 1920
        }
      }
    }
  });

  const theme = useMemo(() => createTheme(getDesignTokens(mode)), [mode]);
  //     primary: {
  //       main: '#07648D'
  //     },
  //     secondary: {
  //       main: '#28A0CB'
  //     },
  //     background: {
  //       default: '#EFF1F5'
  //     },
  //     text: {
  //       primary: mode === 'light' ? '#000' : '#fff'
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

  // const theme = useMemo(
  //   () =>
  //     createTheme({
  //       palette: {
  //         mode,
  //         primary: {
  //           main: '#07648D'
  //         },
  //         secondary: {
  //           main: '#28A0CB'
  //         },
  //         background: {
  //           default: '#EFF1F5'
  //         },
  //         text: {
  //           primary: mode === 'light' ? '#000' : '#fff'
  //         }
  //       },
  //       breakpoints: {
  //         values: {
  //           xs: 0,
  //           sm: 600,
  //           md: 960,
  //           lg: 1330,
  //           xl: 1920
  //         }
  //       }
  //     }),
  //   [mode]
  // );

  return (
    <StyledEngineProvider injectFirst>
      <CFThemeContext.Provider value={{ switchDarkMode }}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          {children}
        </ThemeProvider>
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
