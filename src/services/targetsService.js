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
   * Eliminar un target, sus programaciones recurrentes y auditorías relacionadas (solo pendientes)
   * @param {string} targetId - ID del target
   * @param {boolean} eliminarProgramaciones - Si true, elimina programaciones recurrentes relacionadas (default: true)
   * @param {boolean} eliminarAuditorias - Si true, elimina auditorías relacionadas pendientes (default: true)
   * @returns {Promise<void>}
   */
  async deleteTarget(targetId, eliminarProgramaciones = true, eliminarAuditorias = true) {
    try {
      // Importar recurringService para eliminar programaciones relacionadas
      const { recurringService } = await import('./recurringService');

      // Si se debe eliminar programaciones relacionadas, hacerlo primero
      if (eliminarProgramaciones) {
        await this._eliminarProgramacionesRelacionadas(targetId, eliminarAuditorias);
      }

      // Si se debe eliminar auditorías relacionadas directamente con el target
      if (eliminarAuditorias) {
        await this._eliminarAuditoriasRelacionadas(targetId);
      }

      // Eliminar el target
      await deleteDoc(doc(db, 'auditorias_targets', targetId));
      toast.success('Target eliminado exitosamente');
    } catch (error) {
      console.error('Error eliminando target:', error);
      toast.error('Error al eliminar el target');
      throw error;
    }
  },

  /**
   * Eliminar programaciones recurrentes relacionadas con un target
   * @private
   * @param {string} targetId - ID del target
   * @param {boolean} eliminarAuditorias - Si true, elimina auditorías de cada programación
   * @returns {Promise<number>} Cantidad de programaciones eliminadas
   */
  async _eliminarProgramacionesRelacionadas(targetId, eliminarAuditorias = true) {
    try {
      const { recurringService } = await import('./recurringService');
      const { collection: col, query: q, where: w, getDocs } = await import('firebase/firestore');
      
      const recurringsRef = col(db, 'auditorias_recurrentes');
      const recurringsQuery = q(
        recurringsRef,
        w('targetId', '==', targetId)
      );

      const snapshot = await getDocs(recurringsQuery);
      const programacionesAEliminar = snapshot.docs;

      // Eliminar cada programación recurrente (esto también eliminará sus auditorías si eliminarAuditorias es true)
      let eliminadas = 0;
      for (const recurringDoc of programacionesAEliminar) {
        try {
          await recurringService.deleteRecurring(recurringDoc.id, eliminarAuditorias);
          eliminadas++;
        } catch (error) {
          console.error(`Error eliminando programación recurrente ${recurringDoc.id}:`, error);
        }
      }

      if (eliminadas > 0) {
        console.log(`✅ ${eliminadas} programación${eliminadas > 1 ? 'es' : ''} recurrente${eliminadas > 1 ? 's' : ''} eliminada${eliminadas > 1 ? 's' : ''}`);
      }

      return eliminadas;
    } catch (error) {
      console.error('Error eliminando programaciones relacionadas:', error);
      return 0;
    }
  },

  /**
   * Eliminar auditorías agendadas relacionadas directamente con un target
   * @private
   * @param {string} targetId - ID del target
   * @returns {Promise<number>} Cantidad de auditorías eliminadas
   */
  async _eliminarAuditoriasRelacionadas(targetId) {
    try {
      const { collection: col, query: q, where: w, getDocs, deleteDoc: delDoc, doc: docRef } = await import('firebase/firestore');
      const auditoriasRef = col(db, 'auditorias_agendadas');
      
      // Nota: Filtrar por estado después, ya que Firestore tiene limitaciones con 'in'
      const auditoriasQuery = q(
        auditoriasRef,
        w('targetId', '==', targetId)
      );

      const snapshot = await getDocs(auditoriasQuery);
      // Filtrar para obtener solo las que NO están completadas
      const auditoriasAEliminar = snapshot.docs.filter(doc => {
        const data = doc.data();
        const estado = data.estado;
        // Solo eliminar si está pendiente o agendada, NO completadas
        return estado === 'pendiente' || estado === 'agendada';
      });

      // Eliminar cada auditoría pendiente/agendada
      let eliminadas = 0;
      for (const auditoriaDoc of auditoriasAEliminar) {
        try {
          await delDoc(docRef(db, 'auditorias_agendadas', auditoriaDoc.id));
          eliminadas++;
        } catch (error) {
          console.error(`Error eliminando auditoría ${auditoriaDoc.id}:`, error);
        }
      }

      if (eliminadas > 0) {
        console.log(`✅ ${eliminadas} auditoría${eliminadas > 1 ? 's' : ''} pendiente${eliminadas > 1 ? 's' : ''} eliminada${eliminadas > 1 ? 's' : ''} del target`);
      }

      return eliminadas;
    } catch (error) {
      console.error('Error eliminando auditorías relacionadas:', error);
      return 0;
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
