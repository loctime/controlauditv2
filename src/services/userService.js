// src/services/userService.js
import axios from 'axios';
import { auth } from '../firebaseControlFile';
import { onAuthStateChanged } from 'firebase/auth';
import { getBackendUrl } from '../config/environment.js';
import { doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebaseControlFile';
import { setDocWithAppId } from '../firebase/firestoreAppWriter';

// API Routes de Next.js (rutas relativas, sin CORS)
// Estas rutas se ejecutan en el mismo servidor de Vercel
const nextApi = axios.create({
  baseURL: '/api', // Ruta relativa - se ejecuta en Next.js/Vercel
  timeout: 30000,
});

// Backend externo de ControlFile (Render) - solo para endpoints específicos
// uploads, folders, health, etc.
const API_BASE_URL = `${getBackendUrl()}/api`;
const externalApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

// Función helper para obtener el usuario actual de forma robusta
const getCurrentUser = async () => {
  // Intentar obtener usuario directamente
  if (auth.currentUser) {
    return auth.currentUser;
  }
  
  // Si no está disponible inmediatamente, esperar un poco (problema de timing)
  // Esto es un fallback para casos donde auth.currentUser aún no está sincronizado
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      if (user) {
        resolve(user);
      } else {
        reject(new Error('Usuario no autenticado'));
      }
    });
    
    // Timeout después de 1 segundo
    setTimeout(() => {
      unsubscribe();
      reject(new Error('Timeout esperando autenticación'));
    }, 1000);
  });
};

// Interceptor para agregar token de Firebase automáticamente (ambas instancias)
const addAuthToken = async (config) => {
  try {
    // Obtener usuario de forma robusta (maneja problemas de timing)
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      console.error('❌ No hay usuario autenticado');
      throw new Error('Usuario no autenticado');
    }
    
    const token = await currentUser.getIdToken(true); // Forzar refresh del token
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
};

// Aplicar interceptor de autenticación a ambas instancias
nextApi.interceptors.request.use(addAuthToken);
externalApi.interceptors.request.use(addAuthToken);

// Interceptor para manejar errores de red (solo para API externa)
externalApi.interceptors.response.use(
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
      console.error('Recibido 401 del backend — sesión inválida o token no válido');
      throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
    }
    
    // 440 se usa cuando el backend reasignó claims y requiere que el cliente refresque sesión
    if (error.response?.status === 440) {
      console.error('Claim de rol actualizado en backend (440) — forzando fallback a Firestore');
      throw error; // será manejado por los catch específicos en los métodos (createUser etc.)
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

// Función de fallback: crear solo perfil "pending" en Firestore
// El backend es responsable del linking Auth ↔ Firestore
const createPendingProfile = async (userData) => {
  try {
    console.log('🔄 Backend no disponible, creando perfil "pending" en Firestore...');
    console.log('ℹ️ El backend vinculará automáticamente Auth ↔ Firestore cuando esté disponible.');
    
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('No hay usuario autenticado. No se puede crear usuario sin sesión activa.');
    }
    
    // Generar UID temporal basado en email y timestamp
    // El backend lo reemplazará con el UID real de Auth cuando procese el perfil pending
    const tempUid = `pending_${userData.email.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}`;
    
    // Crear perfil "pending" en Firestore
    // NO hacer queries cruzadas - el backend manejará el linking
    const pendingProfile = {
      uid: tempUid,
      email: userData.email,
      displayName: userData.nombre,
      role: userData.role || 'operario',
      permisos: userData.permisos || {},
      appId: 'auditoria',
      status: 'pending',
      tempPassword: userData.password,
      empresas: [],
      auditorias: [],
      socios: [],
      configuracion: {
        notificaciones: true,
        tema: 'light'
      },
      clienteAdminId: userData.clienteAdminId || null,
      createdBy: currentUser.uid,
      createdAt: serverTimestamp()
    };

    await setDocWithAppId(doc(db, 'apps', 'auditoria', 'users', tempUid), pendingProfile);

    console.log('✅ Perfil "pending" creado en Firestore');
    console.log('ℹ️ El backend procesará este perfil y creará el usuario en Auth cuando esté disponible.');
    
    return {
      success: true,
      uid: tempUid,
      message: 'Perfil creado en estado "pending". El backend lo procesará y creará el usuario en Auth cuando esté disponible.',
      pending: true
    };
  } catch (error) {
    console.error('❌ Error creando perfil pending:', error);
    throw new Error(`Error creando perfil: ${error.message}`);
  }
};

