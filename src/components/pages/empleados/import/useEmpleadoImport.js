import { useState, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { Timestamp } from 'firebase/firestore';
import { empleadoService } from '../../../../services/empleadoService';

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
    const empleado = {
      nombre: String(row.nombre || '').trim(),
      apellido: String(row.apellido || '').trim(),
      dni: row.dni ? String(row.dni).trim() : '',
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

          // Convertir a JSON
          const jsonData = XLSX.utils.sheet_to_json(worksheet, {
            raw: false,
            defval: ''
          });

          resolve(jsonData);
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
    if (lines.length < 2) {
      throw new Error('El texto debe tener al menos una fila de encabezados y una fila de datos');
    }

    // Primera línea son los encabezados
    const headers = lines[0].split('\t').map(h => h.trim().toLowerCase());
    
    // Resto son datos
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split('\t');
      const row = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      rows.push(row);
    }

    return rows;
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
  const processData = useCallback((data, empresaId, sucursalId) => {
    if (!sucursalId) {
      setErrors(['Debe seleccionar una sucursal antes de importar']);
      setEmpleadosParsed([]);
      return;
    }

    const processed = [];
    const allErrors = [];
    const allWarnings = [];

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
      
      const data = await parseExcelFile(file);
      processData(data, empresaId, sucursalId);
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
      
      const data = parseTextData(text);
      processData(data, empresaId, sucursalId);
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

