// src/services/userService.js
import axios from 'axios';
import { auth } from '../firebaseControlFile';
import { onAuthStateChanged } from 'firebase/auth';
import { getBackendUrl } from '../config/environment.js';
import { doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebaseControlFile';
import { setDocWithAppId } from '../firebase/firestoreAppWriter';

/* ============================================================================
   API INSTANCES
============================================================================ */

// API Routes de Next.js (Vercel, sin CORS)
const nextApi = axios.create({
  baseURL: '/api',
  timeout: 30000,
});

// Backend externo ControlFile (Render)
const API_BASE_URL = `${getBackendUrl()}/api`;
const externalApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

/* ============================================================================
   AUTH HELPERS
============================================================================ */

const getCurrentUser = async () => {
  if (auth.currentUser) return auth.currentUser;

  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      user ? resolve(user) : reject(new Error('Usuario no autenticado'));
    });

    setTimeout(() => {
      unsubscribe();
      reject(new Error('Timeout esperando autenticación'));
    }, 1000);
  });
};

const addAuthToken = async (config) => {
  const user = await getCurrentUser();
  const token = await user.getIdToken(true);
  config.headers.Authorization = `Bearer ${token}`;
  return config;
};

nextApi.interceptors.request.use(addAuthToken);
externalApi.interceptors.request.use(addAuthToken);

/* ============================================================================
   ELIMINADO: PERFIL PENDING (LEGACY)
============================================================================ */
// Código legacy eliminado - NO se crean perfiles automáticamente
// Los perfiles deben crearse solo desde el backend usando owner-centric:
// apps/auditoria/owners/{ownerId}/usuarios/{userId}

/* ============================================================================
   USER SERVICE
============================================================================ */

export const userService = {
  async createUser(userData) {
    try {
      const backendUrl =
        import.meta.env.VITE_CONTROLFILE_BACKEND_URL ||
        'https://controlfile.onrender.com';

      const endpoint = `${backendUrl}/api/admin/create-user`;

      const currentUser = await getCurrentUser();
      const token = await currentUser.getIdToken(true);

      // 🔒 PAYLOAD NORMALIZADO (CLAVE)
      const payload = {
        email: userData.email,
        password: userData.password,
        nombre: userData.nombre,

        role: 'operario',
        appId: 'auditoria',

        clienteAdminId: userData.clienteAdminId || null,
        permisos: userData.permisos || {},
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw {
          response: {
            status: response.status,
            data: errorData,
          },
        };
      }

      return await response.json();
    } catch (error) {
      if (error.response?.status === 401) {
        throw new Error('Sesión expirada');
      }

      if (error.response?.status === 403) {
        throw new Error('Sin permisos para crear usuarios');
      }

      // No hay fallback - el backend debe estar disponible para crear usuarios
      throw error;
    }
  },

  async listUsers() {
    const res = await nextApi.get('/list-users');
    return res.data.usuarios;
  },

  async updateUser(uid, updateData) {
    const res = await nextApi.put(`/update-user/${uid}`, updateData);
    return res.data;
  },

  async deleteUser(uid) {
    const res = await nextApi.delete(`/delete-user/${uid}`);
    return res.data;
  },

  async checkBackendHealth() {
    const res = await externalApi.get('/health');
    return res.data;
  },

  // ELIMINADO: updateUserDirect - usa rutas legacy
  // Usar ownerUserService.updateUser() en su lugar con owner-centric path
};

export default userService;
