// Configuración del sistema de roles
// Códigos de activación para diferentes niveles

export const ADMIN_ACTIVATION_CODE = import.meta.env.VITE_ADMIN_CODE || 'AUDITORIA2024';
export const SUPER_ADMIN_ACTIVATION_CODE = import.meta.env.VITE_SUPER_ADMIN_CODE || 'SUPERMAX2024';

/**
 * Función helper centralizada para determinar si un usuario es administrador.
 * 
 * ⚠️ COMPATIBILIDAD LEGACY TEMPORAL:
 * Los roles legacy "max" y "supermax" se tratan como equivalentes a "admin".
 * Esto permite mantener compatibilidad mientras se migra el sistema.
 * 
 * @param {Object|string} userProfileOrRole - Perfil del usuario con propiedad 'role' o string con el rol directamente
 * @returns {boolean} true si el usuario es administrador (admin, max o supermax)
 */
export const isAdminUser = (userProfileOrRole) => {
  const role = typeof userProfileOrRole === 'string' 
    ? userProfileOrRole 
    : userProfileOrRole?.role;
  
  if (!role) return false;
  
  // Roles válidos actuales: 'admin'
  // Roles legacy compatibles: 'max', 'supermax'
  return role === 'admin' || role === 'max' || role === 'supermax';
};

/**
 * Función para verificar si un usuario es administrador (legacy - mantener compatibilidad)
 * @deprecated Usar isAdminUser() en su lugar
 */
export const isAdmin = (userProfile) => {
  return isAdminUser(userProfile);
};

/**
 * Función para verificar si un usuario es super administrador (legacy)
 * ⚠️ COMPATIBILIDAD LEGACY: supermax se trata como admin
 * @deprecated Usar isAdminUser() en su lugar
 */
export const isSuperAdmin = (userProfile) => {
  return userProfile?.role === 'supermax';
};

// Función para obtener el rol del usuario
export const getUserRole = (userEmail) => {
  // Verificar si es supermax por email específico
  if (userEmail === '1@gmail.com') {
    return 'supermax';
  }
  
  // Por defecto, usuarios nuevos tienen rol 'max' (cliente administrador)
  // con todos los permisos habilitados
  return 'max';
};

// Función para verificar código de activación de cliente administrador
export const verifyAdminCode = (code) => {
  return code === ADMIN_ACTIVATION_CODE;
};

// Función para verificar código de super administrador
export const verifySuperAdminCode = (code) => {
  return code === SUPER_ADMIN_ACTIVATION_CODE;
};

// Función para activar cliente administrador (role: 'max')
export const activateAdmin = async (userProfile, code) => {
  if (verifyAdminCode(code)) {
    return {
      role: 'max', // Cliente administrador
      permisos: {
        puedeCrearEmpresas: true,
        puedeCrearSucursales: true,
        puedeCrearAuditorias: true,
        puedeCompartirFormularios: true,
        puedeAgregarSocios: true,
        puedeGestionarUsuarios: true,
        puedeVerLogs: true,
        puedeGestionarSistema: true,
        puedeEliminarUsuarios: true
      }
    };
  }
  return null;
};

// Función para activar super administrador (role: 'supermax')
export const activateSuperAdmin = async (userProfile, code) => {
  if (verifySuperAdminCode(code)) {
    return {
      role: 'supermax', // Super administrador
      permisos: {
        puedeCrearEmpresas: true,
        puedeCrearSucursales: true,
        puedeCrearAuditorias: true,
        puedeCompartirFormularios: true,
        puedeAgregarSocios: true,
        puedeGestionarUsuarios: true,
        puedeGestionarSistema: true,
        puedeEliminarUsuarios: true,
        puedeVerLogs: true
      }
    };
  }
  return null;
}; 