import Home from "../components/pages/home/Home";
import EstablecimientosContainer from "../components/pages/establecimiento/EstablecimientosContainer";
import Auditoria from "../components/pages/auditoria/auditoria/Auditoria";
import Formulario from "../components/pages/formulario/Formulario";
import EditarFormulario from "../components/pages/editar/EditarFormulario";
//import Reporte from "../components/pages/auditoria/reporte";
import Informe from "../components/pages/auditoria/Informe";
import ReportesPage from "../components/pages/auditoria/reporte/ReportesPage";
import PerfilUsuario from "../components/pages/perfil/PerfilUsuario";
import { LogsOperarios } from '../components/pages/usuarios';
import Dashboard from "../components/pages/dashboard/Dashboard";
import ClienteDashboard from "../components/pages/admin/ClienteDashboard";
import OperarioDashboard from "../components/pages/user/OperarioDashboard";
import PermissionsDebug from "../components/pages/debug/PermissionsDebug";
import GaleriaFormulariosPublicos from '../components/pages/formulario/GaleriaFormulariosPublicos';
import ConfiguracionPage from '../components/pages/configuracion/ConfiguracionPage';
import Accidentes from '../components/pages/accidentes/Accidentes';
import DashboardHigieneSeguridad from '../components/pages/dashboard-higiene/DashboardHigieneSeguridad';

export const routes = [
  {
    id: "dashboard",
    path: "/dashboard",
    Element: Dashboard,
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
    protected: true,
    roles: ['supermax']
  },
  {
    id: "accidentes",
    path: "/accidentes",
    Element: Accidentes,
  },
  {
    id: "dashboard-seguridad",
    path: "/dashboard-seguridad",
    Element: DashboardHigieneSeguridad,
    protected: true,
    roles: ['max', 'supermax']
  },
];
