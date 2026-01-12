// src/services/superdevService.ts
// Servicio para funcionalidades de superdev (impersonación de owners)

import { auth } from '../firebaseControlFile';
import { signInWithCustomToken } from 'firebase/auth';
import { getBackendUrl } from '../config/environment';

const BACKEND_URL = getBackendUrl();

/**
 * Interfaz para un owner disponible para impersonación
 */
export interface Owner {
  ownerId: string;
  email: string;
  displayName?: string;
}

/**
 * Obtiene el token de autenticación del usuario actual
 */
async function getAuthToken(): Promise<string> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('Usuario no autenticado');
  }
  return await user.getIdToken(true);
}

/**
 * Genera un custom token para impersonar a un owner
 * @param ownerId - UID del owner a impersonar
 * @returns Custom token de Firebase
 */
export async function impersonateOwner(ownerId: string): Promise<string> {
  const token = await getAuthToken();
  
  const response = await fetch(`${BACKEND_URL}/api/superdev/impersonate`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ownerId }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ 
      error: 'Error desconocido',
      code: 'UNKNOWN_ERROR' 
    }));
    
    // Mapear códigos de error según documentación
    const errorCode = error.code || 'UNKNOWN_ERROR';
    const errorMessage = error.error || `Error ${response.status}`;
    
    throw new Error(`${errorCode}: ${errorMessage}`);
  }

  const { customToken } = await response.json();
  return customToken;
}

/**
 * Autentica al usuario con un custom token (impersonación)
 * @param customToken - Custom token obtenido del backend
 */
export async function signInWithImpersonationToken(customToken: string): Promise<void> {
  await signInWithCustomToken(auth, customToken);
}

/**
 * Lista owners disponibles para impersonación
 * 
 * ⚠️ NOTA: Este endpoint puede no existir aún en el backend.
 * Si no existe, retorna lista vacía o mock temporal.
 * 
 * @returns Lista de owners disponibles
 */
export async function listOwners(): Promise<Owner[]> {
  try {
    const token = await getAuthToken();
    
    // Intentar obtener lista desde backend
    // Si el endpoint no existe, retornará 404 y usaremos mock
    const response = await fetch(`${BACKEND_URL}/api/superdev/list-owners`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      return data.owners || [];
    }

    // Si el endpoint no existe (404), retornar lista vacía
    // El componente puede mostrar mensaje apropiado
    if (response.status === 404) {
      console.warn('[superdevService] Endpoint /api/superdev/list-owners no disponible aún');
      return [];
    }

    // Otros errores
    throw new Error(`Error al listar owners: ${response.status}`);
  } catch (error) {
    console.error('[superdevService] Error al listar owners:', error);
    // Retornar lista vacía en caso de error
    return [];
  }
}
