import React, { createContext, useMemo, useState, useContext, useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';

// Contexto para el modo de color
const ColorModeContext = createContext({ toggleColorMode: () => {}, mode: 'light' });

export const useColorMode = () => useContext(ColorModeContext);

export const ColorModeProvider = ({ children }) => {
  // Lee la preferencia del usuario de localStorage o usa 'light' por defecto
  const getInitialMode = () => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('colorMode');
      return stored === 'dark' ? 'dark' : 'light';
    }
    return 'light';
  };

  const [mode, setMode] = useState(getInitialMode);

  useEffect(() => {
    localStorage.setItem('colorMode', mode);
    // Debug log
    console.debug('[ColorMode] Modo actual:', mode);
    if (typeof document !== 'undefined') {
      document.body.setAttribute('data-theme', mode);
    }
  }, [mode]);

  const colorMode = useMemo(
    () => ({
      mode,
      toggleColorMode: () => setMode((prev) => (prev === 'light' ? 'dark' : 'light')),
    }),
    [mode]
  );

  // Define el tema de MUI según el modo
  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          ...(mode === 'dark'
            ? {
                background: {
                  default: '#111',
                  paper: '#222',
                },
                text: {
                  primary: '#fff',
                  secondary: '#bbb',
                },
              }
            : {
                background: {
                  default: '#f5f5f5',
                  paper: '#fff',
                },
                text: {
                  primary: '#222',
                  secondary: '#444',
                },
              }),
        },
        shape: { borderRadius: 8 },
      }),
    [mode]
  );

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </ColorModeContext.Provider>
  );
}; 