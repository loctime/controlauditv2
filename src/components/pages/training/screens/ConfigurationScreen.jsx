import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
  CircularProgress
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { useAuth } from '@/components/context/AuthContext';
import { trainingCatalogService } from '@/services/training';

function normalizeBool(v) {
  return v === true;
}

export default function ConfigurationScreen() {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const ownerId = userProfile?.ownerId;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [items, setItems] = useState([]);

  const [addOpen, setAddOpen] = useState(false);
  const [addName, setAddName] = useState('');
  const [addRequiresEvaluation, setAddRequiresEvaluation] = useState(false);
  const [addRequiresScore, setAddRequiresScore] = useState(false);
  const [adding, setAdding] = useState(false);
  const [addLocalError, setAddLocalError] = useState('');

  const [editOpen, setEditOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [editName, setEditName] = useState('');
  const [editRequiresEvaluation, setEditRequiresEvaluation] = useState(false);
  const [editRequiresScore, setEditRequiresScore] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editLocalError, setEditLocalError] = useState('');

  const refresh = useCallback(async () => {
    if (!ownerId) return;
    setLoading(true);
    setError('');
    try {
      const list = await trainingCatalogService.listActive(ownerId);
      setItems(list || []);
    } catch (err) {
      setError(err?.message || 'No se pudo cargar el catálogo de capacitaciones.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [ownerId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const openAdd = () => {
    setAddLocalError('');
    setAddName('');
    setAddRequiresEvaluation(false);
    setAddRequiresScore(false);
    setAddOpen(true);
  };

  const openEdit = (item) => {
    setEditLocalError('');
    setEditItem(item);
    setEditName(item?.name || '');
    setEditRequiresEvaluation(normalizeBool(item?.requiresEvaluation));
    setEditRequiresScore(normalizeBool(item?.requiresScore) && normalizeBool(item?.requiresEvaluation));
    setEditOpen(true);
  };

  const closeAdd = () => {
    setAddOpen(false);
  };

  const closeEdit = () => {
    setEditOpen(false);
    setEditItem(null);
  };

  const handleToggleAddRequiresEvaluation = (next) => {
    setAddRequiresEvaluation(next);
    if (!next) setAddRequiresScore(false);
  };

  const handleToggleEditRequiresEvaluation = (next) => {
    setEditRequiresEvaluation(next);
    if (!next) setEditRequiresScore(false);
  };

  const canSaveAdd = useMemo(() => addName.trim().length > 0 && !adding && !!ownerId, [addName, adding, ownerId]);
  const canSaveEdit = useMemo(() => editItem?.id && editName.trim().length > 0 && !savingEdit && !!ownerId, [editItem, editName, savingEdit, ownerId]);

  const handleAdd = async () => {
    if (!canSaveAdd) return;

    setAddLocalError('');
    setAdding(true);
    try {
      await trainingCatalogService.create(ownerId, {
        name: addName.trim(),
        requiresEvaluation: addRequiresEvaluation,
        requiresScore: addRequiresEvaluation && addRequiresScore,
        status: 'active'
      });
      await refresh();
      closeAdd();
    } catch (err) {
      setAddLocalError(err?.message || 'No se pudo crear el tipo de capacitación.');
    } finally {
      setAdding(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!canSaveEdit) return;

    setEditLocalError('');
    setSavingEdit(true);
    try {
      await trainingCatalogService.update(ownerId, editItem.id, {
        name: editName.trim(),
        requiresEvaluation: editRequiresEvaluation,
        requiresScore: editRequiresEvaluation && editRequiresScore,
        status: 'active'
      });
      await refresh();
      closeEdit();
    } catch (err) {
      setEditLocalError(err?.message || 'No se pudo actualizar el tipo de capacitación.');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async (item) => {
    if (!ownerId || !item?.id) return;
    const ok = window.confirm(`¿Eliminar "${item.name}"? (Se marcará como inactivo)`);
    if (!ok) return;

    setLoading(true);
    setError('');
    try {
      await trainingCatalogService.update(ownerId, item.id, { status: 'inactive' });
      await refresh();
    } catch (err) {
      setError(err?.message || 'No se pudo eliminar el tipo de capacitación.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Stack direction="row" alignItems="center" sx={{ mb: 2 }}>
        <Tooltip title="Volver a Matriz">
          <IconButton onClick={() => navigate('/training')} size="small">
            <ArrowBackIcon />
          </IconButton>
        </Tooltip>
        <Typography variant="h6" sx={{ ml: 1 }}>
          Catálogo de Capacitaciones
        </Typography>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Tipos de capacitación
          </Typography>
          <Button variant="contained" size="small" onClick={openAdd}>
            + Agregar
          </Button>
        </Stack>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress size={24} />
          </Box>
        ) : items.length === 0 ? (
          <Alert severity="info">No hay tipos de capacitación activos.</Alert>
        ) : (
          <Stack spacing={1}>
            {items.map((item) => (
              <Paper key={item.id} variant="outlined" sx={{ p: 1.25 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                  <Typography sx={{ fontWeight: 600 }}>
                    {item.name}
                  </Typography>
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <Tooltip title="Editar">
                      <IconButton size="small" onClick={() => openEdit(item)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Eliminar">
                      <IconButton size="small" color="error" onClick={() => handleDelete(item)}>
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

      {/* Add dialog */}
      <Dialog open={addOpen} onClose={!adding ? closeAdd : undefined} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Nuevo tipo de capacitación</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={1.5}>
            <TextField
              label="Nombre"
              value={addName}
              onChange={(e) => setAddName(e.target.value)}
              autoFocus
              fullWidth
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={addRequiresEvaluation === true}
                  onChange={(e) => handleToggleAddRequiresEvaluation(e.target.checked)}
                />
              }
              label="Requiere evaluación"
            />

            {addRequiresEvaluation && (
              <FormControlLabel
                control={
                  <Checkbox
                    checked={addRequiresScore === true}
                    onChange={(e) => setAddRequiresScore(e.target.checked)}
                  />
                }
                label="Requiere calificación (puntaje)"
              />
            )}

            {addLocalError && <Alert severity="error">{addLocalError}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeAdd} disabled={adding}>Cancelar</Button>
          <Button variant="contained" onClick={handleAdd} disabled={!canSaveAdd}>
            {adding ? <CircularProgress size={18} color="inherit" /> : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={editOpen} onClose={!savingEdit ? closeEdit : undefined} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Editar tipo de capacitación</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={1.5}>
            <TextField
              label="Nombre"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              autoFocus
              fullWidth
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={editRequiresEvaluation === true}
                  onChange={(e) => handleToggleEditRequiresEvaluation(e.target.checked)}
                />
              }
              label="Requiere evaluación"
            />

            {editRequiresEvaluation && (
              <FormControlLabel
                control={
                  <Checkbox
                    checked={editRequiresScore === true}
                    onChange={(e) => setEditRequiresScore(e.target.checked)}
                  />
                }
                label="Requiere calificación (puntaje)"
              />
            )}

            {editLocalError && <Alert severity="error">{editLocalError}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeEdit} disabled={savingEdit}>Cancelar</Button>
          <Button variant="contained" onClick={handleSaveEdit} disabled={!canSaveEdit}>
            {savingEdit ? <CircularProgress size={18} color="inherit" /> : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

