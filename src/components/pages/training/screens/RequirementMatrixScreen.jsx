import logger from '@/utils/logger';
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
      logger.error('[RequirementMatrixScreen] load error', err);
      setError('No se pudo cargar la matriz de requerimientos.');
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
      setError('Empresa, sucursal y tipo de capacitaci�n son obligatorios.');
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
      setError(err.message || 'No se pudo crear la regla de matriz.');
    } finally {
      setSaving(false);
    }
  };

  if (!ownerId) {
    return <Alert severity="warning">No hay contexto de owner disponible para matriz de requerimientos.</Alert>;
  }

  const branches = userSucursales.filter((s) => !form.companyId || s.empresaId === form.companyId);

  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={2}>
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Crear regla de requerimiento</Typography>
            <Stack spacing={1.5}>
              <TextField select label="Empresa" value={form.companyId} onChange={(e) => setForm({ ...form, companyId: e.target.value, branchId: '' })}>
                {userEmpresas.map((empresa) => <MenuItem key={empresa.id} value={empresa.id}>{empresa.nombre}</MenuItem>)}
              </TextField>
              <TextField select label="Sucursal" value={form.branchId} onChange={(e) => setForm({ ...form, branchId: e.target.value })}>
                {branches.map((sucursal) => <MenuItem key={sucursal.id} value={sucursal.id}>{sucursal.nombre}</MenuItem>)}
              </TextField>
              <TextField label="ID de puesto" value={form.jobRoleId} onChange={(e) => setForm({ ...form, jobRoleId: e.target.value })} />
              <TextField label="ID de sector" value={form.sectorId} onChange={(e) => setForm({ ...form, sectorId: e.target.value })} />
              <TextField label="ID de categor�a de riesgo" value={form.riskCategoryId} onChange={(e) => setForm({ ...form, riskCategoryId: e.target.value })} />
              <TextField select label="Tipo de capacitaci�n" value={form.trainingTypeId} onChange={(e) => setForm({ ...form, trainingTypeId: e.target.value })}>
                {catalog.map((item) => <MenuItem key={item.id} value={item.id}>{item.name}</MenuItem>)}
              </TextField>
              <TextField type="number" label="Frecuencia (meses)" value={form.frequencyMonths} onChange={(e) => setForm({ ...form, frequencyMonths: Number(e.target.value) })} />
              <TextField select label="Obligatoria" value={form.mandatory ? 'true' : 'false'} onChange={(e) => setForm({ ...form, mandatory: e.target.value === 'true' })}>
                <MenuItem value="true">S�</MenuItem>
                <MenuItem value="false">No</MenuItem>
              </TextField>
              <TextField label="Regla de vencimiento" value={form.expirationRule} onChange={(e) => setForm({ ...form, expirationRule: e.target.value })} />
              <TextField type="date" label="Vigencia desde" InputLabelProps={{ shrink: true }} value={form.effectiveFrom} onChange={(e) => setForm({ ...form, effectiveFrom: e.target.value })} />
              <Button variant="contained" onClick={createRule} disabled={saving}>{saving ? 'Guardando...' : 'Crear regla'}</Button>
            </Stack>
          </Paper>
        </Grid>

        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Reglas de requerimiento</Typography>
            {loading ? <CircularProgress /> : (
              <Stack spacing={1}>
                {rules.map((rule) => (
                  <Paper key={rule.id} variant="outlined" sx={{ p: 1.5 }}>
                    <Typography sx={{ fontWeight: 700 }}>{catalog.find((item) => item.id === rule.trainingTypeId)?.name || 'Sin dato'} - {rule.frequencyMonths}m</Typography>
                    <Typography variant="body2" color="text.secondary">{userEmpresas.find((empresa) => empresa.id === rule.companyId)?.nombre || 'Sin dato'} / {userSucursales.find((sucursal) => sucursal.id === rule.branchId)?.nombre || 'Sin dato'} / {rule.jobRoleId || 'todos los puestos'}</Typography>
                    <Typography variant="body2">{rule.mandatory ? 'Obligatoria' : 'Opcional'} - {rule.status}</Typography>
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


