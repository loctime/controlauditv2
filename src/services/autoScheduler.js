// src/services/autoScheduler.js
import { collection, addDoc, query, where, getDocs, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { recurringService } from './recurringService';
import { toast } from 'react-toastify';

/**
 * Servicio para generación automática de auditorías desde programaciones recurrentes
 */
export const autoScheduler = {
  /**
   * Generar auditorías agendadas desde programaciones recurrentes activas
   * @param {string} clienteAdminId - ID del cliente administrador
   * @param {number} diasAdelantados - Días adelantados para generar (default: 30)
   * @returns {Promise<{generadas: number, errores: number}>} Resumen de generación
   */
  async generateScheduledAudits(clienteAdminId, diasAdelantados = 30) {
    try {
      console.log('[AutoScheduler] Iniciando generación de auditorías...');
      
      // Obtener programaciones recurrentes activas
      const recurrings = await recurringService.getRecurrings(clienteAdminId, { activa: true });
      
      if (recurrings.length === 0) {
        console.log('[AutoScheduler] No hay programaciones recurrentes activas');
        return { generadas: 0, errores: 0 };
      }

      console.log(`[AutoScheduler] ${recurrings.length} programaciones recurrentes activas encontradas`);

      const fechaLimite = new Date();
      fechaLimite.setDate(fechaLimite.getDate() + diasAdelantados);
      
      let totalGeneradas = 0;
      let totalErrores = 0;

      // Procesar cada programación recurrente
      for (const recurring of recurrings) {
        try {
          const generadas = await this._generarAuditoriasParaRecurring(recurring, fechaLimite);
          totalGeneradas += generadas;
        } catch (error) {
          console.error(`[AutoScheduler] Error generando auditorías para ${recurring.nombre}:`, error);
          totalErrores++;
        }
      }

      console.log(`[AutoScheduler] Generación completada: ${totalGeneradas} auditorías generadas, ${totalErrores} errores`);
      
      if (totalGeneradas > 0) {
        toast.success(`${totalGeneradas} auditoría${totalGeneradas > 1 ? 's' : ''} generada${totalGeneradas > 1 ? 's' : ''} automáticamente`);
      }

      return { generadas: totalGeneradas, errores: totalErrores };
    } catch (error) {
      console.error('[AutoScheduler] Error general en generación:', error);
      toast.error('Error al generar auditorías automáticas');
      throw error;
    }
  },

  /**
   * Generar auditorías para una programación recurrente específica
   * @private
   * @param {Object} recurring - Programación recurrente
   * @param {Date} fechaLimite - Fecha límite para generar
   * @returns {Promise<number>} Cantidad de auditorías generadas
   */
  async _generarAuditoriasParaRecurring(recurring, fechaLimite) {
    const { id: recurringId, ultimaGeneracion, fechaFin } = recurring;

    // Verificar si ya expiró
    if (fechaFin && new Date(fechaFin) < new Date()) {
      console.log(`[AutoScheduler] Programación ${recurring.nombre} ya expiró`);
      return 0;
    }

    // Calcular fechas próximas
    const proximasFechas = recurringService.calcularProximasFechas(recurring, 50);
    console.log(`[AutoScheduler] Fechas calculadas para ${recurring.nombre}:`, proximasFechas.length, 'fechas');
    
    // Filtrar fechas dentro del rango y no generadas aún
    const fechaInicioBusqueda = ultimaGeneracion 
      ? (ultimaGeneracion.toDate ? ultimaGeneracion.toDate() : new Date(ultimaGeneracion))
      : new Date(recurring.fechaInicio);
    
    console.log(`[AutoScheduler] Fecha inicio búsqueda:`, fechaInicioBusqueda.toISOString().split('T')[0]);
    console.log(`[AutoScheduler] Fecha límite:`, fechaLimite.toISOString().split('T')[0]);
    console.log(`[AutoScheduler] Frecuencia:`, recurring.frecuencia);
    
    // Ajustar fechaInicioBusqueda para que incluya fechas desde hoy
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const fechaInicioEfectiva = fechaInicioBusqueda < hoy ? hoy : fechaInicioBusqueda;
    
    const fechasAGenerar = proximasFechas.filter(fecha => {
      const fechaDate = fecha instanceof Date ? fecha : new Date(fecha);
      fechaDate.setHours(0, 0, 0, 0);
      const cumpleCondiciones = fechaDate >= fechaInicioEfectiva && fechaDate <= fechaLimite && (!fechaFin || fechaDate <= new Date(fechaFin));
      return cumpleCondiciones;
    });

    console.log(`[AutoScheduler] Fechas a generar después de filtrar:`, fechasAGenerar.length, fechasAGenerar.map(f => (f instanceof Date ? f : new Date(f)).toISOString().split('T')[0]));

    if (fechasAGenerar.length === 0) {
      console.log(`[AutoScheduler] No hay fechas para generar para ${recurring.nombre}. Detalles:`, {
        proximasFechasCalculadas: proximasFechas.length,
        fechaInicioBusqueda: fechaInicioBusqueda.toISOString().split('T')[0],
        fechaInicioEfectiva: fechaInicioEfectiva.toISOString().split('T')[0],
        fechaLimite: fechaLimite.toISOString().split('T')[0],
        fechaFin: fechaFin || 'sin límite',
        primeraFechaCalculada: proximasFechas.length > 0 ? (proximasFechas[0] instanceof Date ? proximasFechas[0] : new Date(proximasFechas[0])).toISOString().split('T')[0] : 'ninguna'
      });
      return 0;
    }

    console.log(`[AutoScheduler] Generando ${fechasAGenerar.length} auditorías para ${recurring.nombre}`);

    // Verificar auditorías existentes para evitar duplicados
    const auditoriasExistentes = await this._obtenerAuditoriasExistentes(recurring, fechasAGenerar);
    const fechasExistentes = new Set(
      auditoriasExistentes.map(aud => {
        const fecha = aud.fecha;
        return typeof fecha === 'string' ? fecha : fecha.toISOString().split('T')[0];
      })
    );

    // Filtrar fechas que no tienen auditoría aún
    const fechasSinAuditoria = fechasAGenerar.filter(fecha => {
      const fechaStr = fecha.toISOString().split('T')[0];
      return !fechasExistentes.has(fechaStr);
    });

    // Generar auditorías
    let generadas = 0;
    const ultimaFechaGenerada = new Date(fechaInicioBusqueda);

    for (const fecha of fechasSinAuditoria) {
      try {
        await this._crearAuditoriaAgendada(recurring, fecha);
        generadas++;
        if (fecha > ultimaFechaGenerada) {
          ultimaFechaGenerada.setTime(fecha.getTime());
        }
      } catch (error) {
        console.error(`[AutoScheduler] Error creando auditoría para ${fecha.toISOString()}:`, error);
      }
    }

    // Actualizar última generación si se generaron auditorías
    if (generadas > 0) {
      await recurringService.updateRecurring(recurringId, {
        ultimaGeneracion: ultimaFechaGenerada
      });
    }

    return generadas;
  },

  /**
   * Obtener auditorías existentes para una programación recurrente
   * @private
   * @param {Object} recurring - Programación recurrente
   * @param {Array<Date>} fechas - Fechas a verificar
   * @returns {Promise<Array>} Lista de auditorías existentes
   */
  async _obtenerAuditoriasExistentes(recurring, fechas) {
    try {
      const fechasStr = fechas.map(f => f.toISOString().split('T')[0]);
      
      // Firestore limita 'in' queries a 10 elementos
      const chunkSize = 10;
      const chunks = [];
      for (let i = 0; i < fechasStr.length; i += chunkSize) {
        chunks.push(fechasStr.slice(i, i + chunkSize));
      }

      const auditoriasExistentes = [];
      for (const chunk of chunks) {
        const auditoriasRef = collection(db, 'auditorias_agendadas');
        const q = query(
          auditoriasRef,
          where('recurringId', '==', recurring.id),
          where('fecha', 'in', chunk)
        );
        const snapshot = await getDocs(q);
        auditoriasExistentes.push(...snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })));
      }

      return auditoriasExistentes;
    } catch (error) {
      console.error('[AutoScheduler] Error obteniendo auditorías existentes:', error);
      return [];
    }
  },

  /**
   * Crear una auditoría agendada desde una programación recurrente
   * @private
   * @param {Object} recurring - Programación recurrente
   * @param {Date} fecha - Fecha para la auditoría
   * @returns {Promise<string>} ID de la auditoría creada
   */
  async _crearAuditoriaAgendada(recurring, fecha) {
    const fechaStr = fecha.toISOString().split('T')[0];
    
    const auditoriaData = {
      empresa: recurring.empresaNombre,
      empresaId: recurring.empresaId,
      sucursal: recurring.sucursalNombre || 'Casa Central',
      sucursalId: recurring.sucursalId || null,
      formulario: recurring.formularioNombre || null,
      formularioId: recurring.formularioId || null,
      fecha: fechaStr,
      hora: recurring.hora || '09:00',
      descripcion: `Generada automáticamente desde: ${recurring.nombre}`,
      estado: 'agendada',
      recurringId: recurring.id,
      targetId: recurring.targetId || null, // Vincular con el target si existe
      usuarioId: recurring.clienteAdminId,
      usuarioNombre: recurring.nombre,
      clienteAdminId: recurring.clienteAdminId,
      encargado: recurring.encargadoId ? {
        id: recurring.encargadoId
      } : null,
      fechaCreacion: serverTimestamp(),
      fechaActualizacion: serverTimestamp(),
      esRecurrente: true
    };

    const docRef = await addDoc(collection(db, 'auditorias_agendadas'), auditoriaData);
    console.log(`[AutoScheduler] Auditoría creada: ${docRef.id} para ${fechaStr}`);
    return docRef.id;
  },

  /**
   * Ejecutar generación automática diaria (llamar desde useEffect o Cloud Function)
   * @param {string} clienteAdminId - ID del cliente administrador
   * @returns {Promise<void>}
   */
  async ejecutarGeneracionDiaria(clienteAdminId) {
    try {
      const resultado = await this.generateScheduledAudits(clienteAdminId, 30);
      console.log('[AutoScheduler] Generación diaria completada:', resultado);
    } catch (error) {
      console.error('[AutoScheduler] Error en generación diaria:', error);
    }
  }
};
