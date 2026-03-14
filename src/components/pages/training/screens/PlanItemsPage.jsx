import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  LinearProgress,
  Paper,
  Stack,
  Typography
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  School as SchoolIcon,
  CheckCircle as CheckCircleIcon,
  AccessTime as AccessTimeIcon,
  Percent as PercentIcon
} from '@mui/icons-material';
import { useAuth } from '@/components/context/AuthContext';
import { trainingPlanService, trainingCatalogService } from '../../../../services/training';
import TrainingPlanCalendar from '../components/TrainingPlanCalendar';
import TrainingPlanTimeline from '../components/TrainingPlanTimeline';

export default function PlanItemsPage() {
  const { planId } = useParams();
  const navigate = useNavigate();
  const { userProfile, userEmpresas = [], userSucursales = [] } = useAuth();
  const ownerId = userProfile?.ownerId;

  const [plan, setPlan] = useState(null);
  const [items, setItems] = useState([]);
  const [typeNameMap, setTypeNameMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!ownerId || !planId) return;
    setLoading(true);
    setError('');
    try {
      const [planData, list, catalog] = await Promise.all([
        trainingPlanService.getPlanById(ownerId, planId),
        trainingPlanService.listPlanItems(ownerId, { planId }),
        trainingCatalogService.listAll(ownerId)
      ]);
      setPlan(planData || null);
      setItems(Array.isArray(list) ? list : []);
      const map = Object.fromEntries((catalog || []).map((c) => [c.id, c.name || c.id]));
      setTypeNameMap(map);
    } catch (err) {
      setError(err?.message || 'No se pudieron cargar los ítems del plan.');
      setItems([]);
      setPlan(null);
    } finally {
      setLoading(false);
    }
  }, [ownerId, planId]);

  useEffect(() => {
    load();
  }, [load]);

  const kpis = useMemo(() => {
    const total = items.length;
    const completed = items.filter((i) => i.status === 'completed').length;
    const pending = items.filter((i) => i.status === 'planned').length;
    const compliance = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, pending, compliance };
  }, [items]);

  if (!ownerId) {
    return (
      <Alert severity="warning">No hay contexto de owner disponible.</Alert>
    );
  }

  if (!planId) {
    return (
      <Alert severity="error">Falta el identificador del plan en la URL.</Alert>
    );
  }

  const year = plan?.year != null ? plan.year : '—';
  const companyName = plan?.companyId
    ? (userEmpresas.find((e) => e.id === plan.companyId)?.nombre || plan.companyId)
    : '—';
  const branchName = plan?.branchId
    ? (userSucursales.find((s) => s.id === plan.branchId)?.nombre || plan.branchId)
    : '—';

  return (
    <Box>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/training')} sx={{ mb: 2 }}>
        Volver a capacitaciones
      </Button>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Typography color="text.secondary">Cargando…</Typography>
      ) : (
        <Grid container spacing={3}>
          {/* 1. HEADER */}
          <Grid item xs={12}>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="h4" fontWeight={700} sx={{ mb: 0.5 }}>
                PLAN ANUAL {year}
              </Typography>
              <Stack direction="row" spacing={2} flexWrap="wrap" sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  <strong>Empresa:</strong> {companyName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Sucursal:</strong> {branchName}
                </Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                Cumplimiento: {kpis.completed} de {kpis.total} capacitaciones
              </Typography>
              <LinearProgress
                variant="determinate"
                value={kpis.total > 0 ? (kpis.completed / kpis.total) * 100 : 0}
                sx={{ height: 8, borderRadius: 4 }}
                color="primary"
              />
              <Typography variant="body2" fontWeight={600} sx={{ mt: 0.5 }}>
                {kpis.compliance}%
              </Typography>
            </Paper>
          </Grid>

          {/* 2. KPI CARDS */}
          <Grid item xs={12} sm={6} md={3}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                  <SchoolIcon color="primary" sx={{ fontSize: 28 }} />
                  <Typography variant="overline" color="text.secondary">
                    Total capacitaciones
                  </Typography>
                </Stack>
                <Typography variant="h4" fontWeight={700}>
                  {kpis.total}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                  <CheckCircleIcon color="success" sx={{ fontSize: 28 }} />
                  <Typography variant="overline" color="text.secondary">
                    Completadas
                  </Typography>
                </Stack>
                <Typography variant="h4" fontWeight={700} color="success.main">
                  {kpis.completed}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                  <AccessTimeIcon color="action" sx={{ fontSize: 28 }} />
                  <Typography variant="overline" color="text.secondary">
                    Pendientes
                  </Typography>
                </Stack>
                <Typography variant="h4" fontWeight={700}>
                  {kpis.pending}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                  <PercentIcon color="primary" sx={{ fontSize: 28 }} />
                  <Typography variant="overline" color="text.secondary">
                    Cumplimiento
                  </Typography>
                </Stack>
                <Typography variant="h4" fontWeight={700}>
                  {kpis.compliance}%
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* 3. YEAR CALENDAR GRID */}
          <Grid item xs={12}>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
              Calendario anual
            </Typography>
            <TrainingPlanCalendar
              items={items}
              typeNameMap={typeNameMap}
              showStatusIcon
            />
          </Grid>

          {/* 4. TIMELINE */}
          <Grid item xs={12}>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
              Distribución en el año
            </Typography>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <TrainingPlanTimeline items={items} typeNameMap={typeNameMap} />
            </Paper>
          </Grid>

        </Grid>
      )}
    </Box>
  );
}
