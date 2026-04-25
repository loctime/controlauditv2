import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  Stepper,
  Step,
  StepLabel,
  Box,
  Typography,
  TextField,
  CircularProgress,
  Alert,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useAuth } from '@/components/context/AuthContext';
import { sucursalService } from '@/services/sucursalService';
import { empleadoService } from '@/services/empleadoService';
import { formularioService } from '@/services/formularioService';

const STEPS = ['Empresa', 'Sucursal', 'Empleado', 'Formulario'];

const INITIAL = {
  empresa: { nombre: '', direccion: '', telefono: '' },
  sucursal: { nombre: '', direccion: '', telefono: '' },
  empleado: { nombre: '', apellido: '', cargo: '' },
  formulario: { nombre: '' },
};

export default function OnboardingWizard({ open, onClose }) {
  const { user, userProfile, crearEmpresa } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  const [form, setForm] = useState(INITIAL);
  const [createdEmpresaId, setCreatedEmpresaId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [skipped, setSkipped] = useState(new Set());

  const ownerId = userProfile?.ownerId;

  const handleChange = (section) => (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [section]: { ...prev[section], [name]: value } }));
    setError('');
  };

  const handleSkip = () => {
    setSkipped((prev) => new Set([...prev, activeStep]));
    setError('');
    if (activeStep === STEPS.length - 1) {
      handleClose();
    } else {
      setActiveStep((s) => s + 1);
    }
  };

  const handleClose = () => {
    setActiveStep(0);
    setForm(INITIAL);
    setCreatedEmpresaId(null);
    setError('');
    setSkipped(new Set());
    onClose();
  };

  const handleNext = async () => {
    setError('');
    setLoading(true);
    try {
      if (activeStep === 0) {
        if (!form.empresa.nombre.trim()) throw new Error('El nombre de la empresa es requerido');
        const id = await crearEmpresa({ nombre: form.empresa.nombre.trim() });
        setCreatedEmpresaId(id);

      } else if (activeStep === 1) {
        if (!form.sucursal.nombre.trim()) throw new Error('El nombre de la sucursal es requerido');
        if (!createdEmpresaId) throw new Error('Primero debés crear una empresa');
        await sucursalService.crearSucursalCompleta(
          ownerId,
          { nombre: form.sucursal.nombre.trim(), empresaId: createdEmpresaId },
          { uid: user?.uid, role: userProfile?.role }
        );

      } else if (activeStep === 2) {
        if (!form.empleado.nombre.trim() || !form.empleado.apellido.trim()) {
          throw new Error('Nombre y apellido son requeridos');
        }
        await empleadoService.crearEmpleado(
          ownerId,
          {
            nombre: form.empleado.nombre.trim(),
            apellido: form.empleado.apellido.trim(),
            cargo: form.empleado.cargo.trim(),
            tipo: 'operativo',
            estado: 'activo',
            fechaIngreso: new Date().toISOString().split('T')[0],
          },
          { uid: user?.uid, role: userProfile?.role }
        );

      } else if (activeStep === 3) {
        if (!form.formulario.nombre.trim()) throw new Error('El nombre del formulario es requerido');
        await formularioService.crearFormulario(
          {
            nombre: form.formulario.nombre.trim(),
            secciones: [
              {
                titulo: 'Sección 1',
                preguntas: [{ texto: 'Pregunta de ejemplo', tipo: 'si_no' }],
              },
            ],
            esPublico: false,
            estado: 'activo',
            version: '1.0',
          },
          user,
          userProfile
        );
      }

      if (activeStep === STEPS.length - 1) {
        handleClose();
      } else {
        setActiveStep((s) => s + 1);
      }
    } catch (err) {
      setError(err.message || 'Ocurrió un error. Intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const isSkippable = activeStep > 0;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth disableEscapeKeyDown>
      <Box sx={{ px: 3, pt: 3, pb: 1 }}>
        <Typography variant="h6" fontWeight={700} gutterBottom>
          Configuración inicial
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Completá estos pasos para empezar a usar ControlAudit.
        </Typography>
        <Stepper activeStep={activeStep} alternativeLabel>
          {STEPS.map((label, index) => (
            <Step key={label} completed={index < activeStep || skipped.has(index)}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Box>

      <DialogContent sx={{ pt: 2, pb: 1 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {activeStep === 0 && (
          <StepEmpresa data={form.empresa} onChange={handleChange('empresa')} />
        )}
        {activeStep === 1 && (
          <StepSucursal data={form.sucursal} onChange={handleChange('sucursal')} />
        )}
        {activeStep === 2 && (
          <StepEmpleado data={form.empleado} onChange={handleChange('empleado')} />
        )}
        {activeStep === 3 && (
          <StepFormulario data={form.formulario} onChange={handleChange('formulario')} />
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        {isSkippable && (
          <Button onClick={handleSkip} disabled={loading} color="inherit" sx={{ mr: 'auto' }}>
            Omitir
          </Button>
        )}
        <Button onClick={handleClose} disabled={loading} variant="outlined">
          Cancelar
        </Button>
        <Button
          onClick={handleNext}
          variant="contained"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} /> : null}
        >
          {activeStep === STEPS.length - 1 ? 'Finalizar' : 'Continuar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function StepEmpresa({ data, onChange }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <SuccessNote text="Creá tu primera empresa para organizar tus auditorías." />
      <TextField label="Nombre de la empresa *" name="nombre" value={data.nombre} onChange={onChange} fullWidth autoFocus />
      <TextField label="Dirección" name="direccion" value={data.direccion} onChange={onChange} fullWidth />
      <TextField label="Teléfono" name="telefono" value={data.telefono} onChange={onChange} fullWidth />
    </Box>
  );
}

function StepSucursal({ data, onChange }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <SuccessNote text="Las sucursales son las ubicaciones o sedes de tu empresa." />
      <TextField label="Nombre de la sucursal *" name="nombre" value={data.nombre} onChange={onChange} fullWidth autoFocus />
      <TextField label="Dirección" name="direccion" value={data.direccion} onChange={onChange} fullWidth />
      <TextField label="Teléfono" name="telefono" value={data.telefono} onChange={onChange} fullWidth />
    </Box>
  );
}

function StepEmpleado({ data, onChange }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <SuccessNote text="Agregá el primer empleado. Podés agregar más desde la sección Empleados." />
      <Box sx={{ display: 'flex', gap: 2 }}>
        <TextField label="Nombre *" name="nombre" value={data.nombre} onChange={onChange} fullWidth autoFocus />
        <TextField label="Apellido *" name="apellido" value={data.apellido} onChange={onChange} fullWidth />
      </Box>
      <TextField label="Cargo" name="cargo" value={data.cargo} onChange={onChange} fullWidth />
    </Box>
  );
}

function StepFormulario({ data, onChange }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <SuccessNote text="Creá tu primer formulario de auditoría. Podés editarlo en detalle después." />
      <TextField
        label="Nombre del formulario *"
        name="nombre"
        value={data.nombre}
        onChange={onChange}
        fullWidth
        autoFocus
        placeholder="Ej: Inspección de seguridad, Checklist diario..."
      />
      <Typography variant="caption" color="text.secondary">
        Se creará con una sección y una pregunta de ejemplo. Podés editarlo desde "Formularios".
      </Typography>
    </Box>
  );
}

function SuccessNote({ text }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1 }}>
      <CheckCircleIcon sx={{ color: 'success.main', mt: 0.25, fontSize: 18 }} />
      <Typography variant="body2" color="text.secondary">{text}</Typography>
    </Box>
  );
}
