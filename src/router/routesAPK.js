import { lazy } from 'react';

// Lazy loading de componentes para APK (todas las páginas disponibles)
const AuditoriaAPK = lazy(() => import("../components/pages/auditoria/auditoria/AuditoriaAPK"));
const ReportesAPK = lazy(() => import("../components/pages/auditoria/reporte/ReportesAPK"));
const Login = lazy(() => import("../components/pages/login/Login"));
const Register = lazy(() => import("../components/pages/register/Register"));
const ForgotPassword = lazy(() => import("../components/pages/forgotPassword/ForgotPassword"));

// Importar todas las páginas de la web con wrappers para APK
const Home = lazy(() => import("../components/pages/home/Home"));
const EstablecimientosContainer = lazy(() => import("../components/pages/establecimiento/EstablecimientosContainer"));
const SucursalContainer = lazy(() => import("../components/pages/SucursalContainer.jsx/SucursalContainer"));
const Auditoria = lazy(() => import("../components/pages/auditoria/auditoria/Auditoria"));
const Formulario = lazy(() => import("../components/pages/formulario/Formulario"));
const EditarFormulario = lazy(() => import("../components/pages/editar/EditarFormulario"));
const Informe = lazy(() => import("../components/pages/auditoria/Informe"));
const ReportesPage = lazy(() => import("../components/pages/auditoria/reporte/ReportesPage"));
const PerfilUsuario = lazy(() => import("../components/pages/perfil/PerfilUsuario"));
const LogsOperarios = lazy(() => import('../components/pages/usuarios').then(module => ({ default: module.LogsOperarios })));
const DashboardAPK = lazy(() => import("../components/pages/dashboard/DashboardAPK"));
const ClienteDashboard = lazy(() => import("../components/pages/admin/ClienteDashboard"));
const OperarioDashboard = lazy(() => import("../components/pages/user/OperarioDashboard"));
const PermissionsDebug = lazy(() => import("../components/pages/debug/PermissionsDebug"));
const GaleriaFormulariosPublicos = lazy(() => import('../components/pages/formulario/GaleriaFormulariosPublicos'));
const ConfiguracionPage = lazy(() => import('../components/pages/configuracion/ConfiguracionPage'));

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
  
  // Rutas principales de la APK (con navegación especial)
  {
    id: "auditoria-apk",
    path: "/",
    Element: AuditoriaAPK,
  },
  {
    id: "auditoria-apk-alt",
    path: "/auditoria-apk",
    Element: AuditoriaAPK,
  },
  {
    id: "reportes-apk",
    path: "/reportes-apk",
    Element: ReportesAPK,
  },
  
  // Todas las páginas de la web habilitadas para APK
  {
    id: "dashboard",
    path: "/dashboard",
    Element: DashboardAPK,
  },
  {
    id: "cliente-dashboard",
    path: "/cliente-dashboard",
    Element: ClienteDashboard,
  },
  {
    id: "operario-dashboard",
    path: "/operario-dashboard",
    Element: OperarioDashboard,
  },
  {
    id: "home",
    path: "/home",
    Element: Home,
  },
  {
    id: "establecimiento",
    path: "/establecimiento",
    Element: EstablecimientosContainer,
  },
  {
    id: "sucursal",
    path: "/sucursales",
    Element: SucursalContainer,
  },
  {
    id: "sucursal-empresa",
    path: "/sucursales/:empresaId",
    Element: SucursalContainer,
  },
  {
    id: "auditoria",
    path: "/auditoria",
    Element: Auditoria,
  },
  {
    id: "formulario",
    path: "/formulario",
    Element: Formulario,
  },
  {
    id: "editar",
    path: "/editar",
    Element: EditarFormulario,
  },
  {
    id: "reporte",
    path: "/reporte",
    Element: ReportesPage,
  },
  {
    id: "perfil",
    path: "/perfil",
    Element: PerfilUsuario,
  },
  {
    id: "debug",
    path: "/debug",
    Element: PermissionsDebug,
  },
  {
    id: "logs",
    path: "/usuarios/logs",
    Element: LogsOperarios,
  },
  {
    id: "formularios-publicos",
    path: "/formularios-publicos",
    Element: GaleriaFormulariosPublicos,
  },
  {
    id: "configuracion",
    path: "/configuracion",
    Element: ConfiguracionPage,
  }
];
