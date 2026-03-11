import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Autocomplete,
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
import { getUsers } from '../../../../../core/services/ownerUserService';
import {
  employeeTrainingRecordService,
  trainingAttendanceService,
  trainingCatalogService,
  trainingPlanService,
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

function personDisplayName(person) {
  if (!person) return '';
  if (person.displayName) return person.displayName;
  if (person.nombreCompleto) return person.nombreCompleto;
  if (person.apellido && person.nombre) return `${person.apellido}, ${person.nombre}`;
  return person.nombre || person.email || '';
}

function planStatusLabel(status) {
  const labels = {
    approved: 'Aprobado',
    in_progress: 'En progreso',
    draft: 'Borrador',
    closed: 'Cerrado'
  };
  return labels[status] || status || 'Sin dato';
}

function canDetectPlan(form) {
  return Boolean(form.trainingTypeId && form.companyId && form.branchId && form.scheduledDate);
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
  const [instructorOptions, setInstructorOptions] = useState([]);

  const [planDetectLoading, setPlanDetectLoading] = useState(false);
  const [planDetectError, setPlanDetectError] = useState('');
  const [planCandidates, setPlanCandidates] = useState([]);
  const [planMode, setPlanMode] = useState('ad_hoc');
  const [selectedPlanItemId, setSelectedPlanItemId] = useState('');
  const [lastPlanLookupKey, setLastPlanLookupKey] = useState('');

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

  const companyById = useMemo(
    () => Object.fromEntries(userEmpresas.map((company) => [company.id, company])),
    [userEmpresas]
  );

  const branchById = useMemo(
    () => Object.fromEntries(userSucursales.map((branch) => [branch.id, branch])),
    [userSucursales]
  );

  const selectedInstructorLabel = useMemo(
    () => instructorOptions.find((option) => option.id === form.instructorId)?.label || 'Sin definir',
    [instructorOptions, form.instructorId]
  );

  const selectedPlanCandidate = useMemo(
    () => planCandidates.find((candidate) => candidate.planItemId === selectedPlanItemId) || null,
    [planCandidates, selectedPlanItemId]
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

  useEffect(() => {
    let alive = true;

    const loadInstructors = async () => {
      if (!ownerId) {
        if (alive) setInstructorOptions([]);
        return;
      }

      const [usersList, employeesList] = await Promise.all([
        getUsers(ownerId).catch(() => []),
        form.branchId
          ? empleadoService.getEmpleadosBySucursal(ownerId, form.branchId).catch(() => [])
          : form.companyId
          ? empleadoService.getEmpleadosByEmpresa(ownerId, form.companyId).catch(() => [])
          : Promise.resolve([])
      ]);

      const optionMap = new Map();

      (usersList || []).forEach((user) => {
        const name = personDisplayName(user) || 'Sin dato';
        const suffix = user.email ? ` (${user.email})` : '';
        optionMap.set(user.id, { id: user.id, label: `${name}${suffix}`, source: 'user' });
      });

      (employeesList || []).forEach((employee) => {
        if (optionMap.has(employee.id)) return;
        const name = personDisplayName(employee) || 'Sin dato';
        const suffix = employee.email ? ` (${employee.email})` : '';
        optionMap.set(employee.id, { id: employee.id, label: `${name}${suffix}`, source: 'employee' });
      });

      const options = Array.from(optionMap.values()).sort((a, b) => a.label.localeCompare(b.label, 'es'));

      if (!alive) return;
      setInstructorOptions(options);

      setForm((prev) => {
        if (!prev.instructorId) {
          return { ...prev, instructorId: options[0]?.id || '' };
        }
        return prev;
      });
    };

    loadInstructors();

    return () => {
      alive = false;
    };
  }, [ownerId, form.branchId, form.companyId]);

  useEffect(() => {
    let alive = true;

    const detectPlanCandidates = async () => {
      if (!ownerId || !canDetectPlan(form)) {
        setPlanCandidates([]);
        setSelectedPlanItemId('');
        setPlanMode('ad_hoc');
        setPlanDetectError('');
        setLastPlanLookupKey('');
        return;
      }

      const lookupKey = [
        form.trainingTypeId,
        form.companyId,
        form.branchId,
        form.scheduledDate
      ].join('|');

      if (lookupKey === lastPlanLookupKey) {
        return;
      }

      setPlanDetectLoading(true);
      setPlanDetectError('');

      try {
        const candidates = await trainingPlanService.findCompatiblePlanItems(ownerId, {
          trainingTypeId: form.trainingTypeId,
          companyId: form.companyId,
          branchId: form.branchId,
          scheduledDate: toIso(form.scheduledDate)
        });

        if (!alive) return;

        setPlanCandidates(candidates);
        setLastPlanLookupKey(lookupKey);

        if (candidates.length > 0) {
          setPlanMode('plan');
          setSelectedPlanItemId((current) => {
            if (current && candidates.some((candidate) => candidate.planItemId === current)) {
              return current;
            }
            return candidates[0].planItemId;
          });
        } else {
          setPlanMode('ad_hoc');
          setSelectedPlanItemId('');
        }
      } catch (err) {
        if (!alive) return;
        setPlanCandidates([]);
        setSelectedPlanItemId('');
        setPlanMode('ad_hoc');
        setPlanDetectError(err.message || 'No se pudo detectar una vinculacion con plan anual.');
      } finally {
        if (alive) {
          setPlanDetectLoading(false);
        }
      }
    };

    detectPlanCandidates();

    return () => {
      alive = false;
    };
  }, [ownerId, form, form.trainingTypeId, form.companyId, form.branchId, form.scheduledDate, lastPlanLookupKey]);

  const loadSuggestions = async () => {
    if (!ownerId) return;
    if (!form.trainingTypeId || !form.companyId || !form.branchId || !form.scheduledDate) {
      setError('Completa tipo de capacitacion, empresa, sucursal y fecha primero.');
      return;
    }

    setError('');
    setSaving(true);

    try {
      const employeesList = await empleadoService.getEmpleadosBySucursal(ownerId, form.branchId);
      setEmployees(employeesList);

      const [rules, records] = await Promise.all([
        trainingRequirementService.listRules(ownerId, {
          companyId: form.companyId,
          branchId: form.branchId,
          trainingTypeId: form.trainingTypeId,
          status: 'active'
        }),
        employeeTrainingRecordService.listByEmployees(ownerId, employeesList.map((employee) => employee.id))
      ]);

      const recordsByEmployee = records.reduce((acc, record) => {
        if (!acc[record.employeeId]) {
          acc[record.employeeId] = [];
        }
        acc[record.employeeId].push(record);
        return acc;
      }, {});

      const suggested = new Set();

      employeesList.forEach((employee) => {
        const employeeRecords = recordsByEmployee[employee.id] || [];
        const target = employeeRecords.find((record) => record.trainingTypeId === form.trainingTypeId);
        if (!target || target.complianceStatus === TRAINING_COMPLIANCE_STATUSES.EXPIRED || target.complianceStatus === TRAINING_COMPLIANCE_STATUSES.EXPIRING_SOON || target.complianceStatus === TRAINING_COMPLIANCE_STATUSES.MISSING) {
          suggested.add(employee.id);
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
      setError('Completa los datos de la sesion antes de crearla.');
      return;
    }

    if (planMode === 'plan' && !selectedPlanCandidate) {
      setError('Selecciona un item de plan valido o cambia a sesion ad-hoc.');
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
        status: TRAINING_SESSION_STATUSES.SCHEDULED,
        sessionOrigin: planMode === 'plan' ? 'plan' : 'ad_hoc',
        planId: planMode === 'plan' ? selectedPlanCandidate?.planId || null : null,
        planItemId: planMode === 'plan' ? selectedPlanCandidate?.planItemId || null : null,
        planLinkedBy: planMode === 'plan' ? userProfile?.uid || null : null,
        planLinkedAt: planMode === 'plan' ? new Date().toISOString() : null
      });

      if (selectedIds.length > 0) {
        await trainingAttendanceService.bulkAssignInvited(ownerId, ref.id, selectedIds);
      }

      onCreated(ref.id);
      setStep(1);
      setEmployees([]);
      setSelectedIds([]);
      setSuggestedIds([]);
      setPlanCandidates([]);
      setSelectedPlanItemId('');
      setPlanMode('ad_hoc');
      setLastPlanLookupKey('');
      setForm((prev) => ({
        ...prev,
        location: '',
        scheduledDate: ''
      }));
    } catch (err) {
      setError(err.message || 'No se pudo crear la sesion.');
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

  const planCandidateLabel = (candidate) => {
    const companyName = companyById[form.companyId]?.nombre || 'Empresa';
    const branchName = branchById[form.branchId]?.nombre || 'Sucursal';
    return `${candidate.planYear} · ${companyName} / ${branchName} · Mes ${candidate.plannedMonth} · ${planStatusLabel(candidate.planStatus)}`;
  };

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Crear sesion de capacitacion
      </Typography>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {step === 1 && (
        <Stack spacing={2}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField
                select
                fullWidth
                label="Tipo de capacitacion"
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
              <Autocomplete
                options={instructorOptions}
                value={instructorOptions.find((option) => option.id === form.instructorId) || null}
                onChange={(_, value) => setForm({ ...form, instructorId: value?.id || '' })}
                getOptionLabel={(option) => option?.label || ''}
                renderInput={(params) => (
                  <TextField {...params} fullWidth label="Instructor" placeholder="Seleccionar instructor" />
                )}
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
                <MenuItem value="hybrid">Hibrida</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Ubicacion"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <Paper variant="outlined" sx={{ p: 1.5 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Vinculacion al plan anual
                </Typography>
                {planDetectError && <Alert severity="warning" sx={{ mb: 1.5 }}>{planDetectError}</Alert>}
                {planDetectLoading && <Alert severity="info" sx={{ mb: 1.5 }}>Buscando items compatibles del plan anual...</Alert>}

                {!canDetectPlan(form) && (
                  <Typography variant="body2" color="text.secondary">
                    Completa tipo, empresa, sucursal y fecha para detectar items del plan anual.
                  </Typography>
                )}

                {canDetectPlan(form) && !planDetectLoading && (
                  <Stack spacing={1.5}>
                    {planCandidates.length > 0 ? (
                      <>
                        <Alert severity="info">
                          Se encontraron {planCandidates.length} items de plan compatibles para esta sesion.
                        </Alert>
                        <TextField
                          select
                          fullWidth
                          label="Origen de la sesion"
                          value={planMode}
                          onChange={(e) => setPlanMode(e.target.value)}
                        >
                          <MenuItem value="plan">Vincular al plan anual</MenuItem>
                          <MenuItem value="ad_hoc">Crear como ad-hoc</MenuItem>
                        </TextField>
                        {planMode === 'plan' && (
                          <TextField
                            select
                            fullWidth
                            label="Item de plan sugerido"
                            value={selectedPlanItemId}
                            onChange={(e) => setSelectedPlanItemId(e.target.value)}
                          >
                            {planCandidates.map((candidate) => (
                              <MenuItem key={candidate.planItemId} value={candidate.planItemId}>
                                {planCandidateLabel(candidate)}
                              </MenuItem>
                            ))}
                          </TextField>
                        )}
                      </>
                    ) : (
                      <Alert severity="info">
                        No hay item de plan compatible para esta fecha. La sesion se creara como ad-hoc.
                      </Alert>
                    )}
                  </Stack>
                )}
              </Paper>
            </Grid>
          </Grid>

          <Button variant="contained" onClick={loadSuggestions} disabled={saving}>
            {saving ? 'Cargando sugerencias...' : 'Continuar a participantes'}
          </Button>
        </Stack>
      )}

      {step === 2 && (
        <Stack spacing={2}>
          <Typography variant="subtitle1">Paso 2: participantes</Typography>
          <Typography variant="body2" color="text.secondary">
            Los sugeridos incluyen empleados con capacitacion vencida, por vencer o faltante y coincidencias de la matriz de requerimientos.
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

          <Typography variant="body2">
            Participantes seleccionados: <strong>{selectedIds.length}</strong>
          </Typography>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <Button variant="outlined" onClick={() => setStep(1)}>
              Volver
            </Button>
            <Button
              variant="contained"
              onClick={() => setStep(3)}
              disabled={saving || selectedIds.length === 0}
            >
              Continuar a confirmacion
            </Button>
          </Stack>
        </Stack>
      )}

      {step === 3 && (
        <Stack spacing={2}>
          <Typography variant="subtitle1">Paso 3: confirmacion</Typography>
          <Typography variant="body2" color="text.secondary">
            Revisa los datos de la sesion antes de crearla.
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Typography variant="body2" color="text.secondary">
                Capacitacion
              </Typography>
              <Typography>
                {catalogItems.find((item) => item.id === form.trainingTypeId)?.name ||
                  'Sin seleccionar'}
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="body2" color="text.secondary">
                Empresa
              </Typography>
              <Typography>
                {userEmpresas.find((c) => c.id === form.companyId)?.nombre || 'Sin seleccionar'}
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="body2" color="text.secondary">
                Sucursal
              </Typography>
              <Typography>
                {userSucursales.find((b) => b.id === form.branchId)?.nombre || 'Sin seleccionar'}
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="body2" color="text.secondary">
                Fecha
              </Typography>
              <Typography>{form.scheduledDate || 'Sin definir'}</Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="body2" color="text.secondary">
                Instructor
              </Typography>
              <Typography>{selectedInstructorLabel}</Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="body2" color="text.secondary">
                Modalidad
              </Typography>
              <Typography>
                {form.modality === 'in_person'
                  ? 'Presencial'
                  : form.modality === 'virtual'
                  ? 'Virtual'
                  : form.modality === 'hybrid'
                  ? 'Hibrida'
                  : form.modality || '-'}
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="body2" color="text.secondary">
                Origen
              </Typography>
              <Typography>{planMode === 'plan' ? 'Plan anual' : 'Ad-hoc'}</Typography>
            </Grid>
            <Grid item xs={12} md={8}>
              <Typography variant="body2" color="text.secondary">
                Vinculacion de plan
              </Typography>
              <Typography>
                {planMode === 'plan' && selectedPlanCandidate
                  ? planCandidateLabel(selectedPlanCandidate)
                  : 'Sin vinculacion'}
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary">
                Ubicacion
              </Typography>
              <Typography>{form.location || '-'}</Typography>
            </Grid>
          </Grid>

          <Typography variant="body2">
            Participantes a invitar: <strong>{selectedIds.length}</strong>
          </Typography>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <Button variant="outlined" onClick={() => setStep(2)}>
              Volver a participantes
            </Button>
            <Button variant="contained" onClick={createSession} disabled={saving}>
              {saving ? 'Creando...' : 'Crear sesion'}
            </Button>
          </Stack>
        </Stack>
      )}
    </Paper>
  );
}

