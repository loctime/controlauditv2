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
  serverTimestamp,
  deleteField
} from 'firebase/firestore';
import { db, auth } from '../../firebaseControlFile';
import { firestoreRoutesCore } from '../firestore/firestoreRoutes.core';
import { User } from '../models/User';
import { getEmpresas } from './ownerEmpresaService';
import { updateDocWithAppId, setDocWithAppId } from '../../firebase/firestoreAppWriter';

/**
 * ✅ Valida que los IDs de empresas existan realmente en owner-centric
 * 
 * Consulta apps/auditoria/owners/{ownerId}/empresas y retorna solo IDs válidos.
 * Usa exclusivamente doc.id, nunca data.id.
 * 
 * @param ownerId - ID del owner
 * @param empresaIds - Array de IDs de empresas a validar
 * @returns Array de IDs válidos (solo los que existen como documentos)
 */
export async function validateEmpresasAsignadas(
  ownerId: string,
  empresaIds: string[]
): Promise<string[]> {
  if (!ownerId) {
    throw new Error('ownerId es requerido');
  }
  if (!Array.isArray(empresaIds) || empresaIds.length === 0) {
    return [];
  }

  try {
    // Obtener todas las empresas del owner desde owner-centric
    const empresas = await getEmpresas(ownerId);
    
    // Crear Set de IDs válidos usando doc.id (nunca data.id)
    const empresasValidasSet = new Set(empresas.map(emp => emp.id));
    
    // Filtrar solo IDs que existen realmente
    const empresasValidas = empresaIds.filter(empresaId => empresasValidasSet.has(empresaId));
    
    // Detectar IDs inválidos
    const empresasInvalidas = empresaIds.filter(empresaId => !empresasValidasSet.has(empresaId));
    
    if (empresasInvalidas.length > 0) {
      console.warn(`[validateEmpresasAsignadas] ⚠️ IDs de empresas inválidos detectados:`, empresasInvalidas);
      console.warn(`[validateEmpresasAsignadas] IDs válidos encontrados: ${empresasValidas.length} de ${empresaIds.length}`);
      console.warn(`[validateEmpresasAsignadas] ownerId: ${ownerId}`);
    }
    
    return empresasValidas;
  } catch (error: any) {
    console.error('[validateEmpresasAsignadas] ❌ Error al validar empresas:', error);
    // En caso de error, retornar array vacío para evitar asignar empresas inválidas
    return [];
  }
}

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

  // Asegurar que ownerId sea igual a auth.currentUser.uid (requerido por las rules)
  const currentUserUid = auth.currentUser?.uid;
  if (!currentUserUid) {
    throw new Error('Usuario no autenticado');
  }
  if (ownerId !== currentUserUid) {
    throw new Error('ownerId debe ser igual al usuario autenticado');
  }

  // ✅ Validar empresas asignadas antes de crear usuario
  let empresasAsignadasValidadas: string[] = [];
  if (userData.empresasAsignadas && userData.empresasAsignadas.length > 0) {
    empresasAsignadasValidadas = await validateEmpresasAsignadas(currentUserUid, userData.empresasAsignadas);
    if (empresasAsignadasValidadas.length !== userData.empresasAsignadas.length) {
      console.warn(`[Firestore][${methodName}] ⚠️ Algunas empresas asignadas fueron filtradas. Originales: ${userData.empresasAsignadas.length}, Válidas: ${empresasAsignadasValidadas.length}`);
    }
  }

  const user: User = {
    id: userData.id,
    ownerId: currentUserUid, // Usar el uid del usuario autenticado
    role: userData.role,
    empresasAsignadas: empresasAsignadasValidadas,
    activo: userData.activo !== undefined ? userData.activo : true,
    createdAt: new Date()
  };

  try {
    // ✅ CRÍTICO PARA OPERARIOS: Asegurar documento legacy COMPLETO ANTES de crear owner-centric
    if (userData.role === 'operario') {
      const legacyUserRef = doc(db, 'apps', 'auditoria', 'users', userData.id);
      
      // Verificar si el documento legacy existe
      const legacySnapshot = await getDoc(legacyUserRef);
      
      if (legacySnapshot.exists()) {
        // Documento existe: actualizar con ownerId y clienteAdminId (ambos iguales)
        const legacyData = legacySnapshot.data();
        const legacyOwnerId = legacyData.ownerId || legacyData.clienteAdminId;
        
        // Si no tiene ownerId o es diferente, actualizar
        if (!legacyOwnerId || legacyOwnerId !== currentUserUid) {
          await updateDocWithAppId(legacyUserRef, {
            ownerId: currentUserUid,
            clienteAdminId: currentUserUid,
            role: 'operario',
            appId: 'auditoria',
            status: 'active'
          });
          console.log(`[Firestore][${methodName}] ✅ Documento legacy actualizado con ownerId para operario`);
          
          // Verificar que la actualización fue exitosa
          const verifySnapshot = await getDoc(legacyUserRef);
          if (!verifySnapshot.exists() || !verifySnapshot.data().ownerId) {
            throw new Error('No se pudo confirmar la actualización del documento legacy');
          }
        }
      } else {
        // Documento NO existe: crearlo COMPLETO antes de continuar
        await setDocWithAppId(legacyUserRef, {
          uid: userData.id,
          ownerId: currentUserUid,
          clienteAdminId: currentUserUid, // ✅ IGUAL a ownerId
          role: 'operario',
          appId: 'auditoria',
          status: 'active',
          createdAt: serverTimestamp()
        });
        console.log(`[Firestore][${methodName}] ✅ Documento legacy creado con ownerId para operario`);
        
        // Verificar que la creación fue exitosa
        const verifySnapshot = await getDoc(legacyUserRef);
        if (!verifySnapshot.exists() || !verifySnapshot.data().ownerId) {
          throw new Error('No se pudo confirmar la creación del documento legacy');
        }
      }
      
      console.log(`[Firestore][${methodName}] ✅ Documento legacy confirmado correctamente antes de crear owner-centric`);
    }
    
    // ✅ SOLO DESPUÉS de confirmar legacy correcto: crear documento owner-centric
    // ✅ CRÍTICO: Escribir SOLO los campos mínimos permitidos por las reglas
    await setDoc(userRef, {
      ownerId: currentUserUid,
      appId: 'auditoria',
      role: userData.role,
      empresasAsignadas: empresasAsignadasValidadas
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
 * Asigna empresas a un usuario (actualización bidireccional)
 * 
 * Actualiza tanto el documento del usuario (empresasAsignadas) como
 * los documentos de las empresas (operarios[userId]).
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

  // ✅ Validar empresas asignadas antes de actualizar
  const empresasAsignadasValidadas = await validateEmpresasAsignadas(ownerId, empresaIds);
  
  if (empresasAsignadasValidadas.length !== empresaIds.length) {
    console.warn(`[Firestore][${methodName}] ⚠️ Algunas empresas asignadas fueron filtradas. Originales: ${empresaIds.length}, Válidas: ${empresasAsignadasValidadas.length}`);
    console.warn(`[Firestore][${methodName}] IDs inválidos filtrados:`, empresaIds.filter(id => !empresasAsignadasValidadas.includes(id)));
  }

  const userRef = doc(db, ...path);

  try {
    // 1) Leer el estado actual del usuario (empresasAsignadas previas)
    const userSnapshot = await getDoc(userRef);
    const empresasPrevias: string[] = userSnapshot.exists() 
      ? (userSnapshot.data().empresasAsignadas || [])
      : [];

    // 2) Calcular diferencias: empresas agregadas y empresas quitadas
    const empresasPreviasSet = new Set(empresasPrevias);
    const empresasNuevasSet = new Set(empresasAsignadasValidadas);
    
    const empresasAgregadas = empresasAsignadasValidadas.filter(
      id => !empresasPreviasSet.has(id)
    );
    const empresasQuitadas = empresasPrevias.filter(
      id => !empresasNuevasSet.has(id)
    );

    console.log(`[Firestore][${methodName}] Empresas previas: ${empresasPrevias.length}`);
    console.log(`[Firestore][${methodName}] Empresas nuevas: ${empresasAsignadasValidadas.length}`);
    console.log(`[Firestore][${methodName}] Empresas agregadas: ${empresasAgregadas.length}`);
    console.log(`[Firestore][${methodName}] Empresas quitadas: ${empresasQuitadas.length}`);

    // 3) Actualizar documentos de empresas agregadas: operarios[userId] = true
    const updatesEmpresasAgregadas = empresasAgregadas.map(empresaId => {
      const empresaRef = doc(db, ...firestoreRoutesCore.empresa(ownerId, empresaId));
      return updateDoc(empresaRef, {
        [`operarios.${userId}`]: true
      });
    });

    // 4) Actualizar documentos de empresas quitadas: eliminar operarios[userId]
    const updatesEmpresasQuitadas = empresasQuitadas.map(empresaId => {
      const empresaRef = doc(db, ...firestoreRoutesCore.empresa(ownerId, empresaId));
      return updateDoc(empresaRef, {
        [`operarios.${userId}`]: deleteField()
      });
    });

    // 5) Ejecutar todas las actualizaciones en paralelo
    await Promise.all([
      // Actualizar documento del usuario (empresasAsignadas)
      updateDoc(userRef, {
        empresasAsignadas: empresasAsignadasValidadas
      }),
      // Actualizar documentos de empresas
      ...updatesEmpresasAgregadas,
      ...updatesEmpresasQuitadas
    ]);

    console.log(`[Firestore][${methodName}] ✅ Operación exitosa`);
    console.log(`[Firestore][${methodName}] Path: ${pathString}`);
    console.log(`[Firestore][${methodName}] Usuario actualizado: ${pathString}`);
    console.log(`[Firestore][${methodName}] Empresas actualizadas: ${updatesEmpresasAgregadas.length + updatesEmpresasQuitadas.length}`);
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
 * Helper: Obtiene usuarios legacy desde apps/auditoria/users
 * Lectura temporal por migración
 */
async function getLegacyUsers(): Promise<any[]> {
  const methodName = 'getLegacyUsers';
  const pathString = 'apps/auditoria/users';
  const currentUid = auth.currentUser?.uid || 'not-authenticated';

  console.log(`[Firestore][${methodName}] Iniciando operación`);
  console.log(`[Firestore][${methodName}] Path: ${pathString}`);
  console.log(`[Firestore][${methodName}] uid: ${currentUid}`);

  try {
    const usuariosRef = collection(db, 'apps', 'auditoria', 'users');
    const snapshot = await getDocs(usuariosRef);
    
    console.log(`[Firestore][${methodName}] ✅ Operación exitosa`);
    console.log(`[Firestore][${methodName}] Documentos legacy encontrados: ${snapshot.docs.length}`);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        uid: data.uid || doc.id,
        email: data.email,
        displayName: data.displayName,
        role: data.role,
        clienteAdminId: data.clienteAdminId,
        permisos: data.permisos || {},
        createdAt: data.createdAt,
        legacy: true // Marcar como legacy
      };
    });
  } catch (error: any) {
    // Si hay error de permisos, retornar array vacío (lectura temporal)
    if (error.code === 'permission-denied') {
      console.log(`[Firestore][${methodName}] ⚠️ Permission denied (esperado para usuarios legacy)`);
      return [];
    }
    
    console.error(`[Firestore][${methodName}] ❌ ERROR`);
    console.error(`[Firestore][${methodName}] error.code: ${error.code || 'unknown'}`);
    console.error(`[Firestore][${methodName}] error.message: ${error.message || 'unknown'}`);
    throw error;
  }
}

/**
 * Helper: Obtiene usuarios owner-centric desde apps/auditoria/owners/{ownerId}/usuarios
 */
async function getOwnerCentricUsers(ownerId: string): Promise<any[]> {
  const methodName = 'getOwnerCentricUsers';
  const path = firestoreRoutesCore.usuarios(ownerId);
  const pathString = path.join('/');
  const currentUid = auth.currentUser?.uid || 'not-authenticated';

  console.log(`[Firestore][${methodName}] Iniciando operación`);
  console.log(`[Firestore][${methodName}] Path: ${pathString}`);
  console.log(`[Firestore][${methodName}] ownerId: ${ownerId}`);
  console.log(`[Firestore][${methodName}] uid: ${currentUid}`);

  if (!ownerId) {
    throw new Error('ownerId es requerido');
  }

  try {
    const usuariosRef = collection(db, ...path);
    const snapshot = await getDocs(usuariosRef);
    
    console.log(`[Firestore][${methodName}] ✅ Operación exitosa`);
    console.log(`[Firestore][${methodName}] Documentos owner-centric encontrados: ${snapshot.docs.length}`);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ownerId: data.ownerId,
        role: data.role,
        empresasAsignadas: data.empresasAsignadas || [],
        activo: data.activo !== undefined ? data.activo : true,
        createdAt: data.createdAt,
        legacy: false // No es legacy
      };
    });
  } catch (error: any) {
    console.error(`[Firestore][${methodName}] ❌ ERROR`);
    console.error(`[Firestore][${methodName}] error.code: ${error.code || 'unknown'}`);
    console.error(`[Firestore][${methodName}] error.message: ${error.message || 'unknown'}`);
    throw error;
  }
}

