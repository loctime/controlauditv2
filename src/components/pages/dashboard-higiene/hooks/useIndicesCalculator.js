import { useCallback } from 'react';

/**
 * Hook para calcular índices técnicos de seguridad
 */
export const useIndicesCalculator = () => {
  // Calcular período de análisis basado en año
  const calcularPeriodo = useCallback((year) => {
    const ahora = new Date();
    let inicio;
    let fin;

    // Si es un número, es un año
    if (typeof year === 'number') {
      inicio = new Date(year, 0, 1); // 1 de enero del año seleccionado
      // Si es el año actual, usar fecha actual, sino usar fin de año
      if (year === ahora.getFullYear()) {
        fin = ahora;
      } else {
        fin = new Date(year, 11, 31, 23, 59, 59, 999); // 31 de diciembre del año seleccionado
      }
    } else {
      // Fallback para compatibilidad (no debería usarse)
      inicio = new Date(ahora.getFullYear(), 0, 1);
      fin = ahora;
    }

    return { inicio, fin };
  }, []);

  // Calcular índices técnicos
  const calcularIndices = useCallback((empleados, accidentes, year, sucursales) => {
    const { inicio, fin } = calcularPeriodo(year);
    const diasTotales = Math.ceil((fin - inicio) / (1000 * 60 * 60 * 24));
    
    // Calcular días laborales para el año seleccionado (5 días por semana)
    const diasLaborales = Math.floor(diasTotales / 7) * 5;
    
    // Métricas básicas
    const totalEmpleados = empleados.length;
    const empleadosActivos = empleados.filter(e => e.estado === 'activo').length;
    const empleadosEnReposo = empleados.filter(e => e.estado === 'inactivo' && e.fechaInicioReposo).length;

    // Calcular horas trabajadas por empleado según su sucursal
    // Las horas perdidas se calcularán históricamente desde los accidentes
    let horasTrabajadas = 0;
    
    // Crear mapa de sucursales para acceso rápido
    const sucursalesMap = new Map();
    if (Array.isArray(sucursales)) {
      sucursales.forEach(s => sucursalesMap.set(s.id, s));
    } else if (sucursales) {
      sucursalesMap.set(sucursales.id, sucursales);
    }
    
    // Calcular horas trabajadas por todos los empleados activos del período
    // (No contamos horas perdidas aquí, las calcularemos desde los accidentes históricos)
    empleados.forEach(empleado => {
      const sucursal = sucursalesMap.get(empleado.sucursalId);
      const horasSemanales = sucursal?.horasSemanales || 40;
      const horasPorDiaEmpleado = horasSemanales / 5;
      
      // Todos los empleados contribuyen a horas trabajadas del período
      // Las horas perdidas se calcularán desde los accidentes históricos
      horasTrabajadas += diasLaborales * horasPorDiaEmpleado;
    });

    // 🎯 FILTRAR ACCIDENTES DEL PERÍODO (para IF, II, IG y TA) - SEGÚN ESTÁNDARES OSHA
    const accidentsInPeriod = inicio ? accidentes.filter(acc => {
      const accidentDate = acc.fechaHora?.toDate ? acc.fechaHora.toDate() : new Date(acc.fechaHora);
      return accidentDate >= inicio && accidentDate <= fin;
    }) : accidentes;
    
    // IF e II: SOLO accidentes del período
    const accidentesConTiempoPerdido = accidentsInPeriod.filter(a => 
      a.tipo === 'accidente' && 
      a.empleadosInvolucrados?.some(emp => emp.conReposo === true)
    ).length;

    // IG y TA: Calcular días perdidos HISTÓRICAMENTE desde los accidentes del período
    // Esto asegura que los índices reflejen la realidad del período, no el estado actual
    let diasPerdidos = 0;
    let horasPerdidasPorAccidentes = 0;
    
    // Calcular días perdidos desde los accidentes del período
    accidentsInPeriod.forEach(accidente => {
      if (accidente.tipo === 'accidente' && accidente.empleadosInvolucrados) {
        const fechaAccidente = accidente.fechaHora?.toDate ? accidente.fechaHora.toDate() : new Date(accidente.fechaHora);
        
        accidente.empleadosInvolucrados.forEach(emp => {
          if (emp.conReposo) {
            let diasPerdidosEmpleado = 0;
            
            // Si el accidente ya tiene días perdidos guardados (cerrado), usarlos
            if (emp.diasPerdidos !== undefined && emp.diasPerdidos !== null) {
              diasPerdidosEmpleado = emp.diasPerdidos;
            } else {
              // Si no tiene días guardados (aún abierto o datos antiguos), calcularlos
              const fechaInicioReposo = emp.fechaInicioReposo?.toDate 
                ? emp.fechaInicioReposo.toDate() 
                : new Date(emp.fechaInicioReposo || fechaAccidente);
              
              // Si está cerrado y tiene fechaFinReposo, usar esa fecha
              if (emp.fechaFinReposo) {
                const fechaFinReposo = emp.fechaFinReposo?.toDate 
                  ? emp.fechaFinReposo.toDate() 
                  : new Date(emp.fechaFinReposo);
                diasPerdidosEmpleado = Math.max(0, Math.ceil((fechaFinReposo - fechaInicioReposo) / (1000 * 60 * 60 * 24)));
              } else {
                // Caso abierto: calcular hasta fin del período o fecha actual (lo que sea menor)
                const fechaFinCalculo = fin > new Date() ? new Date() : fin;
                const fechaInicioCalculo = fechaInicioReposo > inicio ? fechaInicioReposo : inicio;
                diasPerdidosEmpleado = Math.max(0, Math.ceil((fechaFinCalculo - fechaInicioCalculo) / (1000 * 60 * 60 * 24)));
              }
            }
            
            diasPerdidos += diasPerdidosEmpleado;
            
            // Calcular horas perdidas por este empleado para Tasa de Ausentismo
            // Necesitamos la sucursal del empleado para calcular horas
            const empleadoCompleto = empleados.find(e => e.id === emp.empleadoId);
            if (empleadoCompleto) {
              const sucursalEmp = sucursalesMap.get(empleadoCompleto.sucursalId);
              const horasSemanalesEmp = sucursalEmp?.horasSemanales || 40;
              const horasPorDiaEmp = horasSemanalesEmp / 5;
              horasPerdidasPorAccidentes += diasPerdidosEmpleado * horasPorDiaEmp;
            }
          }
        });
      }
    });

    // 1. Tasa de Ausentismo (TA) - Usando horas perdidas históricas desde accidentes
    const horasTotales = horasTrabajadas + horasPerdidasPorAccidentes;
    const tasaAusentismo = horasTotales > 0 ? (horasPerdidasPorAccidentes / horasTotales) * 100 : 0;

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
        horasPerdidas: horasPerdidasPorAccidentes,
        accidentesConTiempoPerdido,
        diasPerdidos
      }
    };
  }, [calcularPeriodo]);

  return { calcularIndices, calcularPeriodo };
};

