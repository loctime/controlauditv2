// Servicio para sincronizar usuarios de Firestore con Firebase Auth
// Auto-crea usuarios en Auth si existen en Firestore usuarios/ pero no en Auth

import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword
} from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '../firebaseAudit';

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
    // Verificar qué proyecto de Auth estamos usando
    const authApp = auth.app;
    const authConfig = authApp.options;
    console.log('[authSyncService] 🔧 Usando Auth del proyecto:', authConfig.projectId);
    
    // 1. Intentar login normal
    console.log('[authSyncService] Intentando login para:', email);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('[authSyncService] ✅ Login exitoso');
      return userCredential;
    } catch (loginError) {
      console.log('[authSyncService] Error en login:', loginError.code, loginError.message);
      
      // 2. Si falla con "user-not-found" o "invalid-credential", buscar en Firestore
      // "invalid-credential" puede ocurrir cuando el usuario no existe en el nuevo Auth
      const shouldCheckFirestore = loginError.code === 'auth/user-not-found' || 
                                   loginError.code === 'auth/invalid-credential';
      
      if (shouldCheckFirestore) {
        console.log('[authSyncService] Usuario no encontrado/encontrado con credenciales inválidas en Auth, buscando en Firestore...');
        
        // Buscar usuario en Firestore por email
        const usuariosRef = collection(db, 'apps', 'audit', 'users');
        const q = query(usuariosRef, where('email', '==', email));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          // Usuario existe en Firestore
          const userDoc = querySnapshot.docs[0];
          const userData = userDoc.data();
          
          console.log('[authSyncService] ✅ Usuario encontrado en Firestore:', userData.email);
          console.log('[authSyncService] 📝 El usuario existe en Firestore pero no en el nuevo Auth.');
          console.log('[authSyncService] 🔄 Creando usuario en Auth del proyecto ControlFile...');
          
          // 3. Crear usuario en Auth (nuevo proyecto)
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
            
            // 5. El usuario ya está autenticado después de createUserWithEmailAndPassword
            // No necesitamos hacer login nuevamente
            console.log('[authSyncService] ✅ Login exitoso después de crear usuario');
            return newUserCredential;
            
          } catch (createError) {
            console.error('[authSyncService] ❌ Error al crear usuario en Auth:', createError);
            
            if (createError.code === 'auth/email-already-in-use') {
              // Email ya existe en Auth (puede ser un problema de sincronización)
              console.log('[authSyncService] Email ya existe en Auth, intentando login nuevamente...');
              try {
                const retryCredential = await signInWithEmailAndPassword(auth, email, password);
                return retryCredential;
              } catch (retryError) {
                // Si sigue fallando, puede ser que la contraseña sea diferente
                console.error('[authSyncService] ❌ Error al autenticar usuario existente:', retryError.code);
                throw new Error('El usuario existe en el nuevo Auth pero la contraseña no coincide. Verifica tu contraseña o solicita un restablecimiento.');
              }
            }
            
            throw new Error('Error al crear usuario en Auth: ' + createError.message);
          }
        } else {
          // Usuario no existe ni en Auth ni en Firestore
          console.log('[authSyncService] ❌ Usuario no encontrado en Firestore');
          
          // Si es invalid-credential y no existe en Firestore, puede ser contraseña incorrecta
          if (loginError.code === 'auth/invalid-credential') {
            throw new Error('Credenciales incorrectas. Verifica tu email y contraseña.');
          }
          
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
    const usuariosRef = collection(db, 'apps', 'audit', 'users');
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

