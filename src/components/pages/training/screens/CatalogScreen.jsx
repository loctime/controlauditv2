import logger from '@/utils/logger';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import BarChartIcon from '@mui/icons-material/BarChart';
import FilterListIcon from '@mui/icons-material/FilterList';
import { useAuth } from '@/components/context/AuthContext';
import {
  trainingCatalogService,
  trainingCategoryService,
  trainingPlanService,
  generatePlannedMonths,
  trainingSessionService,
  trainingAttendanceService,
} from '../../../../services/training';
import { formatDateAR } from '@/utils/dateUtils';
import { empleadoService } from '../../../../services/empleadoService';

const EXPIRING_THRESHOLD_DAYS = 5;

function complianceLabelFromValidUntil(validUntil) {
  if (validUntil == null) return { label: 'Sin vigencia', status: 'missing' };
  const toDate = typeof validUntil.toDate === 'function' ? validUntil.toDate() : new Date(validUntil);
  if (Number.isNaN(toDate.getTime())) return { label: 'Sin vigencia', status: 'missing' };
  const days = Math.ceil((toDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (days < 0) return { label: 'Vencida', status: 'expired' };
  if (days <= EXPIRING_THRESHOLD_DAYS) return { label: 'Por vencer', status: 'expiring_soon' };
  return { label: 'Vigente', status: 'compliant' };
}

export default function CatalogScreen({ onNavigateToPlans }) {
  const { userProfile, userEmpresas = [], userSucursales = [] } = useAuth();
  const ownerId = userProfile?.ownerId;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [addingCategory, setAddingCategory] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', categoryIds: [], modality: 'in_person', recommendedDurationMinutes: 60, validityMonths: 12, description: '', status: 'active' });
  const [editSelectedCategories, setEditSelectedCategories] = useState([]);
  const [savingEdit, setSavingEdit] = useState(false);
  const [deleteConfirmItem, setDeleteConfirmItem] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [recordsDialogItem, setRecordsDialogItem] = useState(null);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [recordsList, setRecordsList] = useState([]);
  const [employeesMap, setEmployeesMap] = useState({});
  const [addToPlanItem, setAddToPlanItem] = useState(null);
  const [addToPlanForm, setAddToPlanForm] = useState({
    companyId: '',
    branchId: '',
    startMonth: 1,
    notes: ''
  });
  const [addToPlanSaving, setAddToPlanSaving] = useState(false);
  const [addToPlanError, setAddToPlanError] = useState('');
  const [addToPlanSuccess, setAddToPlanSuccess] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    modality: 'in_person',
    recommendedDurationMinutes: 60,
    validityMonths: 12,
    requiresEvaluation: false,
    requiresScore: false,
    status: 'active'
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterModality, setFilterModality] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const filteredItems = useMemo(() => {
    let list = items;
    const term = (searchTerm || '').trim().toLowerCase();
    if (term) {
      list = list.filter(
        (item) =>
          (item.name || '').toLowerCase().includes(term) ||
          (item.description || '').toLowerCase().includes(term)
      );
    }
    if (filterCategory) {
      list = list.filter(
        (item) => (item.categoryIds || []).some((id) => id === filterCategory)
      );
    }
    if (filterModality) {
      list = list.filter((item) => (item.modality || '') === filterModality);
    }
    if (filterStatus) {
      list = list.filter((item) => (item.status || '') === filterStatus);
    }
    return list;
  }, [items, searchTerm, filterCategory, filterModality, filterStatus]);

  const hasActiveFilters = !!(searchTerm || filterCategory || filterModality || filterStatus);
  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setFilterCategory('');
    setFilterModality('');
    setFilterStatus('');
  }, []);

  const loadCategories = useCallback(async () => {
    if (!ownerId) return;
    try {
      const list = await trainingCategoryService.getCategories(ownerId);
      setCategories(list);
    } catch (err) {
      logger.error('[CatalogScreen] loadCategories error', err);
    }
  }, [ownerId]);

  const load = useCallback(async () => {
    if (!ownerId) return;
    setLoading(true);
    setError('');
    try {
      const catalog = await trainingCatalogService.listAll(ownerId);
      setItems(catalog);
    } catch (err) {
      logger.error('[CatalogScreen] load error', err);
      setError('No se pudo cargar el catálogo de capacitaciones.');
    } finally {
      setLoading(false);
    }
  }, [ownerId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const addNewCategory = async () => {
    const name = (newCategoryName || '').trim();
    if (!name || !ownerId) return;
    setAddingCategory(true);
    setError('');
    try {
      const created = await trainingCategoryService.createCategory(ownerId, name);
      await loadCategories();
      setSelectedCategories((prev) =>
        prev.some((c) => c.id === created.id) ? prev : [...prev, created]
      );
      setNewCategoryName('');
    } catch (err) {
      setError(err.message || 'No se pudo crear la categoría.');
    } finally {
      setAddingCategory(false);
    }
  };

  const create = async () => {
    if (!ownerId) return;
    if (!form.name.trim()) {
      setError('El nombre es obligatorio.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const categoryIds = selectedCategories.map((c) => c.id);
      await trainingCatalogService.create(ownerId, {
        ...form,
        categoryIds,
        recommendedDurationMinutes: Number(form.recommendedDurationMinutes || 0),
        validityMonths: Number(form.validityMonths || 0),
      });
      setForm((prev) => ({ ...prev, name: '', description: '' }));
      setSelectedCategories([]);
      await load();
    } catch (err) {
      setError(err.message || 'No se pudo crear el tipo de capacitación.');
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (item) => {
    const cats = (item.categoryIds || []).map((id) => categories.find((c) => c.id === id)).filter(Boolean);
    setEditItem(item);
    setEditForm({
      name: item.name || '',
      modality: item.modality || 'in_person',
      recommendedDurationMinutes: item.recommendedDurationMinutes ?? 60,
      validityMonths: item.validityMonths ?? 12,
      description: item.description || '',
      status: item.status || 'active',
      requiresEvaluation: item.requiresEvaluation === true,
      requiresScore: item.requiresScore === true,
    });
    setEditSelectedCategories(cats);
  };

  const saveEdit = async () => {
    if (!ownerId || !editItem?.id) return;
    if (!editForm.name?.trim()) {
      setError('El nombre es obligatorio.');
      return;
    }
    setSavingEdit(true);
    setError('');
    try {
      const categoryIds = editSelectedCategories.map((c) => c.id);
      await trainingCatalogService.update(ownerId, editItem.id, {
        name: editForm.name.trim(),
        categoryIds,
        modality: editForm.modality,
        recommendedDurationMinutes: Number(editForm.recommendedDurationMinutes || 0),
        validityMonths: Number(editForm.validityMonths || 0),
        description: (editForm.description || '').trim() || undefined,
        status: editForm.status,
        requiresEvaluation: editForm.requiresEvaluation === true,
        requiresScore: editForm.requiresScore === true,
      });
      setEditItem(null);
      await load();
    } catch (err) {
      setError(err.message || 'No se pudo actualizar el tipo de capacitación.');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!ownerId || !deleteConfirmItem?.id) return;
    setDeleting(true);
    setError('');
    try {
      const sessions = await trainingSessionService.listSessions(ownerId, { trainingTypeId: deleteConfirmItem.id });
      if (sessions?.length > 0) {
        await trainingCatalogService.update(ownerId, deleteConfirmItem.id, { status: 'inactive' });
      } else {
        await trainingCatalogService.remove(ownerId, deleteConfirmItem.id);
      }
      setDeleteConfirmItem(null);
      await load();
    } catch (err) {
      setError(err.message || 'No se pudo eliminar o desactivar.');
    } finally {
      setDeleting(false);
    }
  };

  const openAddToPlanModal = (item) => {
    setAddToPlanItem(item);
    setAddToPlanError('');
    setAddToPlanSuccess(false);
    setAddToPlanForm({
      companyId: '',
      branchId: '',
      startMonth: 1,
      notes: ''
    });
  };

  const addTrainingTypeToPlan = async () => {
    if (!ownerId || !addToPlanItem?.id || !addToPlanForm.companyId || !addToPlanForm.branchId) {
      setAddToPlanError('Selecciona empresa y sucursal.');
      return;
    }
    setAddToPlanSaving(true);
    setAddToPlanError('');
    try {
      await trainingPlanService.assignTrainingTypeToPlan(ownerId, {
        companyId: addToPlanForm.companyId,
        branchId: addToPlanForm.branchId,
        year: new Date().getFullYear(),
        trainingTypeId: addToPlanItem.id,
        validityMonths: Number(addToPlanItem.validityMonths) || 12,
        startMonth: Number(addToPlanForm.startMonth) || 1,
        notes: (addToPlanForm.notes || '').trim() || '',
        responsibleUserId: userProfile?.uid || ''
      });
      setAddToPlanSuccess(true);
    } catch (err) {
      logger.error('[CatalogScreen] assignTrainingTypeToPlan error', err);
      setAddToPlanError(err.message || 'No se pudo agregar al plan.');
    } finally {
      setAddToPlanSaving(false);
    }
  };

  const closeAddToPlanModal = () => {
    setAddToPlanItem(null);
    setAddToPlanForm({ companyId: '', branchId: '', startMonth: 1, notes: '' });
    setAddToPlanError('');
    setAddToPlanSuccess(false);
  };

  const openRecordsDialog = async (item) => {
    setRecordsDialogItem(item);
    setRecordsList([]);
    setRecordsLoading(true);
    try {
      const [attendances, employees] = await Promise.all([
        trainingAttendanceService.listByTrainingTypeId(ownerId, item.id),
        userSucursales?.length
          ? empleadoService.getEmpleadosBySucursales(ownerId, userSucursales.map((s) => s.id))
          : Promise.resolve([]),
      ]);
      setRecordsList(attendances || []);
      setEmployeesMap(Object.fromEntries((employees || []).map((e) => [e.id, e])));
    } catch (err) {
      logger.error('[CatalogScreen] load records error', err);
      setRecordsList([]);
    } finally {
      setRecordsLoading(false);
    }
  };

  if (!ownerId) {
    return <Alert severity="warning">No hay contexto de owner disponible para catálogo.</Alert>;
  }

  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={2}>
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Crear tipo de capacitación</Typography>
            <Stack spacing={1.5}>
              <TextField label="Nombre" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <Autocomplete
                multiple
                freeSolo={false}
                options={categories}
                value={selectedCategories}
                getOptionLabel={(opt) => (opt?.name ?? '')}
                isOptionEqualToValue={(opt, val) => opt?.id === val?.id}
                onChange={(_, newValue) => setSelectedCategories(newValue || [])}
                renderInput={(params) => (
                  <TextField {...params} label="Categoría" placeholder="Seleccionar categorías" />
                )}
              />
              <Stack direction="row" spacing={1} alignItems="center">
                <TextField
                  size="small"
                  placeholder="Nueva categoría"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addNewCategory())}
                />
                <Button variant="outlined" size="small" onClick={addNewCategory} disabled={addingCategory || !newCategoryName.trim()}>
                  {addingCategory ? '...' : '+ Crear nueva categoría'}
                </Button>
              </Stack>
              <TextField multiline rows={2} label="Descripción" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              <TextField select label="Modalidad" value={form.modality} onChange={(e) => setForm({ ...form, modality: e.target.value })}>
                <MenuItem value="in_person">Presencial</MenuItem>
                <MenuItem value="virtual">Virtual</MenuItem>
                <MenuItem value="hybrid">Híbrida</MenuItem>
              </TextField>
              <TextField type="number" label="Duración recomendada (minutos)" value={form.recommendedDurationMinutes} onChange={(e) => setForm({ ...form, recommendedDurationMinutes: e.target.value })} />
              <TextField type="number" label="Vigencia (meses)" value={form.validityMonths} onChange={(e) => setForm({ ...form, validityMonths: e.target.value })} />
              <Stack direction="row" flexWrap="wrap" spacing={2}>
                <FormControlLabel
                  control={<Checkbox checked={form.requiresEvaluation === true} onChange={(e) => setForm({ ...form, requiresEvaluation: e.target.checked })} />}
                  label="Requiere evaluación (solo genera vigencia si aprueba)"
                />
                <FormControlLabel
                  control={<Checkbox checked={form.requiresScore === true} onChange={(e) => setForm({ ...form, requiresScore: e.target.checked })} disabled={!form.requiresEvaluation} />}
                  label="Requiere calificación (puntaje)"
                />
              </Stack>
              <TextField select label="Estado" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <MenuItem value="active">Activo</MenuItem>
                <MenuItem value="inactive">Inactivo</MenuItem>
              </TextField>
              <Button variant="contained" onClick={create} disabled={saving}>{saving ? 'Guardando...' : 'Crear tipo de capacitación'}</Button>
            </Stack>
          </Paper>
        </Grid>

        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 2 }}>
            <Stack direction="row" alignItems="center" flexWrap="wrap" spacing={2} sx={{ mb: 2, gap: 1 }}>
              <Typography variant="h6" sx={{ flexShrink: 0 }}>Catálogo</Typography>
              <Stack direction="row" spacing={1.5} flexWrap="wrap" alignItems="center" sx={{ flex: 1, minWidth: 0 }}>
                <TextField
                  size="small"
                  placeholder="Buscar…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  sx={{ minWidth: 160 }}
                  inputProps={{ 'aria-label': 'Buscar por nombre o descripción' }}
                />
                <TextField
                  select
                  size="small"
                  label="Categoría"
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  sx={{ minWidth: 160 }}
                >
                  <MenuItem value="">Todas</MenuItem>
                  {(categories || []).map((c) => (
                    <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                  ))}
                </TextField>
                <TextField
                  select
                  size="small"
                  label="Modalidad"
                  value={filterModality}
                  onChange={(e) => setFilterModality(e.target.value)}
                  sx={{ minWidth: 120 }}
                >
                  <MenuItem value="">Todas</MenuItem>
                  <MenuItem value="in_person">Presencial</MenuItem>
                  <MenuItem value="virtual">Virtual</MenuItem>
                  <MenuItem value="hybrid">Híbrida</MenuItem>
                </TextField>
                <TextField
                  select
                  size="small"
                  label="Estado"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  sx={{ minWidth: 110 }}
                >
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value="active">Activo</MenuItem>
                  <MenuItem value="inactive">Inactivo</MenuItem>
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
            </Stack>
            {loading ? <CircularProgress /> : (
              <Stack spacing={1}>
                {filteredItems.map((item) => (
                  <Paper key={item.id} variant="outlined" sx={{ p: 1.5 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                      <Box sx={{ flex: 1 }}>
                        <Typography sx={{ fontWeight: 700 }}>{item.name} ({item.status})</Typography>
                        <Typography variant="body2" color="text.secondary">{(item.categoryIds?.length ? item.categoryIds.map((id) => categories.find((c) => c.id === id)?.name || id).join(', ') : item.category || '—')} | {item.modality} | {item.validityMonths} meses</Typography>
                        <Typography variant="body2">{item.description || 'Sin descripción'}</Typography>
                      </Box>
                      <Stack direction="row" spacing={0.5} flexWrap="wrap" alignItems="center">
                        <Button size="small" variant="outlined" onClick={() => openAddToPlanModal(item)}>
                          Agregar a plan anual
                        </Button>
                        <Button size="small" onClick={() => onNavigateToPlans?.(item.id)}>
                          Ver en planes anuales
                        </Button>
                        <Tooltip title="Ver registros">
                          <IconButton size="small" onClick={() => openRecordsDialog(item)}>
                            <BarChartIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Editar">
                          <IconButton size="small" onClick={() => openEdit(item)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Eliminar">
                          <IconButton size="small" color="error" onClick={() => setDeleteConfirmItem(item)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            )}
          </Paper>
        </Grid>
      </Grid>

      <Dialog open={Boolean(editItem)} onClose={() => setEditItem(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Editar tipo de capacitación</DialogTitle>
        <DialogContent>
          <Stack spacing={1.5} sx={{ mt: 1 }}>
            <TextField label="Nombre" value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} fullWidth />
            <Autocomplete
              multiple
              freeSolo={false}
              options={categories}
              value={editSelectedCategories}
              getOptionLabel={(opt) => (opt?.name ?? '')}
              isOptionEqualToValue={(opt, val) => opt?.id === val?.id}
              onChange={(_, newValue) => setEditSelectedCategories(newValue || [])}
              renderInput={(params) => <TextField {...params} label="Categorías" placeholder="Seleccionar" />}
            />
            <TextField multiline rows={2} label="Descripción" value={editForm.description} onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))} fullWidth />
            <TextField select label="Modalidad" value={editForm.modality} onChange={(e) => setEditForm((f) => ({ ...f, modality: e.target.value }))} fullWidth>
              <MenuItem value="in_person">Presencial</MenuItem>
              <MenuItem value="virtual">Virtual</MenuItem>
              <MenuItem value="hybrid">Híbrida</MenuItem>
            </TextField>
            <TextField type="number" label="Duración (min)" value={editForm.recommendedDurationMinutes} onChange={(e) => setEditForm((f) => ({ ...f, recommendedDurationMinutes: e.target.value }))} fullWidth />
            <TextField type="number" label="Vigencia (meses)" value={editForm.validityMonths} onChange={(e) => setEditForm((f) => ({ ...f, validityMonths: e.target.value }))} fullWidth />
            <Stack direction="row" flexWrap="wrap" spacing={2}>
              <FormControlLabel
                control={<Checkbox checked={editForm.requiresEvaluation === true} onChange={(e) => setEditForm((f) => ({ ...f, requiresEvaluation: e.target.checked }))} />}
                label="Requiere evaluación"
              />
              <FormControlLabel
                control={<Checkbox checked={editForm.requiresScore === true} onChange={(e) => setEditForm((f) => ({ ...f, requiresScore: e.target.checked }))} disabled={!editForm.requiresEvaluation} />}
                label="Requiere calificación (puntaje)"
              />
            </Stack>
            <TextField select label="Estado" value={editForm.status} onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value }))} fullWidth>
              <MenuItem value="active">Activo</MenuItem>
              <MenuItem value="inactive">Inactivo</MenuItem>
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditItem(null)}>Cancelar</Button>
          <Button variant="contained" onClick={saveEdit} disabled={savingEdit}>{savingEdit ? 'Guardando...' : 'Guardar'}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(deleteConfirmItem)} onClose={() => !deleting && setDeleteConfirmItem(null)}>
        <DialogTitle>Eliminar tipo de capacitación</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Eliminar &quot;{deleteConfirmItem?.name}&quot;? Si existe al menos una sesión con este tipo, se desactivará (estado inactivo) en lugar de borrarlo.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmItem(null)} disabled={deleting}>Cancelar</Button>
          <Button variant="contained" color="error" onClick={handleDeleteConfirm} disabled={deleting}>{deleting ? 'Procesando...' : 'Eliminar'}</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(addToPlanItem)}
        onClose={() => !addToPlanSaving && closeAddToPlanModal()}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          Agregar a plan anual {addToPlanItem ? `: ${addToPlanItem.name}` : ''}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={1.5} sx={{ mt: 1 }}>
            {addToPlanError && (
              <Alert severity="error" onClose={() => setAddToPlanError('')}>
                {addToPlanError}
              </Alert>
            )}
            {addToPlanSuccess ? (
              <Alert severity="success">
                Agregado al plan anual. Puedes ir a Planes anuales para editarlo.
              </Alert>
            ) : (
              <>
                {addToPlanItem && (
                  <Box
                    sx={{
                      py: 1,
                      px: 1.5,
                      borderRadius: 1,
                      bgcolor: 'action.hover',
                      border: '1px solid',
                      borderColor: 'divider'
                    }}
                  >
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.25 }}>
                      Frecuencia automática
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 0.5 }}>
                      1 capacitación cada {Number(addToPlanItem.validityMonths) || 12} meses
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.25 }}>
                      Meses planificados
                    </Typography>
                    <Typography variant="body2">
                      {(() => {
                        const validityMonths = Number(addToPlanItem.validityMonths) || 12;
                        const startMonth = Number(addToPlanForm.startMonth) || 1;
                        const months = generatePlannedMonths(validityMonths, startMonth);
                        const names = months.map((m) =>
                          new Date(2000, m - 1, 1).toLocaleString('es', { month: 'long' })
                        );
                        return names.length === 1
                          ? names[0]
                          : names.slice(0, -1).join(', ') + (names.length > 1 ? ' y ' : '') + names[names.length - 1];
                      })()}
                    </Typography>
                  </Box>
                )}
                <TextField
                  select
                  fullWidth
                  label="Mes de inicio"
                  value={addToPlanForm.startMonth}
                  onChange={(e) => setAddToPlanForm((f) => ({ ...f, startMonth: Number(e.target.value) || 1 }))}
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                    <MenuItem key={m} value={m}>
                      {new Date(2000, m - 1, 1).toLocaleString('es', { month: 'long' })}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  select
                  fullWidth
                  label="Empresa"
                  value={addToPlanForm.companyId}
                  onChange={(e) =>
                    setAddToPlanForm((f) => ({ ...f, companyId: e.target.value, branchId: '' }))
                  }
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
                  value={addToPlanForm.branchId}
                  onChange={(e) => setAddToPlanForm((f) => ({ ...f, branchId: e.target.value }))}
                  disabled={!addToPlanForm.companyId}
                >
                  {userSucursales
                    .filter((s) => !addToPlanForm.companyId || s.empresaId === addToPlanForm.companyId)
                    .map((sucursal) => (
                      <MenuItem key={sucursal.id} value={sucursal.id}>
                        {sucursal.nombre}
                      </MenuItem>
                    ))}
                </TextField>
                <TextField
                  fullWidth
                  label="Notas (opcional)"
                  value={addToPlanForm.notes}
                  onChange={(e) => setAddToPlanForm((f) => ({ ...f, notes: e.target.value }))}
                  multiline
                  rows={2}
                />
              </>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          {addToPlanSuccess ? (
            <>
              <Button onClick={closeAddToPlanModal}>Cerrar</Button>
              <Button variant="contained" onClick={() => { closeAddToPlanModal(); onNavigateToPlans?.(addToPlanItem?.id); }}>
                Ir a planes anuales
              </Button>
            </>
          ) : (
            <>
              <Button onClick={closeAddToPlanModal} disabled={addToPlanSaving}>
                Cancelar
              </Button>
              <Button
                variant="contained"
                onClick={addTrainingTypeToPlan}
                disabled={addToPlanSaving || !addToPlanForm.companyId || !addToPlanForm.branchId}
              >
                {addToPlanSaving ? 'Agregando...' : 'Confirmar'}
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(recordsDialogItem)} onClose={() => setRecordsDialogItem(null)} maxWidth="md" fullWidth>
        <DialogTitle>Registros: {recordsDialogItem?.name}</DialogTitle>
        <DialogContent>
          {recordsLoading ? (
            <CircularProgress sx={{ my: 2 }} />
          ) : (
            <Table size="small" sx={{ mt: 1 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Empleado</TableCell>
                  <TableCell>Fecha vigencia desde</TableCell>
                  <TableCell>Vence</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Certificado</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {recordsList.length === 0 ? (
                  <TableRow><TableCell colSpan={5} align="center">Sin registros</TableCell></TableRow>
                ) : (
                  recordsList.map((row) => {
                    const emp = employeesMap[row.employeeId];
                    const name = emp ? `${emp.apellido || ''}, ${emp.nombre || ''}`.trim() || emp.nombre : row.employeeId;
                    const { label: statusLabel, status } = complianceLabelFromValidUntil(row.validUntil);
                    const chipColor = status === 'compliant' ? 'success' : status === 'expiring_soon' ? 'warning' : status === 'expired' ? 'error' : 'default';
                    return (
                      <TableRow key={row.id}>
                        <TableCell>{name}</TableCell>
                        <TableCell>{formatDateAR(row.validFrom)}</TableCell>
                        <TableCell>{formatDateAR(row.validUntil)}</TableCell>
                        <TableCell><Chip label={statusLabel} color={chipColor} size="small" /></TableCell>
                        <TableCell>{row.certificateId ? 'Sí' : '—'}</TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRecordsDialogItem(null)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

