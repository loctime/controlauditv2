import { collection, doc, getDoc, getDocs, query, where, orderBy, limit, Timestamp, writeBatch } from 'firebase/firestore';
import { dbAudit } from '../../firebaseControlFile';
import { firestoreRoutesCore } from '../../core/firestore/firestoreRoutes.core';
import { addDocWithAppId, setDocWithAppId, updateDocWithAppId, deleteDocWithAppId } from '../../firebase/firestoreAppWriter';

export function ensureOwnerId(ownerId) {
  if (!ownerId) {
    throw new Error('ownerId is required');
  }
  return ownerId;
}

export function nowTs() {
  return Timestamp.now();
}

export function getCollectionRef(ownerId, key) {
  ensureOwnerId(ownerId);
  const routeBuilder = firestoreRoutesCore[key];
  if (!routeBuilder || typeof routeBuilder !== 'function') {
    throw new Error(`firestoreRoutesCore.${key} is not defined`);
  }
  let pathSegments;
  try {
    pathSegments = routeBuilder(ownerId);
  } catch (err) {
    console.error('[trainingBaseService.getCollectionRef] routeBuilder falló', { ownerId, key, err });
    throw err;
  }
  const invalid = !Array.isArray(pathSegments) || pathSegments.some((s) => typeof s !== 'string' || s === '');
  if (invalid) {
    console.error('[trainingBaseService.getCollectionRef] path inválido (cada segmento debe ser string no vacío)', { ownerId, key, pathSegments });
    throw new Error(`[trainingBaseService.getCollectionRef] path inválido para key=${key}`);
  }
  try {
    return collection(dbAudit, ...pathSegments);
  } catch (err) {
    console.error('[trainingBaseService.getCollectionRef] collection() falló', { ownerId, key, pathSegments, err });
    throw err;
  }
}

/**
 * Normaliza id a string. Firestore puede devolver DocumentReference; doc() requiere segmentos string.
 * Evita "Cannot read properties of undefined (reading 'path')".
 */
function normalizeDocumentId(id) {
  if (id == null) return null;
  if (typeof id === 'string') return id;
  if (typeof id === 'number') return String(id);
  if (typeof id === 'object' && id != null && id.id != null) return String(id.id);
  return null;
}

export function getDocumentRef(ownerId, key, id) {
  ensureOwnerId(ownerId);
  const normalizedId = normalizeDocumentId(id);
  if (normalizedId == null || normalizedId === '') {
    const msg = `[trainingBaseService.getDocumentRef] id inválido (key=${key}, id=${id})`;
    console.error(msg, { ownerId, key, id });
    throw new Error(msg);
  }
  const routeBuilder = firestoreRoutesCore[key];
  if (!routeBuilder || typeof routeBuilder !== 'function') {
    throw new Error(`firestoreRoutesCore.${key} is not defined`);
  }
  let pathSegments;
  try {
    pathSegments = routeBuilder(ownerId, normalizedId);
  } catch (err) {
    console.error('[trainingBaseService.getDocumentRef] routeBuilder falló', { ownerId, key, normalizedId, err });
    throw err;
  }
  const invalid = !Array.isArray(pathSegments) || pathSegments.some((s) => typeof s !== 'string' || s === '');
  if (invalid) {
    console.error('[trainingBaseService.getDocumentRef] path inválido (cada segmento debe ser string no vacío)', { ownerId, key, normalizedId, pathSegments });
    throw new Error(`[trainingBaseService.getDocumentRef] path inválido para key=${key}`);
  }
  try {
    return doc(dbAudit, ...pathSegments);
  } catch (err) {
    console.error('[trainingBaseService.getDocumentRef] doc() falló', { ownerId, key, normalizedId, pathSegments, err });
    throw err;
  }
}

export async function createDocument(ownerId, collectionKey, data) {
  const ref = getCollectionRef(ownerId, collectionKey);
  return addDocWithAppId(ref, {
    ...data,
    ownerId,
    createdAt: data.createdAt || nowTs(),
    updatedAt: nowTs()
  });
}

export async function setDocument(ownerId, docKey, id, data) {
  const ref = getDocumentRef(ownerId, docKey, id);
  await setDocWithAppId(ref, {
    ...data,
    ownerId,
    createdAt: data.createdAt || nowTs(),
    updatedAt: nowTs()
  });
  return ref;
}

export async function updateDocument(ownerId, docKey, id, data) {
  const ref = getDocumentRef(ownerId, docKey, id);
  await updateDocWithAppId(ref, {
    ...data,
    updatedAt: nowTs()
  });
  return ref;
}

export async function deleteDocument(ownerId, docKey, id) {
  const ref = getDocumentRef(ownerId, docKey, id);
  await deleteDocWithAppId(ref);
}

export async function getDocument(ownerId, docKey, id) {
  let ref;
  try {
    ref = getDocumentRef(ownerId, docKey, id);
  } catch (err) {
    console.error('[trainingBaseService.getDocument] getDocumentRef falló', { ownerId, docKey, id, err });
    throw err;
  }
  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      return null;
    }
    return { id: snap.id, ...snap.data() };
  } catch (err) {
    console.error('[trainingBaseService.getDocument] getDoc falló', { ownerId, docKey, id, err });
    throw err;
  }
}

export async function listDocuments(ownerId, collectionKey) {
  const ref = getCollectionRef(ownerId, collectionKey);
  const snap = await getDocs(ref);
  return snap.docs.map((item) => ({ id: item.id, ...item.data() }));
}

export async function queryDocuments(ownerId, collectionKey, constraints = []) {
  const ref = getCollectionRef(ownerId, collectionKey);
  const q = constraints.length > 0 ? query(ref, ...constraints) : ref;
  const snap = await getDocs(q);
  return snap.docs.map((item) => ({ id: item.id, ...item.data() }));
}

export function buildWhere(field, op, value) {
  return where(field, op, value);
}

export function buildOrderBy(field, direction = 'asc') {
  return orderBy(field, direction);
}

export function buildLimit(value) {
  return limit(value);
}

export function createBatch() {
  return writeBatch(dbAudit);
}
