import logger from '@/utils/logger';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  List as ListIcon
} from '@mui/icons-material';
import { DataGrid, GridToolbar, gridClasses } from '@mui/x-data-grid';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuth } from '@/components/context/AuthContext';
import { trainingPlanService } from '../../../../services/training';

const STATUS_CHIP = {
  active: { label: 'Activo', color: 'success' },
  draft: { label: 'Borrador', color: 'default' },
  closed: { label: 'Cerrado', color: 'info' }
};

function toDateValue(value) {
  if (!value) return null;
  if (value?.toDate) return value.toDate();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatUpdatedAt(value) {
  const date = toDateValue(value);
  if (!date) return '—';
  return format(date, "d MMM yyyy, HH:mm", { locale: es });
}

export default function AnnualPlansScreen() {
  const [searchParams] = useSearchParams();
  const filterTrainingTypeId = searchParams.get('trainingTypeId') || null;
  const { userProfile, userEmpresas = [], userSucursales = [] } = useAuth();
  const ownerId = userProfile?.ownerId;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [plans, setPlans] = useState([]);

  const [toolbarFilters, setToolbarFilters] = useState({
    companyId: '',
    branchId: '',
    status: ''
  });

  const load = useCallback(async () => {
    if (!ownerId) return;
    setLoading(true);
    setError('');
    try {
      const filters = {};
      if (toolbarFilters.companyId) filters.companyId = toolbarFilters.companyId;
      if (toolbarFilters.branchId) filters.branchId = toolbarFilters.branchId;
      if (toolbarFilters.status) filters.status = toolbarFilters.status;
      const data = await trainingPlanService.listPlans(ownerId, filters);
      setPlans(data);
    } catch (err) {
      logger.error('[AnnualPlansScreen] load error', err);
      setError('No se pudieron cargar los planes.');
    } finally {
      setLoading(false);
    }
  }, [ownerId, toolbarFilters.companyId, toolbarFilters.branchId, toolbarFilters.status]);

  useEffect(() => {
    load();
  }, [load]);

  const companyMap = useMemo(() => {
    const m = new Map();
    (userEmpresas || []).forEach((e) => m.set(e.id, e.nombre || e.name || 'Sin nombre'));
    return m;
  }, [userEmpresas]);

  const branchMap = useMemo(() => {
    const m = new Map();
    (userSucursales || []).forEach((s) => m.set(s.id, s.nombre || s.name || 'Sin nombre'));
    return m;
  }, [userSucursales]);

  const rows = useMemo(() => {
    let list = plans;
    if (filterTrainingTypeId) {
      // Si hay filtro por tipo desde URL, el backend no lo aplica; filtrado por tipo
      // requeriría items por plan. Mantenemos una sola llamada: mostramos todos los planes.
      // Opcional: no filtrar aquí para evitar N+1; el chip de filtro se puede mostrar igual.
      list = plans;
    }
    return list.map((plan) => ({
      id: plan.id,
      companyId: plan.companyId,
      branchId: plan.branchId,
      companyName: companyMap.get(plan.companyId) || plan.companyId || '—',
      branchName: branchMap.get(plan.branchId) || plan.branchId || '—',
      year: plan.year != null ? Number(plan.year) : null,
      status: plan.status || 'draft',
      itemsTotal: plan.itemsTotal != null ? Number(plan.itemsTotal) : 0,
      updatedAt: plan.updatedAt,
      plan
    }));
  }, [plans, companyMap, branchMap, filterTrainingTypeId]);

  const handleCreatePlan = () => {
    setCreatePlanOpen(true);
  };

  const handleViewPlan = (planId) => {
    setSelectedPlanId(planId);
    setViewDialogOpen(true);
  };

  const handleEditPlan = (planId) => {
    setSelectedPlanId(planId);
    setEditDialogOpen(true);
  };

  const handleOpenPlanItems = (planId) => {
    setSelectedPlanId(planId);
    setItemsDialogOpen(true);
  };

  const [createPlanOpen, setCreatePlanOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [itemsDialogOpen, setItemsDialogOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [planForm, setPlanForm] = useState({ companyId: '', branchId: '', notes: '' });

  const createPlan = async () => {
    if (!ownerId || !planForm.companyId || !planForm.branchId) {
      setError('Empresa y sucursal son obligatorias.');
      return;
    }
    setSaving(true);
    try {
      await trainingPlanService.createPlan(ownerId, {
        ...planForm,
        responsibleUserId: userProfile?.uid || '',
        status: 'draft'
      });
      setCreatePlanOpen(false);
      setPlanForm({ companyId: '', branchId: '', notes: '' });
      await load();
    } catch (err) {
      setError(err.message || 'No se pudo crear el plan.');
    } finally {
      setSaving(false);
    }
  };

  const columns = useMemo(
    () => [
      {
        field: 'companyName',
        headerName: 'Empresa',
        flex: 1,
        minWidth: 140,
        filterable: true,
        sortable: true
      },
      {
        field: 'branchName',
        headerName: 'Sucursal',
        flex: 1,
        minWidth: 140,
        filterable: true,
        sortable: true
      },
      {
        field: 'year',
        headerName: 'Año',
        type: 'number',
        width: 100,
        filterable: true,
        sortable: true,
        valueFormatter: (value) => (value != null ? value : '—')
      },
      {
        field: 'status',
        headerName: 'Estado',
        width: 120,
        filterable: true,
        sortable: true,
        renderCell: ({ value }) => {
          const config = STATUS_CHIP[value] || STATUS_CHIP.draft;
          return <Chip size="small" label={config.label} color={config.color} variant="outlined" />;
        }
      },
      {
        field: 'itemsTotal',
        headerName: 'Tipos de capacitación',
        type: 'number',
        width: 140,
        filterable: true,
        sortable: true,
        valueFormatter: (value) => (value != null ? value : 0)
      },
      {
        field: 'updatedAt',
        headerName: 'Última actualización',
        flex: 1,
        minWidth: 160,
        sortable: true,
        valueFormatter: ({ value }) => formatUpdatedAt(value)
      },
      {
        field: 'actions',
        headerName: 'Acciones',
        width: 160,
        sortable: false,
        filterable: false,
        disableColumnMenu: true,
        renderCell: ({ row }) => (
          <Stack direction="row" spacing={0.5}>
            <Tooltip title="Ver plan">
              <IconButton size="small" onClick={() => handleViewPlan(row.id)} aria-label="Ver plan">
                <ViewIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Editar plan">
              <IconButton size="small" onClick={() => handleEditPlan(row.id)} aria-label="Editar plan">
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Ítems del plan">
              <IconButton size="small" onClick={() => handleOpenPlanItems(row.id)} aria-label="Ítems del plan">
                <ListIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        )
      }
    ],
    [companyMap, branchMap]
  );

  if (!ownerId) {
    return <Alert severity="warning">No hay contexto de owner disponible para planes anuales.</Alert>;
  }

  const filterTypeName = null;

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 2 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2} sx={{ mb: 2 }}>
          <Stack direction="row" alignItems="center" gap={1}>
            <Typography variant="h6">Planes anuales</Typography>
            {filterTrainingTypeId && filterTypeName && (
              <Chip label={`Filtrado por: ${filterTypeName}`} size="small" color="primary" variant="outlined" />
            )}
          </Stack>
          <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap">
            <TextField
              select
              size="small"
              label="Empresa"
              sx={{ minWidth: 180 }}
              value={toolbarFilters.companyId}
              onChange={(e) => setToolbarFilters((f) => ({ ...f, companyId: e.target.value, branchId: '' }))}
            >
              <MenuItem value="">Todas</MenuItem>
              {userEmpresas.map((empresa) => (
                <MenuItem key={empresa.id} value={empresa.id}>
                  {empresa.nombre}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              size="small"
              label="Sucursal"
              sx={{ minWidth: 180 }}
              value={toolbarFilters.branchId}
              onChange={(e) => setToolbarFilters((f) => ({ ...f, branchId: e.target.value }))}
            >
              <MenuItem value="">Todas</MenuItem>
              {userSucursales
                .filter((s) => !toolbarFilters.companyId || s.empresaId === toolbarFilters.companyId)
                .map((sucursal) => (
                  <MenuItem key={sucursal.id} value={sucursal.id}>
                    {sucursal.nombre}
                  </MenuItem>
                ))}
            </TextField>
            <TextField
              select
              size="small"
              label="Estado"
              sx={{ minWidth: 120 }}
              value={toolbarFilters.status}
              onChange={(e) => setToolbarFilters((f) => ({ ...f, status: e.target.value }))}
            >
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="draft">Borrador</MenuItem>
              <MenuItem value="active">Activo</MenuItem>
              <MenuItem value="closed">Cerrado</MenuItem>
            </TextField>
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreatePlan}>
              Crear plan
            </Button>
          </Stack>
        </Stack>

        <Box sx={{ width: '100%', minHeight: 400 }}>
          <DataGrid
            rows={rows}
            columns={columns}
            loading={loading}
            pageSizeOptions={[10, 25, 50, 100]}
            initialState={{
              sorting: {
                sortModel: [
                  { field: 'year', sort: 'desc' },
                  { field: 'updatedAt', sort: 'desc' }
                ]
              },
              pagination: { paginationModel: { pageSize: 25 } }
            }}
            slots={{ toolbar: GridToolbar }}
            slotProps={{
              toolbar: {
                showQuickFilter: true,
                quickFilterProps: { debounceMs: 300 }
              }
            }}
            disableRowSelectionOnClick
            sx={{
              border: 'none',
              [`& .${gridClasses.cell}:focus, & .${gridClasses.cell}:focus-within`]: { outline: 'none' }
            }}
          />
        </Box>
      </Paper>

      {/* Modal Crear plan */}
      <Dialog open={createPlanOpen} onClose={() => !saving && setCreatePlanOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Crear plan</DialogTitle>
        <DialogContent>
          <Stack spacing={1.5} sx={{ pt: 1 }}>
            <TextField
              select
              fullWidth
              label="Empresa"
              value={planForm.companyId}
              onChange={(e) => setPlanForm({ ...planForm, companyId: e.target.value, branchId: '' })}
            >
              {userEmpresas.map((empresa) => (
                <MenuItem key={empresa.id} value={empresa.id}>
                  {empresa.nombre}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              fullWidth
              label="Sucursal"
              value={planForm.branchId}
              onChange={(e) => setPlanForm({ ...planForm, branchId: e.target.value })}
            >
              {userSucursales
                .filter((s) => !planForm.companyId || s.empresaId === planForm.companyId)
                .map((sucursal) => (
                  <MenuItem key={sucursal.id} value={sucursal.id}>
                    {sucursal.nombre}
                  </MenuItem>
                ))}
            </TextField>
            <TextField
              multiline
              rows={2}
              fullWidth
              label="Notas"
              value={planForm.notes}
              onChange={(e) => setPlanForm({ ...planForm, notes: e.target.value })}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => !saving && setCreatePlanOpen(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button variant="contained" onClick={createPlan} disabled={saving}>
            {saving ? 'Guardando...' : 'Crear plan'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Placeholder: diálogos Ver / Editar / Ítems — se pueden reemplazar por componentes reales */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Ver plan</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Plan ID: {selectedPlanId}. Implementar vista detalle con trainingPlanService.getPlanById.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Editar plan</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Plan ID: {selectedPlanId}. Implementar formulario de edición con trainingPlanService.updatePlan.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
      <Dialog open={itemsDialogOpen} onClose={() => setItemsDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Ítems del plan</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Plan ID: {selectedPlanId}. Implementar listado con trainingPlanService.listPlanItems(ownerId, filtro planId).
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setItemsDialogOpen(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
