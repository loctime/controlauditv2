// src/App.jsx
import React, { useEffect } from "react";
import { BrowserRouter } from "react-router-dom";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './safe-areas.css'; // Importar configuraciones de safe areas
import './mobile-optimization.css'; // Importar optimizaciones para móviles
import './web-optimization.css'; // Importar optimizaciones para web/PC
import './centering-fixes.css'; // Importar fixes para centrado en web
import { ColorModeProvider } from "./components/context/ColorModeContext";
import AuthContextComponent from "./components/context/AuthContext";
import AppRouter from "./router/AppRouter";
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { initializeSafeAreas } from './utils/safeAreaUtils';

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
            </div>
          </BrowserRouter>
        </LocalizationProvider>
      </AuthContextComponent>
    </ColorModeProvider>
  );
};

export default App;
