// src/utils/sucursalTargetUtils.js
import { collection, query, where, getDocs, Timestamp, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

/**
 * Calcula el número de auditorías completadas en el mes actual para una sucursal
 * @param {string} sucursalId - ID de la sucursal
 * @param {string} sucursalNombre - Nombre de la sucursal (opcional, para búsqueda más precisa)
 * @returns {Promise<number>} Número de auditorías del mes actual
 */
export async function getAuditoriasMesActual(sucursalId, sucursalNombre = null) {
  try {
    if (!sucursalId) return 0;

    // Obtener inicio y fin del mes actual
    const ahora = new Date();
    const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
    const finMes = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0, 23, 59, 59, 999);

    // Buscar en la colección 'reportes' (donde se guardan las auditorías)
    const reportesRef = collection(db, 'reportes');
    
    // Obtener el nombre de la sucursal si no se proporciona
    if (!sucursalNombre && sucursalId) {
      try {
        const sucursalDoc = await getDoc(doc(db, 'sucursales', sucursalId));
        if (sucursalDoc.exists()) {
          sucursalNombre = sucursalDoc.data().nombre;
        }
      } catch (e) {
        console.warn('No se pudo obtener nombre de sucursal:', e);
      }
    }

    // Buscar por sucursalId si existe como campo
    const queries = [
      query(reportesRef, where('sucursalId', '==', sucursalId))
    ];

    // Si tenemos el nombre, también buscar por nombre (puede estar guardado como string)
    if (sucursalNombre) {
      queries.push(query(reportesRef, where('sucursal', '==', sucursalNombre)));
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

  const completadas = await getAuditoriasMesActual(sucursal.id, sucursal.nombre);
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

