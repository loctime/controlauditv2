// Optimización de importaciones de Excel
// Importar solo los componentes necesarios para reducir el tamaño del bundle

// Función para cargar ExcelJS de forma lazy
export const loadExcelJS = async () => {
  const ExcelJS = await import('exceljs');
  return ExcelJS.default;
};

// Función para cargar XLSX de forma lazy
export const loadXLSX = async () => {
  const XLSX = await import('xlsx');
  return XLSX;
};

// Función para cargar FileSaver de forma lazy
export const loadFileSaver = async () => {
  const { saveAs } = await import('file-saver');
  return saveAs;
};

// Función para generar Excel con ExcelJS
export const generateExcelWithExcelJS = async (data, options = {}) => {
  const ExcelJS = await loadExcelJS();
  const saveAs = await loadFileSaver();
  
  const defaultOptions = {
    filename: 'reporte.xlsx',
    sheetName: 'Hoja1',
    headers: [],
    data: [],
    ...options
  };
  
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(defaultOptions.sheetName);
  
  // Agregar encabezados
  if (defaultOptions.headers.length > 0) {
    worksheet.addRow(defaultOptions.headers);
    
    // Estilo para encabezados
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
  }
  
  // Agregar datos
  if (defaultOptions.data.length > 0) {
    defaultOptions.data.forEach(row => {
      worksheet.addRow(row);
    });
  }
  
  // Autoajustar columnas
  worksheet.columns.forEach(column => {
    column.width = 15;
  });
  
  // Generar archivo
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
  });
  
  saveAs(blob, defaultOptions.filename);
  
  return blob;
};

// Función para generar Excel con XLSX
export const generateExcelWithXLSX = async (data, options = {}) => {
  const XLSX = await loadXLSX();
  const saveAs = await loadFileSaver();
  
  const defaultOptions = {
    filename: 'reporte.xlsx',
    sheetName: 'Hoja1',
    headers: [],
    data: [],
    ...options
  };
  
  // Preparar datos para XLSX
  const worksheetData = [];
  
  // Agregar encabezados
  if (defaultOptions.headers.length > 0) {
    worksheetData.push(defaultOptions.headers);
  }
  
  // Agregar datos
  if (defaultOptions.data.length > 0) {
    worksheetData.push(...defaultOptions.data);
  }
  
  // Crear workbook
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
  
  // Agregar worksheet al workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, defaultOptions.sheetName);
  
  // Generar archivo
  const excelBuffer = XLSX.write(workbook, { 
    bookType: 'xlsx', 
    type: 'array' 
  });
  
  const blob = new Blob([excelBuffer], { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
  });
  
  saveAs(blob, defaultOptions.filename);
  
  return blob;
};

// Función para leer archivo Excel con ExcelJS
export const readExcelWithExcelJS = async (file, options = {}) => {
  const ExcelJS = await loadExcelJS();
  
  const defaultOptions = {
    sheetIndex: 0,
    includeHeaders: true,
    ...options
  };
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const buffer = e.target.result;
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(buffer);
        
        const worksheet = workbook.getWorksheet(defaultOptions.sheetIndex + 1);
        const data = [];
        
        worksheet.eachRow((row, rowNumber) => {
          if (defaultOptions.includeHeaders || rowNumber > 1) {
            const rowData = [];
            row.eachCell((cell, colNumber) => {
              rowData.push(cell.value);
            });
            data.push(rowData);
          }
        });
        
        resolve(data);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
};

// Función para leer archivo Excel con XLSX
export const readExcelWithXLSX = async (file, options = {}) => {
  const XLSX = await loadXLSX();
  
  const defaultOptions = {
    sheetIndex: 0,
    includeHeaders: true,
    ...options
  };
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        const sheetName = workbook.SheetNames[defaultOptions.sheetIndex];
        const worksheet = workbook.Sheets[sheetName];
        
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
          header: defaultOptions.includeHeaders ? 1 : undefined 
        });
        
        resolve(jsonData);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
};

// Función para exportar datos como CSV
export const exportToCSV = async (data, options = {}) => {
  const saveAs = await loadFileSaver();
  
  const defaultOptions = {
    filename: 'datos.csv',
    headers: [],
    data: [],
    delimiter: ',',
    ...options
  };
  
  let csvContent = '';
  
  // Agregar encabezados
  if (defaultOptions.headers.length > 0) {
    csvContent += defaultOptions.headers.join(defaultOptions.delimiter) + '\n';
  }
  
  // Agregar datos
  if (defaultOptions.data.length > 0) {
    defaultOptions.data.forEach(row => {
      const csvRow = row.map(cell => {
        // Escapar comillas y envolver en comillas si contiene comas
        const cellStr = String(cell || '');
        if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
          return `"${cellStr.replace(/"/g, '""')}"`;
        }
        return cellStr;
      });
      csvContent += csvRow.join(defaultOptions.delimiter) + '\n';
    });
  }
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, defaultOptions.filename);
  
  return blob;
};

// Función para importar CSV
export const importFromCSV = async (file, options = {}) => {
  const defaultOptions = {
    delimiter: ',',
    includeHeaders: true,
    ...options
  };
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const csvContent = e.target.result;
        const lines = csvContent.split('\n');
        const data = [];
        
        lines.forEach((line, index) => {
          if (line.trim()) {
            if (defaultOptions.includeHeaders || index > 0) {
              // Parsear línea CSV
              const row = [];
              let current = '';
              let inQuotes = false;
              
              for (let i = 0; i < line.length; i++) {
                const char = line[i];
                
                if (char === '"') {
                  inQuotes = !inQuotes;
                } else if (char === defaultOptions.delimiter && !inQuotes) {
                  row.push(current.trim());
                  current = '';
                } else {
                  current += char;
                }
              }
              
              row.push(current.trim());
              data.push(row);
            }
          }
        });
        
        resolve(data);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = reject;
    reader.readAsText(file);
  });
};
