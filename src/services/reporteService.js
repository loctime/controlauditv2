import logger from '@/utils/logger';
// src/services/reporteService.js
// Servicio para operaciones de reportes/auditorías
// NOTA: Solo mueve escrituras, no resuelve lógica compleja (offline, autosave, etc.)
import {
  doc, serverTimestamp
} from 'firebase/firestore';
import { dbAudit } from '../firebaseControlFile';
import { firestoreRoutesCore } from '../core/firestore/firestoreRoutes.core';
import { deleteDocWithAppId, updateDocWithAppId } from '../firebase/firestoreAppWriter';

export const reporteService = {
  /**
   * Eliminar reporte (owner-centric)
   * @param {string} userId - ID del owner (viene del token)
   * @param {string} reporteId - ID del reporte
   * @returns {Promise<void>}
   */
  async deleteReporte(userId, reporteId) {
    try {
      if (!userId || !reporteId) throw new Error('userId y reporteId son requeridos');
      
      if (!userId) throw new Error('ownerId es requerido');
      const ownerId = userId; // userId ahora es ownerId
      const reporteRef = doc(dbAudit, ...firestoreRoutesCore.reporte(ownerId, reporteId));
      
      await deleteDocWithAppId(reporteRef);
    } catch (error) {
      logger.error('Error al eliminar reporte:', error);
      throw error;
    }
  },

  /**
   * Marcar auditoría agendada como completada (owner-centric)
   * @param {string} auditoriaId - ID de la auditoría agendada
   * @param {string} ownerId - ID del owner
   * @param {string} [reporteId] - ID del reporte generado (opcional)
   * @returns {Promise<void>}
   */
  async marcarAuditoriaCompletada(auditoriaId, ownerId, reporteId) {
    try {
      if (!auditoriaId) throw new Error('auditoriaId es requerido');
      if (!ownerId) throw new Error('ownerId es requerido');

      const auditoriaRef = doc(dbAudit, ...firestoreRoutesCore.auditoria_agendada(ownerId, auditoriaId));
      const updateData = {
        estado: 'completada',
        fechaCompletada: serverTimestamp()
      };
      if (reporteId) {
        updateData.reporteVinculado = reporteId;
      }
      await updateDocWithAppId(auditoriaRef, updateData);
    } catch (error) {
      logger.error('Error al marcar auditoría como completada:', error);
      throw error;
    }
  }
};








