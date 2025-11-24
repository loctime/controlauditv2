// src/components/pages/admin/components/TargetsManager/TargetsDashboard.jsx
import React, { useMemo } from "react";
import {
  Box,
  Grid,
  Paper,
  Typography,
  LinearProgress,
  Card,
  CardContent,
  Chip
} from "@mui/material";
import { CheckCircle, Schedule, Warning } from "@mui/icons-material";
import { targetsService } from "../../../../../services/targetsService";

const TargetsDashboard = ({ targets, auditoriasCompletadas = [] }) => {
  const targetsConCumplimiento = useMemo(() => {
    if (!targets || targets.length === 0) return [];

    return targets.map(target => {
      const cumplimiento = targetsService.calcularCumplimiento(target, auditoriasCompletadas);
      return {
        ...target,
        cumplimiento
      };
    });
  }, [targets, auditoriasCompletadas]);

  const getColorEstado = (porcentaje) => {
    if (porcentaje >= 100) return 'success';
    if (porcentaje >= 80) return 'warning';
    return 'error';
  };

  const getEstadoLabel = (estado, porcentaje) => {
    if (estado === 'cumplido' || porcentaje >= 100) return 'Cumplido';
    if (estado === 'en_proceso' || porcentaje >= 80) return 'En Proceso';
    return 'Pendiente';
  };

  const getPeriodoLabel = (periodo, mes) => {
    const meses = ['', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                   'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    
    if (periodo === 'semanal') return 'Semanal';
    if (periodo === 'mensual' && mes) return meses[mes];
    if (periodo === 'mensual') return 'Mensual';
    if (periodo === 'anual') return 'Anual';
    return periodo;
  };

  if (!targetsConCumplimiento || targetsConCumplimiento.length === 0) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          No hay targets configurados para mostrar el dashboard.
        </Typography>
      </Paper>
    );
  }

  return (
    <Grid container spacing={2}>
      {targetsConCumplimiento.map((target) => {
        const { cumplimiento } = target;
        const colorEstado = getColorEstado(cumplimiento.porcentaje);
        const estadoLabel = getEstadoLabel(cumplimiento.estado, cumplimiento.porcentaje);

        return (
          <Grid item xs={12} md={6} lg={4} key={target.id}>
            <Card elevation={2}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                  <Box>
                    <Typography variant="h6" component="div" gutterBottom>
                      {target.empresaNombre}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {target.sucursalNombre || 'Todas las sucursales'}
                    </Typography>
                  </Box>
                  <Chip
                    label={target.activo ? 'Activo' : 'Inactivo'}
                    color={target.activo ? 'success' : 'default'}
                    size="small"
                  />
                </Box>

                <Box mb={2}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Período: {getPeriodoLabel(target.periodo, target.mes)} {target.año}
                  </Typography>
                </Box>

                <Box mb={2}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="body2" fontWeight="bold">
                      Progreso
                    </Typography>
                    <Chip
                      label={estadoLabel}
                      color={colorEstado}
                      size="small"
                      icon={cumplimiento.porcentaje >= 100 ? <CheckCircle /> : <Schedule />}
                    />
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(cumplimiento.porcentaje, 100)}
                    color={colorEstado}
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>

                <Grid container spacing={1} mt={1}>
                  <Grid item xs={4}>
                    <Box textAlign="center">
                      <Typography variant="h6" color="primary">
                        {cumplimiento.completadas}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Completadas
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={4}>
                    <Box textAlign="center">
                      <Typography variant="h6" color="text.secondary">
                        {cumplimiento.target}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Target
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={4}>
                    <Box textAlign="center">
                      <Typography
                        variant="h6"
                        color={cumplimiento.faltantes > 0 ? 'error' : 'success'}
                      >
                        {cumplimiento.faltantes}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Faltantes
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>

                <Box mt={2} pt={2} borderTop="1px solid" borderColor="divider">
                  <Typography variant="caption" color="text.secondary">
                    {cumplimiento.porcentaje}% del objetivo cumplido
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        );
      })}
    </Grid>
  );
};

export default TargetsDashboard;
