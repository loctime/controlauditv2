import logger from '@/utils/logger';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  Grid,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useAuth } from '@/components/context/AuthContext';
import { trainingCatalogService, trainingCategoryService } from '../../../../services/training';
export default function CatalogScreen() {
  const { userProfile } = useAuth();
  const ownerId = userProfile?.ownerId;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [addingCategory, setAddingCategory] = useState(false);
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
                    <Typography sx={{ fontWeight: 700 }}>{item.name} ({item.status})</Typography>
                    <Typography variant="body2" color="text.secondary">{(item.categoryIds?.length ? item.categoryIds.map((id) => categories.find((c) => c.id === id)?.name || id).join(', ') : item.category || '—')} � {item.modality} � {item.validityMonths} meses</Typography>
                    <Typography variant="body2">{item.description || 'Sin descripci�n'}</Typography>
                  </Paper>
                ))}
              </Stack>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

