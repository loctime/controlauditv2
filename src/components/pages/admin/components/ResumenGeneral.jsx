// src/components/pages/admin/components/ResumenGeneral.jsx
import React from "react";
import { 
  Typography, 
  Box, 
  Paper, 
  Grid,
  Card,
  CardContent
} from "@mui/material";
import { CheckCircle } from "@mui/icons-material";

const ResumenGeneral = ({ auditoriasPendientes, auditoriasCompletadas, auditorias }) => {
  const auditoriasEsteMes = auditorias.filter(aud => {
    const fecha = new Date(aud.fecha);
    const ahora = new Date();
    return fecha.getMonth() === ahora.getMonth() && 
           fecha.getFullYear() === ahora.getFullYear();
  }).length;

  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <CheckCircle color="primary" />
        Resumen General
      </Typography>
      <Grid container spacing={2} sx={{ mt: 1 }}>
        <Grid item xs={4}>
          <Card sx={{ bgcolor: '#fff3e0', textAlign: 'center' }}>
            <CardContent sx={{ py: 2 }}>
              <Typography variant="h6" color="warning.main">
                Pendientes
              </Typography>
              <Typography variant="h4">{auditoriasPendientes.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={4}>
          <Card sx={{ bgcolor: '#e8f5e8', textAlign: 'center' }}>
            <CardContent sx={{ py: 2 }}>
              <Typography variant="h6" color="success.main">
                Completadas
              </Typography>
              <Typography variant="h4">{auditoriasCompletadas.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={4}>
          <Card sx={{ bgcolor: '#e3f2fd', textAlign: 'center' }}>
            <CardContent sx={{ py: 2 }}>
              <Typography variant="h6" color="info.main">
                Este Mes
              </Typography>
              <Typography variant="h4">{auditoriasEsteMes}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default ResumenGeneral; 