/**
 * Obtiene todos los usuarios del owner (combina legacy y owner-centric)
 * 
 * Migración temporal: Lee usuarios de ambas fuentes y los combina:
 * - Legacy: apps/auditoria/users (solo lectura)
 * - Owner-centric: apps/auditoria/owners/{ownerId}/usuarios (lectura/escritura)
 * 
 * Evita duplicados usando uid/id como clave única.
 * Los usuarios legacy se marcan con legacy: true y son solo lectura.
 */
export async function getUsers(ownerId: string): Promise<User[]> {
  const methodName = 'getUsers';
  const currentUid = auth.currentUser?.uid || 'not-authenticated';

  console.log(`[Firestore][${methodName}] Iniciando operación (migración)`);
  console.log(`[Firestore][${methodName}] ownerId: ${ownerId}`);
  console.log(`[Firestore][${methodName}] uid: ${currentUid}`);

  if (!ownerId) {
    throw new Error('ownerId es requerido');
  }

  try {
    // Leer usuarios de ambas fuentes en paralelo
    const [legacyUsers, ownerCentricUsers] = await Promise.all([
      getLegacyUsers(),
      getOwnerCentricUsers(ownerId)
    ]);

    console.log(`[Firestore][${methodName}] Legacy: ${legacyUsers.length}, Owner-centric: ${ownerCentricUsers.length}`);

    // Crear mapa para evitar duplicados (usar uid/id como clave)
    const usersMap = new Map<string, any>();

    // Primero agregar usuarios owner-centric (tienen prioridad)
    ownerCentricUsers.forEach(user => {
      usersMap.set(user.id, {
        id: user.id,
        ownerId: user.ownerId,
        role: user.role,
        empresasAsignadas: user.empresasAsignadas || [],
        activo: user.activo !== undefined ? user.activo : true,
        createdAt: user.createdAt?.toDate ? user.createdAt.toDate() : (user.createdAt || new Date()),
        legacy: false
      });
    });

    // Luego agregar usuarios legacy solo si no existen en owner-centric
    legacyUsers.forEach(user => {
      const uid = user.uid || user.id;
      if (!usersMap.has(uid)) {
        // Mapear estructura legacy a estructura común
        usersMap.set(uid, {
          id: uid,
          ownerId: user.clienteAdminId || ownerId, // Usar clienteAdminId si existe, sino ownerId
          role: user.role === 'max' || user.role === 'supermax' ? 'admin' : (user.role || 'operario'),
          empresasAsignadas: [], // Legacy no tiene empresasAsignadas
          activo: true, // Asumir activo si no está definido
          createdAt: user.createdAt?.toDate ? user.createdAt.toDate() : (user.createdAt || new Date()),
          legacy: true,
          // Campos adicionales para compatibilidad con UI legacy
          email: user.email,
          displayName: user.displayName,
          permisos: user.permisos || {}
        });
      }
    });

    const combinedUsers = Array.from(usersMap.values());
    console.log(`[Firestore][${methodName}] ✅ Operación exitosa`);
    console.log(`[Firestore][${methodName}] Total usuarios combinados: ${combinedUsers.length}`);
    console.log(`[Firestore][${methodName}] Legacy: ${combinedUsers.filter(u => u.legacy).length}, Owner-centric: ${combinedUsers.filter(u => !u.legacy).length}`);

    return combinedUsers as User[];
  } catch (error: any) {
    console.group('[Firestore ERROR]');
    console.error('code:', error.code);
    console.error('message:', error.message);
    console.error('stack:', error.stack);
    console.groupEnd();
    
    console.error(`[Firestore][${methodName}] ❌ ERROR`);
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
