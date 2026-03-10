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
  return collection(dbAudit, ...routeBuilder(ownerId));
}

export function getDocumentRef(ownerId, key, id) {
  ensureOwnerId(ownerId);
  const routeBuilder = firestoreRoutesCore[key];
  if (!routeBuilder || typeof routeBuilder !== 'function') {
    throw new Error(`firestoreRoutesCore.${key} is not defined`);
  }
  return doc(dbAudit, ...routeBuilder(ownerId, id));
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
  const ref = getDocumentRef(ownerId, docKey, id);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    return null;
  }
  return { id: snap.id, ...snap.data() };
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
