import { lazy } from 'react';

// Lazy loading de componentes principales
const Home = lazy(() => import("../components/pages/home/Home"));
const EstablecimientosContainer = lazy(() => import("../components/pages/establecimiento/EstablecimientosContainer"));
const Auditoria = lazy(() => import("../components/pages/auditoria/auditoria/Auditoria"));
const Formulario = lazy(() => import("../components/pages/formulario/Formulario"));
const EditarFormulario = lazy(() => import("../components/pages/editar/EditarFormulario"));
const Informe = lazy(() => import("../components/pages/auditoria/Informe"));
const ReportesPage = lazy(() => import("../components/pages/auditoria/reporte/ReportesPage"));
const PerfilUsuario = lazy(() => import("../components/pages/perfil/PerfilUsuario"));
const LogsOperarios = lazy(() => import('../components/pages/usuarios').then(module => ({ default: module.LogsOperarios })));
const Dashboard = lazy(() => import("../components/pages/dashboard/Dashboard"));
const DashboardSeguridad = lazy(() => import("../components/pages/dashboard/DashboardSeguridadV2"));
const ClienteDashboard = lazy(() => import("../components/pages/admin/ClienteDashboard"));
const OperarioDashboard = lazy(() => import("../components/pages/user/OperarioDashboard"));
const PermissionsDebug = lazy(() => import("../components/pages/debug/PermissionsDebug"));
const GaleriaFormulariosPublicos = lazy(() => import('../components/pages/formulario/GaleriaFormulariosPublicos'));
const ConfiguracionPage = lazy(() => import('../components/pages/configuracion/ConfiguracionPage'));
const Empleados = lazy(() => import('../components/pages/empleados/Empleados'));
const Capacitaciones = lazy(() => import('../components/pages/capacitaciones/Capacitaciones'));
const RegistrarAsistencia = lazy(() => import('../components/pages/capacitaciones/RegistrarAsistencia'));
const Accidentes = lazy(() => import('../components/pages/accidentes/Accidentes'));

export const routes = [
  {
    id: "dashboard",
    path: "/dashboard",
    Element: Dashboard,
  },
  {
    id: "dashboard-seguridad",
    path: "/dashboard-seguridad",
    Element: DashboardSeguridad,
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
    path: "/",
    Element: Home,
  },
  {
    id: "establecimiento",
    path: "/establecimiento",
    Element: EstablecimientosContainer,
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
    protected: true,
    roles: ['max', 'supermax']
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
  },
  {
    id: "empleados",
    path: "/empleados",
    Element: Empleados,
  },
  {
    id: "capacitaciones",
    path: "/capacitaciones",
    Element: Capacitaciones,
  },
  {
    id: "capacitacion-asistencia",
    path: "/capacitacion/:capacitacionId/asistencia",
    Element: RegistrarAsistencia,
  },
  {
    id: "accidentes",
    path: "/accidentes",
    Element: Accidentes,
  }
];
