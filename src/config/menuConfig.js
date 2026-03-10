import HomeIcon from "@mui/icons-material/Home";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import ChecklistIcon from "@mui/icons-material/Checklist";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import BusinessIcon from "@mui/icons-material/Business";
import FormatListBulletedOutlinedIcon from "@mui/icons-material/FormatListBulletedOutlined";
import PersonIcon from "@mui/icons-material/Person";
import SettingsIcon from "@mui/icons-material/Settings";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import HealthAndSafetyIcon from "@mui/icons-material/HealthAndSafety";
import PeopleIcon from "@mui/icons-material/People";
import SchoolIcon from "@mui/icons-material/School";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import HealingIcon from "@mui/icons-material/Healing";
import AssignmentIcon from "@mui/icons-material/Assignment";
import BugReportIcon from "@mui/icons-material/BugReport";
import ScienceIcon from "@mui/icons-material/Science";

import { routesConfig } from "./routesConfig";
import { hasAccess } from "../utils/accessControl";

const routeIcons = {
  tablero: HomeIcon,
  "dashboard-seguridad": HealthAndSafetyIcon,
  panel: CalendarTodayIcon,
  auditoria: ChecklistIcon,
  "auditorias-manuales": AssignmentIcon,
  reporte: PictureAsPdfIcon,
  establecimiento: BusinessIcon,
  empleados: PeopleIcon,
  "capacitacion-vieja": SchoolIcon,
  accidentes: ReportProblemIcon,
  "salud-ocupacional": HealingIcon,
  formulario: FormatListBulletedOutlinedIcon,
  configuracion: SettingsIcon,
  perfil: PersonIcon,
  "usuarios-logs": BadgeOutlinedIcon,
  debug: BugReportIcon,
  "test-controlfile": ScienceIcon,
};

const menuOrder = [
  "tablero",
  "dashboard-seguridad",
  "panel",
  "auditoria",
  "auditorias-manuales",
  "reporte",
  "establecimiento",
  "empleados",
  "capacitacion-vieja",
  "accidentes",
  "salud-ocupacional",
  "formulario",
  "configuracion",
  "perfil",
  "usuarios-logs",
  "debug",
  "test-controlfile",
];

const topNavIds = ["tablero", "dashboard-seguridad", "panel"];

const sectionLabels = {
  main: "Principal",
  auditorias: "Auditorias",
  empresas: "Empresas",
  higiene: "Higiene y Seguridad",
  formularios: "Formularios",
  sistema: "Sistema",
  "superdev-tools": "Superdev Tools",
};

const getMenuRouteItems = (role, userProfile = {}) => {
  const items = routesConfig
    .filter((route) => route.showInMenu === true)
    .filter((route) => hasAccess({ role, superdev: userProfile?.superdev }, route.roles));

  return items
    .slice()
    .sort((a, b) => menuOrder.indexOf(a.id) - menuOrder.indexOf(b.id))
    .map((route) => ({
      id: route.id,
      path: route.path,
      label: route.label,
      icon: routeIcons[route.id] || PersonIcon,
      section: route.section,
      order: route.order || 999,
    }));
};

export const getNavbarItems = (role, userProfile = {}) => {
  const topItems = getMenuRouteItems(role, userProfile).filter((item) => topNavIds.includes(item.id));

  return {
    simple: topItems,
    higiene: [],
    empresarial: [],
  };
};

export const getSidebarItems = (role, userProfile = {}) => {
  const items = getMenuRouteItems(role, userProfile);
  const topSet = new Set(topNavIds);
  const sidebarMenuItems = items.filter((item) => !topSet.has(item.id));

  const grouped = [];
  const sections = ["auditorias", "empresas", "higiene", "formularios", "sistema", "superdev-tools"];

  sections.forEach((section) => {
    const sectionItems = sidebarMenuItems.filter((item) => item.section === section);
    if (sectionItems.length === 0) return;

    grouped.push({
      id: `section-${section}`,
      type: "section",
      label: sectionLabels[section],
    });

    grouped.push(...sectionItems);
  });

  return grouped;
};

export const menuItems = [];
