import Home from "../components/pages/home/Home";
import usuarios from "../components/pages/usuarios/Usuarios";
import EstablecimientosContainer from "../components/pages/establecimiento/EstablecimientosContainer";
import SucursalContainer from "../components/pages/SucursalContainer.jsx/SucursalContainer";
import Auditoria from "../components/pages/auditoria/auditoria/Auditoria";
import Formulario from "../components/pages/formulario/Formulario";
import EditarFormulario from "../components/pages/editar/EditarFormulario";
//import Reporte from "../components/pages/auditoria/reporte";
import Informe from "../components/pages/auditoria/Informe";
import GenerarPdf from "../components/pages/auditoria/reporte/GenerarPdf";

export const routes = [
  {
    id: "home",
    path: "/",
    Element: Home,
  },
  {
    id: "usuarios",
    path: "/usuarios",
    Element: usuarios,
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
    Element: GenerarPdf,
  },
  ];
