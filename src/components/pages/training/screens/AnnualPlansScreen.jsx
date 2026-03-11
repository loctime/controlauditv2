import logger from '@/utils/logger';
import React, { useEffect, useState } from 'react';
import { Alert, Box, Button, CircularProgress, Grid, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material';
import { useAuth } from '@/components/context/AuthContext';
import { trainingCatalogService, trainingPlanService } from '../../../../services/training';
export default function AnnualPlansScreen() {
  const { userProfile, userEmpresas = [], userSucursales = [] } = useAuth();
  const ownerId = userProfile?.ownerId;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [plans, setPlans] = useState([]);
  const [planItems, setPlanItems] = useState([]);
  const [catalog, setCatalog] = useState([]);

  const [planForm, setPlanForm] = useState({
    year: new Date().getFullYear(),
    companyId: '',
    branchId: '',
    responsibleUserId: userProfile?.uid || '',
    status: 'draft',
    notes: ''
  });

  const [itemForm, setItemForm] = useState({
    planId: '',
    trainingTypeId: '',
    plannedMonth: 1,
    targetAudience: '',
    estimatedParticipants: 0,
    priority: 'medium',
    notes: ''
  });

  const load = async () => {
    if (!ownerId) return;
    setLoading(true);
    setError('');
    try {
      const [plansData, itemsData, catalogData] = await Promise.all([
        trainingPlanService.listPlans(ownerId),
        trainingPlanService.listPlanItems(ownerId),
        trainingCatalogService.listActive(ownerId)
      ]);
      setPlans(plansData);
      setPlanItems(itemsData);
      setCatalog(catalogData);
    } catch (err) {
      logger.error('[AnnualPlansScreen] load error', err);
      setError('No se pudieron cargar los planes y sus items.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [ownerId]);

  const createPlan = async () => {
    if (!ownerId) return;
    if (!planForm.companyId || !planForm.branchId) {
      setError('Empresa y sucursal son obligatorias.');
      return;
    }

    setSaving(true);
    try {
      const ref = await trainingPlanService.createPlan(ownerId, planForm);
      setItemForm((prev) => ({ ...prev, planId: ref.id }));
      await load();
    } catch (err) {
      setError(err.message || 'No se pudo crear el plan.');
    } finally {
      setSaving(false);
    }
  };

  const createItem = async () => {
    if (!ownerId) return;
    if (!itemForm.planId || !itemForm.trainingTypeId) {
      setError('Plan y tipo de capacitación son obligatorios para crear el item.');
      return;
    }

    setSaving(true);
    try {
      await trainingPlanService.createPlanItem(ownerId, {
        ...itemForm,
        estimatedParticipants: Number(itemForm.estimatedParticipants || 0),
        plannedMonth: Number(itemForm.plannedMonth || 1)
      });
      await load();
    } catch (err) {
      setError(err.message || 'No se pudo crear el item del plan.');
    } finally {
      setSaving(false);
    }
  };

  if (!ownerId) {
    return <Alert severity="warning">No hay contexto de owner disponible para planes anuales.</Alert>;
  }

  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Crear plan anual</Typography>
            <Stack spacing={1.5}>
              <TextField label="Año" type="number" value={planForm.year} onChange={(e) => setPlanForm({ ...planForm, year: Number(e.target.value) })} />
              <TextField
                select
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
                label="Usuario responsable"
                value={planForm.responsibleUserId}
                onChange={(e) => setPlanForm({ ...planForm, responsibleUserId: e.target.value })}
              />
              <TextField
                select
                label="Estado"
                value={planForm.status}
                onChange={(e) => setPlanForm({ ...planForm, status: e.target.value })}
              >
                <MenuItem value="draft">Borrador</MenuItem>
                <MenuItem value="approved">Aprobado</MenuItem>
                <MenuItem value="in_progress">En progreso</MenuItem>
                <MenuItem value="closed">Cerrado</MenuItem>
              </TextField>
              <TextField
                multiline
                rows={2}
                label="Notas"
                value={planForm.notes}
                onChange={(e) => setPlanForm({ ...planForm, notes: e.target.value })}
              />
              <Button variant="contained" onClick={createPlan} disabled={saving}>
                {saving ? 'Guardando...' : 'Crear plan'}
              </Button>
            </Stack>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Crear item de plan</Typography>
            <Stack spacing={1.5}>
              <TextField
                select
                label="Plan"
                value={itemForm.planId}
                onChange={(e) => setItemForm({ ...itemForm, planId: e.target.value })}
              >
                {plans.map((plan) => (
                  <MenuItem key={plan.id} value={plan.id}>
                    {plan.year} -{' '}
                    {userSucursales.find((sucursal) => sucursal.id === plan.branchId)?.nombre || 'Sin dato'}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="Tipo de capacitación"
                value={itemForm.trainingTypeId}
                onChange={(e) => setItemForm({ ...itemForm, trainingTypeId: e.target.value })}
              >
                {catalog.map((item) => (
                  <MenuItem key={item.id} value={item.id}>
                    {item.name}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                type="number"
                label="Mes planificado"
                value={itemForm.plannedMonth}
                onChange={(e) => setItemForm({ ...itemForm, plannedMonth: Number(e.target.value) })}
              />
              <TextField
                label="Audiencia objetivo"
                value={itemForm.targetAudience}
                onChange={(e) => setItemForm({ ...itemForm, targetAudience: e.target.value })}
              />
              <TextField
                type="number"
                label="Participantes estimados"
                value={itemForm.estimatedParticipants}
                onChange={(e) =>
                  setItemForm({ ...itemForm, estimatedParticipants: Number(e.target.value) })
                }
              />
              <TextField
                select
                label="Prioridad"
                value={itemForm.priority}
                onChange={(e) => setItemForm({ ...itemForm, priority: e.target.value })}
              >
                <MenuItem value="low">Baja</MenuItem>
                <MenuItem value="medium">Media</MenuItem>
                <MenuItem value="high">Alta</MenuItem>
              </TextField>
              <TextField
                multiline
                rows={2}
                label="Notas"
                value={itemForm.notes}
                onChange={(e) => setItemForm({ ...itemForm, notes: e.target.value })}
              />
              <Button variant="contained" onClick={createItem} disabled={saving}>
                {saving ? 'Guardando...' : 'Crear item de plan'}
              </Button>
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      <Paper sx={{ p: 2, mt: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Planes e items</Typography>
        {loading ? (
          <CircularProgress />
        ) : (
          <Stack spacing={1}>
            {plans.map((plan) => {
              const items = planItems.filter((item) => item.planId === plan.id);
              return (
                <Paper key={plan.id} variant="outlined" sx={{ p: 2 }}>
                  <Typography sx={{ fontWeight: 700 }}>
                    {plan.year} -{' '}
                    {userSucursales.find((sucursal) => sucursal.id === plan.branchId)?.nombre ||
                      'Sin dato'}{' '}
                    - {plan.status}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {plan.notes || 'Sin notas'}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    items del plan: {items.length}
                  </Typography>
                </Paper>
              );
            })}
          </Stack>
        )}
      </Paper>
    </Box>
  );
}

