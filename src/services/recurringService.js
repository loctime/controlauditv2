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
        formularioId: recurringData.formularioId,
        formularioNombre: recurringData.formularioNombre,
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
   * Eliminar una programación recurrente
   * @param {string} recurringId - ID de la programación
   * @returns {Promise<void>}
   */
  async deleteRecurring(recurringId) {
    try {
      await deleteDoc(doc(db, 'auditorias_recurrentes', recurringId));
      toast.success('Programación recurrente eliminada exitosamente');
    } catch (error) {
      console.error('Error eliminando programación recurrente:', error);
      toast.error('Error al eliminar la programación recurrente');
      throw error;
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
    const { frecuencia, fechaInicio, fechaFin, hora } = recurring;
    const fechas = [];
    const ahora = new Date();
    const fechaActual = new Date(fechaInicio);

    if (fechaFin && new Date(fechaFin) < ahora) {
      return []; // Ya expiró
    }

    let fecha = fechaActual > ahora ? new Date(fechaActual) : new Date(ahora);

    while (fechas.length < cantidad) {
      let siguienteFecha = null;

      if (frecuencia.tipo === 'semanal') {
        if (frecuencia.diasSemana && frecuencia.diasSemana.length > 0) {
          // Encontrar el próximo día de la semana
          const diaSemana = fecha.getDay(); // 0=Domingo, 1=Lunes, etc.
          const diasSemana = frecuencia.diasSemana.map(d => d === 7 ? 0 : d); // Convertir 7 (Domingo) a 0
          
          // Buscar el próximo día en la lista
          let diasHastaProximo = null;
          for (const dia of diasSemana) {
            let diferencia = dia - diaSemana;
            if (diferencia <= 0) diferencia += 7;
            if (diasHastaProximo === null || diferencia < diasHastaProximo) {
              diasHastaProximo = diferencia;
            }
          }

          if (diasHastaProximo === 0 && fechaActual > ahora) {
            diasHastaProximo = 7 * frecuencia.intervalo; // Si es el mismo día, ir a la próxima semana
          } else if (diasHastaProximo === 0) {
            diasHastaProximo = 7 * frecuencia.intervalo;
          }

          siguienteFecha = new Date(fecha);
          siguienteFecha.setDate(fecha.getDate() + diasHastaProximo);
        }
      } else if (frecuencia.tipo === 'mensual') {
        siguienteFecha = new Date(fecha);
        siguienteFecha.setMonth(fecha.getMonth() + 1);
        if (frecuencia.diaMes) {
          siguienteFecha.setDate(frecuencia.diaMes);
        }
      }

      if (siguienteFecha && (!fechaFin || siguienteFecha <= new Date(fechaFin))) {
        fechas.push(new Date(siguienteFecha));
        fecha = siguienteFecha;
      } else {
        break;
      }
    }

    return fechas;
  }
};
