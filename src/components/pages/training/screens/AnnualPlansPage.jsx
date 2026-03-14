import logger from '@/utils/logger';
import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  TextField,
  Typography
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import {
  DataGrid,
  GridToolbarContainer,
  GridToolbarColumnsButton,
  GridToolbarFilterButton,
  GridToolbarDensitySelector,
  GridToolbarQuickFilter,
} from '@mui/x-data-grid';
import { useAuth } from '@/components/context/AuthContext';
import { trainingPlanService } from '../../../../services/training';
import { format, parseISO, isValid } from 'date-fns';
import { es } from 'date-fns/locale';

const PLAN_STATUS_CONFIG = {
  active: { label: 'Activo', color: 'success' },
  draft: { label: 'Borrador', color: 'default' },
  closed: { label: 'Cerrado', color: 'primary' }
};

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

function CustomToolbar({ onCreatePlan, companies, branches, filterCompany, filterBranch, filterStatus, onFilterCompany, onFilterBranch, onFilterStatus }) {
  const statusOptions = useMemo(() => Object.entries(PLAN_STATUS_CONFIG).map(([value, { label }]) => ({ value, label })), []);

  return (
    <GridToolbarContainer sx={{ p: 1, gap: 1, flexWrap: 'wrap' }}>
      <Button startIcon={<AddIcon />} variant="contained" size="small" onClick={onCreatePlan}>
        Crear plan
      </Button>
      <TextField
        select
        size="small"
        label="Empresa"
        value={filterCompany}
        onChange={(e) => onFilterCompany(e.target.value)}
        sx={{ minWidth: 180 }}
      >
        <MenuItem value="">Todas</MenuItem>
        {(companies || []).map((c) => (
          <MenuItem key={c.id} value={c.id}>{c.nombre}</MenuItem>
        ))}
      </TextField>
      <TextField
        select
        size="small"
        label="Sucursal"
        value={filterBranch}
        onChange={(e) => onFilterBranch(e.target.value)}
        sx={{ minWidth: 180 }}
      >
        <MenuItem value="">Todas</MenuItem>
        {(branches || []).map((b) => (
          <MenuItem key={b.id} value={b.id}>{b.nombre}</MenuItem>
        ))}
      </TextField>
      <TextField
        select
        size="small"
        label="Estado"
        value={filterStatus}
        onChange={(e) => onFilterStatus(e.target.value)}
        sx={{ minWidth: 120 }}
      >
        <MenuItem value="">Todos</MenuItem>
        {statusOptions.map(({ value, label }) => (
          <MenuItem key={value} value={value}>{label}</MenuItem>
        ))}
      </TextField>
      <Box sx={{ flexGrow: 1 }} />
      <GridToolbarColumnsButton />
      <GridToolbarFilterButton />
      <GridToolbarDensitySelector />
      <GridToolbarQuickFilter debounceMs={200} placeholder="Buscar…" />
    </GridToolbarContainer>
  );
}

