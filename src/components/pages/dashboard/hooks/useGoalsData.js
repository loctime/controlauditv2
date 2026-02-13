// src/components/pages/dashboard/hooks/useGoalsData.js
import { useState, useEffect, useMemo, useRef } from 'react';
import {
  calcularCumplimientoCapacitaciones,
  calcularCumplimientoAuditoriasAnual,
  calcularDiasSinAccidentes
} from '../../../../utils/goalsCalculationService';
import { calcularProgresoTargetAnualAuditorias } from '../../../../utils/sucursalTargetUtils';

/**
 * Hook para calcular todas las metas de una sucursal o conjunto de sucursales
 * @param {Object} params - Parámetros de configuración
 * @param {Object|Array} params.sucursal - Sucursal única o array de sucursales
 * @param {Array} params.capacitaciones - Capacitaciones (opcional, se consultan si no se pasan)
 * @param {Array} params.auditorias - Auditorías (opcional, se consultan si no se pasan)
 * @param {Array} params.accidentes - Accidentes (opcional, se consultan si no se pasan)
 * @param {number} params.año - Año a calcular (opcional, por defecto año actual)
 * @param {Object} params.periodo - { mes: number, año: number } (opcional)
 * @returns {Object} { capacitaciones, auditorias, accidentes, loading, error }
 */
