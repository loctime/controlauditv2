/**
 * Nombres de mes en español (1-12).
 * Usado para mostrar plannedMonth de forma legible.
 */
export const MONTH_NAMES_ES = {
  1: 'Enero',
  2: 'Febrero',
  3: 'Marzo',
  4: 'Abril',
  5: 'Mayo',
  6: 'Junio',
  7: 'Julio',
  8: 'Agosto',
  9: 'Septiembre',
  10: 'Octubre',
  11: 'Noviembre',
  12: 'Diciembre'
};

/**
 * Obtiene el nombre del mes en español.
 * @param {number} monthNum - Número de mes (1-12)
 * @returns {string}
 */
export function getMonthName(monthNum) {
  const n = Number(monthNum);
  return MONTH_NAMES_ES[n] || String(monthNum ?? '—');
}

/**
 * Agrupa ítems de plan anual por mes planificado.
 * @param {Array<{ plannedMonth?: number, [key: string]: any }>} items - Lista de training_plan_items
 * @returns {Record<number, Array>} Objeto con clave = número de mes (1-12), valor = array de ítems
 */
export function groupPlanItemsByMonth(items) {
  const grouped = {};
  (items || []).forEach((item) => {
    const month = Number(item.plannedMonth);
    if (month >= 1 && month <= 12) {
      if (!grouped[month]) grouped[month] = [];
      grouped[month].push(item);
    }
  });
  return grouped;
}

/**
 * Devuelve los meses que tienen ítems, ordenados ascendente (1..12).
 * @param {Record<number, Array>} grouped - Resultado de groupPlanItemsByMonth
 * @returns {number[]}
 */
export function getSortedMonths(grouped) {
  return Object.keys(grouped)
    .map(Number)
    .sort((a, b) => a - b);
}
