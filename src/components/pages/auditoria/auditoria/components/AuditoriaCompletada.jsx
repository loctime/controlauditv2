import React from "react";
import { 
  Paper, 
  Typography, 
  Box, 
  Button,
  Zoom,
  useTheme,
  alpha
} from "@mui/material";
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const AuditoriaCompletada = ({
  generarNuevaAuditoria,
  navigate,
  abrirImpresionNativa
}) => {
  const theme = useTheme();

  return (
    <Zoom in={true} timeout={800}>
      <Paper elevation={6} sx={{ 
        p: 6, 
        textAlign: "center", 
        borderRadius: 4,
        background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.1)}, ${alpha(theme.palette.success.main, 0.05)})`,
        border: `2px solid ${alpha(theme.palette.success.main, 0.2)}`
      }}>
        <CheckCircleIcon sx={{ fontSize: 80, color: 'success.main', mb: 3 }} />
        <Typography variant="h4" gutterBottom sx={{ mb: 3, color: 'success.main', fontWeight: 700 }}>
          ✅ Auditoría Completada
        </Typography>
        <Typography variant="h6" sx={{ mb: 4, color: 'text.secondary' }}>
          La auditoría ha sido guardada exitosamente en el sistema.
        </Typography>
        <Box display="flex" gap={2} justifyContent="center" flexWrap="wrap">
          {/* Botón para nueva auditoría */}
          <Button 
            variant="contained" 
            color="primary" 
            size="large"
            onClick={generarNuevaAuditoria}
          >
            Nueva Auditoría
          </Button>
          
       
          
          {/* Botón para ver reportes */}
          <Button 
            variant="outlined" 
            color="primary" 
            size="large"
            onClick={() => navigate('/reporte')}
          >
            Ver Reportes
          </Button>
          
          {/* Botón para volver al inicio */}
          <Button 
            variant="outlined" 
            color="secondary" 
            size="large"
            onClick={() => navigate('/')}
          >
            Volver al Inicio
          </Button>
        </Box>
      </Paper>
    </Zoom>
  );
};

export default AuditoriaCompletada; 