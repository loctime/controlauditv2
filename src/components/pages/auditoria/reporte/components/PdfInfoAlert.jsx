import React from 'react';
import { Alert, Box, Typography, Chip } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

/**
 * Componente para mostrar información sobre el PDF guardado
 */
const PdfInfoAlert = ({ pdfUrl, fechaPdfGenerado, onDownload }) => {
  if (!pdfUrl) return null;

  const formatearFecha = (fecha) => {
    if (!fecha) return 'Fecha no disponible';
    try {
      return new Date(fecha).toLocaleString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Fecha no disponible';
    }
  };

  return (
    <Alert 
      severity="success" 
      icon={<CheckCircleIcon />}
      sx={{ 
        mb: 2,
        '& .MuiAlert-message': {
          width: '100%'
        }
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            📄 PDF disponible para descarga
          </Typography>
          {fechaPdfGenerado && (
            <Chip 
              label={`Generado: ${formatearFecha(fechaPdfGenerado)}`}
              size="small"
              variant="outlined"
              color="success"
            />
          )}
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="caption" color="text.secondary">
            {/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768
              ? 'El reporte se guardó localmente - descarga el archivo para verlo'
              : 'El reporte se guardó localmente en tu navegador'
            }
          </Typography>
        </Box>
      </Box>
    </Alert>
  );
};

export default PdfInfoAlert;
