// src/services/reporteService.js
// Servicio para operaciones de reportes/auditorías
// NOTA: Solo mueve escrituras, no resuelve lógica compleja (offline, autosave, etc.)
import { 
  doc
} from 'firebase/firestore';
import { auditUserCollection, dbAudit } from '../firebaseControlFile';
import { deleteDocWithAppId, updateDocWithAppId } from '../firebase/firestoreAppWriter';

export const reporteService = {
  /**
   * Eliminar reporte (multi-tenant)
   * @param {string} userId - UID del usuario
   * @param {string} reporteId - ID del reporte
   * @returns {Promise<void>}
   */
  async deleteReporte(userId, reporteId) {
    try {
      if (!userId || !reporteId) throw new Error('userId y reporteId son requeridos');
      
      const reportesRef = auditUserCollection(userId, 'reportes');
      const reporteRef = doc(reportesRef, reporteId);
      
      await deleteDocWithAppId(reporteRef);
    } catch (error) {
      console.error('Error al eliminar reporte:', error);
      throw error;
    }
  },

  /**
   * Marcar auditoría agendada como completada (legacy - colección 'auditorias')
   * @param {string} auditoriaId - ID de la auditoría agendada
   * @returns {Promise<void>}
   */
  async marcarAuditoriaCompletada(auditoriaId) {
    try {
      if (!auditoriaId) throw new Error('auditoriaId es requerido');
      
      const auditoriaRef = doc(dbAudit, 'auditorias', auditoriaId);
      await updateDocWithAppId(auditoriaRef, {
        estado: 'completada'
      });
    } catch (error) {
      console.error('Error al marcar auditoría como completada:', error);
      throw error;
    }
  }
};








