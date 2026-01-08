/**
 * Servicio de gestión de empresas del owner
 * 
 * Responsabilidad ÚNICA: CRUD de empresas del owner.
 * 
 * Reglas:
 * - No valida permisos (eso es responsabilidad de la capa superior)
 * - No contiene lógica legacy
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
  serverTimestamp
} from 'firebase/firestore';
import { db, auth } from '../../firebaseControlFile';
import { firestoreRoutesCore } from '../firestore/firestoreRoutes.core';
import { Empresa } from '../models/Empresa';

/**
 * Crea una nueva empresa para el owner
 */
export async function createEmpresa(
  ownerId: string,
  empresaData: {
    id: string;
    nombre: string;
    activa?: boolean;
    logoShareToken?: string | null;
  }
): Promise<Empresa> {
  const methodName = 'createEmpresa';
  const operation = 'write';
  const path = firestoreRoutesCore.empresa(ownerId, empresaData.id);
  const pathString = path.join('/');
  const currentUid = auth.currentUser?.uid || 'not-authenticated';

  console.log(`[Firestore][${methodName}] ===== INICIO OPERACIÓN FIRESTORE =====`);
  console.log(`[Firestore][${methodName}] Iniciando operación`);
  console.log(`[Firestore][${methodName}] Path: ${pathString}`);
  console.log(`[Firestore][${methodName}] Tipo: ${operation}`);
  console.log(`[Firestore][${methodName}] ownerId: ${ownerId}`);
  console.log(`[Firestore][${methodName}] empresaId: ${empresaData.id}`);
  console.log(`[Firestore][${methodName}] uid: ${currentUid}`);
  console.log(`[Firestore][${methodName}] auth.currentUser existe:`, !!auth.currentUser);
  console.log(`[Firestore][${methodName}] auth.currentUser?.uid:`, auth.currentUser?.uid);

  if (!ownerId) {
    throw new Error('ownerId es requerido');
  }
  if (!empresaData.id) {
    throw new Error('empresaData.id es requerido');
  }
  if (!empresaData.nombre) {
    throw new Error('empresaData.nombre es requerido');
  }

  // Obtener uid del usuario autenticado (requerido por las rules de Firestore)
  const authUser = auth.currentUser;
  if (!authUser || !authUser.uid) {
    throw new Error('Usuario no autenticado');
  }
  const authUid = authUser.uid;

  // Validar que ownerId coincida con el usuario autenticado (requerido por las rules)
  if (ownerId !== authUid) {
    throw new Error('ownerId debe ser igual al usuario autenticado');
  }

  const empresaRef = doc(
    db,
    ...path
  );

  const empresa: Empresa = {
    id: empresaData.id,
    ownerId,
    nombre: empresaData.nombre,
    activa: empresaData.activa !== undefined ? empresaData.activa : true,
    createdAt: new Date()
  };

  try {
    // Crear documento con todos los campos necesarios
    // El documento debe ser autocontenible y usable sin depender de otros servicios
    const documentData: any = {
      appId: 'auditoria',
      id: empresaData.id,
      nombre: empresaData.nombre,
      ownerId: authUid,
      activa: empresaData.activa !== undefined ? empresaData.activa : true,
      logo: {
        type: 'controlfile',
        shareToken: empresaData.logoShareToken || null
      },
      createdAt: serverTimestamp(),
      createdBy: authUid,
      updatedAt: serverTimestamp(),
      updatedBy: authUid
    };
    
    console.log(`[Firestore][${methodName}] Ejecutando setDoc...`);
    console.log(`[Firestore][${methodName}] empresaRef.path:`, empresaRef.path);
    console.log(`[Firestore][${methodName}] Datos a escribir:`, {
      appId: documentData.appId,
      id: documentData.id,
      nombre: documentData.nombre,
      ownerId: documentData.ownerId,
      activa: documentData.activa,
      logo: documentData.logo,
      createdBy: documentData.createdBy
    });
    
    await setDoc(empresaRef, documentData);
    
    console.log(`[Firestore][${methodName}] ✅ ===== OPERACIÓN EXITOSA =====`);
    console.log(`[Firestore][${methodName}] Path: ${pathString}`);
    return empresa;
  } catch (error: any) {
    console.group('[Firestore ERROR]');
    console.error('code:', error.code);
    console.error('message:', error.message);
    console.error('stack:', error.stack);
    console.groupEnd();
    
    console.error(`[Firestore][${methodName}] ===== ERROR EN FIRESTORE =====`);
    console.error(`[Firestore][${methodName}] ❌ ERROR`);
    console.error(`[Firestore][${methodName}] Path: ${pathString}`);
    console.error(`[Firestore][${methodName}] Tipo: ${operation}`);
    console.error(`[Firestore][${methodName}] error.code: ${error.code || 'unknown'}`);
    console.error(`[Firestore][${methodName}] error.message: ${error.message || 'unknown'}`);
    console.error(`[Firestore][${methodName}] error.name: ${error.name || 'unknown'}`);
    console.error(`[Firestore][${methodName}] error.stack:`, error.stack);
    console.error(`[Firestore][${methodName}] ownerId: ${ownerId}`);
    console.error(`[Firestore][${methodName}] empresaId: ${empresaData.id}`);
    console.error(`[Firestore][${methodName}] uid: ${currentUid}`);
    console.error(`[Firestore][${methodName}] auth.currentUser existe:`, !!auth.currentUser);
    console.error(`[Firestore][${methodName}] auth.currentUser?.uid:`, auth.currentUser?.uid);
    throw error;
  }
}

