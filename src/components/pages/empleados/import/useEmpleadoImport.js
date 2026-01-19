  import { useState, useCallback } from 'react';
  import * as XLSX from 'xlsx';
  import { Timestamp } from 'firebase/firestore';
  import { empleadoService } from '../../../../services/empleadoService';

  /**
   * Sinónimos y variantes de encabezados esperados
   */
  const HEADER_SYNONYMS = {
    nombre: ['nombre', 'name', 'nombres', 'primer nombre'],
    apellido: ['apellido', 'apellidos', 'surname', 'lastname', 'last name'],
    dni: ['dni', 'documento', 'doc', 'cedula', 'cédula', 'identificacion', 'identificación', 'id'],
    email: ['email', 'mail', 'correo', 'correo electronico', 'e-mail', 'e mail'],
    telefono: ['telefono', 'teléfono', 'tel', 'celular', 'cel', 'phone', 'movil', 'móvil', 'contacto'],
    cargo: ['cargo', 'puesto', 'posicion', 'posición', 'position', 'job', 'trabajo'],
    area: ['area', 'área', 'departamento', 'depto', 'sector', 'department'],
    tipo: ['tipo', 'type', 'clase', 'categoria', 'categoría'],
    estado: ['estado', 'status', 'activo', 'inactivo', 'state'],
    fechaIngreso: ['fecha ingreso', 'fecha_ingreso', 'fechaingreso', 'ingreso', 'fecha alta', 'fecha_alta', 'fechaalta', 'alta', 'fecha inicio', 'fecha_inicio', 'fechainicio', 'inicio', 'fecha contratacion', 'fechacontratacion', 'contratacion']
  };

  /**
   * Normaliza un encabezado: elimina tildes, espacios, convierte a minúsculas
   */
  const normalizeHeader = (header) => {
    if (!header) return '';
    return String(header)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Eliminar tildes
      .replace(/[_\s-]/g, '') // Eliminar guiones, guiones bajos y espacios
      .trim();
  };


  /**
   * Detecta si un objeto parece contener encabezados (no datos)
   */
  const detectHeaders = (row) => {
    if (!row || typeof row !== 'object') return false;
    
    const keys = Object.keys(row);
    if (keys.length === 0) return false;
    
    // Contar cuántos campos estándar se detectan
    let detectedFields = 0;
    for (const key of keys) {
      const field = detectField(key);
      if (field) {
        detectedFields++;
      }
    }
    
    // Verificar que los valores no parezcan datos de empleado
    const values = Object.values(row);
    const hasNonNumericValues = values.some(value => {
      if (!value) return false;
      const str = String(value).trim();
      // Si es un número puro largo (como DNI), probablemente no es encabezado
      if (/^\d{7,9}$/.test(str)) return false;
      // Si tiene más de 3 caracteres y no es solo número, probablemente es texto
      return str.length > 3;
    });
    
    // Si se detectan al menos 2 campos estándar y tiene valores de texto, probablemente son encabezados
    return detectedFields >= 2 && hasNonNumericValues;
  };

  /**
   * Detecta qué campo estándar corresponde a un encabezado
   */
  const detectField = (header) => {
    const normalized = normalizeHeader(header);
    
    for (const [field, synonyms] of Object.entries(HEADER_SYNONYMS)) {
      if (synonyms.some(syn => normalizeHeader(syn) === normalized)) {
        return field;
      }
    }
    
    return null;
  };

  /**
   * Normaliza encabezados y mapea filas usando el mapeo detectado
   * @param {Array} rows - Array de objetos con datos
   * @returns {Object} - { mappedRows: Array, warnings: string[] }
   */
  const normalizeHeadersAndMapRows = (rows) => {
    if (!rows || rows.length === 0) {
      return { mappedRows: [], warnings: [] };
    }

    let headers = [];
    let dataRows = [];
    let allWarnings = [];
    let hasHeaders = false;

    // Extraer encabezados de las claves del primer objeto
    headers = Object.keys(rows[0]);
    
    // Detectar si la primera fila son encabezados
    if (rows.length > 1 && detectHeaders(rows[0])) {
      hasHeaders = true;
      // Los valores de la primera fila son los nombres de las columnas
      const headerValues = Object.values(rows[0]).map(v => String(v).trim());
      // Crear mapeo: índice de columna -> campo estándar
      const columnToFieldMap = {};
      const unmappedColumns = [];
      
      headerValues.forEach((headerValue, index) => {
        const field = detectField(headerValue);
        if (field) {
          columnToFieldMap[index] = field;
        } else {
          unmappedColumns.push(headerValue || `col_${index}`);
        }
      });
      
      if (unmappedColumns.length > 0) {
        allWarnings.push(`Columnas desconocidas ignoradas: ${unmappedColumns.join(', ')}`);
      }
      
      // Usar las filas siguientes como datos
      dataRows = rows.slice(1);
      
      // Mapear filas usando el columnToFieldMap
      const mappedRows = dataRows.map((row, rowIndex) => {
        const mappedRow = {
          nombre: '',
          apellido: '',
          dni: '',
          email: '',
          telefono: '',
          cargo: '',
          area: '',
          tipo: '',
          estado: '',
          fechaIngreso: '',
          _rowIndex: rowIndex + 2 // +2 porque Excel empieza en 1 y tiene header
        };
        
        // Obtener valores de la fila en orden
        const rowValues = Object.values(row);
        
        // Mapear por encabezados detectados usando índices
        Object.keys(columnToFieldMap).forEach(columnIndex => {
          const field = columnToFieldMap[columnIndex];
          mappedRow[field] = rowValues[parseInt(columnIndex)] || '';
        });
        
        return mappedRow;
      });
      
      return { mappedRows, warnings: allWarnings };
    } else {
      // No se detectaron encabezados, usar orden por posición
      allWarnings.push('No se detectaron encabezados válidos, se usó el orden de columnas');
      dataRows = rows;
      
      const mappedRows = dataRows.map((row, rowIndex) => {
        const values = Object.values(row);
        return {
          nombre: values[0] || '',
          apellido: values[1] || '',
          dni: values[2] || '',
          email: values[3] || '',
          telefono: values[4] || '',
          cargo: values[5] || '',
          area: values[6] || '',
          tipo: values[7] || '',
          estado: values[8] || '',
          fechaIngreso: values[9] || '',
          _rowIndex: rowIndex + 1
        };
      });
      
      return { mappedRows, warnings: allWarnings };
    }
  };

  /**
   * Hook para manejar la importación masiva de empleados
   */
  export const useEmpleadoImport = () => {
    const [empleadosParsed, setEmpleadosParsed] = useState([]);
    const [errors, setErrors] = useState([]);
    const [warnings, setWarnings] = useState([]);
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState({ current: 0, total: 0 });

    /**
     * Normaliza un valor de fecha desde Excel o string
     */
    const normalizeDate = (value) => {
      if (!value) return null;
      
      // Si es un número (serial de Excel)
      if (typeof value === 'number') {
        // Excel serial date: días desde 1900-01-01
        const excelEpoch = new Date(1899, 11, 30);
        const date = new Date(excelEpoch.getTime() + value * 86400000);
        return date;
      }
      
      // Si es string ISO
      if (typeof value === 'string') {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          return date;
        }
      }
      
      // Si es Date
      if (value instanceof Date) {
        return value;
      }
      
      return null;
    };

    /**
     * Normaliza un campo de empleado
     */
    const normalizeEmpleado = (row, index, empresaId, sucursalId) => {
      // Normalizar DNI: eliminar puntos y espacios
      const normalizeDni = (dni) => {
        if (!dni) return '';
        return String(dni).trim().replace(/\./g, '').replace(/\s/g, '');
      };

      const empleado = {
        nombre: String(row.nombre || '').trim(),
        apellido: String(row.apellido || '').trim(),
        dni: normalizeDni(row.dni),
        email: row.email ? String(row.email).trim().toLowerCase() : '',
        telefono: row.telefono ? String(row.telefono).trim() : '',
        cargo: row.cargo ? String(row.cargo).trim() : '',
        area: row.area ? String(row.area).trim() : '',
        tipo: row.tipo === null ? null : (row.tipo ? String(row.tipo).trim().toLowerCase() : 'operativo'),
        estado: row.estado ? String(row.estado).trim().toLowerCase() : 'activo',
        fechaIngreso: null,
        empresaId,
        sucursalId,
        _rowIndex: row._rowIndex !== undefined ? row._rowIndex : index + 2 // +2 porque Excel empieza en 1 y tiene header
      };

      // Normalizar tipo (respetar null del método manual)
      if (empleado.tipo !== null && empleado.tipo !== 'operativo' && empleado.tipo !== 'administrativo') {
        empleado.tipo = 'operativo';
      }

      // Normalizar estado
      if (empleado.estado !== 'activo' && empleado.estado !== 'inactivo') {
        empleado.estado = 'activo';
      }

      // Normalizar fecha
      if (row.fechaIngreso) {
        const fecha = normalizeDate(row.fechaIngreso);
        if (fecha) {
          empleado.fechaIngreso = fecha;
        } else {
          empleado.fechaIngreso = new Date();
        }
      } else {
        empleado.fechaIngreso = new Date();
      }

      return empleado;
    };

    /**
     * Valida un empleado
     */
    const validateEmpleado = (empleado, allEmpleados, index) => {
      const empleadoErrors = [];
      const empleadoWarnings = [];

      // Validaciones bloqueantes
      if (!empleado.nombre || empleado.nombre.length === 0) {
        empleadoErrors.push(`Fila ${empleado._rowIndex}: Nombre es obligatorio`);
      }

      if (!empleado.apellido || empleado.apellido.length === 0) {
        empleadoErrors.push(`Fila ${empleado._rowIndex}: Apellido es obligatorio`);
      }

      // Validaciones de warning
      if (empleado.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(empleado.email)) {
        empleadoWarnings.push(`Fila ${empleado._rowIndex}: Email inválido (${empleado.email})`);
      }

      // Validar DNI si existe (debe ser numérico y tener entre 7-9 dígitos)
      if (empleado.dni && empleado.dni.length > 0) {
        const dniNum = empleado.dni.replace(/\D/g, '');
        if (dniNum.length < 7 || dniNum.length > 9) {
          empleadoWarnings.push(`Fila ${empleado._rowIndex}: DNI inválido (debe tener entre 7-9 dígitos)`);
        }
      }

      // Verificar DNI duplicado dentro del archivo
      if (empleado.dni) {
        const duplicados = allEmpleados.filter(
          (e, i) => i < index && e.dni === empleado.dni && e.dni !== ''
        );
        if (duplicados.length > 0) {
          empleadoWarnings.push(`Fila ${empleado._rowIndex}: DNI duplicado (${empleado.dni})`);
        }
      }

      return { errors: empleadoErrors, warnings: empleadoWarnings };
    };

    /**
     * Parsea un archivo Excel
     */
    const parseExcelFile = useCallback((file) => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (e) => {
          try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            
            // Buscar hoja "empleados" o usar la primera
            let worksheet = workbook.Sheets['empleados'] || workbook.Sheets[workbook.SheetNames[0]];
            
            if (!worksheet) {
              reject(new Error('No se encontró ninguna hoja en el archivo'));
              return;
            }

            // Convertir a JSON (mantener formato objeto para detectar encabezados)
            const jsonData = XLSX.utils.sheet_to_json(worksheet, {
              raw: false,
              defval: ''
            });

            // Filtrar filas vacías (todas las columnas están vacías o solo tienen espacios)
            const filteredData = jsonData.filter(row => {
              const values = Object.values(row);
              return values.some(val => val && String(val).trim().length > 0);
            });

            if (filteredData.length === 0) {
              reject(new Error('No se encontraron datos en el archivo'));
              return;
            }

            // Normalizar encabezados y mapear filas
            const { mappedRows, warnings } = normalizeHeadersAndMapRows(filteredData);
            
            // Agregar warnings al estado (se manejarán en processData)
            if (warnings.length > 0) {
              // Retornar warnings junto con los datos
              resolve({ rows: mappedRows, warnings });
            } else {
              resolve({ rows: mappedRows, warnings: [] });
            }
          } catch (error) {
            reject(error);
          }
        };

        reader.onerror = () => reject(new Error('Error al leer el archivo'));
        reader.readAsArrayBuffer(file);
      });
    }, []);

    /**
     * Parsea texto tabulado (pegado desde Excel)
     */
    const parseTextData = useCallback((text) => {
      const lines = text.trim().split('\n');
      if (lines.length < 1) {
        throw new Error('El texto no puede estar vacío');
      }

      // Convertir líneas a objetos (similar a Excel)
      const rows = [];
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        // Ignorar filas completamente vacías
        if (!line || line.length === 0) continue;
        
        const values = line.split('\t');
        // Verificar si la fila tiene al menos un valor no vacío
        const hasData = values.some(val => val && val.trim().length > 0);
        if (!hasData) continue;
        
        // Crear objeto usando los valores como claves (para la primera fila) o índices
        const row = {};
        values.forEach((value, index) => {
          // Para la primera fila, usar el valor como nombre de columna
          // Para las demás, usar índice
          if (i === 0) {
            const headerName = String(value).trim() || `col_${index}`;
            row[headerName] = '';
          } else {
            row[`col_${index}`] = value || '';
          }
        });
        
        rows.push(row);
      }

      if (rows.length === 0) {
        throw new Error('No se encontraron datos válidos en el texto');
      }

      // Si hay más de una fila, intentar detectar encabezados en la primera
      if (rows.length > 1) {
        const firstRow = rows[0];
        
        // Verificar si la primera fila parece encabezados
        if (detectHeaders(firstRow)) {
          // Los valores de la primera fila son los nombres de las columnas
          const headerValues = Object.keys(firstRow);
          const dataRows = rows.slice(1).map(row => {
            const mappedRow = {};
            Object.keys(row).forEach((key, index) => {
              const headerName = headerValues[index] || `col_${index}`;
              mappedRow[headerName] = row[key];
            });
            return mappedRow;
          });
          
          // Normalizar encabezados y mapear
          const { mappedRows, warnings } = normalizeHeadersAndMapRows([firstRow, ...dataRows]);
          return { rows: mappedRows, warnings };
        }
      }

      // Si no se detectaron encabezados o solo hay una fila, usar orden por posición
      // Convertir a formato estándar
      const standardRows = rows.map((row, index) => {
        const values = Object.values(row);
        const standardRow = {};
        values.forEach((value, i) => {
          standardRow[`col_${i}`] = value;
        });
        return standardRow;
      });
      
      const { mappedRows, warnings } = normalizeHeadersAndMapRows(standardRows);
      return { rows: mappedRows, warnings };
    }, []);

    /**
     * Parsea texto manual libre (una línea por empleado, separado por espacios)
     * Heurística: parts[0]=nombre, parts[1]=apellido, número 7-9 dígitos=DNI,
     * texto con @=email, número largo=teléfono, resto=cargo/area
     */
    const parseManualText = useCallback((text) => {
      const lines = text.trim().split('\n').filter(line => line.trim().length > 0);
      if (lines.length === 0) {
        throw new Error('El texto no puede estar vacío');
      }

      const rows = [];
      
      lines.forEach((line, lineIndex) => {
        // Dividir por espacios múltiples y limpiar
        const parts = line.trim().split(/\s+/).filter(p => p.length > 0);
        
        if (parts.length < 2) {
          // Mínimo nombre y apellido
          return;
        }

        const row = {
          nombre: parts[0] || '',
          apellido: parts[1] || '',
          dni: '',
          email: '',
          telefono: '',
          cargo: '',
          area: '',
          tipo: null,
          estado: 'activo',
          _rowIndex: lineIndex + 1 // Para método manual, línea 1 = empleado 1
        };

        // Buscar DNI (número de 7-9 dígitos)
        let dniPartIndex = -1;
        for (let i = 2; i < parts.length; i++) {
          const part = parts[i];
          const numOnly = part.replace(/\D/g, '');
          if (numOnly.length >= 7 && numOnly.length <= 9 && !row.dni) {
            row.dni = numOnly;
            dniPartIndex = i;
            break;
          }
        }

        // Buscar email (contiene @)
        let emailPartIndex = -1;
        for (let i = 2; i < parts.length; i++) {
          const part = parts[i];
          if (part.includes('@') && !row.email) {
            row.email = part;
            emailPartIndex = i;
            break;
          }
        }

        // Buscar teléfono (número largo, más de 9 dígitos, excluyendo DNI y email)
        let telefonoPartIndex = -1;
        for (let i = 2; i < parts.length; i++) {
          if (i === dniPartIndex || i === emailPartIndex) continue;
          const part = parts[i];
          const numOnly = part.replace(/\D/g, '');
          if (numOnly.length > 9 && !row.telefono) {
            row.telefono = part;
            telefonoPartIndex = i;
            break;
          }
        }

        // Resto de campos: cargo y area (excluyendo DNI, email y teléfono ya procesados)
        const remainingParts = [];
        for (let i = 2; i < parts.length; i++) {
          if (i === dniPartIndex || i === emailPartIndex || i === telefonoPartIndex) continue;
          remainingParts.push(parts[i]);
        }

        if (remainingParts.length > 0) {
          row.cargo = remainingParts[0] || '';
          if (remainingParts.length > 1) {
            row.area = remainingParts[1] || '';
          }
        }

        rows.push(row);
      });

      return rows;
    }, []);

    /**
     * Procesa los datos parseados
     */
    const processData = useCallback((data, empresaId, sucursalId, parseWarnings = []) => {
      if (!sucursalId) {
        setErrors(['Debe seleccionar una sucursal antes de importar']);
        setEmpleadosParsed([]);
        return;
      }

      const processed = [];
      const allErrors = [];
      const allWarnings = [...parseWarnings]; // Agregar warnings del parsing

      // Campos estándar esperados
      const expectedFields = ['nombre', 'apellido', 'dni', 'email', 'telefono', 'cargo', 'area', 'tipo', 'estado', 'fechaIngreso'];
      
      // Verificar campos faltantes en general
      if (data.length > 0) {
        const firstRow = data[0];
        const availableFields = Object.keys(firstRow).filter(k => k !== '_rowIndex');
        const missingFields = expectedFields.filter(field => !availableFields.includes(field));
        
        if (missingFields.length > 0) {
          allWarnings.push(`Campos faltantes detectados: ${missingFields.join(', ')}. Se usarán valores por defecto.`);
        }
      }

      data.forEach((row, index) => {
        const empleado = normalizeEmpleado(row, index, empresaId, sucursalId);
        const validation = validateEmpleado(empleado, processed, index);
        
        allErrors.push(...validation.errors);
        allWarnings.push(...validation.warnings);
        
        processed.push(empleado);
      });

      setEmpleadosParsed(processed);
      setErrors(allErrors);
      setWarnings(allWarnings);
    }, []);

    /**
     * Importa desde archivo Excel
     */
    const importFromFile = useCallback(async (file, empresaId, sucursalId) => {
      try {
        setLoading(true);
        setErrors([]);
        setWarnings([]);
        
        const result = await parseExcelFile(file);
        processData(result.rows, empresaId, sucursalId, result.warnings);
      } catch (error) {
        setErrors([`Error al procesar archivo: ${error.message}`]);
        setEmpleadosParsed([]);
      } finally {
        setLoading(false);
      }
    }, [parseExcelFile, processData]);

    /**
     * Importa desde texto pegado
     */
    const importFromText = useCallback((text, empresaId, sucursalId) => {
      try {
        setLoading(true);
        setErrors([]);
        setWarnings([]);
        
        const result = parseTextData(text);
        processData(result.rows, empresaId, sucursalId, result.warnings);
      } catch (error) {
        setErrors([`Error al procesar texto: ${error.message}`]);
        setEmpleadosParsed([]);
      } finally {
        setLoading(false);
      }
    }, [parseTextData, processData]);

    /**
     * Importa desde texto manual libre
     */
    const importFromManualText = useCallback((text, empresaId, sucursalId) => {
      try {
        setLoading(true);
        setErrors([]);
        setWarnings([]);
        
        const data = parseManualText(text);
        processData(data, empresaId, sucursalId);
      } catch (error) {
        setErrors([`Error al procesar texto manual: ${error.message}`]);
        setEmpleadosParsed([]);
      } finally {
        setLoading(false);
      }
    }, [parseManualText, processData]);

    /**
     * Guarda los empleados en Firestore
     */
    const saveEmpleados = useCallback(async (user) => {
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      // Filtrar solo empleados válidos (sin errores bloqueantes)
      const validEmpleados = empleadosParsed.filter((emp, index) => {
        const validation = validateEmpleado(emp, empleadosParsed, index);
        return validation.errors.length === 0;
      });

      if (validEmpleados.length === 0) {
        throw new Error('No hay empleados válidos para importar');
      }

      setLoading(true);
      setProgress({ current: 0, total: validEmpleados.length });

      try {
        const BATCH_SIZE = 300;
        let savedCount = 0;

        for (let i = 0; i < validEmpleados.length; i += BATCH_SIZE) {
          const batch = validEmpleados.slice(i, i + BATCH_SIZE);
          
          // Crear empleados en paralelo dentro del batch
          const promises = batch.map(async (empleadoData) => {
            const { _rowIndex, ...data } = empleadoData;
            
            // Convertir fecha a Timestamp (el servicio maneja createdAt/updatedAt)
            const empleadoFinal = {
              ...data,
              fechaIngreso: Timestamp.fromDate(data.fechaIngreso)
            };

            return empleadoService.crearEmpleado(empleadoFinal, user);
          });

          await Promise.all(promises);
          savedCount += batch.length;
          setProgress({ current: savedCount, total: validEmpleados.length });
        }

        return savedCount;
      } catch (error) {
        console.error('Error al guardar empleados:', error);
        throw error;
      } finally {
        setLoading(false);
        setProgress({ current: 0, total: 0 });
      }
    }, [empleadosParsed]);

    /**
     * Limpia el estado
     */
    const reset = useCallback(() => {
      setEmpleadosParsed([]);
      setErrors([]);
      setWarnings([]);
      setProgress({ current: 0, total: 0 });
    }, []);

    /**
     * Obtiene empleados válidos (sin errores bloqueantes)
     */
    const getValidEmpleados = useCallback(() => {
      // Crear un Set de filas con errores para búsqueda rápida
      const errorRows = new Set();
      errors.forEach(error => {
        const match = error.match(/Fila (\d+):/);
        if (match) {
          errorRows.add(parseInt(match[1]));
        }
      });

      // Filtrar empleados que no tienen errores bloqueantes
      return empleadosParsed.filter(emp => !errorRows.has(emp._rowIndex));
    }, [empleadosParsed, errors]);

    return {
      empleadosParsed,
      errors,
      warnings,
      loading,
      progress,
      importFromFile,
      importFromText,
      importFromManualText,
      saveEmpleados,
      reset,
      getValidEmpleados
    };
  };

