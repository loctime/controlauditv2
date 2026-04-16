import React, { createContext, useMemo, useContext } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';

// Solo modo claro: el toggle de dark fue eliminado del producto.
const ColorModeContext = createContext({ toggleColorMode: () => {}, mode: 'light' });

export const useColorMode = () => useContext(ColorModeContext);

export const ColorModeProvider = ({ children }) => {
  const mode = 'light';

  const colorMode = useMemo(
    () => ({
      mode,
      toggleColorMode: () => {},
    }),
    []
  );

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: 'light',
          background: {
            default: '#f5f5f5',
            paper: '#fff',
          },
          text: {
            primary: '#222',
            secondary: '#444',
          },
        },
        shape: { borderRadius: 8 },
        typography: {
          htmlFontSize: 16,
          fontSize: 13,
        },
      }),
    []
  );

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </ColorModeContext.Provider>
  );
};