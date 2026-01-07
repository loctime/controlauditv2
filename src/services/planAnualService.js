// src/services/planAnualService.js
import { 
  doc, 
  getDoc, 
  getDocs,
  query,
  where,
  collection
} from 'firebase/firestore';
import { Timestamp } from 'firebase/firestore';
import { dbAudit } from '../firebaseControlFile';
import { firestoreRoutesCore } from '../core/firestore/firestoreRoutes.core';
import { addDocWithAppId, updateDocWithAppId } from '../firebase/firestoreAppWriter';

export const planAnualService = {
  /**
   * Crear plan anual de capacitaciones (owner-centric)
   * @param {string} userId - ID del owner (viene del token)
   * @param {Object} planData - Datos del plan anual
   * @returns {Promise<string>} ID del plan creado
   */
  async crearPlanAnual(userId, planData) {
    try {
      if (!userId) throw new Error('userId es requerido');
      
      if (!userId) throw new Error('ownerId es requerido');
      const ownerId = userId; // userId ahora es ownerId
      const planesRef = collection(dbAudit, ...firestoreRoutesCore.planesCapacitacionesAnuales(ownerId));
      const docRef = await addDocWithAppId(planesRef, {
        ...planData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      
      return docRef.id;
    } catch (error) {
      console.error('Error al crear plan anual:', error);
      throw error;
    }
  },

  /**
   * Actualizar plan anual de capacitaciones (owner-centric)
   * @param {string} userId - ID del owner (viene del token)
   * @param {string} planId - ID del plan anual
   * @param {Object} updateData - Datos a actualizar
   * @returns {Promise<void>}
   */
  async updatePlanAnual(userId, planId, updateData) {
    try {
      if (!userId || !planId) throw new Error('ownerId y planId son requeridos');
      
      const ownerId = userId; // userId ahora es ownerId
      const planRef = doc(dbAudit, ...firestoreRoutesCore.planCapacitacionesAnual(ownerId, planId));
      
      await updateDocWithAppId(planRef, {
        ...updateData,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error al actualizar plan anual:', error);
      throw error;
    }
  },

  /**
   * Obtener plan anual por ID (owner-centric)
   * @param {string} userId - ID del owner (viene del token)
   * @param {string} planId - ID del plan anual
   * @returns {Promise<Object|null>} Datos del plan o null
   */
  async getPlanAnualById(userId, planId) {
    try {
      if (!userId || !planId) return null;
      
      if (!userId) throw new Error('ownerId es requerido');
      const ownerId = userId; // userId ahora es ownerId
      const planesRef = collection(dbAudit, ...firestoreRoutesCore.planesCapacitacionesAnuales(ownerId));
      const planRef = doc(planesRef, planId);
      const planDoc = await getDoc(planRef);
      
      if (planDoc.exists()) {
        return { id: planDoc.id, ...planDoc.data() };
      }
      
      return null;
    } catch (error) {
      console.error('Error al obtener plan anual:', error);
      return null;
    }
  },

  /**
   * Obtener todos los planes anuales del owner (owner-centric)
   * @param {string} userId - ID del owner (viene del token)
   * @returns {Promise<Array>} Lista de planes anuales
   */
  async getAllPlanesAnuales(userId) {
    try {
      if (!userId) return [];
      
      if (!userId) throw new Error('ownerId es requerido');
      const ownerId = userId; // userId ahora es ownerId
      const planesRef = collection(dbAudit, ...firestoreRoutesCore.planesCapacitacionesAnuales(ownerId));
      const snapshot = await getDocs(planesRef);
      
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error al obtener planes anuales:', error);
      return [];
    }
  }
};








