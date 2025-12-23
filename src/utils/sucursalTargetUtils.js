// src/utils/sucursalTargetUtils.js
import { getDocs } from 'firebase/firestore';

/**
 * Calcula el número de auditorías completadas en el mes actual para una sucursal
 * @param {string} sucursalId - ID de la sucursal
 * @param {string} sucursalNombre - Nombre de la sucursal (opcional, para búsqueda más precisa)
 * @param {string} empresaId - ID de la empresa (opcional, pero recomendado para filtrar correctamente)
 * @param {Array<Query>} reportesQueries - Array de queries de Firestore (requerido)
 * @returns {Promise<number>} Número de auditorías del mes actual
 */
export async function getAuditoriasMesActual(sucursalId, sucursalNombre = null, empresaId = null, reportesQueries = null) {
  try {
    if (!sucursalId) return 0;
    if (!reportesQueries || reportesQueries.length === 0) {
      console.warn('getAuditoriasMesActual: reportesQueries es requerido');
      return 0;
    }

    // Obtener inicio y fin del mes actual
    const ahora = new Date();
    const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
    const finMes = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0, 23, 59, 59, 999);

    const snapshots = await Promise.allSettled(
      reportesQueries.map(q => getDocs(q))
    );

    const auditorias = [];
    const processedIds = new Set();

    snapshots.forEach((result) => {
      if (result.status !== 'fulfilled') return;
      
      result.value.forEach((docSnapshot) => {
        if (processedIds.has(docSnapshot.id)) return;
        processedIds.add(docSnapshot.id);

        const data = docSnapshot.data();
        
        // FILTRAR POR EMPRESA: Verificar que la auditoría pertenezca a la empresa correcta
        // Solo filtrar si el reporte tiene algún campo de empresa definido
        // Si no tiene empresaId/empresa, confiamos en que la sucursal ya filtra correctamente
        if (empresaId) {
          // Solo filtrar si el reporte tiene algún campo de empresa
          const tieneEmpresa = data.empresaId || 
                              (data.empresa && typeof data.empresa !== 'string') || 
                              (typeof data.empresa === 'object' && data.empresa !== null);
          
          if (tieneEmpresa) {
            const empresaMatch = 
              data.empresaId === empresaId ||
              (typeof data.empresa === 'string' && data.empresa === empresaId) ||
              (typeof data.empresa === 'object' && data.empresa?.id === empresaId);
            
            if (!empresaMatch) {
              return; // No pertenece a esta empresa, ignorar
            }
          }
          // Si no tiene campo de empresa, no filtrar (confiar en que la sucursal ya filtra correctamente)
        }
        
        // Verificar que la auditoría sea del mes actual
        const fechaCreacion = data.fechaCreacion || data.timestamp || data.fecha;
        let fecha;
        
        if (fechaCreacion?.toDate) {
          fecha = fechaCreacion.toDate();
        } else if (fechaCreacion) {
          fecha = new Date(fechaCreacion);
        } else {
          return; // Sin fecha, no contar
        }

        // Verificar que esté en el rango del mes actual
        if (fecha >= inicioMes && fecha <= finMes) {
          // Verificar que la sucursal coincida
          const sucursalMatch = 
            data.sucursalId === sucursalId ||
            data.sucursal === sucursalNombre ||
            data.sucursal === sucursalId ||
            (typeof data.sucursal === 'object' && data.sucursal?.id === sucursalId) ||
            (typeof data.sucursal === 'object' && data.sucursal?.nombre === sucursalNombre);

          if (sucursalMatch && data.estado !== 'cancelada') {
            auditorias.push(docSnapshot.id);
          }
        }
      });
    });

    return auditorias.length;
  } catch (error) {
    console.error('Error calculando auditorías del mes:', error);
    return 0;
  }
}

/**
 * Calcula el progreso del target mensual para una sucursal
 * @param {Object} sucursal - Objeto sucursal con targetMensual
 * @param {Array<Query>} reportesQueries - Array de queries de Firestore (requerido)
 * @returns {Promise<Object>} { completadas, target, porcentaje, estado }
 */
export async function calcularProgresoTarget(sucursal, reportesQueries = null) {
  if (!sucursal || !sucursal.id) {
    return { completadas: 0, target: 0, porcentaje: 0, estado: 'sin_target' };
  }

  const target = sucursal.targetMensual || 0;
  
  if (target === 0) {
    return { completadas: 0, target: 0, porcentaje: 0, estado: 'sin_target' };
  }

  if (!reportesQueries || reportesQueries.length === 0) {
    console.warn('calcularProgresoTarget: reportesQueries es requerido');
    return { completadas: 0, target: 0, porcentaje: 0, estado: 'sin_target' };
  }

  const completadas = await getAuditoriasMesActual(sucursal.id, sucursal.nombre, sucursal.empresaId, reportesQueries);
  const porcentaje = Math.round((completadas / target) * 100);

  let estado = 'sin_target';
  if (target > 0) {
    if (porcentaje >= 100) {
      estado = 'completado';
    } else if (porcentaje >= 80) {
      estado = 'bueno';
    } else if (porcentaje >= 50) {
      estado = 'regular';
    } else {
      estado = 'bajo';
    }
  }

  return { completadas, target, porcentaje, estado };
}

/**
 * Calcula el número de auditorías completadas en el año actual para una sucursal
 * @param {string} sucursalId - ID de la sucursal
 * @param {string} sucursalNombre - Nombre de la sucursal (opcional, para búsqueda más precisa)
 * @param {number} año - Año a calcular (opcional, por defecto año actual)
 * @param {string} empresaId - ID de la empresa (opcional, pero recomendado para filtrar correctamente)
 * @param {Array<Query>} reportesQueries - Array de queries de Firestore (requerido)
 * @returns {Promise<number>} Número de auditorías del año
 */
