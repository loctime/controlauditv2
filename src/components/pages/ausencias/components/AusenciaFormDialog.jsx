import logger from '@/utils/logger';
import { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
  Typography,
  Chip,
  Box
} from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import CloseIcon from '@mui/icons-material/Close';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DeleteIcon from '@mui/icons-material/Delete';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { createAusencia, updateAusencia } from '../../../../services/ausenciasService';
import { uploadAndAttachFiles } from '../../../../services/ausenciasFilesService';
import {
  collection,
  getDocs,
  query,
  where,
  orderBy
} from 'firebase/firestore';
import { dbAudit } from '../../../../firebaseControlFile';
import { firestoreRoutesCore } from '../../../../core/firestore/firestoreRoutes.core';
import { useAuth } from '@/components/context/AuthContext';
import dayjs from 'dayjs';
import { validateFiles } from '../../../../services/fileValidationPolicy';

const FILE_ACCEPT = '*/*';
const ORIGEN_OPTIONS = [
  { value: 'manual', label: 'Manual' },
  { value: 'accidente', label: 'Accidente' },
  { value: 'incidente', label: 'Incidente' },
  { value: 'salud_ocupacional', label: 'Salud ocupacional' },
  { value: 'licencia_medica', label: 'Licencia medica' },
  { value: 'permiso', label: 'Permiso' },
  { value: 'enfermedad', label: 'Enfermedad' }
];

const normalizeLegacyOrigen = (data = {}) => {
  if (data.origen) return data.origen;
  if (typeof data.relacionAccidente === 'string' && data.relacionAccidente.trim()) {
    return 'accidente';
  }
  if (data.relacionAccidente === true) return 'accidente';
  return 'manual';
};

const normalizeLegacyOrigenId = (data = {}, origen = 'manual') => {
  if (origen === 'manual') return '';
  if (typeof data.origenId === 'string' && data.origenId.trim()) return data.origenId.trim();
  if (typeof data.relacionAccidente === 'string' && data.relacionAccidente.trim()) {
    return data.relacionAccidente.trim();
  }
  return '';
};

const normalizeEstado = (estado) => {
  const normalized = String(estado || '').toLowerCase().trim().replace(/\s+/g, '_');
  if (normalized.includes('cerr') || normalized.includes('finaliz') || normalized.includes('resuelt')) {
    return 'cerrada';
  }
  if (normalized.includes('progreso')) {
    return 'en_progreso';
  }
  return 'abierta';
};
const getInitialState = () => ({
  empleadoId: '',
  tipo: '',
  motivo: '',
  origen: 'manual',
  origenId: '',
  estado: 'abierta',
  fechaInicio: dayjs(),
  fechaFin: null,
  observaciones: '',
  horasPorDia: ''
});

const normalizeEmployees = (snapshot) =>
  snapshot.docs.map((docSnapshot) => ({
    id: docSnapshot.id,
    ...docSnapshot.data()
  }));

const dateToDayjs = (value) => {
  if (!value) return null;
  if (dayjs.isDayjs(value)) return value;
  if (value?.toDate) return dayjs(value.toDate());
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed : null;
};

const normalizeFileError = (fileName, reason) => ({
  fileName: fileName || 'archivo',
  message: reason
});

