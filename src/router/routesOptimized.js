import { lazy } from "react";
import { protectedRoutesConfig, publicRoutesConfig } from "../config/routesConfig";

const Home = lazy(() => import("../components/pages/home/Home"));
const Dashboard = lazy(() => import("../components/pages/dashboard/Dashboard"));
const DashboardSeguridad = lazy(() => import("../components/pages/dashboard/DashboardSeguridadV2"));
const ClienteDashboard = lazy(() => import("../components/pages/admin/ClienteDashboard"));
const EstablecimientosContainer = lazy(() => import("../components/pages/establecimiento/EstablecimientosContainer"));
const Auditoria = lazy(() => import("../components/pages/auditoria/auditoria/Auditoria"));
const Formulario = lazy(() => import("../components/pages/formulario/Formulario"));
const ReportesPage = lazy(() => import("../components/pages/auditoria/reporte/ReportesPage"));
const PerfilUsuario = lazy(() => import("../components/pages/perfil/PerfilUsuario"));
const PermissionsDebug = lazy(() => import("../components/pages/debug/PermissionsDebug"));
const TestControlFile = lazy(() => import("../components/pages/debug/TestControlFile"));
const LogsOperarios = lazy(() =>
  import("../components/pages/usuarios").then((module) => {
    const Component = module.LogsOperarios || module.default;
    if (!Component) {
      throw new Error("LogsOperarios component not found");
    }
    return { default: Component };
  })
);
const GaleriaFormulariosPublicos = lazy(() =>
  import("../components/pages/formulario/GaleriaFormulariosPublicos")
);
const ConfiguracionPage = lazy(() => import("../components/pages/configuracion/ConfiguracionPage"));
const Empleados = lazy(() => import("../components/pages/empleados/Empleados"));
const Capacitaciones = lazy(() => import("../components/pages/capacitaciones/Capacitaciones"));
const RegistrarAsistencia = lazy(() =>
  import("../components/pages/capacitaciones/RegistrarAsistencia")
);
const TrainingModule = lazy(() => import("../components/pages/training/TrainingModule"));
const ConfigurationScreen = lazy(() => import("../components/pages/training/screens/ConfigurationScreen"));
const PlanItemsPage = lazy(() => import("../components/pages/training/screens/PlanItemsPage"));
const Accidentes = lazy(() => import("../components/pages/accidentes/Accidentes"));
const Ausencias = lazy(() => import("../components/pages/ausencias/Ausencias"));
const AuditoriasManuales = lazy(() =>
  import("../components/pages/auditoriasManuales/AuditoriasManuales")
);
const AuditoriaManualDetalle = lazy(() =>
  import("../components/pages/auditoriasManuales/components/AuditoriaManualDetalle")
);

const Login = lazy(() => import("../components/pages/login/Login"));
const Register = lazy(() => import("../components/pages/register/Register"));
const ForgotPassword = lazy(() => import("../components/pages/forgotPassword/ForgotPassword"));
const VistaFormularioPublico = lazy(() =>
  import("../components/pages/formulario/VistaFormularioPublico")
);

const componentMap = {
  home: Home,
  tablero: Dashboard,
  "dashboard-seguridad": DashboardSeguridad,
  panel: ClienteDashboard,
  establecimiento: EstablecimientosContainer,
  auditoria: Auditoria,
  formulario: Formulario,
  reporte: ReportesPage,
  perfil: PerfilUsuario,
  debug: PermissionsDebug,
  "test-controlfile": TestControlFile,
  "usuarios-logs": LogsOperarios,
  "formularios-publicos": GaleriaFormulariosPublicos,
  configuracion: ConfiguracionPage,
  empleados: Empleados,
  capacitaciones: Capacitaciones,
  "capacitacion-vieja": Capacitaciones,
  training: TrainingModule,
  "training-config": ConfigurationScreen,
  "training-plan-items": PlanItemsPage,
  "capacitacion-asistencia": RegistrarAsistencia,
  accidentes: Accidentes,
  "salud-ocupacional": Ausencias,
  "legacy-ausencias": Ausencias,
  "auditorias-manuales": AuditoriasManuales,
  "auditoria-manual-detalle": AuditoriaManualDetalle,

  login: Login,
  register: Register,
  "forgot-password": ForgotPassword,
  "formularios-public-view": VistaFormularioPublico,
};

export const routes = protectedRoutesConfig.map((route) => ({
  ...route,
  Element: componentMap[route.id],
}));

export const publicRoutes = publicRoutesConfig.map((route) => ({
  ...route,
  Element: componentMap[route.id],
}));

