// Optimización de importaciones de PDF
// Importar solo los componentes necesarios para reducir el tamaño del bundle

// Función para cargar jsPDF de forma lazy
export const loadJsPDF = async () => {
  const { default: jsPDF } = await import('jspdf');
  return jsPDF;
};

// Función para cargar jsPDF-AutoTable de forma lazy
export const loadJsPDFAutoTable = async () => {
  const autoTable = await import('jspdf-autotable');
  return autoTable.default;
};

// Función para cargar PDF-Lib de forma lazy
export const loadPDFLib = async () => {
  const { PDFDocument, rgb, StandardFonts } = await import('pdf-lib');
  return { PDFDocument, rgb, StandardFonts };
};

// Función para cargar PDFKit de forma lazy
export const loadPDFKit = async () => {
  const PDFDocument = await import('pdfkit');
  return PDFDocument.default;
};

// Función para cargar PDFMake de forma lazy
export const loadPDFMake = async () => {
  const pdfMake = await import('pdfmake/build/pdfmake');
  const pdfFonts = await import('pdfmake/build/vfs_fonts');
  pdfMake.default.vfs = pdfFonts.pdfMake.vfs;
  return pdfMake.default;
};

// Función para cargar React-PDF de forma lazy
export const loadReactPDF = async () => {
  const { Document, Page, Text, View, StyleSheet, pdf } = await import('@react-pdf/renderer');
  return { Document, Page, Text, View, StyleSheet, pdf };
};

// Función para generar PDF con jsPDF
export const generatePDFWithJsPDF = async (data, options = {}) => {
  const jsPDF = await loadJsPDF();
  const autoTable = await loadJsPDFAutoTable();
  
  const doc = new jsPDF();
  
  // Configuración por defecto
  const defaultOptions = {
    title: 'Reporte',
    headers: [],
    data: [],
    filename: 'reporte.pdf',
    ...options
  };
  
  // Agregar título
  doc.setFontSize(16);
  doc.text(defaultOptions.title, 14, 22);
  
  // Agregar tabla si hay datos
  if (defaultOptions.data.length > 0) {
    autoTable(doc, {
      head: [defaultOptions.headers],
      body: defaultOptions.data,
      startY: 30,
      styles: {
        fontSize: 8,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [66, 66, 66],
        textColor: 255,
        fontSize: 10,
        fontStyle: 'bold',
      },
    });
  }
  
  return doc;
};

// Función para generar PDF con React-PDF
export const generatePDFWithReactPDF = async (component, options = {}) => {
  const { pdf } = await loadReactPDF();
  
  const defaultOptions = {
    filename: 'documento.pdf',
    ...options
  };
  
  const blob = await pdf(component).toBlob();
  const url = URL.createObjectURL(blob);
  
  // Crear enlace de descarga
  const link = document.createElement('a');
  link.href = url;
  link.download = defaultOptions.filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Limpiar URL
  URL.revokeObjectURL(url);
  
  return blob;
};

// Función para generar PDF con PDFMake
export const generatePDFWithPDFMake = async (documentDefinition, options = {}) => {
  const pdfMake = await loadPDFMake();
  
  const defaultOptions = {
    filename: 'documento.pdf',
    ...options
  };
  
  return new Promise((resolve, reject) => {
    pdfMake.createPdf(documentDefinition).download(defaultOptions.filename, (error) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
};

// Función para generar PDF con PDFKit
export const generatePDFWithPDFKit = async (content, options = {}) => {
  const PDFDocument = await loadPDFKit();
  
  const defaultOptions = {
    filename: 'documento.pdf',
    ...options
  };
  
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const chunks = [];
    
    doc.on('data', (chunk) => {
      chunks.push(chunk);
    });
    
    doc.on('end', () => {
      const result = Buffer.concat(chunks);
      const blob = new Blob([result], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      // Crear enlace de descarga
      const link = document.createElement('a');
      link.href = url;
      link.download = defaultOptions.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Limpiar URL
      URL.revokeObjectURL(url);
      
      resolve(blob);
    });
    
    doc.on('error', reject);
    
    // Agregar contenido al documento
    if (typeof content === 'function') {
      content(doc);
    } else {
      doc.text(content || 'Contenido del documento', 100, 100);
    }
    
    doc.end();
  });
};

// Función para generar PDF con PDF-Lib
export const generatePDFWithPDFLib = async (content, options = {}) => {
  const { PDFDocument, rgb, StandardFonts } = await loadPDFLib();
  
  const defaultOptions = {
    filename: 'documento.pdf',
    ...options
  };
  
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage();
  const { width, height } = page.getSize();
  
  const fontSize = 12;
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  
  page.drawText(content || 'Contenido del documento', {
    x: 50,
    y: height - 4 * fontSize,
    size: fontSize,
    font: font,
    color: rgb(0, 0, 0),
  });
  
  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  
  // Crear enlace de descarga
  const link = document.createElement('a');
  link.href = url;
  link.download = defaultOptions.filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Limpiar URL
  URL.revokeObjectURL(url);
  
  return blob;
};
