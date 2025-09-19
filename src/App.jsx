// src/App.jsx
import React, { useState, useEffect } from "react";
import { BrowserRouter } from "react-router-dom";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ColorModeProvider } from "./components/context/ColorModeContext";
import AuthContextComponent from "./components/context/AuthContext";
import AppRouter from "./router/AppRouter";
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import PWAInstallPrompt from './components/common/PWAInstallPrompt';
import PWADownloadButton from './components/common/PWADownloadButton';
import OfflineFallback from './components/common/OfflineFallback';
import { useConnectivity } from './hooks/useConnectivity';
// import { useBackButton } from './hooks/useBackButton'; // Deshabilitado para web

const App = () => {
  // Hook para manejar el botón atrás de Android - deshabilitado para web
  // useBackButton();
  
  const { isOnline, checkRealConnectivity } = useConnectivity();
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Verificar si la app ya se cargó al menos una vez
  useEffect(() => {
    const hasLoaded = localStorage.getItem('controlaudit_loaded_once');
    if (hasLoaded) {
      setHasLoadedOnce(true);
    }
    setIsInitialLoad(false);
  }, []);

  // Marcar que la app se cargó exitosamente
  useEffect(() => {
    if (isOnline && !hasLoadedOnce) {
      localStorage.setItem('controlaudit_loaded_once', 'true');
      setHasLoadedOnce(true);
    }
  }, [isOnline, hasLoadedOnce]);

  // Función para reintentar conexión
  const handleRetry = async () => {
    const realConnectivity = await checkRealConnectivity();
    if (realConnectivity) {
      window.location.reload();
    }
  };

  // Mostrar fallback offline solo si nunca se cargó y no hay conexión
  if (!isInitialLoad && !isOnline && !hasLoadedOnce) {
    return <OfflineFallback onRetry={handleRetry} />;
  }

  return (
    <ColorModeProvider>
      <AuthContextComponent>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <BrowserRouter>
            <div className="main-app-container">
              <AppRouter />
              <PWAInstallPrompt />
              <PWADownloadButton />
              <ToastContainer
                position="top-right"
                autoClose={5000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="light"
              />
            </div>
          </BrowserRouter>
        </LocalizationProvider>
      </AuthContextComponent>
    </ColorModeProvider>
  );
};

export default App;