export const useGoalsData = ({
  sucursal,
  capacitaciones = null,
  auditorias = null,
  accidentes = null,
  año = null,
  periodo = null
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [goalsData, setGoalsData] = useState({
    capacitaciones: null,
    auditorias: null,
    accidentes: null
  });
  const isFirstLoad = useRef(true);

  // Determinar si es una sucursal única o múltiples
  const sucursalesArray = useMemo(() => {
    if (!sucursal) return [];
    return Array.isArray(sucursal) ? sucursal : [sucursal];
  }, [sucursal]);

  useEffect(() => {
    let isMounted = true;
    let timeoutId = null;

    const calcularMetas = async () => {
      // Cancelar timeout anterior si existe
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      // Debounce: esperar 500ms antes de recalcular para evitar parpadeos
      timeoutId = setTimeout(async () => {
        if (sucursalesArray.length === 0) {
          if (isMounted) {
            setGoalsData(prev => ({
              ...prev,
              capacitaciones: null,
              auditorias: null,
              accidentes: null
            }));
            setLoading(false);
          }
          return;
        }

        // Solo mostrar loading en la primera carga
        if (isMounted && isFirstLoad.current) {
          setLoading(true);
        }
        setError(null);

      try {
        // Si hay múltiples sucursales, calcular para cada una y sumar
        if (sucursalesArray.length > 1) {
          const resultados = await Promise.all(
            sucursalesArray.map(async (suc) => {
              const [cap, aud, acc] = await Promise.all([
                calcularCumplimientoCapacitaciones(suc, capacitaciones, periodo),
                calcularProgresoTargetAnualAuditorias(suc, año),
                calcularDiasSinAccidentes(suc, accidentes)
              ]);
              return { cap, aud, acc };
            })
          );

          // Sumar resultados de todas las sucursales
          const capacitacionesAgregadas = resultados.reduce(
            (acc, r) => ({
              mensual: {
                completadas: acc.mensual.completadas + (r.cap.mensual?.completadas || 0),
                target: acc.mensual.target + (r.cap.mensual?.target || 0),
                porcentaje: 0, // Se calculará después
                estado: 'sin_target',
                capacitacionesCount: (acc.mensual.capacitacionesCount || 0) + (r.cap.mensual?.capacitacionesCount || 0)
              },
              anual: {
                completadas: acc.anual.completadas + (r.cap.anual?.completadas || 0),
                target: acc.anual.target + (r.cap.anual?.target || 0),
                porcentaje: 0, // Se calculará después
                estado: 'sin_target',
                capacitidadesCount: (acc.anual.capacitacionesCount || 0) + (r.cap.anual?.capacitacionesCount || 0)
              }
            }),
            {
              mensual: { completadas: 0, target: 0, porcentaje: 0, estado: 'sin_target', capacitidadesCount: 0 },
              anual: { completadas: 0, target: 0, porcentaje: 0, estado: 'sin_target', capacitidadesCount: 0 }
            }
          );

          // Calcular porcentajes agregados
          capacitacionesAgregadas.mensual.porcentaje =
            capacitacionesAgregadas.mensual.target > 0
              ? Math.round(
                  (capacitacionesAgregadas.mensual.completadas /
                    capacitacionesAgregadas.mensual.target) *
                    100
                )
              : 0;
          capacitacionesAgregadas.anual.porcentaje =
            capacitacionesAgregadas.anual.target > 0
              ? Math.round(
                  (capacitacionesAgregadas.anual.completadas /
                    capacitacionesAgregadas.anual.target) *
                    100
                )
              : 0;

          // Determinar estados
          capacitacionesAgregadas.mensual.estado =
            capacitacionesAgregadas.mensual.porcentaje >= 100
              ? 'cumplido'
              : capacitacionesAgregadas.mensual.porcentaje >= 50
              ? 'en_progreso'
              : 'atrasado';
          capacitacionesAgregadas.anual.estado =
            capacitacionesAgregadas.anual.porcentaje >= 100
              ? 'cumplido'
              : capacitacionesAgregadas.anual.porcentaje >= 50
              ? 'en_progreso'
              : 'atrasado';

          const auditoriasAgregadas = resultados.reduce(
            (acc, r) => ({
              completadas: acc.completadas + (r.aud.completadas || 0),
              target: acc.target + (r.aud.target || 0),
              porcentaje: 0,
              estado: 'sin_target'
            }),
            { completadas: 0, target: 0, porcentaje: 0, estado: 'sin_target' }
          );

          auditoriasAgregadas.porcentaje =
            auditoriasAgregadas.target > 0
              ? Math.round((auditoriasAgregadas.completadas / auditoriasAgregadas.target) * 100)
              : 0;
          auditoriasAgregadas.estado =
            auditoriasAgregadas.porcentaje >= 100
              ? 'cumplido'
              : auditoriasAgregadas.porcentaje >= 50
              ? 'en_progreso'
              : 'atrasado';

          // Para accidentes, usar el mínimo de días (peor caso)
          const diasMinimos = Math.min(...resultados.map(r => r.acc.dias || 0));
          const peorAccidente = resultados.find(r => r.acc.dias === diasMinimos)?.acc || resultados[0].acc;

          if (isMounted) {
            setGoalsData({
              capacitaciones: capacitacionesAgregadas,
              auditorias: auditoriasAgregadas,
              accidentes: peorAccidente
            });
            isFirstLoad.current = false;
          }
        } else {
          // Una sola sucursal
          const [sucursalUnica] = sucursalesArray;

          const [cap, aud, acc] = await Promise.all([
            calcularCumplimientoCapacitaciones(sucursalUnica, capacitaciones, periodo),
            calcularProgresoTargetAnualAuditorias(sucursalUnica, año),
            calcularDiasSinAccidentes(sucursalUnica, accidentes)
          ]);

          if (isMounted) {
            setGoalsData({
              capacitaciones: cap,
              auditorias: aud,
              accidentes: acc
            });
            isFirstLoad.current = false;
          }
        }
      } catch (err) {
        console.error('Error calculando metas:', err);
        if (isMounted) {
          setError(err.message || 'Error al calcular metas');
          // No limpiar datos en caso de error, mantener los anteriores
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
      }, 500); // Debounce de 500ms para evitar parpadeos
    };

    calcularMetas();

    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [sucursalesArray, capacitaciones, auditorias, accidentes, año, periodo]);

  return {
    ...goalsData,
    loading,
    error
  };
};
