import React, { useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Chip,
  useTheme
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Block as BlockIcon
} from '@mui/icons-material';

/**
 * Componente para mostrar el estado individual de cumplimiento de capacitaciones por empleado
 * @param {Object} props - Propiedades del componente
 * @param {Array} props.empleados - Lista de empleados
 * @param {Array} props.capacitaciones - Lista de capacitaciones
 * @param {string} props.tipo - 'anual' | 'mensual'
 * @param {number} props.selectedYear - Año seleccionado
 * @param {number} props.selectedMonth - Mes seleccionado (1-12)
 * @param {number} props.metaDefaultHorasAnual - Meta por defecto anual en horas
 * @param {number} props.metaDefaultHorasMensual - Meta por defecto mensual en horas
 */
const CapacitacionesPersonalTable = ({
  empleados,
  capacitaciones,
  tipo,
  selectedYear,
  selectedMonth,
  metaDefaultHorasAnual = 12,
  metaDefaultHorasMensual = 1
}) => {
  const theme = useTheme();

  // Calcular datos de cumplimiento por empleado
  const empleadosConCumplimiento = useMemo(() => {
    if (!empleados || !capacitaciones) return [];

    const ahora = new Date();
    const añoActual = selectedYear || ahora.getFullYear();
    const mesActual = selectedMonth || ahora.getMonth() + 1;

    return empleados.map(empleado => {
      // Filtrar capacitaciones del empleado según el tipo
      const capacitacionesEmpleado = capacitaciones.filter(cap => {
        // Verificar si el empleado asistió a esta capacitación
        const asistio = cap.empleados?.some(emp => 
          emp.empleadoId === empleado.id && emp.asistio === true
        );
        
        if (!asistio) return false;

        // Parsear fecha de capacitación
        const fechaCap = cap.fechaRealizada?.toDate 
          ? cap.fechaRealizada.toDate() 
          : new Date(cap.fechaRealizada);

        if (!fechaCap || isNaN(fechaCap.getTime())) return false;

        // Filtrar por período según el tipo
        if (tipo === 'anual') {
          return fechaCap.getFullYear() === añoActual && cap.estado !== 'cancelada';
        } else {
          return fechaCap.getFullYear() === añoActual && 
                 fechaCap.getMonth() + 1 === mesActual && 
                 cap.estado !== 'cancelada';
        }
      });

      // Calcular horas realizadas
      const horasRealizadas = capacitacionesEmpleado.reduce((total, cap) => {
        let duracion = 0;
        
        // Manejar diferentes formatos de duración
        if (cap.duracionMinutos) {
          duracion = Number(cap.duracionMinutos) / 60; // Convertir a horas
        } else if (cap.duracion) {
          // Si duración está en horas
          duracion = Number(cap.duracion);
        } else if (cap.duracionHoras) {
          duracion = Number(cap.duracionHoras);
        }
        
        // Validar que sea un número válido y positivo
        if (Number.isNaN(duracion) || duracion <= 0) {
          return total;
        }
        
        return total + duracion;
      }, 0);

      // Determinar horas requeridas
      const horasRequeridas = tipo === 'anual' 
        ? (empleado.metaHorasAnual || metaDefaultHorasAnual)
        : (empleado.metaHorasMensual || metaDefaultHorasMensual);

      // Calcular porcentaje
      const porcentaje = horasRequeridas > 0 
        ? Math.round((horasRealizadas / horasRequeridas) * 100)
        : 0;

      // Determinar estado
      let estado;
      let estadoColor;
      let estadoIcono;
      
      if (porcentaje >= 100) {
        estado = 'Cumple';
        estadoColor = 'success';
        estadoIcono = <CheckCircleIcon />;
      } else if (porcentaje >= 50) {
        estado = 'Parcial';
        estadoColor = 'warning';
        estadoIcono = <WarningIcon />;
      } else if (porcentaje > 0) {
        estado = 'Bajo';
        estadoColor = 'error';
        estadoIcono = <ErrorIcon />;
      } else {
        estado = 'Sin capacitación';
        estadoColor = 'default';
        estadoIcono = <BlockIcon />;
      }

      return {
        id: empleado.id,
        nombre: empleado.nombre || empleado.displayName || 'Sin nombre',
        horasRequeridas,
        horasRealizadas: Math.round(horasRealizadas * 10) / 10, // 1 decimal
        porcentaje,
        estado,
        estadoColor,
        estadoIcono,
        capacitacionesCount: capacitacionesEmpleado.length
      };
    });
  }, [empleados, capacitaciones, tipo, selectedYear, selectedMonth, metaDefaultHorasAnual, metaDefaultHorasMensual]);

  // Ordenar por porcentaje ascendente (los más críticos arriba)
  const empleadosOrdenados = useMemo(() => {
    return [...empleadosConCumplimiento].sort((a, b) => a.porcentaje - b.porcentaje);
  }, [empleadosConCumplimiento]);

  if (!empleados || empleados.length === 0) {
    return (
      <Card elevation={2} sx={{ borderRadius: '16px', p: 2 }}>
        <Typography variant="body2" color="text.secondary">
          No hay empleados disponibles para mostrar el cumplimiento.
        </Typography>
      </Card>
    );
  }

  const getProgressColor = (porcentaje) => {
    if (porcentaje >= 100) return theme.palette.success.main;
    if (porcentaje >= 50) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  return (
    <Card
      elevation={2}
      sx={{
        borderRadius: '16px',
        border: '1px solid #e5e7eb',
        backgroundColor: 'white',
        mb: 2
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#111827' }}>
            Estado {tipo === 'anual' ? 'Anual' : 'Mensual'} del Personal
          </Typography>
          <Chip
            label={`${empleadosOrdenados.length} empleados`}
            size="small"
            sx={{ backgroundColor: '#f3f4f6', color: '#6b7280' }}
          />
        </Box>

        {/* Tabla */}
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, color: '#374151' }}>
                  Empleado
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, color: '#374151' }}>
                  Horas requeridas
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, color: '#374151' }}>
                  Horas realizadas
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#374151' }}>
                  % Cumplimiento
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#374151' }}>
                  Estado
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {empleadosOrdenados.map((empleado) => (
                <TableRow
                  key={empleado.id}
                  sx={{
                    '&:hover': {
                      backgroundColor: '#f9fafb'
                    }
                  }}
                >
                  <TableCell>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {empleado.nombre}
                      </Typography>
                      {empleado.capacitacionesCount > 0 && (
                        <Typography variant="caption" color="text.secondary">
                          {empleado.capacitacionesCount} capacitación{empleado.capacitacionesCount !== 1 ? 'es' : ''}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {empleado.horasRequeridas}h
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontWeight: 600,
                        color: empleado.horasRealizadas > 0 ? 'success.main' : 'text.secondary'
                      }}
                    >
                      {empleado.horasRealizadas}h
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ flex: 1, minWidth: 80 }}>
                        <LinearProgress
                          variant="determinate"
                          value={Math.min(empleado.porcentaje, 100)}
                          sx={{
                            height: 6,
                            borderRadius: 3,
                            backgroundColor: theme.palette.grey[200],
                            '& .MuiLinearProgress-bar': {
                              borderRadius: 3,
                              backgroundColor: getProgressColor(empleado.porcentaje)
                            }
                          }}
                        />
                      </Box>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontWeight: 600,
                          color: getProgressColor(empleado.porcentaje),
                          minWidth: 35
                        }}
                      >
                        {empleado.porcentaje}%
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={empleado.estadoIcono}
                      label={empleado.estado}
                      size="small"
                      color={empleado.estadoColor}
                      variant={empleado.estadoColor === 'default' ? 'outlined' : 'filled'}
                      sx={{
                        fontWeight: 'bold',
                        fontSize: '0.75rem'
                      }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Resumen */}
        <Box sx={{ mt: 2, p: 2, backgroundColor: '#f9fafb', borderRadius: '8px' }}>
          <Typography variant="caption" color="text.secondary">
            <strong>Resumen:</strong> {empleadosOrdenados.filter(e => e.porcentaje >= 100).length} cumplen meta, 
            {' '}{empleadosOrdenados.filter(e => e.porcentaje >= 50 && e.porcentaje < 100).length} parcial, 
            {' '}{empleadosOrdenados.filter(e => e.porcentaje > 0 && e.porcentaje < 50).length} bajo, 
            {' '}{empleadosOrdenados.filter(e => e.porcentaje === 0).length} sin capacitación
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default CapacitacionesPersonalTable;
