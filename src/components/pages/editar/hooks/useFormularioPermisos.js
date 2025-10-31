import { useMemo, useCallback } from 'react';

/**
 * Hook para verificar permisos de formularios
 */
export const useFormularioPermisos = (user, userProfile) => {
  const puedeEditar = useCallback((formulario) => {
    if (!formulario || !user) return false;
    
    if (userProfile?.role === 'supermax') return true;
    if (userProfile?.role === 'max') return true;
    if (formulario.creadorId === user.uid) return true;
    if (formulario.permisos?.puedeEditar?.includes(user.uid)) return true;
    
    return false;
  }, [user, userProfile]);

  const puedeEliminar = useCallback((formulario) => {
    if (!formulario || !user) return false;
    
    if (userProfile?.role === 'supermax') return true;
    if (userProfile?.role === 'max') return true;
    if (formulario.creadorId === user.uid) return true;
    if (formulario.permisos?.puedeEliminar?.includes(user.uid)) return true;
    
    return false;
  }, [user, userProfile]);

  const puedeVer = useCallback((formulario) => {
    if (!formulario || !user) return false;
    
    if (userProfile?.role === 'supermax') return true;
    if (formulario.creadorId === user.uid) return true;
    if (formulario.clienteAdminId === userProfile?.clienteAdminId) return true;
    if (formulario.esPublico) return true;
    if (formulario.permisos?.puedeVer?.includes(user.uid)) return true;
    
    return false;
  }, [user, userProfile]);

  return { puedeEditar, puedeEliminar, puedeVer };
};

