import { useCallback } from 'react';
import { empresaService } from '../../../../services/empresaService';
import { auditoriaService } from '../../../../services/auditoriaService';
import { saveCompleteUserCache } from '../../../../services/completeOfflineCache';

/**
 * Hook para acciones del contexto (wrapper functions)
 */
export const useContextActions = (
  user,
  userProfile,
  role,
  userEmpresas,
  userSucursales,
  userFormularios,
  setUserEmpresas,
  loadAuditoriasCompartidas
) => {
  
  const crearEmpresa = useCallback(async (empresaData) => {
    const empresaId = await empresaService.crearEmpresa(empresaData, user, role, userProfile);
    
    const nuevaEmpresaConId = {
      id: empresaId,
      ...empresaData,
      propietarioId: role === 'operario' && userProfile?.clienteAdminId ? userProfile.clienteAdminId : user.uid,
      propietarioEmail: role === 'operario' && userProfile?.clienteAdminId ? 'admin@empresa.com' : user.email,
      propietarioRole: role === 'operario' ? 'max' : role,
      creadorId: user.uid,
      creadorEmail: user.email,
      creadorRole: role,
      createdAt: new Date(),
      socios: [role === 'operario' && userProfile?.clienteAdminId ? userProfile.clienteAdminId : user.uid]
    };
    
    setUserEmpresas(prevEmpresas => {
      const existe = prevEmpresas.some(emp => emp.id === empresaId);
      return existe ? prevEmpresas : [...prevEmpresas, nuevaEmpresaConId];
    });
    
    return empresaId;
  }, [user, role, userProfile, setUserEmpresas]);

  const compartirAuditoria = useCallback(async (auditoriaId, emailUsuario) => {
    await auditoriaService.compartirAuditoria(auditoriaId, emailUsuario, user);
    await loadAuditoriasCompartidas(user.uid);
    return true;
  }, [user, loadAuditoriasCompartidas]);

  const verificarYCorregirEmpresas = useCallback(async () => {
    const { empresasCorregidas, empresasActualizadas } = 
      await empresaService.verificarYCorregirEmpresas(userEmpresas, userProfile);
    if (empresasCorregidas > 0) {
      setUserEmpresas(empresasActualizadas);
    }
    return empresasCorregidas;
  }, [userEmpresas, userProfile, setUserEmpresas]);

  const updateEmpresa = useCallback(async (empresaId, updateData) => {
    await empresaService.updateEmpresa(empresaId, updateData, userProfile);
    setUserEmpresas((prev) => prev.map(e => 
      e.id === empresaId ? { ...e, ...updateData, ultimaModificacion: new Date() } : e
    ));
    return true;
  }, [userProfile, setUserEmpresas]);

  const forceRefreshCache = useCallback(async () => {
    if (userProfile) {
      try {
        const cacheResult = await saveCompleteUserCache(
          userProfile, 
          userEmpresas, 
          userSucursales, 
          userFormularios
        );
        return cacheResult;
      } catch (error) {
        console.error('Error actualizando cache:', error);
        throw error;
      }
    }
  }, [userProfile, userEmpresas, userSucursales, userFormularios]);

  return {
    crearEmpresa,
    compartirAuditoria,
    verificarYCorregirEmpresas,
    updateEmpresa,
    forceRefreshCache
  };
};

