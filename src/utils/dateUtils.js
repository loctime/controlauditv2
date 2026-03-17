/**
 * Formato de fecha en español Argentina (DD/MM/YYYY).
 * Acepta Date, Firestore Timestamp o string.
 * @param {Date|import('firebase/firestore').Timestamp|string|null|undefined} date
 * @returns {string} Fecha formateada o "-" si no hay fecha válida
 */
export function formatDateAR(date) {
  if (date == null) return '-';
  const d = typeof date.toDate === 'function' ? date.toDate() : new Date(date);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('es-AR');
}
