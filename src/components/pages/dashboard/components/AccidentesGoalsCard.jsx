import logger from '@/utils/logger';
// src/components/pages/dashboard/components/AccidentesGoalsCard.jsx
import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  Box, 
  Typography, 
  Chip, 
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  useTheme
} from '@mui/material';
import { Warning as WarningIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../../../firebaseControlFile';
import Swal from 'sweetalert2';

/**
 * Componente para mostrar días sin accidentes con semáforo
 * @param {Object} datosAccidentes - { dias, estado, fechaUltimoAccidente, semaforo }
 * @param {string} sucursalId - ID de la sucursal (para reiniciar contador)
 * @param {string} sucursalNombre - Nombre de la sucursal (opcional)
 * @param {boolean} puedeReiniciar - Si el usuario puede reiniciar el contador (solo admin)
 */
const AccidentesGoalsCard = ({ 
  datosAccidentes, 
  sucursalId, 
  sucursalNombre = '',
  puedeReiniciar = false 
}) => {
  const theme = useTheme();
  const [openDialog, setOpenDialog] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!datosAccidentes) {
    return (
      <Card elevation={2} sx={{ borderRadius: '16px', p: 2 }}>
        <Typography variant="body2" color="text.secondary">
          No hay datos de accidentes disponibles
        </Typography>
      </Card>
    );
  }

  const { dias, estado, fechaUltimoAccidente, semaforo } = datosAccidentes;

  // Configuración del semáforo
  const semaforoConfig = {
    green: {
      color: '#22c55e',
      label: 'EXCELENTE',
      mensaje: 'Más de 30 días sin accidentes',
      icon: '✅'
    },
    yellow: {
      color: '#f59e0b',
      label: 'ALERTA',
      mensaje: 'Entre 7 y 30 días sin accidentes',
      icon: '⚠️'
    },
    red: {
      color: '#ef4444',
      label: 'CRÍTICO',
      mensaje: 'Menos de 7 días sin accidentes',
      icon: '🚨'
    },
    gray: {
      color: '#9ca3af',
      label: 'SIN DATOS',
      mensaje: 'No hay información disponible',
      icon: '❓'
    }
  };

  const config = semaforoConfig[semaforo] || semaforoConfig.gray;

  // Formatear fecha del último accidente
  const formatearFecha = (fecha) => {
    if (!fecha) return 'N/A';
    try {
      const fechaObj = fecha instanceof Date ? fecha : new Date(fecha);
      return fechaObj.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      return 'N/A';
    }
  };

  // Reiniciar contador de días sin accidentes
  const handleReiniciarContador = async () => {
    if (!sucursalId) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se puede reiniciar el contador sin ID de sucursal'
      });
      return;
    }

    setLoading(true);
    try {
      // Establecer fechaUltimoAccidente a null para que se calcule desde la fecha de creación
      // O establecer una fecha muy antigua para mostrar muchos días
      const sucursalRef = doc(db, 'sucursales', sucursalId);
      await updateDoc(sucursalRef, {
        fechaUltimoAccidente: null
      });

      Swal.fire({
        icon: 'success',
        title: 'Contador reiniciado',
        text: 'El contador de días sin accidentes ha sido reiniciado',
        timer: 2000
      });

      setOpenDialog(false);
      // Recargar la página o actualizar datos
      window.location.reload();
    } catch (error) {
      logger.error('Error reiniciando contador:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo reiniciar el contador: ' + error.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Card
        elevation={2}
        sx={{
          borderRadius: '16px',
          border: '1px solid #e5e7eb',
          backgroundColor: 'white',
          height: '100%',
          transition: 'transform 0.2s, box-shadow 0.2s',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: 4
          }
        }}
      >
        <CardContent sx={{ p: 2.5 }}>
          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
            <WarningIcon sx={{ fontSize: 32, color: config.color }} />
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#111827' }}>
                Días sin Accidentes{sucursalNombre ? ` - ${sucursalNombre}` : ''}
              </Typography>
            </Box>
          </Box>

          {/* Semáforo visual grande */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              mb: 3,
              p: 3,
              borderRadius: '12px',
              backgroundColor: `${config.color}15`,
              border: `2px solid ${config.color}40`
            }}
          >
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                backgroundColor: config.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 2,
                boxShadow: `0 0 20px ${config.color}60`
              }}
            >
              <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'white' }}>
                {dias}
              </Typography>
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 600, color: config.color, mb: 0.5 }}>
              {config.icon} {config.label}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
              {config.mensaje}
            </Typography>
          </Box>

          {/* Información adicional */}
          <Box
            sx={{
              p: 2,
              borderRadius: '12px',
              backgroundColor: '#f9fafb',
              border: '1px solid #e5e7eb'
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Último accidente:
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {formatearFecha(fechaUltimoAccidente)}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Meta:
              </Typography>
              <Chip
                label="0 Accidentes"
                size="small"
                sx={{
                  backgroundColor: '#22c55e',
                  color: 'white',
                  fontWeight: 'bold'
                }}
              />
            </Box>
          </Box>

          {/* Botón de reiniciar (solo para admins) */}
          {puedeReiniciar && (
            <Box sx={{ mt: 2 }}>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={() => setOpenDialog(true)}
                fullWidth
                sx={{
                  borderColor: config.color,
                  color: config.color,
                  '&:hover': {
                    borderColor: config.color,
                    backgroundColor: `${config.color}10`
                  }
                }}
              >
                Reiniciar Contador
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Dialog de confirmación */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Reiniciar Contador de Días sin Accidentes</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Estás seguro de que deseas reiniciar el contador de días sin accidentes?
            Esta acción establecerá la fecha del último accidente como nula y el sistema
            calculará los días desde la fecha de creación de la sucursal.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} color="inherit">
            Cancelar
          </Button>
          <Button
            onClick={handleReiniciarContador}
            color="primary"
            variant="contained"
            disabled={loading}
          >
            {loading ? 'Reiniciando...' : 'Reiniciar'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default AccidentesGoalsCard;
