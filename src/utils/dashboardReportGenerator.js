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
  opciones = {
    comparacionAnoAnterior: true,
    distribucionPorArea: true,
    capacitacionesPorTipo: true,
    horasSemanales: true
  },
  onProgress,
  // Nuevos parámetros para secciones adicionales
  targetsProgresos = {},
  accionesEstadisticas = {},
  goalsCapacitaciones = null,
  goalsAuditorias = null,
  goalsAccidentes = null,
  sucursalesBase = [],
  selectedMonth = null
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
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.line(margin, 15, pageWidth - margin, 15);
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
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
  // Requiere espacio mínimo para evitar títulos huérfanos
  const addSectionTitle = (title, size = 16, minSpaceAfter = 30) => {
    // Verificar que haya espacio suficiente para el título + contenido mínimo
    const spaceNeeded = 20 + minSpaceAfter; // Título + línea + espacio mínimo
    if (yPosition + spaceNeeded > pageHeight - 30) {
      addNewPage();
    }
    doc.setFontSize(size);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(title, margin, yPosition);
    yPosition += 8;
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.8);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 5;
  };

  // ========== PORTADA ==========
  onProgress?.(5);
  
  const fechaGeneracion = new Date().toLocaleDateString('es-AR', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  // Header optimizado con información lado a lado - marco grueso
  doc.setTextColor(0, 0, 0);
  
  // Calcular altura del header dinámicamente
  const tieneInfoEmpresa = empresaSeleccionada && (empresaSeleccionada.direccion || empresaSeleccionada.telefono || empresaSeleccionada.email);
  
  // Calcular altura necesaria
  let headerContentHeight = 25; // Título + empresa/sucursal
  if (tieneInfoEmpresa) {
    const infoLeft = [];
    const infoRight = [];
    if (empresaSeleccionada.direccion) infoLeft.push(1);
    if (empresaSeleccionada.telefono) infoLeft.push(1);
    if (empresaSeleccionada.email) infoRight.push(1);
    const maxLines = Math.max(infoLeft.length, infoRight.length);
    headerContentHeight += (maxLines * 6) + 2; // Info contacto
  }
  // Agregar horas semanales si está habilitado
  if (opciones.horasSemanales && sucursalSeleccionada?.horasSemanales) {
    headerContentHeight += 6;
  }
  
  headerContentHeight += 8; // Año/Fecha
  
  const headerStartY = margin - 5;
  const headerHeight = headerContentHeight + 10; // Margen interno
  
  // Título principal - más grande y claro
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('REPORTE DE SEGURIDAD E HIGIENE LABORAL', pageWidth / 2, margin + 8, { align: 'center' });
  
  // Línea 1: Empresa y Sucursal (lado a lado)
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  const empresaNombre = empresaSeleccionada?.nombre || 'Todas las empresas';
  const sucursalNombre = sucursal !== 'todas' && sucursalSeleccionada 
    ? sucursalSeleccionada.nombre 
    : sucursal === 'todas' 
      ? 'Todas las sucursales' 
      : '';
  
  doc.text(`Empresa: ${empresaNombre}`, margin + 8, margin + 16);
  if (sucursalNombre) {
    doc.text(`Sucursal: ${sucursalNombre}`, pageWidth - margin - 8, margin + 16, { align: 'right' });
  }
  
  // Línea 2: Información de contacto (lado a lado si hay)
  let yPos = margin + 23;
  
  if (tieneInfoEmpresa) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    
    const infoLeft = [];
    const infoRight = [];
    
    if (empresaSeleccionada.direccion) {
      infoLeft.push(`Dirección: ${empresaSeleccionada.direccion}`);
    }
    if (empresaSeleccionada.telefono) {
      infoLeft.push(`Teléfono: ${empresaSeleccionada.telefono}`);
    }
    if (empresaSeleccionada.email) {
      infoRight.push(`Email: ${empresaSeleccionada.email}`);
    }
    
    // Mostrar información lado a lado
    const maxLines = Math.max(infoLeft.length, infoRight.length);
    for (let i = 0; i < maxLines; i++) {
      if (infoLeft[i]) {
        doc.text(infoLeft[i], margin + 8, yPos + (i * 6));
      }
      if (infoRight[i]) {
        doc.text(infoRight[i], pageWidth - margin - 8, yPos + (i * 6), { align: 'right' });
      }
    }
    yPos += (maxLines * 6) + 2;
  } else {
    yPos = margin + 23; // Posición cuando no hay info de contacto
  }
  
  // Horas semanales si está habilitado
  if (opciones.horasSemanales && sucursalSeleccionada?.horasSemanales) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Horas Semanales: ${sucursalSeleccionada.horasSemanales}h`, margin + 8, yPos);
    yPos += 6;
  }
  
  // Línea final: Período de análisis (lado a lado) - siempre visible
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`Año: ${año}`, margin + 8, yPos + 5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text(`Fecha: ${fechaGeneracion}`, pageWidth - margin - 8, yPos + 5, { align: 'right' });
  
  // Dibujar marco del header después de calcular la altura
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(2);
  doc.rect(margin, headerStartY, contentWidth, headerHeight, 'S'); // Solo borde, sin relleno
  
  // Línea divisoria debajo del header
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(1);
  doc.line(margin, headerStartY + headerHeight, pageWidth - margin, headerStartY + headerHeight);

  // Continuar en la misma página con el contenido
  yPosition = headerStartY + headerHeight + 10;

  // ========== RESUMEN EJECUTIVO ==========
  onProgress?.(15);
  // Estimar espacio para tabla (8 filas aprox * 8mm cada una + headers)
  addSectionTitle('1. RESUMEN EJECUTIVO', 16, 70);

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
      fillColor: false, 
      textColor: 0, 
      fontStyle: 'bold',
      fontSize: 11,
      lineWidth: 0.8
    },
    bodyStyles: { fontSize: 10 },
    alternateRowStyles: { fillColor: false },
    margin: { left: margin, right: margin },
    styles: { cellPadding: 3, lineWidth: 0.3 }
  });

  yPosition = doc.lastAutoTable.finalY + 15;
  checkPageBreak(30);

  // ========== ÍNDICES TÉCNICOS ==========
  onProgress?.(25);
  // Estimar espacio para tabla (4 filas + descripciones + comparación si hay)
  const espacioIndices = opciones.comparacionAnoAnterior && indicesComparacion?.tieneComparacion ? 100 : 80;
  addSectionTitle('2. ÍNDICES TÉCNICOS DE SEGURIDAD', 16, espacioIndices);

  // Determinar columnas según si hay comparación
  const tieneComparacion = opciones.comparacionAnoAnterior && indicesComparacion?.tieneComparacion;
  const columnasIndices = tieneComparacion ? ['Índice', 'Valor', 'Año Anterior', 'Variación', 'Estado'] : ['Índice', 'Valor', 'Estado'];

  const indicesData = [
    [
      'Tasa de Ausentismo',
      `${datos.indices.tasaAusentismo.toFixed(2)}%`,
      indicesComparacion?.tasaAusentismo?.anterior !== null && indicesComparacion?.tasaAusentismo?.anterior !== undefined
        ? `${indicesComparacion.tasaAusentismo.anterior.toFixed(2)}%`
        : '-',
      indicesComparacion?.tasaAusentismo?.variacion
        ? `${indicesComparacion.tasaAusentismo.variacion.signo || ''}${indicesComparacion.tasaAusentismo.variacion.valor.toFixed(1)}%`
        : '-',
      datos.indices.tasaAusentismo > 5 ? 'Crítico' : datos.indices.tasaAusentismo > 2 ? 'Atención' : 'Excelente',
      datos.indices.tasaAusentismo > 5 ? [244, 67, 54] : datos.indices.tasaAusentismo > 2 ? [255, 152, 0] : [76, 175, 80]
    ],
    [
      'Índice de Frecuencia',
      `${datos.indices.indiceFrecuencia.toFixed(2)} acc/MMHH`,
      indicesComparacion?.indiceFrecuencia?.anterior !== null && indicesComparacion?.indiceFrecuencia?.anterior !== undefined
        ? `${indicesComparacion.indiceFrecuencia.anterior.toFixed(2)} acc/MMHH`
        : '-',
      indicesComparacion?.indiceFrecuencia?.variacion
        ? `${indicesComparacion.indiceFrecuencia.variacion.signo || ''}${indicesComparacion.indiceFrecuencia.variacion.valor.toFixed(1)}%`
        : '-',
      datos.indices.indiceFrecuencia > 10 ? 'Alto riesgo' : datos.indices.indiceFrecuencia > 5 ? 'Medio riesgo' : 'Bajo riesgo',
      datos.indices.indiceFrecuencia > 10 ? [244, 67, 54] : datos.indices.indiceFrecuencia > 5 ? [255, 152, 0] : [76, 175, 80]
    ],
    [
      'Índice de Incidencia',
      `${datos.indices.indiceIncidencia.toFixed(2)} acc/MT`,
      indicesComparacion?.indiceIncidencia?.anterior !== null && indicesComparacion?.indiceIncidencia?.anterior !== undefined
        ? `${indicesComparacion.indiceIncidencia.anterior.toFixed(2)} acc/MT`
        : '-',
      indicesComparacion?.indiceIncidencia?.variacion
        ? `${indicesComparacion.indiceIncidencia.variacion.signo || ''}${indicesComparacion.indiceIncidencia.variacion.valor.toFixed(1)}%`
        : '-',
      datos.indices.indiceIncidencia > 20 ? 'Crítico' : datos.indices.indiceIncidencia > 10 ? 'Atención' : 'Excelente',
      datos.indices.indiceIncidencia > 20 ? [244, 67, 54] : datos.indices.indiceIncidencia > 10 ? [255, 152, 0] : [76, 175, 80]
    ],
    [
      'Índice de Gravedad',
      `${datos.indices.indiceGravedad.toFixed(2)} días/MMHH`,
      indicesComparacion?.indiceGravedad?.anterior !== null && indicesComparacion?.indiceGravedad?.anterior !== undefined
        ? `${indicesComparacion.indiceGravedad.anterior.toFixed(2)} días/MMHH`
        : '-',
      indicesComparacion?.indiceGravedad?.variacion
        ? `${indicesComparacion.indiceGravedad.variacion.signo || ''}${indicesComparacion.indiceGravedad.variacion.valor.toFixed(1)}%`
        : '-',
      datos.indices.indiceGravedad > 50 ? 'Alta gravedad' : datos.indices.indiceGravedad > 25 ? 'Media gravedad' : 'Baja gravedad',
      datos.indices.indiceGravedad > 50 ? [244, 67, 54] : datos.indices.indiceGravedad > 25 ? [255, 152, 0] : [76, 175, 80]
    ]
  ];

  const bodyData = tieneComparacion
    ? indicesData.map(row => [row[0], row[1], row[2], row[3], row[4]])
    : indicesData.map(row => [row[0], row[1], row[4]]);

  doc.autoTable({
    startY: yPosition,
    head: [columnasIndices],
    body: bodyData,
    theme: 'striped',
    headStyles: { 
      fillColor: false, 
      textColor: 0, 
      fontStyle: 'bold',
      fontSize: 11,
      lineWidth: 0.8
    },
    bodyStyles: { fontSize: 10 },
    alternateRowStyles: { fillColor: false },
    columnStyles: tieneComparacion
      ? {
          3: { cellWidth: 30 },
          4: { cellWidth: 35 }
        }
      : {
          2: { cellWidth: 40 }
        },
    didParseCell: (data) => {
      if (data.row.index >= 0) {
        const rowData = indicesData[data.row.index];
        // Variación (columna 3 si hay comparación, o columna 2 si no)
        const colVariacion = tieneComparacion ? 3 : -1;
        if (colVariacion >= 0 && data.column.index === colVariacion && rowData[3] !== '-') {
          const variacion = indicesComparacion?.[
            rowData[0] === 'Tasa de Ausentismo' ? 'tasaAusentismo' :
            rowData[0] === 'Índice de Frecuencia' ? 'indiceFrecuencia' :
            rowData[0] === 'Índice de Incidencia' ? 'indiceIncidencia' :
            'indiceGravedad'
          ]?.variacion;
          
          if (variacion) {
            if (variacion.tipo === 'mejora') {
              data.cell.styles.fontStyle = 'bold';
            } else if (variacion.tipo === 'empeora') {
              data.cell.styles.fontStyle = 'bold';
            }
          }
        }
        // Estado (última columna)
        const colEstado = tieneComparacion ? 4 : 2;
        if (data.column.index === colEstado && rowData && rowData[5]) {
          if (rowData[4].includes('Crítico') || rowData[4].includes('Alto') || rowData[4].includes('Alta')) {
            data.cell.styles.textColor = [0, 0, 0];
            data.cell.styles.fontStyle = 'bold';
          } else {
            data.cell.styles.textColor = [0, 0, 0];
            data.cell.styles.fontStyle = 'normal';
          }
        }
      }
    },
    margin: { left: margin, right: margin },
    styles: { cellPadding: 3, lineWidth: 0.3 }
  });

  yPosition = doc.lastAutoTable.finalY + 15;
  checkPageBreak(40);

  // Agregar descripciones de los índices
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
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

  // ========== TARGETS MENSUALES ==========
  onProgress?.(35);
  if (targetsProgresos && Object.keys(targetsProgresos).length > 0) {
    const mesNombre = selectedMonth 
      ? new Date(año, selectedMonth - 1).toLocaleString('es-ES', { month: 'long' })
      : 'Actual';
    
    addSectionTitle(`3. TARGETS MENSUALES - ${mesNombre.toUpperCase()}`, 16, 50);

    const targetsData = [];
    const sucursalesConTarget = sucursalesBase.filter(s => {
      const progreso = targetsProgresos[s.id];
      return progreso && progreso.target > 0;
    });

    if (sucursalesConTarget.length > 0) {
      sucursalesConTarget.forEach(sucursal => {
        const progreso = targetsProgresos[sucursal.id];
        if (progreso) {
          const porcentaje = progreso.target > 0 
            ? Math.round((progreso.completadas / progreso.target) * 100) 
            : 0;
          const estado = porcentaje >= 100 ? 'Cumplido' 
            : porcentaje >= 80 ? 'En Progreso' 
            : porcentaje >= 50 ? 'Atención' 
            : 'Atrasado';
          
          targetsData.push([
            sucursal.nombre || 'Sin nombre',
            `${progreso.completadas} / ${progreso.target}`,
            `${porcentaje}%`,
            estado
          ]);
        }
      });

      if (targetsData.length > 0) {
        doc.autoTable({
          startY: yPosition,
          head: [['Sucursal', 'Completadas / Target', 'Cumplimiento', 'Estado']],
          body: targetsData,
          theme: 'striped',
          headStyles: { 
            fillColor: false, 
            textColor: 0, 
            fontStyle: 'bold',
            fontSize: 11,
            lineWidth: 0.8
          },
          bodyStyles: { fontSize: 10 },
          alternateRowStyles: { fillColor: false },
          margin: { left: margin, right: margin },
          styles: { cellPadding: 3, lineWidth: 0.3 },
          columnStyles: {
            1: { halign: 'center' },
            2: { halign: 'center' },
            3: { halign: 'center' }
          },
          didParseCell: (data) => {
            if (data.row.index >= 0 && data.column.index === 3) {
              const estado = data.cell.text[0];
              if (estado === 'Cumplido') {
                data.cell.styles.textColor = [76, 175, 80];
                data.cell.styles.fontStyle = 'bold';
              } else if (estado === 'Atrasado') {
                data.cell.styles.textColor = [244, 67, 54];
                data.cell.styles.fontStyle = 'bold';
              } else if (estado === 'Atención') {
                data.cell.styles.textColor = [255, 152, 0];
                data.cell.styles.fontStyle = 'bold';
              }
            }
          }
        });

        yPosition = doc.lastAutoTable.finalY + 15;
        checkPageBreak(30);
      }
    }
  }

  // ========== ACCIONES REQUERIDAS ==========
  onProgress?.(37);
  if (accionesEstadisticas && accionesEstadisticas.total > 0) {
    addSectionTitle('4. ACCIONES REQUERIDAS', 16, 50);

    const accionesData = [
      ['Total de Acciones', accionesEstadisticas.total],
      ['Pendientes', accionesEstadisticas.pendientes || 0],
      ['Vencidas', accionesEstadisticas.vencidas || 0],
      ['En Proceso', accionesEstadisticas.enProceso || 0],
      ['Completadas', accionesEstadisticas.completadas || 0],
      ['Canceladas', accionesEstadisticas.canceladas || 0]
    ];

    const porcentajeCompletadas = accionesEstadisticas.total > 0
      ? Math.round((accionesEstadisticas.completadas / accionesEstadisticas.total) * 100)
      : 0;

    doc.autoTable({
      startY: yPosition,
      head: [['Categoría', 'Cantidad']],
      body: accionesData,
      theme: 'striped',
      headStyles: { 
        fillColor: false, 
        textColor: 0, 
        fontStyle: 'bold',
        fontSize: 11,
        lineWidth: 0.8
      },
      bodyStyles: { fontSize: 10 },
      alternateRowStyles: { fillColor: false },
      margin: { left: margin, right: margin },
      styles: { cellPadding: 3, lineWidth: 0.3 },
      didParseCell: (data) => {
        if (data.row.index >= 0 && data.column.index === 1) {
          const categoria = data.row.raw[0];
          if (categoria === 'Vencidas' && parseInt(data.cell.text[0]) > 0) {
            data.cell.styles.textColor = [244, 67, 54];
            data.cell.styles.fontStyle = 'bold';
          } else if (categoria === 'Pendientes' && parseInt(data.cell.text[0]) > 0) {
            data.cell.styles.textColor = [255, 152, 0];
            data.cell.styles.fontStyle = 'bold';
          } else if (categoria === 'Completadas' && parseInt(data.cell.text[0]) > 0) {
            data.cell.styles.textColor = [76, 175, 80];
            data.cell.styles.fontStyle = 'bold';
          }
        }
      }
    });

    yPosition = doc.lastAutoTable.finalY + 10;
    checkPageBreak(15);

    // Agregar porcentaje de cumplimiento
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(`Porcentaje de Cumplimiento: ${porcentajeCompletadas}%`, margin, yPosition);
    yPosition += 8;
    checkPageBreak(30);
  }

  // ========== ANÁLISIS DE ACCIDENTES ==========
  onProgress?.(40);
  if (accidentesAnalysis) {
    // Estimar espacio para tabla (7 filas aprox)
    addSectionTitle('5. ANÁLISIS DE ACCIDENTES E INCIDENTES', 16, 60);

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
        fillColor: false, 
        textColor: 0, 
        fontStyle: 'bold',
        fontSize: 11,
        lineWidth: 0.8
      },
      bodyStyles: { fontSize: 10 },
      alternateRowStyles: { fillColor: false },
      margin: { left: margin, right: margin },
      styles: { cellPadding: 3, lineWidth: 0.3 },
      didParseCell: (data) => {
        if (data.row.index >= 0 && data.column.index === 1) {
          // Resaltar valores críticos con negrita
          if (data.cell.text[0] && typeof data.cell.text[0] === 'string') {
            const valor = parseInt(data.cell.text[0]);
            if (!isNaN(valor)) {
              if (data.row.raw[0].includes('Abiertos') && valor > 0) {
                data.cell.styles.textColor = [0, 0, 0];
                data.cell.styles.fontStyle = 'bold';
              }
            }
          }
        }
      }
    });

    yPosition = doc.lastAutoTable.finalY + 15;
    checkPageBreak(40);
    
    // Distribución por área si está habilitado
    if (opciones.distribucionPorArea && accidentesAnalysis.porArea && Object.keys(accidentesAnalysis.porArea).length > 0) {
      const porAreaData = Object.entries(accidentesAnalysis.porArea)
        .sort((a, b) => b[1].total - a[1].total)
        .slice(0, 5)
        .map(([area, datos]) => [
          area || 'Sin área',
          datos.accidentes || 0,
          datos.incidentes || 0,
          datos.total || 0
        ]);
      
      if (porAreaData.length > 0) {
        checkPageBreak(30);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text('Distribución por Área (Top 5)', margin, yPosition);
        yPosition += 8;
        
        doc.autoTable({
          startY: yPosition,
          head: [['Área', 'Accidentes', 'Incidentes', 'Total']],
          body: porAreaData,
          theme: 'striped',
          headStyles: { 
            fillColor: false, 
            textColor: 0, 
            fontStyle: 'bold',
            fontSize: 11,
            lineWidth: 0.8
          },
          bodyStyles: { fontSize: 10 },
          alternateRowStyles: { fillColor: false },
          margin: { left: margin, right: margin },
          styles: { cellPadding: 3, lineWidth: 0.3 },
          columnStyles: {
            1: { halign: 'center' },
            2: { halign: 'center' },
            3: { halign: 'center' }
          }
        });
        
        yPosition = doc.lastAutoTable.finalY + 15;
        checkPageBreak(40);
      }
    }
  }

  // ========== CAPACITACIONES ==========
  onProgress?.(55);
  if (capacitacionesMetrics) {
    // Estimar espacio para tabla (4 filas aprox)
    addSectionTitle('6. CUMPLIMIENTO DE CAPACITACIONES', 16, 50);

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
        fillColor: false, 
        textColor: 0, 
        fontStyle: 'bold',
        fontSize: 11,
        lineWidth: 0.8
      },
      bodyStyles: { fontSize: 10 },
      alternateRowStyles: { fillColor: false },
      margin: { left: margin, right: margin },
      styles: { cellPadding: 3, lineWidth: 0.3 },
      didParseCell: (data) => {
        if (data.row.index >= 0 && data.column.index === 1) {
          if (data.cell.text[0] && typeof data.cell.text[0] === 'string') {
            // Resaltar porcentaje de cumplimiento con negrita según nivel
            if (data.cell.text[0].includes('%')) {
              const porcentaje = parseFloat(data.cell.text[0]);
              data.cell.styles.textColor = [0, 0, 0];
              if (porcentaje < 60) {
                data.cell.styles.fontStyle = 'bold';
              } else if (porcentaje < 80) {
                data.cell.styles.fontStyle = 'bold';
              } else {
                data.cell.styles.fontStyle = 'normal';
              }
            }
            // Resaltar capacitaciones vencidas con negrita
            if (data.row.raw[0].includes('Vencidas')) {
              const valor = parseInt(data.cell.text[0]);
              if (!isNaN(valor) && valor > 0) {
                data.cell.styles.textColor = [0, 0, 0];
                data.cell.styles.fontStyle = 'bold';
              }
            }
          }
        }
      }
    });

    yPosition = doc.lastAutoTable.finalY + 15;
    checkPageBreak(40);
    
    // Capacitaciones por tipo si está habilitado
    if (opciones.capacitacionesPorTipo && capacitacionesMetrics?.porTipo) {
      const porTipoData = [
        ['Charlas', capacitacionesMetrics.porTipo.charlas || 0],
        ['Entrenamientos', capacitacionesMetrics.porTipo.entrenamientos || 0],
        ['Capacitaciones Formales', capacitacionesMetrics.porTipo.capacitaciones || 0]
      ];
      
      checkPageBreak(30);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('Capacitaciones por Tipo', margin, yPosition);
      yPosition += 8;
      
      doc.autoTable({
        startY: yPosition,
        head: [['Tipo', 'Cantidad']],
        body: porTipoData,
        theme: 'striped',
        headStyles: { 
          fillColor: false, 
          textColor: 0, 
          fontStyle: 'bold',
          fontSize: 11,
          lineWidth: 0.8
        },
        bodyStyles: { fontSize: 10 },
        alternateRowStyles: { fillColor: false },
        margin: { left: margin, right: margin },
        styles: { cellPadding: 3, lineWidth: 0.3 },
        columnStyles: {
          1: { halign: 'center' }
        }
      });
      
      yPosition = doc.lastAutoTable.finalY + 15;
      checkPageBreak(40);
    }
  }

  // ========== METAS Y OBJETIVOS ==========
  onProgress?.(60);
  if (goalsCapacitaciones || goalsAuditorias || goalsAccidentes) {
    addSectionTitle('7. METAS Y OBJETIVOS', 16, 80);

    const metasData = [];

    // Metas de Capacitaciones
    if (goalsCapacitaciones) {
      if (goalsCapacitaciones.mensual && goalsCapacitaciones.mensual.target > 0) {
        metasData.push([
          'Capacitaciones - Mensual',
          `${goalsCapacitaciones.mensual.completadas} / ${goalsCapacitaciones.mensual.target}`,
          `${goalsCapacitaciones.mensual.porcentaje}%`,
          goalsCapacitaciones.mensual.estado === 'cumplido' ? 'Cumplido' 
            : goalsCapacitaciones.mensual.estado === 'en_progreso' ? 'En Progreso' 
            : goalsCapacitaciones.mensual.estado === 'atrasado' ? 'Atrasado' 
            : 'Sin Target'
        ]);
      }
      if (goalsCapacitaciones.anual && goalsCapacitaciones.anual.target > 0) {
        metasData.push([
          'Capacitaciones - Anual',
          `${goalsCapacitaciones.anual.completadas} / ${goalsCapacitaciones.anual.target}`,
          `${goalsCapacitaciones.anual.porcentaje}%`,
          goalsCapacitaciones.anual.estado === 'cumplido' ? 'Cumplido' 
            : goalsCapacitaciones.anual.estado === 'en_progreso' ? 'En Progreso' 
            : goalsCapacitaciones.anual.estado === 'atrasado' ? 'Atrasado' 
            : 'Sin Target'
        ]);
      }
    }

    // Metas de Auditorías
    if (goalsAuditorias && goalsAuditorias.target > 0) {
      metasData.push([
        'Auditorías - Anual',
        `${goalsAuditorias.completadas} / ${goalsAuditorias.target}`,
        `${goalsAuditorias.porcentaje}%`,
        goalsAuditorias.estado === 'cumplido' ? 'Cumplido' 
          : goalsAuditorias.estado === 'en_progreso' ? 'En Progreso' 
          : goalsAuditorias.estado === 'atrasado' ? 'Atrasado' 
          : 'Sin Target'
      ]);
    }

    // Metas de Accidentes
    if (goalsAccidentes) {
      const estadoAccidentes = goalsAccidentes.dias >= 30 ? 'Excelente' 
        : goalsAccidentes.dias >= 7 ? 'Atención' 
        : 'Crítico';
      
      let fechaUltimoAccidenteStr = 'Nunca';
      if (goalsAccidentes.fechaUltimoAccidente) {
        try {
          const fecha = goalsAccidentes.fechaUltimoAccidente?.toDate 
            ? goalsAccidentes.fechaUltimoAccidente.toDate()
            : new Date(goalsAccidentes.fechaUltimoAccidente);
          fechaUltimoAccidenteStr = fecha.toLocaleDateString('es-AR');
        } catch (error) {
          fechaUltimoAccidenteStr = 'Fecha inválida';
        }
      }
      
      metasData.push([
        'Días sin Accidentes',
        `${goalsAccidentes.dias} días`,
        fechaUltimoAccidenteStr,
        estadoAccidentes
      ]);
    }

    if (metasData.length > 0) {
      doc.autoTable({
        startY: yPosition,
        head: [['Meta', 'Valor / Target', 'Cumplimiento', 'Estado']],
        body: metasData,
        theme: 'striped',
        headStyles: { 
          fillColor: false, 
          textColor: 0, 
          fontStyle: 'bold',
          fontSize: 11,
          lineWidth: 0.8
        },
        bodyStyles: { fontSize: 10 },
        alternateRowStyles: { fillColor: false },
        margin: { left: margin, right: margin },
        styles: { cellPadding: 3, lineWidth: 0.3 },
        columnStyles: {
          1: { halign: 'center' },
          2: { halign: 'center' },
          3: { halign: 'center' }
        },
        didParseCell: (data) => {
          if (data.row.index >= 0 && data.column.index === 3) {
            const estado = data.cell.text[0];
            if (estado === 'Cumplido' || estado === 'Excelente') {
              data.cell.styles.textColor = [76, 175, 80];
              data.cell.styles.fontStyle = 'bold';
            } else if (estado === 'Atrasado' || estado === 'Crítico') {
              data.cell.styles.textColor = [244, 67, 54];
              data.cell.styles.fontStyle = 'bold';
            } else if (estado === 'Atención') {
              data.cell.styles.textColor = [255, 152, 0];
              data.cell.styles.fontStyle = 'bold';
            } else if (estado === 'En Progreso') {
              data.cell.styles.textColor = [33, 150, 243];
              data.cell.styles.fontStyle = 'bold';
            }
          }
        }
      });

      yPosition = doc.lastAutoTable.finalY + 15;
      checkPageBreak(30);
    }
  }

  // ========== GRÁFICOS ==========
  onProgress?.(70);
  try {
    const graficosContainer = document.querySelector('[data-graficos-dashboard]');
    if (graficosContainer) {
      graficosContainer.scrollIntoView({ behavior: 'instant', block: 'start' });
      await new Promise(resolve => setTimeout(resolve, 1200));

      const originalContainerOverflow = graficosContainer.style.overflow;
      const originalContainerHeight = graficosContainer.style.height;
      graficosContainer.style.overflow = 'visible';
      graficosContainer.style.height = 'auto';

      const seccionesCapturables = Array.from(
        graficosContainer.querySelectorAll('[data-grafico-seccion]')
      ).filter((el) => el.offsetWidth > 0 && el.offsetHeight > 0);

      const secciones = seccionesCapturables.length > 0 ? seccionesCapturables : [graficosContainer];

      addSectionTitle('8. ANÁLISIS GRÁFICO', 16, 40);

      for (const section of secciones) {
        section.scrollIntoView({ behavior: 'instant', block: 'center' });
        await new Promise(resolve => setTimeout(resolve, 400));

        const originalOverflow = section.style.overflow;
        const originalHeight = section.style.height;
        section.style.overflow = 'visible';
        section.style.height = 'auto';

        const rect = section.getBoundingClientRect();

        const canvas = await html2canvas(section, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          width: rect.width,
          height: rect.height,
          windowWidth: Math.max(rect.width, window.innerWidth),
          windowHeight: Math.max(rect.height, window.innerHeight),
          scrollX: -rect.left,
          scrollY: -rect.top,
          allowTaint: true,
          removeContainer: false,
          onclone: (clonedDoc) => {
            const clonedContainer = clonedDoc.querySelector('[data-graficos-dashboard]');
            if (clonedContainer) {
              clonedContainer.style.overflow = 'visible';
              clonedContainer.style.height = 'auto';
            }
            clonedDoc.querySelectorAll('[data-grafico-seccion]').forEach((el) => {
              el.style.overflow = 'visible';
              el.style.height = 'auto';
            });
          }
        });

        section.style.overflow = originalOverflow;
        section.style.height = originalHeight;

        const imgData = canvas.toDataURL('image/png');
        const imgWidth = contentWidth;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        const tituloSeccion =
          section.getAttribute('data-grafico-title') ||
          section.dataset?.graficoTitle ||
          '';

        const spaceNeeded = imgHeight + (tituloSeccion ? 18 : 10) + 10;
        checkPageBreak(spaceNeeded);

        if (tituloSeccion) {
          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(0, 0, 0);
          doc.text(tituloSeccion, margin, yPosition);
          yPosition += 7;
        }

        doc.addImage(imgData, 'PNG', margin, yPosition, imgWidth, imgHeight);
        yPosition += imgHeight + 12;
      }

      graficosContainer.style.overflow = originalContainerOverflow;
      graficosContainer.style.height = originalContainerHeight;
    } else {
      addSectionTitle('8. ANÁLISIS GRÁFICO', 16, 10);
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'italic');
      doc.text('Nota: Los gráficos no pudieron ser capturados en este momento.', margin, yPosition);
      yPosition += 8;
    }
  } catch (error) {
    console.warn('Error al generar gráficos:', error);
    addSectionTitle('8. ANÁLISIS GRÁFICO', 16, 10);
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'italic');
    doc.text('Nota: No se pudieron incluir los gráficos en el reporte debido a un error técnico.', margin, yPosition);
    yPosition += 8;
  }

  // ========== ALERTAS Y RECOMENDACIONES ==========
  onProgress?.(85);
  // Estimar espacio para recomendaciones (múltiples líneas)
  addSectionTitle('9. ALERTAS Y RECOMENDACIONES', 16, 60);

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
    
    // Izquierda: Información confidencial
    doc.text('Información confidencial', margin, pageHeight - 10);
    
    // Derecha: Página y sistema
    const textoDerecha = `${i} / Sistema de Control de Auditoría - ControlAudit`;
    doc.text(textoDerecha, pageWidth - margin, pageHeight - 10, { align: 'right' });
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

