/**
 * Utilidad para verificar si se puede escribir en Firestore
 * Evita intentos de escritura cuando el contexto no está completo
 */

/**
 * Verifica si el rol del usuario permite escritura en Firestore
 * @param {string} role - Rol del usuario
 * @returns {boolean}
 */
const canRoleWrite = (role) => {
  if (!role) return false;
  
  // Roles que permiten escritura
  const writeRoles = ['supermax', 'max', 'admin', 'maxdev'];
  return writeRoles.includes(role);
};

/**
 * Verifica si se puede escribir en Firestore basado en el contexto
 * @param {Object} context - Contexto de la operación
 * @param {string} context.auditoriaId - ID de la auditoría (opcional)
 * @param {Object} context.userProfile - Perfil del usuario
 * @param {string} context.empresaId - ID de la empresa (opcional)
 * @param {string} context.sucursalId - ID de la sucursal (opcional)
 * @returns {boolean} true si se puede escribir, false en caso contrario
 */
export const canWriteToFirestore = (context = {}) => {
  const {
    auditoriaId,
    userProfile,
    empresaId,
    sucursalId
  } = context;

  // Si auditoriaId comienza con "offline_", no escribir en Firestore
  if (auditoriaId && typeof auditoriaId === 'string' && auditoriaId.startsWith('offline_')) {
    return false;
  }

  // Si userProfile no está definido, no escribir
  if (!userProfile || !userProfile.uid) {
    return false;
  }

  // Si empresaId o sucursalId no están definidos (y son requeridos), no escribir
  // Nota: Para autosave, estos pueden no estar definidos inicialmente, así que solo verificamos si están presentes
  // Si están presentes pero son vacíos o null, no escribir
  if (empresaId !== undefined && (!empresaId || empresaId === '')) {
    return false;
  }

  if (sucursalId !== undefined && (!sucursalId || sucursalId === '')) {
    return false;
  }

  // Verificar si el rol permite escritura
  if (!canRoleWrite(userProfile.role)) {
    return false;
  }

  return true;
};

/**
 * Verifica si el contexto está completo para autosave
 * (más permisivo que canWriteToFirestore para permitir autosave temprano)
 * @param {Object} context - Contexto de la operación
 * @returns {boolean}
 */
export const isContextComplete = (context = {}) => {
  const { userProfile, empresaId, sucursalId } = context;

  // Para autosave temprano, solo necesitamos userProfile
  // empresaId y sucursalId pueden estar undefined inicialmente
  return !!(userProfile && userProfile.uid);
};

export default canWriteToFirestore;

