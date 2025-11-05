// Servicio para sincronizar usuarios de Firestore con Firebase Auth
// Auto-crea usuarios en Auth si existen en Firestore usuarios/ pero no en Auth

import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  getAuth 
} from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';

/**
 * Sincroniza un usuario de Firestore con Firebase Auth
 * Si el usuario existe en Firestore pero no en Auth, lo crea automáticamente
 * 
 * @param {string} email - Email del usuario
 * @param {string} password - Contraseña del usuario
 * @returns {Promise<UserCredential>} - Credenciales del usuario autenticado
 */
export const syncUserToAuth = async (email, password) => {
  try {
    // 1. Intentar login normal
    console.log('[authSyncService] Intentando login para:', email);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('[authSyncService] ✅ Login exitoso');
      return userCredential;
    } catch (loginError) {
      // 2. Si falla con "user-not-found", buscar en Firestore
      if (loginError.code === 'auth/user-not-found') {
        console.log('[authSyncService] Usuario no encontrado en Auth, buscando en Firestore...');
        
        // Buscar usuario en Firestore por email
        const usuariosRef = collection(db, 'usuarios');
        const q = query(usuariosRef, where('email', '==', email));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          // Usuario existe en Firestore
          const userDoc = querySnapshot.docs[0];
          const userData = userDoc.data();
          
          console.log('[authSyncService] ✅ Usuario encontrado en Firestore:', userData.email);
          console.log('[authSyncService] Creando usuario en Auth...');
          
          // 3. Crear usuario en Auth
          try {
            const newUserCredential = await createUserWithEmailAndPassword(auth, email, password);
            console.log('[authSyncService] ✅ Usuario creado en Auth:', newUserCredential.user.uid);
            
            // 4. Verificar que el UID del Firestore coincida con el nuevo UID
            // Si no coincide, actualizar el documento en Firestore
            if (userData.uid !== newUserCredential.user.uid) {
              console.warn('[authSyncService] ⚠️ UID diferente detectado. Firestore:', userData.uid, 'Auth:', newUserCredential.user.uid);
              console.warn('[authSyncService] ⚠️ Nota: El documento en Firestore mantendrá su UID original.');
              console.warn('[authSyncService] ⚠️ Considera migrar el documento o usar el nuevo UID.');
            }
            
            // 5. Intentar login nuevamente con el usuario recién creado
            // Esto asegura que el token esté actualizado
            const finalCredential = await signInWithEmailAndPassword(auth, email, password);
            console.log('[authSyncService] ✅ Login exitoso después de crear usuario');
            return finalCredential;
            
          } catch (createError) {
            console.error('[authSyncService] ❌ Error al crear usuario en Auth:', createError);
            
            if (createError.code === 'auth/email-already-in-use') {
              // Email ya existe en Auth (puede ser un problema de sincronización)
              console.log('[authSyncService] Email ya existe en Auth, intentando login nuevamente...');
              try {
                const retryCredential = await signInWithEmailAndPassword(auth, email, password);
                return retryCredential;
              } catch (retryError) {
                throw new Error('Error al autenticar usuario existente: ' + retryError.message);
              }
            }
            
            throw new Error('Error al crear usuario en Auth: ' + createError.message);
          }
        } else {
          // Usuario no existe ni en Auth ni en Firestore
          console.log('[authSyncService] ❌ Usuario no encontrado en Firestore');
          throw new Error('Usuario no encontrado. Verifica tu email y contraseña.');
        }
      } else {
        // Otro error de login (contraseña incorrecta, etc.)
        throw loginError;
      }
    }
  } catch (error) {
    console.error('[authSyncService] ❌ Error en syncUserToAuth:', error);
    throw error;
  }
};

/**
 * Verifica si un usuario existe en Firestore
 * 
 * @param {string} email - Email del usuario
 * @returns {Promise<Object|null>} - Datos del usuario o null si no existe
 */
export const getUserFromFirestore = async (email) => {
  try {
    const usuariosRef = collection(db, 'usuarios');
    const q = query(usuariosRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0];
      return {
        id: userDoc.id,
        ...userDoc.data()
      };
    }
    
    return null;
  } catch (error) {
    console.error('[authSyncService] Error al buscar usuario en Firestore:', error);
    throw error;
  }
};

