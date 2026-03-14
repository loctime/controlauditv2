import React, { useEffect, useMemo, useState } from 'react';
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
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Box
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SaveIcon from '@mui/icons-material/Save';
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
  TRAINING_SESSION_STATUSES,
  TRAINING_ATTENDANCE_STATUSES,
  TRAINING_EVALUATION_STATUSES
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

const defaultForm = (userProfile) => ({
  trainingTypeId: '',
  companyId: '',
  branchId: '',
  instructorId: userProfile?.uid || '',
  modality: 'in_person',
  location: '',
  scheduledDate: ''
});

const defaultParticipantRecord = () => ({
  attendanceStatus: TRAINING_ATTENDANCE_STATUSES.PRESENT,
  evaluationStatus: TRAINING_EVALUATION_STATUSES.PENDING,
  score: null,
  employeeSignature: null,
  instructorSignature: null,
  notes: ''
});

export default function CreateTrainingSession({
  ownerId,
  onSaved,
  onCancel,
  mode = 'quick', // 'quick' | 'planned'
  initialData = null // Datos precargados desde planes
}) {
  const { userProfile, userEmpresas = [], userSucursales = [] } = useAuth();

  const [form, setForm] = useState(() => defaultForm(userProfile));
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');

  // Catálogos y opciones
  const [catalogItems, setCatalogItems] = useState([]);
  const [instructorOptions, setInstructorOptions] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [suggestedIds, setSuggestedIds] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [filters, setFilters] = useState({ role: '', sector: '' });

  // Datos de ejecución por participante
  const [participantRecords, setParticipantRecords] = useState({});
  const [requiresEvaluation, setRequiresEvaluation] = useState(false);
  const [requiresSignature, setRequiresSignature] = useState(false);

  // Planificación (solo modo planned)
  const [planCandidates, setPlanCandidates] = useState([]);
  const [selectedPlanItemId, setSelectedPlanItemId] = useState('');
  const [planMode, setPlanMode] = useState('ad_hoc');

  // Inicializar con datos precargados si existen
  useEffect(() => {
    if (initialData) {
      setForm(prev => ({
        ...prev,
        trainingTypeId: initialData.trainingTypeId || prev.trainingTypeId,
        companyId: initialData.companyId || prev.companyId,
        branchId: initialData.branchId || prev.branchId,
        scheduledDate: initialData.scheduledDate || prev.scheduledDate
      }));
      
      if (initialData.planMode === 'plan') {
        setPlanMode('plan');
        setSelectedPlanItemId(initialData.planItemId || '');
      }
    }
  }, [initialData]);

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

  // Cargar catálogos
  const ensureCatalog = async () => {
    if (catalogItems.length > 0) return;
    const list = await trainingCatalogService.listActive(ownerId);
    setCatalogItems(list);
  };

  // Cargar instructores
  useEffect(() => {
    let alive = true;

    const loadInstructors = async () => {
      if (!ownerId) {
        if (alive) setInstructorOptions([]);
        return;
      }

      const usersList = await getUsers(ownerId).catch(() => []);
      const optionMap = new Map();

      if (userProfile?.uid) {
        const meLabel = personDisplayName(userProfile) || userProfile.email || 'Yo';
        const suffix = userProfile.email ? ` (${userProfile.email})` : '';
        optionMap.set(userProfile.uid, { id: userProfile.uid, label: `${meLabel}${suffix}`, source: 'current' });
      }

      (usersList || []).forEach((user) => {
        if (optionMap.has(user.id)) return;
        const name = personDisplayName(user) || 'Sin dato';
        const suffix = user.email ? ` (${user.email})` : '';
        optionMap.set(user.id, { id: user.id, label: `${name}${suffix}`, source: 'user' });
      });

      const options = Array.from(optionMap.values()).sort((a, b) => a.label.localeCompare(b.label, 'es'));

      if (!alive) return;
      setInstructorOptions(options);

      setForm((prev) => {
        if (!prev.instructorId) {
          return { ...prev, instructorId: options[0]?.id || userProfile?.uid || '' };
        }
        return prev;
      });
    };

    loadInstructors();
    return () => { alive = false; };
  }, [ownerId, userProfile?.uid, userProfile?.displayName, userProfile?.email]);

  // Detectar planes anuales (solo modo planned)
  useEffect(() => {
    if (mode !== 'planned') return;

    const detectPlanCandidates = async () => {
      if (!ownerId || !form.trainingTypeId || !form.companyId || !form.branchId || !form.scheduledDate) {
        setPlanCandidates([]);
        setSelectedPlanItemId('');
        setPlanMode('ad_hoc');
        return;
      }

      try {
        const candidates = await trainingPlanService.findCompatiblePlanItems(ownerId, {
          trainingTypeId: form.trainingTypeId,
          companyId: form.companyId,
          branchId: form.branchId,
          scheduledDate: toIso(form.scheduledDate)
        });

        setPlanCandidates(candidates);

        if (candidates.length > 0) {
          setPlanMode('plan');
          setSelectedPlanItemId(candidates[0].planItemId);
        } else {
          setPlanMode('ad_hoc');
          setSelectedPlanItemId('');
        }
      } catch (err) {
        console.warn('Error detecting plan candidates:', err);
        setPlanCandidates([]);
        setPlanMode('ad_hoc');
      }
    };

    detectPlanCandidates();
  }, [ownerId, mode, form.trainingTypeId, form.companyId, form.branchId, form.scheduledDate]);

  // Cargar empleados cuando se selecciona sucursal o hay datos iniciales
  useEffect(() => {
    if (!ownerId || !form.branchId) {
      setEmployees([]);
      return;
    }

    const loadEmployees = async () => {
      try {
        const employeesList = await empleadoService.getEmpleadosBySucursal(ownerId, form.branchId);
        setEmployees(employeesList);
        await loadSuggestions(employeesList);
        
        // Si hay datos iniciales, expandir secciones automáticamente
        if (initialData) {
          // Auto-expandir sección de participantes y ejecución
          setTimeout(() => {
            const accordions = document.querySelectorAll('[role="button"][aria-expanded="false"]');
            accordions.forEach((accordion, index) => {
              if (index > 0) { // Skip first accordion (datos básicos)
                accordion.click();
              }
            });
          }, 100);
        }
      } catch (err) {
        setError(err.message || 'No se pudieron cargar los empleados');
      }
    };

    loadEmployees();
  }, [ownerId, form.branchId, initialData]);

  // Cargar sugerencias de participantes
  const loadSuggestions = async (employeesList = null) => {
    if (!ownerId || !form.trainingTypeId || !form.companyId || !form.branchId || !form.scheduledDate) {
      return;
    }

    const list = employeesList || employees;
    if (list.length === 0) return;

    try {
      const [rules, records] = await Promise.all([
        trainingRequirementService.listRules(ownerId, {
          companyId: form.companyId,
          branchId: form.branchId,
          trainingTypeId: form.trainingTypeId,
          status: 'active'
        }),
        employeeTrainingRecordService.listByEmployees(ownerId, list.map((employee) => employee.id))
      ]);

      const recordsByEmployee = records.reduce((acc, record) => {
        if (!acc[record.employeeId]) {
          acc[record.employeeId] = [];
        }
        acc[record.employeeId].push(record);
        return acc;
      }, {});

      const suggested = new Set();

      list.forEach((employee) => {
        const employeeRecords = recordsByEmployee[employee.id] || [];
        const target = employeeRecords.find((record) => record.trainingTypeId === form.trainingTypeId);
        if (!target || 
            target.complianceStatus === TRAINING_COMPLIANCE_STATUSES.EXPIRED || 
            target.complianceStatus === TRAINING_COMPLIANCE_STATUSES.EXPIRING_SOON || 
            target.complianceStatus === TRAINING_COMPLIANCE_STATUSES.MISSING) {
          suggested.add(employee.id);
        }
      });

      list.forEach((employee) => {
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
    } catch (err) {
      console.warn('Error loading suggestions:', err);
    }
  };

  // Actualizar requisitos cuando cambia el tipo de capacitación
  useEffect(() => {
    if (!form.trainingTypeId || !ownerId) return;

    const updateRequirements = async () => {
      try {
        const catalog = await trainingCatalogService.getById(ownerId, form.trainingTypeId);
        setRequiresEvaluation(Boolean(catalog?.requiresEvaluation));
        setRequiresSignature(Boolean(catalog?.requiresSignature));
      } catch (err) {
        console.warn('Error loading catalog requirements:', err);
      }
    };

    updateRequirements();
  }, [ownerId, form.trainingTypeId]);

  // Gestionar selección de participantes
  const toggleEmployee = (employeeId) => {
    setSelectedIds((current) => {
      const isSelected = current.includes(employeeId);
      const next = isSelected 
        ? current.filter((id) => id !== employeeId)
        : [...current, employeeId];

      // Inicializar registro de participante si es nuevo
      if (!isSelected) {
        setParticipantRecords((prev) => ({
          ...prev,
          [employeeId]: defaultParticipantRecord()
        }));
      } else {
        setParticipantRecords((prev) => {
          const newRecords = { ...prev };
          delete newRecords[employeeId];
          return newRecords;
        });
      }

      return next;
    });
  };

  const selectFiltered = () => {
    const next = Array.from(new Set([...selectedIds, ...filteredEmployees.map((employee) => employee.id)]));
    setSelectedIds(next);
    
    // Inicializar registros para nuevos participantes
    filteredEmployees.forEach((employee) => {
      if (!selectedIds.includes(employee.id)) {
        setParticipantRecords((prev) => ({
          ...prev,
          [employee.id]: defaultParticipantRecord()
        }));
      }
    });
  };

  const updateParticipantRecord = (employeeId, field, value) => {
    setParticipantRecords((prev) => ({
      ...prev,
      [employeeId]: {
        ...prev[employeeId],
        [field]: value
      }
    }));
  };

  // Validar y guardar todo
  const saveTrainingSession = async () => {
    if (!ownerId) return;

    // Validaciones básicas
    if (!form.trainingTypeId || !form.companyId || !form.branchId || !form.scheduledDate) {
      setError('Completa los datos básicos de la capacitación');
      return;
    }

    if (selectedIds.length === 0) {
      setError('Selecciona al menos un participante');
      return;
    }

    // Validar firmas si se requieren
    if (requiresSignature) {
      const missingSignatures = selectedIds.some((employeeId) => {
        const record = participantRecords[employeeId];
        return !record?.employeeSignature || !record?.instructorSignature;
      });

      if (missingSignatures) {
        setError('Todas las firmas son requeridas para esta capacitación');
        return;
      }
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      // 1. Crear sesión
      const sessionRef = await trainingSessionService.createSession(ownerId, {
        trainingTypeId: form.trainingTypeId,
        companyId: form.companyId,
        branchId: form.branchId,
        instructorId: form.instructorId,
        location: form.location,
        modality: form.modality,
        scheduledDate: toIso(form.scheduledDate),
        status: mode === 'quick' ? TRAINING_SESSION_STATUSES.CLOSED : TRAINING_SESSION_STATUSES.SCHEDULED,
        sessionOrigin: planMode === 'plan' ? 'plan' : 'ad_hoc',
        planId: planMode === 'plan' ? (initialData?.planId || planCandidates.find(c => c.planItemId === selectedPlanItemId)?.planId || null) : null,
        planItemId: planMode === 'plan' ? (initialData?.planItemId || selectedPlanItemId) : null,
        executedDate: mode === 'quick' ? new Date().toISOString() : null
      }, {
        currentUserId: userProfile?.uid || null
      });

      // 2. Crear registros de asistencia para todos los participantes
      const attendancePromises = selectedIds.map((employeeId) => {
        const record = participantRecords[employeeId] || defaultParticipantRecord();
        
        return trainingAttendanceService.upsertAttendance(ownerId, sessionRef.id, employeeId, {
          trainingTypeId: form.trainingTypeId,
          companyId: form.companyId,
          branchId: form.branchId,
          attendanceStatus: record.attendanceStatus,
          evaluationStatus: requiresEvaluation ? record.evaluationStatus : TRAINING_EVALUATION_STATUSES.NOT_APPLICABLE,
          score: record.score,
          employeeSignature: record.employeeSignature,
          instructorSignature: record.instructorSignature,
          notes: record.notes
        });
      });

      await Promise.all(attendancePromises);

      // 3. Si es modo rápido, cerrar sesión directamente
      if (mode === 'quick') {
        await trainingSessionService.transitionStatus(ownerId, sessionRef.id, TRAINING_SESSION_STATUSES.CLOSED);
      }

      setSuccess(`Capacitación ${mode === 'quick' ? 'registrada' : 'programada'} exitosamente`);
      
      // Resetear formulario
      setTimeout(() => {
        setForm(defaultForm(userProfile));
        setSelectedIds([]);
        setParticipantRecords({});
        setEmployees([]);
        setSuccess('');
        if (onSaved) onSaved(sessionRef.id);
      }, 2000);

    } catch (err) {
      setError(err.message || 'No se pudo guardar la capacitación');
    } finally {
      setSaving(false);
    }
  };

  const selectedPlanCandidate = useMemo(
    () => planCandidates.find((candidate) => candidate.planItemId === selectedPlanItemId) || null,
    [planCandidates, selectedPlanItemId]
  );

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 3 }}>
        {initialData ? 'Registrar Capacitación desde Plan' : (mode === 'quick' ? 'Registrar Capacitación Rápida' : 'Programar Capacitación')}
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <Stack spacing={3}>
        {/* Sección 1: Datos de la Capacitación */}
        <Accordion defaultExpanded={!initialData}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">1. Datos de la Capacitación</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <TextField
                  select
                  fullWidth
                  label="Tipo de Capacitación"
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
                  label="Fecha y Hora"
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

              {/* Vinculación con plan anual (solo modo planned) */}
              {mode === 'planned' && planCandidates.length > 0 && (
                <Grid item xs={12}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      Vinculación con Plan Anual
                    </Typography>
                    <TextField
                      select
                      fullWidth
                      label="Origen de la Sesión"
                      value={planMode}
                      onChange={(e) => setPlanMode(e.target.value)}
                      sx={{ mb: 2 }}
                    >
                      <MenuItem value="plan">Vincular al Plan Anual</MenuItem>
                      <MenuItem value="ad_hoc">Crear como Ad-hoc</MenuItem>
                    </TextField>
                    {planMode === 'plan' && (
                      <TextField
                        select
                        fullWidth
                        label="Item de Plan"
                        value={selectedPlanItemId}
                        onChange={(e) => setSelectedPlanItemId(e.target.value)}
                      >
                        {planCandidates.map((candidate) => (
                          <MenuItem key={candidate.planItemId} value={candidate.planItemId}>
                            {candidate.planYear} | {companyById[form.companyId]?.nombre} / {branchById[form.branchId]?.nombre} | Mes {candidate.plannedMonth}
                          </MenuItem>
                        ))}
                      </TextField>
                    )}
                  </Paper>
                </Grid>
              )}
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* Sección 2: Participantes */}
        <Accordion defaultExpanded={!!initialData}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">2. Participantes ({selectedIds.length})</Typography>
          </AccordionSummary>
          <AccordionDetails>
            {employees.length === 0 ? (
              <Alert severity="info">
                Selecciona una sucursal para cargar los participantes disponibles
              </Alert>
            ) : (
              <>
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={12} md={4}>
                    <TextField
                      select
                      fullWidth
                      label="Filtro por Puesto"
                      value={filters.role}
                      onChange={(e) => setFilters((prev) => ({ ...prev, role: e.target.value }))}
                    >
                      <MenuItem value="">Todos los puestos</MenuItem>
                      {roleOptions.map((role) => (
                        <MenuItem key={role} value={role}>{role}</MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      select
                      fullWidth
                      label="Filtro por Sector"
                      value={filters.sector}
                      onChange={(e) => setFilters((prev) => ({ ...prev, sector: e.target.value }))}
                    >
                      <MenuItem value="">Todos los sectores</MenuItem>
                      {sectorOptions.map((sector) => (
                        <MenuItem key={sector} value={sector}>{sector}</MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid item xs={12} md={4} sx={{ display: 'flex', alignItems: 'center' }}>
                    <Button variant="outlined" onClick={selectFiltered}>
                      Seleccionar Filtrados
                    </Button>
                  </Grid>
                </Grid>

                <Paper variant="outlined" sx={{ p: 2, maxHeight: 300, overflow: 'auto' }}>
                  {filteredEmployees.map((employee) => (
                    <FormControlLabel
                      key={employee.id}
                      control={
                        <Checkbox 
                          checked={selectedIds.includes(employee.id)} 
                          onChange={() => toggleEmployee(employee.id)} 
                        />
                      }
                      label={
                        <Box>
                          <Typography variant="body2">
                            {employee.nombre || employee.nombreCompleto || employee.id}
                          </Typography>
                          {suggestedIds.includes(employee.id) && (
                            <Typography variant="caption" color="primary">
                              (Sugerido - capacitación requerida)
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                  ))}
                  {filteredEmployees.length === 0 && (
                    <Typography color="text.secondary">
                      No hay empleados para los filtros seleccionados
                    </Typography>
                  )}
                </Paper>
              </>
            )}
          </AccordionDetails>
        </Accordion>

        {/* Sección 3: Ejecución (solo si hay participantes) */}
        {selectedIds.length > 0 && (
          <Accordion defaultExpanded={!!initialData}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">3. Ejecución por Participante</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Stack spacing={2}>
                <Alert severity="info">
                  {requiresEvaluation && 'Esta capacitación requiere evaluación. '}
                  {requiresSignature && 'Esta capacitación requiere firmas. '}
                  Completa los datos para cada participante.
                </Alert>

                {selectedIds.map((employeeId) => {
                  const employee = employees.find((e) => e.id === employeeId);
                  const record = participantRecords[employeeId] || defaultParticipantRecord();

                  return (
                    <Paper key={employeeId} variant="outlined" sx={{ p: 2 }}>
                      <Typography variant="subtitle1" sx={{ mb: 2 }}>
                        {employee?.nombre || employee?.nombreCompleto || employeeId}
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={3}>
                          <TextField
                            select
                            fullWidth
                            size="small"
                            label="Asistencia"
                            value={record.attendanceStatus}
                            onChange={(e) => updateParticipantRecord(employeeId, 'attendanceStatus', e.target.value)}
                          >
                            <MenuItem value={TRAINING_ATTENDANCE_STATUSES.PRESENT}>Presente</MenuItem>
                            <MenuItem value={TRAINING_ATTENDANCE_STATUSES.JUSTIFIED_ABSENCE}>Ausencia Justificada</MenuItem>
                            <MenuItem value={TRAINING_ATTENDANCE_STATUSES.UNJUSTIFIED_ABSENCE}>Ausencia Injustificada</MenuItem>
                            <MenuItem value={TRAINING_ATTENDANCE_STATUSES.RESCHEDULED}>Reprogramado</MenuItem>
                          </TextField>
                        </Grid>

                        {requiresEvaluation && (
                          <Grid item xs={12} md={3}>
                            <TextField
                              select
                              fullWidth
                              size="small"
                              label="Evaluación"
                              value={record.evaluationStatus}
                              onChange={(e) => updateParticipantRecord(employeeId, 'evaluationStatus', e.target.value)}
                            >
                              <MenuItem value={TRAINING_EVALUATION_STATUSES.APPROVED}>Aprobado</MenuItem>
                              <MenuItem value={TRAINING_EVALUATION_STATUSES.FAILED}>Desaprobado</MenuItem>
                              <MenuItem value={TRAINING_EVALUATION_STATUSES.PENDING}>Pendiente</MenuItem>
                            </TextField>
                          </Grid>
                        )}

                        {requiresEvaluation && (
                          <Grid item xs={12} md={2}>
                            <TextField
                              fullWidth
                              size="small"
                              type="number"
                              label="Calificación"
                              value={record.score || ''}
                              onChange={(e) => updateParticipantRecord(employeeId, 'score', parseInt(e.target.value) || null)}
                              inputProps={{ min: 0, max: 100 }}
                            />
                          </Grid>
                        )}

                        {requiresSignature && (
                          <>
                            <Grid item xs={12} md={2}>
                              <TextField
                                fullWidth
                                size="small"
                                label="Firma Empleado"
                                value={record.employeeSignature?.fileReference || ''}
                                onChange={(e) => updateParticipantRecord(employeeId, 'employeeSignature', {
                                  signedAt: new Date().toISOString(),
                                  fileReference: e.target.value
                                })}
                                placeholder="Referencia de archivo"
                              />
                            </Grid>
                            <Grid item xs={12} md={2}>
                              <TextField
                                fullWidth
                                size="small"
                                label="Firma Instructor"
                                value={record.instructorSignature?.fileReference || ''}
                                onChange={(e) => updateParticipantRecord(employeeId, 'instructorSignature', {
                                  signedAt: new Date().toISOString(),
                                  fileReference: e.target.value
                                })}
                                placeholder="Referencia de archivo"
                              />
                            </Grid>
                          </>
                        )}

                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Notas"
                            value={record.notes || ''}
                            onChange={(e) => updateParticipantRecord(employeeId, 'notes', e.target.value)}
                            multiline
                            rows={1}
                          />
                        </Grid>
                      </Grid>
                    </Paper>
                  );
                })}
              </Stack>
            </AccordionDetails>
          </Accordion>
        )}

        <Divider />

        {/* Botones de acción */}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="flex-end">
          {onCancel && (
            <Button variant="outlined" onClick={onCancel} disabled={saving}>
              Cancelar
            </Button>
          )}
          <Button
            variant="contained"
            onClick={saveTrainingSession}
            disabled={saving || selectedIds.length === 0}
            startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
          >
            {saving ? 'Guardando...' : mode === 'quick' ? 'Registrar Capacitación' : 'Programar Capacitación'}
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
}
