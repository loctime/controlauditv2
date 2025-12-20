import { Route, Routes } from "react-router-dom";
import React, { Suspense, useEffect } from "react";
import Navbar from "../components/layout/navbar/Navbar";
import { routes } from "./routesOptimized";
import Login from "../components/pages/login/Login";
import Register from "../components/pages/register/Register";
import ForgotPassword from "../components/pages/forgotPassword/ForgotPassword";
import ProtectedUsers from "./ProtectedUsers";
import DashboardProtected from "./DashboardProtected";
import VistaFormularioPublico from '../components/pages/formulario/VistaFormularioPublico';
import LazyLoader from '../components/common/LazyLoader';

const AppRouter = () => {
  // Logs de debug para producción
  useEffect(() => {
    console.log('🔍 [AppRouter] Inicializando router...');
    console.log('🔍 [AppRouter] Total de rutas registradas:', routes.length);
    console.log('🔍 [AppRouter] Rutas registradas:', routes.map(r => ({ id: r.id, path: r.path })));
    
    const testControlFileRoute = routes.find(r => r.path === '/test-controlfile');
    if (testControlFileRoute) {
      console.log('✅ [AppRouter] Ruta /test-controlfile ENCONTRADA:', testControlFileRoute);
    } else {
      console.error('❌ [AppRouter] Ruta /test-controlfile NO ENCONTRADA en el array de rutas');
      console.error('❌ [AppRouter] Rutas disponibles:', routes.map(r => r.path));
    }
  }, []);

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
          {routes.map(({ id, path, Element }) => (
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