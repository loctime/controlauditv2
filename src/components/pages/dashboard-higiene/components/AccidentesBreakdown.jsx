import React from 'react';
import { Grid, Card, CardContent, Typography, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import { 
  ReportProblem as ReportProblemIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

/**
 * Componente para análisis detallado de accidentes e incidentes
 */
const AccidentesBreakdown = React.memo(({ analysis }) => {
  if (!analysis || analysis.total === 0) {
    return (
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3, color: 'text.primary' }}>
          🚨 Análisis de Accidentes e Incidentes
        </Typography>
        <Card elevation={2} sx={{ borderRadius: 2, p: 3, textAlign: 'center' }}>
          <CheckCircleIcon sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
          <Typography variant="h6" color="text.secondary">
            No hay accidentes ni incidentes registrados en el período seleccionado
          </Typography>
        </Card>
      </Box>
    );
  }

  // Datos para gráfico de barras - Distribución por tipo
  const distribucionTipoData = [
    {
      name: 'Accidentes',
      valor: analysis.accidentes,
      color: '#ef4444'
    },
    {
      name: 'Incidentes',
      valor: analysis.incidentes,
      color: '#f59e0b'
    }
  ];

  // Datos para gráfico de torta - Por estado
  const estadoData = [
    {
      name: 'Abiertos',
      value: analysis.abiertos,
      color: '#ef4444'
    },
    {
      name: 'Cerrados',
      value: analysis.cerrados,
      color: '#22c55e'
    }
  ];

  // Datos para gráfico de barras - Por área (top 5)
  const porAreaData = Object.entries(analysis.porArea)
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 5)
    .map(([area, datos]) => ({
      name: area,
      accidentes: datos.accidentes || 0,
      incidentes: datos.incidentes || 0,
      total: datos.total
    }));

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <Box sx={{ 
          p: 1.5, 
          backgroundColor: 'background.paper', 
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
          boxShadow: 3
        }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {label}
          </Typography>
          {payload.map((entry, index) => (
            <Typography key={index} variant="body2" sx={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </Typography>
          ))}
        </Box>
      );
    }
    return null;
  };

  const getRatioColor = (ratio) => {
    // Ratio alto = buena cultura (más incidentes reportados)
    return ratio >= 5 ? '#22c55e' : ratio >= 2 ? '#f59e0b' : '#ef4444';
  };

  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3, color: 'text.primary' }}>
        🚨 Análisis de Accidentes e Incidentes
      </Typography>

      {/* Cards de Resumen */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={4} md={2}>
          <Card elevation={2} sx={{ borderRadius: 2, textAlign: 'center', p: 2 }}>
            <ReportProblemIcon sx={{ fontSize: 32, color: 'error.main', mb: 1 }} />
            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
              {analysis.total}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Total Registros
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={6} sm={4} md={2}>
          <Card elevation={2} sx={{ borderRadius: 2, textAlign: 'center', p: 2 }}>
            <ErrorIcon sx={{ fontSize: 32, color: 'error.main', mb: 1 }} />
            <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'error.main' }}>
              {analysis.accidentes}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Accidentes
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={6} sm={4} md={2}>
          <Card elevation={2} sx={{ borderRadius: 2, textAlign: 'center', p: 2 }}>
            <WarningIcon sx={{ fontSize: 32, color: 'warning.main', mb: 1 }} />
            <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'warning.main' }}>
              {analysis.incidentes}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Incidentes
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={6} sm={4} md={2}>
          <Card elevation={2} sx={{ borderRadius: 2, textAlign: 'center', p: 2 }}>
            <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'error.main' }}>
              {analysis.conTiempoPerdido}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Con Tiempo Perdido
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={6} sm={4} md={2}>
          <Card elevation={2} sx={{ borderRadius: 2, textAlign: 'center', p: 2 }}>
            <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'warning.main' }}>
              {analysis.abiertos}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Abiertos
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={6} sm={4} md={2}>
          <Card 
            elevation={2} 
            sx={{ 
              borderRadius: 2, 
              textAlign: 'center', 
              p: 2,
              border: `2px solid ${getRatioColor(analysis.ratioIncidentes)}`
            }}
          >
            <Typography variant="h4" sx={{ fontWeight: 'bold', color: getRatioColor(analysis.ratioIncidentes) }}>
              {analysis.ratioIncidentes.toFixed(1)}:1
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Ratio Incidentes/Accidentes
            </Typography>
            <Typography variant="caption" sx={{ fontSize: '0.65rem', display: 'block', mt: 0.5 }}>
              {analysis.ratioIncidentes >= 5 ? '✅ Excelente cultura' : analysis.ratioIncidentes >= 2 ? '⚠️ Aceptable' : '❌ Mejorar reporte'}
            </Typography>
          </Card>
        </Grid>
      </Grid>

      {/* Gráficos */}
      <Grid container spacing={2}>
        {/* Gráfico de Barras - Distribución por Tipo */}
        <Grid item xs={12} md={6}>
          <Card elevation={2} sx={{ borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Distribución por Tipo
              </Typography>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={distribucionTipoData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="valor" radius={[4, 4, 0, 0]}>
                    {distribucionTipoData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Gráfico de Torta - Por Estado */}
        <Grid item xs={12} md={6}>
          <Card elevation={2} sx={{ borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Por Estado
              </Typography>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={estadoData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {estadoData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Gráfico de Barras - Por Área (si hay datos) */}
        {porAreaData.length > 0 && (
          <Grid item xs={12}>
            <Card elevation={2} sx={{ borderRadius: 2 }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  Distribución por Área (Top 5)
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={porAreaData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="accidentes" fill="#ef4444" name="Accidentes" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="incidentes" fill="#f59e0b" name="Incidentes" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Tabla Resumen */}
        <Grid item xs={12}>
          <Card elevation={2} sx={{ borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Resumen Detallado
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Categoría</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>Cantidad</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>Porcentaje</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>Total Registros</TableCell>
                      <TableCell align="right">{analysis.total}</TableCell>
                      <TableCell align="right">100%</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Accidentes</TableCell>
                      <TableCell align="right">{analysis.accidentes}</TableCell>
                      <TableCell align="right">
                        {analysis.total > 0 ? ((analysis.accidentes / analysis.total) * 100).toFixed(1) : 0}%
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Incidentes</TableCell>
                      <TableCell align="right">{analysis.incidentes}</TableCell>
                      <TableCell align="right">
                        {analysis.total > 0 ? ((analysis.incidentes / analysis.total) * 100).toFixed(1) : 0}%
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Accidentes con Tiempo Perdido</TableCell>
                      <TableCell align="right">{analysis.conTiempoPerdido}</TableCell>
                      <TableCell align="right">
                        {analysis.accidentes > 0 ? ((analysis.conTiempoPerdido / analysis.accidentes) * 100).toFixed(1) : 0}%
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Accidentes sin Tiempo Perdido</TableCell>
                      <TableCell align="right">{analysis.sinTiempoPerdido}</TableCell>
                      <TableCell align="right">
                        {analysis.accidentes > 0 ? ((analysis.sinTiempoPerdido / analysis.accidentes) * 100).toFixed(1) : 0}%
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Abiertos</TableCell>
                      <TableCell align="right">{analysis.abiertos}</TableCell>
                      <TableCell align="right">
                        {analysis.total > 0 ? ((analysis.abiertos / analysis.total) * 100).toFixed(1) : 0}%
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Cerrados</TableCell>
                      <TableCell align="right">{analysis.cerrados}</TableCell>
                      <TableCell align="right">
                        {analysis.total > 0 ? ((analysis.cerrados / analysis.total) * 100).toFixed(1) : 0}%
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
});

AccidentesBreakdown.displayName = 'AccidentesBreakdown';

export default AccidentesBreakdown;


