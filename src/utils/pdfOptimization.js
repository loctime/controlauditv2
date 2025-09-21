// Optimización de importaciones de PDF
// Solo mantener las funciones que realmente se usan

// Función para cargar HTML2PDF de forma lazy (la única que se usa realmente)
export const loadHTML2PDF = async () => {
  const html2pdf = await import('html2pdf.js');
  return html2pdf.default;
};
