// src/utils/goalsCalculationService.js
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';

/**
 * Servicio para calcular cumplimiento de metas y objetivos
 */

/**
 * Obtiene el estado de cumplimiento basado en porcentaje
 * @param {number} porcentaje - Porcentaje de cumplimiento (0-100+)
 * @returns {string} 'cumplido' | 'en_progreso' | 'atrasado'
 */
export function obtenerEstadoCumplimiento(porcentaje) {
  if (porcentaje >= 100) {
    return 'cumplido';
  } else if (porcentaje >= 50) {
    return 'en_progreso';
  } else {
    return 'atrasado';
  }
}

/**
 * Calcula el cumplimiento de capacitaciones para una sucursal
 * @param {Object} sucursal - Objeto sucursal con metas configuradas
 * @param {Array} capacitaciones - Array de capacitaciones (opcional, si no se pasa se consulta)
 * @param {Object} periodo - { mes: number, año: number } (opcional, por defecto mes/año actual)
 * @returns {Promise<Object>} { mensual: {...}, anual: {...} }
 */
export async function calcularCumplimientoCapacitaciones(sucursal, capacitaciones = null, periodo = null) {
  try {
    if (!sucursal || !sucursal.id) {
      return {
        mensual: { completadas: 0, target: 0, porcentaje: 0, estado: 'sin_target' },
        anual: { completadas: 0, target: 0, porcentaje: 0, estado: 'sin_target' }
      };
    }

    const ahora = periodo ? new Date(periodo.año, periodo.mes - 1, 1) : new Date();
    const añoActual = periodo ? periodo.año : ahora.getFullYear();
    const mesActual = periodo ? periodo.mes : ahora.getMonth() + 1;

    // Obtener metas
    const targetMensual = sucursal.targetMensualCapacitaciones || 0;
    const targetAnual = sucursal.targetAnualCapacitaciones || 0;

    // Si no hay capacitaciones pasadas, consultarlas
    let capacitacionesData = capacitaciones;
    if (!capacitacionesData) {
      const capacitacionesRef = collection(db, 'capacitaciones');
      const q = query(capacitacionesRef, where('sucursalId', '==', sucursal.id));
      const snapshot = await getDocs(q);
      capacitacionesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    }

    // Calcular período mensual
    const inicioMes = new Date(añoActual, mesActual - 1, 1);
    const finMes = new Date(añoActual, mesActual, 0, 23, 59, 59, 999);

    // Calcular período anual
    const inicioAño = new Date(añoActual, 0, 1);
    const finAño = new Date(añoActual, 11, 31, 23, 59, 59, 999);

    // Filtrar capacitaciones del mes
    const capacitacionesMes = capacitacionesData.filter(cap => {
      const fecha = cap.fechaRealizada?.toDate 
        ? cap.fechaRealizada.toDate() 
        : (cap.fechaRealizada ? new Date(cap.fechaRealizada) : null);
      
      if (!fecha) return false;
      return fecha >= inicioMes && fecha <= finMes && cap.estado !== 'cancelada';
    });

    // Filtrar capacitaciones del año
    const capacitacionesAño = capacitacionesData.filter(cap => {
      const fecha = cap.fechaRealizada?.toDate 
        ? cap.fechaRealizada.toDate() 
        : (cap.fechaRealizada ? new Date(cap.fechaRealizada) : null);
      
      if (!fecha) return false;
      return fecha >= inicioAño && fecha <= finAño && cap.estado !== 'cancelada';
    });

    // Calcular cumplimiento mensual
    const completadasMensual = capacitacionesMes.length;
    const porcentajeMensual = targetMensual > 0 
      ? Math.round((completadasMensual / targetMensual) * 100) 
      : 0;
    const estadoMensual = targetMensual > 0 
      ? obtenerEstadoCumplimiento(porcentajeMensual) 
      : 'sin_target';

    // Calcular cumplimiento anual
    const completadasAnual = capacitacionesAño.length;
    const porcentajeAnual = targetAnual > 0 
      ? Math.round((completadasAnual / targetAnual) * 100) 
      : 0;
    const estadoAnual = targetAnual > 0 
      ? obtenerEstadoCumplimiento(porcentajeAnual) 
      : 'sin_target';

    return {
      mensual: {
        completadas: completadasMensual,
        target: targetMensual,
        porcentaje: porcentajeMensual,
        estado: estadoMensual
      },
      anual: {
        completadas: completadasAnual,
        target: targetAnual,
        porcentaje: porcentajeAnual,
        estado: estadoAnual
      }
    };
  } catch (error) {
    console.error('Error calculando cumplimiento de capacitaciones:', error);
    return {
      mensual: { completadas: 0, target: 0, porcentaje: 0, estado: 'sin_target' },
      anual: { completadas: 0, target: 0, porcentaje: 0, estado: 'sin_target' }
    };
  }
}

