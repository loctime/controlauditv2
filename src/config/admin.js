// Configuración del sistema de roles
// Códigos de activación para diferentes niveles

export const ADMIN_ACTIVATION_CODE = import.meta.env.VITE_ADMIN_CODE || 'AUDITORIA2024';
export const SUPER_ADMIN_ACTIVATION_CODE = import.meta.env.VITE_SUPER_ADMIN_CODE || 'SUPERMAX2024';

// Función para verificar si un usuario es administrador
export const isAdmin = (userProfile) => {
  return userProfile?.role === 'max' || userProfile?.role === 'supermax';
};

// Función para verificar si un usuario es dueño del sistema
export const isSuperAdmin = (userProfile) => {
  return userProfile?.role === 'supermax';
};

// Función para obtener el rol del usuario
export const getUserRole = (userEmail) => {
  return 'operario'; // Por defecto todos son operarios
};

// Función para verificar código de activación
export const verifyAdminCode = (code) => {
  return code === ADMIN_ACTIVATION_CODE;
};

// Función para verificar código de super administrador
export const verifySuperAdminCode = (code) => {
  return code === SUPER_ADMIN_ACTIVATION_CODE;
};

// Función para activar administrador
export const activateAdmin = async (userProfile, code) => {
  if (verifyAdminCode(code)) {
    return {
      role: 'max',
      permisos: {
        puedeCrearEmpresas: true,
        puedeCrearSucursales: true,
        puedeCrearAuditorias: true,
        puedeCompartirAuditorias: true,
        puedeAgregarSocios: true,
        puedeGestionarUsuarios: true
      }
    };
  }
  return null;
};

// Función para activar super administrador
export const activateSuperAdmin = async (userProfile, code) => {
  if (verifySuperAdminCode(code)) {
    return {
      role: 'supermax',
      permisos: {
        puedeCrearEmpresas: true,
        puedeCrearSucursales: true,
        puedeCrearAuditorias: true,
        puedeCompartirAuditorias: true,
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