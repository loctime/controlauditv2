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
import { dbAudit, auditUserCollection, auditUsersCollection } from '../firebaseControlFile';
import { registrarAccionSistema } from '../utils/firestoreUtils';
import { updateDocWithAppId } from '../firebase/firestoreAppWriter';

export const auditoriaService = {
  // Obtener auditorías del usuario (multi-tenant)
  async getUserAuditorias(userId, role, userProfile = null) {
    try {
      if (!userProfile || !userProfile.uid) {
        console.error('[auditoriaService] getUserAuditorias: userProfile.uid es requerido');
        return [];
      }

      const uid = userProfile.uid;

      console.log('[AUDIT PATH] getUserAuditorias - UID usado:', uid, '| Role:', role);

      // Leer directo desde auditUserCollection(uid, 'reportes') - contexto multi-tenant
      const auditoriasRef = auditUserCollection(uid, 'reportes');
      console.log('[AUDIT PATH] Leyendo desde:', `apps/auditoria/users/${uid}/reportes`);
      
      const q = query(auditoriasRef, limit(500));
      const snapshotResult = await getDocs(q);
      console.log('[AUDIT PATH] Resultado principal:', snapshotResult.size, 'documentos');
      
      return snapshotResult.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error("[auditoriaService] Error al obtener auditorías del usuario:", error);
      return [];
    }
  },

  // Obtener auditorías compartidas
  async getAuditoriasCompartidas(userId, userProfile = null) {
    try {
      if (!userProfile || !userProfile.uid) {
        console.error('[auditoriaService] getAuditoriasCompartidas: userProfile.uid es requerido');
        return [];
      }

      const uid = userProfile.uid;

      console.log('[auditoriaService] getAuditoriasCompartidas - Inicio query:', {
        uid,
        filtros: 'compartidoCon array-contains userId, límite 200'
      });

      // Leer desde la colección del usuario y filtrar por compartidoCon
      const auditoriasRef = auditUserCollection(uid, 'reportes');
      const q = query(auditoriasRef, where("compartidoCon", "array-contains", userId), limit(200));
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

  // Compartir auditoría
  async compartirAuditoria(auditoriaId, emailUsuario, user, userProfile = null) {
    try {
      if (!userProfile || !userProfile.uid) {
        throw new Error("userProfile.uid es requerido para compartir auditoría");
      }

      const uid = userProfile.uid;

      console.log('[auditoriaService] compartirAuditoria - Inicio:', {
        uid,
        auditoriaId,
        emailUsuario,
        filtros: 'buscar usuario por email, actualizar compartidoCon'
      });

      // Buscar usuario por email
      const usuariosRef = auditUsersCollection();
      const q = query(usuariosRef, where("email", "==", emailUsuario));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        throw new Error("Usuario no encontrado");
      }
      
      const usuarioDoc = snapshot.docs[0];
      const usuarioId = usuarioDoc.id;
      console.log('[auditoriaService] compartirAuditoria - usuario encontrado:', usuarioId);
      
      // Actualizar auditoría para compartir desde la colección del usuario
      const auditoriasRef = auditUserCollection(uid, 'reportes');
      const auditoriaRef = doc(auditoriasRef, auditoriaId);
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
  canViewAuditoria(auditoriaId, userProfile, auditoriasCompartidas) {
    if (!userProfile) return false;
    
    if (userProfile.role === 'supermax') {
      return true;
    }
    
    if (userProfile.role === 'max') {
      if (userProfile.auditorias && userProfile.auditorias.includes(auditoriaId)) {
        return true;
      }
      return true; // Por ahora permitimos acceso a todas las auditorías
    }
    
    if (userProfile.role === 'operario') {
      if (userProfile.auditorias && userProfile.auditorias.includes(auditoriaId)) {
        return true;
      }
      
      if (auditoriasCompartidas.some(aud => aud.id === auditoriaId)) {
        return true;
      }
      
      return true; // Por ahora permitimos acceso a todas las auditorías
    }
    
    return false;
  }
};
