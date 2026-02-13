// src/components/pages/dashboard/components/CapacitacionesGoalsCard.jsx
import React from 'react';
import { Card, CardContent, Box, Typography, Grid, LinearProgress, Chip, useTheme } from '@mui/material';
import { School as SchoolIcon } from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import GoalsCard from './GoalsCard';

/**
 * Componente para mostrar cumplimiento de metas de capacitaciones
 * @param {Object} cumplimiento - { mensual: {...}, anual: {...} }
 * @param {string} sucursalNombre - Nombre de la sucursal (opcional)
 */
const CapacitacionesGoalsCard = ({ cumplimiento, sucursalNombre = '' }) => {
  const theme = useTheme();

  if (!cumplimiento) {
    return (
      <Card elevation={2} sx={{ borderRadius: '16px', p: 2 }}>
        <Typography variant="body2" color="text.secondary">
          No hay datos de cumplimiento disponibles
        </Typography>
      </Card>
    );
  }

  const { mensual, anual } = cumplimiento;

  // Datos para gráfico de barras (últimos 6 meses)
  const mesesData = [
    { mes: 'Jul', valor: 0, target: mensual.target },
    { mes: 'Ago', valor: 0, target: mensual.target },
    { mes: 'Sep', valor: 0, target: mensual.target },
    { mes: 'Oct', valor: 0, target: mensual.target },
    { mes: 'Nov', valor: mensual.completadas, target: mensual.target },
    { mes: 'Dic', valor: 0, target: mensual.target }
  ];

  const getColor = (porcentaje) => {
    if (porcentaje >= 100) return '#22c55e';
    if (porcentaje >= 50) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <Card
      elevation={2}
      sx={{
        borderRadius: '16px',
        border: '1px solid #e5e7eb',
        backgroundColor: 'white',
        height: '100%'
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
          <SchoolIcon sx={{ fontSize: 32, color: '#4f46e5' }} />
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#111827' }}>
            Metas de Capacitaciones{sucursalNombre ? ` - ${sucursalNombre}` : ''}
          </Typography>
        </Box>

        <Grid container spacing={2}>
          {/* Card Mensual */}
          <Grid item xs={12} md={6}>
            <GoalsCard
              tipo="capacitaciones"
              valor={mensual.completadas}
              target={mensual.target}
              porcentaje={mensual.porcentaje}
              estado={mensual.estado}
              periodo="mensual"
            />
          </Grid>

          {/* Card Anual */}
          <Grid item xs={12} md={6}>
            <GoalsCard
              tipo="capacitaciones"
              valor={anual.completadas}
              target={anual.target}
              porcentaje={anual.porcentaje}
              estado={anual.estado}
              periodo="anual"
            />
          </Grid>

          {/* Gráfico de tendencia mensual */}
          {mensual.target > 0 && (
            <Grid item xs={12}>
              <Box sx={{ mt: 2, p: 2, backgroundColor: '#f9fafb', borderRadius: '12px' }}>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 2, color: '#111827' }}>
                  Tendencia Mensual (Últimos 6 meses)
                </Typography>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={mesesData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="mes" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="valor" name="Realizadas" radius={[8, 8, 0, 0]}>
                      {mesesData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getColor((entry.valor / entry.target) * 100)} />
                      ))}
                    </Bar>
                    <Bar dataKey="target" name="Meta" fill="#e5e7eb" opacity={0.3} radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </Grid>
          )}

          {/* Resumen acumulado anual */}
          <Grid item xs={12}>
            <Box
              sx={{
                p: 2,
                borderRadius: '12px',
                border: '1px solid #e5e7eb',
                backgroundColor: '#f9fafb'
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, color: '#111827' }}>
                Cumplimiento Acumulado Anual
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2" color="text.secondary">
                      {anual.completadas}h de {anual.target}h
                    </Typography>
                    <Chip
                      label={`${anual.porcentaje}%`}
                      size="small"
                      sx={{
                        backgroundColor: getColor(anual.porcentaje),
                        color: 'white',
                        fontWeight: 'bold'
                      }}
                    />
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(anual.porcentaje, 100)}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: theme.palette.grey[200],
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 4,
                        backgroundColor: getColor(anual.porcentaje)
                      }
                    }}
                  />
                </Box>
              </Box>
              {/* Mostrar referencia a cantidad de capacitaciones */}
              {anual.capacitacionesCount !== undefined && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  Basado en {anual.capacitacionesCount} capacitación{anual.capacitacionesCount !== 1 ? 'es' : ''} realizadas
                </Typography>
              )}
              {anual.porcentaje >= 100 && (
                <Typography variant="caption" color="success.main" sx={{ mt: 1, display: 'block' }}>
                  ✅ Meta anual cumplida
                </Typography>
              )}
              {anual.porcentaje > 100 && (
                <Typography variant="caption" color="success.main" sx={{ mt: 0.5, display: 'block' }}>
                  🎉 Superaste la meta anual en {(anual.completadas - anual.target).toFixed(1)} horas
                </Typography>
              )}
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default CapacitacionesGoalsCard;