export default function AnnualPlansPage({
  onCreatePlan,
  onViewPlan,
  onEditPlan,
  onOpenPlanItems,
  onRegisterRefresh
}) {
  const { userProfile, userEmpresas = [], userSucursales = [] } = useAuth();
  const ownerId = userProfile?.ownerId;

  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterCompany, setFilterCompany] = useState('');
  const [filterBranch, setFilterBranch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const companyMap = useMemo(() => Object.fromEntries((userEmpresas || []).map((e) => [e.id, e.nombre])), [userEmpresas]);
  const branchMap = useMemo(() => Object.fromEntries((userSucursales || []).map((s) => [s.id, s.nombre])), [userSucursales]);

  const fetchPlans = useCallback(async () => {
    if (!ownerId) return;
    setLoading(true);
    setError('');
    try {
      const [plansData, planItemsData] = await Promise.all([
        trainingPlanService.listPlans(ownerId),
        trainingPlanService.listPlanItems(ownerId)
      ]);
      const countByPlanId = (planItemsData || []).reduce((acc, item) => {
        if (item.planId) acc[item.planId] = (acc[item.planId] || 0) + 1;
        return acc;
      }, {});
      const list = (plansData || []).map((p) => ({
        ...p,
        itemsTotal: p.itemsTotal ?? countByPlanId[p.id] ?? 0
      }));
      setPlans(list);
    } catch (err) {
      logger.error('[AnnualPlansPage] load plans error', err);
      setError(err?.message || 'No se pudieron cargar los planes.');
      setPlans([]);
    } finally {
      setLoading(false);
    }
  }, [ownerId]);

  React.useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  React.useEffect(() => {
    onRegisterRefresh?.(fetchPlans);
    return () => onRegisterRefresh?.(null);
  }, [fetchPlans, onRegisterRefresh]);

  const filteredRows = useMemo(() => {
    let rows = plans.map((p) => ({
      id: p.id,
      companyId: p.companyId,
      branchId: p.branchId,
      year: p.year != null ? Number(p.year) : null,
      status: p.status || 'draft',
      itemsTotal: p.itemsTotal != null ? Number(p.itemsTotal) : 0,
      updatedAt: p.updatedAt,
      _raw: p
    }));
    if (filterCompany) rows = rows.filter((r) => r.companyId === filterCompany);
    if (filterBranch) rows = rows.filter((r) => r.branchId === filterBranch);
    if (filterStatus) rows = rows.filter((r) => r.status === filterStatus);
    rows.sort((a, b) => {
      const yearA = a.year ?? 0;
      const yearB = b.year ?? 0;
      if (yearB !== yearA) return yearB - yearA;
      const tA = (a.updatedAt?.toDate?.() ?? a.updatedAt?.seconds ? new Date((a.updatedAt.seconds || 0) * 1000) : new Date(a.updatedAt || 0)).getTime();
      const tB = (b.updatedAt?.toDate?.() ?? b.updatedAt?.seconds ? new Date((b.updatedAt.seconds || 0) * 1000) : new Date(b.updatedAt || 0)).getTime();
      return tB - tA;
    });
    return rows;
  }, [plans, filterCompany, filterBranch, filterStatus]);

  const columns = useMemo(
    () => [
      {
        field: 'company',
        headerName: 'Empresa',
        flex: 1,
        minWidth: 160,
        valueGetter: (_, row) => companyMap[row?.companyId] || row?.companyId || '—'
      },
      {
        field: 'branch',
        headerName: 'Sucursal',
        flex: 1,
        minWidth: 160,
        valueGetter: (_, row) => branchMap[row?.branchId] || row?.branchId || '—'
      },
      {
        field: 'year',
        headerName: 'Año',
        type: 'number',
        width: 100,
        valueGetter: (value) => (value != null ? value : '—')
      },
      {
        field: 'status',
        headerName: 'Estado',
        width: 120,
        renderCell: ({ value }) => {
          const config = PLAN_STATUS_CONFIG[value] || { label: value || '—', color: 'default' };
          return <Chip label={config.label} color={config.color} size="small" />;
        }
      },
      {
        field: 'itemsTotal',
        headerName: 'Tipos de capacitación',
        type: 'number',
        width: 140,
        valueGetter: (value) => (value != null ? value : 0)
      },
      {
        field: 'updatedAt',
        headerName: 'Última actualización',
        width: 180,
        valueGetter: (_, row) => formatUpdatedAt(row?.updatedAt)
      },
      {
        field: 'actions',
        headerName: '',
        type: 'actions',
        width: 100,
        getActions: (params) => [
          <Button
            key="ver-mas"
            size="small"
            variant="outlined"
            onClick={() => onViewPlan?.(params.row._raw)}
          >
            Ver más
          </Button>
        ]
      }
    ],
    [companyMap, branchMap, onViewPlan]
  );

  if (!ownerId) {
    return (
      <Alert severity="warning">
        No hay contexto de owner disponible para planes anuales.
      </Alert>
    );
  }

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Paper sx={{ height: 560, width: '100%' }}>
        <DataGrid
          rows={filteredRows}
          columns={columns}
          loading={loading}
          pageSizeOptions={[10, 25, 50, 100]}
          initialState={{
            pagination: { paginationModel: { pageSize: 25 } },
            sorting: {
              sortModel: [{ field: 'year', sort: 'desc' }]
            }
          }}
          disableRowSelectionOnClick
          slots={{
            toolbar: () => (
              <CustomToolbar
                onCreatePlan={() => onCreatePlan?.()}
                companies={userEmpresas}
                branches={userSucursales}
                filterCompany={filterCompany}
                filterBranch={filterBranch}
                filterStatus={filterStatus}
                onFilterCompany={setFilterCompany}
                onFilterBranch={setFilterBranch}
                onFilterStatus={setFilterStatus}
              />
            ),
            noRowsOverlay: () => (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 1 }}>
                <Typography color="text.secondary">No hay planes anuales</Typography>
                {onCreatePlan && (
                  <Button startIcon={<AddIcon />} variant="outlined" onClick={() => onCreatePlan()}>
                    Crear plan
                  </Button>
                )}
              </Box>
            )
          }}
          slotProps={{
            loadingOverlay: {
              variant: 'circular-progress',
              label: 'Cargando planes…'
            }
          }}
        />
      </Paper>
    </Box>
  );
}
