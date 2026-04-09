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
 * Widget del dashboard: gráfico de barras con auditorías manuales agrupadas por mes.
 * Muestra la cantidad de auditorías manuales realizadas cada mes del año.
 */
export default function AuditoriasManualesWidget({
  auditoriasManuales = [],
  total = 0,
  loading = false,
  selectedYear
}) {
  const chartData = useMemo(() => {
    if (!Array.isArray(auditoriasManuales) || auditoriasManuales.length === 0) return [];

    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const currentYear = new Date().getFullYear();
    
    // Initialize all months with 0
    const byMonth = {};
    months.forEach((month, index) => {
      byMonth[month] = 0;
    });

    // Count auditorías by month (filtering by selected year)
    const yearToUse = selectedYear || currentYear;
    
    auditoriasManuales.forEach((aud) => {
      let fecha = null;
      
      // Try to get the date from different possible fields
      if (aud.fechaCreacion) {
        fecha = aud.fechaCreacion.toDate ? aud.fechaCreacion.toDate() : new Date(aud.fechaCreacion);
      } else if (aud.fecha) {
        fecha = aud.fecha.toDate ? aud.fecha.toDate() : new Date(aud.fecha);
      } else if (aud.timestamp) {
        fecha = aud.timestamp.toDate ? aud.timestamp.toDate() : new Date(aud.timestamp);
      }
      
      if (fecha && !isNaN(fecha.getTime())) {
        // Filter by selected year
        if (fecha.getFullYear() === yearToUse) {
          const monthIndex = fecha.getMonth();
          const monthName = months[monthIndex];
          byMonth[monthName] = (byMonth[monthName] || 0) + 1;
        }
      }
    });

    // Convert to chart format - show all 12 months
    return months.map(month => ({
      mes: month,
      cantidad: byMonth[month] || 0
    }));
  }, [auditoriasManuales, selectedYear]);

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
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={chartData}
            margin={{ top: 8, right: 24, left: 8, bottom: 8 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="mes" 
              tick={{ fontSize: 12 }}
              stroke="#6b7280"
            />
            <YAxis 
              allowDecimals={false}
              tick={{ fontSize: 12 }}
              stroke="#6b7280"
              domain={[0, 'dataMax']}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px'
              }}
              formatter={(value) => [value, 'Auditorías']}
              labelFormatter={(label) => `Mes: ${label}`}
            />
            <Bar dataKey="cantidad" name="Cantidad" radius={[4, 4, 0, 0]} minPointSize={2}>
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
