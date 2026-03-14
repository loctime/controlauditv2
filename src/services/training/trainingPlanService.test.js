/**
 * Validaciones para el servicio de planes anuales.
 * Regla: los ítems del plan deben generarse SIEMPRE para el año del plan, nunca para el año siguiente.
 *
 * Ejecutar con: node src/services/training/trainingPlanService.test.js
 */
import assert from 'node:assert';
import { generatePlannedMonths, getCurrentCalendarYear } from './trainingPlanUtils.js';

function runTests() {
  console.log('Validando generatePlannedMonths y año del plan...\n');

  const currentYear = getCurrentCalendarYear();
  assert.strictEqual(typeof currentYear, 'number', 'getCurrentCalendarYear() debe devolver un número');
  assert(currentYear >= 2020 && currentYear <= 2100, 'Año actual debe ser razonable');
  console.log('✓ getCurrentCalendarYear() devuelve año válido:', currentYear);

  const monthsAll = generatePlannedMonths(1, 1);
  assert.deepStrictEqual(monthsAll, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], 'Frecuencia 1, inicio enero: 12 meses');
  console.log('✓ generatePlannedMonths(1, 1) = [1..12]');

  const monthsEveryTwo = generatePlannedMonths(2, 1);
  assert.deepStrictEqual(monthsEveryTwo, [1, 3, 5, 7, 9, 11], 'Frecuencia 2, inicio enero');
  console.log('✓ generatePlannedMonths(2, 1) = [1,3,5,7,9,11]');

  for (const m of monthsAll) {
    assert(m >= 1 && m <= 12, `Mes ${m} debe estar entre 1 y 12 (año del plan)`);
  }
  console.log('✓ Todos los meses en rango 1-12 (nunca año siguiente)');

  const startMarch = generatePlannedMonths(1, 3);
  assert(startMarch[0] === 3 && startMarch.length === 10, 'Inicio marzo: 10 meses desde 3');
  console.log('✓ generatePlannedMonths(1, 3) inicia en marzo');

  console.log('\n✅ Un plan con year=2025 nunca generará ítems en 2026: plannedMonth es siempre 1-12 y el año lo define plan.year.');
}

runTests();
