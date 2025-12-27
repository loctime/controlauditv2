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
   FALLBACK: PERFIL PENDING
============================================================================ */

const createPendingProfile = async (userData) => {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('No hay sesión activa');

  const tempUid = `pending_${userData.email.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}`;

  const pendingProfile = {
    uid: tempUid,
    email: userData.email,
    displayName: userData.nombre,
    role: 'operario',
    permisos: userData.permisos || {},
    appId: 'auditoria',
    status: 'pending',
    tempPassword: userData.password,
    clienteAdminId: userData.clienteAdminId || null,
    createdBy: currentUser.uid,
    createdAt: serverTimestamp(),
  };

  await setDocWithAppId(
    doc(db, 'apps', 'auditoria', 'users', tempUid),
    pendingProfile
  );

  return {
    success: true,
    uid: tempUid,
    pending: true,
  };
};

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
      if (
        error.response?.status === 404 ||
        error.response?.status === 500 ||
        error.response?.status === 503
      ) {
        return await createPendingProfile(userData);
      }

      if (error.response?.status === 401) {
        throw new Error('Sesión expirada');
      }

      if (error.response?.status === 403) {
        throw new Error('Sin permisos para crear usuarios');
      }

      return await createPendingProfile(userData);
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

  async updateUserDirect(uid, updateData) {
    const { updateDocWithAppId } = await import('../firebase/firestoreAppWriter');
    const userRef = doc(db, 'apps', 'auditoria', 'users', uid);
    await updateDocWithAppId(userRef, updateData);
  },
};

export default userService;