export default function AusenciaFormDialog({
  open,
  onClose,
  empresa,
  sucursal,
  selectedEmpresa,
  selectedSucursal,
  tipoOptions = [],
  onAddTipo,
  onRemoveTipo,
  onSaved,
  mode = 'create',
  initialData = null
}) {
  const { userProfile } = useAuth();
  const [form, setForm] = useState(getInitialState);
  const [empleados, setEmpleados] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [fileErrors, setFileErrors] = useState([]);

  const isEditMode = mode === 'edit' && Boolean(initialData?.id);

  const sucursalNombre =
    sucursal?.nombre ||
    sucursal?.alias ||
    initialData?.sucursalNombre ||
    '';
  const empresaNombre =
    empresa?.nombre ||
    empresa?.razonSocial ||
    initialData?.empresaNombre ||
    '';

  const canSubmit = useMemo(() => {
    const fechaInicioValida =
      form.fechaInicio &&
      (typeof form.fechaInicio?.isValid === 'function'
        ? form.fechaInicio.isValid()
        : true);

    const companyOk = selectedEmpresa || initialData?.empresaId || initialData?.empresaNombre;
    const branchOk =
      (selectedSucursal && selectedSucursal !== 'todas') ||
      (initialData?.sucursalId && initialData?.sucursalId !== 'todas');

    const origenOk = form.origen === 'manual' || String(form.origenId || '').trim().length > 0;

    return (
      companyOk &&
      branchOk &&
      form.empleadoId &&
      String(form.tipo || '').trim().length > 0 &&
      String(form.motivo || '').trim().length > 0 &&
      fechaInicioValida &&
      origenOk
    );
  }, [
    selectedEmpresa,
    selectedSucursal,
    form.empleadoId,
    form.tipo,
    form.motivo,
    form.origen,
    form.origenId,
    form.fechaInicio,
    initialData
  ]);

  const tipoSuggestions = useMemo(() => {
    const base = Array.isArray(tipoOptions) ? tipoOptions : [];
    const unique = new Set(
      base
        .map((tipo) => (typeof tipo === 'string' ? tipo.trim() : ''))
        .filter(Boolean)
    );
    if (form.tipo && !unique.has(form.tipo.trim())) {
      unique.add(form.tipo.trim());
    }
    return Array.from(unique).sort((a, b) =>
      a.localeCompare(b, 'es', { sensitivity: 'base' })
    );
  }, [tipoOptions, form.tipo]);

  useEffect(() => {
    if (!open) return;

    if (isEditMode && initialData) {
      const origen = normalizeLegacyOrigen(initialData);
      setForm({
        empleadoId: initialData.empleadoId || '',
        tipo: initialData.tipo || '',
        motivo: initialData.motivo || initialData.tipo || '',
        origen,
        origenId: normalizeLegacyOrigenId(initialData, origen),
        estado: normalizeEstado(initialData.estado || 'abierta'),
        fechaInicio: dateToDayjs(initialData.fechaInicio) || dayjs(),
        fechaFin: dateToDayjs(initialData.fechaFin),
        observaciones: initialData.observaciones || '',
        horasPorDia: initialData.horasPorDia ?? ''
      });
    } else {
      setForm({
        ...getInitialState(),
        fechaInicio: dayjs(),
        estado: 'abierta'
      });
    }

    setError('');
    setSelectedFiles([]);
    setFileErrors([]);
  }, [open, isEditMode, initialData]);

  useEffect(() => {
    const fetchEmployees = async () => {
      const sucursalToUse =
        selectedSucursal && selectedSucursal !== 'todas'
          ? selectedSucursal
          : initialData?.sucursalId;

      if (!open || !sucursalToUse || sucursalToUse === 'todas') {
        setEmpleados([]);
        return;
      }
      if (!userProfile?.uid) {
        setEmpleados([]);
        return;
      }

      setLoadingEmployees(true);
      try {
        if (!userProfile?.ownerId) {
          setEmpleados([]);
          return;
        }

        const ownerId = userProfile.ownerId;
        const empleadosRef = collection(dbAudit, ...firestoreRoutesCore.empleados(ownerId));
        const q = query(
          empleadosRef,
          where('sucursalId', '==', sucursalToUse),
          orderBy('nombre', 'asc')
        );
        const snapshot = await getDocs(q);
        setEmpleados(normalizeEmployees(snapshot));
      } catch (fetchError) {
        logger.error('Error cargando empleados:', fetchError);
        setEmpleados([]);
      } finally {
        setLoadingEmployees(false);
      }
    };
    fetchEmployees();
  }, [open, selectedSucursal, userProfile, initialData]);

  const handleChange = (field) => (event) => {
    const value = event?.target?.value;
    setForm((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddFiles = (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    const validation = validateFiles(files);

    const nextFiles = validation.accepted.map((file, index) => ({
      id: `${file.name}-${Date.now()}-${index}`,
      file,
      name: file.name,
      size: file.size,
      type: file.type || 'application/octet-stream'
    }));

    const nextErrors = validation.rejected.map((entry) =>
      normalizeFileError(entry.fileName, entry.issues.map((issue) => issue.message).join(', '))
    );

    setSelectedFiles((prev) => [...prev, ...nextFiles]);
    if (nextErrors.length > 0) {
      setFileErrors((prev) => [...prev, ...nextErrors]);
    }

    event.target.value = '';
  };

  const handleRemoveFile = (id) => {
    setSelectedFiles((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSubmit = async () => {
    if (!canSubmit) {
      setError('Completa los campos obligatorios.');
      return;
    }

    setSubmitting(true);
    setError('');
    setFileErrors([]);

    try {
      const empleadoSeleccionado = empleados.find((emp) => emp.id === form.empleadoId);

      const fechaInicio = form.fechaInicio?.toDate
        ? form.fechaInicio.toDate()
        : form.fechaInicio || null;
      const fechaFin = form.fechaFin?.toDate
        ? form.fechaFin.toDate()
        : form.fechaFin || null;

      const payload = {
        empresaId: selectedEmpresa === 'todas' ? null : (selectedEmpresa || initialData?.empresaId || null),
        sucursalId: selectedSucursal && selectedSucursal !== 'todas' ? selectedSucursal : (initialData?.sucursalId || null),
        empresaNombre,
        sucursalNombre,
        empleadoId: form.empleadoId,
        empleadoNombre:
          empleadoSeleccionado?.nombre ||
          empleadoSeleccionado?.displayName ||
          initialData?.empleadoNombre ||
          'Empleado sin nombre',
        tipo: form.tipo,
        motivo: form.motivo,
        origen: form.origen,
        origenId: form.origen === 'manual' ? null : String(form.origenId || '').trim() || null,
        estado: normalizeEstado(form.estado || 'abierta'),
        fechaInicio,
        fechaFin,
        observaciones: form.observaciones,
        horasPorDia:
          form.horasPorDia !== ''
            ? Number.parseFloat(form.horasPorDia)
            : undefined,
        userProfile
      };

      let ausenciaGuardada = null;

      if (isEditMode && initialData?.id) {
        await updateAusencia(initialData.id, payload, userProfile);
        ausenciaGuardada = { id: initialData.id, ...initialData, ...payload };
      } else {
        ausenciaGuardada = await createAusencia(payload);
      }

      const filesToUpload = selectedFiles.map((item) => item.file);
      let uploadResult = { uploaded: [], errors: [] };

      if (filesToUpload.length > 0 && ausenciaGuardada?.id) {
        uploadResult = await uploadAndAttachFiles(
          ausenciaGuardada.id,
          filesToUpload,
          {
            companyId: payload.empresaId || 'system',
            sucursalId: payload.sucursalId || null
          },
          userProfile
        );
      }

      if (uploadResult.errors.length > 0) {
        setFileErrors(uploadResult.errors);
      }

      const tipoNormalizado = (form.tipo || '').trim();
      if (tipoNormalizado && typeof onAddTipo === 'function') {
        onAddTipo(tipoNormalizado);
      }

      if (onSaved) {
        await onSaved({
          ausencia: ausenciaGuardada,
          uploadErrors: uploadResult.errors,
          mode: isEditMode ? 'edit' : 'create'
        });
      }

      if (!isEditMode) {
        setForm(getInitialState());
      }

      if (uploadResult.errors.length === 0) {
        setSelectedFiles([]);
        onClose?.();
      }
    } catch (submitError) {
      logger.error('Error guardando ausencia:', submitError);
      if (submitError?.code === 'AUSENCIA_DUPLICADA') {
        setError('Ya existe una ausencia activa con la misma referencia de origen y fecha.');
      } else {
        setError('No se pudo guardar la ausencia. Verifica los datos e intenta nuevamente.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth='sm' fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>
        {isEditMode ? 'Editar ausencia' : 'Registrar ausencia'}
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <Stack spacing={0.5}>
            <TextField
              label='Empresa'
              value={
                empresaNombre ||
                (selectedEmpresa === 'todas'
                  ? 'Todas las empresas'
                  : 'Sin empresa')
              }
              variant='outlined'
              size='small'
              fullWidth
              InputProps={{ readOnly: true }}
            />
            <TextField
              label='Sucursal'
              value={
                sucursalNombre ||
                (selectedSucursal === 'todas'
                  ? 'Todas las sucursales'
                  : 'Sin sucursal')
              }
              variant='outlined'
              size='small'
              fullWidth
              InputProps={{ readOnly: true }}
            />
          </Stack>

          <FormControl fullWidth size='small'>
            <InputLabel>Empleado</InputLabel>
            <Select
              label='Empleado'
              value={form.empleadoId}
              onChange={handleChange('empleadoId')}
              disabled={
                loadingEmployees ||
                (!selectedSucursal && !initialData?.sucursalId) ||
                selectedSucursal === 'todas'
              }
            >
              <MenuItem value=''>Selecciona un empleado</MenuItem>
              {empleados.map((empleado) => (
                <MenuItem key={empleado.id} value={empleado.id}>
                  {empleado.nombre ||
                    empleado.displayName ||
                    `${empleado.apellido || ''} ${empleado.nombre || ''}`.trim() ||
                    empleado.id}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {loadingEmployees && (
            <Stack direction='row' spacing={1} alignItems='center'>
              <CircularProgress size={18} />
              <span>Cargando empleados...</span>
            </Stack>
          )}

          <Stack direction='row' spacing={1} alignItems='center'>
            <Autocomplete
              freeSolo
              clearOnBlur
              handleHomeEndKeys
              options={tipoSuggestions}
              value={form.tipo || ''}
              onChange={(_, newValue) => {
                const nextValue = (newValue || '').trim();
                setForm((prev) => ({
                  ...prev,
                  tipo: nextValue
                }));
              }}
              onInputChange={(_, newInputValue) => {
                setForm((prev) => ({
                  ...prev,
                  tipo: newInputValue
                }));
              }}
              renderInput={(params) => (
                <TextField {...params} label='Tipo' size='small' fullWidth />
              )}
              fullWidth
            />
            <Tooltip title='Eliminar tipo'>
              <span>
                <IconButton
                  size='small'
                  color='error'
                  disabled={
                    !form.tipo ||
                    !tipoSuggestions.some(
                      (tipo) =>
                        tipo.toLowerCase() === form.tipo.trim().toLowerCase()
                    )
                  }
                  onClick={() => {
                    const actual = (form.tipo || '').trim();
                    if (
                      !actual ||
                      !tipoSuggestions.some(
                        (tipo) => tipo.toLowerCase() === actual.toLowerCase()
                      )
                    ) {
                      return;
                    }
                    const confirmacion = window.confirm(
                      `Eliminar el tipo "${actual}" de las sugerencias?`
                    );
                    if (!confirmacion) return;
                    if (typeof onRemoveTipo === 'function') {
                      onRemoveTipo(actual);
                    }
                    setForm((prev) => ({
                      ...prev,
                      tipo: ''
                    }));
                  }}
                >
                  <CloseIcon fontSize='small' />
                </IconButton>
              </span>
            </Tooltip>
          </Stack>

          <TextField
            label='Motivo'
            size='small'
            value={form.motivo}
            onChange={handleChange('motivo')}
            fullWidth
          />

          <FormControl fullWidth size='small'>
            <InputLabel>Origen</InputLabel>
            <Select
              label='Origen'
              value={form.origen}
              onChange={(event) => {
                const value = event.target.value;
                setForm((prev) => ({
                  ...prev,
                  origen: value,
                  origenId: value === 'manual' ? '' : prev.origenId
                }));
              }}
            >
              {ORIGEN_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {form.origen !== 'manual' && (
            <TextField
              label='ID de origen'
              size='small'
              value={form.origenId}
              onChange={handleChange('origenId')}
              fullWidth
              required
            />
          )}

          <DatePicker
            label='Fecha inicio'
            value={form.fechaInicio}
            onChange={(value) => setForm((prev) => ({ ...prev, fechaInicio: value }))}
            slotProps={{
              textField: {
                size: 'small',
                fullWidth: true
              }
            }}
          />

          <DatePicker
            label='Fecha fin (opcional)'
            value={form.fechaFin}
            onChange={(value) => setForm((prev) => ({ ...prev, fechaFin: value }))}
            slotProps={{
              textField: {
                size: 'small',
                fullWidth: true
              }
            }}
          />

          <TextField
            label='Horas por dia (opcional)'
            type='number'
            size='small'
            value={form.horasPorDia}
            onChange={handleChange('horasPorDia')}
            fullWidth
          />

          <TextField
            label='Observaciones'
            size='small'
            value={form.observaciones}
            onChange={handleChange('observaciones')}
            fullWidth
            multiline
            minRows={3}
          />

          <Stack spacing={1}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant='subtitle2' sx={{ color: '#374151' }}>
                Archivos adjuntos (opcional)
              </Typography>
              <Button
                component='label'
                size='small'
                startIcon={<UploadFileIcon />}
                variant='outlined'
                disabled={submitting}
              >
                Agregar archivos
                <input
                  type='file'
                  hidden
                  multiple
                  accept={FILE_ACCEPT}
                  onChange={handleAddFiles}
                />
              </Button>
            </Box>

            {selectedFiles.length > 0 && (
              <Stack spacing={1}>
                {selectedFiles.map((item) => (
                  <Box
                    key={item.id}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      border: '1px solid #e5e7eb',
                      borderRadius: '10px',
                      px: 1.25,
                      py: 0.75
                    }}
                  >
                    <Stack>
                      <Typography variant='body2' sx={{ fontWeight: 600 }}>
                        {item.name}
                      </Typography>
                      <Typography variant='caption' sx={{ color: '#6b7280' }}>
                        {Math.round(item.size / 1024)} KB
                      </Typography>
                    </Stack>
                    <IconButton
                      size='small'
                      color='error'
                      onClick={() => handleRemoveFile(item.id)}
                      disabled={submitting}
                    >
                      <DeleteIcon fontSize='small' />
                    </IconButton>
                  </Box>
                ))}
              </Stack>
            )}

            {selectedFiles.length === 0 && (
              <Chip label='Sin archivos seleccionados' variant='outlined' size='small' />
            )}
          </Stack>

          {fileErrors.length > 0 && (
            <Alert severity='warning' onClose={() => setFileErrors([])}>
              {fileErrors.map((item, idx) => (
                <Typography key={`${item.fileName}-${idx}`} variant='body2'>
                  {item.fileName}: {item.message}
                </Typography>
              ))}
            </Alert>
          )}

          {error && (
            <Alert severity='error' onClose={() => setError('')}>
              {error}
            </Alert>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={onClose}
          sx={{ textTransform: 'none' }}
          disabled={submitting}
        >
          Cancelar
        </Button>
        <Button
          variant='contained'
          sx={{ textTransform: 'none', fontWeight: 600 }}
          onClick={handleSubmit}
          disabled={!canSubmit || submitting}
        >
          {submitting ? 'Guardando...' : isEditMode ? 'Guardar cambios' : 'Guardar ausencia'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}


