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

    // Crear mapa de sucursales para acceso rápido
    const sucursalesMap = new Map();
    if (Array.isArray(sucursales)) {
      sucursales.forEach(s => sucursalesMap.set(s.id, s));
    } else if (sucursales) {
      sucursalesMap.set(sucursales.id, sucursales);
    }
    
    // Calcular promedio mensual de trabajadores expuestos (para Índice de Incidencia)
    // Según estándares OSHA/ILO: promedio de trabajadores que estuvieron expuestos durante el período
    const calcularPromedioMensualTrabajadores = (empleados, inicio, fin) => {
      if (!inicio) return empleados.length; // Si no hay período definido, usar total
      
      const meses = [];
      const fechaInicio = new Date(inicio);
      const fechaFin = new Date(fin);
      
      // Iterar mes por mes
      let fechaActual = new Date(fechaInicio.getFullYear(), fechaInicio.getMonth(), 1);
      
      while (fechaActual <= fechaFin) {
        const inicioMes = new Date(fechaActual.getFullYear(), fechaActual.getMonth(), 1);
        const finMes = new Date(fechaActual.getFullYear(), fechaActual.getMonth() + 1, 0, 23, 59, 59);
        
        // Contar empleados que estaban activos en este mes (se crearon antes o durante el mes)
        // Usamos createdAt (fecha de creación del registro) en lugar de fechaIngreso
        // para asegurar que solo contemos desde que tenemos datos reales del empleado
        const trabajadoresEnMes = empleados.filter(emp => {
          // Priorizar createdAt, fallback a fechaIngreso solo para compatibilidad con datos antiguos
          const fechaReferencia = emp.createdAt?.toDate 
            ? emp.createdAt.toDate() 
            : (emp.createdAt ? new Date(emp.createdAt) : null) ||
              (emp.fechaIngreso?.toDate 
                ? emp.fechaIngreso.toDate() 
                : (emp.fechaIngreso ? new Date(emp.fechaIngreso) : null));
          
          // El empleado cuenta si se creó su registro antes o durante este mes
          // (No consideramos fecha de egreso porque no existe en el modelo actual)
          return fechaReferencia && fechaReferencia <= finMes;
        }).length;
        
        meses.push(trabajadoresEnMes);
        fechaActual.setMonth(fechaActual.getMonth() + 1);
      }
      
      // Calcular promedio
      if (meses.length === 0) return empleados.length;
      return meses.reduce((a, b) => a + b, 0) / meses.length;
    };
    
    const promedioTrabajadores = calcularPromedioMensualTrabajadores(empleados, inicio, fin);
    
    // Calcular horas trabajadas REALES considerando fecha de creación del registro y días perdidos por accidentes
    // Usamos createdAt (fecha de creación) en lugar de fechaIngreso para asegurar que solo contemos
    // desde que tenemos datos reales del empleado en el sistema
    // Primero necesitamos calcular días perdidos para saber qué descontar
    let horasTrabajadas = 0;
    
    // Calcular horas trabajadas por cada empleado según su período de trabajo
    empleados.forEach(empleado => {
      const sucursal = sucursalesMap.get(empleado.sucursalId);
      const horasSemanales = sucursal?.horasSemanales || 40;
      const horasPorDiaEmpleado = horasSemanales / 5;
      
      // Usar createdAt (fecha de creación del registro) como referencia principal
      // Fallback a fechaIngreso solo para compatibilidad con datos antiguos
      const fechaReferencia = empleado.createdAt?.toDate 
        ? empleado.createdAt.toDate() 
        : (empleado.createdAt ? new Date(empleado.createdAt) : null) ||
          (empleado.fechaIngreso?.toDate 
            ? empleado.fechaIngreso.toDate() 
            : (empleado.fechaIngreso ? new Date(empleado.fechaIngreso) : inicio));
      
      // Calcular días trabajados del empleado en el período
      let diasTrabajados = diasLaborales;
      
      // Si se creó el registro después del inicio del período, reducir días
      // Esto asegura que no contemos días antes de tener datos reales del empleado
      if (fechaReferencia > inicio) {
        const diasDesdeCreacion = Math.ceil((fin - fechaReferencia) / (1000 * 60 * 60 * 24));
        const diasLaboralesDesdeCreacion = Math.floor(diasDesdeCreacion / 7) * 5;
        diasTrabajados = Math.max(0, diasLaboralesDesdeCreacion);
      }
      
      // Las horas perdidas por accidentes se descontarán después cuando calculemos los días perdidos
      horasTrabajadas += diasTrabajados * horasPorDiaEmpleado;
    });

    // 🎯 FILTRAR ACCIDENTES DEL PERÍODO (para IF, II, IG y TA) - SEGÚN ESTÁNDARES OSHA
    const accidentsInPeriod = inicio ? accidentes.filter(acc => {
      const accidentDate = acc.fechaHora?.toDate ? acc.fechaHora.toDate() : new Date(acc.fechaHora);
      return accidentDate >= inicio && accidentDate <= fin;
    }) : accidentes;
    
    // Calcular días sin accidentes (desde el último accidente hasta hoy)
    const calcularDiasSinAccidentes = (accidentes) => {
      if (!accidentes || accidentes.length === 0) {
        // Si no hay accidentes, calcular días desde el inicio del período o desde que empezó el sistema
        const fechaReferencia = inicio || new Date(2020, 0, 1); // Usar inicio del período o fecha por defecto
        return Math.floor((new Date() - fechaReferencia) / (1000 * 60 * 60 * 24));
      }
      
      // Buscar el último accidente (considerando todos los accidentes, no solo del período)
      const ultimoAccidente = accidentes.reduce((masReciente, acc) => {
        const fechaAcc = acc.fechaHora?.toDate ? acc.fechaHora.toDate() : new Date(acc.fechaHora);
        return fechaAcc > masReciente ? fechaAcc : masReciente;
      }, new Date(0));
      
      const diasTranscurridos = Math.floor((new Date() - ultimoAccidente) / (1000 * 60 * 60 * 24));
      return Math.max(0, diasTranscurridos);
    };
    
    const diasSinAccidentes = calcularDiasSinAccidentes(accidentes);
    
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
              const horasPerdidasEmpleado = diasPerdidosEmpleado * horasPorDiaEmp;
              horasPerdidasPorAccidentes += horasPerdidasEmpleado;
              
              // Descontar horas perdidas de horas trabajadas
              horasTrabajadas -= horasPerdidasEmpleado;
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

    // 3. Índice de Incidencia (II) - Usando promedio mensual de trabajadores expuestos
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
        promedioTrabajadores: Math.round(promedioTrabajadores * 100) / 100,
        horasTrabajadas: Math.round(horasTrabajadas),
        horasPerdidas: Math.round(horasPerdidasPorAccidentes),
        accidentesConTiempoPerdido,
        diasPerdidos,
        diasSinAccidentes
      }
    };
  }, [calcularPeriodo]);

  return { calcularIndices, calcularPeriodo };
};