/**
 * Calcula el cumplimiento anual de auditorías para una sucursal
 * @param {Object} sucursal - Objeto sucursal con metas configuradas
 * @param {Array} auditorias - Array de auditorías (opcional, si no se pasa se consulta)
 * @param {number} año - Año a calcular (opcional, por defecto año actual)
 * @returns {Promise<Object>} { completadas, target, porcentaje, estado }
 */
export async function calcularCumplimientoAuditoriasAnual(sucursal, auditorias = null, año = null) {
  try {
    if (!sucursal || !sucursal.id) {
      return { completadas: 0, target: 0, porcentaje: 0, estado: 'sin_target' };
    }

    const añoActual = año || new Date().getFullYear();
    const targetAnual = sucursal.targetAnualAuditorias || 0;

    if (targetAnual === 0) {
      return { completadas: 0, target: 0, porcentaje: 0, estado: 'sin_target' };
    }

    // Si no hay auditorías pasadas, consultarlas
    let auditoriasData = auditorias;
    if (!auditoriasData) {
      const reportesRef = collection(db, 'reportes');
      const queries = [
        query(reportesRef, where('sucursalId', '==', sucursal.id))
      ];

      // También buscar por nombre de sucursal (compatibilidad)
      if (sucursal.nombre) {
        queries.push(query(reportesRef, where('sucursal', '==', sucursal.nombre)));
      }

      const snapshots = await Promise.allSettled(queries.map(q => getDocs(q)));
      auditoriasData = [];
      const processedIds = new Set();

      snapshots.forEach((result) => {
        if (result.status !== 'fulfilled') return;
        result.value.forEach((docSnapshot) => {
          if (processedIds.has(docSnapshot.id)) return;
          processedIds.add(docSnapshot.id);
          auditoriasData.push({
            id: docSnapshot.id,
            ...docSnapshot.data()
          });
        });
      });
    }

    // Calcular período anual
    const inicioAño = new Date(añoActual, 0, 1);
    const finAño = new Date(añoActual, 11, 31, 23, 59, 59, 999);

    // Filtrar auditorías del año
    const auditoriasAño = auditoriasData.filter(aud => {
      const fechaCreacion = aud.fechaCreacion || aud.timestamp || aud.fecha;
      let fecha;
      
      if (fechaCreacion?.toDate) {
        fecha = fechaCreacion.toDate();
      } else if (fechaCreacion) {
        fecha = new Date(fechaCreacion);
      } else {
        return false;
      }

      // Verificar que la sucursal coincida
      const sucursalMatch = 
        aud.sucursalId === sucursal.id ||
        aud.sucursal === sucursal.nombre ||
        aud.sucursal === sucursal.id ||
        (typeof aud.sucursal === 'object' && aud.sucursal?.id === sucursal.id) ||
        (typeof aud.sucursal === 'object' && aud.sucursal?.nombre === sucursal.nombre);

      return fecha >= inicioAño && 
             fecha <= finAño && 
             aud.estado !== 'cancelada' && 
             sucursalMatch;
    });

    const completadas = auditoriasAño.length;
    const porcentaje = Math.round((completadas / targetAnual) * 100);
    const estado = obtenerEstadoCumplimiento(porcentaje);

    return { completadas, target: targetAnual, porcentaje, estado };
  } catch (error) {
    console.error('Error calculando cumplimiento anual de auditorías:', error);
    return { completadas: 0, target: 0, porcentaje: 0, estado: 'sin_target' };
  }
}

