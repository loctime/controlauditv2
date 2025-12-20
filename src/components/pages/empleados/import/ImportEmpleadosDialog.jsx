import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Box,
  Typography,
  TextField,
  Paper,
  CircularProgress,
  LinearProgress,
  Alert,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  ContentPaste as ContentPasteIcon,
  CheckCircle as CheckCircleIcon,
  Download as DownloadIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import * as XLSX from 'xlsx';
import { useAuth } from '../../../context/AuthContext';
import { useEmpleadoImport } from './useEmpleadoImport';
import ImportPreviewTable from './ImportPreviewTable';

const steps = [
  'Seleccionar método',
  'Preview y validación',
  'Confirmación'
];

export default function ImportEmpleadosDialog({ open, onClose, onSuccess, empresaId, sucursalId }) {
  const { userProfile } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  const [importMethod, setImportMethod] = useState(null); // 'file' o 'text'
  const [pastedText, setPastedText] = useState('');
  const fileInputRef = useRef(null);

  const {
    empleadosParsed,
    errors,
    warnings,
    loading,
    progress,
    importFromFile,
    importFromText,
    saveEmpleados,
    reset,
    getValidEmpleados
  } = useEmpleadoImport();

  // Resetear cuando se cierra el dialog
  React.useEffect(() => {
    if (!open) {
      reset();
      setActiveStep(0);
      setImportMethod(null);
      setPastedText('');
    }
  }, [open, reset]);

  const handleMethodSelect = (method) => {
    setImportMethod(method);
  };

  const handleFileSelect = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      alert('Por favor seleccione un archivo Excel (.xlsx o .xls)');
      return;
    }

    if (!sucursalId) {
      alert('Debe seleccionar una sucursal antes de importar');
      return;
    }

    await importFromFile(file, empresaId, sucursalId);
    setActiveStep(1);
  };

  const handlePasteText = async () => {
    if (!pastedText.trim()) {
      alert('Por favor pegue el contenido del Excel');
      return;
    }

    if (!sucursalId) {
      alert('Debe seleccionar una sucursal antes de importar');
      return;
    }

    importFromText(pastedText, empresaId, sucursalId);
    setActiveStep(1);
  };

  const handleNext = () => {
    if (activeStep === 0 && importMethod === 'text' && pastedText.trim()) {
      handlePasteText();
    } else if (activeStep === 1) {
      setActiveStep(2);
    }
  };

  const handleBack = () => {
    setActiveStep(activeStep - 1);
  };

  // Descargar plantilla Excel
  const handleDownloadTemplate = () => {
    const headers = [
      'nombre',
      'apellido',
      'dni',
      'email',
      'telefono',
      'cargo',
      'area',
      'tipo',
      'estado',
      'fechaIngreso'
    ];

    // Datos de ejemplo
    const exampleData = [
      ['Juan', 'Pérez', '12345678', 'juan.perez@ejemplo.com', '+54 11 1234-5678', 'Operario', 'Producción', 'operativo', 'activo', '2024-01-15'],
      ['María', 'González', '23456789', 'maria.gonzalez@ejemplo.com', '+54 11 2345-6789', 'Supervisor', 'Producción', 'operativo', 'activo', '2024-02-01'],
      ['Carlos', 'López', '34567890', 'carlos.lopez@ejemplo.com', '+54 11 3456-7890', 'Administrativo', 'Administración', 'administrativo', 'activo', '2024-03-10']
    ];

    // Crear workbook
    const workbook = XLSX.utils.book_new();
    const worksheetData = [headers, ...exampleData];
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

    // Agregar worksheet con nombre "empleados"
    XLSX.utils.book_append_sheet(workbook, worksheet, 'empleados');

    // Generar archivo
    const excelBuffer = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array'
    });

    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

    // Descargar
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'plantilla_empleados.xlsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleConfirmImport = async () => {
    try {
      const savedCount = await saveEmpleados(userProfile);
      onSuccess(savedCount);
      onClose();
    } catch (error) {
      console.error('Error al importar:', error);
      alert(`Error al importar empleados: ${error.message}`);
    }
  };

  const validEmpleados = getValidEmpleados();
  const canProceed = activeStep === 0 
    ? (importMethod === 'file' && empleadosParsed.length > 0) || 
      (importMethod === 'text' && pastedText.trim().length > 0)
    : activeStep === 1
    ? validEmpleados.length > 0
    : true;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CloudUploadIcon />
          <Typography variant="h6">Importación Masiva de Empleados</Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Stepper activeStep={activeStep} orientation="vertical">
          {/* Paso 1: Selección de método */}
          <Step>
            <StepLabel>Seleccionar método de importación</StepLabel>
            <StepContent>
              {/* Formato esperado */}
              <Alert 
                icon={<InfoIcon />} 
                severity="info" 
                sx={{ mb: 3 }}
                action={
                  <Button
                    color="inherit"
                    size="small"
                    startIcon={<DownloadIcon />}
                    onClick={handleDownloadTemplate}
                  >
                    Descargar Plantilla
                  </Button>
                }
              >
                <Typography variant="subtitle2" gutterBottom>
                  Formato esperado del archivo Excel
                </Typography>
                <Typography variant="body2" component="div">
                  <Box component="ul" sx={{ m: 0, pl: 2 }}>
                    <li>El archivo debe tener una hoja llamada <strong>"empleados"</strong></li>
                    <li><strong>Fila 1:</strong> Encabezados (nombre, apellido, dni, etc.)</li>
                    <li><strong>Filas siguientes:</strong> Datos de empleados (una fila = un empleado)</li>
                  </Box>
                </Typography>
              </Alert>

              {/* Tabla de formato - Fila 1: Encabezados */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  <strong>Estructura del archivo:</strong> Fila 1 = Encabezados | Filas siguientes = Empleados (una fila = un empleado)
                </Typography>
              </Box>
              
              {/* Tabla que muestra la Fila 1 del Excel (encabezados como columnas) */}
              <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell align="center" sx={{ backgroundColor: 'primary.light', color: 'primary.contrastText', fontWeight: 'bold' }}>
                        Fila 1: Encabezados (cada columna es un campo)
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
                          <Chip label="nombre *" color="error" size="small" />
                          <Chip label="apellido *" color="error" size="small" />
                          <Chip label="dni" color="default" size="small" />
                          <Chip label="email" color="default" size="small" />
                          <Chip label="telefono" color="default" size="small" />
                          <Chip label="cargo" color="default" size="small" />
                          <Chip label="area" color="default" size="small" />
                          <Chip label="tipo" color="default" size="small" />
                          <Chip label="estado" color="default" size="small" />
                          <Chip label="fechaIngreso" color="default" size="small" />
                        </Box>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Información detallada de campos */}
               

              <Box sx={{ display: 'flex', gap: 2, flexDirection: 'column', mt: 2 }}>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 3,
                    cursor: 'pointer',
                    border: importMethod === 'file' ? 2 : 1,
                    borderColor: importMethod === 'file' ? 'primary.main' : 'divider',
                    '&:hover': { borderColor: 'primary.main' }
                  }}
                  onClick={() => handleMethodSelect('file')}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <CloudUploadIcon color={importMethod === 'file' ? 'primary' : 'action'} />
                    <Box>
                      <Typography variant="h6">Subir archivo Excel</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Seleccione un archivo .xlsx con los datos de empleados
                      </Typography>
                    </Box>
                  </Box>
                </Paper>

                {importMethod === 'file' && (
                  <Box sx={{ mt: 2 }}>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleFileSelect}
                      style={{ display: 'none' }}
                    />
                    <Button
                      variant="contained"
                      startIcon={<CloudUploadIcon />}
                      onClick={() => fileInputRef.current?.click()}
                      disabled={loading}
                    >
                      Seleccionar archivo
                    </Button>
                  </Box>
                )}

                <Divider sx={{ my: 2 }}>O</Divider>

                <Paper
                  variant="outlined"
                  sx={{
                    p: 3,
                    cursor: 'pointer',
                    border: importMethod === 'text' ? 2 : 1,
                    borderColor: importMethod === 'text' ? 'primary.main' : 'divider',
                    '&:hover': { borderColor: 'primary.main' }
                  }}
                  onClick={() => handleMethodSelect('text')}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <ContentPasteIcon color={importMethod === 'text' ? 'primary' : 'action'} />
                    <Box>
                      <Typography variant="h6">Pegar desde Excel</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Copie y pegue las filas desde Excel (con tabulaciones)
                      </Typography>
                    </Box>
                  </Box>
                </Paper>

                {importMethod === 'text' && (
                  <Box sx={{ mt: 2 }}>
                    <Alert severity="info" sx={{ mb: 2 }}>
                      <Typography variant="body2">
                        <strong>Formato:</strong> Pegue el contenido copiado desde Excel incluyendo la primera fila con los encabezados.
                        Cada fila siguiente representa un empleado.
                      </Typography>
                    </Alert>
                    <TextField
                      fullWidth
                      multiline
                      rows={8}
                      placeholder="nombre	apellido	dni	email	telefono	cargo	area	tipo	estado	fechaIngreso&#10;Juan	Pérez	12345678	juan@ejemplo.com	+54 11 1234-5678	Operario	Producción	operativo	activo	2024-01-15&#10;María	González	23456789	maria@ejemplo.com	+54 11 2345-6789	Supervisor	Producción	operativo	activo	2024-02-01"
                      value={pastedText}
                      onChange={(e) => setPastedText(e.target.value)}
                      disabled={loading}
                      helperText="Primera fila: encabezados | Filas siguientes: empleados (una fila = un empleado)"
                    />
                    <Button
                      variant="contained"
                      startIcon={<ContentPasteIcon />}
                      onClick={handlePasteText}
                      disabled={loading || !pastedText.trim()}
                      sx={{ mt: 2 }}
                    >
                      Procesar texto
                    </Button>
                  </Box>
                )}

                {loading && (
                  <Box sx={{ mt: 2 }}>
                    <CircularProgress size={24} />
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Procesando datos...
                    </Typography>
                  </Box>
                )}
              </Box>
            </StepContent>
          </Step>

          {/* Paso 2: Preview y validación */}
          <Step>
            <StepLabel>Preview y validación</StepLabel>
            <StepContent>
              {empleadosParsed.length > 0 ? (
                <Box sx={{ mt: 2 }}>
                  <ImportPreviewTable
                    empleados={empleadosParsed}
                    errors={errors}
                    warnings={warnings}
                    maxRows={10}
                  />
                  
                  <Box sx={{ mt: 3 }}>
                    <Alert severity={validEmpleados.length > 0 ? 'success' : 'error'}>
                      <Typography variant="body1">
                        <strong>{validEmpleados.length}</strong> empleado(s) válido(s) de {empleadosParsed.length} total
                      </Typography>
                      {errors.length > 0 && (
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          {errors.length} error(es) bloqueante(s) encontrado(s)
                        </Typography>
                      )}
                    </Alert>
                  </Box>
                </Box>
              ) : (
                <Alert severity="info">
                  No hay datos para mostrar. Por favor, seleccione un método de importación.
                </Alert>
              )}
            </StepContent>
          </Step>

          {/* Paso 3: Confirmación */}
          <Step>
            <StepLabel>Confirmar importación</StepLabel>
            <StepContent>
              <Box sx={{ mt: 2 }}>
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="body1" gutterBottom>
                    <strong>Resumen de importación:</strong>
                  </Typography>
                  <Typography variant="body2">
                    • Empleados válidos: <strong>{validEmpleados.length}</strong>
                  </Typography>
                  <Typography variant="body2">
                    • Errores bloqueantes: <strong>{errors.length}</strong>
                  </Typography>
                  <Typography variant="body2">
                    • Advertencias: <strong>{warnings.length}</strong>
                  </Typography>
                </Alert>

                <Alert severity="warning" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    Se crearán {validEmpleados.length} empleado(s) en Firestore.
                    Esta acción no se puede deshacer.
                  </Typography>
                </Alert>

                {loading && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Importando empleados... {progress.current} de {progress.total}
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={(progress.current / progress.total) * 100}
                      sx={{ mt: 1 }}
                    />
                  </Box>
                )}

                {!loading && progress.current > 0 && progress.current === progress.total && (
                  <Alert severity="success" sx={{ mt: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CheckCircleIcon />
                      <Typography>
                        ¡Importación completada! {progress.current} empleado(s) creado(s)
                      </Typography>
                    </Box>
                  </Alert>
                )}
              </Box>
            </StepContent>
          </Step>
        </Stepper>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
        {activeStep > 0 && (
          <Button onClick={handleBack} disabled={loading}>
            Atrás
          </Button>
        )}
        {activeStep < 2 && (
          <Button
            onClick={handleNext}
            variant="contained"
            disabled={!canProceed || loading}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5568d3 0%, #65408b 100%)',
              }
            }}
          >
            {activeStep === 0 ? 'Continuar' : 'Siguiente'}
          </Button>
        )}
        {activeStep === 2 && (
          <Button
            onClick={handleConfirmImport}
            variant="contained"
            disabled={loading || validEmpleados.length === 0}
            startIcon={loading ? <CircularProgress size={20} /> : <CheckCircleIcon />}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5568d3 0%, #65408b 100%)',
              }
            }}
          >
            {loading ? 'Importando...' : `Importar ${validEmpleados.length} empleado(s)`}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

