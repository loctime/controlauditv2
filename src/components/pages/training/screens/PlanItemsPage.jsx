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
  DataGrid,
  GridToolbarContainer,
  GridToolbarColumnsButton,
  GridToolbarFilterButton,
  GridToolbarDensitySelector,
  GridToolbarQuickFilter
} from '@mui/x-data-grid';
import {
  ArrowBack as ArrowBackIcon,
  School as SchoolIcon,
  CheckCircle as CheckCircleIcon,
  AccessTime as AccessTimeIcon,
  Percent as PercentIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { useAuth } from '@/components/context/AuthContext';
import { trainingPlanService, trainingCatalogService } from '../../../../services/training';
import { getMonthName } from '../utils/planItemsGroupByMonth';
import TrainingPlanCalendar from '../components/TrainingPlanCalendar';

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

  const planYear = plan?.year ?? new Date().getFullYear();

  const tableRows = useMemo(() => {
    return items.map((item) => ({
      id: item.id,
      trainingName: typeNameMap[item.trainingTypeId] || item.trainingTypeId || '—',
      mes: getMonthName(item.plannedMonth),
      mesNum: Number(item.plannedMonth) || 0,
      status: item.status || 'planned',
      responsable: item.responsibleUserId || item.responsibleUserName || '—',
      fechaPlanificada: item.plannedMonth && planYear ? `${getMonthName(item.plannedMonth)} ${planYear}` : '—'
    }));
  }, [items, typeNameMap, planYear]);

  const statusConfig = {
    planned: { label: 'Planificado', Icon: AccessTimeIcon, color: 'text.secondary' },
    completed: { label: 'Completado', Icon: CheckCircleIcon, color: 'success.main' },
    cancelled: { label: 'Cancelado', Icon: CancelIcon, color: 'error.main' }
  };

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
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate({ pathname: '/training', search: '?tab=configuration&section=plans' })}
        sx={{ mb: 2 }}
      >
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
              <Stack direction="row" alignItems="center" spacing={2} flexWrap="wrap" sx={{ mb: 2 }}>
                <Typography variant="h4" fontWeight={700}>
                  PLAN ANUAL {year}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Empresa: {companyName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Sucursal: {branchName}
                </Typography>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={kpis.total > 0 ? (kpis.completed / kpis.total) * 100 : 0}
                sx={{ height: 8, borderRadius: 4 }}
                color="primary"
              />
              <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1} sx={{ mt: 0.5 }}>
                <Typography variant="body2" color="text.secondary">
                  Cumplimiento: {kpis.completed} de {kpis.total} capacitaciones
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {kpis.compliance}%
                </Typography>
              </Stack>
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

          {/* SECTION 1 — CALENDARIO ANUAL */}
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

          {/* SECTION 2 — LISTADO DEL PLAN */}
          <Grid item xs={12}>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
              Plan de capacitaciones
            </Typography>
            <Paper variant="outlined" sx={{ height: 400, width: '100%' }}>
              <DataGrid
                rows={tableRows}
                columns={[
                  {
                    field: 'trainingName',
                    headerName: 'Capacitación',
                    flex: 1,
                    minWidth: 180
                  },
                  {
                    field: 'mes',
                    headerName: 'Mes',
                    width: 120,
                    sortComparator: (v1, v2, row1, row2) =>
                      (row1.mesNum || 0) - (row2.mesNum || 0)
                  },
                  {
                    field: 'status',
                    headerName: 'Estado',
                    width: 140,
                    renderCell: ({ value }) => {
                      const config = statusConfig[value] || statusConfig.planned;
                      const Icon = config.Icon;
                      return (
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                          <Icon sx={{ fontSize: 18, color: config.color }} />
                          <span>{config.label}</span>
                        </Stack>
                      );
                    }
                  },
                  {
                    field: 'responsable',
                    headerName: 'Responsable',
                    width: 140
                  },
                  {
                    field: 'fechaPlanificada',
                    headerName: 'Fecha planificada',
                    width: 160
                  }
                ]}
                pageSizeOptions={[10, 25, 50]}
                initialState={{
                  pagination: { paginationModel: { pageSize: 10 } },
                  sorting: { sortModel: [{ field: 'mes', sort: 'asc' }] }
                }}
                disableRowSelectionOnClick
                slots={{
                  toolbar: () => (
                    <GridToolbarContainer sx={{ p: 1, gap: 1 }}>
                      <GridToolbarColumnsButton />
                      <GridToolbarFilterButton />
                      <GridToolbarDensitySelector />
                      <GridToolbarQuickFilter debounceMs={200} placeholder="Buscar…" />
                    </GridToolbarContainer>
                  )
                }}
              />
            </Paper>
          </Grid>

        </Grid>
      )}
    </Box>
  );
}
