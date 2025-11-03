import { useMemo } from 'react';

/**
 * Hook para analizar accidentes e incidentes
 */
export const useAccidentesAnalysis = (accidentes, empleados, selectedYear) => {
  const analysis = useMemo(() => {
    if (!accidentes) {
      return {
        total: 0,
        accidentes: 0,
        incidentes: 0,
        conTiempoPerdido: 0,
        sinTiempoPerdido: 0,
        abiertos: 0,
        cerrados: 0,
        ratioIncidentes: 0,
        porArea: {},
        distribucionTipo: {
          accidentes: 0,
          incidentes: 0
        }
      };
    }

    // Calcular período
    const ahora = new Date();
    const inicio = new Date(selectedYear, 0, 1);
    const fin = selectedYear === ahora.getFullYear() ? ahora : new Date(selectedYear, 11, 31, 23, 59, 59, 999);

    // Filtrar accidentes del período
    const accidentesPeriodo = accidentes.filter(acc => {
      const fecha = acc.fechaHora?.toDate 
        ? acc.fechaHora.toDate() 
        : new Date(acc.fechaHora);
      return fecha >= inicio && fecha <= fin;
    });

    const total = accidentesPeriodo.length;

    // Separar por tipo
    const accidentesList = accidentesPeriodo.filter(a => a.tipo === 'accidente');
    const incidentesList = accidentesPeriodo.filter(a => a.tipo === 'incidente');
    const totalAccidentes = accidentesList.length;
    const totalIncidentes = incidentesList.length;

    // Separar por tiempo perdido (solo para accidentes)
    const conTiempoPerdido = accidentesList.filter(a => 
      a.empleadosInvolucrados?.some(emp => emp.conReposo === true)
    ).length;
    const sinTiempoPerdido = totalAccidentes - conTiempoPerdido;

    // Separar por estado
    const abiertos = accidentesPeriodo.filter(a => a.estado === 'abierto').length;
    const cerrados = accidentesPeriodo.filter(a => a.estado === 'cerrado').length;

    // Calcular ratio de incidentes (indicador positivo: más incidentes reportados = mejor cultura)
    const ratioIncidentes = totalAccidentes > 0 
      ? Math.round((totalIncidentes / totalAccidentes) * 100) / 100 
      : totalIncidentes;

    // Distribución por área (usando área de empleados involucrados)
    const porArea = {};
    accidentesPeriodo.forEach(acc => {
      if (acc.empleadosInvolucrados && Array.isArray(acc.empleadosInvolucrados)) {
        acc.empleadosInvolucrados.forEach(empInvolucrado => {
          // Buscar empleado completo para obtener su área
          const empleadoCompleto = empleados.find(e => e.id === empInvolucrado.empleadoId);
          const area = empleadoCompleto?.area || 'Sin área';
          
          if (!porArea[area]) {
            porArea[area] = {
              total: 0,
              accidentes: 0,
              incidentes: 0
            };
          }
          
          porArea[area].total++;
          if (acc.tipo === 'accidente') {
            porArea[area].accidentes = (porArea[area].accidentes || 0) + 1;
          } else {
            porArea[area].incidentes = (porArea[area].incidentes || 0) + 1;
          }
        });
      }
    });

    // Distribución por tipo
    const distribucionTipo = {
      accidentes: totalAccidentes,
      incidentes: totalIncidentes
    };

    return {
      total,
      accidentes: totalAccidentes,
      incidentes: totalIncidentes,
      conTiempoPerdido,
      sinTiempoPerdido,
      abiertos,
      cerrados,
      ratioIncidentes,
      porArea,
      distribucionTipo,
      // Alias para compatibilidad
      incidentesSinTiempoPerdido: totalIncidentes
    };
  }, [accidentes, empleados, selectedYear]);

  return analysis;
};

