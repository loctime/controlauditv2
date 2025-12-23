/**
 * Infraestructura centralizada para escrituras en Firestore
 * Garantiza que TODA escritura incluya appId en el root del documento
 * 
 * REGLAS:
 * - appId va en ROOT, nunca en metadata
 * - metadata es SOLO para UI/presentación
 * - Los wrappers clonan el objeto para no mutar el original
 */

import { addDoc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';

/**
 * Identificador de la aplicación
 * Este valor identifica a qué app pertenece el documento en Firestore compartido
 */
const APP_ID = 'auditoria';

/**
 * Clona un objeto de forma segura (shallow clone)
 * @param {Object} data - Objeto a clonar
 * @returns {Object} Objeto clonado
 * @throws {Error} Si data no es un objeto plano válido
 */
function cloneData(data) {
  if (data === null || data === undefined) {
    return {};
  }
  if (typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('[firestoreAppWriter] data must be a plain object');
  }
  return { ...data };
}

/**
 * Inyecta appId en el root del documento
 * Respeta appId existente si ya está presente
 * @param {Object} data - Datos del documento
 * @returns {Object} Datos con appId inyectado (si no existía)
 */
function injectAppId(data) {
  const cloned = cloneData(data);
  // Si ya tiene appId, respetarlo (útil para migraciones/correcciones)
  if ('appId' in cloned) {
    return cloned;
  }
  return {
    ...cloned,
    appId: APP_ID
  };
}

/**
 * Wrapper para addDoc que inyecta appId automáticamente
 * @param {CollectionReference} collectionRef - Referencia a la colección
 * @param {Object} data - Datos del documento
 * @returns {Promise<DocumentReference>} Referencia al documento creado
 */
export async function addDocWithAppId(collectionRef, data) {
  const dataWithAppId = injectAppId(data);
  return addDoc(collectionRef, dataWithAppId);
}

/**
 * Wrapper para setDoc que inyecta appId automáticamente
 * @param {DocumentReference} docRef - Referencia al documento
 * @param {Object} data - Datos del documento
 * @param {Object} options - Opciones adicionales (merge, mergeFields)
 * @returns {Promise<void>}
 */
export async function setDocWithAppId(docRef, data, options = {}) {
  const dataWithAppId = injectAppId(data);
  return setDoc(docRef, dataWithAppId, options);
}

/**
 * Wrapper para updateDoc que inyecta appId automáticamente
 * @param {DocumentReference} docRef - Referencia al documento
 * @param {Object} data - Datos a actualizar
 * @returns {Promise<void>}
 */
export async function updateDocWithAppId(docRef, data) {
  const dataWithAppId = injectAppId(data);
  return updateDoc(docRef, dataWithAppId);
}

/**
 * Proxy para deleteDoc (no requiere appId, pero se mantiene consistencia)
 * @param {DocumentReference} docRef - Referencia al documento
 * @returns {Promise<void>}
 */
export async function deleteDocWithAppId(docRef) {
  return deleteDoc(docRef);
}

/**
 * Wrapper para writeBatch que inyecta appId en todas las operaciones set y update
 * @param {Firestore} db - Instancia de Firestore
 * @returns {WriteBatch} Batch con métodos modificados
 */
export function writeBatchWithAppId(db) {
  const { writeBatch } = require('firebase/firestore');
  const batch = writeBatch(db);
  
  // Guardar referencias a los métodos originales
  const originalSet = batch.set.bind(batch);
  const originalUpdate = batch.update.bind(batch);
  
  // Sobrescribir set para inyectar appId (incluye merge: true)
  batch.set = function(docRef, data, options) {
    const dataWithAppId = injectAppId(data);
    return originalSet(docRef, dataWithAppId, options);
  };
  
  // Sobrescribir update para inyectar appId
  batch.update = function(docRef, data) {
    const dataWithAppId = injectAppId(data);
    return originalUpdate(docRef, dataWithAppId);
  };
  
  return batch;
}

/**
 * Obtiene el APP_ID actual (útil para validaciones o logs)
 * @returns {string} Identificador de la aplicación
 */
export function getAppId() {
  return APP_ID;
}

