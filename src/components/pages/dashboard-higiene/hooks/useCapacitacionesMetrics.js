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
        empleadosSinCapacitar: 0,
        totalDuracionMinutos: 0,
        totalDuracionHoras: 0
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

    // Calcular capacitaciones vencidas
    // Si el registro tiene validUntil (nuevo sistema), se usa esa fecha de vencimiento.
    // Fallback legacy: empleado vencido si su última asistencia fue hace >365 días.
    const hoy = new Date();
    const capacitacionesVencidas = empleados.filter(emp => {
      // Recopilar todas las asistencias del empleado en el período
      const asistenciasEmpleado = [];
      capacitacionesPeriodo.forEach(cap => {
        (cap.empleados || []).forEach(e => {
          if (e.empleadoId === emp.id && e.asistio === true) {
            asistenciasEmpleado.push({
              validUntil: e.validUntil || null,
              fechaRealizada: cap.fechaRealizada
            });
          }
        });
      });

      if (asistenciasEmpleado.length === 0) return true;

      // Nuevo sistema: si hay validUntil, usar el más reciente para determinar si venció
      const conValidUntil = asistenciasEmpleado.filter(a => a.validUntil);
      if (conValidUntil.length > 0) {
        const latestValidUntil = conValidUntil.reduce((latest, a) => {
          const d = a.validUntil?.toDate ? a.validUntil.toDate() : new Date(a.validUntil);
          return d > latest ? d : latest;
        }, new Date(0));
        return latestValidUntil < hoy;
      }

      // Fallback legacy: vencido si última asistencia fue hace >365 días
      const masReciente = asistenciasEmpleado.reduce((latest, a) => {
        if (!a.fechaRealizada) return latest;
        const d = a.fechaRealizada?.toDate ? a.fechaRealizada.toDate() : new Date(a.fechaRealizada);
        return d > latest ? d : latest;
      }, new Date(0));
      return Math.floor((hoy - masReciente) / (1000 * 60 * 60 * 24)) > 365;
    }).length;

    const empleadosSinCapacitar = totalEmpleados - empleadosCapacitados;

    // Tiempo total de capacitación (en minutos y horas) para el período
    const totalDuracionMinutos = capacitacionesPeriodo.reduce((acum, cap) => {
      const valor = Number(cap.duracionMinutos);
      if (Number.isNaN(valor) || valor <= 0) return acum;
      return acum + valor;
    }, 0);

    const totalDuracionHoras = totalDuracionMinutos / 60;

    return {
      totalCapacitaciones,
      completadas,
      activas,
      empleadosCapacitados,
      totalEmpleados,
      porcentajeCumplimiento,
      porTipo,
      capacitacionesVencidas,
      empleadosSinCapacitar,
      totalDuracionMinutos,
      totalDuracionHoras
    };
  }, [capacitaciones, empleados, selectedYear]);

  return metrics;
};



