/**
 * Helper para obtener nombres visibles de usuarios según contexto
 * @param {string} context - Contexto donde se muestra el nombre ('default', 'dashboard', 'audit', 'report')
 * @returns {string} Nombre visible del usuario según el contexto
 */
export const getUserDisplayName = (context = 'default') => {
  const displayNames = {
    default: 'Usuario',
    dashboard: 'Técnico',
    audit: 'Auditor',
    report: 'Técnico responsable'
  };

  return displayNames[context] || displayNames.default;
};
