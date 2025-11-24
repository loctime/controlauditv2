import { generateExcelWithXLSX } from '../../../../utils/excelOptimization';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

/**
 * Exporta accidentes a Excel con datos completos
 */
export const exportarAccidentesExcel = async (accidentes, nombreArchivo = 'accidentes', empresas = [], sucursales = []) => {
  const headers = [
    'ID',
    'Tipo',
    'Fecha y Hora',
    'Empresa',
    'Sucursal',
    'Descripción',
    'Empleados/Testigos',
    'Con Reposo',
    'Días Perdidos',
    'Fecha Inicio Reposo',
    'Fecha Cierre',
    'Cant. Imágenes',
    'Estado',
    'Fecha Creación'
  ];
  
  const data = accidentes.map(acc => {
    // Obtener nombres de empresa y sucursal
    const empresa = empresas.find(e => e.id === acc.empresaId);
    const sucursal = sucursales.find(s => s.id === acc.sucursalId);
    
    // Procesar empleados/testigos
    const involucrados = acc.tipo === 'accidente' 
      ? (acc.empleadosInvolucrados || [])
      : (acc.testigos || []);
    
    const nombresInvolucrados = involucrados.map(emp => emp.empleadoNombre).join('; ') || 'N/A';
    const conReposo = acc.tipo === 'accidente' 
      ? involucrados.filter(emp => emp.conReposo).map(emp => emp.empleadoNombre).join('; ') || 'N/A'
      : 'N/A';
    
    const diasPerdidos = acc.tipo === 'accidente' && acc.estado === 'cerrado'
      ? involucrados
          .filter(emp => emp.diasPerdidos !== undefined)
          .map(emp => `${emp.empleadoNombre}: ${emp.diasPerdidos || 0} días`)
          .join('; ') || '0'
      : 'N/A';
    
    const fechaInicioReposo = acc.tipo === 'accidente'
      ? involucrados
          .filter(emp => emp.fechaInicioReposo)
          .map(emp => {
            const fecha = emp.fechaInicioReposo?.toDate?.() || new Date(emp.fechaInicioReposo || 0);
            return `${emp.empleadoNombre}: ${fecha.toLocaleDateString()}`;
          })
          .join('; ') || 'N/A'
      : 'N/A';
    
    return [
      acc.id || '',
      acc.tipo || '',
      acc.fechaHora?.toDate?.()?.toLocaleString() || 'N/A',
      empresa?.nombre || acc.empresaId || 'N/A',
      sucursal?.nombre || acc.sucursalId || 'N/A',
      acc.descripcion || '',
      nombresInvolucrados,
      conReposo,
      diasPerdidos,
      fechaInicioReposo,
      acc.fechaCierre?.toDate?.()?.toLocaleDateString() || (acc.estado === 'cerrado' ? 'N/A' : ''),
      acc.imagenes?.length || 0,
      acc.estado || '',
      acc.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'
    ];
  });

  await generateExcelWithXLSX(null, {
    filename: `${nombreArchivo}_${new Date().toISOString().split('T')[0]}.xlsx`,
    headers,
    data
  });
};

/**
 * Exporta accidentes a PDF con datos completos
 */
