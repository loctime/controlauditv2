import { generateExcelWithXLSX } from '../../../../utils/excelOptimization';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

/**
 * Exporta accidentes a Excel
 */
export const exportarAccidentesExcel = async (accidentes, nombreArchivo = 'accidentes') => {
  const headers = ['Tipo', 'Fecha', 'Descripción', 'Involucrados', 'Estado'];
  
  const data = accidentes.map(acc => [
    acc.tipo || '',
    acc.fechaHora?.toDate?.()?.toLocaleString() || 'N/A',
    acc.descripcion || '',
    acc.tipo === 'accidente' 
      ? (acc.empleadosInvolucrados?.length || 0)
      : (acc.testigos?.length || 0),
    acc.estado || ''
  ]);

  await generateExcelWithXLSX(null, {
    filename: `${nombreArchivo}_${new Date().toISOString().split('T')[0]}.xlsx`,
    headers,
    data
  });
};

/**
 * Exporta accidentes a PDF
 */
export const exportarAccidentesPDF = (accidentes, nombreArchivo = 'accidentes') => {
  const doc = new jsPDF('p', 'mm', 'a4');
  
  // Título
  doc.setFontSize(16);
  doc.text('Reporte de Accidentes e Incidentes', 14, 20);
  
  // Fecha de generación
  doc.setFontSize(10);
  doc.text(`Generado: ${new Date().toLocaleString()}`, 14, 30);
  
  // Preparar datos para la tabla
  const tableData = accidentes.map(acc => [
    acc.tipo || '',
    acc.fechaHora?.toDate?.()?.toLocaleDateString() || 'N/A',
    (acc.descripcion || '').substring(0, 40) + (acc.descripcion?.length > 40 ? '...' : ''),
    acc.tipo === 'accidente' 
      ? (acc.empleadosInvolucrados?.length || 0).toString()
      : (acc.testigos?.length || 0).toString(),
    acc.estado || ''
  ]);

  doc.autoTable({
    startY: 35,
    head: [['Tipo', 'Fecha', 'Descripción', 'Involucrados', 'Estado']],
    body: tableData,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [22, 101, 192] }
  });

  doc.save(`${nombreArchivo}_${new Date().toISOString().split('T')[0]}.pdf`);
};

