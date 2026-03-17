/**
 * Formato de fecha en español Argentina (DD/MM/YYYY).
 * Acepta Date, Firestore Timestamp o string.
 * @param {Date|import('firebase/firestore').Timestamp|string|null|undefined} date
 * @returns {string} Fecha formateada o "-" si no hay fecha válida
 */
/**
 * Convierte a Date: Firestore Timestamp, { _seconds, _nanoseconds }, ISO string o Date.
 * @returns {Date|null}
 */
export function toDate(value) {
  if (value == null) return null;
  if (typeof value.toDate === 'function') return value.toDate();
  if (typeof value._seconds === 'number') return new Date(value._seconds * 1000 + (value._nanoseconds || 0) / 1e6);
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatDateAR(date) {
  const d = toDate(date);
  if (!d) return '-';
  return d.toLocaleDateString('es-AR');
}
