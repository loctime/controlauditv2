// Configuración del administrador del sistema
// Cambiar este email por el email real del administrador

export const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_ROLE || 'admin@auditoria.com';

// Función para verificar si un usuario es administrador
export const isAdmin = (userEmail) => {
  return userEmail === ADMIN_EMAIL;
};

// Función para obtener el rol del usuario
export const getUserRole = (userEmail) => {
  return isAdmin(userEmail) ? 'max' : 'operario';
}; 