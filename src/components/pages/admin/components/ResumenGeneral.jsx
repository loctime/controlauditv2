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
  alpha
} from "@mui/material";
import { CheckCircle } from "@mui/icons-material";

const ResumenGeneral = ({ auditoriasPendientes, auditoriasCompletadas, auditorias }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('xs'));

  const mobileBoxStyle = {
    mb: isMobile ? 1.5 : 3,
    p: isMobile ? 2 : 3,
    borderRadius: 2,
    bgcolor: 'background.paper',
    border: `1px solid ${theme.palette.divider}`,
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
    overflow: 'hidden',
    minHeight: isMobile ? '100px' : '120px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between'
  };

  const auditoriasEsteMes = auditorias.filter(aud => {
    const fecha = new Date(aud.fecha);
    const ahora = new Date();
    return fecha.getMonth() === ahora.getMonth() && 
           fecha.getFullYear() === ahora.getFullYear();
  }).length;

  return (
    <Box sx={{
      ...mobileBoxStyle,
      backgroundColor: theme.palette.mode === 'dark' ? theme.palette.background.default : '#f5f5f5',
      mb: isMobile ? 2 : 3
    }}>
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: isMobile ? 1 : 2,
        mb: isMobile ? 1.5 : 2
      }}>
        <Box sx={{ 
          p: isMobile ? 1 : 1.5, 
          borderRadius: '50%', 
          bgcolor: alpha(theme.palette.primary.main, 0.1),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <CheckCircle 
            color="primary" 
            sx={{ fontSize: isMobile ? 20 : 24 }} 
          />
        </Box>
        <Typography 
          variant={isMobile ? "body1" : "h6"} 
          sx={{ fontWeight: 600, color: 'text.primary' }}
        >
          Resumen General
        </Typography>
      </Box>
      
      <Grid container spacing={isMobile ? 1 : 2} sx={{ mt: isMobile ? 1 : 2 }}>
        <Grid item xs={4}>
          <Box sx={{ 
            bgcolor: theme.palette.mode === 'dark' ? alpha(theme.palette.warning.main, 0.1) : '#fff3e0', 
            textAlign: 'center',
            p: isMobile ? 1.5 : 2,
            borderRadius: 2,
            border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
            minHeight: isMobile ? '80px' : '100px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}>
            <Typography 
              variant={isMobile ? "body2" : "h6"} 
              color="warning.main"
              sx={{ 
                fontWeight: 600,
                fontSize: isMobile ? '0.875rem' : '1rem',
                mb: isMobile ? 0.5 : 1
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
              color="info.main"
              sx={{ 
                fontWeight: 600,
                fontSize: isMobile ? '0.875rem' : '1rem',
                mb: isMobile ? 0.5 : 1
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