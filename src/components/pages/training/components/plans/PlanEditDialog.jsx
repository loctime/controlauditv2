import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  MenuItem,
  Alert
} from '@mui/material';
import { useAuth } from '@/components/context/AuthContext';
import { trainingPlanService } from '../../../../../services/training';

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Borrador' },
  { value: 'active', label: 'Activo' },
  { value: 'closed', label: 'Cerrado' }
];

export default function PlanEditDialog({ plan, open, onClose, onSaved, companies = [], branches = [] }) {
  const { userProfile, userEmpresas = [], userSucursales = [] } = useAuth();
  const ownerId = userProfile?.ownerId;

  const empresas = companies?.length ? companies : userEmpresas;
  const sucursales = branches?.length ? branches : userSucursales;

  const isCreate = !plan?.id;

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
    if (!open) return;
    setError('');
    if (isCreate) {
      setForm({
        companyId: '',
        branchId: '',
        year: new Date().getFullYear(),
        status: 'draft',
        notes: ''
      });
    } else {
      setForm({
        companyId: plan.companyId || '',
        branchId: plan.branchId || '',
        year: plan.year ?? new Date().getFullYear(),
        status: plan.status || 'draft',
        notes: plan.notes || ''
      });
    }
  }, [open, isCreate, plan]);

  const handleChange = (field) => (e) => {
    const value = field === 'year' ? parseInt(e.target.value, 10) || '' : e.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
    if (field === 'companyId') setForm((prev) => ({ ...prev, branchId: '' }));
  };

  const filteredBranches = sucursales.filter((s) => !form.companyId || s.empresaId === form.companyId);

  const handleSave = async () => {
    if (!ownerId) return;
    if (!form.companyId || !form.branchId) {
      setError('Empresa y sucursal son obligatorias.');
      return;
    }
    if (!isCreate && !plan?.id) {
      setError('Plan no válido.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      if (isCreate) {
        await trainingPlanService.createPlan(ownerId, {
          companyId: form.companyId,
          branchId: form.branchId,
          year: form.year ? Number(form.year) : undefined,
          status: form.status,
          notes: (form.notes || '').trim(),
          responsibleUserId: userProfile?.uid || ''
        });
      } else {
        await trainingPlanService.updatePlan(ownerId, plan.id, {
          companyId: form.companyId,
          branchId: form.branchId,
          year: form.year ? Number(form.year) : undefined,
          status: form.status,
          notes: (form.notes || '').trim()
        });
      }
      onClose();
      onSaved?.();
    } catch (err) {
      setError(err?.message || 'No se pudo guardar el plan.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isCreate ? 'Crear plan anual' : 'Editar plan'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}
          <TextField
            select
            label="Empresa"
            value={form.companyId}
            onChange={handleChange('companyId')}
            fullWidth
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
            inputProps={{ min: 2020, max: 2030 }}
          />
          <TextField
            select
            label="Estado"
            value={form.status}
            onChange={handleChange('status')}
            fullWidth
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
            multiline
            rows={3}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Cancelar</Button>
        <Button variant="contained" onClick={handleSave} disabled={saving}>
          {saving ? 'Guardando…' : 'Guardar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
