import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Tabs,
  Tab,
  Box,
  Typography,
  TextField,
  CircularProgress,
  LinearProgress,
  Alert
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  ContentPaste as ContentPasteIcon,
  CheckCircle as CheckCircleIcon,
  Download as DownloadIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import * as XLSX from 'xlsx';
import { useAuth } from '../../../context/AuthContext';
import { useEmpleadoImport } from './useEmpleadoImport';
import ImportPreviewTable from './ImportPreviewTable';

export default function ImportEmpleadosDialog({ open, onClose, onSuccess, empresaId, sucursalId }) {
  const { userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState(0); // 0: Excel, 1: Pegar, 2: Manual
  const [pastedText, setPastedText] = useState('');
  const [manualText, setManualText] = useState('');
  const fileInputRef = useRef(null);

  const {
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
  } = useEmpleadoImport();

  // Resetear cuando se cierra el dialog
  React.useEffect(() => {
    if (!open) {
      reset();
      setActiveTab(0);
      setPastedText('');
      setManualText('');
    }
  }, [open, reset]);

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
  };

  const handleManualText = async () => {
    if (!manualText.trim()) {
      alert('Por favor ingrese los datos de los empleados');
      return;
    }

    if (!sucursalId) {
      alert('Debe seleccionar una sucursal antes de importar');
      return;
    }

    importFromManualText(manualText, empresaId, sucursalId);
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

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CloudUploadIcon />
          <Typography variant="h6">Importación Masiva de Empleados</Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        {/* Tabs horizontales */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
            <Tab label="Excel" icon={<CloudUploadIcon />} iconPosition="start" />
            <Tab label="Pegar desde Excel" icon={<ContentPasteIcon />} iconPosition="start" />
            <Tab label="Texto manual" icon={<EditIcon />} iconPosition="start" />
          </Tabs>
        </Box>

        {/* Contenido de cada Tab */}
        <Box sx={{ mb: 3 }}>
          {/* Tab Excel */}
          {activeTab === 0 && (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                La fila 1 debe contener los encabezados (nombre, apellido, dni, etc.)
              </Typography>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
                <Button
                  variant="contained"
                  startIcon={<CloudUploadIcon />}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
                >
                  Seleccionar archivo
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={handleDownloadTemplate}
                  size="small"
                >
                  Descargar plantilla
                </Button>
              </Box>
              {loading && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
                  <CircularProgress size={20} />
                  <Typography variant="body2" color="text.secondary">
                    Procesando archivo...
                  </Typography>
                </Box>
              )}
            </Box>
          )}

          {/* Tab Pegar desde Excel */}
          {activeTab === 1 && (
            <Box>
              <TextField
                fullWidth
                multiline
                rows={8}
                placeholder="nombre	apellido	dni	email	telefono	cargo	area	tipo	estado	fechaIngreso&#10;Juan	Pérez	12345678	juan@ejemplo.com	+54 11 1234-5678	Operario	Producción	operativo	activo	2024-01-15"
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
              {loading && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
                  <CircularProgress size={20} />
                  <Typography variant="body2" color="text.secondary">
                    Procesando texto...
                  </Typography>
                </Box>
              )}
            </Box>
          )}

          {/* Tab Texto manual */}
          {activeTab === 2 && (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Ejemplo: diego bertosi 37399444 diego@gmail.com 112233445 operario produccion
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={10}
                placeholder="diego bertosi 37399444 diego@gmail.com 112233445 operario produccion&#10;martin dipalma 38488222 martin@gmail.com 119988776 administrativo administracion"
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
                disabled={loading}
                helperText="Una línea por empleado. El sistema detectará automáticamente DNI, email y teléfono."
              />
              <Button
                variant="contained"
                startIcon={<EditIcon />}
                onClick={handleManualText}
                disabled={loading || !manualText.trim()}
                sx={{ mt: 2 }}
              >
                Procesar texto manual
              </Button>
              {loading && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
                  <CircularProgress size={20} />
                  <Typography variant="body2" color="text.secondary">
                    Procesando texto...
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </Box>

        {/* Preview y validación - se muestra cuando hay datos */}
        {empleadosParsed.length > 0 && (
          <Box sx={{ mt: 3 }}>
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

            {/* Confirmación integrada */}
            {validEmpleados.length > 0 && (
              <Box sx={{ mt: 3 }}>
                <Alert severity="info" sx={{ mb: 2 }}>
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
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
        {validEmpleados.length > 0 && (
          <Button
            onClick={handleConfirmImport}
            variant="contained"
            disabled={loading}
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

