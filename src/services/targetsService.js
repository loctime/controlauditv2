// src/services/targetsService.js
import { 
  collection, 
  addDoc, 
  getDocs, 
  getDoc,
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { toast } from 'react-toastify';

/**
 * Servicio para gestión de targets (objetivos) de auditorías
 * Colección: auditorias_targets
 */
export const targetsService = {
  /**
   * Crear un nuevo target
   * @param {Object} targetData - Datos del target
   * @returns {Promise<string>} ID del documento creado
   */
  async createTarget(targetData) {
    try {
      const target = {
        empresaId: targetData.empresaId,
        empresaNombre: targetData.empresaNombre,
        sucursalId: targetData.sucursalId || null,
        sucursalNombre: targetData.sucursalNombre || null,
        periodo: targetData.periodo, // 'semanal' | 'mensual' | 'anual'
        cantidad: targetData.cantidad,
        año: targetData.año,
        mes: targetData.mes || null, // Solo para mensual
        activo: targetData.activo !== undefined ? targetData.activo : true,
        clienteAdminId: targetData.clienteAdminId,
        fechaCreacion: serverTimestamp(),
        fechaActualizacion: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'auditorias_targets'), target);
      toast.success('Target creado exitosamente');
      return docRef.id;
    } catch (error) {
      console.error('Error creando target:', error);
      toast.error('Error al crear el target');
      throw error;
    }
  },

  /**
   * Obtener targets por cliente
   * @param {string} clienteAdminId - ID del cliente administrador
   * @param {Object} filters - Filtros opcionales (empresaId, sucursalId, periodo, año, mes, activo)
   * @returns {Promise<Array>} Lista de targets
   */
  async getTargets(clienteAdminId, filters = {}) {
    try {
      const targetsRef = collection(db, 'auditorias_targets');
      let q = query(
        targetsRef,
        where('clienteAdminId', '==', clienteAdminId),
        orderBy('año', 'desc'),
        orderBy('mes', 'desc')
      );

      // Aplicar filtros adicionales
      if (filters.empresaId) {
        q = query(q, where('empresaId', '==', filters.empresaId));
      }
      if (filters.sucursalId) {
        q = query(q, where('sucursalId', '==', filters.sucursalId));
      }
      if (filters.periodo) {
        q = query(q, where('periodo', '==', filters.periodo));
      }
      if (filters.año) {
        q = query(q, where('año', '==', filters.año));
      }
      if (filters.mes !== undefined) {
        q = query(q, where('mes', '==', filters.mes));
      }
      if (filters.activo !== undefined) {
        q = query(q, where('activo', '==', filters.activo));
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error obteniendo targets:', error);
      return [];
    }
  },

  /**
   * Obtener un target por ID
   * @param {string} targetId - ID del target
   * @returns {Promise<Object|null>} Target o null si no existe
   */
  async getTargetById(targetId) {
    try {
      const targetRef = doc(db, 'auditorias_targets', targetId);
      const targetDoc = await getDoc(targetRef);
      
      if (!targetDoc.exists()) return null;
      
      return {
        id: targetDoc.id,
        ...targetDoc.data()
      };
    } catch (error) {
      console.error('Error obteniendo target:', error);
      return null;
    }
  },

  /**
   * Actualizar un target
   * @param {string} targetId - ID del target
   * @param {Object} updates - Campos a actualizar
   * @returns {Promise<void>}
   */
  async updateTarget(targetId, updates) {
    try {
      const targetRef = doc(db, 'auditorias_targets', targetId);
      await updateDoc(targetRef, {
        ...updates,
        fechaActualizacion: serverTimestamp()
      });
      toast.success('Target actualizado exitosamente');
    } catch (error) {
      console.error('Error actualizando target:', error);
      toast.error('Error al actualizar el target');
      throw error;
    }
  },

  /**
   * Eliminar un target
   * @param {string} targetId - ID del target
   * @returns {Promise<void>}
   */
  async deleteTarget(targetId) {
    try {
      await deleteDoc(doc(db, 'auditorias_targets', targetId));
      toast.success('Target eliminado exitosamente');
    } catch (error) {
      console.error('Error eliminando target:', error);
      toast.error('Error al eliminar el target');
      throw error;
    }
  },

  /**
   * Activar/desactivar un target
   * @param {string} targetId - ID del target
   * @param {boolean} activo - Estado activo/inactivo
   * @returns {Promise<void>}
   */
  async toggleTarget(targetId, activo) {
    try {
      await this.updateTarget(targetId, { activo });
    } catch (error) {
      throw error;
    }
  },

  /**
   * Calcular cumplimiento de un target
   * @param {Object} target - Target a evaluar
   * @param {Array} auditoriasCompletadas - Lista de auditorías completadas
   * @returns {Object} Objeto con cantidad completada, porcentaje y estado
   */
  calcularCumplimiento(target, auditoriasCompletadas) {
    const { periodo, año, mes, cantidad, empresaId, sucursalId } = target;
    
    // Filtrar auditorías por empresa/sucursal
    let auditoriasFiltradas = auditoriasCompletadas.filter(aud => {
      const matchEmpresa = !empresaId || aud.empresaId === empresaId || aud.empresa === empresaId;
      const matchSucursal = !sucursalId || aud.sucursalId === sucursalId || aud.sucursal === sucursalId;
      return matchEmpresa && matchSucursal && aud.estado === 'completada';
    });

    // Filtrar por periodo
    const ahora = new Date();
    let fechaInicio, fechaFin;

    if (periodo === 'semanal') {
      const inicioSemana = new Date(ahora);
      inicioSemana.setDate(ahora.getDate() - ahora.getDay()); // Lunes de esta semana
      inicioSemana.setHours(0, 0, 0, 0);
      fechaInicio = inicioSemana;
      fechaFin = new Date(inicioSemana);
      fechaFin.setDate(inicioSemana.getDate() + 6);
      fechaFin.setHours(23, 59, 59, 999);
    } else if (periodo === 'mensual') {
      fechaInicio = new Date(año, mes ? mes - 1 : ahora.getMonth(), 1);
      fechaFin = new Date(año, mes ? mes : ahora.getMonth() + 1, 0, 23, 59, 59, 999);
    } else if (periodo === 'anual') {
      fechaInicio = new Date(año, 0, 1);
      fechaFin = new Date(año, 11, 31, 23, 59, 59, 999);
    }

    // Filtrar por rango de fechas
    auditoriasFiltradas = auditoriasFiltradas.filter(aud => {
      let fechaAuditoria;
      
      if (aud.fechaCreacion?.toDate) {
        fechaAuditoria = aud.fechaCreacion.toDate();
      } else if (aud.fechaCompletada?.toDate) {
        fechaAuditoria = aud.fechaCompletada.toDate();
      } else if (aud.fecha) {
        fechaAuditoria = new Date(aud.fecha);
      } else {
        return false;
      }

      return fechaAuditoria >= fechaInicio && fechaAuditoria <= fechaFin;
    });

    const completadas = auditoriasFiltradas.length;
    const porcentaje = cantidad > 0 ? Math.round((completadas / cantidad) * 100) : 0;
    const estado = porcentaje >= 100 ? 'cumplido' : porcentaje >= 80 ? 'en_proceso' : 'pendiente';

    return {
      target: cantidad,
      completadas,
      faltantes: Math.max(0, cantidad - completadas),
      porcentaje: Math.min(100, porcentaje),
      estado,
      fechaInicio,
      fechaFin
    };
  }
};
