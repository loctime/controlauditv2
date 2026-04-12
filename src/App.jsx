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
import ErrorBoundary from './components/common/ErrorBoundary';
import FeedbackButton from './components/common/FeedbackButton';
import AppFooter from './components/common/AppFooter';
import { useConnectivitySimple } from './hooks/useConnectivitySimple';
import syncQueueService from './services/syncQueue';

const App = () => {
  const { isOnline, checkRealConnectivity } = useConnectivitySimple();
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Solo procesar la cola offline en PWA (modo standalone). En web/desktop online
  // no se ejecuta offline mode, por lo que no hay items legítimos que sincronizar.
  // Nota: en escritorio Windows la detección de `standalone` puede fallar.
  // Para evitar que la cola no se procese al reconectar, procesamos sin depender
  // de `isPWA()` y dejamos que `syncQueueService.processQueue()` haga no-op si no hay items.

  // Sincronización manual únicamente: el usuario presiona el ícono en la navbar.
  // No hay auto-procesamiento al iniciar ni al reconectar para evitar fallos
  // por auth no resuelta. Los ítems quedan en cola como 'pending' hasta sync manual.

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
    if (!hasLoadedOnce) {
      localStorage.setItem('controlaudit_loaded_once', 'true');
      setHasLoadedOnce(true);
    }
  }, [hasLoadedOnce]);

  // Función para reintentar conexión
  const handleRetry = async () => {
    window.location.reload();
  };

  // Mostrar fallback offline solo si nunca se cargó y no hay conexión
  // Simplificado para evitar problemas de carga infinita
  if (!isInitialLoad && !isOnline && !hasLoadedOnce) {
    return <OfflineFallback onRetry={handleRetry} />;
  }

  return (
    <ErrorBoundary>
      <ColorModeProvider>
        <AuthContextComponent>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <BrowserRouter>
              <div className="main-app-container">
                <AppRouter />
                {/* Solo mostrar componentes PWA cuando no esté en loading inicial */}
                {!isInitialLoad && (
                  <>
                    <PWAInstallPrompt />
                    <PWADownloadButton />
                  </>
                )}
                <FeedbackButton />
                <AppFooter />
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
    </ErrorBoundary>
  );
};

export default App;
