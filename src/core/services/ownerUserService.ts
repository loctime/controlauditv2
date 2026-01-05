/**
 * Servicio de gestión de usuarios del owner
 * 
 * Responsabilidad ÚNICA: CRUD de usuarios del owner.
 * 
 * Reglas:
 * - No valida permisos (eso es responsabilidad de la capa superior)
 * - No contiene lógica legacy
 * - No roles automáticos
 * - Operaciones explícitas y simples
 */

import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../../firebaseControlFile';
import { firestoreRoutesCore } from '../firestore/firestoreRoutes.core';
import { User } from '../models/User';

/**
 * Crea un nuevo usuario para el owner
 */
export async function createUser(
  ownerId: string,
  userData: {
    id: string;
    role: 'admin' | 'operario';
    empresasAsignadas?: string[];
    activo?: boolean;
  }
): Promise<User> {
  if (!ownerId) {
    throw new Error('ownerId es requerido');
  }
  if (!userData.id) {
    throw new Error('userData.id es requerido');
  }
  if (!userData.role) {
    throw new Error('userData.role es requerido');
  }

  const userRef = doc(
    db,
    ...firestoreRoutesCore.usuario(ownerId, userData.id)
  );

  const user: User = {
    id: userData.id,
    ownerId,
    role: userData.role,
    empresasAsignadas: userData.empresasAsignadas || [],
    activo: userData.activo !== undefined ? userData.activo : true,
    createdAt: new Date()
  };

  await setDoc(userRef, {
    ...user,
    createdAt: serverTimestamp()
  });

  return user;
}

/**
 * Asigna empresas a un usuario
 */
export async function assignEmpresasToUser(
  ownerId: string,
  userId: string,
  empresaIds: string[]
): Promise<void> {
  if (!ownerId) {
    throw new Error('ownerId es requerido');
  }
  if (!userId) {
    throw new Error('userId es requerido');
  }
  if (!Array.isArray(empresaIds)) {
    throw new Error('empresaIds debe ser un array');
  }

  const userRef = doc(
    db,
    ...firestoreRoutesCore.usuario(ownerId, userId)
  );

  await updateDoc(userRef, {
    empresasAsignadas: empresaIds
  });
}

/**
 * Obtiene todos los usuarios del owner
 */
export async function getUsers(ownerId: string): Promise<User[]> {
  if (!ownerId) {
    throw new Error('ownerId es requerido');
  }

  const usuariosRef = collection(
    db,
    ...firestoreRoutesCore.usuarios(ownerId)
  );

  const snapshot = await getDocs(usuariosRef);
  
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ownerId: data.ownerId,
      role: data.role,
      empresasAsignadas: data.empresasAsignadas || [],
      activo: data.activo !== undefined ? data.activo : true,
      createdAt: data.createdAt?.toDate() || new Date()
    } as User;
  });
}

/**
 * Obtiene un usuario específico del owner
 */
export async function getUser(
  ownerId: string,
  userId: string
): Promise<User | null> {
  if (!ownerId) {
    throw new Error('ownerId es requerido');
  }
  if (!userId) {
    throw new Error('userId es requerido');
  }

  const userRef = doc(
    db,
    ...firestoreRoutesCore.usuario(ownerId, userId)
  );

  const snapshot = await getDoc(userRef);
  
  if (!snapshot.exists()) {
    return null;
  }

  const data = snapshot.data();
  return {
    id: snapshot.id,
    ownerId: data.ownerId,
    role: data.role,
    empresasAsignadas: data.empresasAsignadas || [],
    activo: data.activo !== undefined ? data.activo : true,
    createdAt: data.createdAt?.toDate() || new Date()
  } as User;
}

/**
 * Desactiva un usuario del owner
 */
export async function deactivateUser(
  ownerId: string,
  userId: string
): Promise<void> {
  if (!ownerId) {
    throw new Error('ownerId es requerido');
  }
  if (!userId) {
    throw new Error('userId es requerido');
  }

  const userRef = doc(
    db,
    ...firestoreRoutesCore.usuario(ownerId, userId)
  );

  await updateDoc(userRef, {
    activo: false
  });
}
