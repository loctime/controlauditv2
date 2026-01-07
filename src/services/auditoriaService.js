// src/services/auditoriaService.js
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  query, 
  where,
  limit
} from 'firebase/firestore';
import { dbAudit } from '../firebaseControlFile';
import { registrarAccionSistema } from '../utils/firestoreUtils';
import { updateDocWithAppId } from '../firebase/firestoreAppWriter';
import { firestoreRoutesCore } from '../core/firestore/firestoreRoutes.core';

export const auditoriaService = {
  // Obtener auditorías del owner (owner-centric)
  // CRÍTICO: Las auditorías se leen desde el OWNER (ownerId del token), NO desde el uid del usuario logueado
  // Admin: ownerId === uid (su propio uid)
  // Operario: ownerId viene de request.auth.token.ownerId (NO su propio uid)
  async getUserAuditorias(userId, role, userProfile = null) {
    try {
      if (!userProfile || !userProfile.ownerId) {
        console.error('[auditoriaService] getUserAuditorias: userProfile.ownerId es requerido');
        return [];
      }

      const ownerId = userProfile.ownerId; // ownerId viene del token, no del uid

      console.log('[AUDIT PATH] getUserAuditorias - ownerId usado:', ownerId, '| Role:', role, '| userId:', userId);

      // Leer desde owner-centric: apps/auditoria/owners/{ownerId}/reportes
      const reportesRef = collection(dbAudit, ...firestoreRoutesCore.reportes(ownerId));
      console.log('[AUDIT PATH] Leyendo desde:', `apps/auditoria/owners/${ownerId}/reportes`);
      
      const q = query(reportesRef, limit(500));
      const snapshotResult = await getDocs(q);
      console.log('[AUDIT PATH] Resultado principal:', snapshotResult.size, 'documentos');
      
      return snapshotResult.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error("[auditoriaService] Error al obtener auditorías del owner:", error);
      return [];
    }
  },

  // Obtener auditorías compartidas del owner
  async getAuditoriasCompartidas(userId, userProfile = null) {
    try {
      if (!userProfile || !userProfile.ownerId) {
        console.error('[auditoriaService] getAuditoriasCompartidas: userProfile.ownerId es requerido');
        return [];
      }

      const ownerId = userProfile.ownerId; // ownerId viene del token

      console.log('[auditoriaService] getAuditoriasCompartidas - Inicio query:', {
        ownerId,
        userId,
        filtros: 'compartidoCon array-contains userId, límite 200'
      });

      // Leer desde owner-centric y filtrar por compartidoCon
      const reportesRef = collection(dbAudit, ...firestoreRoutesCore.reportes(ownerId));
      const q = query(reportesRef, where("compartidoCon", "array-contains", userId), limit(200));
      const snapshot = await getDocs(q);
      
      console.log('[auditoriaService] getAuditoriasCompartidas - resultado:', snapshot.size, 'documentos');
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error("[auditoriaService] Error al obtener auditorías compartidas:", error);
      return [];
    }
  },

  // Compartir auditoría del owner
  async compartirAuditoria(auditoriaId, emailUsuario, user, userProfile = null) {
    try {
      if (!userProfile || !userProfile.ownerId) {
        throw new Error("userProfile.ownerId es requerido para compartir auditoría");
      }

      const ownerId = userProfile.ownerId; // ownerId viene del token

      console.log('[auditoriaService] compartirAuditoria - Inicio:', {
        ownerId,
        auditoriaId,
        emailUsuario,
        filtros: 'buscar usuario por email en owner-centric, actualizar compartidoCon'
      });

      // Buscar usuario por email en owner-centric
      const usuariosRef = collection(dbAudit, ...firestoreRoutesCore.usuarios(ownerId));
      const q = query(usuariosRef, where("email", "==", emailUsuario));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        throw new Error("Usuario no encontrado en el owner");
      }
      
      const usuarioDoc = snapshot.docs[0];
      const usuarioId = usuarioDoc.id;
      console.log('[auditoriaService] compartirAuditoria - usuario encontrado:', usuarioId);
      
      // Actualizar auditoría en owner-centric
      const reportesRef = collection(dbAudit, ...firestoreRoutesCore.reportes(ownerId));
      const auditoriaRef = doc(reportesRef, auditoriaId);
      const auditoriaSnap = await getDoc(auditoriaRef);
      
      if (auditoriaSnap.exists()) {
        const auditoriaData = auditoriaSnap.data();
        const compartidoCon = auditoriaData.compartidoCon || [];
        
        if (!compartidoCon.includes(usuarioId)) {
          await updateDocWithAppId(auditoriaRef, {
            compartidoCon: [...compartidoCon, usuarioId]
          });
          
          console.log('[auditoriaService] compartirAuditoria - auditoría actualizada exitosamente');
          
          await registrarAccionSistema(
            user.uid,
            `Compartir auditoría con: ${emailUsuario}`,
            { emailUsuario, usuarioId, auditoriaId },
            'editar',
            'auditoria',
            auditoriaId
          );
        } else {
          console.log('[auditoriaService] compartirAuditoria - usuario ya está en compartidoCon');
        }
      } else {
        throw new Error("Auditoría no encontrada");
      }
      
      return true;
    } catch (error) {
      console.error("[auditoriaService] Error al compartir auditoría:", error);
      throw error;
    }
  },

  // Verificar si el usuario puede ver una auditoría
  // Los permisos se validan por Firestore rules basados en ownerId del token
  canViewAuditoria(auditoriaId, userProfile, auditoriasCompartidas) {
    if (!userProfile) return false;
    
    // Admin puede ver todas las auditorías de su owner
    if (userProfile.role === 'admin') {
      return true;
    }
    
    // Operario puede ver auditorías compartidas o todas las del owner (validado por Firestore rules)
    if (userProfile.role === 'operario') {
      // Si está en compartidoCon, puede verla
      if (auditoriasCompartidas.some(aud => aud.id === auditoriaId)) {
        return true;
      }
      // Firestore rules validan acceso basado en ownerId del token
      return true;
    }
    
    return false;
  }
};
