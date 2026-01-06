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
import { db, auth } from '../../firebaseControlFile';
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
  const methodName = 'createUser';
  const operation = 'write';
  const path = firestoreRoutesCore.usuario(ownerId, userData.id);
  const pathString = path.join('/');
  const currentUid = auth.currentUser?.uid || 'not-authenticated';

  console.log(`[Firestore][${methodName}] Iniciando operación`);
  console.log(`[Firestore][${methodName}] Path: ${pathString}`);
  console.log(`[Firestore][${methodName}] Tipo: ${operation}`);
  console.log(`[Firestore][${methodName}] ownerId: ${ownerId}`);
  console.log(`[Firestore][${methodName}] userId: ${userData.id}`);
  console.log(`[Firestore][${methodName}] role: ${userData.role}`);
  console.log(`[Firestore][${methodName}] uid: ${currentUid}`);

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
    ...path
  );

  const user: User = {
    id: userData.id,
    ownerId,
    role: userData.role,
    empresasAsignadas: userData.empresasAsignadas || [],
    activo: userData.activo !== undefined ? userData.activo : true,
    createdAt: new Date()
  };

  try {
    await setDoc(userRef, {
      ...user,
      createdAt: serverTimestamp()
    });
    console.log(`[Firestore][${methodName}] ✅ Operación exitosa`);
    console.log(`[Firestore][${methodName}] Path: ${pathString}`);
    return user;
  } catch (error: any) {
    console.group('[Firestore ERROR]');
    console.error('code:', error.code);
    console.error('message:', error.message);
    console.error('stack:', error.stack);
    console.groupEnd();
    
    console.error(`[Firestore][${methodName}] ❌ ERROR`);
    console.error(`[Firestore][${methodName}] Path: ${pathString}`);
    console.error(`[Firestore][${methodName}] Tipo: ${operation}`);
    console.error(`[Firestore][${methodName}] error.code: ${error.code || 'unknown'}`);
    console.error(`[Firestore][${methodName}] error.message: ${error.message || 'unknown'}`);
    console.error(`[Firestore][${methodName}] ownerId: ${ownerId}`);
    console.error(`[Firestore][${methodName}] userId: ${userData.id}`);
    console.error(`[Firestore][${methodName}] uid: ${currentUid}`);
    throw error;
  }
}

/**
 * Asigna empresas a un usuario
 */
export async function assignEmpresasToUser(
  ownerId: string,
  userId: string,
  empresaIds: string[]
): Promise<void> {
  const methodName = 'assignEmpresasToUser';
  const operation = 'update';
  const path = firestoreRoutesCore.usuario(ownerId, userId);
  const pathString = path.join('/');
  const currentUid = auth.currentUser?.uid || 'not-authenticated';

  console.log(`[Firestore][${methodName}] Iniciando operación`);
  console.log(`[Firestore][${methodName}] Path: ${pathString}`);
  console.log(`[Firestore][${methodName}] Tipo: ${operation}`);
  console.log(`[Firestore][${methodName}] ownerId: ${ownerId}`);
  console.log(`[Firestore][${methodName}] userId: ${userId}`);
  console.log(`[Firestore][${methodName}] empresaIds: ${JSON.stringify(empresaIds)}`);
  console.log(`[Firestore][${methodName}] uid: ${currentUid}`);

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
    ...path
  );

  try {
    await updateDoc(userRef, {
      empresasAsignadas: empresaIds
    });
    console.log(`[Firestore][${methodName}] ✅ Operación exitosa`);
    console.log(`[Firestore][${methodName}] Path: ${pathString}`);
  } catch (error: any) {
    console.group('[Firestore ERROR]');
    console.error('code:', error.code);
    console.error('message:', error.message);
    console.error('stack:', error.stack);
    console.groupEnd();
    
    console.error(`[Firestore][${methodName}] ❌ ERROR`);
    console.error(`[Firestore][${methodName}] Path: ${pathString}`);
    console.error(`[Firestore][${methodName}] Tipo: ${operation}`);
    console.error(`[Firestore][${methodName}] error.code: ${error.code || 'unknown'}`);
    console.error(`[Firestore][${methodName}] error.message: ${error.message || 'unknown'}`);
    console.error(`[Firestore][${methodName}] ownerId: ${ownerId}`);
    console.error(`[Firestore][${methodName}] userId: ${userId}`);
    console.error(`[Firestore][${methodName}] empresaIds: ${JSON.stringify(empresaIds)}`);
    console.error(`[Firestore][${methodName}] uid: ${currentUid}`);
    throw error;
  }
}

/**
 * Obtiene todos los usuarios del owner
 */
