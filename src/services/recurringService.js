// src/services/recurringService.js
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
 * Servicio para gestión de programaciones recurrentes de auditorías
 * Colección: auditorias_recurrentes
 */
export const recurringService = {
  /**
   * Crear una nueva programación recurrente
   * @param {Object} recurringData - Datos de la programación
   * @returns {Promise<string>} ID del documento creado
   */
  async createRecurring(recurringData) {
    try {
      const recurring = {
        nombre: recurringData.nombre,
        empresaId: recurringData.empresaId,
        empresaNombre: recurringData.empresaNombre,
        sucursalId: recurringData.sucursalId || null,
        sucursalNombre: recurringData.sucursalNombre || null,
        formularioId: recurringData.formularioId || null,
        formularioNombre: recurringData.formularioNombre || null,
        encargadoId: recurringData.encargadoId || null,
        frecuencia: {
          tipo: recurringData.frecuencia.tipo, // 'semanal' | 'mensual' | 'personalizada'
          diasSemana: recurringData.frecuencia.diasSemana || null, // [1-7] donde 1=Lunes, 7=Domingo
          diaMes: recurringData.frecuencia.diaMes || null, // Para mensual
          intervalo: recurringData.frecuencia.intervalo || 1 // Cada N semanas
        },
        hora: recurringData.hora, // "HH:MM"
        fechaInicio: recurringData.fechaInicio,
        fechaFin: recurringData.fechaFin || null,
        activa: recurringData.activa !== undefined ? recurringData.activa : true,
        ultimaGeneracion: null,
        clienteAdminId: recurringData.clienteAdminId,
        targetId: recurringData.targetId || null, // ID del target relacionado
        fechaCreacion: serverTimestamp(),
        fechaActualizacion: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'auditorias_recurrentes'), recurring);
      toast.success('Programación recurrente creada exitosamente');
      return docRef.id;
    } catch (error) {
      console.error('Error creando programación recurrente:', error);
      toast.error('Error al crear la programación recurrente');
      throw error;
    }
  },

  /**
   * Obtener programaciones recurrentes por cliente
   * @param {string} clienteAdminId - ID del cliente administrador
   * @param {Object} filters - Filtros opcionales (empresaId, sucursalId, activa)
   * @returns {Promise<Array>} Lista de programaciones recurrentes
   */
  async getRecurrings(clienteAdminId, filters = {}) {
    try {
      const recurringsRef = collection(db, 'auditorias_recurrentes');
      let q = query(
        recurringsRef,
        where('clienteAdminId', '==', clienteAdminId),
        orderBy('fechaCreacion', 'desc')
      );

      // Aplicar filtros adicionales
      if (filters.empresaId) {
        q = query(q, where('empresaId', '==', filters.empresaId));
      }
      if (filters.sucursalId) {
        q = query(q, where('sucursalId', '==', filters.sucursalId));
      }
      if (filters.activa !== undefined) {
        q = query(q, where('activa', '==', filters.activa));
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error obteniendo programaciones recurrentes:', error);
      return [];
    }
  },

  /**
   * Obtener una programación recurrente por ID
   * @param {string} recurringId - ID de la programación
   * @returns {Promise<Object|null>} Programación o null si no existe
   */
  async getRecurringById(recurringId) {
    try {
      const recurringRef = doc(db, 'auditorias_recurrentes', recurringId);
      const recurringDoc = await getDoc(recurringRef);
      
      if (!recurringDoc.exists()) return null;
      
      return {
        id: recurringDoc.id,
        ...recurringDoc.data()
      };
    } catch (error) {
      console.error('Error obteniendo programación recurrente:', error);
      return null;
    }
  },

  /**
   * Actualizar una programación recurrente
   * @param {string} recurringId - ID de la programación
   * @param {Object} updates - Campos a actualizar
   * @returns {Promise<void>}
   */
  async updateRecurring(recurringId, updates) {
    try {
      const recurringRef = doc(db, 'auditorias_recurrentes', recurringId);
      await updateDoc(recurringRef, {
        ...updates,
        fechaActualizacion: serverTimestamp()
      });
      toast.success('Programación recurrente actualizada exitosamente');
    } catch (error) {
      console.error('Error actualizando programación recurrente:', error);
      toast.error('Error al actualizar la programación recurrente');
      throw error;
    }
  },

  /**
   * Eliminar una programación recurrente y sus auditorías relacionadas (solo pendientes)
   * @param {string} recurringId - ID de la programación
   * @param {boolean} eliminarAuditorias - Si true, elimina auditorías relacionadas pendientes (default: true)
   * @returns {Promise<void>}
   */
  async deleteRecurring(recurringId, eliminarAuditorias = true) {
    try {
      // Si se debe eliminar auditorías relacionadas, hacerlo primero
      if (eliminarAuditorias) {
        await this._eliminarAuditoriasRelacionadas(recurringId, null);
      }

      // Eliminar la programación recurrente
      await deleteDoc(doc(db, 'auditorias_recurrentes', recurringId));
      toast.success('Programación recurrente eliminada exitosamente');
    } catch (error) {
      console.error('Error eliminando programación recurrente:', error);
      toast.error('Error al eliminar la programación recurrente');
      throw error;
    }
  },

  /**
   * Eliminar auditorías agendadas relacionadas con una programación recurrente o target
   * @private
   * @param {string|null} recurringId - ID de la programación recurrente (opcional)
   * @param {string|null} targetId - ID del target (opcional)
   * @returns {Promise<number>} Cantidad de auditorías eliminadas
   */
  async _eliminarAuditoriasRelacionadas(recurringId = null, targetId = null) {
    try {
      const auditoriasRef = collection(db, 'auditorias_agendadas');
      
      let auditoriasQuery = null;
      
      // Construir query según los parámetros
      // Nota: Firestore no permite múltiples where 'in' en una query, así que filtramos después
      if (recurringId) {
        auditoriasQuery = query(
          auditoriasRef,
          where('recurringId', '==', recurringId)
        );
      } else if (targetId) {
        auditoriasQuery = query(
          auditoriasRef,
          where('targetId', '==', targetId)
        );
      } else {
        return 0;
      }

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
          await deleteDoc(doc(db, 'auditorias_agendadas', auditoriaDoc.id));
          eliminadas++;
        } catch (error) {
          console.error(`Error eliminando auditoría ${auditoriaDoc.id}:`, error);
        }
      }

      if (eliminadas > 0) {
        console.log(`✅ ${eliminadas} auditoría${eliminadas > 1 ? 's' : ''} pendiente${eliminadas > 1 ? 's' : ''} eliminada${eliminadas > 1 ? 's' : ''}`);
      }

      return eliminadas;
    } catch (error) {
      console.error('Error eliminando auditorías relacionadas:', error);
      return 0;
    }
  },

  /**
   * Activar/desactivar una programación recurrente
   * @param {string} recurringId - ID de la programación
   * @param {boolean} activa - Estado activo/inactivo
   * @returns {Promise<void>}
   */
  async toggleRecurring(recurringId, activa) {
    try {
      await this.updateRecurring(recurringId, { activa });
    } catch (error) {
      throw error;
    }
  },

  /**
   * Calcular próximas fechas para una programación recurrente
   * @param {Object} recurring - Programación recurrente
   * @param {number} cantidad - Cantidad de fechas a calcular
   * @returns {Array<Date>} Array de fechas próximas
   */
  calcularProximasFechas(recurring, cantidad = 10) {
    const { frecuencia, fechaInicio, fechaFin } = recurring;
    const fechas = [];
    const ahora = new Date();
    ahora.setHours(0, 0, 0, 0);
    const fechaInicioDate = new Date(fechaInicio);
    fechaInicioDate.setHours(0, 0, 0, 0);
    const fechaFinDate = fechaFin ? new Date(fechaFin) : null;
    if (fechaFinDate) fechaFinDate.setHours(23, 59, 59, 999);

    if (fechaFinDate && fechaFinDate < ahora) {
      return []; // Ya expiró
    }

    // Comenzar desde la fecha de inicio o desde hoy, la que sea mayor
    let fechaInicioCalculo = fechaInicioDate > ahora ? new Date(fechaInicioDate) : new Date(ahora);
    fechaInicioCalculo.setHours(0, 0, 0, 0);
    
    // Límite de cálculo: fechaFin o 90 días hacia adelante
    const fechaLimiteCalculo = fechaFinDate || new Date(ahora.getTime() + (90 * 24 * 60 * 60 * 1000));
    fechaLimiteCalculo.setHours(23, 59, 59, 999);

    if (frecuencia.tipo === 'semanal') {
      if (frecuencia.diasSemana && frecuencia.diasSemana.length > 0) {
        const diasSemana = frecuencia.diasSemana.map(d => d === 7 ? 0 : d); // Convertir 7 (Domingo) a 0
        
        // Generar todas las fechas que coincidan con los días configurados dentro del rango
        let fechaActual = new Date(fechaInicioCalculo);
        
        while (fechaActual <= fechaLimiteCalculo && fechas.length < cantidad) {
          const diaSemanaActual = fechaActual.getDay();
          
          // Si este día está en la lista de días configurados
          if (diasSemana.includes(diaSemanaActual)) {
            if (!fechas.some(f => f.getTime() === fechaActual.getTime())) {
              fechas.push(new Date(fechaActual));
            }
          }
          
          // Avanzar al siguiente día
          fechaActual.setDate(fechaActual.getDate() + 1);
          fechaActual.setHours(0, 0, 0, 0);
        }
      }
    } else if (frecuencia.tipo === 'mensual') {
      let fecha = new Date(fechaInicioCalculo);
      
      while (fechas.length < cantidad && fecha <= fechaLimiteCalculo) {
        if (frecuencia.diaMes) {
          // Asegurar que el día del mes existe en el mes
          const diasEnMes = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0).getDate();
          fecha.setDate(Math.min(frecuencia.diaMes, diasEnMes));
        }
        fecha.setHours(0, 0, 0, 0);
        
        if (fecha >= fechaInicioCalculo && (!fechaFinDate || fecha <= fechaFinDate)) {
          if (!fechas.some(f => f.getTime() === fecha.getTime())) {
            fechas.push(new Date(fecha));
          }
        }
        
        // Avanzar al siguiente mes
        fecha.setMonth(fecha.getMonth() + 1);
      }
    }

    // Ordenar y limitar
    fechas.sort((a, b) => a.getTime() - b.getTime());
    return fechas.slice(0, cantidad);
  }
};