export async function getAuditoriasAñoActual(sucursalId, sucursalNombre = null, año = null, empresaId = null, reportesQueries = null) {
  try {
    if (!sucursalId) return 0;
    if (!reportesQueries || reportesQueries.length === 0) {
      console.warn('getAuditoriasAñoActual: reportesQueries es requerido');
      return 0;
    }

    const añoActual = año || new Date().getFullYear();
    const inicioAño = new Date(añoActual, 0, 1);
    const finAño = new Date(añoActual, 11, 31, 23, 59, 59, 999);

    const snapshots = await Promise.allSettled(
      reportesQueries.map(q => getDocs(q))
    );

    const auditorias = [];
    const processedIds = new Set();

    snapshots.forEach((result) => {
      if (result.status !== 'fulfilled') return;
      
      result.value.forEach((docSnapshot) => {
        if (processedIds.has(docSnapshot.id)) return;
        processedIds.add(docSnapshot.id);

        const data = docSnapshot.data();
        
        // FILTRAR POR EMPRESA: Verificar que la auditoría pertenezca a la empresa correcta
        // Solo filtrar si el reporte tiene algún campo de empresa definido
        // Si no tiene empresaId/empresa, confiamos en que la sucursal ya filtra correctamente
        if (empresaId) {
          // Solo filtrar si el reporte tiene algún campo de empresa
          const tieneEmpresa = data.empresaId || 
                              (data.empresa && typeof data.empresa !== 'string') || 
                              (typeof data.empresa === 'object' && data.empresa !== null);
          
          if (tieneEmpresa) {
            const empresaMatch = 
              data.empresaId === empresaId ||
              (typeof data.empresa === 'string' && data.empresa === empresaId) ||
              (typeof data.empresa === 'object' && data.empresa?.id === empresaId);
            
            if (!empresaMatch) {
              return; // No pertenece a esta empresa, ignorar
            }
          }
          // Si no tiene campo de empresa, no filtrar (confiar en que la sucursal ya filtra correctamente)
        }
        
        // Verificar que la auditoría sea del año actual
        const fechaCreacion = data.fechaCreacion || data.timestamp || data.fecha;
        let fecha;
        
        if (fechaCreacion?.toDate) {
          fecha = fechaCreacion.toDate();
        } else if (fechaCreacion) {
          fecha = new Date(fechaCreacion);
        } else {
          return; // Sin fecha, no contar
        }

        // Verificar que esté en el rango del año actual
        if (fecha >= inicioAño && fecha <= finAño) {
          // Verificar que la sucursal coincida
          const sucursalMatch = 
            data.sucursalId === sucursalId ||
            data.sucursal === sucursalNombre ||
            data.sucursal === sucursalId ||
            (typeof data.sucursal === 'object' && data.sucursal?.id === sucursalId) ||
            (typeof data.sucursal === 'object' && data.sucursal?.nombre === sucursalNombre);

          if (sucursalMatch && data.estado !== 'cancelada') {
            auditorias.push(docSnapshot.id);
          }
        }
      });
    });

    return auditorias.length;
  } catch (error) {
    console.error('Error calculando auditorías del año:', error);
    return 0;
  }
}

/**
 * Calcula el progreso del target anual para auditorías de una sucursal
 * @param {Object} sucursal - Objeto sucursal con targetAnualAuditorias
 * @param {number} año - Año a calcular (opcional, por defecto año actual)
 * @param {Array<Query>} reportesQueries - Array de queries de Firestore (requerido)
 * @returns {Promise<Object>} { completadas, target, porcentaje, estado }
 */
export async function calcularProgresoTargetAnualAuditorias(sucursal, año = null, reportesQueries = null) {
  if (!sucursal || !sucursal.id) {
    return { completadas: 0, target: 0, porcentaje: 0, estado: 'sin_target' };
  }

  const target = sucursal.targetAnualAuditorias || 0;
  
  if (target === 0) {
    return { completadas: 0, target: 0, porcentaje: 0, estado: 'sin_target' };
  }

  if (!reportesQueries || reportesQueries.length === 0) {
    console.warn('calcularProgresoTargetAnualAuditorias: reportesQueries es requerido');
    return { completadas: 0, target: 0, porcentaje: 0, estado: 'sin_target' };
  }

  const completadas = await getAuditoriasAñoActual(sucursal.id, sucursal.nombre, año, sucursal.empresaId, reportesQueries);
  const porcentaje = Math.round((completadas / target) * 100);

  let estado = 'sin_target';
  if (target > 0) {
    if (porcentaje >= 100) {
      estado = 'completado';
    } else if (porcentaje >= 80) {
      estado = 'bueno';
    } else if (porcentaje >= 50) {
      estado = 'regular';
    } else {
      estado = 'bajo';
    }
  }

  return { completadas, target, porcentaje, estado };
}

/**
 * Calcula el progreso de targets para múltiples sucursales
 * @param {Array} sucursales - Array de objetos sucursal
 * @param {Function} getReportesQueries - Función que recibe sucursal y retorna Array<Query> de reportes
 * @returns {Promise<Object>} Objeto con progreso por sucursalId
 */
export async function calcularProgresoTargets(sucursales, getReportesQueries = null) {
  if (!getReportesQueries || typeof getReportesQueries !== 'function') {
    console.warn('calcularProgresoTargets: getReportesQueries es requerido');
    return {};
  }

  const progresos = {};
  
  await Promise.all(
    sucursales.map(async (sucursal) => {
      const reportesQueries = getReportesQueries(sucursal);
      progresos[sucursal.id] = await calcularProgresoTarget(sucursal, reportesQueries);
    })
  );

  return progresos;
}

