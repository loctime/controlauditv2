import { useCallback } from 'react';
import { createEmpresa, updateEmpresa as updateEmpresaOwner } from '../../../core/services/ownerEmpresaService';
import { auditoriaService } from '../../../services/auditoriaService';
import { saveCompleteUserCache } from '../../../services/completeOfflineCache';
import { shouldEnableOffline } from '../../../utils/pwaDetection';

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
    if (!userProfile?.ownerId) {
      throw new Error('ownerId es requerido para crear empresa');
    }
    
    const ownerId = userProfile.ownerId; // ownerId viene del token
    const empresaId = empresaData.id || `empresa_${Date.now()}`;
    
    await createEmpresa(ownerId, {
      id: empresaId,
      nombre: empresaData.nombre,
      activa: empresaData.activa !== undefined ? empresaData.activa : true
    });
    
    const nuevaEmpresaConId = {
      id: empresaId,
      ownerId,
      nombre: empresaData.nombre,
      activa: empresaData.activa !== undefined ? empresaData.activa : true,
      createdAt: new Date()
    };
    
    setUserEmpresas(prevEmpresas => {
      const existe = prevEmpresas.some(emp => emp.id === empresaId);
      return existe ? prevEmpresas : [...prevEmpresas, nuevaEmpresaConId];
    });
    
    return empresaId;
  }, [userProfile, setUserEmpresas]);

  const compartirAuditoria = useCallback(async (auditoriaId, emailUsuario) => {
    await auditoriaService.compartirAuditoria(auditoriaId, emailUsuario, user, userProfile);
    if (userProfile && userProfile.uid) {
      await loadAuditoriasCompartidas(user.uid, userProfile);
    }
    return true;
  }, [user, userProfile, loadAuditoriasCompartidas]);

  const verificarYCorregirEmpresas = useCallback(async () => {
    // Método legacy eliminado - no necesario en owner-centric
    // Las empresas ya tienen ownerId correcto desde su creación
    return 0;
  }, []);

  const updateEmpresa = useCallback(async (empresaId, updateData) => {
    if (!userProfile?.ownerId) {
      throw new Error('ownerId es requerido para actualizar empresa');
    }
    
    const ownerId = userProfile.ownerId;
    await updateEmpresaOwner(ownerId, empresaId, {
      nombre: updateData.nombre,
      activa: updateData.activa
    });
    
    setUserEmpresas((prev) => prev.map(e => 
      e.id === empresaId ? { ...e, ...updateData } : e
    ));
    return true;
  }, [userProfile, setUserEmpresas]);

  const forceRefreshCache = useCallback(async () => {
    // Solo actualizar cache si estamos en móvil (modo offline habilitado)
    if (!shouldEnableOffline()) {
      console.log('💻 Desktop: forceRefreshCache deshabilitado (modo offline no necesario)');
      return null;
    }
    
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
    verificarYCorregirEmpresas, // Mantener para compatibilidad pero siempre retorna 0
    updateEmpresa,
    forceRefreshCache
  };
};

