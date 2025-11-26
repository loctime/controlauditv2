// src/components/pages/dashboard/components/TargetsMensualesCard.jsx
import React, { useState, useEffect } from 'react';
import {
  Paper,
  Box,
  Typography,
  Chip,
  CircularProgress,
  Grid,
  LinearProgress,
  useTheme
} from '@mui/material';
import AssignmentIcon from '@mui/icons-material/Assignment';
import { calcularProgresoTargets } from '../../../../utils/sucursalTargetUtils';

export default function TargetsMensualesCard({ sucursales, selectedSucursal }) {
  const theme = useTheme();
  const [progresos, setProgresos] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargarProgresos = async () => {
      if (!sucursales || sucursales.length === 0) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Filtrar sucursales según selección
        let sucursalesACalcular = sucursales;
        if (selectedSucursal && selectedSucursal !== 'todas') {
          sucursalesACalcular = sucursales.filter(s => s.id === selectedSucursal);
        }

        // Solo calcular para sucursales con target > 0
        const sucursalesConTarget = sucursalesACalcular.filter(s => (s.targetMensual || 0) > 0);
        
        if (sucursalesConTarget.length === 0) {
          setProgresos({});
          setLoading(false);
          return;
        }

        const progresosCalculados = await calcularProgresoTargets(sucursalesConTarget);
        setProgresos(progresosCalculados);
      } catch (error) {
        console.error('Error cargando progresos de targets:', error);
      } finally {
        setLoading(false);
      }
    };

    cargarProgresos();
  }, [sucursales, selectedSucursal]);

  // Calcular resumen general
  const resumen = React.useMemo(() => {
    const sucursalesConTarget = sucursales?.filter(s => (s.targetMensual || 0) > 0) || [];
    
    if (sucursalesConTarget.length === 0) {
      return null;
    }

    let totalCompletadas = 0;
    let totalTarget = 0;

    sucursalesConTarget.forEach(sucursal => {
      const progreso = progresos[sucursal.id];
      if (progreso) {
        totalCompletadas += progreso.completadas;
        totalTarget += progreso.target;
      } else if (sucursal.targetMensual) {
        totalTarget += sucursal.targetMensual;
      }
    });

    const porcentaje = totalTarget > 0 ? Math.round((totalCompletadas / totalTarget) * 100) : 0;

    return {
      completadas: totalCompletadas,
      target: totalTarget,
      porcentaje,
      sucursalesConTarget: sucursalesConTarget.length
    };
  }, [sucursales, progresos]);

  if (loading) {
    return (
      <Paper
        elevation={2}
        sx={{
          p: 2,
          borderRadius: '16px',
          border: '1px solid #e5e7eb',
          backgroundColor: 'white'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <CircularProgress size={24} />
          <Typography variant="body2" color="text.secondary">
            Cargando progreso de targets...
          </Typography>
        </Box>
      </Paper>
    );
  }

  if (!resumen || resumen.sucursalesConTarget === 0) {
    return null; // No mostrar si no hay targets configurados
  }

  const getColor = (porcentaje) => {
    if (porcentaje >= 100) return 'success';
    if (porcentaje >= 80) return 'success';
    if (porcentaje >= 50) return 'warning';
    return 'error';
  };

  return (
    <Paper
      elevation={2}
      sx={{
        p: 2.5,
        borderRadius: '16px',
        border: '1px solid #e5e7eb',
        backgroundColor: 'white'
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
        <AssignmentIcon sx={{ color: '#4f46e5', fontSize: 28 }} />
        <Typography variant="h6" sx={{ fontWeight: 600, color: '#111827' }}>
          Targets Mensuales de Auditorías
        </Typography>
      </Box>

      {/* Resumen general */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Progreso General
          </Typography>
          <Chip
            label={`${resumen.completadas} / ${resumen.target} (${resumen.porcentaje}%)`}
            size="small"
            color={getColor(resumen.porcentaje)}
            sx={{ fontWeight: 'bold' }}
          />
        </Box>
        <LinearProgress
          variant="determinate"
          value={Math.min(resumen.porcentaje, 100)}
          sx={{
            height: 8,
            borderRadius: 4,
            backgroundColor: theme.palette.grey[200],
            '& .MuiLinearProgress-bar': {
              borderRadius: 4
            }
          }}
          color={getColor(resumen.porcentaje)}
        />
      </Box>

      {/* Detalle por sucursal */}
      {selectedSucursal === 'todas' && (
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, fontWeight: 500 }}>
            Por Sucursal:
          </Typography>
          <Grid container spacing={2}>
            {sucursales
              ?.filter(s => (s.targetMensual || 0) > 0)
              .map((sucursal) => {
                const progreso = progresos[sucursal.id] || {
                  completadas: 0,
                  target: sucursal.targetMensual || 0,
                  porcentaje: 0,
                  estado: 'sin_target'
                };

                return (
                  <Grid item xs={12} sm={6} md={4} key={sucursal.id}>
                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: '12px',
                        border: `1px solid ${theme.palette.divider}`,
                        backgroundColor: theme.palette.background.paper
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 600, mb: 1, color: '#111827' }}
                        noWrap
                      >
                        {sucursal.nombre}
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">
                          {progreso.completadas} / {progreso.target}
                        </Typography>
                        <Chip
                          label={`${progreso.porcentaje}%`}
                          size="small"
                          color={getColor(progreso.porcentaje)}
                          sx={{ height: 20, fontSize: '0.7rem' }}
                        />
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(progreso.porcentaje, 100)}
                        sx={{
                          height: 4,
                          borderRadius: 2
                        }}
                        color={getColor(progreso.porcentaje)}
                      />
                    </Box>
                  </Grid>
                );
              })}
          </Grid>
        </Box>
      )}
    </Paper>
  );
}

