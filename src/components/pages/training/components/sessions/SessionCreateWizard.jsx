import React, { useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Checkbox,
  FormControlLabel,
  Grid,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import { useAuth } from '@/components/context/AuthContext';
import { empleadoService } from '../../../../../services/empleadoService';
import {
  employeeTrainingRecordService,
  trainingAttendanceService,
  trainingCatalogService,
  trainingRequirementService,
  trainingSessionService
} from '../../../../../services/training';
import {
  TRAINING_COMPLIANCE_STATUSES,
  TRAINING_SESSION_STATUSES
} from '../../../../../types/trainingDomain';

function toIso(value) {
  return new Date(value).toISOString();
}

export default function SessionCreateWizard({ ownerId, onCreated }) {
  const { userProfile, userEmpresas = [], userSucursales = [] } = useAuth();

  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [catalogItems, setCatalogItems] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [suggestedIds, setSuggestedIds] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [filters, setFilters] = useState({ role: '', sector: '' });

  const [form, setForm] = useState({
    trainingTypeId: '',
    companyId: '',
    branchId: '',
    instructorId: userProfile?.uid || '',
    modality: 'in_person',
    location: '',
    scheduledDate: ''
  });

  const branchOptions = useMemo(
    () => userSucursales.filter((branch) => !form.companyId || branch.empresaId === form.companyId),
    [userSucursales, form.companyId]
  );

  const filteredEmployees = useMemo(() => {
    return employees.filter((employee) => {
      const roleCandidate = employee.jobRoleId || employee.puestoId || employee.rolId || employee.puesto || employee.rol || '';
      const sectorCandidate = employee.sectorId || employee.sector || '';
      const roleOk = !filters.role || roleCandidate === filters.role;
      const sectorOk = !filters.sector || sectorCandidate === filters.sector;
      return roleOk && sectorOk;
    });
  }, [employees, filters]);

  const roleOptions = useMemo(() => Array.from(new Set(employees
    .map((employee) => employee.jobRoleId || employee.puestoId || employee.rolId || employee.puesto || employee.rol)
    .filter(Boolean))), [employees]);

  const sectorOptions = useMemo(() => Array.from(new Set(employees
    .map((employee) => employee.sectorId || employee.sector)
    .filter(Boolean))), [employees]);

  const ensureCatalog = async () => {
    if (catalogItems.length > 0) return;
    const list = await trainingCatalogService.listActive(ownerId);
    setCatalogItems(list);
  };

  const loadSuggestions = async () => {
    if (!ownerId) return;
    if (!form.trainingTypeId || !form.companyId || !form.branchId) {
      setError('Completá tipo de capacitación, empresa y sucursal primero.');
      return;
    }

    setError('');
    setSaving(true);

    try {
      const employeesList = await empleadoService.getEmpleadosBySucursal(ownerId, form.branchId);
      setEmployees(employeesList);

      const [rules, recordsByEmployee] = await Promise.all([
        trainingRequirementService.listRules(ownerId, {
          companyId: form.companyId,
          branchId: form.branchId,
          trainingTypeId: form.trainingTypeId,
          status: 'active'
        }),
        Promise.all(employeesList.map(async (employee) => ({
          employeeId: employee.id,
          records: await employeeTrainingRecordService.listByEmployee(ownerId, employee.id)
        })))
      ]);

      const suggested = new Set();

      recordsByEmployee.forEach(({ employeeId, records }) => {
        const target = records.find((record) => record.trainingTypeId === form.trainingTypeId);
        if (!target || target.complianceStatus === TRAINING_COMPLIANCE_STATUSES.EXPIRED || target.complianceStatus === TRAINING_COMPLIANCE_STATUSES.EXPIRING_SOON || target.complianceStatus === TRAINING_COMPLIANCE_STATUSES.MISSING) {
          suggested.add(employeeId);
        }
      });

      employeesList.forEach((employee) => {
        const roleCandidate = employee.jobRoleId || employee.puestoId || employee.rolId || employee.puesto || employee.rol || null;
        const sectorCandidate = employee.sectorId || employee.sector || null;

        const matrixMatch = rules.some((rule) => {
          const roleMatches = !rule.jobRoleId || !roleCandidate || rule.jobRoleId === roleCandidate;
          const sectorMatches = !rule.sectorId || !sectorCandidate || rule.sectorId === sectorCandidate;
          return roleMatches && sectorMatches;
        });

        if (matrixMatch) {
          suggested.add(employee.id);
        }
      });

      const suggestedArr = Array.from(suggested);
      setSuggestedIds(suggestedArr);
      setSelectedIds(suggestedArr);
      setStep(2);
    } catch (err) {
      console.error('[SessionCreateWizard] suggestion error', err);
      setError(err.message || 'No se pudieron cargar sugerencias de participantes.');
    } finally {
      setSaving(false);
    }
  };

  const createSession = async () => {
    if (!ownerId) return;
    if (!form.trainingTypeId || !form.companyId || !form.branchId || !form.scheduledDate) {
      setError('Completá los datos de la sesión antes de crearla.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const ref = await trainingSessionService.createSession(ownerId, {
        trainingTypeId: form.trainingTypeId,
        companyId: form.companyId,
        branchId: form.branchId,
        instructorId: form.instructorId,
        location: form.location,
        modality: form.modality,
        scheduledDate: toIso(form.scheduledDate),
        status: TRAINING_SESSION_STATUSES.SCHEDULED
      });

      if (selectedIds.length > 0) {
        await trainingAttendanceService.bulkAssignInvited(ownerId, ref.id, selectedIds);
      }

      onCreated(ref.id);
      setStep(1);
      setEmployees([]);
      setSelectedIds([]);
      setSuggestedIds([]);
      setForm((prev) => ({ ...prev, location: '', scheduledDate: '' }));
    } catch (err) {
      setError(err.message || 'No se pudo crear la sesión.');
    } finally {
      setSaving(false);
    }
  };

  const toggleEmployee = (employeeId) => {
    setSelectedIds((current) => current.includes(employeeId)
      ? current.filter((id) => id !== employeeId)
      : [...current, employeeId]);
  };

  const selectFiltered = () => {
    const next = Array.from(new Set([...selectedIds, ...filteredEmployees.map((employee) => employee.id)]));
    setSelectedIds(next);
  };

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>Crear sesión</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {step === 1 && (
        <Stack spacing={2}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField
                select
                fullWidth
                label="Tipo de capacitación"
                value={form.trainingTypeId}
                onFocus={ensureCatalog}
                onChange={(e) => setForm({ ...form, trainingTypeId: e.target.value })}
              >
                {catalogItems.map((item) => (
                  <MenuItem key={item.id} value={item.id}>{item.name}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                select
                fullWidth
                label="Empresa"
                value={form.companyId}
                onChange={(e) => setForm({ ...form, companyId: e.target.value, branchId: '' })}
              >
                {userEmpresas.map((company) => (
                  <MenuItem key={company.id} value={company.id}>{company.nombre}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                select
                fullWidth
                label="Sucursal"
                value={form.branchId}
                onChange={(e) => setForm({ ...form, branchId: e.target.value })}
              >
                {branchOptions.map((branch) => (
                  <MenuItem key={branch.id} value={branch.id}>{branch.nombre}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Instructor"
                value={form.instructorId}
                onChange={(e) => setForm({ ...form, instructorId: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="datetime-local"
                label="Fecha"
                InputLabelProps={{ shrink: true }}
                value={form.scheduledDate}
                onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                select
                fullWidth
                label="Modalidad"
                value={form.modality}
                onChange={(e) => setForm({ ...form, modality: e.target.value })}
              >
                <MenuItem value="in_person">Presencial</MenuItem>
                <MenuItem value="virtual">Virtual</MenuItem>
                <MenuItem value="hybrid">Híbrida</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Ubicación"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              />
            </Grid>
          </Grid>

          <Button variant="contained" onClick={loadSuggestions} disabled={saving}>
            {saving ? 'Cargando sugerencias...' : 'Continuar a participantes'}
          </Button>
        </Stack>
      )}

      {step === 2 && (
        <Stack spacing={2}>
          <Typography variant="subtitle1">Paso 2: asignar participantes</Typography>
          <Typography variant="body2" color="text.secondary">
            Los sugeridos incluyen empleados con capacitación vencida, por vencer o faltante y coincidencias de la matriz de requerimientos.
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField
                select
                fullWidth
                label="Filtro por puesto"
                value={filters.role}
                onChange={(e) => setFilters((prev) => ({ ...prev, role: e.target.value }))}
              >
                <MenuItem value="">Todos los puestos</MenuItem>
                {roleOptions.map((role) => <MenuItem key={role} value={role}>{role}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                select
                fullWidth
                label="Filtro por sector"
                value={filters.sector}
                onChange={(e) => setFilters((prev) => ({ ...prev, sector: e.target.value }))}
              >
                <MenuItem value="">Todos los sectores</MenuItem>
                {sectorOptions.map((sector) => <MenuItem key={sector} value={sector}>{sector}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} md={4} sx={{ display: 'flex', alignItems: 'center' }}>
              <Button variant="outlined" onClick={selectFiltered}>Seleccionar filtrados</Button>
            </Grid>
          </Grid>

          <Paper variant="outlined" sx={{ p: 1.5, maxHeight: 320, overflow: 'auto' }}>
            {filteredEmployees.map((employee) => (
              <FormControlLabel
                key={employee.id}
                control={<Checkbox checked={selectedIds.includes(employee.id)} onChange={() => toggleEmployee(employee.id)} />}
                label={`${employee.nombre || employee.id}${suggestedIds.includes(employee.id) ? ' (sugerido)' : ''}`}
              />
            ))}
            {filteredEmployees.length === 0 && <Typography color="text.secondary">No hay empleados para los filtros seleccionados.</Typography>}
          </Paper>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <Button variant="outlined" onClick={() => setStep(1)}>Volver</Button>
            <Button variant="contained" onClick={createSession} disabled={saving}>{saving ? 'Creando...' : 'Crear sesión'}</Button>
          </Stack>
        </Stack>
      )}
    </Paper>
  );
}

