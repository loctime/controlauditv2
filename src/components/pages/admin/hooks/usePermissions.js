// src/components/pages/admin/hooks/usePermissions.js
import { useContext, useMemo, useCallback } from "react";
import { AuthContext } from "../../../context/AuthContext";

export const usePermissions = () => {
  const { userProfile, role } = useContext(AuthContext);

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
        puedeAgregarSocios: false
      },
      max: {
        puedeCrearEmpresas: true,
        puedeCrearSucursales: true,
        puedeCrearAuditorias: true,
        puedeAgendarAuditorias: true,
        puedeCompartirFormularios: true,
        puedeAgregarSocios: true
      },
      supermax: {
        puedeCrearEmpresas: true,
        puedeCrearSucursales: true,
        puedeCrearAuditorias: true,
        puedeAgendarAuditorias: true,
        puedeCompartirFormularios: true,
        puedeAgregarSocios: true
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

  const canCrearEmpresas = useMemo(() => {
    return permissions.puedeCrearEmpresas || role === 'supermax';
  }, [permissions.puedeCrearEmpresas, role]);

  const canCrearSucursales = useMemo(() => {
    return permissions.puedeCrearSucursales || role === 'supermax';
  }, [permissions.puedeCrearSucursales, role]);

  const canCompartirFormularios = useMemo(() => {
    return permissions.puedeCompartirFormularios || role === 'supermax';
  }, [permissions.puedeCompartirFormularios, role]);

  const canAgregarSocios = useMemo(() => {
    return permissions.puedeAgregarSocios || role === 'supermax';
  }, [permissions.puedeAgregarSocios, role]);

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
    canCrearEmpresas,
    canCrearSucursales,
    canCompartirFormularios,
    canAgregarSocios,
    canAuditar,
    hasPermission
  };
}; 