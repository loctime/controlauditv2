// src/services/auditoriaService.js
import { 
  collection, 
  doc, 
  getDocs, 
  updateDoc, 
  getDoc, 
  query, 
  where 
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { registrarAccionSistema } from '../utils/firestoreUtils';

export const auditoriaService = {
  // Obtener auditorías del usuario (multi-tenant)
  async getUserAuditorias(userId, role) {
    try {
      const auditoriasRef = collection(db, "reportes");
      let snapshot;
      
      if (role === 'supermax') {
        snapshot = await getDocs(auditoriasRef);
      } else if (role === 'max') {
        // Obtener auditorías propias
        const qPropias = query(auditoriasRef, where("usuarioId", "==", userId));
        const snapshotPropias = await getDocs(qPropias);
        
        // Obtener auditorías de sus operarios
        const usuariosRef = collection(db, "usuarios");
        const qOperarios = query(usuariosRef, where("clienteAdminId", "==", userId));
        const snapshotOperarios = await getDocs(qOperarios);
        const operariosIds = snapshotOperarios.docs.map(doc => doc.id);
        
        let auditoriasOperarios = [];
        if (operariosIds.length > 0) {
          const qAuditoriasOperarios = query(auditoriasRef, where("usuarioId", "in", operariosIds));
          const snapshotAuditoriasOperarios = await getDocs(qAuditoriasOperarios);
          auditoriasOperarios = snapshotAuditoriasOperarios.docs;
        }
        
        const todasLasAuditorias = [...snapshotPropias.docs, ...auditoriasOperarios];
        snapshot = { docs: todasLasAuditorias };
      } else {
        const q = query(auditoriasRef, where("usuarioId", "==", userId));
        snapshot = await getDocs(q);
      }
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error("Error al obtener auditorías del usuario:", error);
      return [];
    }
  },

  // Obtener auditorías compartidas
  async getAuditoriasCompartidas(userId) {
    try {
      const auditoriasRef = collection(db, "reportes");
      const q = query(auditoriasRef, where("compartidoCon", "array-contains", userId));
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error("Error al obtener auditorías compartidas:", error);
      return [];
    }
  },

  // Compartir auditoría
  async compartirAuditoria(auditoriaId, emailUsuario, user) {
    try {
      // Buscar usuario por email
      const usuariosRef = collection(db, "usuarios");
      const q = query(usuariosRef, where("email", "==", emailUsuario));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        throw new Error("Usuario no encontrado");
      }
      
      const usuarioDoc = snapshot.docs[0];
      const usuarioId = usuarioDoc.id;
      
      // Actualizar auditoría para compartir
      const auditoriaRef = doc(db, "reportes", auditoriaId);
      const auditoriaSnap = await getDoc(auditoriaRef);
      
      if (auditoriaSnap.exists()) {
        const auditoriaData = auditoriaSnap.data();
        const compartidoCon = auditoriaData.compartidoCon || [];
        
        if (!compartidoCon.includes(usuarioId)) {
          await updateDoc(auditoriaRef, {
            compartidoCon: [...compartidoCon, usuarioId]
          });
          
          await registrarAccionSistema(
            user.uid,
            `Compartir auditoría con: ${emailUsuario}`,
            { emailUsuario, usuarioId, auditoriaId },
            'editar',
            'auditoria',
            auditoriaId
          );
        }
      }
      
      return true;
    } catch (error) {
      console.error("Error al compartir auditoría:", error);
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
