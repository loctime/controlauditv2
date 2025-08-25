// src/components/pages/admin/components/ResumenTarjetas.jsx
import React from "react";
import { 
  Typography, 
  Box, 
  useTheme,
  alpha
} from "@mui/material";

const ResumenTarjetas = ({ auditoriasPendientes, auditoriasCompletadas, auditorias }) => {
  const theme = useTheme();

  const auditoriasEsteMes = auditorias.filter(aud => {
    const fecha = new Date(aud.fecha);
    const ahora = new Date();
    return fecha.getMonth() === ahora.getMonth() && 
           fecha.getFullYear() === ahora.getFullYear();
  }).length;

  return (
    <Box sx={{ 
      display: 'flex', 
      gap: 0.5,
      alignItems: 'center',
      flexWrap: 'nowrap',
      overflow: 'hidden'
    }}>
      {/* Tarjeta Pendientes */}
      <Box sx={{ 
        bgcolor: theme.palette.mode === 'dark' ? alpha(theme.palette.warning.main, 0.1) : '#fff3e0', 
        textAlign: 'center',
        p: 0.5,
        borderRadius: 1,
        border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
        minWidth: 40,
        maxWidth: 60,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        flexShrink: 0
      }}>
        <Typography 
          variant="body2" 
          color="warning.main"
          sx={{ 
            fontWeight: 600,
            fontSize: '0.6rem',
            mb: 0.25,
            lineHeight: 1
          }}
        >
          Pendientes
        </Typography>
        <Typography 
          variant="h6"
          sx={{ 
            fontWeight: 700,
            fontSize: '1rem',
            color: 'text.primary',
            lineHeight: 1
          }}
        >
          {auditoriasPendientes.length}
        </Typography>
      </Box>

      {/* Tarjeta Completadas */}
      <Box sx={{ 
        bgcolor: theme.palette.mode === 'dark' ? alpha(theme.palette.success.main, 0.1) : '#e8f5e8', 
        textAlign: 'center',
        p: 0.5,
        borderRadius: 1,
        border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
        minWidth: 40,
        maxWidth: 60,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        flexShrink: 0
      }}>
        <Typography 
          variant="body2" 
          color="success.main"
          sx={{ 
            fontWeight: 600,
            fontSize: '0.6rem',
            mb: 0.25,
            lineHeight: 1
          }}
        >
          Completadas
        </Typography>
        <Typography 
          variant="h6"
          sx={{ 
            fontWeight: 700,
            fontSize: '1rem',
            color: 'text.primary',
            lineHeight: 1
          }}
        >
          {auditoriasCompletadas.length}
        </Typography>
      </Box>

      {/* Tarjeta Este Mes */}
      <Box sx={{ 
        bgcolor: theme.palette.mode === 'dark' ? alpha(theme.palette.info.main, 0.1) : '#e3f2fd', 
        textAlign: 'center',
        p: 0.5,
        borderRadius: 1,
        border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
        minWidth: 40,
        maxWidth: 60,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        flexShrink: 0
      }}>
        <Typography 
          variant="body2" 
          color="info.main"
          sx={{ 
            fontWeight: 600,
            fontSize: '0.6rem',
            mb: 0.25,
            lineHeight: 1
          }}
        >
          Este Mes
        </Typography>
        <Typography 
          variant="h6"
          sx={{ 
            fontWeight: 700,
            fontSize: '1rem',
            color: 'text.primary',
            lineHeight: 1
          }}
        >
          {auditoriasEsteMes}
        </Typography>
      </Box>
    </Box>
  );
};

export default ResumenTarjetas;
