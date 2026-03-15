import logger from '@/utils/logger';
import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Alert, Box, Button, Chip, CircularProgress, Grid, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material';
import { useAuth } from '@/components/context/AuthContext';
import { trainingCatalogService, trainingPlanService } from '../../../../services/training';

export default function AnnualPlansScreen() {
  const [searchParams] = useSearchParams();
  const filterTrainingTypeId = searchParams.get('trainingTypeId') || null;
  const { userProfile, userEmpresas = [], userSucursales = [] } = useAuth();
  const ownerId = userProfile?.ownerId;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [plans, setPlans] = useState([]);
  const [planItems, setPlanItems] = useState([]);
  const [catalog, setCatalog] = useState([]);

  const [planForm, setPlanForm] = useState({
    companyId: '',
    branchId: '',
    notes: ''
  });

  const [itemForm, setItemForm] = useState({
    planId: '',
    trainingTypeId: '',
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

  const { filteredPlans, filteredPlanItemsByPlan, filterTypeName } = useMemo(() => {
    if (!filterTrainingTypeId) {
      return {
        filteredPlans: plans,
        filteredPlanItemsByPlan: (planId) => planItems.filter((i) => i.planId === planId),
        filterTypeName: null
      };
    }
    const planIdsWithType = new Set(
      planItems.filter((i) => i.trainingTypeId === filterTrainingTypeId).map((i) => i.planId)
    );
    const filtered = plans.filter((p) => planIdsWithType.has(p.id));
    return {
      filteredPlans: filtered,
      filteredPlanItemsByPlan: (planId) =>
        planItems.filter((i) => i.planId === planId && i.trainingTypeId === filterTrainingTypeId),
      filterTypeName: catalog.find((c) => c.id === filterTrainingTypeId)?.name || filterTrainingTypeId
    };
  }, [plans, planItems, catalog, filterTrainingTypeId]);

  const createPlan = async () => {
    if (!ownerId) return;
    if (!planForm.companyId || !planForm.branchId) {
      setError('Empresa y sucursal son obligatorias.');
      return;
    }

    setSaving(true);
    try {
      const ref = await trainingPlanService.createPlan(ownerId, {
        ...planForm,
        responsibleUserId: userProfile?.uid || '',
        status: 'draft'
      });
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
      setError('Plan y tipo de capacitación son obligatorios.');
      return;
    }
    const catalogItem = catalog.find((c) => c.id === itemForm.trainingTypeId);
    const validityMonths = Number(catalogItem?.validityMonths) || 12;

    setSaving(true);
    try {
      await trainingPlanService.assignTrainingTypeToPlan(ownerId, {
        planId: itemForm.planId,
        trainingTypeId: itemForm.trainingTypeId,
        validityMonths,
        notes: (itemForm.notes || '').trim() || ''
      });
      setItemForm((prev) => ({ ...prev, trainingTypeId: '', notes: '' }));
      await load();
    } catch (err) {
      setError(err.message || 'No se pudo agregar la capacitación al plan.');
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
            <Typography variant="h6" sx={{ mb: 2 }}>Crear plan</Typography>
            <Stack spacing={1.5}>
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
                    {userSucursales.find((sucursal) => sucursal.id === plan.branchId)?.nombre || 'Sin dato'}
                    {plan.year != null ? ` (${plan.year})` : ''}
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
                    {item.name} (vigencia: {Number(item.validityMonths) || 12} meses)
                  </MenuItem>
                ))}
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
        <Stack direction="row" alignItems="center" gap={1} sx={{ mb: 2 }}>
          <Typography variant="h6">Planes e items</Typography>
          {filterTypeName && (
            <Chip
              label={`Filtrado por: ${filterTypeName}`}
              size="small"
              color="primary"
              variant="outlined"
            />
          )}
        </Stack>
        {loading ? (
          <CircularProgress />
        ) : (
          <Stack spacing={1}>
            {filteredPlans.length === 0 ? (
              <Typography color="text.secondary">
                {filterTrainingTypeId
                  ? 'Ningún plan contiene este tipo de capacitación.'
                  : 'No hay planes. Crea un plan o agrega capacitaciones desde el catálogo.'}
              </Typography>
            ) : (
              filteredPlans.map((plan) => {
                const items = filteredPlanItemsByPlan(plan.id);
                return (
                  <Paper key={plan.id} variant="outlined" sx={{ p: 2 }}>
                    <Typography sx={{ fontWeight: 700 }}>
                      {userSucursales.find((sucursal) => sucursal.id === plan.branchId)?.nombre || 'Sin dato'}
                      {plan.year != null ? ` (${plan.year})` : ''} - {plan.status}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {plan.notes || 'Sin notas'}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      items del plan{filterTrainingTypeId ? ' (tipo filtrado)' : ''}: {items.length}
                    </Typography>
                  </Paper>
                );
              })
            )}
          </Stack>
        )}
      </Paper>
    </Box>
  );
}

