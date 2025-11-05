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
  async getUserAuditorias(userId, role, userProfile = null) {
    try {
      const auditoriasRef = collection(db, "reportes");
      let oldUid = userProfile?.migratedFromUid;
      
      // Si no hay migratedFromUid, buscar por email para encontrar datos antiguos
      if (!oldUid && userProfile?.email) {
        console.log('[auditoriaService] No hay migratedFromUid, buscando por email:', userProfile.email);
        const usuariosRef = collection(db, 'usuarios');
        const emailQuery = query(usuariosRef, where('email', '==', userProfile.email));
        const emailSnapshot = await getDocs(emailQuery);
        
        if (!emailSnapshot.empty) {
          const usuariosConEmail = emailSnapshot.docs.filter(doc => doc.id !== userId);
          if (usuariosConEmail.length > 0) {
            oldUid = usuariosConEmail[0].id;
            console.log('[auditoriaService] ⚠️ Encontrado usuario antiguo por email:', oldUid);
          }
        }
      }
      
      let snapshot;
      
      if (role === 'supermax') {
        snapshot = await getDocs(auditoriasRef);
      } else if (role === 'max') {
        // Buscar auditorías propias con ambos UIDs
        const queriesPropias = [
          query(auditoriasRef, where("usuarioId", "==", userId)),
          query(auditoriasRef, where("creadoPor", "==", userId))
        ];
        
        if (oldUid) {
          queriesPropias.push(
            query(auditoriasRef, where("usuarioId", "==", oldUid)),
            query(auditoriasRef, where("creadoPor", "==", oldUid)),
            query(auditoriasRef, where("clienteAdminId", "==", oldUid))
          );
        }
        
        const snapshotsPropias = await Promise.all(queriesPropias.map(q => getDocs(q)));
        const todasPropias = snapshotsPropias.flatMap(s => s.docs);
        
        // Obtener auditorías de sus operarios (con nuevo y antiguo UID)
        const usuariosRef = collection(db, "usuarios");
        const queriesOperarios = [
          query(usuariosRef, where("clienteAdminId", "==", userId))
        ];
        
        if (oldUid) {
          queriesOperarios.push(
            query(usuariosRef, where("clienteAdminId", "==", oldUid))
          );
        }
        
        const snapshotsOperarios = await Promise.all(queriesOperarios.map(q => getDocs(q)));
        const todosOperariosIds = snapshotsOperarios.flatMap(s => s.docs.map(doc => doc.id));
        
        let auditoriasOperarios = [];
        if (todosOperariosIds.length > 0) {
          // Firestore solo permite "in" con hasta 10 elementos
          const chunks = [];
          for (let i = 0; i < todosOperariosIds.length; i += 10) {
            chunks.push(todosOperariosIds.slice(i, i + 10));
          }
          
          const operariosQueries = chunks.map(chunk => 
            query(auditoriasRef, where("usuarioId", "in", chunk))
          );
          const operariosSnapshots = await Promise.all(operariosQueries.map(q => getDocs(q)));
          auditoriasOperarios = operariosSnapshots.flatMap(s => s.docs);
        }
        
        // Combinar y eliminar duplicados
        const todasLasAuditorias = [...todasPropias, ...auditoriasOperarios];
        const uniqueAuditorias = Array.from(
          new Map(todasLasAuditorias.map(doc => [doc.id, doc])).values()
        );
        
        snapshot = { docs: uniqueAuditorias };
      } else {
        // Para operarios, buscar con ambos UIDs
        const queries = [
          query(auditoriasRef, where("usuarioId", "==", userId)),
          query(auditoriasRef, where("creadoPor", "==", userId))
        ];
        
        if (oldUid) {
          queries.push(
            query(auditoriasRef, where("usuarioId", "==", oldUid)),
            query(auditoriasRef, where("creadoPor", "==", oldUid))
          );
        }
        
        const snapshots = await Promise.all(queries.map(q => getDocs(q)));
        const allDocs = snapshots.flatMap(s => s.docs);
        const uniqueDocs = Array.from(
          new Map(allDocs.map(doc => [doc.id, doc])).values()
        );
        snapshot = { docs: uniqueDocs };
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
