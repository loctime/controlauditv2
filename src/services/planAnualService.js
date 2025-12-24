// src/services/planAnualService.js
import { 
  doc, 
  getDoc, 
  getDocs,
  query,
  where
} from 'firebase/firestore';
import { Timestamp } from 'firebase/firestore';
import { auditUserCollection } from '../firebaseControlFile';
import { addDocWithAppId, updateDocWithAppId } from '../firebase/firestoreAppWriter';

export const planAnualService = {
  /**
   * Crear plan anual de capacitaciones (multi-tenant)
   * @param {string} userId - UID del usuario
   * @param {Object} planData - Datos del plan anual
   * @returns {Promise<string>} ID del plan creado
   */
  async crearPlanAnual(userId, planData) {
    try {
      if (!userId) throw new Error('userId es requerido');
      
      const planesRef = auditUserCollection(userId, 'planes_capacitaciones_anuales');
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
   * Actualizar plan anual de capacitaciones (multi-tenant)
   * @param {string} userId - UID del usuario
   * @param {string} planId - ID del plan anual
   * @param {Object} updateData - Datos a actualizar
   * @returns {Promise<void>}
   */
  async updatePlanAnual(userId, planId, updateData) {
    try {
      if (!userId || !planId) throw new Error('userId y planId son requeridos');
      
      const planesRef = auditUserCollection(userId, 'planes_capacitaciones_anuales');
      const planRef = doc(planesRef, planId);
      
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
   * Obtener plan anual por ID (multi-tenant)
   * @param {string} userId - UID del usuario
   * @param {string} planId - ID del plan anual
   * @returns {Promise<Object|null>} Datos del plan o null
   */
  async getPlanAnualById(userId, planId) {
    try {
      if (!userId || !planId) return null;
      
      const planesRef = auditUserCollection(userId, 'planes_capacitaciones_anuales');
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
   * Obtener todos los planes anuales del usuario (multi-tenant)
   * @param {string} userId - UID del usuario
   * @returns {Promise<Array>} Lista de planes anuales
   */
  async getAllPlanesAnuales(userId) {
    try {
      if (!userId) return [];
      
      const planesRef = auditUserCollection(userId, 'planes_capacitaciones_anuales');
      const snapshot = await getDocs(planesRef);
      
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error al obtener planes anuales:', error);
      return [];
    }
  }
};


