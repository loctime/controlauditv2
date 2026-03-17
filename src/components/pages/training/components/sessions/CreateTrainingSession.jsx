import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Autocomplete,
  Button,
  Checkbox,
  Grid,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Box,
  CircularProgress,
  Divider,
  IconButton,
  Rating,
  Tooltip
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import UploadIcon from '@mui/icons-material/Upload';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import { useAuth } from '@/components/context/AuthContext';
import { getUsers } from '../../../../../core/services/ownerUserService';
import {
  trainingAttendanceService,
  trainingCatalogService,
  trainingEvidenceService,
  trainingExecutionService,
  trainingPlanService,
  trainingSessionService
} from '../../../../../services/training';
import { uploadFileWithContext } from '../../../../../services/unifiedFileUploadService';
import { alpha } from '@mui/material/styles';
import {
  TRAINING_SESSION_STATUSES,
  TRAINING_ATTENDANCE_STATUSES,
  TRAINING_EVALUATION_STATUSES
} from '../../../../../types/trainingDomain';

function toIso(value) {
  return new Date(value).toISOString();
}

/** Normaliza planId/planItemId a string (Firestore puede devolver DocumentReference). Evita error .path en getDocument. */
function toPlanIdString(value) {
  if (value == null) return null;
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  if (typeof value === 'object' && value?.id != null) return String(value.id);
  return null;
}

function personDisplayName(person) {
  if (!person) return '';
  if (person.displayName) return person.displayName;
  if (person.nombreCompleto) return person.nombreCompleto;
  if (person.apellido && person.nombre) return `${person.apellido}, ${person.nombre}`;
  return person.nombre || person.email || '';
}

function formatPeriodLabel(periodYear, periodMonth) {
  const date = new Date(periodYear, Math.max(Number(periodMonth || 1) - 1, 0), 1);
  return new Intl.DateTimeFormat('es-AR', {
    month: 'long',
    year: 'numeric'
  }).format(date);
}

/** Hora local en formato YYYY-MM-DDTHH:mm para input datetime-local (no UTC). */
function getLocalDateTime() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now - offset).toISOString().slice(0, 16);
}

const defaultForm = (userProfile) => ({
  trainingTypeId: '',
  companyId: '',
  branchId: '',
  instructorId: userProfile?.uid || '',
  modality: 'in_person',
  location: '',
  scheduledDate: getLocalDateTime()
});

const defaultParticipantRecord = () => ({
  attendanceStatus: TRAINING_ATTENDANCE_STATUSES.INVITED,
  evaluationStatus: TRAINING_EVALUATION_STATUSES.PENDING,
  score: 0,
  employeeSignature: null,
  instructorSignature: null,
  notes: ''
});

const EVALUATION_LABELS = {
  [TRAINING_EVALUATION_STATUSES.APPROVED]: 'Aprobado',
  [TRAINING_EVALUATION_STATUSES.FAILED]: 'Desaprobado'
};

