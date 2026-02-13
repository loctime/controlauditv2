import React, { useMemo } from 'react';
import { Box, Typography, CircularProgress, Chip } from '@mui/material';
import AssignmentIcon from '@mui/icons-material/Assignment';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';

const COLORS = ['#059669', '#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#d1fae5'];

/**
 * Widget del dashboard: gráfico de barras con nombres de auditorías manuales y sus cantidades.
 * Agrupa por nombre y muestra la cantidad por tipo.
 */
export default function AuditoriasManualesWidget({
  auditoriasManuales = [],
  total = 0,
  loading = false
}) {
  const chartData = useMemo(() => {
    if (!Array.isArray(auditoriasManuales) || auditoriasManuales.length === 0) return [];

    const byName = {};
    auditoriasManuales.forEach((aud) => {
      const nombre = aud.nombre?.trim() || 'Sin nombre';
      byName[nombre] = (byName[nombre] || 0) + 1;
    });

    return Object.entries(byName)
      .map(([nombre, cantidad]) => ({ nombre, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad);
  }, [auditoriasManuales]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 3, gap: 1 }}>
        <CircularProgress size={24} />
        <Typography variant="body2" color="text.secondary">
          Cargando auditorías manuales...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
        <AssignmentIcon sx={{ color: '#059669', fontSize: 28 }} />
        <Typography variant="h6" sx={{ fontWeight: 600, color: '#111827' }}>
          Auditorías manuales
        </Typography>
        <Chip
          label={total === 0 ? 'Sin registros' : `${total} ${total === 1 ? 'auditoría' : 'auditorías'}`}
          size="small"
          sx={{
            backgroundColor: total > 0 ? '#d1fae5' : '#f3f4f6',
            color: total > 0 ? '#065f46' : '#6b7280',
            fontWeight: 600
          }}
        />
      </Box>

      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={Math.max(220, chartData.length * 44)}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 8, right: 24, left: 8, bottom: 8 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
            <XAxis type="number" allowDecimals={false} stroke="#6b7280" />
            <YAxis
              type="category"
              dataKey="nombre"
              width={140}
              tick={{ fontSize: 12 }}
              stroke="#6b7280"
              tickFormatter={(v) => (v.length > 22 ? `${v.slice(0, 22)}…` : v)}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px'
              }}
              formatter={(value) => [value, 'Cantidad']}
              labelFormatter={(label) => `Auditoría: ${label}`}
            />
            <Bar dataKey="cantidad" name="Cantidad" radius={[0, 4, 4, 0]} minPointSize={8}>
              {chartData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <Typography variant="body2" color="text.secondary">
          No hay auditorías manuales para el filtro seleccionado.
        </Typography>
      )}
    </Box>
  );
}
