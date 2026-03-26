import { useEffect, useState } from 'react';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Link,
  TextField,
  Typography
} from '@mui/material';
import { useAuth } from '@/components/context/AuthContext';
import { trainingCatalogService } from '../../../../../services/training/trainingCatalogService';
import { trainingPlanService } from '../../../../../services/training/trainingPlanService';

const MONTH_NAMES = [
  '', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

/**
 * Modal para agregar una capacitación a un mes del plan.
 * Si no existe plan para el año+sucursal, lo crea automáticamente.
 *
 * @param {{
 *   open: boolean,
 *   onClose: () => void,
 *   month: number,
 *   year: number,
 *   planId: string|null,
 *   sucursalId: string,
 *   existingTrainingTypeIds: string[],  // ya asignados a este mes (para validar duplicados)
 *   onSaved: () => void
 * }} props
 */
export default function AddPlanItemModal({
  open,
  onClose,
  month,
  year,
  planId,
  sucursalId,
  existingTrainingTypeIds = [],
  onSaved
}) {
  const { userProfile, userSucursales = [] } = useAuth();
  const ownerId = userProfile?.ownerId;

  const [catalogItems, setCatalogItems] = useState([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [selectedType, setSelectedType] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [createTypeDialogOpen, setCreateTypeDialogOpen] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');
  const [creatingType, setCreatingType] = useState(false);
  const [createTypeError, setCreateTypeError] = useState('');

  const companyId = userSucursales.find(s => s.id === sucursalId)?.empresaId || '';

  // Load catalog when modal opens
  useEffect(() => {
    if (!open || !ownerId) return;
    setLoadingCatalog(true);
    trainingCatalogService.listActive(ownerId)
      .then(items => setCatalogItems(items || []))
      .catch(() => setCatalogItems([]))
      .finally(() => setLoadingCatalog(false));
  }, [open, ownerId]);

  // Reset on close
  useEffect(() => {
    if (!open) {
      setSelectedType(null);
      setError('');
      setCreateTypeDialogOpen(false);
      setNewTypeName('');
      setCreateTypeError('');
    }
  }, [open]);

  async function handleCreateType() {
    if (!newTypeName.trim() || !ownerId) return;
    setCreateTypeError('');
    setCreatingType(true);

    try {
      const newCatalogItem = await trainingCatalogService.create(ownerId, {
        name: newTypeName.trim(),
        status: 'active'
      });

      // Reload catalog
      const updated = await trainingCatalogService.listActive(ownerId);
      setCatalogItems(updated || []);

      // Auto-select the new item
      setSelectedType(newCatalogItem);
      setCreateTypeDialogOpen(false);
      setNewTypeName('');
    } catch (err) {
      setCreateTypeError(err?.message || 'Error al crear el tipo de capacitación.');
    } finally {
      setCreatingType(false);
    }
  }

  const existingSet = new Set(existingTrainingTypeIds);

  async function handleSave() {
    if (!selectedType || !ownerId) return;
    setError('');

    if (existingSet.has(selectedType.id)) {
      setError('Esta capacitación ya está en este mes.');
      return;
    }

    setSaving(true);
    try {
      await trainingPlanService.assignTrainingTypeToPlan(ownerId, {
        planId: planId || undefined,
        companyId,
        branchId: sucursalId,
        year: Number(year),
        trainingTypeId: selectedType.id,
        plannedMonth: Number(month),
        // assignTrainingTypeToPlan generates months based on frequency,
        // but we only want this specific month, so we use a single-month override
        frequencyMonths: 12,  // low frequency so it only creates 1 item per year
        startMonth: Number(month)
      });
      onSaved();
      onClose();
    } catch (err) {
      setError(err?.message || 'Error al agregar la capacitación al plan.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>
        Agregar capacitación — {MONTH_NAMES[month] || month} {year}
      </DialogTitle>

      <DialogContent>
        {loadingCatalog ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress size={28} />
          </Box>
        ) : (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Seleccioná el tipo de capacitación que querés agregar a este mes del plan.
            </Typography>

            <Box>
              <Autocomplete
                options={catalogItems}
                getOptionLabel={item => item.name || item.id}
                getOptionKey={item => item.id}
                value={selectedType}
                onChange={(_, val) => { setSelectedType(val); setError(''); }}
                renderInput={params => (
                  <TextField
                    {...params}
                    label="Tipo de capacitación"
                    size="small"
                    autoFocus
                  />
                )}
                noOptionsText="No hay tipos de capacitación activos"
                isOptionEqualToValue={(opt, val) => opt.id === val.id}
              />
              <Link
                component="button"
                type="button"
                variant="body2"
                onClick={() => setCreateTypeDialogOpen(true)}
                sx={{ mt: 1, display: 'block', cursor: 'pointer' }}
              >
                + Crear nuevo tipo de capacitación
              </Link>
            </Box>

            {selectedType && existingSet.has(selectedType.id) && (
              <Alert severity="warning" sx={{ mt: 1.5 }}>
                Esta capacitación ya está en {MONTH_NAMES[month] || month}.
              </Alert>
            )}

            {error && (
              <Alert severity="error" sx={{ mt: 1.5 }}>{error}</Alert>
            )}
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={saving}>Cancelar</Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={!selectedType || saving || loadingCatalog}
        >
          {saving ? <CircularProgress size={18} color="inherit" /> : 'Agregar'}
        </Button>
      </DialogActions>

      {/* Create new training type dialog */}
      <Dialog open={createTypeDialogOpen} onClose={() => !creatingType && setCreateTypeDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Crear nuevo tipo de capacitación</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            label="Nombre"
            size="small"
            fullWidth
            value={newTypeName}
            onChange={e => setNewTypeName(e.target.value)}
            autoFocus
            placeholder="Ej: Primeros auxilios"
          />
          {createTypeError && <Alert severity="error" sx={{ mt: 1.5 }}>{createTypeError}</Alert>}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setCreateTypeDialogOpen(false)} disabled={creatingType}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleCreateType}
            disabled={!newTypeName.trim() || creatingType}
          >
            {creatingType ? <CircularProgress size={18} color="inherit" /> : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
}
