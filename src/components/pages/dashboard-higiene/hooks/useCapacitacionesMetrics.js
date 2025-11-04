import { useMemo } from 'react';

/**
 * Hook para calcular métricas de capacitaciones
 */
export const useCapacitacionesMetrics = (capacitaciones, empleados, selectedYear) => {
  const metrics = useMemo(() => {
    if (!capacitaciones || !empleados) {
      return {
        totalCapacitaciones: 0,
        completadas: 0,
        activas: 0,
        empleadosCapacitados: 0,
        porcentajeCumplimiento: 0,
        porTipo: {
          charlas: 0,
          entrenamientos: 0,
          capacitaciones: 0
        },
        capacitacionesVencidas: 0,
        empleadosSinCapacitar: 0
      };
    }

    // Calcular período
    const ahora = new Date();
    const inicio = new Date(selectedYear, 0, 1);
    const fin = selectedYear === ahora.getFullYear() ? ahora : new Date(selectedYear, 11, 31, 23, 59, 59, 999);

    // Filtrar capacitaciones del período
    const capacitacionesPeriodo = capacitaciones.filter(cap => {
      const fecha = cap.fechaRealizada?.toDate 
        ? cap.fechaRealizada.toDate() 
        : new Date(cap.fechaRealizada);
      return fecha >= inicio && fecha <= fin;
    });

    // Contar totales
    const totalCapacitaciones = capacitacionesPeriodo.length;
    const completadas = capacitacionesPeriodo.filter(c => c.estado === 'completada').length;
    const activas = capacitacionesPeriodo.filter(c => c.estado === 'activa').length;

    // Contar por tipo
    const porTipo = {
      charlas: capacitacionesPeriodo.filter(c => c.tipo === 'charla').length,
      entrenamientos: capacitacionesPeriodo.filter(c => c.tipo === 'entrenamiento').length,
      capacitaciones: capacitacionesPeriodo.filter(c => c.tipo === 'capacitacion').length
    };

    // Calcular empleados únicos que asistieron a al menos una capacitación
    const empleadosCapacitadosSet = new Set();
    capacitacionesPeriodo.forEach(cap => {
      if (cap.empleados && Array.isArray(cap.empleados)) {
        cap.empleados.forEach(emp => {
          if (emp.asistio === true && emp.empleadoId) {
            empleadosCapacitadosSet.add(emp.empleadoId);
          }
        });
      }
    });

    const empleadosCapacitados = empleadosCapacitadosSet.size;
    const totalEmpleados = empleados.length;
    const porcentajeCumplimiento = totalEmpleados > 0 
      ? Math.round((empleadosCapacitados / totalEmpleados) * 100 * 100) / 100 
      : 0;

    // Calcular capacitaciones vencidas (>365 días sin renovar)
    const hoy = new Date();
    const capacitacionesVencidas = empleados.filter(emp => {
      // Buscar última capacitación de este empleado
      const capacitacionesEmpleado = capacitacionesPeriodo.filter(cap => {
        return cap.empleados?.some(e => e.empleadoId === emp.id && e.asistio === true);
      });

      if (capacitacionesEmpleado.length === 0) {
        // Si nunca asistió a una capacitación, está vencido
        return true;
      }

      // Buscar la más reciente
      const masReciente = capacitacionesEmpleado.reduce((masReciente, cap) => {
        const fechaCap = cap.fechaRealizada?.toDate 
          ? cap.fechaRealizada.toDate() 
          : new Date(cap.fechaRealizada);
        return fechaCap > masReciente ? fechaCap : masReciente;
      }, new Date(0));

      // Si la más reciente es >365 días, está vencido
      const diasDesdeUltima = Math.floor((hoy - masReciente) / (1000 * 60 * 60 * 24));
      return diasDesdeUltima > 365;
    }).length;

    const empleadosSinCapacitar = totalEmpleados - empleadosCapacitados;

    return {
      totalCapacitaciones,
      completadas,
      activas,
      empleadosCapacitados,
      totalEmpleados,
      porcentajeCumplimiento,
      porTipo,
      capacitacionesVencidas,
      empleadosSinCapacitar
    };
  }, [capacitaciones, empleados, selectedYear]);

  return metrics;
};



