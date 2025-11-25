// src/components/pages/admin/components/TargetsSummary.jsx
import React, { useState, useEffect, useMemo } from "react";
import {
  Paper,
  Box,
  Typography,
  LinearProgress,
  Grid,
  Chip,
  Button
} from "@mui/material";
import { TrackChanges, TrendingUp, TrendingDown } from "@mui/icons-material";
import { targetsService } from "../../../../services/targetsService";
import { useAuth } from "../../../context/AuthContext";
import { useGlobalSelection } from "../../../../hooks/useGlobalSelection";

const TargetsSummary = ({ auditoriasCompletadas = [] }) => {
  const { userProfile } = useAuth();
  const { selectedEmpresa, selectedSucursal } = useGlobalSelection();
  const [targets, setTargets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarTargets();
  }, [userProfile, selectedEmpresa, selectedSucursal]);

  const cargarTargets = async () => {
    if (!userProfile) return;

    try {
      setLoading(true);
      const ahora = new Date();
      const añoActual = ahora.getFullYear();
      const mesActual = ahora.getMonth() + 1;

      const filters = {
        activo: true,
        año: añoActual
      };

      // Incluir targets mensuales del mes actual y targets anuales
      // No filtrar por mes para incluir todos los targets activos del año actual
      if (selectedEmpresa && selectedEmpresa !== 'todas') {
        filters.empresaId = selectedEmpresa;
      }
      if (selectedSucursal && selectedSucursal !== 'todas') {
        filters.sucursalId = selectedSucursal;
      }

      const targetsData = await targetsService.getTargets(
        userProfile.clienteAdminId || userProfile.uid,
        filters
      );
      setTargets(targetsData);
    } catch (error) {
      console.error('Error cargando targets:', error);
    } finally {
      setLoading(false);
    }
  };

  const resumen = useMemo(() => {
    if (!targets || targets.length === 0 || !auditoriasCompletadas) {
      return {
        targetTotal: 0,
        completadas: 0,
        faltantes: 0,
        porcentaje: 0,
        estado: 'sin_targets'
      };
    }

    let targetTotal = 0;
    let completadas = 0;

    const ahora = new Date();
    const añoActual = ahora.getFullYear();
    const mesActual = ahora.getMonth() + 1;

    targets.forEach(target => {
      // Solo contar targets del mes actual (mensuales) o anuales
      if (target.periodo === 'mensual' && target.mes === mesActual && target.año === añoActual) {
        const cumplimiento = targetsService.calcularCumplimiento(target, auditoriasCompletadas);
        targetTotal += cumplimiento.target;
        completadas += cumplimiento.completadas;
      } else if (target.periodo === 'anual' && target.año === añoActual) {
        // Para anuales, contar proporcionalmente (1/12 del target para el mes)
        const cumplimiento = targetsService.calcularCumplimiento(target, auditoriasCompletadas);
        targetTotal += Math.ceil(cumplimiento.target / 12);
        completadas += cumplimiento.completadas;
      }
    });

    const faltantes = Math.max(0, targetTotal - completadas);
    const porcentaje = targetTotal > 0 ? Math.round((completadas / targetTotal) * 100) : 0;
    const estado = porcentaje >= 100 ? 'cumplido' : porcentaje >= 80 ? 'en_proceso' : 'pendiente';

    return {
      targetTotal,
      completadas,
      faltantes,
      porcentaje,
      estado
    };
  }, [targets, auditoriasCompletadas]);

  const getColorEstado = () => {
    if (resumen.estado === 'cumplido' || resumen.porcentaje >= 100) return 'success';
    if (resumen.estado === 'en_proceso' || resumen.porcentaje >= 80) return 'warning';
    if (resumen.estado === 'sin_targets') return 'default';
    return 'error';
  };

  const getEstadoLabel = () => {
    if (resumen.estado === 'sin_targets') return 'Sin targets configurados';
    if (resumen.estado === 'cumplido' || resumen.porcentaje >= 100) return 'Cumplido';
    if (resumen.estado === 'en_proceso' || resumen.porcentaje >= 80) return 'En Proceso';
    return 'Pendiente';
  };

  if (loading) {
    return (
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography>Cargando resumen de targets...</Typography>
      </Paper>
    );
  }

  return (
    <Paper elevation={2} sx={{ p: 2, mb: 2, bgcolor: 'background.paper' }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Box display="flex" alignItems="center" gap={1}>
          <TrackChanges color="primary" />
          <Typography variant="h6">Resumen de Targets - Mes Actual</Typography>
        </Box>
        <Chip
          label={getEstadoLabel()}
          color={getColorEstado()}
          size="small"
          icon={resumen.porcentaje >= 100 ? <TrendingUp /> : resumen.porcentaje >= 80 ? <TrendingUp /> : <TrendingDown />}
        />
      </Box>

      {resumen.estado === 'sin_targets' ? (
        <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 2 }}>
          No hay targets configurados para el mes actual.
        </Typography>
      ) : (
        <>
          <Box mb={2}>
            <LinearProgress
              variant="determinate"
              value={Math.min(resumen.porcentaje, 100)}
              color={getColorEstado()}
              sx={{ height: 10, borderRadius: 5 }}
            />
            <Box display="flex" justifyContent="space-between" mt={1}>
              <Typography variant="caption" color="text.secondary">
                {resumen.completadas} / {resumen.targetTotal} auditorías
              </Typography>
              <Typography variant="caption" color="text.secondary" fontWeight="bold">
                {resumen.porcentaje}%
              </Typography>
            </Box>
          </Box>

          <Grid container spacing={2}>
            <Grid item xs={4}>
              <Box textAlign="center">
                <Typography variant="h5" color="primary" fontWeight="bold">
                  {resumen.completadas}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Completadas
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={4}>
              <Box textAlign="center">
                <Typography variant="h5" color="text.secondary" fontWeight="bold">
                  {resumen.targetTotal}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Target
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={4}>
              <Box textAlign="center">
                <Typography
                  variant="h5"
                  color={resumen.faltantes > 0 ? 'error' : 'success'}
                  fontWeight="bold"
                >
                  {resumen.faltantes}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Faltantes
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </>
      )}
    </Paper>
  );
};

export default TargetsSummary;
