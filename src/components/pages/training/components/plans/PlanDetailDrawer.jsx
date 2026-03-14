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

function TabEditar({ plan, onSaved, companies, branches }) {
  const { userProfile, userEmpresas = [], userSucursales = [] } = useAuth();
  const ownerId = userProfile?.ownerId;
  const empresas = companies?.length ? companies : userEmpresas;
  const sucursales = branches?.length ? branches : userSucursales;

  const [form, setForm] = useState({
    companyId: '',
    branchId: '',
    year: new Date().getFullYear(),
    status: 'draft',
    notes: ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!plan?.id) return;
    setForm({
      companyId: plan.companyId || '',
      branchId: plan.branchId || '',
      year: plan.year ?? new Date().getFullYear(),
      status: plan.status || 'draft',
      notes: plan.notes || ''
    });
    setError('');
  }, [plan?.id, plan?.companyId, plan?.branchId, plan?.year, plan?.status, plan?.notes]);

  const handleChange = (field) => (e) => {
    const value = field === 'year' ? parseInt(e.target.value, 10) || '' : e.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
    if (field === 'companyId') setForm((prev) => ({ ...prev, branchId: '' }));
  };

  const filteredBranches = sucursales.filter((s) => !form.companyId || s.empresaId === form.companyId);

  const handleSave = async () => {
    if (!ownerId || !plan?.id) return;
    if (!form.companyId || !form.branchId) {
      setError('Empresa y sucursal son obligatorias.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await trainingPlanService.updatePlan(ownerId, plan.id, {
        companyId: form.companyId,
        branchId: form.branchId,
        year: form.year ? Number(form.year) : undefined,
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
      <TextField
        select
        label="Empresa"
        value={form.companyId}
        onChange={handleChange('companyId')}
        fullWidth
        size="small"
        required
      >
        <MenuItem value="">Seleccionar</MenuItem>
        {(empresas || []).map((c) => (
          <MenuItem key={c.id} value={c.id}>{c.nombre}</MenuItem>
        ))}
      </TextField>
      <TextField
        select
        label="Sucursal"
        value={form.branchId}
        onChange={handleChange('branchId')}
        fullWidth
        size="small"
        required
      >
        <MenuItem value="">Seleccionar</MenuItem>
        {filteredBranches.map((b) => (
          <MenuItem key={b.id} value={b.id}>{b.nombre}</MenuItem>
        ))}
      </TextField>
      <TextField
        type="number"
        label="Año"
        value={form.year || ''}
        onChange={handleChange('year')}
        fullWidth
        size="small"
        inputProps={{ min: 2020, max: 2030 }}
      />
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
