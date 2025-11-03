import { useMemo } from 'react';
import { useIndicesCalculator } from './useIndicesCalculator';

/**
 * Hook para comparar índices del año actual vs año anterior
 */
export const useIndicesComparacion = (empleados, accidentes, selectedYear, sucursales) => {
  const { calcularIndices } = useIndicesCalculator();

  const comparacion = useMemo(() => {
    if (!selectedYear || typeof selectedYear !== 'number') {
      return {
        tieneComparacion: false,
        añoActual: selectedYear,
        añoAnterior: null
      };
    }

    const añoAnterior = selectedYear - 1;
    
    // Calcular índices del año actual
    const indicesActual = calcularIndices(empleados, accidentes, selectedYear, sucursales);
    
    // Calcular índices del año anterior (solo si hay datos)
    const indicesAnterior = calcularIndices(empleados, accidentes, añoAnterior, sucursales);

    // Función para calcular variación porcentual
    const calcularVariacion = (actual, anterior) => {
      if (!anterior || anterior === 0) {
        return actual > 0 ? { valor: 100, tipo: 'nuevo' } : { valor: 0, tipo: 'sin-cambio' };
      }
      
      const variacion = ((actual - anterior) / anterior) * 100;
      const tipo = variacion < -5 ? 'mejora' : variacion > 5 ? 'empeora' : 'sin-cambio';
      
      return {
        valor: Math.round(Math.abs(variacion) * 100) / 100,
        tipo,
        signo: variacion >= 0 ? '+' : '-'
      };
    };

    // Comparar cada índice
    const compararIndice = (nombre, actual, anterior) => {
      const variacion = calcularVariacion(actual, anterior);
      return {
        nombre,
        actual: Math.round(actual * 100) / 100,
        anterior: anterior ? Math.round(anterior * 100) / 100 : null,
        variacion
      };
    };

    return {
      tieneComparacion: true,
      añoActual: selectedYear,
      añoAnterior,
      tasaAusentismo: compararIndice(
        'Tasa de Ausentismo',
        indicesActual.indices.tasaAusentismo,
        indicesAnterior.indices.tasaAusentismo
      ),
      indiceFrecuencia: compararIndice(
        'Índice de Frecuencia',
        indicesActual.indices.indiceFrecuencia,
        indicesAnterior.indices.indiceFrecuencia
      ),
      indiceIncidencia: compararIndice(
        'Índice de Incidencia',
        indicesActual.indices.indiceIncidencia,
        indicesAnterior.indices.indiceIncidencia
      ),
      indiceGravedad: compararIndice(
        'Índice de Gravedad',
        indicesActual.indices.indiceGravedad,
        indicesAnterior.indices.indiceGravedad
      )
    };
  }, [empleados, accidentes, selectedYear, sucursales, calcularIndices]);

  return comparacion;
};


