import logger from '@/utils/logger';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
import { useAuth } from '@/components/context/AuthContext';
import {
  trainingCatalogService,
  trainingCategoryService,
  trainingSessionService,
  trainingAttendanceService,
} from '../../../../services/training';
import { empleadoService } from '../../../../services/empleadoService';

function complianceLabelFromValidUntil(validUntil) {
  if (!validUntil) return { label: 'Sin vigencia', status: 'missing' };
  const toDate = validUntil?.toDate ? validUntil.toDate() : new Date(validUntil);
  const days = Math.ceil((toDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (days < 0) return { label: 'Vencida', status: 'expired' };
  if (days < 30) return { label: 'Por vencer (<30d)', status: 'critical' };
  if (days <= 60) return { label: 'Por vencer (30-60d)', status: 'expiring_soon' };
  return { label: 'Vigente', status: 'compliant' };
}

export default function CatalogScreen() {
  const { userProfile, userSucursales = [] } = useAuth();
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
  const [form, setForm] = useState({
    name: '',
    description: '',
    modality: 'in_person',
    recommendedDurationMinutes: 60,
    validityMonths: 12,
    requiresEvaluation: true,
    requiresSignature: true,
    requiresCertificate: true,
    status: 'active'
  });

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
      setError('No se pudo cargar el cat�logo de capacitaciones.');
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
      setError(err.message || 'No se pudo crear el tipo de capacitaci�n.');
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
    return <Alert severity="warning">No hay contexto de owner disponible para cat�logo.</Alert>;
  }

  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={2}>
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Crear tipo de capacitaci�n</Typography>
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
              <TextField multiline rows={2} label="Descripci�n" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              <TextField select label="Modalidad" value={form.modality} onChange={(e) => setForm({ ...form, modality: e.target.value })}>
                <MenuItem value="in_person">Presencial</MenuItem>
                <MenuItem value="virtual">Virtual</MenuItem>
                <MenuItem value="hybrid">H�brida</MenuItem>
              </TextField>
              <TextField type="number" label="Duraci�n recomendada (minutos)" value={form.recommendedDurationMinutes} onChange={(e) => setForm({ ...form, recommendedDurationMinutes: e.target.value })} />
              <TextField type="number" label="Vigencia (meses)" value={form.validityMonths} onChange={(e) => setForm({ ...form, validityMonths: e.target.value })} />
              <TextField select label="Estado" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <MenuItem value="active">Activo</MenuItem>
                <MenuItem value="inactive">Inactivo</MenuItem>
              </TextField>
              <Button variant="contained" onClick={create} disabled={saving}>{saving ? 'Guardando...' : 'Crear tipo de capacitaci�n'}</Button>
            </Stack>
          </Paper>
        </Grid>

        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Cat�logo</Typography>
            {loading ? <CircularProgress /> : (
              <Stack spacing={1}>
                {items.map((item) => (
                  <Paper key={item.id} variant="outlined" sx={{ p: 1.5 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                      <Box sx={{ flex: 1 }}>
                        <Typography sx={{ fontWeight: 700 }}>{item.name} ({item.status})</Typography>
                        <Typography variant="body2" color="text.secondary">{(item.categoryIds?.length ? item.categoryIds.map((id) => categories.find((c) => c.id === id)?.name || id).join(', ') : item.category || '—')} � {item.modality} � {item.validityMonths} meses</Typography>
                        <Typography variant="body2">{item.description || 'Sin descripci�n'}</Typography>
                      </Box>
                      <Stack direction="row" spacing={0.5}>
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
                    const validFromStr = row.validFrom?.toDate ? row.validFrom.toDate().toLocaleDateString() : (row.validFrom ? String(row.validFrom) : '—');
                    const validUntilStr = row.validUntil?.toDate ? row.validUntil.toDate().toLocaleDateString() : (row.validUntil ? String(row.validUntil) : '—');
                    return (
                      <TableRow key={row.id}>
                        <TableCell>{name}</TableCell>
                        <TableCell>{validFromStr}</TableCell>
                        <TableCell>{validUntilStr}</TableCell>
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

