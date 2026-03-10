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
      console.error('[AnnualPlansScreen] load error', err);
      setError('Unable to load plans and items.');
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
      setError('Company and branch are required.');
      return;
    }

    setSaving(true);
    try {
      const ref = await trainingPlanService.createPlan(ownerId, planForm);
      setItemForm((prev) => ({ ...prev, planId: ref.id }));
      await load();
    } catch (err) {
      setError(err.message || 'Unable to create plan');
    } finally {
      setSaving(false);
    }
  };

  const createItem = async () => {
    if (!ownerId) return;
    if (!itemForm.planId || !itemForm.trainingTypeId) {
      setError('Plan and training type are required for a plan item.');
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
      setError(err.message || 'Unable to create plan item');
    } finally {
      setSaving(false);
    }
  };

  if (!ownerId) {
    return <Alert severity="warning">Owner context is not available for annual plans.</Alert>;
  }

  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Create Annual Plan</Typography>
            <Stack spacing={1.5}>
              <TextField label="Year" type="number" value={planForm.year} onChange={(e) => setPlanForm({ ...planForm, year: Number(e.target.value) })} />
              <TextField select label="Company" value={planForm.companyId} onChange={(e) => setPlanForm({ ...planForm, companyId: e.target.value, branchId: '' })}>
                {userEmpresas.map((empresa) => <MenuItem key={empresa.id} value={empresa.id}>{empresa.nombre}</MenuItem>)}
              </TextField>
              <TextField select label="Branch" value={planForm.branchId} onChange={(e) => setPlanForm({ ...planForm, branchId: e.target.value })}>
                {userSucursales.filter((s) => !planForm.companyId || s.empresaId === planForm.companyId).map((sucursal) => (
                  <MenuItem key={sucursal.id} value={sucursal.id}>{sucursal.nombre}</MenuItem>
                ))}
              </TextField>
              <TextField label="Responsible User" value={planForm.responsibleUserId} onChange={(e) => setPlanForm({ ...planForm, responsibleUserId: e.target.value })} />
              <TextField select label="Status" value={planForm.status} onChange={(e) => setPlanForm({ ...planForm, status: e.target.value })}>
                <MenuItem value="draft">Draft</MenuItem>
                <MenuItem value="approved">Approved</MenuItem>
                <MenuItem value="in_progress">In Progress</MenuItem>
                <MenuItem value="closed">Closed</MenuItem>
              </TextField>
              <TextField multiline rows={2} label="Notes" value={planForm.notes} onChange={(e) => setPlanForm({ ...planForm, notes: e.target.value })} />
              <Button variant="contained" onClick={createPlan} disabled={saving}>{saving ? 'Saving...' : 'Create Plan'}</Button>
            </Stack>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Create Plan Item</Typography>
            <Stack spacing={1.5}>
              <TextField select label="Plan" value={itemForm.planId} onChange={(e) => setItemForm({ ...itemForm, planId: e.target.value })}>
                {plans.map((plan) => <MenuItem key={plan.id} value={plan.id}>{plan.year} - {plan.branchId}</MenuItem>)}
              </TextField>
              <TextField select label="Training Type" value={itemForm.trainingTypeId} onChange={(e) => setItemForm({ ...itemForm, trainingTypeId: e.target.value })}>
                {catalog.map((item) => <MenuItem key={item.id} value={item.id}>{item.name}</MenuItem>)}
              </TextField>
              <TextField type="number" label="Planned Month" value={itemForm.plannedMonth} onChange={(e) => setItemForm({ ...itemForm, plannedMonth: Number(e.target.value) })} />
              <TextField label="Target Audience" value={itemForm.targetAudience} onChange={(e) => setItemForm({ ...itemForm, targetAudience: e.target.value })} />
              <TextField type="number" label="Estimated Participants" value={itemForm.estimatedParticipants} onChange={(e) => setItemForm({ ...itemForm, estimatedParticipants: Number(e.target.value) })} />
              <TextField select label="Priority" value={itemForm.priority} onChange={(e) => setItemForm({ ...itemForm, priority: e.target.value })}>
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="high">High</MenuItem>
              </TextField>
              <TextField multiline rows={2} label="Notes" value={itemForm.notes} onChange={(e) => setItemForm({ ...itemForm, notes: e.target.value })} />
              <Button variant="contained" onClick={createItem} disabled={saving}>{saving ? 'Saving...' : 'Create Plan Item'}</Button>
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      <Paper sx={{ p: 2, mt: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Plans and Items</Typography>
        {loading ? <CircularProgress /> : (
          <Stack spacing={1}>
            {plans.map((plan) => {
              const items = planItems.filter((item) => item.planId === plan.id);
              return (
                <Paper key={plan.id} variant="outlined" sx={{ p: 2 }}>
                  <Typography sx={{ fontWeight: 700 }}>{plan.year} · {plan.branchId} · {plan.status}</Typography>
                  <Typography variant="body2" color="text.secondary">{plan.notes || 'No notes'}</Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>Plan items: {items.length}</Typography>
                </Paper>
              );
            })}
          </Stack>
        )}
      </Paper>
    </Box>
  );
}
