import { useCallback } from 'react';

/**
 * Hook para calcular índices técnicos de seguridad
 */
export const useIndicesCalculator = () => {
  // Calcular período de análisis
  const calcularPeriodo = useCallback((tipo) => {
    const ahora = new Date();
    let inicio;
    let fin;

    switch (tipo) {
      case 'semana':
        inicio = new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000);
        fin = ahora;
        break;
      case 'mes':
        inicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
        fin = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0, 23, 59, 59, 999); // Último día del mes
        break;
      case 'trimestre':
        inicio = new Date(ahora.getFullYear(), ahora.getMonth() - 2, 1);
        fin = ahora;
        break;
      case 'año':
        inicio = new Date(ahora.getFullYear(), 0, 1);
        fin = ahora;
        break;
      case 'historico':
        inicio = null; // null significa sin filtro de fecha
        fin = ahora;
        break;
      default:
        inicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
        fin = ahora;
    }

    return { inicio, fin };
  }, []);

  // Calcular índices técnicos
  const calcularIndices = useCallback((empleados, accidentes, periodo, sucursales) => {
    const { inicio, fin } = calcularPeriodo(periodo);
    const diasTotales = inicio ? Math.ceil((fin - inicio) / (1000 * 60 * 60 * 24)) : 0;
    
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
      case 'historico':
        // Calcular días laborales basado en la primera fecha de los accidentes
        if (accidentes.length > 0) {
          const fechasAccidentes = accidentes
            .map(a => a.fechaHora?.toDate ? a.fechaHora.toDate() : new Date(a.fechaHora))
            .filter(f => !isNaN(f.getTime()))
            .sort((a, b) => a - b);
          
          if (fechasAccidentes.length > 0) {
            const primeraFecha = fechasAccidentes[0];
            const diasTotalesHist = Math.ceil((fin - primeraFecha) / (1000 * 60 * 60 * 24));
            diasLaborales = Math.floor(diasTotalesHist / 7) * 5;
          } else {
            diasLaborales = Math.floor(365 / 7) * 5; // Estimado: 1 año
          }
        } else {
          diasLaborales = Math.floor(365 / 7) * 5; // Estimado: 1 año si no hay accidentes
        }
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

    // 🎯 FILTRAR ACCIDENTES DEL PERÍODO (para IF e II) - SEGÚN ESTÁNDARES OSHA
    const accidentsInPeriod = inicio ? accidentes.filter(acc => {
      const accidentDate = acc.fechaHora?.toDate ? acc.fechaHora.toDate() : new Date(acc.fechaHora);
      return accidentDate >= inicio && accidentDate <= fin;
    }) : accidentes;
    
    // IF e II: SOLO accidentes del período
    const accidentesConTiempoPerdido = accidentsInPeriod.filter(a => 
      a.tipo === 'accidente' && 
      a.empleadosInvolucrados?.some(emp => emp.conReposo === true)
    ).length;

    // IG: Calcular días perdidos CORRECTAMENTE según estándares OSHA
    // Suma TODOS los días perdidos del período, incluso si el accidente fue antes
    let diasPerdidos = 0;
    
    // Crear mapa de empleados en reposo por ID
    const empleadosEnReposoMap = new Map();
    empleados.forEach(emp => {
      if (emp.estado === 'inactivo' && emp.fechaInicioReposo) {
        empleadosEnReposoMap.set(emp.id, emp);
      }
    });
    
    // Calcular días perdidos del período para empleados que AÚN están en reposo
    empleadosEnReposoMap.forEach(emp => {
      const fechaInicioReposo = emp.fechaInicioReposo.toDate ? emp.fechaInicioReposo.toDate() : new Date(emp.fechaInicioReposo);
      const fechaFinPeriodo = fin > new Date() ? new Date() : fin;
      
      // Si el reposo continúa en el período, calcular días del período
      if (inicio && fechaInicioReposo < fechaFinPeriodo) {
        const inicioCalculo = fechaInicioReposo > inicio ? fechaInicioReposo : inicio;
        const diasEnPeriodo = Math.max(0, Math.ceil((fechaFinPeriodo - inicioCalculo) / (1000 * 60 * 60 * 24)));
        diasPerdidos += diasEnPeriodo;
      } else if (!inicio) {
        // Para histórico: desde inicio de reposo hasta fin
        const fechaFinHistorico = fin > new Date() ? new Date() : fin;
        const diasDesdeInicio = Math.ceil((fechaFinHistorico - fechaInicioReposo) / (1000 * 60 * 60 * 24));
        diasPerdidos += Math.max(0, diasDesdeInicio);
      }
    });

    // 1. Tasa de Ausentismo (TA)
    const tasaAusentismo = horasTrabajadas > 0 ? (horasPerdidas / (horasTrabajadas + horasPerdidas)) * 100 : 0;

    // 2. Índice de Frecuencia (IF)
    const indiceFrecuencia = horasTrabajadas > 0 ? (accidentesConTiempoPerdido * 1000000) / horasTrabajadas : 0;

    // 3. Índice de Incidencia (II)
    const promedioTrabajadores = empleadosActivos;
    const indiceIncidencia = promedioTrabajadores > 0 ? (accidentesConTiempoPerdido * 1000) / promedioTrabajadores : 0;

    // 4. Índice de Gravedad (IG) - OSHA standard: (días perdidos × 1,000,000) / horas trabajadas
    const indiceGravedad = horasTrabajadas > 0 ? (diasPerdidos * 1000000) / horasTrabajadas : 0;

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

