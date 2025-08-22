import { Route, Routes } from "react-router-dom";
import React, { Suspense } from "react";
import Navbar from "../components/layout/navbar/Navbar";
import { routesWeb } from "./routesWeb";
import { routesAPK } from "./routesAPK";
import Login from "../components/pages/login/Login";
import Register from "../components/pages/register/Register";
import ForgotPassword from "../components/pages/forgotPassword/ForgotPassword";
import ProtectedUsers from "./ProtectedUsers";
import DashboardProtected from "./DashboardProtected";
import VistaFormularioPublico from '../components/pages/formulario/VistaFormularioPublico';
import LazyLoader from '../components/common/LazyLoader';
import { usePlatform } from '../hooks/usePlatform';
import { useAuth } from '../components/context/AuthContext';

const AppRouter = () => {
  const { isAPK, isWeb, isLoading } = usePlatform();
  const { isLogged, loading: authLoading } = useAuth();

  // Mostrar loader mientras se detecta la plataforma
  if (isLoading || authLoading) {
    return <LazyLoader message="Detectando plataforma..." />;
  }

  // Si es APK, mostrar rutas con protección de autenticación
  if (isAPK) {
    return (
      <Routes>
        {/* Rutas públicas de autenticación */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        
        {/* Rutas protegidas - redirigir a login si no está autenticado */}
        {routesAPK
          .filter(route => !['login', 'register', 'forgot-password'].includes(route.id))
          .map(({ id, path, Element }) => (
            <Route 
              key={id} 
              path={path} 
              element={
                isLogged ? (
                  <Suspense fallback={<LazyLoader message={`Cargando auditoría...`} />}>
                    <Element />
                  </Suspense>
                ) : (
                  <Login />
                )
              } 
            />
          ))}
        
        {/* Redirigir rutas no encontradas a login si no está autenticado */}
        <Route path="*" element={isLogged ? <h1>Página no encontrada</h1> : <Login />} />
      </Routes>
    );
  }

  // Si es web, mostrar todas las rutas con navbar
  return (
    <Routes>
      {/* Rutas públicas */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/formularios/public/:publicSharedId" element={<VistaFormularioPublico />} />

      {/* Rutas protegidas */}
      <Route element={<ProtectedUsers />}>
        <Route element={<Navbar />}>
          {routesWeb.map(({ id, path, Element }) => (
            <Route 
              key={id} 
              path={path} 
              element={
                <Suspense fallback={<LazyLoader message={`Cargando ${id}...`} />}>
                  {path === "/dashboard" ? (
                    <DashboardProtected>
                      <Element />
                    </DashboardProtected>
                  ) : (
                    <Element />
                  )}
                </Suspense>
              } 
            />
          ))}
        </Route>
      </Route>

      {/* Not found */}
      <Route path="*" element={<h1>Not found</h1>} />
    </Routes>
  );
};

export default AppRouter;