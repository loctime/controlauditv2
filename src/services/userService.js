// src/services/userService.js
import axios from 'axios';
import { auth } from '../firebaseConfig';
import { getBackendUrl } from '../config/environment.js';
import { doc, setDoc, collection, getDocs, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

// Usar la URL del backend desde la configuración del entorno
const API_BASE_URL = `${getBackendUrl()}/api`;

// Configurar axios con interceptor para agregar token automáticamente
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // Aumentar timeout para producción
});

// Interceptor para agregar token de Firebase automáticamente
api.interceptors.request.use(async (config) => {
  try {
    // Verificar que el usuario esté autenticado
    if (!auth.currentUser) {
      console.error('❌ No hay usuario autenticado');
      throw new Error('Usuario no autenticado');
    }
    
    const token = await auth.currentUser.getIdToken(true); // Forzar refresh del token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('✅ Token agregado a la petición');
    } else {
      console.error('❌ No se pudo obtener token');
      throw new Error('No se pudo obtener token de autenticación');
    }
  } catch (error) {
    console.error('Error obteniendo token:', error);
    throw new Error('Error de autenticación: ' + error.message);
  }
  return config;
});

// Interceptor para manejar errores de red
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Error en petición API:', error);
    
    // Manejar errores específicos
    if (error.code === 'ERR_NETWORK') {
      console.error('Error de red - Verificar conectividad con el backend');
      throw new Error('Error de conectividad con el servidor. Verifica tu conexión a internet.');
    }
    
    if (error.response?.status === 401) {
      console.error('Error de autenticación');
      throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
    }
    
    if (error.response?.status === 403) {
      console.error('Error de permisos');
      throw new Error('No tienes permisos para realizar esta acción.');
    }
    
    if (error.response?.status >= 500) {
      console.error('Error del servidor');
      throw new Error('Error interno del servidor. Intenta nuevamente más tarde.');
    }
    
    return Promise.reject(error);
  }
);

// Función de fallback usando Firebase directamente
const createUserWithFirebase = async (userData) => {
  try {
    console.log('🔄 Backend no disponible, creando usuario en Firestore directamente...');
    
    // Generar un UID temporal
    const tempUid = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Crear perfil en Firestore
    const userProfile = {
      uid: tempUid,
      email: userData.email,
      displayName: userData.nombre,
      role: userData.role || 'operario',
      permisos: userData.permisos || {},
      createdAt: new Date(),
      empresas: [],
      auditorias: [],
      socios: [],
      configuracion: {
        notificaciones: true,
        tema: 'light'
      },
      clienteAdminId: userData.clienteAdminId || null,
      status: 'pending_creation', // Marcar como pendiente de creación en Firebase Auth
      tempPassword: userData.password // Guardar temporalmente para que el admin pueda crear el usuario en Firebase Auth
    };

    await setDoc(doc(db, 'usuarios', tempUid), userProfile);

    console.log('✅ Usuario creado en Firestore (pendiente de creación en Firebase Auth)');
    return {
      success: true,
      uid: tempUid,
      message: 'Usuario creado en Firestore. El administrador debe crear el usuario en Firebase Auth manualmente.',
      requiresManualCreation: true
    };
  } catch (error) {
    console.error('❌ Error creando usuario en Firestore:', error);
    throw new Error(`Error creando usuario: ${error.message}`);
  }
};

// Servicios de usuarios
export const userService = {
  // Crear usuario (sin desconectar al admin)
  async createUser(userData) {
    try {
      console.log('Intentando crear usuario con URL:', API_BASE_URL);
      const response = await api.post('/create-user', userData);
      return response.data;
    } catch (error) {
      console.error('Error creando usuario con backend:', error);
      
      // Si es un error de autenticación (401), intentar con Firebase directamente
      if (error.response?.status === 401 || error.message.includes('autenticación') || error.message.includes('Usuario no autenticado')) {
        console.log('🔄 Error de autenticación, intentando con Firebase directamente...');
        return await createUserWithFirebase(userData);
      }
      
      // Si es un error de red, intentar con Firebase directamente
      if (error.code === 'ERR_NETWORK' || error.message.includes('conectividad')) {
        console.log('🔄 Backend no disponible, intentando con Firebase...');
        return await createUserWithFirebase(userData);
      }
      
      throw new Error(error.response?.data?.error || error.message || 'Error al crear usuario');
    }
  },

  // Listar usuarios (filtrado por multi-tenant)
  async listUsers() {
    try {
      const response = await api.get('/list-users');
      return response.data.usuarios;
    } catch (error) {
      console.error('Error listando usuarios:', error);
      throw new Error(error.response?.data?.error || error.message || 'Error al listar usuarios');
    }
  },

  // Actualizar usuario
  async updateUser(uid, updateData) {
    try {
      const response = await api.put(`/update-user/${uid}`, updateData);
      return response.data;
    } catch (error) {
      console.error('Error actualizando usuario:', error);
      throw new Error(error.response?.data?.error || error.message || 'Error al actualizar usuario');
    }
  },

  // Eliminar usuario
  async deleteUser(uid) {
    try {
      const response = await api.delete(`/delete-user/${uid}`);
      return response.data;
    } catch (error) {
      console.error('Error eliminando usuario:', error);
      throw new Error(error.response?.data?.error || error.message || 'Error al eliminar usuario');
    }
  },

  // Verificar conectividad con el backend
  async checkBackendHealth() {
    try {
      const response = await api.get('/health');
      return response.data;
    } catch (error) {
      console.error('Error verificando salud del backend:', error);
      throw new Error('No se puede conectar con el servidor');
    }
  }
};

export default userService; 