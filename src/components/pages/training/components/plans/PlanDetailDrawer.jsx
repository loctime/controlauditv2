import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import DeleteIcon from '@mui/icons-material/Delete';
import { format, parseISO, isValid } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuth } from '@/components/context/AuthContext';
import { trainingPlanService, trainingCatalogService } from '../../../../../services/training';
import PlanItemsByMonthView from '../../utils/PlanItemsByMonthView';

const PLAN_STATUS_CONFIG = {
  active: { label: 'Activo', color: 'success' },
  draft: { label: 'Borrador', color: 'default' },
  closed: { label: 'Cerrado', color: 'primary' }
};

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Borrador' },
  { value: 'active', label: 'Activo' },
  { value: 'closed', label: 'Cerrado' }
];

const SIDEBAR_WIDTH = 420;
const NAVBAR_HEIGHT = 64;

function formatUpdatedAt(value) {
  if (!value) return '—';
  let date;
  if (value?.toDate && typeof value.toDate === 'function') {
    date = value.toDate();
  } else if (typeof value === 'object' && value?.seconds != null) {
    date = new Date(value.seconds * 1000);
  } else if (typeof value === 'string') {
    date = parseISO(value);
  } else {
    date = new Date(value);
  }
  return isValid(date) ? format(date, "d MMM yyyy, HH:mm", { locale: es }) : '—';
}

function TabDetalle({ plan, companies, branches }) {
  const companyMap = React.useMemo(
    () => Object.fromEntries((companies || []).map((c) => [c.id, c.nombre])),
    [companies]
  );
  const branchMap = React.useMemo(
    () => Object.fromEntries((branches || []).map((b) => [b.id, b.nombre])),
    [branches]
  );

  const companyName = companyMap[plan.companyId] || plan.companyId || '—';
  const branchName = branchMap[plan.branchId] || plan.branchId || '—';
  const statusConfig = PLAN_STATUS_CONFIG[plan.status] || { label: plan.status || '—', color: 'default' };
  const itemsTotal = plan.itemsTotal != null ? Number(plan.itemsTotal) : 0;

  return (
    <Stack spacing={2} sx={{ pt: 1 }}>
      <Box>
        <Typography variant="caption" color="text.secondary">Empresa</Typography>
        <Typography variant="body1">{companyName}</Typography>
      </Box>
      <Box>
        <Typography variant="caption" color="text.secondary">Sucursal</Typography>
        <Typography variant="body1">{branchName}</Typography>
      </Box>
      <Box>
        <Typography variant="caption" color="text.secondary">Año</Typography>
        <Typography variant="body1">{plan.year != null ? plan.year : '—'}</Typography>
      </Box>
      <Box>
        <Typography variant="caption" color="text.secondary">Estado</Typography>
        <Box sx={{ mt: 0.5 }}>
          <Chip label={statusConfig.label} color={statusConfig.color} size="small" />
        </Box>
      </Box>
      <Box>
        <Typography variant="caption" color="text.secondary">Tipos de capacitación</Typography>
        <Typography variant="body1">{itemsTotal}</Typography>
      </Box>
      <Box>
        <Typography variant="caption" color="text.secondary">Última actualización</Typography>
        <Typography variant="body1">{formatUpdatedAt(plan.updatedAt)}</Typography>
      </Box>
      <Box>
        <Typography variant="caption" color="text.secondary">Notas</Typography>
        <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
          {plan.notes || '—'}
        </Typography>
      </Box>
    </Stack>
  );
}

