import { Route, Routes, Navigate } from "react-router-dom";
import React, { Suspense } from "react";
import Navbar from "../components/layout/navbar/Navbar";
import { routes, publicRoutes } from "./routesOptimized";
import ProtectedUsers from "./ProtectedUsers";
import RouteGuard from "./RouteGuard";
import LazyLoader from "../components/common/LazyLoader";

const AppRouter = () => {
  return (
    <Routes>
      {publicRoutes.map(({ id, path, Element, redirectTo }) => (
        <Route
          key={id}
          path={path}
          element={
            redirectTo ? (
              <Navigate to={redirectTo} replace />
            ) : (
              <Suspense fallback={<LazyLoader message={`Cargando ${id}...`} />}>
                <Element />
              </Suspense>
            )
          }
        />
      ))}

      <Route element={<ProtectedUsers />}>
        <Route element={<Navbar />}>
          {routes.map(({ id, path, roles = [], Element, redirectTo }) => (
            <Route
              key={id}
              path={path}
              element={
                redirectTo ? (
                  <Navigate to={redirectTo} replace />
                ) : (
                  <RouteGuard roles={roles}>
                    <Suspense fallback={<LazyLoader message={`Cargando ${id}...`} />}>
                      <Element />
                    </Suspense>
                  </RouteGuard>
                )
              }
            />
          ))}
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRouter;
