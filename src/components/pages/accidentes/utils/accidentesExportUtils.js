import { generateExcelWithXLSX } from '../../../../utils/excelOptimization';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../../../firebaseConfig';

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
 * Carga una imagen desde URL y la convierte a base64
 */
const cargarImagen = (url) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      try {
        const dataURL = canvas.toDataURL('image/jpeg', 0.7);
        resolve(dataURL);
      } catch (error) {
        reject(error);
      }
    };
    img.onerror = reject;
    img.src = url;
  });
};

/**
 * Carga usuarios relacionados con los accidentes (quienes cerraron, editaron o reportaron)
 */
const cargarUsuariosRelacionados = async (accidentes) => {
  const userIds = new Set();
  accidentes.forEach(acc => {
    if (acc.cerradoPor) userIds.add(acc.cerradoPor);
    if (acc.editadoPor) userIds.add(acc.editadoPor);
    if (acc.reportadoPor) userIds.add(acc.reportadoPor);
  });

  if (userIds.size === 0) return [];

  const usuariosPromises = Array.from(userIds).map(async (userId) => {
    try {
      const usuarioRef = doc(db, 'usuarios', userId);
      const usuarioDoc = await getDoc(usuarioRef);
      if (usuarioDoc.exists()) {
        return { id: usuarioDoc.id, uid: usuarioDoc.id, ...usuarioDoc.data() };
      }
      return null;
    } catch (error) {
      console.error(`Error cargando usuario ${userId}:`, error);
      return null;
    }
  });

  const usuarios = await Promise.all(usuariosPromises);
  return usuarios.filter(u => u !== null);
};

/**
 * Exporta accidentes a PDF con datos completos
 */
