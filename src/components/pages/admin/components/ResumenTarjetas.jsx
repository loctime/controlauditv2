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
      flexDirection: 'row',
      gap: 1,
      alignItems: 'center',
      justifyContent: 'center',
      flexWrap: 'nowrap'
    }}>
      {/* Tarjeta Pendientes */}
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2px 4px',
        borderRadius: '3px',
        width: '20px',
        height: '20px',
        bgcolor: '#fff3e0',
        border: '1px solid #ffb74d',
        boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
        flexShrink: 0
      }}>
        <Typography sx={{ 
          fontSize: '0.65rem',
          fontWeight: 700,
          lineHeight: 1,
          color: '#f57c00'
        }}>
          {auditoriasPendientes.length}
        </Typography>
      </Box>

      {/* Tarjeta Completadas */}
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2px 4px',
        borderRadius: '3px',
        width: '20px',
        height: '20px',
        bgcolor: '#e8f5e8',
        border: '1px solid #81c784',
        boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
        flexShrink: 0
      }}>
        <Typography sx={{ 
          fontSize: '0.65rem',
          fontWeight: 700,
          lineHeight: 1,
          color: '#388e3c'
        }}>
          {auditoriasCompletadas.length}
        </Typography>
      </Box>

      {/* Tarjeta Este Mes */}
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2px 4px',
        borderRadius: '3px',
        width: '20px',
        height: '20px',
        bgcolor: '#e3f2fd',
        border: '1px solid #64b5f6',
        boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
        flexShrink: 0
      }}>
        <Typography sx={{ 
          fontSize: '0.65rem',
          fontWeight: 700,
          lineHeight: 1,
          color: '#1976d2'
        }}>
          {auditoriasEsteMes}
        </Typography>
      </Box>
    </Box>
  );
};

export default ResumenTarjetas;
