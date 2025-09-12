// src/App.jsx
import React from "react";
import { BrowserRouter } from "react-router-dom";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ColorModeProvider } from "./components/context/ColorModeContext";
import AuthContextComponent from "./components/context/AuthContext";
import AppRouter from "./router/AppRouter";
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
// import { useBackButton } from './hooks/useBackButton'; // Deshabilitado para web

const App = () => {
  // Hook para manejar el botón atrás de Android - deshabilitado para web
  // useBackButton();

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
