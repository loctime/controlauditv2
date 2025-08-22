import { lazy } from 'react';

// Lazy loading de componentes para APK (auditoría y reportes)
const AuditoriaAPK = lazy(() => import("../components/pages/auditoria/auditoria/AuditoriaAPK"));
const ReportesAPK = lazy(() => import("../components/pages/auditoria/reporte/ReportesAPK"));
const Login = lazy(() => import("../components/pages/login/Login"));
const Register = lazy(() => import("../components/pages/register/Register"));
const ForgotPassword = lazy(() => import("../components/pages/forgotPassword/ForgotPassword"));

export const routesAPK = [
  // Rutas de autenticación
  {
    id: "login",
    path: "/login",
    Element: Login,
  },
  {
    id: "register", 
    path: "/register",
    Element: Register,
  },
  {
    id: "forgot-password",
    path: "/forgot-password", 
    Element: ForgotPassword,
  },
  // Rutas principales de la APK
  {
    id: "auditoria",
    path: "/",
    Element: AuditoriaAPK,
  },
  {
    id: "auditoria-alt",
    path: "/auditoria",
    Element: AuditoriaAPK,
  },
  {
    id: "reportes",
    path: "/reportes",
    Element: ReportesAPK,
  }
];
