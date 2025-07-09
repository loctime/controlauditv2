// src/components/EstadisticasChart.jsx
import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Typography, Grid } from '@mui/material';

const colors = {
  'Conforme': '#82ca9d',
  'No conforme': '#ff4d4d',
  'Necesita mejora': '#ffcc00',
  'No aplica': '#00bcd4',
};

const EstadisticasChart = ({ estadisticas, title }) => (
  <Grid size={{ xs: 12, md: 6 }}>
    <Typography variant="h6" gutterBottom>
      {title}
    </Typography>
    <ResponsiveContainer width="100%" height={500}>
      <PieChart>
        <Pie
          data={Object.keys(estadisticas).map(key => ({ name: key, value: estadisticas[key] }))}
          dataKey="value"
          nameKey="name"
          outerRadius={120}
          fill="#8884d8"
          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(2)}%`}
        >
          {Object.keys(estadisticas).map((key, index) => (
            <Cell key={`cell-${index}`} fill={colors[key] || '#8884d8'} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  </Grid>
);

export default EstadisticasChart;