export const exportarAccidentesPDF = (accidentes, nombreArchivo = 'accidentes', empresas = [], sucursales = []) => {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPosition = 20;
  const margin = 14;
  
  // Título
  doc.setFontSize(16);
  doc.text('Reporte de Accidentes e Incidentes', margin, yPosition);
  
  // Fecha de generación
  doc.setFontSize(10);
  yPosition += 10;
  doc.text(`Generado: ${new Date().toLocaleString()}`, margin, yPosition);
  doc.text(`Total de registros: ${accidentes.length}`, margin, yPosition + 5);
  
  yPosition += 15;
  
  // Tabla resumida
  const tableData = accidentes.map(acc => {
    const empresa = empresas.find(e => e.id === acc.empresaId);
    const sucursal = sucursales.find(s => s.id === acc.sucursalId);
    const involucrados = acc.tipo === 'accidente' 
      ? (acc.empleadosInvolucrados || [])
      : (acc.testigos || []);
    const nombresInvolucrados = involucrados.map(emp => emp.empleadoNombre).join(', ');
    
    return [
      acc.tipo || '',
      acc.fechaHora?.toDate?.()?.toLocaleDateString() || 'N/A',
      (empresa?.nombre || acc.empresaId || 'N/A').substring(0, 20),
      (sucursal?.nombre || acc.sucursalId || 'N/A').substring(0, 20),
      (acc.descripcion || '').substring(0, 30) + (acc.descripcion?.length > 30 ? '...' : ''),
      nombresInvolucrados.substring(0, 25) + (nombresInvolucrados.length > 25 ? '...' : '') || 'N/A',
      acc.estado || ''
    ];
  });

  doc.autoTable({
    startY: yPosition,
    head: [['Tipo', 'Fecha', 'Empresa', 'Sucursal', 'Descripción', 'Involucrados', 'Estado']],
    body: tableData,
    styles: { fontSize: 7 },
    headStyles: { fillColor: [22, 101, 192], fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 20 },
      1: { cellWidth: 25 },
      2: { cellWidth: 30 },
      3: { cellWidth: 30 },
      4: { cellWidth: 40 },
      5: { cellWidth: 35 },
      6: { cellWidth: 20 }
    }
  });

  // Agregar detalles adicionales por accidente si hay espacio
  let currentY = doc.lastAutoTable.finalY + 10;
  
  if (currentY < pageHeight - 50 && accidentes.length <= 5) {
    accidentes.forEach((acc, index) => {
      if (currentY > pageHeight - 60) {
        doc.addPage();
        currentY = 20;
      }
      
      const empresaNombre = empresas.find(e => e.id === acc.empresaId)?.nombre || acc.empresaId || 'N/A';
      const sucursalNombre = sucursales.find(s => s.id === acc.sucursalId)?.nombre || acc.sucursalId || 'N/A';
      
      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.text(`${acc.tipo.toUpperCase()} #${index + 1}`, margin, currentY);
      
      currentY += 7;
      doc.setFontSize(8);
      doc.setFont(undefined, 'normal');
      doc.text(`ID: ${acc.id}`, margin, currentY);
      currentY += 5;
      doc.text(`Empresa: ${empresaNombre}`, margin, currentY);
      currentY += 5;
      doc.text(`Sucursal: ${sucursalNombre}`, margin, currentY);
      currentY += 5;
      doc.text(`Descripción: ${acc.descripcion || 'N/A'}`, margin, currentY);
      currentY += 5;
      
      if (acc.tipo === 'accidente' && acc.empleadosInvolucrados?.length > 0) {
        doc.text(`Empleados: ${acc.empleadosInvolucrados.map(e => e.empleadoNombre).join(', ')}`, margin, currentY);
        currentY += 5;
        const conReposo = acc.empleadosInvolucrados.filter(e => e.conReposo);
        if (conReposo.length > 0) {
          doc.text(`Con reposo: ${conReposo.map(e => e.empleadoNombre).join(', ')}`, margin, currentY);
          currentY += 5;
          if (acc.estado === 'cerrado') {
            const diasPerdidos = conReposo.map(e => `${e.empleadoNombre}: ${e.diasPerdidos || 0} días`).join(', ');
            doc.text(`Días perdidos: ${diasPerdidos}`, margin, currentY);
            currentY += 5;
          }
        }
      } else if (acc.testigos?.length > 0) {
        doc.text(`Testigos: ${acc.testigos.map(t => t.empleadoNombre).join(', ')}`, margin, currentY);
        currentY += 5;
      }
      
      if (acc.imagenes?.length > 0) {
        doc.text(`Imágenes: ${acc.imagenes.length}`, margin, currentY);
        currentY += 5;
      }
      
      if (acc.fechaCierre) {
        const fechaCierre = acc.fechaCierre?.toDate?.() || new Date(acc.fechaCierre || 0);
        doc.text(`Fecha cierre: ${fechaCierre.toLocaleDateString()}`, margin, currentY);
        currentY += 5;
      }
      
      currentY += 5; // Espacio entre accidentes
    });
  }

  doc.save(`${nombreArchivo}_${new Date().toISOString().split('T')[0]}.pdf`);
};