export const exportarAccidentesPDF = async (accidentes, nombreArchivo = 'accidentes', empresas = [], sucursales = []) => {
  // Cargar usuarios relacionados
  const usuarios = await cargarUsuariosRelacionados(accidentes);
  
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
      0: { cellWidth: 18 },  // Tipo
      1: { cellWidth: 22 },  // Fecha
      2: { cellWidth: 25 },  // Empresa
      3: { cellWidth: 25 },  // Sucursal
      4: { cellWidth: 35 },  // Descripción
      5: { cellWidth: 30 },  // Involucrados
      6: { cellWidth: 18 }   // Estado
    },
    margin: { left: margin, right: margin }
  });

  // Agregar detalles adicionales por accidente
  let currentY = doc.lastAutoTable.finalY + 10;
  
  // Agregar nueva página si no hay suficiente espacio
  if (currentY > pageHeight - 50) {
    doc.addPage();
    currentY = 20;
  }
  
  // Título de sección de detalles
  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.text('Detalles de Accidentes e Incidentes', margin, currentY);
  currentY += 10;
  
  for (let index = 0; index < accidentes.length; index++) {
    const acc = accidentes[index];
    
    // Verificar si necesitamos nueva página antes de agregar un nuevo accidente
    if (currentY > pageHeight - 100) {
      doc.addPage();
      currentY = 20;
    }
    
    const empresaNombre = empresas.find(e => e.id === acc.empresaId)?.nombre || acc.empresaId || 'N/A';
    const sucursalNombre = sucursales.find(s => s.id === acc.sucursalId)?.nombre || acc.sucursalId || 'N/A';
    const fechaHora = acc.fechaHora?.toDate?.() || new Date(acc.fechaHora || 0);
    
    // Fondo de color para el encabezado según tipo y estado
    const colorFondo = acc.tipo === 'accidente' 
      ? (acc.estado === 'cerrado' ? [220, 53, 69] : [255, 193, 7]) // Rojo si cerrado, amarillo si abierto
      : (acc.estado === 'cerrado' ? [40, 167, 69] : [0, 123, 255]); // Verde si cerrado, azul si abierto
    
    // Encabezado con fondo de color (puede ser multilínea si es necesario)
    doc.setFillColor(...colorFondo);
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    const headerText = `${acc.tipo.toUpperCase()} #${index + 1} - ${acc.estado.toUpperCase()} | Fecha: ${fechaHora.toLocaleString('es-ES')} | Empresa: ${empresaNombre} | Sucursal: ${sucursalNombre}`;
    
    // Dividir el texto en líneas si es necesario
    const headerLines = doc.splitTextToSize(headerText, pageWidth - 2 * margin - 4);
    const headerHeight = Math.max(10, headerLines.length * 5 + 4);
    
    doc.roundedRect(margin, currentY - 3, pageWidth - 2 * margin, headerHeight, 2, 2, 'F');
    
    // Dibujar cada línea del header
    headerLines.forEach((line, i) => {
      doc.text(line, margin + 2, currentY + 5 + (i * 5));
    });
    
    doc.setTextColor(0, 0, 0);
    currentY += headerHeight + 2;
    
    // Calcular ancho de columnas (dos columnas)
    const anchoColumna = (pageWidth - 2 * margin - 5) / 2;
    const columnaDerecha = margin + anchoColumna + 5;
    
    // Columna izquierda
    let yIzq = currentY;
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    doc.text('INFORMACIÓN GENERAL', margin, yIzq);
    yIzq += 6;
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    
    // Fecha de creación
    const fechaCreacion = acc.createdAt?.toDate?.() || new Date(acc.createdAt || 0);
    doc.text(`Creado: ${fechaCreacion.toLocaleDateString('es-ES')}`, margin, yIzq);
    yIzq += 5;
    
    // Reportado por (cargar usuario si existe)
    if (acc.reportadoPor) {
      let nombreReporto = acc.reportadoPor;
      try {
        const usuarioReporto = usuarios.find(u => u.id === acc.reportadoPor || u.uid === acc.reportadoPor);
        if (usuarioReporto) {
          nombreReporto = usuarioReporto.displayName || usuarioReporto.email || acc.reportadoPor;
        } else {
          // Intentar cargar el usuario si no está en la lista
          const usuarioRef = doc(db, 'usuarios', acc.reportadoPor);
          const usuarioSnap = await getDoc(usuarioRef);
          if (usuarioSnap.exists()) {
            const data = usuarioSnap.data();
            nombreReporto = data.displayName || data.email || acc.reportadoPor;
          }
        }
      } catch (error) {
        console.error('Error cargando usuario que reportó:', error);
      }
      doc.text(`Reportado por: ${nombreReporto}`, margin, yIzq);
      yIzq += 5;
    }
    
    // Columna derecha
    let yDer = currentY;
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    doc.text('DESCRIPCIÓN', columnaDerecha, yDer);
    yDer += 6;
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    
    // Descripción (puede ser multilínea)
    const descripcion = acc.descripcion || 'Sin descripción';
    const descripcionLines = doc.splitTextToSize(descripcion, anchoColumna - 5);
    descripcionLines.forEach((line, i) => {
      doc.text(line, columnaDerecha, yDer + (i * 4));
    });
    yDer += Math.max(descripcionLines.length * 4, 15);
    
    // Actualizar currentY con el máximo de ambas columnas
    currentY = Math.max(yIzq, yDer) + 5;
    
    // Sección de empleados/testigos
    if (acc.tipo === 'accidente' && acc.empleadosInvolucrados?.length > 0) {
      if (currentY > pageHeight - 60) {
        doc.addPage();
        currentY = 20;
      }
      
      doc.setFontSize(9);
      doc.setFont(undefined, 'bold');
      doc.text('EMPLEADOS INVOLUCRADOS', margin, currentY);
      currentY += 7;
      doc.setFontSize(8);
      doc.setFont(undefined, 'normal');
      
      acc.empleadosInvolucrados.forEach((emp, idx) => {
        if (currentY > pageHeight - 40) {
          doc.addPage();
          currentY = 20;
        }
        
        doc.setFont(undefined, 'bold');
        doc.text(`${idx + 1}. ${emp.empleadoNombre}`, margin + 5, currentY);
        currentY += 5;
        doc.setFont(undefined, 'normal');
        
        if (emp.conReposo) {
          doc.setTextColor(220, 53, 69); // Rojo para reposo
          doc.text(`   [CON REPOSO]`, margin + 10, currentY);
          currentY += 4;
          
          if (emp.fechaInicioReposo) {
            const fechaInicio = emp.fechaInicioReposo?.toDate?.() || new Date(emp.fechaInicioReposo || 0);
            doc.text(`   Inicio: ${fechaInicio.toLocaleDateString('es-ES')}`, margin + 10, currentY);
            currentY += 4;
            
            // Calcular duración del reposo
            if (emp.fechaFinReposo) {
              const fechaFin = emp.fechaFinReposo?.toDate?.() || new Date(emp.fechaFinReposo || 0);
              const duracion = Math.ceil((fechaFin - fechaInicio) / (1000 * 60 * 60 * 24));
              doc.text(`   Fin: ${fechaFin.toLocaleDateString('es-ES')}`, margin + 10, currentY);
              currentY += 4;
              doc.setFont(undefined, 'bold');
              doc.text(`   Duracion: ${duracion} dia(s)`, margin + 10, currentY);
              currentY += 4;
            } else if (acc.estado === 'cerrado' && acc.fechaCierre) {
              const fechaCierre = acc.fechaCierre?.toDate?.() || new Date(acc.fechaCierre || 0);
              const duracion = Math.ceil((fechaCierre - fechaInicio) / (1000 * 60 * 60 * 24));
              doc.text(`   Fin: ${fechaCierre.toLocaleDateString('es-ES')}`, margin + 10, currentY);
              currentY += 4;
              doc.setFont(undefined, 'bold');
              doc.text(`   Duracion: ${duracion} dia(s)`, margin + 10, currentY);
              currentY += 4;
            }
            
            if (emp.diasPerdidos !== undefined) {
              doc.text(`   Dias perdidos: ${emp.diasPerdidos}`, margin + 10, currentY);
              currentY += 4;
            }
          }
          doc.setTextColor(0, 0, 0);
        }
        currentY += 3;
      });
    } else if (acc.testigos?.length > 0) {
      if (currentY > pageHeight - 40) {
        doc.addPage();
        currentY = 20;
      }
      
      doc.setFontSize(9);
      doc.setFont(undefined, 'bold');
      doc.text('TESTIGOS', margin, currentY);
      currentY += 7;
      doc.setFontSize(8);
      doc.setFont(undefined, 'normal');
      
      acc.testigos.forEach((testigo, idx) => {
        doc.text(`${idx + 1}. ${testigo.empleadoNombre}`, margin + 5, currentY);
        currentY += 5;
      });
    }
    
    // Información de cierre y edición
    if (acc.fechaCierre || acc.fechaEdicion) {
      if (currentY > pageHeight - 50) {
        doc.addPage();
        currentY = 20;
      }
      
      doc.setFontSize(9);
      doc.setFont(undefined, 'bold');
      doc.text('HISTORIAL', margin, currentY);
      currentY += 7;
      doc.setFontSize(8);
      doc.setFont(undefined, 'normal');
      
      if (acc.fechaCierre) {
        const fechaCierre = acc.fechaCierre?.toDate?.() || new Date(acc.fechaCierre || 0);
        doc.text(`Cerrado: ${fechaCierre.toLocaleString('es-ES')}`, margin + 5, currentY);
        currentY += 4;
        if (acc.cerradoPor) {
          const usuarioCerró = usuarios.find(u => u.id === acc.cerradoPor || u.uid === acc.cerradoPor);
          const nombreCerró = usuarioCerró?.displayName || usuarioCerró?.email || acc.cerradoPor;
          doc.text(`   Por: ${nombreCerró}`, margin + 10, currentY);
          currentY += 5;
        }
      }
      
      if (acc.fechaEdicion) {
        const fechaEdicion = acc.fechaEdicion?.toDate?.() || new Date(acc.fechaEdicion || 0);
        doc.text(`Ultima edicion: ${fechaEdicion.toLocaleString('es-ES')}`, margin + 5, currentY);
        currentY += 4;
        if (acc.editadoPor) {
          const usuarioEditó = usuarios.find(u => u.id === acc.editadoPor || u.uid === acc.editadoPor);
          const nombreEditó = usuarioEditó?.displayName || usuarioEditó?.email || acc.editadoPor;
          doc.text(`   Por: ${nombreEditó}`, margin + 10, currentY);
          currentY += 5;
        }
      }
    }
      
      // Agregar imágenes si existen
      if (acc.imagenes && acc.imagenes.length > 0) {
        doc.text('Imágenes:', margin, currentY);
        currentY += 5;
        
        const maxImagenesPorFila = 2;
        const anchoImagen = (pageWidth - 2 * margin - (maxImagenesPorFila - 1) * 5) / maxImagenesPorFila;
        const altoImagen = 40;
        let columnaActual = 0;
        
        for (let i = 0; i < Math.min(acc.imagenes.length, 4); i++) { // Máximo 4 imágenes
          const imgUrl = acc.imagenes[i];
          
          // Verificar si necesitamos nueva página
          if (currentY + altoImagen > pageHeight - 20) {
            doc.addPage();
            currentY = 20;
            columnaActual = 0;
          }
          
          try {
            const imgData = await cargarImagen(imgUrl);
            const xPos = margin + columnaActual * (anchoImagen + 5);
            doc.addImage(imgData, 'JPEG', xPos, currentY, anchoImagen, altoImagen);
            
            columnaActual++;
            if (columnaActual >= maxImagenesPorFila) {
              columnaActual = 0;
              currentY += altoImagen + 5;
            }
          } catch (error) {
            console.error(`Error cargando imagen ${i + 1}:`, error);
            doc.text(`[Error cargando imagen ${i + 1}]`, margin + columnaActual * (anchoImagen + 5), currentY);
            columnaActual++;
            if (columnaActual >= maxImagenesPorFila) {
              columnaActual = 0;
              currentY += 10;
            }
          }
        }
        
        if (columnaActual > 0) {
          currentY += altoImagen + 5;
        }
        
        if (acc.imagenes.length > 4) {
          doc.text(`... y ${acc.imagenes.length - 4} imagen(es) más`, margin, currentY);
          currentY += 5;
        }
      }
      
    currentY += 10; // Espacio entre accidentes
    
    // Línea separadora
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 5;
  }

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

  doc.save(`${nombreArchivo}_${new Date().toISOString().split('T')[0]}.pdf`);
};

