// src/components/pages/dashboard/components/AccionesRequeridasWidget.jsx
import React, { useState, useEffect } from 'react';
import {
  Paper,
  Box,
  Typography,
  Chip,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  useTheme,
  Alert
} from '@mui/material';
import {
  Assignment as AssignmentIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import AccionesRequeridasService from '../../../../services/accionesRequeridasService';
import { useAuth } from '@/components/context/AuthContext';
import { dbAudit } from '../../../../firebaseControlFile';
import { firestoreRoutesCore } from '../../../../core/firestore/firestoreRoutes.core';
import { doc, collection } from 'firebase/firestore';

export default function AccionesRequeridasWidget({ sucursales, selectedSucursal, estadisticas: estadisticasProp }) {
  const { userProfile } = useAuth();
  const theme = useTheme();
  const [estadisticas, setEstadisticas] = useState(estadisticasProp || {});
  const [loading, setLoading] = useState(!estadisticasProp);

  // Si se pasan estadísticas como prop, usarlas directamente
  useEffect(() => {
    if (estadisticasProp) {
      setEstadisticas(estadisticasProp);
      setLoading(false);
      return;
    }

    // Si no hay estadísticas como prop, cargarlas
    const cargarEstadisticas = async () => {
      if (!sucursales || sucursales.length === 0) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Filtrar sucursales según selección
        let sucursalesACalcular = sucursales;
        if (selectedSucursal && selectedSucursal !== 'todas') {
          sucursalesACalcular = sucursales.filter(s => s.id === selectedSucursal);
        }

        if (sucursalesACalcular.length === 0) {
          setEstadisticas({});
          setLoading(false);
          return;
        }

        // Calcular estadísticas para cada sucursal
        const estadisticasPorSucursal = {};
        let totalPendientes = 0;
        let totalVencidas = 0;
        let totalCompletadas = 0;
        let totalEnProceso = 0;
        let totalCanceladas = 0;

        for (const sucursal of sucursalesACalcular) {
          try {
            if (!userProfile?.ownerId) {
              throw new Error('ownerId no disponible');
            }
            const ownerId = userProfile.ownerId;
            const sucursalDocRef = doc(dbAudit, ...firestoreRoutesCore.sucursal(ownerId, sucursal.id));
            const accionesCollectionRef = collection(sucursalDocRef, 'acciones_requeridas');
            
            const stats = await AccionesRequeridasService.obtenerEstadisticas(accionesCollectionRef);
            estadisticasPorSucursal[sucursal.id] = stats;
            totalPendientes += stats.pendientes;
            totalVencidas += stats.vencidas;
            totalCompletadas += stats.completadas;
            totalEnProceso += stats.enProceso;
            totalCanceladas += stats.canceladas;
          } catch (error) {
            console.warn(`Error cargando estadísticas para sucursal ${sucursal.id}:`, error);
            estadisticasPorSucursal[sucursal.id] = {
              total: 0,
              pendientes: 0,
              enProceso: 0,
              completadas: 0,
              canceladas: 0,
              vencidas: 0
            };
          }
        }

        setEstadisticas({
          total: totalPendientes + totalEnProceso + totalCompletadas + totalCanceladas,
          pendientes: totalPendientes,
          enProceso: totalEnProceso,
          completadas: totalCompletadas,
          canceladas: totalCanceladas,
          vencidas: totalVencidas,
          porSucursal: estadisticasPorSucursal
        });
      } catch (error) {
        console.error('Error cargando estadísticas de acciones requeridas:', error);
      } finally {
        setLoading(false);
      }
    };

    cargarEstadisticas();
  }, [sucursales, selectedSucursal, estadisticasProp, userProfile?.uid]);

  if (loading) {
    return (
      <Paper sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 2 }}>
          <CircularProgress size={24} />
        </Box>
      </Paper>
    );
  }

  if (estadisticas.total === 0) {
    return (
      <Paper sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
          <AssignmentIcon color="primary" sx={{ fontSize: 20 }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', fontSize: '0.95rem' }}>
            Acciones Requeridas
          </Typography>
        </Box>
        <Alert severity="info" sx={{ py: 0.5, fontSize: '0.85rem' }}>
          No hay acciones requeridas registradas
        </Alert>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AssignmentIcon color="primary" sx={{ fontSize: 20 }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', fontSize: '0.95rem' }}>
            Acciones Requeridas
          </Typography>
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
          Total: {estadisticas.total || 0}
        </Typography>
      </Box>

      <Grid container spacing={1}>
        <Grid item xs={6} sm={3}>
          <Card variant="outlined" sx={{ bgcolor: theme.palette.warning.light + '15', height: '100%' }}>
            <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 }, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                <PendingIcon color="warning" sx={{ fontSize: 18 }} />
                <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: '1.25rem' }}>
                  {estadisticas.pendientes || 0}
                </Typography>
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                Pendientes
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={3}>
          <Card variant="outlined" sx={{ bgcolor: theme.palette.error.light + '15', height: '100%' }}>
            <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 }, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                <WarningIcon color="error" sx={{ fontSize: 18 }} />
                <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: '1.25rem' }}>
                  {estadisticas.vencidas || 0}
                </Typography>
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                Vencidas
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={3}>
          <Card variant="outlined" sx={{ bgcolor: theme.palette.info.light + '15', height: '100%' }}>
            <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 }, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                <TrendingUpIcon color="info" sx={{ fontSize: 18 }} />
                <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: '1.25rem' }}>
                  {estadisticas.enProceso || 0}
                </Typography>
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                En Proceso
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={3}>
          <Card variant="outlined" sx={{ bgcolor: theme.palette.success.light + '15', height: '100%' }}>
            <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 }, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                <CheckCircleIcon color="success" sx={{ fontSize: 18 }} />
                <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: '1.25rem' }}>
                  {estadisticas.completadas || 0}
                </Typography>
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                Completadas
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Paper>
  );
}

