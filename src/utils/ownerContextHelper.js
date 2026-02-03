// src/utils/ownerContextHelper.js
// Helper central para resolver ownerId efectivo en toda la aplicación

/**
 * Obtiene el ownerId efectivo basado en el contexto de autenticación
 * 
 * Reglas:
 * - Si el usuario autenticado es rixIn0BwiVPHB4SgR0K0SlnpSLC2 y hay selectedOwnerId → usa selectedOwnerId
 * - Para todos los demás casos → usa el ownerId normal del usuario
 * 
 * @param {Object} authContext - Contexto de autenticación con user, userContext, selectedOwnerId
 * @returns {string} - OwnerId efectivo a usar para operaciones Firestore
 */
export const getEffectiveOwnerId = (authContext) => {
  const { user, userContext, selectedOwnerId } = authContext;
  
  // Si el usuario es tu UID específico y hay un selectedOwnerId, usar ese
  if (user?.uid === 'rixIn0BwiVPHB4SgR0K0SlnpSLC2' && selectedOwnerId) {
    console.log(`[ownerContextHelper] Usando selectedOwnerId: ${selectedOwnerId}`);
    return selectedOwnerId;
  }
  
  // Para todos los demás casos, usar el ownerId normal del usuario
  const effectiveOwnerId = userContext?.ownerId || user?.uid;
  console.log(`[ownerContextHelper] Usando ownerId normal: ${effectiveOwnerId}`);
  return effectiveOwnerId;
};

/**
 * Hook personalizado para usar en componentes React
 * Retorna el ownerId efectivo y funciones útiles
 */
export const useEffectiveOwnerId = (authContext) => {
  const effectiveOwnerId = getEffectiveOwnerId(authContext);
  const { user, selectedOwnerId } = authContext;
  
  const isImpersonating = user?.uid === 'rixIn0BwiVPHB4SgR0K0SlnpSLC2' && selectedOwnerId && selectedOwnerId !== user.uid;
  
  return {
    effectiveOwnerId,
    isImpersonating,
    isMyAccount: !isImpersonating,
    originalOwnerId: user?.uid,
    selectedOwnerId: selectedOwnerId
  };
};

/**
 * EJEMPLOS DE USO:
 * 
 * // En servicios (reemplazar auth.user.uid):
 * import { getEffectiveOwnerId } from '../utils/ownerContextHelper';
 * 
 * // ANTES:
 * async function getEmpresas(userId, userProfile) {
 *   const ownerId = userProfile?.ownerId || userId;
 *   const empresasRef = doc(db, 'apps', 'auditoria', 'owners', ownerId, 'empresas');
 * }
 * 
 * // DESPUÉS:
 * async function getEmpresas(authContext) {
 *   const ownerId = getEffectiveOwnerId(authContext);
 *   const empresasRef = doc(db, 'apps', 'auditoria', 'owners', ownerId, 'empresas');
 * }
 * 
 * // En componentes React:
 * import { useEffectiveOwnerId } from '../utils/ownerContextHelper';
 * 
 * function MiComponente() {
 *   const authContext = useAuth();
 *   const { effectiveOwnerId, isImpersonating } = useEffectiveOwnerId(authContext);
 *   
 *   // Usar effectiveOwnerId para todas las operaciones Firestore
 *   const empresasRef = doc(db, 'apps', 'auditoria', 'owners', effectiveOwnerId, 'empresas');
 *   
 *   return (
 *     <div>
 *       {isImpersonating && <Alert>Viendo datos como otro owner</Alert>}
 *     </div>
 *   );
 * }
 */
