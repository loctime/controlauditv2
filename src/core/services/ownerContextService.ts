/**
 * Servicio de resolución de contexto del usuario autenticado
 * 
 * Responsabilidad: Resolver el contexto efectivo del usuario autenticado
 * basado en el modelo owner-centric.
 * 
 * Este servicio determina:
 * - Qué owner controla al usuario
 * - Qué empresas puede ver el usuario
 * - Qué rol tiene el usuario
 */

import { User as FirebaseUser } from 'firebase/auth';
import {
  collectionGroup,
  getDocs
} from 'firebase/firestore';
import { db } from '../../firebaseControlFile';
import { getEmpresas } from './ownerEmpresaService';
import { User } from '../models/User';

/**
 * Contexto efectivo del usuario autenticado
 */
export interface UserContext {
  ownerId: string;
  userId: string;
  role: 'admin' | 'operario';
  empresasPermitidas: string[];
}

/**
 * Resuelve el contexto del usuario autenticado
 * 
 * Lógica:
 * 1. Busca el usuario en todas las colecciones "usuarios" de todos los owners usando collectionGroup
 * 2. Si existe, retorna su contexto con empresas asignadas
 * 3. Si no existe, retorna null (usuario no está en el nuevo modelo)
 * 
 * @param authUser - Usuario autenticado de Firebase Auth
 * @returns Contexto del usuario o null si no existe en el modelo owner-centric
 */
export async function resolveUserContext(
  authUser: FirebaseUser
): Promise<UserContext | null> {
  if (!authUser || !authUser.uid) {
    return null;
  }

  const userId = authUser.uid;

  // Buscar el usuario en todas las colecciones "usuarios" de todos los owners
  // Usa collectionGroup para buscar en apps/auditoria/owners/*/usuarios
  const usuariosCollectionGroup = collectionGroup(db, 'usuarios');
  const snapshot = await getDocs(usuariosCollectionGroup);

  // Filtrar por ID del documento
  const userDoc = snapshot.docs.find(doc => doc.id === userId);

  if (!userDoc) {
    return null;
  }

  const userData = userDoc.data();

  // Extraer ownerId del path del documento
  // Path: apps/auditoria/owners/{ownerId}/usuarios/{userId}
  const pathParts = userDoc.ref.path.split('/');
  const ownerIndex = pathParts.indexOf('owners');
  if (ownerIndex === -1 || ownerIndex + 1 >= pathParts.length) {
    return null;
  }
  const ownerId = pathParts[ownerIndex + 1];

  const user: User = {
    id: userDoc.id,
    ownerId,
    role: userData.role,
    empresasAsignadas: userData.empresasAsignadas || [],
    activo: userData.activo !== undefined ? userData.activo : true,
    createdAt: userData.createdAt?.toDate() || new Date()
  };

  if (!user.activo) {
    return null;
  }

  // Verificar que las empresas asignadas existan y estén activas
  const todasLasEmpresas = await getEmpresas(ownerId);
  const empresasActivas = todasLasEmpresas
    .filter(emp => emp.activa)
    .map(emp => emp.id);

  const empresasPermitidas = user.empresasAsignadas.filter(
    empresaId => empresasActivas.includes(empresaId)
  );

  return {
    ownerId: user.ownerId,
    userId: user.id,
    role: user.role,
    empresasPermitidas
  };
}
