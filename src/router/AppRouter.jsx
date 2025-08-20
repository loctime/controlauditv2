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

const AppRouter = () => {
  const { isAPK, isWeb, isLoading } = usePlatform();

  // Mostrar loader mientras se detecta la plataforma
  if (isLoading) {
    return <LazyLoader message="Detectando plataforma..." />;
  }

  // Si es APK, mostrar solo la auditoría sin navbar
  if (isAPK) {
    return (
      <Routes>
        {routesAPK.map(({ id, path, Element }) => (
          <Route 
            key={id} 
            path={path} 
            element={
              <Suspense fallback={<LazyLoader message={`Cargando auditoría...`} />}>
                <Element />
              </Suspense>
            } 
          />
        ))}
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