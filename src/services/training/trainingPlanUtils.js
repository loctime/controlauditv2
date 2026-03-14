/**
 * Utilidades puras para planes anuales (sin dependencias de Firestore).
 * Regla: el año de los ítems es SIEMPRE el año del plan; NUNCA el año siguiente.
 */

/**
 * Año a usar para nuevos planes cuando no se indica uno.
 * Siempre año calendario actual; NUNCA año siguiente.
 */
export function getCurrentCalendarYear() {
  return new Date().getFullYear();
}

/**
 * Genera los meses planificados para el plan anual (solo año calendario).
 * No usa ciclo modular: solo meses desde startMonth hasta ≤ 12.
 * No depende del año actual: solo meses 1-12. El año lo define el plan.
 * @param {number} frequencyMonths - Cada cuántos meses se repite (1-12). Si no válido, se usa 12.
 * @param {number} [startMonth=1] - Mes de inicio del ciclo (1-12). Por defecto 1 (enero).
 * @returns {number[]} Array de meses (1-12) ordenado ascendente.
 */
export function generatePlannedMonths(frequencyMonths, startMonth = 1) {
  const freq = Number(frequencyMonths);
  const start = Number(startMonth);
  const interval = freq > 0 && freq <= 12 ? freq : 12;
  const from = (start > 0 && start <= 12 ? start : 1);
  const months = [];
  for (let m = from; m <= 12; m += interval) {
    months.push(m);
  }
  if (months.some((m) => m < 1 || m > 12)) {
    throw new Error('generatePlannedMonths: todos los meses deben estar entre 1 y 12 (año del plan).');
  }
  return months;
}
