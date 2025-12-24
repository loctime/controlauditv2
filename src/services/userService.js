// src/services/userService.js
import axios from 'axios';
import { auth } from '../firebaseControlFile';
import { onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { getBackendUrl } from '../config/environment.js';
import { doc, collection, getDocs, query, where, serverTimestamp } from 'firebase/firestore';
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

// Función de fallback usando Firebase directamente
const createUserWithFirebase = async (userData) => {
  try {
    console.log('🔄 Backend no disponible, creando usuario solo en Firestore (sin Auth desde frontend)...');
    
    // IMPORTANTE: NO crear usuarios en Auth desde el frontend cuando hay un admin logueado
    // porque Firebase automáticamente autentica al usuario recién creado, desconectando al admin.
    // En su lugar, solo creamos el documento en Firestore y dejamos que el backend
    // o el sistema de sincronización maneje la creación en Auth cuando el usuario inicie sesión.
    
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('No hay usuario autenticado. No se puede crear usuario sin sesión activa.');
    }
    
    let userUid = null;
    let authExists = false;
    
    // 1. Buscar si el usuario ya existe en Firestore con este email
    const usuariosRef = collection(db, 'apps', 'auditoria', 'users');
    const q = query(usuariosRef, where('email', '==', userData.email));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      // Usuario ya existe en Firestore, usar su UID
      const existingUser = querySnapshot.docs[0];
      userUid = existingUser.id;
      authExists = true; // Ya existe en Firestore, probablemente también en Auth
      console.log('✅ Usuario encontrado en Firestore con UID:', userUid);
      console.log('📝 El usuario ya existe. Se actualizará con los nuevos datos.');
    } else {
      // Usuario no existe en Firestore
      // IMPORTANTE: El email puede existir en Auth (compartido con otras apps como ControlFile)
      // Esto está bien - creamos el documento en Firestore y el sistema de sincronización
      // vinculará el documento con el UID real cuando el usuario inicie sesión
      console.log('📧 Creando nuevo documento en Firestore para:', userData.email);
      console.log('ℹ️ Si el email ya existe en Auth (compartido con otras apps), el sistema');
      console.log('   vinculará automáticamente cuando el usuario inicie sesión.');
      
      // Usar un UID temporal basado en el email para facilitar la vinculación
      // El sistema de sincronización buscará por email y actualizará el UID cuando el usuario inicie sesión
      userUid = `temp_email_${userData.email.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}`;
      authExists = false; // No sabemos si existe en Auth, pero está bien
    }
    
    // 2. Crear/actualizar perfil en Firestore
    const userProfile = {
      uid: userUid,
      email: userData.email,
      displayName: userData.nombre,
      role: userData.role || 'operario',
      permisos: userData.permisos || {},
      createdAt: serverTimestamp(),
      appId: 'auditoria',
      empresas: [],
      auditorias: [],
      socios: [],
      configuracion: {
        notificaciones: true,
        tema: 'light'
      },
      clienteAdminId: userData.clienteAdminId || null,
      // Si el usuario no existe en Firestore, guardar la contraseña temporal
      // para que el sistema de sincronización pueda crear/vincular en Auth cuando inicie sesión
      ...(authExists ? {} : { 
        status: 'pending_sync',
        tempPassword: userData.password,
        // Marcar que necesita sincronización con Auth cuando el usuario inicie sesión
        needsAuthSync: true
      })
    };

    await setDocWithAppId(doc(db, 'apps', 'auditoria', 'users', userUid), userProfile, { merge: true });

    if (authExists) {
      console.log('✅ Usuario actualizado en Firestore');
      return {
        success: true,
        uid: userUid,
        message: `Usuario actualizado exitosamente. Rol '${userData.role || 'operario'}' asignado.`
      };
    } else {
      console.log('✅ Usuario creado en Firestore');
      console.log('ℹ️ Si el email ya existe en Auth (compartido con otras apps),');
      console.log('   el sistema vinculará automáticamente cuando el usuario inicie sesión.');
      return {
        success: true,
        uid: userUid,
        message: 'Usuario creado en Firestore. El sistema vinculará automáticamente con Auth cuando el usuario inicie sesión.',
        requiresAuthSync: true
      };
    }
  } catch (error) {
    console.error('❌ Error creando usuario:', error);
    throw new Error(`Error creando usuario: ${error.message}`);
  }
};

// Servicios de usuarios
export const userService = {
  // Crear usuario (sin desconectar al admin)
  // Usa API Route de Next.js (ruta relativa, sin CORS, ejecuta en Vercel)
  async createUser(userData) {
    try {
      console.log('📤 Creando usuario con backend de Render:', `${getBackendUrl()}/api/create-user`);
      console.log('📋 Datos del usuario:', { email: userData.email, nombre: userData.nombre, role: userData.role });
      
      // Usar externalApi (backend de Render) en lugar de nextApi
      const response = await externalApi.post('/create-user', userData);
      
      console.log('✅ Usuario creado exitosamente por el backend:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error creando usuario con backend:', error);
      console.error('📊 Detalles del error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        code: error.code,
        message: error.message
      });
      
      // Si el backend no está disponible o hay error 405/404/503, usar fallback
      if (error.response?.status === 405 || 
          error.response?.status === 404 || 
          error.response?.status === 503 ||
          error.code === 'ERR_NETWORK') {
        console.log('🔄 Backend no disponible o endpoint incorrecto, usando fallback de Firebase...');
        return await createUserWithFirebase(userData);
      }
      
      // Detectar problemas de autenticación/autorización
      if (error.response?.status === 401) {
        console.error('🚨 ERROR 401: Token de autenticación inválido o expirado');
        console.error('💡 Verifica que el admin esté autenticado correctamente');
        console.error('💡 Verifica que el token de Firebase sea válido');
        throw new Error('Error de autenticación. Por favor, recarga la página e intenta nuevamente.');
      }
      
      if (error.response?.status === 403) {
        console.error('🚨 ERROR 403: Sin permisos para crear usuarios');
        console.error('💡 Verifica que el usuario tenga rol "supermax" o "max"');
        console.error('💡 Verifica los custom claims del token');
        throw new Error('No tienes permisos para crear usuarios. Verifica tu rol de administrador.');
      }
      
      // Para otros errores, intentar fallback antes de lanzar excepción
      console.log('🔄 Intentando fallback de Firebase...');
      try {
        return await createUserWithFirebase(userData);
      } catch (fallbackError) {
        throw new Error(error.response?.data?.error || error.message || 'Error al crear usuario');
      }
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