import React from 'react';
import {
  Box,
  Button,
  Typography,
  Chip,
  LinearProgress,
  Alert,
  useTheme,
  useMediaQuery,
  alpha,
  Fade
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

/**
 * Componente del header de la auditoría con navegación y progreso
 * @param {Object} props - Propiedades del componente
 * @returns {JSX.Element} - Componente del header
 */
const AuditoriaHeader = ({
  // Navegación
  navigate,
  location,
  
  // Progreso
  calcularProgresoAuditoria,
  
  // Alertas
  mostrarAlertaReinicio,
  setMostrarAlertaReinicio,
  
  // Tema
  theme,
  isMobile
}) => {
  return (
    <Box sx={{ mb: isMobile ? 1 : 3 }}>
      {/* Header con navegación y progreso */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={isMobile ? 0.5 : 2}>
        <Box display="flex" alignItems="center" gap={isMobile ? 0.5 : 2}>
          <Button
            onClick={() => {
              // Navegar dinámicamente basado en el origen
              if (location.state?.from === 'perfil') {
                navigate('/perfil');
              } else {
                navigate('/cliente-dashboard');
              }
            }}
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            size="small"
            sx={{ 
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              px: isMobile ? 1 : 2,
              py: isMobile ? 0.5 : 1
            }}
          >
            Volver
          </Button>
          <Typography variant={isMobile ? "h6" : "h4"} sx={{ 
            fontWeight: 700,
            background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontSize: isMobile ? '1.1rem' : undefined
          }}>
            Nueva Auditoría
          </Typography>
        </Box>
        
        <Chip 
          label={`${calcularProgresoAuditoria()}%`}
          color="primary"
          variant="filled"
          size="small"
          sx={{ fontWeight: 600 }}
        />
      </Box>
      
      {/* Barra de progreso */}
      <LinearProgress 
        variant="determinate" 
        value={calcularProgresoAuditoria()} 
        aria-label={`Progreso de la auditoría: ${calcularProgresoAuditoria()}% completado`}
        sx={{ 
          height: isMobile ? 4 : 8, 
          borderRadius: 4,
          backgroundColor: alpha(theme.palette.primary.main, 0.1),
          '& .MuiLinearProgress-bar': {
            borderRadius: 4,
            background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`
          }
        }} 
      />

      {/* Alerta de reinicio de firmas */}
      {mostrarAlertaReinicio && (
        <Fade in={true} timeout={600}>
          <Alert 
            severity="warning" 
            sx={{ 
              mt: isMobile ? 0.5 : 2, 
              borderRadius: 2,
              '& .MuiAlert-message': {
                width: '100%'
              }
            }}
            onClose={() => setMostrarAlertaReinicio(false)}
          >
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              ⚠️ <strong>Firmas reiniciadas:</strong> Se detectaron cambios en las respuestas de la auditoría. 
              Las firmas han sido reiniciadas para mantener la integridad del documento.
            </Typography>
          </Alert>
        </Fade>
      )}
    </Box>
  );
};

export default AuditoriaHeader;
