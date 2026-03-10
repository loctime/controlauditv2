import React, { useEffect, useState } from 'react';
import { Alert, Box, Button, CircularProgress, Grid, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material';
import { useAuth } from '@/components/context/AuthContext';
import { trainingCatalogService, trainingRequirementService } from '../../../../services/training';

export default function RequirementMatrixScreen() {
  const { userProfile, userEmpresas = [], userSucursales = [] } = useAuth();
  const ownerId = userProfile?.ownerId;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [rules, setRules] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [form, setForm] = useState({
    companyId: '',
    branchId: '',
    jobRoleId: '',
    sectorId: '',
    riskCategoryId: '',
    trainingTypeId: '',
    frequencyMonths: 12,
    mandatory: true,
    expirationRule: 'valid_until_plus_frequency',
    effectiveFrom: new Date().toISOString().slice(0, 10),
    status: 'active'
  });

  const load = async () => {
    if (!ownerId) return;
    setLoading(true);
    setError('');
    try {
      const [rulesData, catalogData] = await Promise.all([
        trainingRequirementService.listRules(ownerId),
        trainingCatalogService.listActive(ownerId)
      ]);
      setRules(rulesData);
      setCatalog(catalogData);
    } catch (err) {
      console.error('[RequirementMatrixScreen] load error', err);
      setError('Unable to load requirement matrix.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [ownerId]);

  const createRule = async () => {
    if (!ownerId) return;
    if (!form.companyId || !form.branchId || !form.trainingTypeId) {
      setError('Company, branch and training type are required.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      await trainingRequirementService.createRule(ownerId, {
        ...form,
        frequencyMonths: Number(form.frequencyMonths || 0)
      });
      await load();
    } catch (err) {
      setError(err.message || 'Unable to create matrix rule.');
    } finally {
      setSaving(false);
    }
  };

  if (!ownerId) {
    return <Alert severity="warning">Owner context is not available for requirement matrix.</Alert>;
  }

  const branches = userSucursales.filter((s) => !form.companyId || s.empresaId === form.companyId);

  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={2}>
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Create Requirement Rule</Typography>
            <Stack spacing={1.5}>
              <TextField select label="Company" value={form.companyId} onChange={(e) => setForm({ ...form, companyId: e.target.value, branchId: '' })}>
                {userEmpresas.map((empresa) => <MenuItem key={empresa.id} value={empresa.id}>{empresa.nombre}</MenuItem>)}
              </TextField>
              <TextField select label="Branch" value={form.branchId} onChange={(e) => setForm({ ...form, branchId: e.target.value })}>
                {branches.map((sucursal) => <MenuItem key={sucursal.id} value={sucursal.id}>{sucursal.nombre}</MenuItem>)}
              </TextField>
              <TextField label="Job Role Id" value={form.jobRoleId} onChange={(e) => setForm({ ...form, jobRoleId: e.target.value })} />
              <TextField label="Sector Id" value={form.sectorId} onChange={(e) => setForm({ ...form, sectorId: e.target.value })} />
              <TextField label="Risk Category Id" value={form.riskCategoryId} onChange={(e) => setForm({ ...form, riskCategoryId: e.target.value })} />
              <TextField select label="Training Type" value={form.trainingTypeId} onChange={(e) => setForm({ ...form, trainingTypeId: e.target.value })}>
                {catalog.map((item) => <MenuItem key={item.id} value={item.id}>{item.name}</MenuItem>)}
              </TextField>
              <TextField type="number" label="Frequency (months)" value={form.frequencyMonths} onChange={(e) => setForm({ ...form, frequencyMonths: Number(e.target.value) })} />
              <TextField select label="Mandatory" value={form.mandatory ? 'true' : 'false'} onChange={(e) => setForm({ ...form, mandatory: e.target.value === 'true' })}>
                <MenuItem value="true">Yes</MenuItem>
                <MenuItem value="false">No</MenuItem>
              </TextField>
              <TextField label="Expiration Rule" value={form.expirationRule} onChange={(e) => setForm({ ...form, expirationRule: e.target.value })} />
              <TextField type="date" label="Effective From" InputLabelProps={{ shrink: true }} value={form.effectiveFrom} onChange={(e) => setForm({ ...form, effectiveFrom: e.target.value })} />
              <Button variant="contained" onClick={createRule} disabled={saving}>{saving ? 'Saving...' : 'Create Rule'}</Button>
            </Stack>
          </Paper>
        </Grid>

        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Requirement Rules</Typography>
            {loading ? <CircularProgress /> : (
              <Stack spacing={1}>
                {rules.map((rule) => (
                  <Paper key={rule.id} variant="outlined" sx={{ p: 1.5 }}>
                    <Typography sx={{ fontWeight: 700 }}>{rule.trainingTypeId} - {rule.frequencyMonths}m</Typography>
                    <Typography variant="body2" color="text.secondary">{rule.companyId} / {rule.branchId} / {rule.jobRoleId || 'all roles'}</Typography>
                    <Typography variant="body2">{rule.mandatory ? 'Mandatory' : 'Optional'} - {rule.status}</Typography>
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