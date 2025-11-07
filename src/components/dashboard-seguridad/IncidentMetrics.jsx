import React, { useMemo, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Stack
} from '@mui/material';
import {
  Insights as InsightsIcon,
  TrendingUp as TrendingUpIcon,
  EventAvailable as EventAvailableIcon,
  InfoOutlined as InfoIcon
} from '@mui/icons-material';

const formatDate = (isoString) => {
  if (!isoString) return 'Fecha desconocida';
  try {
    return new Date(isoString).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch (error) {
    return 'Fecha desconocida';
  }
};

export default function IncidentMetrics({
  totalIncidents = 0,
  incidentTrend = [],
  incidentAccidentRatio = 0,
  daysWithoutIncidents = 0,
  recentIncidents = []
}) {
  const [openModal, setOpenModal] = useState(false);

  const { trendData, maxTrend } = useMemo(() => {
    if (!incidentTrend || incidentTrend.length === 0) {
      const fallback = Array.from({ length: 6 }).map((_, index) => ({
        label: `M${index + 1}`,
        value: 0
      }));
      return { trendData: fallback, maxTrend: 1 };
    }

    const maxValue = Math.max(...incidentTrend.map(item => item.value || 0), 1);
    return { trendData: incidentTrend, maxTrend: maxValue };
  }, [incidentTrend]);

  const ratioLabel = useMemo(() => {
    if (!incidentAccidentRatio || Number.isNaN(incidentAccidentRatio)) {
      return 'Sin datos';
    }
    return `${incidentAccidentRatio}:1`;
  }, [incidentAccidentRatio]);

  const noRecentIncidents = !recentIncidents || recentIncidents.length === 0;

  return (
    <>
      <Paper
        elevation={2}
        sx={{
          p: 3,
          backgroundColor: 'white',
          borderRadius: '16px',
          border: '1px solid #e5e7eb'
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 2
          }}
        >
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              color: '#111827',
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}
          >
            🚨 INCIDENTES
          </Typography>

          <Chip
            icon={<InsightsIcon sx={{ color: 'white !important' }} />}
            label={noRecentIncidents ? 'Sin registros' : 'activo'}
            size="small"
            sx={{
              backgroundColor: noRecentIncidents ? '#9ca3af' : '#f97316',
              color: 'white',
              fontWeight: 600
            }}
          />
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 2 }}>
            <Typography
              variant="h1"
              sx={{
                fontWeight: 'bold',
                color: totalIncidents === 0 ? '#22c55e' : '#ef4444',
                lineHeight: 1
              }}
            >
              {totalIncidents}
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>
                Incidentes reportados
              </Typography>
              <Button
                size="small"
                variant="outlined"
                onClick={() => setOpenModal(true)}
              >
                Ver
              </Button>
            </Box>
          </Box>

          <Box>
           
            <Box
              sx={{
                mt: 1,
                display: 'flex',
                alignItems: 'flex-end',
                gap: 1.25,
                height: 60
              }}
            >
              {trendData.map(({ label, value }, index) => {
                const proportion = Math.max((value / maxTrend) * 100, 4);
                return (
                  <Box key={`${label}-${index}`} sx={{ textAlign: 'center' }}>
                    <Box
                      sx={{
                        width: 12,
                        borderRadius: '6px 6px 0 0',
                        backgroundColor: value === 0 ? '#e5e7eb' : '#f97316',
                        height: `${proportion}%`,
                        minHeight: value === 0 ? 6 : 12,
                        transition: 'height 0.3s ease'
                      }}
                    />
                    <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                      {label}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          </Box>

          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Chip
              icon={<InfoIcon />}
              label={`Ratio: ${ratioLabel}`}
              sx={{
                backgroundColor: '#ede9fe',
                color: '#5b21b6',
                fontWeight: 600
              }}
            />
            <Chip
              icon={<EventAvailableIcon />}
              label={`Días sin incidentes: ${daysWithoutIncidents}`}
              sx={{
                backgroundColor: daysWithoutIncidents > 30 ? '#dcfce7' : '#fef3c7',
                color: daysWithoutIncidents > 30 ? '#15803d' : '#b45309',
                fontWeight: 600
              }}
            />
          </Stack>
        </Box>
      </Paper>

      <Dialog open={openModal} onClose={() => setOpenModal(false)} fullWidth maxWidth="md">
        <DialogTitle>Detalle de incidentes recientes</DialogTitle>
        <DialogContent dividers>
          {noRecentIncidents ? (
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              No hay incidentes registrados en los últimos meses.
            </Typography>
          ) : (
            <Stack spacing={2}>
              {recentIncidents.map((incident, index) => (
                <Box key={`${incident.id}-${index}`} sx={{ p: 2, border: '1px solid #e2e8f0', borderRadius: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {incident.tipo || 'Incidente'}
                    </Typography>
                    <Chip
                      size="small"
                      label={incident.estado || 'SIN ESTADO'}
                      sx={{ fontWeight: 600 }}
                    />
                  </Box>
                  <Typography variant="body2" sx={{ color: '#475569' }}>
                    Fecha: {formatDate(incident.fecha)}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#475569' }}>
                    Área: {incident.area || 'Sin asignar'}
                  </Typography>
                  {incident.responsable && (
                    <Typography variant="body2" sx={{ color: '#475569' }}>
                      Responsable: {incident.responsable}
                    </Typography>
                  )}
                  {incident.descripcion && (
                    <Typography variant="body2" sx={{ color: '#64748b', mt: 1 }}>
                      {incident.descripcion}
                    </Typography>
                  )}
                </Box>
              ))}
            </Stack>
          )}
        </DialogContent>
        <Divider />
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setOpenModal(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

