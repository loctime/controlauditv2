import { routesConfig } from "../config/routesConfig";
import { hasAccess } from "../utils/accessControl";

const SECTION_TO_GROUP_KEY = {
  main: "gestion",
  empresas: "empresas",
  auditorias: "auditorias",
  higiene: "higiene",
  sistema: "sistema",
};

export const MENU_GROUP_LABELS = {
  gestion: "Gestión",
  empresas: "Empresas",
  auditorias: "Auditorías",
  higiene: "HyS",
  sistema: "Perfil",
};

const EMPTY_GROUPS = Object.freeze({
  gestion: [],
  empresas: [],
  auditorias: [],
  higiene: [],
  sistema: [],
});

/**
 * Construye el menú agrupado para Navbar usando routesConfig como fuente única.
 * - filtra showInMenu
 * - filtra por acceso usando hasAccess(user, route.roles)
 * - agrupa por route.section usando el mapping pedido
 * - ordena por route.order
 */
export function buildGroupedMenu(user) {
  const grouped = {
    gestion: [],
    empresas: [],
    auditorias: [],
    higiene: [],
    sistema: [],
  };

  const visibleRoutes = routesConfig
    .filter((route) => route?.showInMenu === true)
    .filter((route) => hasAccess(user, route.roles))
    .filter((route) => route?.label && route?.path);

  for (const route of visibleRoutes) {
    const groupKey = SECTION_TO_GROUP_KEY[route.section];
    if (!groupKey) continue;
    grouped[groupKey].push(route);
  }

  for (const key of Object.keys(grouped)) {
    grouped[key] = grouped[key]
      .slice()
      .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
  }

  return grouped;
}

export function getGroupedMenuOrEmpty(user) {
  try {
    return buildGroupedMenu(user);
  } catch {
    return EMPTY_GROUPS;
  }
}