function TabEditar({ plan, onSaved, onClose, companies, branches }) {
  const { userProfile, userEmpresas = [], userSucursales = [] } = useAuth();
  const ownerId = userProfile?.ownerId;
  const empresas = companies?.length ? companies : userEmpresas;
  const sucursales = branches?.length ? branches : userSucursales;
  const companyName = empresas?.find((c) => c.id === plan?.companyId)?.nombre || plan?.companyId || '—';
  const branchName = sucursales?.find((s) => s.id === plan?.branchId)?.nombre || plan?.branchId || '—';
  const planYear = plan?.year ?? new Date().getFullYear();

  const [form, setForm] = useState({
    status: 'draft',
    notes: ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deletingPlan, setDeletingPlan] = useState(false);

  const [items, setItems] = useState([]);
  const [typeNameMap, setTypeNameMap] = useState({});
  const [itemsLoading, setItemsLoading] = useState(false);
  const [itemsError, setItemsError] = useState('');
  const [deletingItemId, setDeletingItemId] = useState(null);

  const loadItems = useCallback(async () => {
    if (!ownerId || !plan?.id) return;
    setItemsLoading(true);
    setItemsError('');
    try {
      const [list, catalog] = await Promise.all([
        trainingPlanService.listPlanItems(ownerId, { planId: plan.id }),
        trainingCatalogService.listAll(ownerId)
      ]);
      setItems(Array.isArray(list) ? list : []);
      const map = Object.fromEntries((catalog || []).map((c) => [c.id, c.name || c.id]));
      setTypeNameMap(map);
    } catch (err) {
      setItemsError(err?.message || 'No se pudieron cargar las capacitaciones del plan.');
      setItems([]);
    } finally {
      setItemsLoading(false);
    }
  }, [ownerId, plan?.id]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const handleDeleteTrainingType = async (trainingTypeId, groupItems) => {
    if (!ownerId || !trainingTypeId) return;
    const deletableItems = (groupItems || []).filter((i) => i?.id && i.status !== 'completed' && i.status !== 'cancelled');
    if (deletableItems.length === 0) return;

    const typeName = typeNameMap[trainingTypeId] || trainingTypeId || '—';
    const ok = window.confirm(`¿Eliminar "${typeName}" del plan anual?`);
    if (!ok) return;

    setDeletingItemId(trainingTypeId);
    setItemsError('');
    try {
      await Promise.all(
        deletableItems.map((it) => trainingPlanService.updatePlanItem(ownerId, it.id, { status: 'cancelled' }))
      );
      await loadItems();
      onSaved?.();
    } catch (err) {
      setItemsError(err?.message || 'No se pudo eliminar la capacitación del plan.');
    } finally {
      setDeletingItemId(null);
    }
  };

  useEffect(() => {
    if (!plan?.id) return;
    setForm({
      status: plan.status || 'draft',
      notes: plan.notes || ''
    });
    setError('');
  }, [plan?.id, plan?.companyId, plan?.branchId, plan?.year, plan?.status, plan?.notes]);

  const handleChange = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleDeletePlan = async () => {
    if (!ownerId || !plan?.id) return;
    const ok = window.confirm(`¿Eliminar el plan anual ${planYear} (${companyName} / ${branchName})?`);
    if (!ok) return;

    setDeletingPlan(true);
    setError('');
    try {
      await trainingPlanService.removePlan(ownerId, plan.id);
      onSaved?.();
      onClose?.();
    } catch (err) {
      setError(err?.message || 'No se pudo eliminar el plan anual.');
    } finally {
      setDeletingPlan(false);
    }
  };

  const handleSave = async () => {
    if (!ownerId || !plan?.id) return;
    setSaving(true);
    setError('');
    try {
      await trainingPlanService.updatePlan(ownerId, plan.id, {
        status: form.status,
        notes: (form.notes || '').trim()
      });
      onSaved?.();
    } catch (err) {
      setError(err?.message || 'No se pudo guardar.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Stack spacing={2} sx={{ pt: 1 }}>
      {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
          gap: 2
        }}
      >
        <Box>
          <Typography variant="caption" color="text.secondary">Empresa</Typography>
          <Typography variant="body1">{companyName}</Typography>
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary">Sucursal</Typography>
          <Typography variant="body1">{branchName}</Typography>
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary">Año</Typography>
          <Typography variant="body1">{planYear}</Typography>
        </Box>
      </Box>
      <TextField
        select
        label="Estado"
        value={form.status}
        onChange={handleChange('status')}
        fullWidth
        size="small"
      >
        {STATUS_OPTIONS.map((opt) => (
          <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
        ))}
      </TextField>
      <TextField
        label="Notas"
        value={form.notes}
        onChange={handleChange('notes')}
        fullWidth
        size="small"
        multiline
        rows={3}
      />

      <Box sx={{ pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
        <Typography variant="subtitle1" sx={{ mt: 1, mb: 1, fontWeight: 700 }}>
          Capacitaciones asignadas
        </Typography>

        {itemsError && (
          <Alert severity="error" onClose={() => setItemsError('')} sx={{ mb: 1 }}>
            {itemsError}
          </Alert>
        )}

        {itemsLoading ? (
          <Typography color="text.secondary">Cargando…</Typography>
        ) : (
          <>
            {items.filter((i) => i.status !== 'cancelled').length === 0 ? (
              <Typography color="text.secondary">No hay capacitaciones asignadas.</Typography>
            ) : (
              (() => {
                const groupedByType = items
                  .filter((i) => i.status !== 'cancelled')
                  .reduce((acc, it) => {
                    const key = it.trainingTypeId || '';
                    if (!acc[key]) acc[key] = [];
                    acc[key].push(it);
                    return acc;
                  }, {});

                const entries = Object.entries(groupedByType).filter(([k]) => k);
                if (entries.length === 0) {
                  return <Typography color="text.secondary">No hay capacitaciones asignadas.</Typography>;
                }

                return (
                  <List dense disablePadding>
                    {entries.map(([trainingTypeId, groupItems]) => {
                      const typeName = typeNameMap[trainingTypeId] || trainingTypeId || '—';
                      const nonCompletedCount = (groupItems || []).filter((i) => i.status !== 'completed' && i.status !== 'cancelled').length;
                      const deletingThis = deletingItemId === trainingTypeId;

                      return (
                        <ListItem
                          key={trainingTypeId}
                          disablePadding
                          sx={{ pl: 0 }}
                          secondaryAction={
                            <IconButton
                              edge="end"
                              aria-label="Eliminar"
                              onClick={() => handleDeleteTrainingType(trainingTypeId, groupItems)}
                              disabled={itemsLoading || deletingThis || nonCompletedCount === 0}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          }
                        >
                          <ListItemText
                            primary={typeName}
                            secondary={`Ítems: ${(groupItems || []).length}`}
                          />
                        </ListItem>
                      );
                    })}
                  </List>
                );
              })()
            )}
          </>
        )}
      </Box>

      <Button
        variant="outlined"
        color="error"
        onClick={handleDeletePlan}
        disabled={saving || deletingPlan || itemsLoading}
        fullWidth
      >
        {deletingPlan ? 'Eliminando...' : 'Eliminar plan anual'}
      </Button>

      <Button variant="contained" onClick={handleSave} disabled={saving} fullWidth>
        {saving ? 'Guardando…' : 'Guardar'}
      </Button>
    </Stack>
  );
}

function TabItems({ plan, onOpenFullPage }) {
  const { userProfile } = useAuth();
  const ownerId = userProfile?.ownerId;
  const [items, setItems] = useState([]);
  const [typeNameMap, setTypeNameMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!ownerId || !plan?.id) return;
    setLoading(true);
    setError('');
    try {
      const [list, catalog] = await Promise.all([
        trainingPlanService.listPlanItems(ownerId, { planId: plan.id }),
        trainingCatalogService.listAll(ownerId)
      ]);
      setItems(Array.isArray(list) ? list : []);
      const map = Object.fromEntries((catalog || []).map((c) => [c.id, c.name || c.id]));
      setTypeNameMap(map);
    } catch (err) {
      setError(err?.message || 'No se pudieron cargar los ítems.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [ownerId, plan?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const title = plan.year != null ? `PLAN ANUAL ${plan.year}` : null;

  return (
    <Stack spacing={2} sx={{ pt: 1 }}>
      {onOpenFullPage && (
        <Button variant="outlined" fullWidth onClick={() => onOpenFullPage(plan)}>
          Ver página completa de ítems
        </Button>
      )}
      {error && <Alert severity="error">{error}</Alert>}
      {loading ? (
        <Typography color="text.secondary">Cargando…</Typography>
      ) : (
        <PlanItemsByMonthView
          items={items}
          typeNameMap={typeNameMap}
          title={title}
          showStatusChip
        />
      )}
    </Stack>
  );
}

export default function PlanDetailDrawer({
  plan,
  open,
  onClose,
  onSaved,
  onOpenPlanItems,
  companies = [],
  branches = [],
  variant = 'drawer'
}) {
  const [tab, setTab] = useState(0);

  useEffect(() => {
    if (!plan) setTab(0);
  }, [plan]);

  if (!plan) return null;

  const sidebarHeight = `calc(100vh - ${NAVBAR_HEIGHT}px)`;

  const content = (
    <Box
      sx={{
        height: variant === 'inline' ? sidebarHeight : '100%',
        minHeight: variant === 'inline' ? sidebarHeight : 400,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 2, pt: 1, pb: 0 }}>
        <Typography variant="h6" noWrap sx={{ flex: 1, pr: 1 }}>
          Plan anual
        </Typography>
        <IconButton size="small" onClick={onClose} aria-label="Cerrar">
          <CloseIcon />
        </IconButton>
      </Stack>

      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        variant="fullWidth"
        sx={{ borderBottom: 1, borderColor: 'divider', px: 1 }}
      >
        <Tab label="Detalle" id="plan-tab-0" aria-controls="plan-panel-0" />
        <Tab label="Editar" id="plan-tab-1" aria-controls="plan-panel-1" />
        <Tab label="Ítems" id="plan-tab-2" aria-controls="plan-panel-2" />
      </Tabs>

      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        {tab === 0 && <TabDetalle plan={plan} companies={companies} branches={branches} />}
        {tab === 1 && (
          <TabEditar
            plan={plan}
            onSaved={onSaved}
            onClose={onClose}
            companies={companies}
            branches={branches}
          />
        )}
        {tab === 2 && (
          <TabItems
            plan={plan}
            onOpenFullPage={onOpenPlanItems}
          />
        )}
      </Box>
    </Box>
  );

  if (variant === 'inline') {
    return (
      <Box
        sx={{
          width: SIDEBAR_WIDTH,
          height: sidebarHeight,
          flexShrink: 0,
          borderLeft: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
          overflow: 'hidden'
        }}
      >
        {content}
      </Box>
    );
  }

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: SIDEBAR_WIDTH },
          height: sidebarHeight,
          mt: `${NAVBAR_HEIGHT}px`
        }
      }}
    >
      {content}
    </Drawer>
  );
}

export { SIDEBAR_WIDTH };
