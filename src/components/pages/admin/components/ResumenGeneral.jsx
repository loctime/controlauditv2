// src/components/pages/admin/components/ResumenGeneral.jsx
import React from "react";
import { 
  Typography, 
  Box, 
  Paper, 
  Grid,
  Card,
  CardContent,
  useTheme,
  useMediaQuery,
  alpha,
  Chip
} from "@mui/material";
import { CheckCircle } from "@mui/icons-material";

const ResumenGeneral = ({ auditoriasPendientes, auditoriasCompletadas, auditorias, variant }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Variante inline: chips horizontales compactos
  if (variant === 'inline') {
    return (
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
        <Chip 
          label={`Programadas: ${auditoriasPendientes.length}`}
          sx={{ 
            bgcolor: theme.palette.mode === 'dark' ? alpha(theme.palette.warning.main, 0.2) : '#fff3e0',
            color: '#e65100',
            fontWeight: 600,
            border: `1px solid ${alpha(theme.palette.warning.main, 0.3)}`
          }}
        />
        <Chip 
          label={`Completadas: ${auditoriasCompletadas.length} / ${auditorias.length}`}
          sx={{ 
            bgcolor: theme.palette.mode === 'dark' ? alpha(theme.palette.success.main, 0.2) : '#e8f5e8',
            color: '#2e7d32',
            fontWeight: 600,
            border: `1px solid ${alpha(theme.palette.success.main, 0.3)}`
          }}
        />
      </Box>
    );
  }

  const auditoriasEsteMes = auditorias.filter(aud => {
    const fecha = new Date(aud.fecha);
    const ahora = new Date();
    return fecha.getMonth() === ahora.getMonth() && 
           fecha.getFullYear() === ahora.getFullYear();
  }).length;

  return (
    <Box sx={{
      p: isMobile ? 0.75 : 1,
      borderRadius: 2,
      backgroundColor: theme.palette.mode === 'dark' ? theme.palette.background.default : '#f5f5f5',
      mb: isMobile ? 2 : 3
    }}>
      <Grid container spacing={isMobile ? 0.5 : 1}>
        <Grid item xs={4}>
          <Box sx={{ 
            bgcolor: theme.palette.mode === 'dark' ? alpha(theme.palette.warning.main, 0.1) : '#fff3e0', 
            textAlign: 'center',
            p: isMobile ? 0.75 : 1,
            borderRadius: 2,
            border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
            minHeight: isMobile ? '80px' : '100px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}>
            <Typography 
              variant={isMobile ? "body2" : "h6"} 
              sx={{ 
                fontWeight: 600,
                fontSize: isMobile ? '0.875rem' : '1rem',
                mb: isMobile ? 0.5 : 1,
                color: '#e65100'
              }}
            >
              Pendientes
            </Typography>
            <Typography 
              variant={isMobile ? "h5" : "h4"}
              sx={{ 
                fontWeight: 700,
                fontSize: isMobile ? '1.5rem' : '2rem',
                color: 'text.primary'
              }}
            >
              {auditoriasPendientes.length}
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={4}>
          <Box sx={{ 
            bgcolor: theme.palette.mode === 'dark' ? alpha(theme.palette.success.main, 0.1) : '#e8f5e8', 
            textAlign: 'center',
            p: isMobile ? 1.5 : 2,
            borderRadius: 2,
            border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
            minHeight: isMobile ? '80px' : '100px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}>
            <Typography 
              variant={isMobile ? "body2" : "h6"} 
              color="success.main"
              sx={{ 
                fontWeight: 600,
                fontSize: isMobile ? '0.875rem' : '1rem',
                mb: isMobile ? 0.5 : 1
              }}
            >
              Completadas
            </Typography>
            <Typography 
              variant={isMobile ? "h5" : "h4"}
              sx={{ 
                fontWeight: 700,
                fontSize: isMobile ? '1.5rem' : '2rem',
                color: 'text.primary'
              }}
            >
              {auditoriasCompletadas.length}
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={4}>
          <Box sx={{ 
            bgcolor: theme.palette.mode === 'dark' ? alpha(theme.palette.info.main, 0.1) : '#e3f2fd', 
            textAlign: 'center',
            p: isMobile ? 1.5 : 2,
            borderRadius: 2,
            border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
            minHeight: isMobile ? '80px' : '100px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}>
            <Typography 
              variant={isMobile ? "body2" : "h6"} 
              sx={{ 
                fontWeight: 600,
                fontSize: isMobile ? '0.875rem' : '1rem',
                mb: isMobile ? 0.5 : 1,
                color: '#01579b'
              }}
            >
              Este Mes
            </Typography>
            <Typography 
              variant={isMobile ? "h5" : "h4"}
              sx={{ 
                fontWeight: 700,
                fontSize: isMobile ? '1.5rem' : '2rem',
                color: 'text.primary'
              }}
            >
              {auditoriasEsteMes}
            </Typography>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ResumenGeneral; 