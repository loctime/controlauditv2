// src/services/userService.js
import axios from 'axios';
import { auth } from '../firebaseConfig';

const API_BASE_URL = 'http://localhost:4000/api'; // Cambiar según tu configuración

// Configurar axios con interceptor para agregar token automáticamente
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Interceptor para agregar token de Firebase automáticamente
api.interceptors.request.use(async (config) => {
  try {
    const token = await auth.currentUser?.getIdToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (error) {
    console.error('Error obteniendo token:', error);
  }
  return config;
});

// Servicios de usuarios
export const userService = {
  // Crear usuario (sin desconectar al admin)
  async createUser(userData) {
    try {
      const response = await api.post('/create-user', userData);
      return response.data;
    } catch (error) {
      console.error('Error creando usuario:', error);
      throw new Error(error.response?.data?.error || 'Error al crear usuario');
    }
  },

  // Listar usuarios (filtrado por multi-tenant)
  async listUsers() {
    try {
      const response = await api.get('/list-users');
      return response.data.usuarios;
    } catch (error) {
      console.error('Error listando usuarios:', error);
      throw new Error(error.response?.data?.error || 'Error al listar usuarios');
    }
  },

  // Actualizar usuario
  async updateUser(uid, updateData) {
    try {
      const response = await api.put(`/update-user/${uid}`, updateData);
      return response.data;
    } catch (error) {
      console.error('Error actualizando usuario:', error);
      throw new Error(error.response?.data?.error || 'Error al actualizar usuario');
    }
  },

  // Eliminar usuario
  async deleteUser(uid) {
    try {
      const response = await api.delete(`/delete-user/${uid}`);
      return response.data;
    } catch (error) {
      console.error('Error eliminando usuario:', error);
      throw new Error(error.response?.data?.error || 'Error al eliminar usuario');
    }
  },

  // Cambiar rol de usuario (sin desconectar)
  async changeUserRole(uid, newRole, newPermisos) {
    try {
      const response = await api.put(`/change-role/${uid}`, {
        newRole,
        newPermisos
      });
      return response.data;
    } catch (error) {
      console.error('Error cambiando rol:', error);
      throw new Error(error.response?.data?.error || 'Error al cambiar rol');
    }
  }
};

export default userService; 