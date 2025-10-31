import { useCallback } from 'react';

/**
 * Hook para calcular índices técnicos de seguridad
 */
export const useIndicesCalculator = () => {
  // Calcular período de análisis
  const calcularPeriodo = useCallback((tipo) => {
    const ahora = new Date();
    let inicio;

    switch (tipo) {
      case 'semana':
        inicio = new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'mes':
        inicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
        break;
      case 'trimestre':
        inicio = new Date(ahora.getFullYear(), ahora.getMonth() - 2, 1);
        break;
      case 'año':
        inicio = new Date(ahora.getFullYear(), 0, 1);
        break;
      default:
        inicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
    }

    return { inicio, fin: ahora };
  }, []);

  // Calcular índices técnicos
  const calcularIndices = useCallback((empleados, accidentes, periodo, sucursales) => {
    const { inicio, fin } = calcularPeriodo(periodo);
    const diasTotales = Math.ceil((fin - inicio) / (1000 * 60 * 60 * 24));
    
    // Calcular días laborales según el período
    let diasLaborales;
    switch (periodo) {
      case 'semana':
        diasLaborales = 5; // 5 días laborales por semana
        break;
      case 'mes':
        diasLaborales = Math.floor(diasTotales / 7) * 5; // 5 días por semana
        break;
      case 'trimestre':
        diasLaborales = Math.floor(diasTotales / 7) * 5; // 5 días por semana
        break;
      case 'año':
        diasLaborales = Math.floor(diasTotales / 7) * 5; // 5 días por semana
        break;
      default:
        diasLaborales = Math.floor(diasTotales / 7) * 5;
    }
    
    // Métricas básicas
    const totalEmpleados = empleados.length;
    const empleadosActivos = empleados.filter(e => e.estado === 'activo').length;
    const empleadosEnReposo = empleados.filter(e => e.estado === 'inactivo' && e.fechaInicioReposo).length;

    // Calcular horas trabajadas y perdidas por empleado según su sucursal
    let horasTrabajadas = 0;
    let horasPerdidas = 0;
    
    // Crear mapa de sucursales para acceso rápido
    const sucursalesMap = new Map();
    if (Array.isArray(sucursales)) {
      sucursales.forEach(s => sucursalesMap.set(s.id, s));
    } else if (sucursales) {
      sucursalesMap.set(sucursales.id, sucursales);
    }
    
    // Calcular horas por cada empleado según su sucursal
    empleados.forEach(empleado => {
      const sucursal = sucursalesMap.get(empleado.sucursalId);
      const horasSemanales = sucursal?.horasSemanales || 40;
      const horasPorDiaEmpleado = horasSemanales / 5;
      
      if (empleado.estado === 'activo') {
        horasTrabajadas += diasLaborales * horasPorDiaEmpleado;
      } else if (empleado.estado === 'inactivo' && empleado.fechaInicioReposo) {
        horasPerdidas += diasLaborales * horasPorDiaEmpleado;
      }
    });

    // Accidentes con tiempo perdido
    const accidentesConTiempoPerdido = accidentes.filter(a => 
      a.tipo === 'accidente' && 
      a.empleadosInvolucrados?.some(emp => emp.conReposo === true)
    ).length;

    // Calcular días perdidos por accidentes
    let diasPerdidos = 0;
    accidentes.forEach(accidente => {
      if (accidente.tipo === 'accidente' && accidente.empleadosInvolucrados) {
        accidente.empleadosInvolucrados.forEach(emp => {
          if (emp.conReposo && accidente.fechaHora) {
            const fechaAccidente = accidente.fechaHora.toDate ? accidente.fechaHora.toDate() : new Date(accidente.fechaHora);
            const diasDesdeAccidente = Math.ceil((fin - fechaAccidente) / (1000 * 60 * 60 * 24));
            diasPerdidos += Math.max(0, diasDesdeAccidente);
          }
        });
      }
    });

    // 1. Tasa de Ausentismo (TA)
    const tasaAusentismo = horasTrabajadas > 0 ? (horasPerdidas / (horasTrabajadas + horasPerdidas)) * 100 : 0;

    // 2. Índice de Frecuencia (IF)
    const indiceFrecuencia = horasTrabajadas > 0 ? (accidentesConTiempoPerdido * 1000000) / horasTrabajadas : 0;

    // 3. Índice de Incidencia (II)
    const promedioTrabajadores = empleadosActivos;
    const indiceIncidencia = promedioTrabajadores > 0 ? (accidentesConTiempoPerdido * 1000) / promedioTrabajadores : 0;

    // 4. Índice de Gravedad (IG)
    const indiceGravedad = horasTrabajadas > 0 ? (diasPerdidos * 1000) / horasTrabajadas : 0;

    return {
      indices: {
        tasaAusentismo: Math.round(tasaAusentismo * 100) / 100,
        indiceFrecuencia: Math.round(indiceFrecuencia * 100) / 100,
        indiceIncidencia: Math.round(indiceIncidencia * 100) / 100,
        indiceGravedad: Math.round(indiceGravedad * 100) / 100
      },
      metricas: {
        totalEmpleados,
        empleadosActivos,
        empleadosEnReposo,
        horasTrabajadas,
        horasPerdidas,
        accidentesConTiempoPerdido,
        diasPerdidos
      }
    };
  }, [calcularPeriodo]);

  return { calcularIndices, calcularPeriodo };
};

