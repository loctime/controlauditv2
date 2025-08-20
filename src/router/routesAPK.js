import { lazy } from 'react';

// Lazy loading de componentes para APK (solo auditoría)
const AuditoriaAPK = lazy(() => import("../components/pages/auditoria/auditoria/AuditoriaAPK"));

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
  }
];
