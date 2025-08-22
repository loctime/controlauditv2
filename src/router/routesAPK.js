import { lazy } from 'react';

// Lazy loading de componentes para APK (auditoría y reportes)
const AuditoriaAPK = lazy(() => import("../components/pages/auditoria/auditoria/AuditoriaAPK"));
const ReportesAPK = lazy(() => import("../components/pages/auditoria/reporte/ReportesAPK"));

export const routesAPK = [
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
