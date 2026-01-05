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
import { db } from '../../firebaseControlFile';
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
  }
): Promise<Empresa> {
  if (!ownerId) {
    throw new Error('ownerId es requerido');
  }
  if (!empresaData.id) {
    throw new Error('empresaData.id es requerido');
  }
  if (!empresaData.nombre) {
    throw new Error('empresaData.nombre es requerido');
  }

  const empresaRef = doc(
    db,
    ...firestoreRoutesCore.empresa(ownerId, empresaData.id)
  );

  const empresa: Empresa = {
    id: empresaData.id,
    ownerId,
    nombre: empresaData.nombre,
    activa: empresaData.activa !== undefined ? empresaData.activa : true,
    createdAt: new Date()
  };

  await setDoc(empresaRef, {
    ...empresa,
    createdAt: serverTimestamp()
  });

  return empresa;
}

/**
 * Obtiene todas las empresas del owner
 */
export async function getEmpresas(ownerId: string): Promise<Empresa[]> {
  if (!ownerId) {
    throw new Error('ownerId es requerido');
  }

  const empresasRef = collection(
    db,
    ...firestoreRoutesCore.empresas(ownerId)
  );

  const snapshot = await getDocs(empresasRef);
  
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
}

/**
 * Obtiene una empresa específica del owner
 */
export async function getEmpresa(
  ownerId: string,
  empresaId: string
): Promise<Empresa | null> {
  if (!ownerId) {
    throw new Error('ownerId es requerido');
  }
  if (!empresaId) {
    throw new Error('empresaId es requerido');
  }

  const empresaRef = doc(
    db,
    ...firestoreRoutesCore.empresa(ownerId, empresaId)
  );

  const snapshot = await getDoc(empresaRef);
  
  if (!snapshot.exists()) {
    return null;
  }

  const data = snapshot.data();
  return {
    id: snapshot.id,
    ownerId: data.ownerId,
    nombre: data.nombre,
    activa: data.activa !== undefined ? data.activa : true,
    createdAt: data.createdAt?.toDate() || new Date()
  } as Empresa;
}

/**
 * Actualiza una empresa del owner
 */
export async function updateEmpresa(
  ownerId: string,
  empresaId: string,
  data: Partial<Pick<Empresa, 'nombre' | 'activa'>>
): Promise<void> {
  if (!ownerId) {
    throw new Error('ownerId es requerido');
  }
  if (!empresaId) {
    throw new Error('empresaId es requerido');
  }

  const empresaRef = doc(
    db,
    ...firestoreRoutesCore.empresa(ownerId, empresaId)
  );

  await updateDoc(empresaRef, data);
}