/**
 * Obtiene todas las empresas del owner
 */
export async function getEmpresas(ownerId: string): Promise<Empresa[]> {
  const methodName = 'getEmpresas';
  const operation = 'read';
  const path = firestoreRoutesCore.empresas(ownerId);
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

  const empresasRef = collection(
    db,
    ...path
  );

  try {
    const snapshot = await getDocs(empresasRef);
    console.log(`[Firestore][${methodName}] ✅ Operación exitosa`);
    console.log(`[Firestore][${methodName}] Path: ${pathString}`);
    console.log(`[Firestore][${methodName}] Documentos encontrados: ${snapshot.docs.length}`);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ownerId: data.ownerId,
        nombre: data.nombre,
        activa: data.activa !== undefined ? data.activa : true,
        createdAt: data.createdAt?.toDate() || new Date()
      } as Empresa;
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
 * Obtiene una empresa específica del owner
 */
export async function getEmpresa(
  ownerId: string,
  empresaId: string
): Promise<Empresa | null> {
  const methodName = 'getEmpresa';
  const operation = 'read';
  const path = firestoreRoutesCore.empresa(ownerId, empresaId);
  const pathString = path.join('/');
  const currentUid = auth.currentUser?.uid || 'not-authenticated';

  console.log(`[Firestore][${methodName}] Iniciando operación`);
  console.log(`[Firestore][${methodName}] Path: ${pathString}`);
  console.log(`[Firestore][${methodName}] Tipo: ${operation}`);
  console.log(`[Firestore][${methodName}] ownerId: ${ownerId}`);
  console.log(`[Firestore][${methodName}] empresaId: ${empresaId}`);
  console.log(`[Firestore][${methodName}] uid: ${currentUid}`);

  if (!ownerId) {
    throw new Error('ownerId es requerido');
  }
  if (!empresaId) {
    throw new Error('empresaId es requerido');
  }

  const empresaRef = doc(
    db,
    ...path
  );

  try {
    const snapshot = await getDoc(empresaRef);
    
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
      nombre: data.nombre,
      activa: data.activa !== undefined ? data.activa : true,
      createdAt: data.createdAt?.toDate() || new Date()
    } as Empresa;
  } catch (error: any) {
    console.error(`[Firestore][${methodName}] ❌ ERROR`);
    console.error(`[Firestore][${methodName}] Path: ${pathString}`);
    console.error(`[Firestore][${methodName}] Tipo: ${operation}`);
    console.error(`[Firestore][${methodName}] error.code: ${error.code || 'unknown'}`);
    console.error(`[Firestore][${methodName}] error.message: ${error.message || 'unknown'}`);
    console.error(`[Firestore][${methodName}] ownerId: ${ownerId}`);
    console.error(`[Firestore][${methodName}] empresaId: ${empresaId}`);
    console.error(`[Firestore][${methodName}] uid: ${currentUid}`);
    throw error;
  }
}

/**
 * Actualiza una empresa del owner
 */
export async function updateEmpresa(
  ownerId: string,
  empresaId: string,
  data: Partial<Pick<Empresa, 'nombre' | 'activa'>>
): Promise<void> {
  const methodName = 'updateEmpresa';
  const operation = 'update';
  const path = firestoreRoutesCore.empresa(ownerId, empresaId);
  const pathString = path.join('/');
  const currentUid = auth.currentUser?.uid || 'not-authenticated';

  console.log(`[Firestore][${methodName}] Iniciando operación`);
  console.log(`[Firestore][${methodName}] Path: ${pathString}`);
  console.log(`[Firestore][${methodName}] Tipo: ${operation}`);
  console.log(`[Firestore][${methodName}] ownerId: ${ownerId}`);
  console.log(`[Firestore][${methodName}] empresaId: ${empresaId}`);
  console.log(`[Firestore][${methodName}] uid: ${currentUid}`);
  console.log(`[Firestore][${methodName}] Datos a actualizar:`, JSON.stringify(data));

  if (!ownerId) {
    throw new Error('ownerId es requerido');
  }
  if (!empresaId) {
    throw new Error('empresaId es requerido');
  }

  const empresaRef = doc(
    db,
    ...path
  );

  try {
    await updateDoc(empresaRef, data);
    console.log(`[Firestore][${methodName}] ✅ Operación exitosa`);
    console.log(`[Firestore][${methodName}] Path: ${pathString}`);
  } catch (error: any) {
    console.error(`[Firestore][${methodName}] ❌ ERROR`);
    console.error(`[Firestore][${methodName}] Path: ${pathString}`);
    console.error(`[Firestore][${methodName}] Tipo: ${operation}`);
    console.error(`[Firestore][${methodName}] error.code: ${error.code || 'unknown'}`);
    console.error(`[Firestore][${methodName}] error.message: ${error.message || 'unknown'}`);
    console.error(`[Firestore][${methodName}] ownerId: ${ownerId}`);
    console.error(`[Firestore][${methodName}] empresaId: ${empresaId}`);
    console.error(`[Firestore][${methodName}] uid: ${currentUid}`);
    throw error;
  }
}