/**
 * Calcula los días sin accidentes para una sucursal
 * @param {Object} sucursal - Objeto sucursal con fechaUltimoAccidente
 * @param {Array} accidentes - Array de accidentes (opcional, si no se pasa se consulta)
 * @returns {Promise<Object>} { dias, estado, fechaUltimoAccidente, semaforo }
 */
export async function calcularDiasSinAccidentes(sucursal, accidentes = null) {
  try {
    if (!sucursal || !sucursal.id) {
      return { 
        dias: 0, 
        estado: 'sin_datos', 
        fechaUltimoAccidente: null, 
        semaforo: 'gray' 
      };
    }

    let fechaUltimoAccidente = null;

    // Si la sucursal tiene fechaUltimoAccidente guardada, usarla
    if (sucursal.fechaUltimoAccidente) {
      fechaUltimoAccidente = sucursal.fechaUltimoAccidente?.toDate 
        ? sucursal.fechaUltimoAccidente.toDate() 
        : new Date(sucursal.fechaUltimoAccidente);
    } else {
      // Si no, buscar en accidentes
      let accidentesData = accidentes;
      if (!accidentesData) {
        const accidentesRef = collection(db, 'accidentes');
        const q = query(
          accidentesRef, 
          where('sucursalId', '==', sucursal.id),
          where('tipo', '==', 'accidente')
        );
        const snapshot = await getDocs(q);
        accidentesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      }

      // Buscar el accidente más reciente
      if (accidentesData && accidentesData.length > 0) {
        const accidentesConFecha = accidentesData
          .map(acc => {
            const fecha = acc.fechaHora?.toDate 
              ? acc.fechaHora.toDate() 
              : (acc.fechaHora ? new Date(acc.fechaHora) : null);
            return { ...acc, fecha };
          })
          .filter(acc => acc.fecha !== null)
          .sort((a, b) => b.fecha - a.fecha);

        if (accidentesConFecha.length > 0) {
          fechaUltimoAccidente = accidentesConFecha[0].fecha;
        }
      }
    }

    // Si no hay fecha de último accidente, usar fecha de creación de sucursal o fecha muy antigua
    if (!fechaUltimoAccidente) {
      if (sucursal.createdAt) {
        fechaUltimoAccidente = sucursal.createdAt?.toDate 
          ? sucursal.createdAt.toDate() 
          : new Date(sucursal.createdAt);
      } else {
        // Fecha muy antigua para mostrar muchos días sin accidentes
        fechaUltimoAccidente = new Date(2020, 0, 1);
      }
    }

    // Calcular días transcurridos
    const ahora = new Date();
    const diasTranscurridos = Math.floor((ahora - fechaUltimoAccidente) / (1000 * 60 * 60 * 24));
    const dias = Math.max(0, diasTranscurridos);

    // Determinar estado y semáforo
    let estado = 'ok';
    let semaforo = 'green';

    if (dias < 7) {
      estado = 'critico';
      semaforo = 'red';
    } else if (dias < 30) {
      estado = 'alerta';
      semaforo = 'yellow';
    } else {
      estado = 'ok';
      semaforo = 'green';
    }

    return {
      dias,
      estado,
      fechaUltimoAccidente,
      semaforo
    };
  } catch (error) {
    console.error('Error calculando días sin accidentes:', error);
    return { 
      dias: 0, 
      estado: 'sin_datos', 
      fechaUltimoAccidente: null, 
      semaforo: 'gray' 
    };
  }
}
