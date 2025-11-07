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
  Stack,
  Grid,
  IconButton
} from '@mui/material';
import {
  Insights as InsightsIcon,
  TrendingUp as TrendingUpIcon,
  EventAvailable as EventAvailableIcon,
  InfoOutlined as InfoIcon,
  Group as GroupIcon,
  PhotoCamera as PhotoCameraIcon,
  ImageSearch as ImageSearchIcon
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
  recentIncidents = [],
  companyId,
  sucursalId
}) {
  const [openModal, setOpenModal] = useState(false);
  const [openImageModal, setOpenImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

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
    if (incidentAccidentRatio === null || Number.isNaN(incidentAccidentRatio)) {
      return 'Sin datos';
    }
    return `${incidentAccidentRatio}:1`;
  }, [incidentAccidentRatio]);

  const noRecentIncidents = !recentIncidents || recentIncidents.length === 0;

  const handleNavigate = (incident) => {
    const params = new URLSearchParams();
    if (incident?.id) params.set('accidenteId', incident.id);
    const targetEmpresa = incident?.empresaId || companyId;
    const targetSucursal = incident?.sucursalId || sucursalId;
    if (targetEmpresa) params.set('empresaId', targetEmpresa);
    if (targetSucursal) params.set('sucursalId', targetSucursal);

    const url = `/accidentes${params.toString() ? `?${params.toString()}` : ''}`;

    if (typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleOpenImage = (imageUrl) => {
    setSelectedImage(imageUrl);
    setOpenImageModal(true);
  };

  const handleCloseImage = () => {
    setOpenImageModal(false);
    setSelectedImage(null);
  };

  const formatDateTime = (isoString) => {
    if (!isoString) return 'Fecha desconocida';
    try {
      return new Date(isoString).toLocaleString('es-AR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Fecha desconocida';
    }
  };

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
                <Paper key={`${incident.id}-${index}`} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                  <Grid container spacing={2} alignItems="flex-start">
                    <Grid item xs={12} md={6}>
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
                      <Stack spacing={0.5} sx={{ color: '#475569' }}>
                        <Typography variant="body2">Fecha: {formatDateTime(incident.fecha)}</Typography>
                        <Typography variant="body2">Área: {incident.area || 'Sin asignar'}</Typography>
                        {incident.responsable && (
                          <Typography variant="body2">Responsable: {incident.responsable}</Typography>
                        )}
                      </Stack>
                      {incident.descripcion && (
                        <Typography variant="body2" sx={{ color: '#64748b', mt: 1 }}>
                          {incident.descripcion}
                        </Typography>
                      )}
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <Stack spacing={1}>
                        {Array.isArray(incident.empleadosInvolucrados) && incident.empleadosInvolucrados.length > 0 && (
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#1f2937', mb: 0.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <GroupIcon fontSize="small" /> Involucrados
                            </Typography>
                            <Stack direction="row" spacing={0.5} useFlexGap flexWrap="wrap">
                              {incident.empleadosInvolucrados.map((emp) => (
                                <Chip
                                  key={emp.id}
                                  label={`${emp.nombre}${emp.conReposo ? ' (con reposo)' : ''}`}
                                  color={emp.conReposo ? 'error' : 'default'}
                                  size="small"
                                />
                              ))}
                            </Stack>
                          </Box>
                        )}

                        {Array.isArray(incident.testigos) && incident.testigos.length > 0 && (
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#1f2937', mb: 0.5 }}>
                              Testigos
                            </Typography>
                            <Stack direction="row" spacing={0.5} useFlexGap flexWrap="wrap">
                              {incident.testigos.map((testigo) => (
                                <Chip key={testigo.id} label={testigo.nombre} size="small" />
                              ))}
                            </Stack>
                          </Box>
                        )}

                        {Array.isArray(incident.imagenes) && incident.imagenes.length > 0 && (
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#1f2937', mb: 0.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <PhotoCameraIcon fontSize="small" /> Evidencias
                            </Typography>
                            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                              {incident.imagenes.map((img, imgIndex) => (
                                <IconButton
                                  key={`${incident.id}-img-${imgIndex}`}
                                  onClick={() => handleOpenImage(img)}
                                  size="small"
                                  sx={{
                                    width: 48,
                                    height: 48,
                                    border: '1px solid #e2e8f0',
                                    borderRadius: 1,
                                    backgroundImage: `url(${img})`,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center'
                                  }}
                                >
                                  <ImageSearchIcon sx={{ color: '#fff', textShadow: '0 0 6px rgba(0,0,0,0.6)' }} fontSize="small" />
                                </IconButton>
                              ))}
                            </Stack>
                          </Box>
                        )}
                      </Stack>
                    </Grid>
                  </Grid>
                </Paper>
              ))}
            </Stack>
          )}
        </DialogContent>
        <Divider />
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setOpenModal(false)}>Cerrar</Button>
          {!noRecentIncidents && (
            <Button
              variant="contained"
              onClick={() => handleNavigate(recentIncidents[0])}
            >
              Ir a Accidentes
            </Button>
          )}
        </DialogActions>
      </Dialog>

      <Dialog open={openImageModal} onClose={handleCloseImage} maxWidth="lg">
        {selectedImage && (
          <Box sx={{ p: 2 }}>
            <Box
              component="img"
              src={selectedImage}
              alt="Evidencia de incidente"
              sx={{ maxWidth: '80vw', maxHeight: '70vh', objectFit: 'contain', borderRadius: 2 }}
            />
          </Box>
        )}
        <DialogActions>
          <Button onClick={handleCloseImage}>Cerrar</Button>
          {selectedImage && (
            <Button onClick={() => window.open(selectedImage, '_blank')} variant="contained">
              Abrir en nueva pestaña
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
}

