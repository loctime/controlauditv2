// src/services/accidenteService.js
import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  query, 
  where,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { registrarAccionSistema } from '../utils/firestoreUtils';

export const accidenteService = {
  /**
   * Obtener accidentes de una empresa
   * @param {string} empresaId - ID de la empresa
   * @returns {Promise<Array>} Lista de accidentes
   */
  async getAccidentesByEmpresa(empresaId) {
    try {
      if (!empresaId) return [];

      // 1. Obtener sucursales de la empresa
      const sucursalesSnapshot = await getDocs(
        query(collection(db, 'sucursales'), where('empresaId', '==', empresaId))
      );
      const sucursalesIds = sucursalesSnapshot.docs.map(doc => doc.id);
      
      if (sucursalesIds.length === 0) return [];

      // 2. Obtener accidentes de esas sucursales
      const accidentesData = [];
      const chunkSize = 10;
      
      for (let i = 0; i < sucursalesIds.length; i += chunkSize) {
        const chunk = sucursalesIds.slice(i, i + chunkSize);
        const accidentesSnapshot = await getDocs(
          query(collection(db, 'accidentes'), where('sucursalId', 'in', chunk))
        );
        
        accidentesSnapshot.docs.forEach(doc => {
          accidentesData.push({
            id: doc.id,
            ...doc.data()
          });
        });
      }
      
      return accidentesData;
    } catch (error) {
      console.error('❌ Error obteniendo accidentes por empresa:', error);
      return [];
    }
  },

  /**
   * Obtener accidentes de una sucursal
   * @param {string} sucursalId - ID de la sucursal
   * @returns {Promise<Array>} Lista de accidentes
   */
  async getAccidentesBySucursal(sucursalId) {
    try {
      if (!sucursalId) return [];

      const snapshot = await getDocs(
        query(collection(db, 'accidentes'), where('sucursalId', '==', sucursalId))
      );
      
      return snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      }));
    } catch (error) {
      console.error('❌ Error obteniendo accidentes por sucursal:', error);
      return [];
    }
  },

  /**
   * Obtener accidentes de múltiples sucursales
   * @param {Array<string>} sucursalesIds - IDs de las sucursales
   * @returns {Promise<Array>} Lista de accidentes
   */
  async getAccidentesBySucursales(sucursalesIds) {
    try {
      if (!sucursalesIds || sucursalesIds.length === 0) return [];

      const accidentesData = [];
      const chunkSize = 10;
      
      for (let i = 0; i < sucursalesIds.length; i += chunkSize) {
        const chunk = sucursalesIds.slice(i, i + chunkSize);
        const snapshot = await getDocs(
          query(collection(db, 'accidentes'), where('sucursalId', 'in', chunk))
        );
        
        snapshot.docs.forEach(doc => {
          accidentesData.push({
            id: doc.id,
            ...doc.data()
          });
        });
      }
      
      return accidentesData;
    } catch (error) {
      console.error('❌ Error obteniendo accidentes por sucursales:', error);
      return [];
    }
  },

  /**
   * Obtener un accidente por ID
   * @param {string} accidenteId - ID del accidente
   * @returns {Promise<Object|null>} Datos del accidente o null
   */
  async getAccidenteById(accidenteId) {
    try {
      const accidenteDoc = await getDoc(doc(db, 'accidentes', accidenteId));
      
      if (accidenteDoc.exists()) {
        return {
          id: accidenteDoc.id,
          ...accidenteDoc.data()
        };
      }
      
      return null;
    } catch (error) {
      console.error('❌ Error obteniendo accidente por ID:', error);
      return null;
    }
  },

  /**
   * Crear un nuevo accidente
   * @param {Object} accidenteData - Datos del accidente
   * @param {Object} user - Usuario que reporta el accidente
   * @returns {Promise<string>} ID del accidente creado
   */
  async crearAccidente(accidenteData, user) {
    try {
      const accidenteRef = await addDoc(collection(db, 'accidentes'), {
        ...accidenteData,
        fechaReporte: Timestamp.now(),
        reportadoPor: user?.uid,
        ultimaModificacion: Timestamp.now(),
        estado: accidenteData.estado || 'abierto'
      });

      // Registrar acción
      await registrarAccionSistema(
        user?.uid,
        'Accidente reportado',
        { accidenteId: accidenteRef.id, tipo: accidenteData.tipo, gravedad: accidenteData.gravedad },
        'create',
        'accidente',
        accidenteRef.id
      );

      return accidenteRef.id;
    } catch (error) {
      console.error('❌ Error creando accidente:', error);
      throw error;
    }
  },

  /**
   * Actualizar un accidente
   * @param {string} accidenteId - ID del accidente
   * @param {Object} updateData - Datos a actualizar
   * @param {Object} user - Usuario que actualiza
   * @returns {Promise<boolean>} True si se actualizó correctamente
   */
  async updateAccidente(accidenteId, updateData, user) {
    try {
      await updateDoc(doc(db, 'accidentes', accidenteId), {
        ...updateData,
        ultimaModificacion: Timestamp.now(),
        modificadoPor: user?.uid
      });

      // Registrar acción
      await registrarAccionSistema(
        user?.uid,
        'Accidente actualizado',
        { accidenteId, cambios: Object.keys(updateData) },
        'update',
        'accidente',
        accidenteId
      );

      return true;
    } catch (error) {
      console.error('❌ Error actualizando accidente:', error);
      throw error;
    }
  },

  /**
   * Cerrar un accidente
   * @param {string} accidenteId - ID del accidente
   * @param {Object} user - Usuario que cierra
   * @param {string} notas - Notas de cierre
   * @returns {Promise<boolean>} True si se cerró correctamente
   */
  async cerrarAccidente(accidenteId, user, notas = '') {
    try {
      await updateDoc(doc(db, 'accidentes', accidenteId), {
        estado: 'cerrado',
        fechaCierre: Timestamp.now(),
        cerradoPor: user?.uid,
        notasCierre: notas,
        ultimaModificacion: Timestamp.now()
      });

      // Registrar acción
      await registrarAccionSistema(
        user?.uid,
        'Accidente cerrado',
        { accidenteId, notas },
        'close',
        'accidente',
        accidenteId
      );

      return true;
    } catch (error) {
      console.error('❌ Error cerrando accidente:', error);
      throw error;
    }
  },

  /**
   * Eliminar un accidente
   * @param {string} accidenteId - ID del accidente
   * @param {Object} user - Usuario que elimina
   * @returns {Promise<boolean>} True si se eliminó correctamente
   */
  async deleteAccidente(accidenteId, user) {
    try {
      await deleteDoc(doc(db, 'accidentes', accidenteId));

      // Registrar acción
      await registrarAccionSistema(
        user?.uid,
        'Accidente eliminado',
        { accidenteId },
        'delete',
        'accidente',
        accidenteId
      );

      return true;
    } catch (error) {
      console.error('❌ Error eliminando accidente:', error);
      throw error;
    }
  },

  /**
   * Obtener estadísticas de accidentes por empresa
   * @param {string} empresaId - ID de la empresa
   * @returns {Promise<Object>} Estadísticas de accidentes
   */
  async getEstadisticasAccidentes(empresaId) {
    try {
      const accidentes = await this.getAccidentesByEmpresa(empresaId);
      
      return {
        total: accidentes.length,
        abiertos: accidentes.filter(a => a.estado === 'abierto').length,
        cerrados: accidentes.filter(a => a.estado === 'cerrado').length,
        porGravedad: {
          leve: accidentes.filter(a => a.gravedad === 'leve').length,
          moderado: accidentes.filter(a => a.gravedad === 'moderado').length,
          grave: accidentes.filter(a => a.gravedad === 'grave').length
        },
        diasPerdidosTotales: accidentes.reduce((sum, a) => sum + (a.diasPerdidos || 0), 0)
      };
    } catch (error) {
      console.error('❌ Error obteniendo estadísticas de accidentes:', error);
      return {
        total: 0,
        abiertos: 0,
        cerrados: 0,
        porGravedad: { leve: 0, moderado: 0, grave: 0 },
        diasPerdidosTotales: 0
      };
    }
  }
};

