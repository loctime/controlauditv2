import logger from '@/utils/logger';
import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CircularProgress,
  Grid,
  Paper,
  Stack,
  Typography
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import EventIcon from '@mui/icons-material/Event';
import { useAuth } from '@/components/context/AuthContext';
import { trainingCatalogService, trainingPlanService } from '../../../../../services/training';
import { getMonthName } from '../../utils/planItemsGroupByMonth';

const PLAN_STATUS_LABELS = {
  approved: 'Aprobado',
  in_progress: 'En progreso',
  draft: 'Borrador',
  closed: 'Cerrado'
};

function planStatusLabel(status) {
  return PLAN_STATUS_LABELS[status] || status || 'Sin dato';
}

/** Hora local en formato YYYY-MM-DDTHH:mm para input datetime-local (no UTC). */
function getLocalDateTime() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now - offset).toISOString().slice(0, 16);
}

/**
 * Obtiene los ítems de plan anual planificados para el mes actual.
 * Lista todos los planes (muchos no tienen campo year) y filtra por año en cliente si existe.
 * @param {string} ownerId
 * @param {number} year
 * @param {number} month (1-12)
 * @returns {Promise<Array<{ plan, item, trainingTypeName, companyName, branchName }>>}
 */
async function loadPlanItemsForCurrentMonth(ownerId, year, month) {
  const [allPlans, catalogList] = await Promise.all([
    trainingPlanService.listPlans(ownerId),
    trainingCatalogService.listActive(ownerId)
  ]);

  const catalogMap = Object.fromEntries(catalogList.map((c) => [c.id, c.name]));
  const result = [];

  const plans = allPlans.filter(
    (plan) => plan.year == null || plan.year === undefined || Number(plan.year) === year
  );

  for (const plan of plans) {
    const items = await trainingPlanService.listPlanItems(ownerId, { planId: plan.id });
    const forMonth = items.filter((item) => Number(item.plannedMonth) === month && item.status !== 'cancelled');

    for (const item of forMonth) {
      result.push({
        plan,
        item,
        trainingTypeName: catalogMap[item.trainingTypeId] || item.trainingTypeId || '—',
        companyName: null,
        branchName: null
      });
    }
  }

  return result;
}

export default function TrainingSessionEntry({
  ownerId,
  openQuickSessionKey = null,
  onOpenQuickSession,
  onCloseQuickSession
}) {
  const { userEmpresas = [], userSucursales = [] } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [planItems, setPlanItems] = useState([]);

  const companyById = Object.fromEntries((userEmpresas || []).map((c) => [c.id, c]));
  const branchById = Object.fromEntries((userSucursales || []).map((b) => [b.id, b]));

  useEffect(() => {
    let alive = true;

    const load = async () => {
      if (!ownerId) {
        setPlanItems([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      setError('');
      try {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;
        const raw = await loadPlanItemsForCurrentMonth(ownerId, year, month);
        if (!alive) return;
        setPlanItems(raw);
      } catch (err) {
        logger.error('[TrainingSessionEntry] load error', err);
        if (alive) setError(err.message || 'No se pudieron cargar las capacitaciones planificadas.');
      } finally {
        if (alive) setLoading(false);
      }
    };

    load();
    return () => { alive = false; };
  }, [ownerId]);

  const planItemsWithNames = planItems.map((row) => ({
    ...row,
    companyName: companyById[row.plan.companyId]?.nombre || row.plan.companyId || '—',
    branchName: branchById[row.plan.branchId]?.nombre || row.plan.branchId || '—'
  }));

  const handleCreateFromPlan = (row) => {
    const { plan, item } = row;
    const sessionKey = `${plan.id}-${item.id}`;

    // Si ya está abierto (sidebar visible para esta tarjeta), cerrar
    if (openQuickSessionKey === sessionKey) {
      if (onCloseQuickSession) onCloseQuickSession();
      return;
    }

    const scheduledDateIso = getLocalDateTime();
    if (onOpenQuickSession) {
      onOpenQuickSession({
        trainingTypeId: item.trainingTypeId,
        companyId: plan.companyId,
        branchId: plan.branchId,
        scheduledDate: scheduledDateIso,
        planId: plan.id,
        planItemId: item.id,
        planMode: 'plan'
      });
    }
  };

  if (!ownerId) return null;

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Capacitaciones planificadas este mes
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
          <CircularProgress size={32} />
        </Box>
      ) : (
        <>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            {planItemsWithNames.map((row) => (
              <Grid item xs={12} sm={6} md={4} key={`${row.plan.id}-${row.item.id}`}>
                <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Stack spacing={0.75}>
                      <Typography variant="subtitle1" fontWeight={600}>
                        {row.trainingTypeName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {row.companyName} / {row.branchName}
                      </Typography>
                      <Stack direction="row" alignItems="center" spacing={0.5}>
                        <EventIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          {getMonthName(row.item.plannedMonth)} · {planStatusLabel(row.plan.status)}
                        </Typography>
                      </Stack>
                    </Stack>
                  </CardContent>
                  <CardActions sx={{ pt: 0, px: 1.5, pb: 1.5 }}>
                    <Button
                      size="small"
                      variant="contained"
                      onClick={() => handleCreateFromPlan(row)}
                    >
                      {openQuickSessionKey === `${row.plan.id}-${row.item.id}` ? 'Cerrar' : 'Abrir'}
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>

          {planItemsWithNames.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              No hay capacitaciones planificadas para este mes en los planes anuales.
            </Typography>
          )}

        </>
      )}
    </Paper>
  );
}
