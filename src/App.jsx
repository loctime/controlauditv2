// src/App.jsx
import React, { useEffect } from "react";
import { BrowserRouter } from "react-router-dom";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './styles/main.css'; // Estilos principales unificados
import './centering-fixes.css'; // Fixes para centrar contenido en web
import './web-optimization.css'; // Optimizaciones específicas para web
import './mobile-optimization.css'; // Optimizaciones específicas para móvil
import './safe-areas.css'; // Safe areas para móvil
import './web-priority.css'; // Prioridad web - override de optimizaciones móviles
import './responsive-strategy.css'; // Estrategia responsiva inteligente
import './responsive-overrides.css'; // Overrides específicos para componentes
import { ColorModeProvider } from "./components/context/ColorModeContext";
import AuthContextComponent from "./components/context/AuthContext";
import AppRouter from "./router/AppRouter";
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { initializeSafeAreas } from './utils/safeAreaUtils';
// ControlFileInfo obsoleto - ahora se usa backend compartido

const App = () => {
  // Inicializar safe areas cuando se monta la aplicación
  useEffect(() => {
    initializeSafeAreas();
  }, []);

  return (
    <ColorModeProvider>
      <AuthContextComponent>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <BrowserRouter>
            <div className="main-app-container">
              <AppRouter />
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
                      {/* ✅ Footer con información del sistema */}
        <Box sx={{ textAlign: 'center', py: 2, color: 'text.secondary' }}>
          <Typography variant="body2">
            ControlAudit v2 - Sistema de Auditorías Multi-Tenant
          </Typography>
        </Box>
            </div>
          </BrowserRouter>
        </LocalizationProvider>
      </AuthContextComponent>
    </ColorModeProvider>
  );
};

export default App;