export default function CreateTrainingSession({
  ownerId,
  onSaved,
  onCancel,
  mode = 'quick', // 'quick' | 'planned'
  initialData = null, // Datos precargados desde planes
  compact = false // true cuando se usa dentro del sidebar (Drawer)
}) {
  const { userProfile, userEmpresas = [], userSucursales = [] } = useAuth();

  const [form, setForm] = useState(() => defaultForm(userProfile));
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');

  // Catálogos y opciones
  const [catalogItems, setCatalogItems] = useState([]);
  const [instructorOptions, setInstructorOptions] = useState([]);
  const [suggestedIds, setSuggestedIds] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [filters, setFilters] = useState({ role: '', sector: '' });

  // Datos de ejecución por participante
  const [participantRecords, setParticipantRecords] = useState({});
  const [requiresEvaluation, setRequiresEvaluation] = useState(false);
  
  // Estados para documentos
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [previewFiles, setPreviewFiles] = useState([]);
  /** Ref con la lista actual de archivos para evitar closure obsoleto al guardar */
  const uploadedFilesRef = useRef([]);
  useEffect(() => {
    uploadedFilesRef.current = uploadedFiles;
  }, [uploadedFiles]);

  // Planificación (solo modo planned)
  const [planCandidates, setPlanCandidates] = useState([]);
  const [selectedPlanItemId, setSelectedPlanItemId] = useState('');
  const [planMode, setPlanMode] = useState('ad_hoc');
  const [eligibleEmployees, setEligibleEmployees] = useState([]);
  const [blockedEmployees, setBlockedEmployees] = useState([]);
  const [scheduledPeriod, setScheduledPeriod] = useState(null);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const ratingCellRefs = useRef({});

  // Inicializar con datos precargados si existen
  useEffect(() => {
    const initializeWithData = async () => {
      if (initialData) {
        // Primero cargar el catálogo
        await ensureCatalog();
        
        // Luego establecer los datos del formulario
        setForm(prev => ({
          ...prev,
          trainingTypeId: initialData.trainingTypeId || prev.trainingTypeId,
          companyId: initialData.companyId || prev.companyId,
          branchId: initialData.branchId || prev.branchId,
          scheduledDate: initialData.scheduledDate || prev.scheduledDate
        }));
        
        if (initialData.planMode === 'plan') {
          setPlanMode('plan');
          setSelectedPlanItemId(toPlanIdString(initialData.planItemId) || '');
        }
      }
    };
    
    initializeWithData();
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

  const employees = useMemo(
    () => [...eligibleEmployees, ...blockedEmployees],
    [eligibleEmployees, blockedEmployees]
  );

  const blockedEmployeeIdSet = useMemo(
    () => new Set(blockedEmployees.map((e) => e.id)),
    [blockedEmployees]
  );

  const blockedByEmployeeId = useMemo(
    () => Object.fromEntries(blockedEmployees.map((e) => [e.id, e])),
    [blockedEmployees]
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

  const selectableFilteredEmployees = useMemo(
    () => filteredEmployees.filter((employee) => !blockedEmployeeIdSet.has(employee.id)),
    [filteredEmployees, blockedEmployeeIdSet]
  );

  const allSelectableFilteredSelected = useMemo(
    () => selectableFilteredEmployees.length > 0 && selectableFilteredEmployees.every((employee) => selectedIds.includes(employee.id)),
    [selectableFilteredEmployees, selectedIds]
  );

  const someSelectableFilteredSelected = useMemo(
    () => selectableFilteredEmployees.some((employee) => selectedIds.includes(employee.id)),
    [selectableFilteredEmployees, selectedIds]
  );

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

  // Cargar participantes sugeridos desde el servicio (lógica en trainingExecutionService)
  useEffect(() => {
    if (!ownerId || !form.branchId || !form.trainingTypeId || !form.companyId || !form.scheduledDate) {
      setEligibleEmployees([]);
      setBlockedEmployees([]);
      setSuggestedIds([]);
      setScheduledPeriod(null);
      return;
    }

    let alive = true;
    setLoadingParticipants(true);

    const sessionContext = {
      trainingTypeId: form.trainingTypeId,
      companyId: form.companyId,
      branchId: form.branchId,
      scheduledDate: form.scheduledDate,
      planId: toPlanIdString(planMode === 'plan' ? (initialData?.planId || planCandidates.find((c) => c.planItemId === selectedPlanItemId)?.planId) || null : null),
      planItemId: toPlanIdString(planMode === 'plan' ? (initialData?.planItemId || selectedPlanItemId) || null : null)
    };

    trainingExecutionService.suggestParticipants(ownerId, sessionContext)
      .then((result) => {
        if (!alive) return;
        setEligibleEmployees(result.eligibleEmployees || []);
        setBlockedEmployees(result.blockedEmployees || []);
        setSuggestedIds(result.suggestedIds || []);
        setSelectedIds(result.suggestedIds || []);
        setScheduledPeriod(result.period || null);
      })
      .catch((err) => {
        if (!alive) return;
        console.warn('Error loading participant suggestions:', err);
        setEligibleEmployees([]);
        setBlockedEmployees([]);
        setSuggestedIds([]);
        setScheduledPeriod(null);
      })
      .finally(() => {
        if (alive) setLoadingParticipants(false);
      });

    return () => { alive = false; };
  }, [
    ownerId,
    form.branchId,
    form.trainingTypeId,
    form.companyId,
    form.scheduledDate,
    planMode,
    initialData?.planId,
    initialData?.planItemId,
    planCandidates,
    selectedPlanItemId
  ]);

  // Gestionar selección de participantes
  const toggleEmployee = (employeeId) => {
    if (blockedEmployeeIdSet.has(employeeId)) return;

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
    const availableEmployees = filteredEmployees.filter((employee) => !blockedEmployeeIdSet.has(employee.id));
    const next = Array.from(new Set([...selectedIds, ...availableEmployees.map((employee) => employee.id)]));
    setSelectedIds(next);
    
    // Inicializar registros para nuevos participantes
    availableEmployees.forEach((employee) => {
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

  // Funciones para manejar documentos
  const handleFileUpload = (event, fileType) => {
    const files = Array.from(event.target.files || []);
    const newFiles = files.map(file => ({
      file,
      type: fileType,
      id: Date.now() + Math.random(),
      name: file.name,
      size: file.size,
      mimeType: file.type, // Guardar el MIME type original
      url: URL.createObjectURL(file)
    }));
    setUploadedFiles(prev => [...prev, ...newFiles]);
    setPreviewFiles(prev => [...prev, ...newFiles]);
    console.info('[CreateTrainingSession] Subir Documentos: archivos añadidos', { count: newFiles.length, names: newFiles.map(f => f.name) });
    event.target.value = ''; // Permitir volver a seleccionar los mismos archivos
  };

  const removeFile = (fileId) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
    setPreviewFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const clearAllFiles = () => {
    setUploadedFiles([]);
    setPreviewFiles([]);
  };

  // Actualizar requisitos cuando cambia el tipo de capacitación
  useEffect(() => {
    if (!form.trainingTypeId || !ownerId) return;

    const updateRequirements = async () => {
      try {
        const catalog = await trainingCatalogService.getById(ownerId, form.trainingTypeId);
        setRequiresEvaluation(Boolean(catalog?.requiresEvaluation));
      } catch (err) {
        console.warn('Error loading catalog requirements:', err);
      }
    };

    updateRequirements();
  }, [ownerId, form.trainingTypeId]);

  // Validar y guardar todo
  const saveTrainingSession = async () => {
    const filesToUpload = uploadedFilesRef.current;
    console.info('[CreateTrainingSession] saveTrainingSession: inicio', { uploadedFilesLength: filesToUpload.length, stateLength: uploadedFiles.length });
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

    // Validar firmas si se requieren (eliminado por solicitud)
    // if (requiresSignature) {
    //   const missingSignatures = selectedIds.some((employeeId) => {
    //     const record = participantRecords[employeeId];
    //     return !record?.employeeSignature || !record?.instructorSignature;
    //   });

    //   if (missingSignatures) {
    //     setError('Todas las firmas son requeridas para esta capacitación');
    //     return;
    //   }
    // }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      // 1. Crear sesión (planId/planItemId ya normalizados a string con toPlanIdString)
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
        planId: toPlanIdString(planMode === 'plan' ? (initialData?.planId || planCandidates.find(c => c.planItemId === selectedPlanItemId)?.planId || null) : null),
        planItemId: toPlanIdString(planMode === 'plan' ? (initialData?.planItemId || selectedPlanItemId) : null),
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
          attendanceStatus: mode === 'quick' ? record.attendanceStatus : TRAINING_ATTENDANCE_STATUSES.INVITED,
          evaluationStatus: requiresEvaluation ? (record.evaluationStatus || TRAINING_EVALUATION_STATUSES.PENDING) : TRAINING_EVALUATION_STATUSES.NOT_APPLICABLE,
          score: record.score,
          employeeSignature: record.employeeSignature,
          instructorSignature: record.instructorSignature,
          notes: record.notes
        });
      });

      await Promise.all(attendancePromises);

      // 3. Subir evidencias (archivos) a almacenamiento y registrar en trainingEvidence (usar ref para tener lista actual)
      const sessionId = sessionRef?.id;
      const evidenceErrors = [];
      const filesForEvidence = uploadedFilesRef.current;
      console.info('[CreateTrainingSession] Evidencias: sessionId=', sessionId, 'filesForEvidence.length=', filesForEvidence.length, 'ownerId=', ownerId);
      if (sessionId && filesForEvidence.length > 0) {
        for (let i = 0; i < filesForEvidence.length; i++) {
          const item = filesForEvidence[i];
          const file = item?.file;
          console.info('[CreateTrainingSession] Evidencia', i + 1, '/', filesForEvidence.length, ':', file?.name, 'size=', file?.size, 'type=', file?.type, 'isFile=', file instanceof File);
          if (!file || !(file instanceof File)) {
            console.warn('[CreateTrainingSession] Evidencia omitida (no es File):', item);
            continue;
          }
          try {
            console.info('[CreateTrainingSession] Subiendo archivo a almacenamiento:', file.name);
            const uploadResult = await uploadFileWithContext({
              file,
              context: {
                contextType: 'capacitacion',
                contextEventId: sessionId,
                companyId: form.companyId,
                sucursalId: form.branchId || undefined,
                tipoArchivo: 'evidencia',
                capacitacionTipoId: form.trainingTypeId || undefined
              },
              fecha: new Date(),
              uploadedBy: userProfile?.uid || null
            });
            console.info('[CreateTrainingSession] Archivo subido. fileId=', uploadResult?.fileId, 'sessionId=', sessionId);
            const evidenceType = file.type.startsWith('image/') ? 'photo' : 'document';
            const evidencePayload = {
              evidenceType,
              sessionId,
              companyId: form.companyId,
              branchId: form.branchId,
              fileReference: uploadResult.fileId,
              notes: file.name || 'Evidencia',
              uploadedAt: new Date().toISOString(),
              uploadedBy: userProfile?.uid || null
            };
            console.info('[CreateTrainingSession] Creando registro de evidencia en Firestore:', evidencePayload);
            const evidenceRef = await trainingEvidenceService.create(ownerId, evidencePayload);
            console.info('[CreateTrainingSession] Evidencia creada. id=', evidenceRef?.id ?? evidenceRef);
          } catch (err) {
            console.error('[CreateTrainingSession] Error subiendo evidencia:', item.name ?? file?.name, err);
            evidenceErrors.push(item.name || file?.name || 'archivo');
          }
        }
        if (evidenceErrors.length > 0) {
          setError(`Capacitación guardada. No se pudieron subir ${evidenceErrors.length} archivo(s): ${evidenceErrors.join(', ')}`);
        }
      } else if (filesForEvidence.length > 0 && !sessionId) {
        console.warn('[CreateTrainingSession] Hay archivos pero no sessionId; no se subieron evidencias.');
      }

      setSuccess(`Capacitación ${mode === 'quick' ? 'registrada' : 'programada'} exitosamente`);
      
      // Resetear formulario
      setTimeout(() => {
        setForm(defaultForm(userProfile));
        setSelectedIds([]);
        setParticipantRecords({});
        setUploadedFiles([]);
        setPreviewFiles([]);
        setSuccess('');
        if (onSaved) onSaved(sessionRef.id);
      }, 2000);

    } catch (err) {
      console.error('[CreateTrainingSession] Error al guardar', err);
      const msg = err?.message || '';
      const isPathError = msg.includes("reading 'path'") || msg.includes('reading "path"');
      const isPeriodConflict = err?.code === 'training_attendance_period_conflict';
      let displayMessage = msg || 'No se pudo guardar la capacitación';
      if (isPathError) {
        displayMessage = 'Error al vincular con el plan. Por favor, vuelve a abrir "Registrar desde Plan" e inténtalo de nuevo.';
      } else if (isPeriodConflict) {
        const d = err?.details || {};
        const periodLabel = d.periodYear && d.periodMonth
          ? new Date(d.periodYear, d.periodMonth - 1).toLocaleDateString('es', { month: 'long', year: 'numeric' })
          : 'este período';
        displayMessage = `Un empleado ya tiene esta capacitación registrada como asistió en otra sesión (${periodLabel}). Solo puede contarse una sesión por empleado por período. Revisa la otra sesión o quita la asistencia allí antes de guardar aquí.`;
      }
      setError(displayMessage);
    } finally {
      setSaving(false);
    }
  };

  const sectionSpacing = compact ? 2 : 3;
  const sectionPadding = compact ? 1.5 : 2;
  const sectionTitleVariant = compact ? 'subtitle2' : 'h6';
  const sectionTitleMb = compact ? 1 : 2;
  const gridSpacing = compact ? 1.5 : 2;
  const gridCols = compact ? { xs: 12, sm: 6 } : { xs: 12, md: 4 }; // 2 cols en compact, 3 en normal
  const tableMaxHeight = compact ? 320 : 500;

  /** Entrada desde "Capacitaciones planificadas este mes": datos del plan fijos, solo se editan instructor, fecha y ubicación */
  const isFromPlan = Boolean(initialData?.planId ?? initialData?.planMode === 'plan');
  const trainingTypeName = catalogItems.find((c) => c.id === form.trainingTypeId)?.name || form.trainingTypeId || '—';
  const modalityLabel = { in_person: 'Presencial', virtual: 'Virtual', hybrid: 'Híbrida' }[form.modality] || form.modality;

  const content = (
    <>
      {error && <Alert severity="error" sx={{ mb: 1.5 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 1.5 }}>{success}</Alert>}
      <Stack spacing={sectionSpacing}>
        {/* Sección 1: Datos de la Capacitación */}
        <Paper variant="outlined" sx={{ p: sectionPadding }}>
          <Typography variant={sectionTitleVariant} sx={{ mb: sectionTitleMb, fontWeight: 600 }}>1. Datos de la Capacitación</Typography>
          <Grid container spacing={gridSpacing}>
            {isFromPlan ? (
              <>
                {/* Desde plan: solo lectura tipo, empresa, sucursal, modalidad */}
                <Grid item xs={12}>
                  <Box sx={{ py: 0.5, px: 1.5, bgcolor: 'action.hover', borderRadius: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      <strong>{trainingTypeName}</strong>
                      {' · '}
                      {companyById[form.companyId]?.nombre || '—'} / {branchById[form.branchId]?.nombre || '—'}
                      {' · '}
                      {modalityLabel}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item {...gridCols}>
                  <Autocomplete
                    options={instructorOptions}
                    value={instructorOptions.find((option) => option.id === form.instructorId) || null}
                    onChange={(_, value) => setForm({ ...form, instructorId: value?.id || '' })}
                    getOptionLabel={(option) => option?.label || ''}
                    isOptionEqualToValue={(option, value) => option?.id === value?.id}
                    renderInput={(params) => (
                      <TextField {...params} fullWidth size="small" label="Instructor" placeholder="Seleccionar" />
                    )}
                  />
                </Grid>
                <Grid item {...gridCols}>
                  <TextField
                    fullWidth
                    size="small"
                    type="datetime-local"
                    label="Fecha y Hora"
                    InputLabelProps={{ shrink: true }}
                    value={form.scheduledDate}
                    onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Ubicación"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    placeholder={compact ? 'Ej. Aula 1' : undefined}
                  />
                </Grid>
              </>
            ) : (
              <>
                <Grid item {...gridCols}>
                  <TextField
                    select
                    fullWidth
                    size="small"
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
                <Grid item {...gridCols}>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    label="Empresa"
                    value={form.companyId}
                    onChange={(e) => setForm({ ...form, companyId: e.target.value, branchId: '' })}
                  >
                    {userEmpresas.map((company) => (
                      <MenuItem key={company.id} value={company.id}>{company.nombre}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item {...gridCols}>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    label="Sucursal"
                    value={form.branchId}
                    onChange={(e) => setForm({ ...form, branchId: e.target.value })}
                  >
                    {branchOptions.map((branch) => (
                      <MenuItem key={branch.id} value={branch.id}>{branch.nombre}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item {...gridCols}>
                  <Autocomplete
                    options={instructorOptions}
                    value={instructorOptions.find((option) => option.id === form.instructorId) || null}
                    onChange={(_, value) => setForm({ ...form, instructorId: value?.id || '' })}
                    getOptionLabel={(option) => option?.label || ''}
                    isOptionEqualToValue={(option, value) => option?.id === value?.id}
                    renderInput={(params) => (
                      <TextField {...params} fullWidth size="small" label="Instructor" placeholder="Seleccionar" />
                    )}
                  />
                </Grid>
                <Grid item {...gridCols}>
                  <TextField
                    fullWidth
                    size="small"
                    type="datetime-local"
                    label="Fecha y Hora"
                    InputLabelProps={{ shrink: true }}
                    value={form.scheduledDate}
                    onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })}
                  />
                </Grid>
                <Grid item {...gridCols}>
                  <TextField
                    select
                    fullWidth
                    size="small"
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
                    size="small"
                    label="Ubicación"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    placeholder={compact ? 'Ej. Aula 1' : undefined}
                  />
                </Grid>
              </>
            )}

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
        </Paper>

        {/* Sección 2: Participantes y Ejecución Unificados */}
        <Paper variant="outlined" sx={{ p: sectionPadding }}>
          <Typography variant={sectionTitleVariant} sx={{ mb: sectionTitleMb, fontWeight: 600 }}>
            2. Participantes y Ejecución ({selectedIds.length})
          </Typography>
          
          {employees.length === 0 ? (
            <Alert severity="info" sx={compact ? { py: 0.5 } : undefined}>
              Selecciona una sucursal para cargar los participantes disponibles
            </Alert>
          ) : (
            <>
              {/* Tabla Unificada */}
              <TableContainer
                component={Paper}
                variant="outlined"
                sx={{
                  maxHeight: tableMaxHeight,
                  overflowX: compact ? 'hidden' : 'auto',
                  overflowY: 'auto',
                  ...(compact && { padding: 0, '& .MuiTableCell-root': { px: 1.25 } })
                }}
              >
                <Table
                  stickyHeader
                  size="small"
                  sx={compact ? { tableLayout: 'fixed', width: '100%' } : undefined}
                >
                  <colgroup>
                    <col style={{ width: 40 }} />
                  </colgroup>
                  <TableHead>
                    <TableRow>
                      <TableCell
                        padding="checkbox"
                        sx={{
                          width: 40,
                          minWidth: 40,
                          maxWidth: 40,
                          padding: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxSizing: 'border-box'
                        }}
                      >
                        <Checkbox
                          indeterminate={someSelectableFilteredSelected && !allSelectableFilteredSelected}
                          checked={allSelectableFilteredSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              selectFiltered();
                            } else {
                              setSelectedIds([]);
                              setParticipantRecords({});
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ minWidth: compact ? 0 : 200 }}>Participante</TableCell>
                      <TableCell
                        sx={{
                          width: compact ? 88 : undefined,
                          minWidth: compact ? 88 : 120,
                          color: 'error.main',
                          fontWeight: 600,
                          '&::after': { content: '" *"', fontWeight: 600 }
                        }}
                      >
                        Asistencia
                      </TableCell>
                      {requiresEvaluation && (
                        <TableCell sx={{ width: compact ? 100 : undefined, minWidth: compact ? 100 : 130 }}>
                          Evaluación
                        </TableCell>
                      )}
                      {requiresEvaluation && (
                        <TableCell sx={{ width: compact ? 70 : undefined, minWidth: compact ? 70 : 120, textAlign: 'center' }}>⭐</TableCell>
                      )}
                      <TableCell sx={{ minWidth: compact ? 0 : 200 }}>Notas</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredEmployees.map((employee) => {
                      const isSelected = selectedIds.includes(employee.id);
                      const record = participantRecords[employee.id] || defaultParticipantRecord();
                      const isSuggested = suggestedIds.includes(employee.id);
                      const blockInfo = blockedByEmployeeId[employee.id] || null;
                      const isBlocked = Boolean(blockInfo);
                      const name = employee.nombre || employee.nombreCompleto || employee.id;
                      const attendanceMissing = isSelected && !isBlocked && record.attendanceStatus === TRAINING_ATTENDANCE_STATUSES.INVITED;

                      return (
                        <TableRow
                          key={employee.id}
                          selected={isSelected}
                          sx={{
                            backgroundColor: isSelected ? 'action.selected' : 'inherit',
                            '&:hover': { backgroundColor: 'action.hover' }
                          }}
                        >
                          <TableCell
                            padding="checkbox"
                            sx={{
                              width: 40,
                              minWidth: 40,
                              maxWidth: 40,
                              padding: 0,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxSizing: 'border-box',
                              ...(compact && { py: 1.25 })
                            }}
                          >
                            <Checkbox
                              checked={isSelected}
                              disabled={isBlocked}
                              onChange={() => toggleEmployee(employee.id)}
                            />
                          </TableCell>
                          <TableCell sx={compact ? { maxWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', py: 1.25 } : undefined}>
                            <Box sx={compact ? { minWidth: 0 } : undefined}>
                              <Typography
                                variant="body2"
                                fontWeight={isSelected ? 600 : 400}
                                noWrap={compact}
                                title={compact ? name : undefined}
                              >
                                {name}
                              </Typography>
                              {!compact && isSuggested && (
                                <Typography variant="caption" color="primary">
                                  (Sugerido - capacitación requerida)
                                </Typography>
                              )}
                              {!compact && isBlocked && (
                                <Typography variant="caption" color="warning.main" display="block">
                                  Ya registrado en {formatPeriodLabel(blockInfo.periodYear, blockInfo.periodMonth)} en otra sesión
                                </Typography>
                              )}
                              {compact && (isSuggested || isBlocked) && (
                                <Typography variant="caption" color={isBlocked ? 'warning.main' : 'primary'} noWrap title={isBlocked ? `Ya registrado en ${formatPeriodLabel(blockInfo?.periodYear, blockInfo?.periodMonth)}` : 'Sugerido'}>
                                  {isBlocked ? 'Ya registrado' : 'Sugerido'}
                                </Typography>
                              )}
                            </Box>
                          </TableCell>
                          <TableCell
                            sx={{
                              ...(compact ? { width: 88, py: 1.25 } : { py: 1 }),
                              ...(attendanceMissing && {
                                border: '2px solid',
                                borderColor: 'error.main',
                                borderRadius: 1,
                                bgcolor: 'error.light'
                              })
                            }}
                          >
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <Tooltip title="Presente">
                                <span>
                                  <IconButton
                                    size="small"
                                    color={isSelected && record.attendanceStatus === TRAINING_ATTENDANCE_STATUSES.PRESENT ? 'primary' : 'default'}
                                    onClick={() => {
                                      if (!isSelected) toggleEmployee(employee.id);
                                      updateParticipantRecord(employee.id, 'attendanceStatus', TRAINING_ATTENDANCE_STATUSES.PRESENT);
                                      if (requiresEvaluation) {
                                        updateParticipantRecord(employee.id, 'score', 3);
                                      }
                                    }}
                                    disabled={!isSelected}
                                    sx={isSelected && record.attendanceStatus === TRAINING_ATTENDANCE_STATUSES.PRESENT ? { bgcolor: 'primary.main', color: 'primary.contrastText', '&:hover': { bgcolor: 'primary.dark' } } : undefined}
                                  >
                                    <CheckIcon fontSize="small" />
                                  </IconButton>
                                </span>
                              </Tooltip>
                              <Tooltip title="Ausente">
                                <span>
                                  <IconButton
                                    size="small"
                                    color={isSelected && record.attendanceStatus === TRAINING_ATTENDANCE_STATUSES.JUSTIFIED_ABSENCE ? 'error' : 'default'}
                                    onClick={() => {
                                      if (!isSelected) toggleEmployee(employee.id);
                                      updateParticipantRecord(employee.id, 'attendanceStatus', TRAINING_ATTENDANCE_STATUSES.JUSTIFIED_ABSENCE);
                                      if (requiresEvaluation) updateParticipantRecord(employee.id, 'evaluationStatus', TRAINING_EVALUATION_STATUSES.PENDING);
                                    }}
                                    disabled={!isSelected}
                                    sx={isSelected && record.attendanceStatus === TRAINING_ATTENDANCE_STATUSES.JUSTIFIED_ABSENCE ? { bgcolor: 'error.main', color: 'error.contrastText', '&:hover': { bgcolor: 'error.dark' } } : undefined}
                                  >
                                    <CloseIcon fontSize="small" />
                                  </IconButton>
                                </span>
                              </Tooltip>
                            </Box>
                          </TableCell>
                          {requiresEvaluation && (
                            <TableCell sx={compact ? { width: 80, py: 1.25 } : { py: 1 }}>
                              <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                                <Tooltip title="Aprobado">
                                  <span>
                                    <IconButton
                                      size="small"
                                      onClick={() => {
                                        if (!isSelected) toggleEmployee(employee.id);
                                        updateParticipantRecord(employee.id, 'evaluationStatus', TRAINING_EVALUATION_STATUSES.APPROVED);
                                      }}
                                      disabled={!isSelected || record.attendanceStatus !== TRAINING_ATTENDANCE_STATUSES.PRESENT}
                                      sx={
                                        record.evaluationStatus === TRAINING_EVALUATION_STATUSES.APPROVED
                                          ? { bgcolor: 'success.main', color: 'success.contrastText', '&:hover': { bgcolor: 'success.dark' } }
                                          : { border: '1px solid', borderColor: 'divider' }
                                      }
                                    >
                                      <Typography component="span" fontWeight={700} sx={{ fontSize: '0.75rem' }}>A</Typography>
                                    </IconButton>
                                  </span>
                                </Tooltip>
                                <Tooltip title="Reprobado">
                                  <span>
                                    <IconButton
                                      size="small"
                                      onClick={() => {
                                        if (!isSelected) toggleEmployee(employee.id);
                                        updateParticipantRecord(employee.id, 'evaluationStatus', TRAINING_EVALUATION_STATUSES.FAILED);
                                      }}
                                      disabled={!isSelected || record.attendanceStatus !== TRAINING_ATTENDANCE_STATUSES.PRESENT}
                                      sx={
                                        record.evaluationStatus === TRAINING_EVALUATION_STATUSES.FAILED
                                          ? { bgcolor: 'error.main', color: 'error.contrastText', '&:hover': { bgcolor: 'error.dark' } }
                                          : { border: '1px solid', borderColor: 'divider' }
                                      }
                                    >
                                      <Typography component="span" fontWeight={700} sx={{ fontSize: '0.75rem' }}>R</Typography>
                                    </IconButton>
                                  </span>
                                </Tooltip>
                              </Box>
                            </TableCell>
                          )}
                          {requiresEvaluation && (() => {
                            const starsHighlighted = isSelected && !isBlocked && record.attendanceStatus !== TRAINING_ATTENDANCE_STATUSES.INVITED;
                            const ratingSx = {
                              ...(compact && { fontSize: '1.1rem' }),
                              ...(starsHighlighted && {
                                fontSize: '1.4rem',
                                '& .MuiRating-icon': { strokeWidth: 1.2 }
                              })
                            };
                            return (
                              <TableCell
                                ref={(el) => { ratingCellRefs.current[employee.id] = el; }}
                                tabIndex={0}
                                sx={{
                                  display: 'flex',
                                  justifyContent: 'center',
                                  alignItems: 'center',
                                  ...(compact ? { width: 64, py: 1.25 } : { py: 1 }),
                                  ...(starsHighlighted && {
                                    border: '1.5px solid',
                                    borderColor: (theme) => alpha(theme.palette.primary.main, 0.35),
                                    borderRadius: 1,
                                    bgcolor: (theme) => alpha(theme.palette.primary.main, 0.06)
                                  })
                                }}
                              >
                                {isBlocked && blockInfo ? (
                                  <Rating
                                    name={`score-blocked-${employee.id}`}
                                    value={Math.min(Number(blockInfo.score) || 0, 3)}
                                    max={3}
                                    readOnly
                                    size="small"
                                    precision={0.5}
                                    sx={ratingSx}
                                  />
                                ) : (
                                  <Rating
                                    name={`score-${employee.id}`}
                                    value={Math.min(isSelected ? (record.score || 0) : 0, 3)}
                                    max={3}
                                    onChange={(event, newValue) => {
                                      if (!isSelected) toggleEmployee(employee.id);
                                      updateParticipantRecord(employee.id, 'score', newValue ?? 0);
                                    }}
                                    disabled={!isSelected || record.attendanceStatus !== TRAINING_ATTENDANCE_STATUSES.PRESENT}
                                    size="small"
                                    precision={0.5}
                                    sx={ratingSx}
                                  />
                                )}
                              </TableCell>
                            );
                          })()}
                          <TableCell sx={compact ? { minWidth: 0, overflow: 'hidden', py: 1.25 } : undefined}>
                            {isBlocked && blockInfo ? (
                              <Typography variant="body2" color="text.secondary" noWrap={compact} title={blockInfo.notes || undefined}>
                                {blockInfo.notes || '—'}
                              </Typography>
                            ) : (
                              <TextField
                                fullWidth
                                size="small"
                                value={isSelected ? (record.notes || '') : ''}
                                onChange={(e) => {
                                  if (!isSelected) toggleEmployee(employee.id);
                                  updateParticipantRecord(employee.id, 'notes', e.target.value);
                                }}
                                disabled={!isSelected}
                                placeholder={compact ? 'Notas' : 'Notas del participante'}
                                sx={compact ? { '& .MuiInputBase-input': { fontSize: '0.8rem' } } : undefined}
                              />
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {filteredEmployees.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          <Typography color="text.secondary" sx={{ py: 2 }}>
                            No hay empleados para los filtros seleccionados
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              
              {/* Sección de Documentos */}
              {selectedIds.length > 0 && (
                <Paper variant="outlined" sx={{ p: sectionPadding, mt: 1.5 }}>
                  <Typography variant={sectionTitleVariant} sx={{ mb: sectionTitleMb, fontWeight: 600 }}>
                    3. Documentos
                  </Typography>
                  <Alert severity="info" sx={{ mb: 1.5 }}>
                    Sube evidencia: documentos, fotos o archivos de asistencia.
                  </Alert>
                  
                  <Grid container spacing={gridSpacing}>
                    <Grid item xs={12} md={6}>
                      <Stack spacing={2}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          Documentos Generales
                        </Typography>
                        <Stack direction="row" spacing={2} alignItems="center">
                          <input
                            type="file"
                            id="general-documents"
                            style={{ display: 'none' }}
                            multiple
                            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                            onChange={(e) => handleFileUpload(e, 'document')}
                          />
                          <label htmlFor="general-documents">
                            <Button
                              variant="outlined"
                              component="span"
                              startIcon={<UploadIcon />}
                              size="small"
                            >
                              Subir Documentos
                            </Button>
                          </label>
                        </Stack>
                      </Stack>
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <Stack spacing={2}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          Fotos de la Capacitación
                        </Typography>
                        <Stack direction="row" spacing={2} alignItems="center">
                          <input
                            type="file"
                            id="training-photos"
                            style={{ display: 'none' }}
                            multiple
                            accept="image/*"
                            capture="environment"
                            onChange={(e) => handleFileUpload(e, 'photo')}
                          />
                          <label htmlFor="training-photos">
                            <Button
                              variant="outlined"
                              component="span"
                              startIcon={<AttachFileIcon />}
                              size="small"
                              color="secondary"
                            >
                              Tomar/Subir Fotos
                            </Button>
                          </label>
                        </Stack>
                      </Stack>
                    </Grid>
                  </Grid>

                  {/* Lista de documentos subidos */}
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      {selectedIds.length} participantes seleccionados • {uploadedFiles.length} documentos subidos
                    </Typography>
                  </Box>

                  {/* Vista previa de documentos */}
                  {previewFiles.length > 0 && (
                    <Paper variant="outlined" sx={{ p: sectionPadding, mt: 1.5 }}>
                      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                        Vista previa
                      </Typography>
                      <Grid container spacing={gridSpacing}>
                        {previewFiles.map((file) => (
                          <Grid item xs={12} sm={6} md={4} key={file.id}>
                            <Paper variant="outlined" sx={{ p: 1, textAlign: 'center', position: 'relative' }}>
                              {file.mimeType && file.mimeType.startsWith('image/') ? (
                                <Box>
                                  <Box
                                    component="img"
                                    src={file.url}
                                    alt={file.name}
                                    sx={{
                                      width: '100%',
                                      height: 120,
                                      objectFit: 'cover',
                                      borderRadius: 1,
                                      cursor: 'pointer'
                                    }}
                                    onClick={() => window.open(file.url, '_blank')}
                                    onError={(e) => {
                                      console.log('Error cargando imagen:', file.name);
                                      // Si falla la carga, mostrar icono de documento
                                      const parent = e.target.parentElement;
                                      parent.innerHTML = `
                                        <div style="padding: 16px; text-align: center;">
                                          <div style="font-size: 40px; color: #666; margin-bottom: 8px;">📄</div>
                                          <div style="font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${file.name}</div>
                                          <div style="font-size: 12px; color: #666;">${(file.size / 1024).toFixed(1)} KB</div>
                                        </div>
                                      `;
                                    }}
                                  />
                                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                    {file.name}
                                  </Typography>
                                </Box>
                              ) : (
                                <Box sx={{ p: 2 }}>
                                  <AttachFileIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
                                  <Typography variant="body2" noWrap>
                                    {file.name}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {(file.size / 1024).toFixed(1)} KB
                                  </Typography>
                                </Box>
                              )}
                              <IconButton
                                size="small"
                                onClick={() => removeFile(file.id)}
                                sx={{ position: 'absolute', top: 4, right: 4 }}
                                color="error"
                              >
                                ×
                              </IconButton>
                            </Paper>
                          </Grid>
                        ))}
                      </Grid>
                      
                      <Box sx={{ mt: 2, textAlign: 'center' }}>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={clearAllFiles}
                          color="secondary"
                        >
                          Limpiar todos los documentos
                        </Button>
                      </Box>
                    </Paper>
                  )}
                </Paper>
              )}
            </>
          )}
        </Paper>

        <Divider sx={{ my: compact ? 1 : 2 }} />

        {/* Botones de acción */}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={compact ? 1 : 2} justifyContent="flex-end">
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

          </Button>
        </Stack>
      </Stack>
    </>
  );

  if (compact) {
    return content;
  }
  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
        {initialData ? 'Registrar Capacitación desde Plan' : (mode === 'quick' ? 'Registrar Capacitación Rápida' : 'Programar Capacitación')}
      </Typography>
      {content}
    </Paper>
  );
}
