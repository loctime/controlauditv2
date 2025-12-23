// Optimización de importaciones de Firebase
// Importar solo los servicios necesarios para reducir el tamaño del bundle
//
// NOTA DE MIGRACIÓN: Este archivo no puede migrarse sin contexto adicional.
// - El archivo parece no estar en uso según comentarios internos
// - Usa 'app' que no está definido (comentado)
// - La función firestoreFunctions.collection usa db interno que requiere inicialización
// - Se requiere determinar si este archivo debe eliminarse o migrarse completamente

import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getAnalytics, isSupported } from 'firebase/analytics';

// Configuración de Firebase (importar desde firebaseControlFile para ControlAudit)
// NOTA: Este archivo parece no estar en uso. Si se necesita, usar firebaseControlFile.js
// Por ahora, comentamos la importación ya que este archivo no se usa
// import { firebaseControlFileConfig } from '../firebaseControlFile';

// Inicializar Firebase
// NOTA: Este archivo no se está usando actualmente
// Si se necesita, usar firebaseControlFile.js en su lugar
// const app = initializeApp(firebaseConfig);

// Inicializar servicios solo cuando se necesiten
let auth = null;
let db = null;
let storage = null;
let analytics = null;

// Función para obtener Auth (lazy loading)
export const getFirebaseAuth = () => {
  if (!auth) {
    auth = getAuth(app);
    
    // Conectar al emulador en desarrollo
    if (process.env.NODE_ENV === 'development') {
      try {
        connectAuthEmulator(auth, 'http://localhost:9099');
      } catch (error) {
        console.log('Auth emulator already connected');
      }
    }
  }
  return auth;
};

// Función para obtener Firestore (lazy loading)
export const getFirebaseFirestore = () => {
  if (!db) {
    db = getFirestore(app);
    
    // Conectar al emulador en desarrollo
    if (process.env.NODE_ENV === 'development') {
      try {
        connectFirestoreEmulator(db, 'localhost', 8080);
      } catch (error) {
        console.log('Firestore emulator already connected');
      }
    }
  }
  return db;
};

// Función para obtener Storage (lazy loading)
export const getFirebaseStorage = () => {
  if (!storage) {
    storage = getStorage(app);
    
    // Conectar al emulador en desarrollo
    if (process.env.NODE_ENV === 'development') {
      try {
        connectStorageEmulator(storage, 'localhost', 9199);
      } catch (error) {
        console.log('Storage emulator already connected');
      }
    }
  }
  return storage;
};

// Función para obtener Analytics (lazy loading)
export const getFirebaseAnalytics = async () => {
  if (!analytics) {
    const analyticsSupported = await isSupported();
    if (analyticsSupported) {
      analytics = getAnalytics(app);
    }
  }
  return analytics;
};

// Exportar la app para casos especiales
export { app };

// Exportar funciones de autenticación optimizadas
export const authFunctions = {
  signInWithEmailAndPassword: async (email, password) => {
    const { signInWithEmailAndPassword } = await import('firebase/auth');
    const auth = getFirebaseAuth();
    return signInWithEmailAndPassword(auth, email, password);
  },
  
  createUserWithEmailAndPassword: async (email, password) => {
    const { createUserWithEmailAndPassword } = await import('firebase/auth');
    const auth = getFirebaseAuth();
    return createUserWithEmailAndPassword(auth, email, password);
  },
  
  signOut: async () => {
    const { signOut } = await import('firebase/auth');
    const auth = getFirebaseAuth();
    return signOut(auth);
  },
  
  onAuthStateChanged: (callback) => {
    const { onAuthStateChanged } = require('firebase/auth');
    const auth = getFirebaseAuth();
    return onAuthStateChanged(auth, callback);
  }
};

// Exportar funciones de Firestore optimizadas
export const firestoreFunctions = {
  collection: (path) => {
    const { collection } = require('firebase/firestore');
    const db = getFirebaseFirestore();
    return collection(db, path);
  },
  
  doc: (path) => {
    const { doc } = require('firebase/firestore');
    const db = getFirebaseFirestore();
    return doc(db, path);
  },
  
  getDoc: async (docRef) => {
    const { getDoc } = await import('firebase/firestore');
    return getDoc(docRef);
  },
  
  getDocs: async (query) => {
    const { getDocs } = await import('firebase/firestore');
    return getDocs(query);
  },
  
  addDoc: async (collectionRef, data) => {
    const { addDoc } = await import('firebase/firestore');
    return addDoc(collectionRef, data);
  },
  
  updateDoc: async (docRef, data) => {
    const { updateDoc } = await import('firebase/firestore');
    return updateDoc(docRef, data);
  },
  
  deleteDoc: async (docRef) => {
    const { deleteDoc } = await import('firebase/firestore');
    return deleteDoc(docRef);
  },
  
  query: async (...args) => {
    const { query } = await import('firebase/firestore');
    return query(...args);
  },
  
  where: async (field, op, value) => {
    const { where } = await import('firebase/firestore');
    return where(field, op, value);
  },
  
  orderBy: async (field, direction) => {
    const { orderBy } = await import('firebase/firestore');
    return orderBy(field, direction);
  },
  
  limit: async (limit) => {
    const { limit: limitFn } = await import('firebase/firestore');
    return limitFn(limit);
  }
};

// Exportar funciones de Storage optimizadas
export const storageFunctions = {
  ref: (path) => {
    const { ref } = require('firebase/storage');
    const storage = getFirebaseStorage();
    return ref(storage, path);
  },
  
  uploadBytes: async (storageRef, data) => {
    const { uploadBytes } = await import('firebase/storage');
    return uploadBytes(storageRef, data);
  },
  
  getDownloadURL: async (storageRef) => {
    const { getDownloadURL } = await import('firebase/storage');
    return getDownloadURL(storageRef);
  },
  
  deleteObject: async (storageRef) => {
    const { deleteObject } = await import('firebase/storage');
    return deleteObject(storageRef);
  }
};
