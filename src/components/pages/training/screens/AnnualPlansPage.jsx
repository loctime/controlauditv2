import logger from '@/utils/logger';
import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import { Add as AddIcon, FilterList as FilterListIcon } from '@mui/icons-material';
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
  closed: { label: 'Cerrado', color: 'primary' },
  completed: { label: 'Completado', color: 'success' },
  cancelled: { label: 'Cancelado', color: 'error' }
};

const STATUS_FILTER_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'draft', label: 'Borrador' },
  { value: 'active', label: 'Activo' },
  { value: 'closed', label: 'Cerrado' },
  { value: 'completed', label: 'Completado' },
  { value: 'cancelled', label: 'Cancelado' }
];

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

function CustomToolbar({ onCreatePlan }) {
  return (
    <GridToolbarContainer sx={{ p: 1, gap: 1, flexWrap: 'wrap' }}>
      <Button startIcon={<AddIcon />} variant="contained" size="small" onClick={onCreatePlan}>
        Crear plan
      </Button>
      <Box sx={{ flexGrow: 1 }} />
      <GridToolbarColumnsButton />
      <GridToolbarFilterButton />
      <GridToolbarDensitySelector />
      <GridToolbarQuickFilter debounceMs={200} placeholder="Buscar en tabla…" />
    </GridToolbarContainer>
  );
}

export default function AnnualPlansPage({
  onCreatePlan,
  onViewPlan,
  onEditPlan,
  onOpenPlanItems,
  onRegisterRefresh,
  filterPropsFromParent = null
}) {
  const { userProfile, userEmpresas = [], userSucursales = [] } = useAuth();
  const ownerId = userProfile?.ownerId;

  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTermLocal, setSearchTermLocal] = useState('');
  const [filterCompanyLocal, setFilterCompanyLocal] = useState('');
  const [filterBranchLocal, setFilterBranchLocal] = useState('');
  const [filterYearLocal, setFilterYearLocal] = useState('');
  const [filterStatusLocal, setFilterStatusLocal] = useState('');

  const useParentFilters = !!filterPropsFromParent;
  const searchTerm = useParentFilters ? filterPropsFromParent.searchTerm : searchTermLocal;
  const filterCompany = useParentFilters ? filterPropsFromParent.filterCompany : filterCompanyLocal;
  const filterBranch = useParentFilters ? filterPropsFromParent.filterBranch : filterBranchLocal;
  const filterYear = useParentFilters ? filterPropsFromParent.filterYear : filterYearLocal;
  const filterStatus = useParentFilters ? filterPropsFromParent.filterStatus : filterStatusLocal;

  const companyMap = useMemo(() => Object.fromEntries((userEmpresas || []).map((e) => [e.id, e.nombre])), [userEmpresas]);
  const branchMap = useMemo(() => Object.fromEntries((userSucursales || []).map((s) => [s.id, s.nombre])), [userSucursales]);

  const availableYears = useMemo(() => {
    const years = new Set(plans.map((p) => p.year).filter((y) => y != null).map(Number));
    const currentYear = new Date().getFullYear();
    for (let y = currentYear + 2; y >= currentYear - 5; y--) years.add(y);
    return Array.from(years).sort((a, b) => b - a);
  }, [plans]);

  const branchesByCompany = useMemo(() => {
    if (!filterCompany) return userSucursales || [];
    return (userSucursales || []).filter((s) => s.empresaId === filterCompany);
  }, [userSucursales, filterCompany]);

  const hasActiveFilters = searchTerm || filterCompany || filterBranch || filterYear || filterStatus;

  const clearFilters = useCallback(() => {
    if (useParentFilters) return;
    setSearchTermLocal('');
    setFilterCompanyLocal('');
    setFilterBranchLocal('');
    setFilterYearLocal('');
    setFilterStatusLocal('');
  }, [useParentFilters]);

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
    if (filterYear) rows = rows.filter((r) => r.year === Number(filterYear));
    if (filterStatus) rows = rows.filter((r) => r.status === filterStatus);
    if (searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase();
      rows = rows.filter((r) => {
        const companyName = (companyMap[r.companyId] || '').toLowerCase();
        const branchName = (branchMap[r.branchId] || '').toLowerCase();
        const yearStr = String(r.year ?? '');
        return companyName.includes(term) || branchName.includes(term) || yearStr.includes(term);
      });
    }
    rows.sort((a, b) => {
      const yearA = a.year ?? 0;
      const yearB = b.year ?? 0;
      if (yearB !== yearA) return yearB - yearA;
      const tA = (a.updatedAt?.toDate?.() ?? a.updatedAt?.seconds ? new Date((a.updatedAt.seconds || 0) * 1000) : new Date(a.updatedAt || 0)).getTime();
      const tB = (b.updatedAt?.toDate?.() ?? b.updatedAt?.seconds ? new Date((b.updatedAt.seconds || 0) * 1000) : new Date(b.updatedAt || 0)).getTime();
      return tB - tA;
    });
    return rows;
  }, [plans, filterCompany, filterBranch, filterYear, filterStatus, searchTerm, companyMap, branchMap]);

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

      {!useParentFilters && (
        <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
          <Stack direction="row" spacing={2} flexWrap="wrap" alignItems="center">
            <TextField
              size="small"
              placeholder="Buscar…"
              value={searchTerm}
              onChange={(e) => setSearchTermLocal(e.target.value)}
              sx={{ minWidth: 200 }}
              inputProps={{ 'aria-label': 'Buscar por empresa, sucursal o año' }}
            />
            <TextField
              select
              size="small"
              label="Empresa"
              value={filterCompany}
              onChange={(e) => {
                setFilterCompanyLocal(e.target.value);
                setFilterBranchLocal('');
              }}
              sx={{ minWidth: 180 }}
            >
              <MenuItem value="">Todas</MenuItem>
              {(userEmpresas || []).map((c) => (
                <MenuItem key={c.id} value={c.id}>{c.nombre}</MenuItem>
              ))}
            </TextField>
            <TextField
              select
              size="small"
              label="Sucursal"
              value={filterBranch}
              onChange={(e) => setFilterBranchLocal(e.target.value)}
              sx={{ minWidth: 180 }}
            >
              <MenuItem value="">Todas</MenuItem>
              {branchesByCompany.map((b) => (
                <MenuItem key={b.id} value={b.id}>{b.nombre}</MenuItem>
              ))}
            </TextField>
            <TextField
              select
              size="small"
              label="Año"
              value={filterYear}
              onChange={(e) => setFilterYearLocal(e.target.value)}
              sx={{ minWidth: 100 }}
            >
              <MenuItem value="">Todos</MenuItem>
              {availableYears.map((y) => (
                <MenuItem key={y} value={String(y)}>{y}</MenuItem>
              ))}
            </TextField>
            <TextField
              select
              size="small"
              label="Estado"
              value={filterStatus}
              onChange={(e) => setFilterStatusLocal(e.target.value)}
              sx={{ minWidth: 140 }}
            >
              {STATUS_FILTER_OPTIONS.map((opt) => (
                <MenuItem key={opt.value || 'all'} value={opt.value}>{opt.label}</MenuItem>
              ))}
            </TextField>
            <Button
              variant="outlined"
              size="small"
              onClick={clearFilters}
              disabled={!hasActiveFilters}
              startIcon={<FilterListIcon />}
            >
              Limpiar filtros
            </Button>
          </Stack>
        </Paper>
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
            toolbar: () => <CustomToolbar onCreatePlan={() => onCreatePlan?.()} />,
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
