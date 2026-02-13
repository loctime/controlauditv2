// src/components/pages/admin/hooks/usePermissions.js
import { useMemo, useCallback } from "react";
import { useAuth } from '@/components/context/AuthContext';

export const usePermissions = () => {
  const { userProfile, role } = useAuth();

  // ✅ Memoizar permisos para evitar recálculos
  const permissions = useMemo(() => {
    if (!userProfile) return {};

    const userPermisos = userProfile.permisos || {};
    
    // Permisos por defecto según el rol
    const defaultPermissions = {
      operario: {
        puedeCrearEmpresas: false,
        puedeCrearSucursales: false,
        puedeCrearAuditorias: false,
        puedeAgendarAuditorias: false,
        puedeCompartirFormularios: false,
        puedeAgregarUsuarios: false, // Solo admin puede
        puedeEliminarAuditoria: false
      },
      max: {
        puedeCrearEmpresas: true,
        puedeCrearSucursales: true,
        puedeCrearAuditorias: true,
        puedeAgendarAuditorias: true,
        puedeCompartirFormularios: true,
        puedeAgregarUsuarios: true,
        puedeEliminarAuditoria: true
      },
      supermax: {
        puedeCrearEmpresas: true,
        puedeCrearSucursales: true,
        puedeCrearAuditorias: true,
        puedeAgendarAuditorias: true,
        puedeCompartirFormularios: true,
        puedeAgregarUsuarios: true,
        puedeEliminarAuditoria: true
      }
    };

    // Combinar permisos por defecto con permisos específicos del usuario
    const defaultPerms = defaultPermissions[role] || defaultPermissions.operario;
    
    return {
      ...defaultPerms,
      ...userPermisos
    };
  }, [userProfile, role]);

  // ✅ Funciones de validación de permisos
  const canAgendarAuditorias = useMemo(() => {
    return permissions.puedeAgendarAuditorias || role === 'supermax';
  }, [permissions.puedeAgendarAuditorias, role]);

  const canCrearAuditorias = useMemo(() => {
    return permissions.puedeCrearAuditorias || role === 'supermax';
  }, [permissions.puedeCrearAuditorias, role]);

  // ✅ Permisos para empresas - usando solo role y empresasPermitidas
  const canCreateEmpresa = useMemo(() => {
    return role === 'admin';
  }, [role]);

  const canEditEmpresa = useMemo(() => {
    return role === 'admin';
  }, [role]);

  const canDeleteEmpresa = useMemo(() => {
    return role === 'admin';
  }, [role]);

  const canManageOperarios = useMemo(() => {
    return role === 'admin';
  }, [role]);

  // Función para verificar si puede ver una empresa específica
  const canViewEmpresa = useCallback((empresaId) => {
    if (!userProfile || !empresaId) return false;
    
    // Admin puede ver todas las empresas
    if (role === 'admin') return true;
    
    // Operario solo puede ver empresas asignadas
    if (role === 'operario') {
      const empresasPermitidas = userProfile.empresasPermitidas || [];
      return empresasPermitidas.includes(empresaId);
    }
    
    return false;
  }, [userProfile, role]);

  // Compatibilidad: mantener canCrearEmpresas para código legacy
  const canCrearEmpresas = useMemo(() => {
    return role === 'admin';
  }, [role]);

  const canCrearSucursales = useMemo(() => {
    return permissions.puedeCrearSucursales || role === 'supermax';
  }, [permissions.puedeCrearSucursales, role]);

  const canCompartirFormularios = useMemo(() => {
    return permissions.puedeCompartirFormularios || role === 'supermax';
  }, [permissions.puedeCompartirFormularios, role]);

  // Solo el admin puede agregar usuarios
  const canAgregarUsuarios = useMemo(() => {
    return (role === 'max' && permissions.puedeAgregarUsuarios) || role === 'supermax';
  }, [permissions.puedeAgregarUsuarios, role]);

  // ✅ Función para verificar si puede auditar (usar auditorías)
  const canAuditar = useMemo(() => {
    return permissions.puedeCrearAuditorias || role === 'supermax';
  }, [permissions.puedeCrearAuditorias, role]);

  // ✅ Función general para verificar cualquier permiso
  const hasPermission = useCallback((permissionKey) => {
    return permissions[permissionKey] || role === 'supermax';
  }, [permissions, role]);

  return {
    permissions,
    canAgendarAuditorias,
    canCrearAuditorias,
    canCrearEmpresas, // Legacy
    canCreateEmpresa, // Nuevo
    canEditEmpresa,
    canDeleteEmpresa,
    canManageOperarios,
    canViewEmpresa,
    canCrearSucursales,
    canCompartirFormularios,
    canAgregarUsuarios,
    canAuditar,
    hasPermission
  };
}; 