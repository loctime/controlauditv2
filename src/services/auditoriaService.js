// src/services/auditoriaService.js
import { 
  collection, 
  doc, 
  getDocs, 
  updateDoc, 
  getDoc, 
  query, 
  where,
  limit
} from 'firebase/firestore';
import { db, auditUserCollection } from '../firebaseControlFile';
import { registrarAccionSistema } from '../utils/firestoreUtils';

export const auditoriaService = {
  // Obtener auditorías del usuario (multi-tenant)
  async getUserAuditorias(userId, role, userProfile = null) {
    try {
      if (!userProfile || !userProfile.uid) {
        console.error('[auditoriaService] getUserAuditorias: userProfile.uid es requerido');
        return [];
      }

      const uid = userProfile.uid;
      const empresaId = userProfile.empresaId || null;
      const clienteAdminId = userProfile.clienteAdminId || null;
      const oldUid = userProfile?.migratedFromUid || null;

      console.log('[auditoriaService] getUserAuditorias - Inicio query:', {
        uid,
        empresaId,
        clienteAdminId,
        role,
        oldUid,
        filtros: 'reportes desde apps/auditoria/users/{uid}/reportes'
      });

      // Usar auditUserCollection para leer desde apps/auditoria/users/{uid}/reportes
      const auditoriasRef = auditUserCollection(uid, 'reportes');
      
      let snapshot;
      
      if (role === 'supermax') {
        console.log('[auditoriaService] Query supermax - sin filtros, límite 500');
        const q = query(auditoriasRef, limit(500));
        const snapshotResult = await getDocs(q);
        console.log('[auditoriaService] Query supermax - resultado:', snapshotResult.size, 'documentos');
        snapshot = snapshotResult;
      } else if (role === 'max') {
        console.log('[auditoriaService] Query max - obteniendo todas las auditorías del usuario');
        // Para max, obtener todas las auditorías de su colección personal
        const q = query(auditoriasRef, limit(500));
        const snapshotResult = await getDocs(q);
        console.log('[auditoriaService] Query max - resultado:', snapshotResult.size, 'documentos');
        
        // Si hay oldUid, también buscar en la colección antigua
        if (oldUid) {
          console.log('[auditoriaService] Query max - buscando también en oldUid:', oldUid);
          const auditoriasOldRef = auditUserCollection(oldUid, 'reportes');
          const qOld = query(auditoriasOldRef, limit(500));
          const snapshotOld = await getDocs(qOld);
          console.log('[auditoriaService] Query max oldUid - resultado:', snapshotOld.size, 'documentos');
          
          // Combinar resultados
          const todasLasAuditorias = [...snapshotResult.docs, ...snapshotOld.docs];
          const uniqueAuditorias = Array.from(
            new Map(todasLasAuditorias.map(doc => [doc.id, doc])).values()
          );
          snapshot = { docs: uniqueAuditorias };
          console.log('[auditoriaService] Query max - total combinado:', snapshot.docs.length, 'documentos únicos');
        } else {
          snapshot = snapshotResult;
        }
      } else {
        // Para operarios, obtener sus propias auditorías
        console.log('[auditoriaService] Query operario - obteniendo auditorías del usuario');
        const q = query(auditoriasRef, limit(500));
        const snapshotResult = await getDocs(q);
        console.log('[auditoriaService] Query operario - resultado:', snapshotResult.size, 'documentos');
        
        // Si hay oldUid, también buscar en la colección antigua
        if (oldUid) {
          console.log('[auditoriaService] Query operario - buscando también en oldUid:', oldUid);
          const auditoriasOldRef = auditUserCollection(oldUid, 'reportes');
          const qOld = query(auditoriasOldRef, limit(500));
          const snapshotOld = await getDocs(qOld);
          console.log('[auditoriaService] Query operario oldUid - resultado:', snapshotOld.size, 'documentos');
          
          // Combinar resultados
          const allDocs = [...snapshotResult.docs, ...snapshotOld.docs];
          const uniqueDocs = Array.from(
            new Map(allDocs.map(doc => [doc.id, doc])).values()
          );
          snapshot = { docs: uniqueDocs };
          console.log('[auditoriaService] Query operario - total combinado:', snapshot.docs.length, 'documentos únicos');
        } else {
          snapshot = snapshotResult;
        }
      }
      
      return snapshot.docs.map(doc => ({
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
      const empresaId = userProfile.empresaId || null;
      const clienteAdminId = userProfile.clienteAdminId || null;

      console.log('[auditoriaService] getAuditoriasCompartidas - Inicio query:', {
        uid,
        empresaId,
        clienteAdminId,
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
      const empresaId = userProfile.empresaId || null;
      const clienteAdminId = userProfile.clienteAdminId || null;

      console.log('[auditoriaService] compartirAuditoria - Inicio:', {
        uid,
        empresaId,
        clienteAdminId,
        auditoriaId,
        emailUsuario,
        filtros: 'buscar usuario por email, actualizar compartidoCon'
      });

      // Buscar usuario por email
      const usuariosRef = collection(db, "apps", "audit", "users");
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
          await updateDoc(auditoriaRef, {
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
