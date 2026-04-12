import React, { useState } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  IconButton, Select, MenuItem, FormControl, LinearProgress,
} from '@mui/material';
import { Close, History } from '@mui/icons-material';
import { useHistorialAuditorias } from './hooks/useHistorialAuditorias';

const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

// Celda individual con color según cumplimiento
const CeldaMes = ({ realizadas, target, onClick }) => {
  const porcentaje = target > 0 ? Math.round((realizadas / target) * 100) : null;

  const getColor = () => {
    if (target === 0 || target == null) return { bg: '#f5f5f5', text: '#999' };
    if (porcentaje >= 100) return { bg: '#e8f5e9', text: '#2e7d32' };
    if (porcentaje >= 80) return { bg: '#fff8e1', text: '#f57f17' };
    if (porcentaje >= 50) return { bg: '#fff3e0', text: '#e65100' };
    return { bg: '#ffebee', text: '#c62828' };
  };

  const colors = getColor();

  return (
    <TableCell
      align="center"
      onClick={realizadas > 0 || target > 0 ? onClick : undefined}
      sx={{
        cursor: realizadas > 0 || target > 0 ? 'pointer' : 'default',
        bgcolor: colors.bg,
        color: colors.text,
        fontWeight: 600,
        fontSize: '0.85rem',
        p: '6px 4px',
        border: '1px solid #e0e0e0',
        '&:hover': realizadas > 0 || target > 0 ? { opacity: 0.8 } : {},
        minWidth: 52
      }}
    >
      {target > 0
        ? `${realizadas}/${target}`
        : realizadas > 0
          ? realizadas
          : '—'
      }
    </TableCell>
  );
};

const HistorialAuditorias = () => {
  const añoActual = new Date().getFullYear();
  const [añoSeleccionado, setAñoSeleccionado] = useState(añoActual);
  const [drillDown, setDrillDown] = useState(null);
  // { sucursal, mes, realizadas, target }

  const { historial, sucursales, loading } = useHistorialAuditorias(añoSeleccionado);

  const getTotalAnual = (sucursalId) => {
    if (!historial[sucursalId]) return 0;
    return Object.values(historial[sucursalId]).reduce((a, b) => a + b, 0);
  };

  const getTargetAnual = (sucursal) => sucursal.targetAnualAuditorias || 0;

  const getPorcentajeAnual = (sucursal) => {
    const target = getTargetAnual(sucursal);
    if (target === 0) return null;
    return Math.round((getTotalAnual(sucursal.id) / target) * 100);
  };

  const getChipAnual = (sucursal) => {
    const pct = getPorcentajeAnual(sucursal);
    if (pct === null) return null;
    const color = pct >= 100 ? 'success' : pct >= 80 ? 'warning' : 'error';
    return <Chip label={`${pct}%`} size="small" color={color} sx={{ fontWeight: 700, fontSize: '0.75rem' }} />;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 2 }}>
      {/* Header con selector de año */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <History color="primary" />
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Cumplimiento anual por sucursal
          </Typography>
        </Box>
        <FormControl size="small">
          <Select
            value={añoSeleccionado}
            onChange={(e) => setAñoSeleccionado(e.target.value)}
            sx={{ fontSize: '0.9rem' }}
          >
            {[añoActual - 1, añoActual, añoActual + 1].map(y => (
              <MenuItem key={y} value={y}>{y}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Leyenda */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        {[
          { color: '#e8f5e9', text: '≥ 100% (Cumplido)' },
          { color: '#fff8e1', text: '≥ 80% (Bueno)' },
          { color: '#fff3e0', text: '≥ 50% (Regular)' },
          { color: '#ffebee', text: '< 50% (Bajo)' },
          { color: '#f5f5f5', text: 'Sin target' }
        ].map(({ color, text }) => (
          <Box key={text} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 14, height: 14, bgcolor: color, border: '1px solid #ddd', borderRadius: 0.5 }} />
            <Typography variant="caption" color="text.secondary">{text}</Typography>
          </Box>
        ))}
      </Box>

      {sucursales.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
          No hay sucursales registradas
        </Typography>
      ) : (
        <TableContainer component={Paper} elevation={2} sx={{ borderRadius: 2, overflow: 'auto' }}>
          <Table size="small" sx={{ minWidth: 800 }}>
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.100' }}>
                <TableCell sx={{ fontWeight: 700, minWidth: 140 }}>Sucursal</TableCell>
                {MESES.map(m => (
                  <TableCell key={m} align="center" sx={{ fontWeight: 700, fontSize: '0.8rem', p: '8px 4px' }}>
                    {m}
                  </TableCell>
                ))}
                <TableCell align="center" sx={{ fontWeight: 700, minWidth: 90 }}>Total</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, minWidth: 80 }}>Cumpl.</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sucursales.map(sucursal => (
                <TableRow key={sucursal.id} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.85rem' }}>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{sucursal.nombre}</Typography>
                      {sucursal.targetMensual > 0 && (
                        <Typography variant="caption" color="text.secondary">
                          Target: {sucursal.targetMensual}/mes
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(mes => (
                    <CeldaMes
                      key={mes}
                      realizadas={historial[sucursal.id]?.[mes] || 0}
                      target={sucursal.targetMensual || 0}
                      onClick={() => setDrillDown({
                        sucursal,
                        mes,
                        realizadas: historial[sucursal.id]?.[mes] || 0,
                        target: sucursal.targetMensual || 0
                      })}
                    />
                  ))}
                  <TableCell align="center" sx={{ fontWeight: 700 }}>
                    {getTotalAnual(sucursal.id)} / {getTargetAnual(sucursal) || '—'}
                  </TableCell>
                  <TableCell align="center">
                    {getChipAnual(sucursal)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Dialog drill-down */}
      <Dialog
        open={!!drillDown}
        onClose={() => setDrillDown(null)}
        maxWidth="xs"
        fullWidth
      >
        {drillDown && (
          <>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>{drillDown.sucursal.nombre}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {MESES[drillDown.mes - 1]} {añoSeleccionado}
                </Typography>
              </Box>
              <IconButton onClick={() => setDrillDown(null)} size="small"><Close /></IconButton>
            </DialogTitle>
            <DialogContent>
              <Box sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="h3" sx={{ fontWeight: 700, color: 'primary.main' }}>
                  {drillDown.realizadas}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  auditorías realizadas
                </Typography>
                {drillDown.target > 0 && (
                  <>
                    <Typography variant="body2" sx={{ mt: 2, mb: 1 }}>
                      Target mensual: <strong>{drillDown.target}</strong>
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min((drillDown.realizadas / drillDown.target) * 100, 100)}
                      color={drillDown.realizadas >= drillDown.target ? 'success' : 'warning'}
                      sx={{ height: 10, borderRadius: 5, mb: 1 }}
                    />
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      {Math.round((drillDown.realizadas / drillDown.target) * 100)}% cumplido
                    </Typography>
                  </>
                )}
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDrillDown(null)}>Cerrar</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default HistorialAuditorias;
