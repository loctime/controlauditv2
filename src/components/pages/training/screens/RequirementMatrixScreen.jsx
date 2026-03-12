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
import {
  trainingCatalogService,
  trainingRequirementService,
  trainingRoleRequirementService,
  trainingSectorService,
  trainingRiskCategoryService,
} from '../../../../services/training';

function jobRoleLabel(opt) {
  return opt?.name ?? opt?.nombre ?? opt?.title ?? opt?.id ?? '';
}

export default function RequirementMatrixScreen() {
  const { userProfile, userEmpresas = [], userSucursales = [] } = useAuth();
  const ownerId = userProfile?.ownerId;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [rules, setRules] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [jobRoles, setJobRoles] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [riskCategories, setRiskCategories] = useState([]);
  const [selectedJobRole, setSelectedJobRole] = useState(null);
  const [selectedSector, setSelectedSector] = useState(null);
  const [selectedRiskCategory, setSelectedRiskCategory] = useState(null);
  const [newJobRoleName, setNewJobRoleName] = useState('');
  const [newSectorName, setNewSectorName] = useState('');
  const [newRiskCategoryName, setNewRiskCategoryName] = useState('');
  const [addingJobRole, setAddingJobRole] = useState(false);
  const [addingSector, setAddingSector] = useState(false);
  const [addingRiskCategory, setAddingRiskCategory] = useState(false);
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

  const load = useCallback(async () => {
    if (!ownerId) return;
    setLoading(true);
    setError('');
    try {
      const [rulesData, catalogData, jobRolesData, sectorsData, riskCategoriesData] = await Promise.all([
        trainingRequirementService.listRules(ownerId),
        trainingCatalogService.listActive(ownerId),
        trainingRoleRequirementService.listJobRoles(ownerId),
        trainingSectorService.getSectors(ownerId),
        trainingRiskCategoryService.getRiskCategories(ownerId),
      ]);
      setRules(rulesData);
      setCatalog(catalogData);
      setJobRoles(jobRolesData || []);
      setSectors(sectorsData || []);
      setRiskCategories(riskCategoriesData || []);
    } catch (err) {
      logger.error('[RequirementMatrixScreen] load error', err);
      setError('No se pudo cargar la matriz de requerimientos.');
    } finally {
      setLoading(false);
    }
  }, [ownerId]);

  useEffect(() => {
    load();
  }, [load]);

  const addNewJobRole = async () => {
    const name = (newJobRoleName || '').trim();
    if (!name || !ownerId) return;
    setAddingJobRole(true);
    setError('');
    try {
      const ref = await trainingRoleRequirementService.createJobRole(ownerId, { name });
      await load();
      const item = { id: ref.id, name };
      setSelectedJobRole(item);
      setForm((f) => ({ ...f, jobRoleId: ref.id }));
      setNewJobRoleName('');
    } catch (err) {
      setError(err.message || 'No se pudo crear el puesto.');
    } finally {
      setAddingJobRole(false);
    }
  };

  const addNewSector = async () => {
    const name = (newSectorName || '').trim();
    if (!name || !ownerId) return;
    setAddingSector(true);
    setError('');
    try {
      const created = await trainingSectorService.createSector(ownerId, name);
      await load();
      setSelectedSector(created);
      setForm((f) => ({ ...f, sectorId: created.id }));
      setNewSectorName('');
    } catch (err) {
      setError(err.message || 'No se pudo crear el sector.');
    } finally {
      setAddingSector(false);
    }
  };

  const addNewRiskCategory = async () => {
    const name = (newRiskCategoryName || '').trim();
    if (!name || !ownerId) return;
    setAddingRiskCategory(true);
    setError('');
    try {
      const created = await trainingRiskCategoryService.createRiskCategory(ownerId, name);
      await load();
      setSelectedRiskCategory(created);
      setForm((f) => ({ ...f, riskCategoryId: created.id }));
      setNewRiskCategoryName('');
    } catch (err) {
      setError(err.message || 'No se pudo crear la categoría de riesgo.');
    } finally {
      setAddingRiskCategory(false);
    }
  };

  const createRule = async () => {
    if (!ownerId) return;
    if (!form.companyId || !form.branchId || !form.trainingTypeId) {
      setError('Empresa, sucursal y tipo de capacitación son obligatorios.');
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
              <Autocomplete
                options={jobRoles}
                value={selectedJobRole}
                getOptionLabel={jobRoleLabel}
                isOptionEqualToValue={(opt, val) => opt?.id === val?.id}
                onChange={(_, newValue) => {
                  setSelectedJobRole(newValue || null);
                  setForm((f) => ({ ...f, jobRoleId: newValue?.id ?? '' }));
                }}
                renderInput={(params) => <TextField {...params} label="Puesto" placeholder="Opcional" />}
              />
              <Stack direction="row" spacing={1} alignItems="center">
                <TextField size="small" placeholder="Nuevo puesto" value={newJobRoleName} onChange={(e) => setNewJobRoleName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addNewJobRole())} />
                <Button variant="outlined" size="small" onClick={addNewJobRole} disabled={addingJobRole || !newJobRoleName.trim()}>{addingJobRole ? '...' : '+ Crear puesto'}</Button>
              </Stack>
              <Autocomplete
                options={sectors}
                value={selectedSector}
                getOptionLabel={(opt) => opt?.name ?? ''}
                isOptionEqualToValue={(opt, val) => opt?.id === val?.id}
                onChange={(_, newValue) => {
                  setSelectedSector(newValue || null);
                  setForm((f) => ({ ...f, sectorId: newValue?.id ?? '' }));
                }}
                renderInput={(params) => <TextField {...params} label="Sector" placeholder="Opcional" />}
              />
              <Stack direction="row" spacing={1} alignItems="center">
                <TextField size="small" placeholder="Nuevo sector" value={newSectorName} onChange={(e) => setNewSectorName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addNewSector())} />
                <Button variant="outlined" size="small" onClick={addNewSector} disabled={addingSector || !newSectorName.trim()}>{addingSector ? '...' : '+ Crear sector'}</Button>
              </Stack>
              <Autocomplete
                options={riskCategories}
                value={selectedRiskCategory}
                getOptionLabel={(opt) => opt?.name ?? ''}
                isOptionEqualToValue={(opt, val) => opt?.id === val?.id}
                onChange={(_, newValue) => {
                  setSelectedRiskCategory(newValue || null);
                  setForm((f) => ({ ...f, riskCategoryId: newValue?.id ?? '' }));
                }}
                renderInput={(params) => <TextField {...params} label="Categoría de riesgo" placeholder="Opcional" />}
              />
              <Stack direction="row" spacing={1} alignItems="center">
                <TextField size="small" placeholder="Nueva categoría de riesgo" value={newRiskCategoryName} onChange={(e) => setNewRiskCategoryName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addNewRiskCategory())} />
                <Button variant="outlined" size="small" onClick={addNewRiskCategory} disabled={addingRiskCategory || !newRiskCategoryName.trim()}>{addingRiskCategory ? '...' : '+ Crear categoría'}</Button>
              </Stack>
              <TextField select label="Tipo de capacitación" value={form.trainingTypeId} onChange={(e) => setForm({ ...form, trainingTypeId: e.target.value })}>
                {catalog.map((item) => <MenuItem key={item.id} value={item.id}>{item.name}</MenuItem>)}
              </TextField>
              <TextField type="number" label="Frecuencia (meses)" value={form.frequencyMonths} onChange={(e) => setForm({ ...form, frequencyMonths: Number(e.target.value) })} />
              <TextField select label="Obligatoria" value={form.mandatory ? 'true' : 'false'} onChange={(e) => setForm({ ...form, mandatory: e.target.value === 'true' })}>
                <MenuItem value="true">Sí</MenuItem>
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
                    <Typography variant="body2" color="text.secondary">
                      {userEmpresas.find((e) => e.id === rule.companyId)?.nombre || 'Sin dato'} / {userSucursales.find((s) => s.id === rule.branchId)?.nombre || 'Sin dato'}
                      {' · '}{jobRoleLabel(jobRoles.find((r) => r.id === rule.jobRoleId)) || 'todos los puestos'}
                      {' · '}{sectors.find((s) => s.id === rule.sectorId)?.name || '—'}
                      {' · '}{riskCategories.find((r) => r.id === rule.riskCategoryId)?.name || '—'}
                    </Typography>
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