export async function getUsers(ownerId: string): Promise<User[]> {
  const methodName = 'getUsers';
  const operation = 'read';
  const path = firestoreRoutesCore.usuarios(ownerId);
  const pathString = path.join('/');
  const currentUid = auth.currentUser?.uid || 'not-authenticated';

  console.log(`[Firestore][${methodName}] Iniciando operación`);
  console.log(`[Firestore][${methodName}] Path: ${pathString}`);
  console.log(`[Firestore][${methodName}] Tipo: ${operation}`);
  console.log(`[Firestore][${methodName}] ownerId: ${ownerId}`);
  console.log(`[Firestore][${methodName}] uid: ${currentUid}`);

  if (!ownerId) {
    throw new Error('ownerId es requerido');
  }

  const usuariosRef = collection(
    db,
    ...path
  );

  try {
    const snapshot = await getDocs(usuariosRef);
    console.log(`[Firestore][${methodName}] ✅ Operación exitosa`);
    console.log(`[Firestore][${methodName}] Path: ${pathString}`);
    console.log(`[Firestore][${methodName}] Documentos encontrados: ${snapshot.docs.length}`);
    
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
  } catch (error: any) {
    console.group('[Firestore ERROR]');
    console.error('code:', error.code);
    console.error('message:', error.message);
    console.error('stack:', error.stack);
    console.groupEnd();
    
    console.error(`[Firestore][${methodName}] ❌ ERROR`);
    console.error(`[Firestore][${methodName}] Path: ${pathString}`);
    console.error(`[Firestore][${methodName}] Tipo: ${operation}`);
    console.error(`[Firestore][${methodName}] error.code: ${error.code || 'unknown'}`);
    console.error(`[Firestore][${methodName}] error.message: ${error.message || 'unknown'}`);
    console.error(`[Firestore][${methodName}] ownerId: ${ownerId}`);
    console.error(`[Firestore][${methodName}] uid: ${currentUid}`);
    throw error;
  }
}

/**
 * Obtiene un usuario específico del owner
 */
export async function getUser(
  ownerId: string,
  userId: string
): Promise<User | null> {
  const methodName = 'getUser';
  const operation = 'read';
  const path = firestoreRoutesCore.usuario(ownerId, userId);
  const pathString = path.join('/');
  const currentUid = auth.currentUser?.uid || 'not-authenticated';

  console.log(`[Firestore][${methodName}] Iniciando operación`);
  console.log(`[Firestore][${methodName}] Path: ${pathString}`);
  console.log(`[Firestore][${methodName}] Tipo: ${operation}`);
  console.log(`[Firestore][${methodName}] ownerId: ${ownerId}`);
  console.log(`[Firestore][${methodName}] userId: ${userId}`);
  console.log(`[Firestore][${methodName}] uid: ${currentUid}`);

  if (!ownerId) {
    throw new Error('ownerId es requerido');
  }
  if (!userId) {
    throw new Error('userId es requerido');
  }

  const userRef = doc(
    db,
    ...path
  );

  try {
    const snapshot = await getDoc(userRef);
    
    if (!snapshot.exists()) {
      console.log(`[Firestore][${methodName}] ⚠️ Documento no existe`);
      console.log(`[Firestore][${methodName}] Path: ${pathString}`);
      return null;
    }

    console.log(`[Firestore][${methodName}] ✅ Operación exitosa`);
    console.log(`[Firestore][${methodName}] Path: ${pathString}`);
    
    const data = snapshot.data();
    return {
      id: snapshot.id,
      ownerId: data.ownerId,
      role: data.role,
      empresasAsignadas: data.empresasAsignadas || [],
      activo: data.activo !== undefined ? data.activo : true,
      createdAt: data.createdAt?.toDate() || new Date()
    } as User;
  } catch (error: any) {
    console.error(`[Firestore][${methodName}] ❌ ERROR`);
    console.error(`[Firestore][${methodName}] Path: ${pathString}`);
    console.error(`[Firestore][${methodName}] Tipo: ${operation}`);
    console.error(`[Firestore][${methodName}] error.code: ${error.code || 'unknown'}`);
    console.error(`[Firestore][${methodName}] error.message: ${error.message || 'unknown'}`);
    console.error(`[Firestore][${methodName}] ownerId: ${ownerId}`);
    console.error(`[Firestore][${methodName}] userId: ${userId}`);
    console.error(`[Firestore][${methodName}] uid: ${currentUid}`);
    throw error;
  }
}

/**
 * Desactiva un usuario del owner
 */
export async function deactivateUser(
  ownerId: string,
  userId: string
): Promise<void> {
  const methodName = 'deactivateUser';
  const operation = 'update';
  const path = firestoreRoutesCore.usuario(ownerId, userId);
  const pathString = path.join('/');
  const currentUid = auth.currentUser?.uid || 'not-authenticated';

  console.log(`[Firestore][${methodName}] Iniciando operación`);
  console.log(`[Firestore][${methodName}] Path: ${pathString}`);
  console.log(`[Firestore][${methodName}] Tipo: ${operation}`);
  console.log(`[Firestore][${methodName}] ownerId: ${ownerId}`);
  console.log(`[Firestore][${methodName}] userId: ${userId}`);
  console.log(`[Firestore][${methodName}] uid: ${currentUid}`);

  if (!ownerId) {
    throw new Error('ownerId es requerido');
  }
  if (!userId) {
    throw new Error('userId es requerido');
  }

  const userRef = doc(
    db,
    ...path
  );

  try {
    await updateDoc(userRef, {
      activo: false
    });
    console.log(`[Firestore][${methodName}] ✅ Operación exitosa`);
    console.log(`[Firestore][${methodName}] Path: ${pathString}`);
  } catch (error: any) {
    console.error(`[Firestore][${methodName}] ❌ ERROR`);
    console.error(`[Firestore][${methodName}] Path: ${pathString}`);
    console.error(`[Firestore][${methodName}] Tipo: ${operation}`);
    console.error(`[Firestore][${methodName}] error.code: ${error.code || 'unknown'}`);
    console.error(`[Firestore][${methodName}] error.message: ${error.message || 'unknown'}`);
    console.error(`[Firestore][${methodName}] ownerId: ${ownerId}`);
    console.error(`[Firestore][${methodName}] userId: ${userId}`);
    console.error(`[Firestore][${methodName}] uid: ${currentUid}`);
    throw error;
  }
}