// Servicios de usuarios
export const userService = {
  // Crear usuario - FLUJO OFICIAL
  // 1. Siempre llama a POST /api/create-user contra el backend Express de ControlFile (Render)
  // 2. Si falla, crea solo perfil "pending" en Firestore
  // 3. El backend es responsable del linking Auth ↔ Firestore
  async createUser(userData) {
    try {
      // Usar VITE_CONTROLFILE_BACKEND_URL directamente (no rutas relativas)
      const backendUrl = import.meta.env.VITE_CONTROLFILE_BACKEND_URL || 'https://controlfile.onrender.com';
      const endpoint = `${backendUrl}/api/create-user`;
      
      console.log('📤 Creando usuario con backend:', endpoint);
      console.log('📋 Datos del usuario:', { email: userData.email, nombre: userData.nombre, role: userData.role });
      
      // Obtener token de autenticación
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        throw new Error('Usuario no autenticado');
      }
      
      const token = await currentUser.getIdToken(true);
      
      // Llamar al endpoint oficial del backend usando fetch (no axios)
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
        throw {
          response: {
            status: response.status,
            statusText: response.statusText,
            data: errorData
          },
          code: 'HTTP_ERROR',
          message: errorData.error || `Error ${response.status}: ${response.statusText}`
        };
      }
      
      const data = await response.json();
      console.log('✅ Usuario creado exitosamente por el backend:', data);
      return data;
    } catch (error) {
      console.error('❌ Error creando usuario con backend:', error);
      console.error('📊 Detalles del error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        code: error.code,
        message: error.message
      });
      
      // Si el backend falla (404, 503, network error, etc.), crear solo perfil "pending"
      if (error.response?.status === 404 || 
          error.response?.status === 503 ||
          error.response?.status === 500 ||
          error.code === 'ERR_NETWORK' ||
          error.code === 'HTTP_ERROR') {
        console.log('🔄 Backend no disponible, creando perfil "pending" en Firestore...');
        return await createPendingProfile(userData);
      }
      
      // Errores de autenticación/autorización - no crear perfil pending
      if (error.response?.status === 401) {
        console.error('🚨 ERROR 401: Token de autenticación inválido o expirado');
        throw new Error('Error de autenticación. Por favor, recarga la página e intenta nuevamente.');
      }
      
      if (error.response?.status === 403) {
        console.error('🚨 ERROR 403: Sin permisos para crear usuarios');
        throw new Error('No tienes permisos para crear usuarios. Verifica tu rol de administrador.');
      }
      
      // Para otros errores del backend, crear perfil pending
      console.log('🔄 Error del backend, creando perfil "pending" en Firestore...');
      return await createPendingProfile(userData);
    }
  },

  // Listar usuarios (filtrado por multi-tenant)
  // Usa API Route de Next.js (ruta relativa)
  async listUsers() {
    try {
      const response = await nextApi.get('/list-users');
      return response.data.usuarios;
    } catch (error) {
      console.error('Error listando usuarios:', error);
      throw new Error(error.response?.data?.error || error.message || 'Error al listar usuarios');
    }
  },

  // Actualizar usuario
  // Usa API Route de Next.js (ruta relativa)
  async updateUser(uid, updateData) {
    try {
      const response = await nextApi.put(`/update-user/${uid}`, updateData);
      return response.data;
    } catch (error) {
      console.error('Error actualizando usuario:', error);
      throw new Error(error.response?.data?.error || error.message || 'Error al actualizar usuario');
    }
  },

  // Eliminar usuario
  // Usa API Route de Next.js (ruta relativa)
  async deleteUser(uid) {
    try {
      const response = await nextApi.delete(`/delete-user/${uid}`);
      return response.data;
    } catch (error) {
      console.error('Error eliminando usuario:', error);
      throw new Error(error.response?.data?.error || error.message || 'Error al eliminar usuario');
    }
  },

  // Verificar conectividad con el backend externo (ControlFile en Render)
  async checkBackendHealth() {
    try {
      const response = await externalApi.get('/health');
      return response.data;
    } catch (error) {
      console.error('Error verificando salud del backend:', error);
      throw new Error('No se puede conectar con el servidor');
    }
  },

  /**
   * Actualizar usuario directamente en Firestore (para casos legacy)
   * @param {string} uid - UID del usuario
   * @param {Object} updateData - Datos a actualizar
   * @returns {Promise<void>}
   */
  async updateUserDirect(uid, updateData) {
    try {
      const { doc } = await import('firebase/firestore');
      const { db } = await import('../firebaseControlFile');
      const { updateDocWithAppId } = await import('../firebase/firestoreAppWriter');
      
      const userRef = doc(db, 'apps', 'auditoria', 'users', uid);
      await updateDocWithAppId(userRef, updateData);
    } catch (error) {
      console.error('Error actualizando usuario directamente:', error);
      throw error;
    }
  }
};

export default userService; 