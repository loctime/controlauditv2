import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Box,
  Typography,
  Alert
} from '@mui/material';

export default function ImportPreviewTable({ empleados, errors, warnings, maxRows = 10 }) {
  const displayEmpleados = empleados.slice(0, maxRows);
  const hasMore = empleados.length > maxRows;

  // Función para obtener el estado de validación de una fila
  const getRowStatus = (empleado, index) => {
    const rowErrors = errors.filter(e => e.includes(`Fila ${empleado._rowIndex}`));
    return {
      hasError: rowErrors.length > 0,
      errors: rowErrors
    };
  };

  // Formatear fecha
  const formatDate = (date) => {
    if (!date) return '-';
    if (date instanceof Date) {
      return date.toLocaleDateString('es-AR');
    }
    return String(date);
  };

  return (
    <Box>
      {/* Resumen */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Total de filas procesadas: <strong>{empleados.length}</strong>
        </Typography>
        {hasMore && (
          <Typography variant="body2" color="text.secondary">
            Mostrando las primeras {maxRows} filas
          </Typography>
        )}
      </Box>

      {/* Alertas de errores y warnings */}
      {errors.length > 0 && (
        <Alert severity="error" sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Errores bloqueantes ({errors.length}):
          </Typography>
          <Box component="ul" sx={{ m: 0, pl: 2 }}>
            {errors.slice(0, 5).map((error, idx) => (
              <li key={idx}>
                <Typography variant="body2">{error}</Typography>
              </li>
            ))}
            {errors.length > 5 && (
              <li>
                <Typography variant="body2">
                  ... y {errors.length - 5} error(es) más
                </Typography>
              </li>
            )}
          </Box>
        </Alert>
      )}

      {warnings.length > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Advertencias ({warnings.length}):
          </Typography>
          <Box component="ul" sx={{ m: 0, pl: 2 }}>
            {warnings.slice(0, 5).map((warning, idx) => (
              <li key={idx}>
                <Typography variant="body2">{warning}</Typography>
              </li>
            ))}
            {warnings.length > 5 && (
              <li>
                <Typography variant="body2">
                  ... y {warnings.length - 5} advertencia(s) más
                </Typography>
              </li>
            )}
          </Box>
        </Alert>
      )}

      {/* Tabla de preview */}
      <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell><strong>Fila</strong></TableCell>
              <TableCell><strong>Nombre</strong></TableCell>
              <TableCell><strong>Apellido</strong></TableCell>
              <TableCell><strong>DNI</strong></TableCell>
              <TableCell><strong>Email</strong></TableCell>
              <TableCell><strong>Cargo</strong></TableCell>
              <TableCell><strong>Tipo</strong></TableCell>
              <TableCell><strong>Estado</strong></TableCell>
              <TableCell><strong>Fecha Ingreso</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {displayEmpleados.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center">
                  <Typography color="text.secondary">
                    No hay datos para mostrar
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              displayEmpleados.map((empleado, index) => {
                const status = getRowStatus(empleado, index);
                return (
                  <TableRow
                    key={index}
                    sx={{
                      backgroundColor: status.hasError ? 'error.light' : 'transparent',
                      '&:hover': {
                        backgroundColor: status.hasError ? 'error.light' : 'action.hover'
                      }
                    }}
                  >
                    <TableCell>
                      <Typography
                        variant="body2"
                        color={status.hasError ? 'error.main' : 'text.primary'}
                      >
                        {empleado._rowIndex}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        color={!empleado.nombre ? 'error.main' : 'text.primary'}
                      >
                        {empleado.nombre || <em>Requerido</em>}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        color={!empleado.apellido ? 'error.main' : 'text.primary'}
                      >
                        {empleado.apellido || <em>Requerido</em>}
                      </Typography>
                    </TableCell>
                    <TableCell>{empleado.dni || '-'}</TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {empleado.email || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>{empleado.cargo || '-'}</TableCell>
                    <TableCell>
                      <Chip
                        label={empleado.tipo}
                        size="small"
                        color={empleado.tipo === 'operativo' ? 'primary' : 'secondary'}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={empleado.estado}
                        size="small"
                        color={empleado.estado === 'activo' ? 'success' : 'default'}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(empleado.fechaIngreso)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

