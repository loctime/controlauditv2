import jsPDF from 'jspdf';
import 'jspdf-autotable';
import html2canvas from 'html2canvas';

/**
 * Genera un reporte PDF profesional del dashboard de seguridad e higiene
 * Incluye todas las métricas, índices, gráficos y recomendaciones
 */
export const generarReporteDashboard = async ({
  empresa,
  sucursal,
  año,
  datos,
  capacitacionesMetrics,
  accidentesAnalysis,
  indicesComparacion,
  empresaSeleccionada,
  sucursalSeleccionada,
  alertas = [],
  onProgress
}) => {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPosition = 20;
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);

  // Función helper para agregar nueva página
  const addNewPage = () => {
    doc.addPage();
    yPosition = 20;
    // Agregar header en cada página
    addPageHeader();
  };

  // Función helper para agregar header en cada página
  const addPageHeader = () => {
    doc.setDrawColor(25, 118, 210);
    doc.setLineWidth(0.5);
    doc.line(margin, 15, pageWidth - margin, 15);
    doc.setFontSize(10);
    doc.setTextColor(128, 128, 128);
    const empresaNombre = empresaSeleccionada?.nombre || 'Todas las empresas';
    doc.text(empresaNombre, margin, 12);
  };

  // Función helper para verificar si necesitamos nueva página
  const checkPageBreak = (requiredSpace) => {
    if (yPosition + requiredSpace > pageHeight - 30) {
      addNewPage();
    }
  };

  // Función helper para agregar título de sección
  const addSectionTitle = (title, size = 16) => {
    checkPageBreak(20);
    doc.setFontSize(size);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(25, 118, 210);
    doc.text(title, margin, yPosition);
    yPosition += 8;
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 5;
  };

  // ========== PORTADA ==========
  onProgress?.(5);
  
  // Fondo con degradado simulado
  doc.setFillColor(25, 118, 210);
  doc.rect(0, 0, pageWidth, 70, 'F');
  
  // Logo/Icono (simulado con texto)
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(32);
  doc.setFont('helvetica', 'bold');
  doc.text('🛡️', pageWidth / 2, 35, { align: 'center' });
  
  doc.setFontSize(24);
  doc.text('REPORTE DE SEGURIDAD', pageWidth / 2, 45, { align: 'center' });
  doc.text('E HIGIENE LABORAL', pageWidth / 2, 52, { align: 'center' });
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text(`${empresaSeleccionada?.nombre || 'Todas las empresas'}`, pageWidth / 2, 62, { align: 'center' });
  
  if (sucursal !== 'todas' && sucursalSeleccionada) {
    doc.text(`${sucursalSeleccionada.nombre}`, pageWidth / 2, 68, { align: 'center' });
  } else if (sucursal === 'todas') {
    doc.text('Todas las sucursales', pageWidth / 2, 68, { align: 'center' });
  }

  // Información del período
  doc.setFillColor(245, 245, 245);
  doc.rect(margin, 80, contentWidth, 25, 'F');
  
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Período de Análisis:', margin + 5, 88);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text(`Año: ${año}`, margin + 5, 95);
  doc.text(`Fecha de generación: ${new Date().toLocaleDateString('es-AR', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })}`, margin + 5, 100);

  // Información técnica
  doc.setFontSize(9);
  doc.setTextColor(128, 128, 128);
  doc.text('Este reporte contiene información confidencial sobre seguridad e higiene laboral.', 
    pageWidth / 2, pageHeight - 20, { align: 'center' });
  doc.text('Generado mediante Sistema de Control de Auditoría', 
    pageWidth / 2, pageHeight - 15, { align: 'center' });

  yPosition = 115;
  addNewPage();

  // ========== RESUMEN EJECUTIVO ==========
  onProgress?.(15);
  addSectionTitle('1. RESUMEN EJECUTIVO', 16);

  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  
  const resumenData = [
    ['Total de Empleados', datos.metricas.totalEmpleados.toLocaleString('es-AR')],
    ['Empleados Activos', datos.metricas.empleadosActivos.toLocaleString('es-AR')],
    ['Empleados en Reposo', datos.metricas.empleadosEnReposo.toLocaleString('es-AR')],
    ['Horas Trabajadas', datos.metricas.horasTrabajadas.toLocaleString('es-AR')],
    ['Horas Perdidas', datos.metricas.horasPerdidas.toLocaleString('es-AR')],
    ['Días sin Accidentes', datos.metricas.diasSinAccidentes.toLocaleString('es-AR')],
    ['Accidentes con Tiempo Perdido', datos.metricas.accidentesConTiempoPerdido],
    ['Días Perdidos', datos.metricas.diasPerdidos.toLocaleString('es-AR')]
  ];

  doc.autoTable({
    startY: yPosition,
    head: [['Métrica', 'Valor']],
    body: resumenData,
    theme: 'striped',
    headStyles: { 
      fillColor: [25, 118, 210], 
      textColor: 255, 
      fontStyle: 'bold',
      fontSize: 11
    },
    bodyStyles: { fontSize: 10 },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    margin: { left: margin, right: margin },
    styles: { cellPadding: 3 }
  });

  yPosition = doc.lastAutoTable.finalY + 15;
  checkPageBreak(30);

  // ========== ÍNDICES TÉCNICOS ==========
  onProgress?.(25);
  addSectionTitle('2. ÍNDICES TÉCNICOS DE SEGURIDAD', 16);

  const indicesData = [
    [
      'Tasa de Ausentismo',
      `${datos.indices.tasaAusentismo.toFixed(2)}%`,
      datos.indices.tasaAusentismo > 5 ? 'Crítico' : datos.indices.tasaAusentismo > 2 ? 'Atención' : 'Excelente',
      datos.indices.tasaAusentismo > 5 ? [244, 67, 54] : datos.indices.tasaAusentismo > 2 ? [255, 152, 0] : [76, 175, 80]
    ],
    [
      'Índice de Frecuencia',
      `${datos.indices.indiceFrecuencia.toFixed(2)} acc/MMHH`,
      datos.indices.indiceFrecuencia > 10 ? 'Alto riesgo' : datos.indices.indiceFrecuencia > 5 ? 'Medio riesgo' : 'Bajo riesgo',
      datos.indices.indiceFrecuencia > 10 ? [244, 67, 54] : datos.indices.indiceFrecuencia > 5 ? [255, 152, 0] : [76, 175, 80]
    ],
    [
      'Índice de Incidencia',
      `${datos.indices.indiceIncidencia.toFixed(2)} acc/MT`,
      datos.indices.indiceIncidencia > 20 ? 'Crítico' : datos.indices.indiceIncidencia > 10 ? 'Atención' : 'Excelente',
      datos.indices.indiceIncidencia > 20 ? [244, 67, 54] : datos.indices.indiceIncidencia > 10 ? [255, 152, 0] : [76, 175, 80]
    ],
    [
      'Índice de Gravedad',
      `${datos.indices.indiceGravedad.toFixed(2)} días/MMHH`,
      datos.indices.indiceGravedad > 50 ? 'Alta gravedad' : datos.indices.indiceGravedad > 25 ? 'Media gravedad' : 'Baja gravedad',
      datos.indices.indiceGravedad > 50 ? [244, 67, 54] : datos.indices.indiceGravedad > 25 ? [255, 152, 0] : [76, 175, 80]
    ]
  ];

  doc.autoTable({
    startY: yPosition,
    head: [['Índice', 'Valor', 'Estado']],
    body: indicesData.map(row => [row[0], row[1], row[2]]),
    theme: 'striped',
    headStyles: { 
      fillColor: [25, 118, 210], 
      textColor: 255, 
      fontStyle: 'bold',
      fontSize: 11
    },
    bodyStyles: { fontSize: 10 },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    columnStyles: {
      2: { cellWidth: 40 }
    },
    didParseCell: (data) => {
      if (data.row.index >= 0 && data.column.index === 2) {
        const rowData = indicesData[data.row.index];
        if (rowData && rowData[3]) {
          data.cell.styles.textColor = rowData[3];
          data.cell.styles.fontStyle = 'bold';
        }
      }
    },
    margin: { left: margin, right: margin },
    styles: { cellPadding: 3 }
  });

  yPosition = doc.lastAutoTable.finalY + 15;
  checkPageBreak(40);

  // Agregar descripciones de los índices
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.setFont('helvetica', 'italic');
  
  const descripciones = [
    'Tasa de Ausentismo: Porcentaje de horas perdidas por accidentes con tiempo perdido.',
    'Índice de Frecuencia: Número de accidentes con tiempo perdido por cada millón de horas hombre trabajadas.',
    'Índice de Incidencia: Número de accidentes con tiempo perdido por cada mil trabajadores.',
    'Índice de Gravedad: Días perdidos por incapacidad temporal por cada millón de horas hombre trabajadas.'
  ];

  descripciones.forEach((desc, index) => {
    checkPageBreak(8);
    doc.text(desc, margin + 5, yPosition);
    yPosition += 6;
  });

  yPosition += 5;
  checkPageBreak(40);

  // ========== ANÁLISIS DE ACCIDENTES ==========
  onProgress?.(40);
  if (accidentesAnalysis) {
    addSectionTitle('3. ANÁLISIS DE ACCIDENTES E INCIDENTES', 16);

    const accidentesData = [
      ['Total de Accidentes', accidentesAnalysis.total],
      ['Accidentes Abiertos', accidentesAnalysis.abiertos],
      ['Accidentes Cerrados', accidentesAnalysis.cerrados],
      ['Total de Incidentes', accidentesAnalysis.totalIncidentes],
      ['Ratio Incidentes/Accidentes', `${accidentesAnalysis.ratioIncidentes.toFixed(1)}:1`],
      ['Con Tiempo Perdido', accidentesAnalysis.conTiempoPerdido],
      ['Sin Tiempo Perdido', accidentesAnalysis.sinTiempoPerdido]
    ];

    doc.autoTable({
      startY: yPosition,
      head: [['Categoría', 'Cantidad']],
      body: accidentesData,
      theme: 'striped',
      headStyles: { 
        fillColor: [25, 118, 210], 
        textColor: 255, 
        fontStyle: 'bold',
        fontSize: 11
      },
      bodyStyles: { fontSize: 10 },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      margin: { left: margin, right: margin },
      styles: { cellPadding: 3 },
      didParseCell: (data) => {
        if (data.row.index >= 0 && data.column.index === 1) {
          // Resaltar valores críticos
          if (data.cell.text[0] && typeof data.cell.text[0] === 'string') {
            const valor = parseInt(data.cell.text[0]);
            if (!isNaN(valor)) {
              if (data.row.raw[0].includes('Abiertos') && valor > 0) {
                data.cell.styles.textColor = [244, 67, 54];
                data.cell.styles.fontStyle = 'bold';
              }
            }
          }
        }
      }
    });

    yPosition = doc.lastAutoTable.finalY + 15;
    checkPageBreak(40);
  }

  // ========== CAPACITACIONES ==========
  onProgress?.(55);
  if (capacitacionesMetrics) {
    addSectionTitle('4. CUMPLIMIENTO DE CAPACITACIONES', 16);

    const capacitacionesData = [
      ['Total de Capacitaciones', capacitacionesMetrics.total],
      ['Empleados Capacitados', capacitacionesMetrics.empleadosCapacitados],
      ['Porcentaje de Cumplimiento', `${capacitacionesMetrics.porcentajeCumplimiento.toFixed(1)}%`],
      ['Capacitaciones Vencidas', capacitacionesMetrics.capacitacionesVencidas]
    ];

    doc.autoTable({
      startY: yPosition,
      head: [['Métrica', 'Valor']],
      body: capacitacionesData,
      theme: 'striped',
      headStyles: { 
        fillColor: [25, 118, 210], 
        textColor: 255, 
        fontStyle: 'bold',
        fontSize: 11
      },
      bodyStyles: { fontSize: 10 },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      margin: { left: margin, right: margin },
      styles: { cellPadding: 3 },
      didParseCell: (data) => {
        if (data.row.index >= 0 && data.column.index === 1) {
          if (data.cell.text[0] && typeof data.cell.text[0] === 'string') {
            // Resaltar porcentaje de cumplimiento
            if (data.cell.text[0].includes('%')) {
              const porcentaje = parseFloat(data.cell.text[0]);
              if (porcentaje < 60) {
                data.cell.styles.textColor = [244, 67, 54];
              } else if (porcentaje < 80) {
                data.cell.styles.textColor = [255, 152, 0];
              } else {
                data.cell.styles.textColor = [76, 175, 80];
              }
              data.cell.styles.fontStyle = 'bold';
            }
            // Resaltar capacitaciones vencidas
            if (data.row.raw[0].includes('Vencidas')) {
              const valor = parseInt(data.cell.text[0]);
              if (!isNaN(valor) && valor > 0) {
                data.cell.styles.textColor = [244, 67, 54];
                data.cell.styles.fontStyle = 'bold';
              }
            }
          }
        }
      }
    });

    yPosition = doc.lastAutoTable.finalY + 15;
    checkPageBreak(40);
  }

  // ========== GRÁFICOS ==========
  onProgress?.(70);
  try {
    // Buscar contenedor de gráficos
    const graficosContainer = document.querySelector('[data-graficos-dashboard]');
    if (graficosContainer) {
      addSectionTitle('5. ANÁLISIS GRÁFICO', 16);

      // Esperar un momento para que los gráficos se rendericen
      await new Promise(resolve => setTimeout(resolve, 500));

      const canvas = await html2canvas(graficosContainer, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: graficosContainer.scrollWidth,
        windowHeight: graficosContainer.scrollHeight
      });

      const imgData = canvas.toDataURL('image/png');
      const imgWidth = contentWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      checkPageBreak(imgHeight + 10);
      
      doc.addImage(imgData, 'PNG', margin, yPosition, imgWidth, imgHeight);
      yPosition += imgHeight + 15;
    } else {
      doc.setFontSize(10);
      doc.setTextColor(128, 128, 128);
      doc.setFont('helvetica', 'italic');
      doc.text('Nota: Los gráficos no pudieron ser capturados en este momento.', margin, yPosition);
      yPosition += 8;
    }
  } catch (error) {
    console.warn('Error al generar gráficos:', error);
    doc.setFontSize(10);
    doc.setTextColor(128, 128, 128);
    doc.setFont('helvetica', 'italic');
    doc.text('Nota: No se pudieron incluir los gráficos en el reporte debido a un error técnico.', margin, yPosition);
    yPosition += 8;
  }

  // ========== ALERTAS Y RECOMENDACIONES ==========
  onProgress?.(85);
  checkPageBreak(50);
  addSectionTitle('6. ALERTAS Y RECOMENDACIONES', 16);

  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');

  // Generar recomendaciones basadas en los datos
  const recomendaciones = [];
  
  // Alertas del sistema
  if (alertas && alertas.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 152, 0);
    doc.setFontSize(11);
    doc.text('Alertas Activas:', margin, yPosition);
    yPosition += 7;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    
    alertas.forEach((alerta, index) => {
      checkPageBreak(10);
      doc.text(`• ${alerta.titulo}`, margin + 5, yPosition);
      yPosition += 5;
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text(`  ${alerta.descripcion}`, margin + 5, yPosition);
      yPosition += 6;
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
    });
    
    yPosition += 5;
  }

  // Recomendaciones basadas en datos
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(25, 118, 210);
  doc.setFontSize(11);
  checkPageBreak(15);
  doc.text('Recomendaciones Técnicas:', margin, yPosition);
  yPosition += 7;
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);

  if (datos.indices.indiceFrecuencia > 10) {
    recomendaciones.push('Implementar medidas preventivas urgentes para reducir el índice de frecuencia de accidentes');
  }
  if (datos.indices.indiceGravedad > 50) {
    recomendaciones.push('Revisar y reforzar protocolos de seguridad para reducir la gravedad de los accidentes');
  }
  if (accidentesAnalysis?.abiertos > 0) {
    recomendaciones.push(`Cerrar y documentar ${accidentesAnalysis.abiertos} accidente(s) pendiente(s) de manera urgente`);
  }
  if (capacitacionesMetrics?.porcentajeCumplimiento < 60) {
    recomendaciones.push(`Incrementar el programa de capacitaciones (actualmente ${capacitacionesMetrics.porcentajeCumplimiento.toFixed(1)}% de cumplimiento)`);
  }
  if (capacitacionesMetrics?.capacitacionesVencidas > 0) {
    recomendaciones.push(`Renovar ${capacitacionesMetrics.capacitacionesVencidas} capacitación(es) vencida(s) para mantener el cumplimiento normativo`);
  }
  if (accidentesAnalysis?.ratioIncidentes < 2) {
    recomendaciones.push('Fomentar la cultura de reporte de incidentes para mejorar la prevención proactiva');
  }
  if (datos.indices.tasaAusentismo > 5) {
    recomendaciones.push('Implementar medidas para reducir la tasa de ausentismo por accidentes');
  }

  if (recomendaciones.length === 0) {
    recomendaciones.push('Mantener las buenas prácticas actuales de seguridad e higiene');
    recomendaciones.push('Continuar con el programa de seguridad establecido');
    recomendaciones.push('Realizar seguimiento periódico de los indicadores');
  }

  recomendaciones.forEach((rec, index) => {
    checkPageBreak(8);
    doc.text(`• ${rec}`, margin + 5, yPosition);
    yPosition += 6;
  });

  // ========== FOOTER EN TODAS LAS PÁGINAS ==========
  const totalPages = doc.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Página ${i} de ${totalPages} - Generado el ${new Date().toLocaleDateString('es-AR')} - Sistema de Control de Auditoría`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }

  onProgress?.(100);

  // Generar nombre del archivo
  const nombreEmpresa = empresaSeleccionada?.nombre?.replace(/[^a-zA-Z0-9]/g, '_') || 'Todas';
  const nombreSucursal = sucursalSeleccionada?.nombre?.replace(/[^a-zA-Z0-9]/g, '_') || 'Todas';
  const fecha = new Date().toISOString().split('T')[0];
  const fileName = `Reporte_Seguridad_${nombreEmpresa}_${nombreSucursal}_${año}_${fecha}.pdf`;

  // Guardar PDF
  doc.save(fileName);

  return doc;
};

