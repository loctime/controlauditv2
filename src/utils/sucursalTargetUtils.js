// src/utils/sucursalTargetUtils.js
import { collection, query, where, getDocs, Timestamp, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

/**
 * Calcula el número de auditorías completadas en el mes actual para una sucursal
 * @param {string} sucursalId - ID de la sucursal
 * @param {string} sucursalNombre - Nombre de la sucursal (opcional, para búsqueda más precisa)
 * @param {string} empresaId - ID de la empresa (opcional, pero recomendado para filtrar correctamente)
 * @returns {Promise<number>} Número de auditorías del mes actual
 */
export async function getAuditoriasMesActual(sucursalId, sucursalNombre = null, empresaId = null) {
  try {
    if (!sucursalId) return 0;

    // Obtener inicio y fin del mes actual
    const ahora = new Date();
    const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
    const finMes = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0, 23, 59, 59, 999);

    // Buscar en la colección 'reportes' (donde se guardan las auditorías)
    const reportesRef = collection(db, 'reportes');
    
    // Obtener el nombre de la sucursal y empresaId si no se proporciona
    if (sucursalId) {
      try {
        const sucursalDoc = await getDoc(doc(db, 'sucursales', sucursalId));
        if (sucursalDoc.exists()) {
          const sucursalData = sucursalDoc.data();
          if (!sucursalNombre) {
            sucursalNombre = sucursalData.nombre;
          }
          if (!empresaId && sucursalData.empresaId) {
            empresaId = sucursalData.empresaId;
          }
        }
      } catch (e) {
        console.warn('No se pudo obtener datos de sucursal:', e);
      }
    }

    // Construir queries - siempre incluir todas las opciones para mayor compatibilidad
    const queries = [];

    // Intentar query combinada si tenemos empresaId (más eficiente si existe índice)
    if (empresaId) {
      try {
        queries.push(
          query(reportesRef, where('empresaId', '==', empresaId), where('sucursalId', '==', sucursalId))
        );
      } catch (e) {
        // Si falla por falta de índice compuesto, continuamos con queries simples
        console.warn('Query combinada no disponible (índice faltante), usando queries simples:', e);
      }
    }

    // Siempre agregar queries simples como fallback (necesarias porque algunos reportes pueden usar 'sucursal' string)
    queries.push(query(reportesRef, where('sucursalId', '==', sucursalId)));
    
    // Buscar por nombre de sucursal (puede estar guardado como string)
    if (sucursalNombre) {
      queries.push(query(reportesRef, where('sucursal', '==', sucursalNombre)));
    }
    
    // Si tenemos empresaId, también buscar por empresaId + nombre de sucursal
    if (empresaId && sucursalNombre) {
      try {
        queries.push(
          query(reportesRef, where('empresaId', '==', empresaId), where('sucursal', '==', sucursalNombre))
        );
      } catch (e) {
        // Si falla, no es crítico, ya tenemos otras queries
      }
    }

    const snapshots = await Promise.allSettled(
      queries.map(q => getDocs(q))
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
 * @returns {Promise<Object>} { completadas, target, porcentaje, estado }
 */
export async function calcularProgresoTarget(sucursal) {
  if (!sucursal || !sucursal.id) {
    return { completadas: 0, target: 0, porcentaje: 0, estado: 'sin_target' };
  }

  const target = sucursal.targetMensual || 0;
  
  if (target === 0) {
    return { completadas: 0, target: 0, porcentaje: 0, estado: 'sin_target' };
  }

  const completadas = await getAuditoriasMesActual(sucursal.id, sucursal.nombre, sucursal.empresaId);
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
 * @returns {Promise<number>} Número de auditorías del año
 */
export async function getAuditoriasAñoActual(sucursalId, sucursalNombre = null, año = null, empresaId = null) {
  try {
    if (!sucursalId) return 0;

    const añoActual = año || new Date().getFullYear();
    const inicioAño = new Date(añoActual, 0, 1);
    const finAño = new Date(añoActual, 11, 31, 23, 59, 59, 999);

    // Buscar en la colección 'reportes' (donde se guardan las auditorías)
    const reportesRef = collection(db, 'reportes');
    
    // Obtener el nombre de la sucursal y empresaId si no se proporciona
    if (sucursalId) {
      try {
        const sucursalDoc = await getDoc(doc(db, 'sucursales', sucursalId));
        if (sucursalDoc.exists()) {
          const sucursalData = sucursalDoc.data();
          if (!sucursalNombre) {
            sucursalNombre = sucursalData.nombre;
          }
          if (!empresaId && sucursalData.empresaId) {
            empresaId = sucursalData.empresaId;
          }
        }
      } catch (e) {
        console.warn('No se pudo obtener datos de sucursal:', e);
      }
    }

    // Construir queries - siempre incluir todas las opciones para mayor compatibilidad
    const queries = [];

    // Intentar query combinada si tenemos empresaId (más eficiente si existe índice)
    if (empresaId) {
      try {
        queries.push(
          query(reportesRef, where('empresaId', '==', empresaId), where('sucursalId', '==', sucursalId))
        );
      } catch (e) {
        // Si falla por falta de índice compuesto, continuamos con queries simples
        console.warn('Query combinada no disponible (índice faltante), usando queries simples:', e);
      }
    }

    // Siempre agregar queries simples como fallback (necesarias porque algunos reportes pueden usar 'sucursal' string)
    queries.push(query(reportesRef, where('sucursalId', '==', sucursalId)));
    
    // Buscar por nombre de sucursal (puede estar guardado como string)
    if (sucursalNombre) {
      queries.push(query(reportesRef, where('sucursal', '==', sucursalNombre)));
    }
    
    // Si tenemos empresaId, también buscar por empresaId + nombre de sucursal
    if (empresaId && sucursalNombre) {
      try {
        queries.push(
          query(reportesRef, where('empresaId', '==', empresaId), where('sucursal', '==', sucursalNombre))
        );
      } catch (e) {
        // Si falla, no es crítico, ya tenemos otras queries
      }
    }

    const snapshots = await Promise.allSettled(
      queries.map(q => getDocs(q))
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
 * @returns {Promise<Object>} { completadas, target, porcentaje, estado }
 */
export async function calcularProgresoTargetAnualAuditorias(sucursal, año = null) {
  if (!sucursal || !sucursal.id) {
    return { completadas: 0, target: 0, porcentaje: 0, estado: 'sin_target' };
  }

  const target = sucursal.targetAnualAuditorias || 0;
  
  if (target === 0) {
    return { completadas: 0, target: 0, porcentaje: 0, estado: 'sin_target' };
  }

  const completadas = await getAuditoriasAñoActual(sucursal.id, sucursal.nombre, año, sucursal.empresaId);
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
 * @returns {Promise<Object>} Objeto con progreso por sucursalId
 */
export async function calcularProgresoTargets(sucursales) {
  const progresos = {};
  
  await Promise.all(
    sucursales.map(async (sucursal) => {
      progresos[sucursal.id] = await calcularProgresoTarget(sucursal);
    })
  );

  return progresos;
}

