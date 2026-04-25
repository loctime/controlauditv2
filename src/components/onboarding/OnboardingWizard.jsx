import { useState, useEffect } from 'react';
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
  useTheme,
} from '@mui/material';
import StorefrontIcon from '@mui/icons-material/Storefront';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useAuth } from '@/components/context/AuthContext';
import { sucursalService } from '@/services/sucursalService';

const STEPS = [
  { label: 'Empresa',  icon: StorefrontIcon, color: '#3b82f6', bg: '#eff6ff' },
  { label: 'Sucursal', icon: LocationOnIcon, color: '#10b981', bg: '#ecfdf5' },
];

const INITIAL = {
  empresa:  { nombre: '', direccion: '', telefono: '' },
  sucursal: { nombre: '', direccion: '', telefono: '' },
};

function StepIcon({ step, active, completed }) {
  const Icon = step.icon;
  if (completed) return <CheckCircleIcon sx={{ color: step.color, fontSize: 28 }} />;
  return (
    <Box
      sx={{
        width: 28, height: 28, borderRadius: '50%',
        bgcolor: active ? step.color : '#e5e7eb',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <Icon sx={{ color: active ? 'white' : '#9ca3af', fontSize: 16 }} />
    </Box>
  );
}

export default function OnboardingWizard({ open, onClose, initialStep = 0 }) {
  const { user, userProfile, crearEmpresa } = useAuth();
  const theme = useTheme();
  const [activeStep, setActiveStep] = useState(initialStep);
  const [form, setForm] = useState(INITIAL);
  const [createdEmpresaId, setCreatedEmpresaId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [skipped, setSkipped] = useState(new Set());

  const ownerId = userProfile?.ownerId;

  useEffect(() => {
    if (open) setActiveStep(initialStep);
  }, [open, initialStep]);

  const handleChange = (section) => (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [section]: { ...prev[section], [name]: value } }));
    setError('');
  };

  const handleSkip = () => {
    setSkipped((prev) => new Set([...prev, activeStep]));
    setError('');
    if (activeStep === STEPS.length - 1) handleClose();
    else setActiveStep((s) => s + 1);
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

      }

      if (activeStep === STEPS.length - 1) handleClose();
      else setActiveStep((s) => s + 1);
    } catch (err) {
      setError(err.message || 'Ocurrió un error. Intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const currentStep = STEPS[activeStep];
  const isSkippable = activeStep > 0;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      disableEscapeKeyDown
      PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}
    >
      {/* Header con color del step actual */}
      <Box
        sx={{
          bgcolor: currentStep.color,
          px: 3,
          pt: 3,
          pb: 2,
          color: 'white',
        }}
      >
        <Typography variant="overline" sx={{ opacity: 0.8, letterSpacing: 2 }}>
          Paso {activeStep + 1} de {STEPS.length}
        </Typography>
        <Typography variant="h5" fontWeight={800}>
          {currentStep.label}
        </Typography>

        {/* Stepper minimalista en el header */}
        <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
          {STEPS.map((s, i) => (
            <Box
              key={i}
              sx={{
                height: 4,
                flex: 1,
                borderRadius: 2,
                bgcolor: i <= activeStep || skipped.has(i)
                  ? 'rgba(255,255,255,0.9)'
                  : 'rgba(255,255,255,0.3)',
                transition: 'background 0.3s',
              }}
            />
          ))}
        </Box>
      </Box>

      <DialogContent sx={{ pt: 3, pb: 1 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {activeStep === 0 && <StepEmpresa  data={form.empresa}  onChange={handleChange('empresa')}  color={currentStep.color} bg={currentStep.bg} />}
        {activeStep === 1 && <StepSucursal data={form.sucursal} onChange={handleChange('sucursal')} color={currentStep.color} bg={currentStep.bg} />}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        {isSkippable && (
          <Button onClick={handleSkip} disabled={loading} color="inherit" sx={{ mr: 'auto', color: 'text.secondary' }}>
            Omitir este paso
          </Button>
        )}
        <Button onClick={handleClose} disabled={loading} variant="outlined" color="inherit">
          Cancelar
        </Button>
        <Button
          onClick={handleNext}
          variant="contained"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
          sx={{
            bgcolor: currentStep.color,
            '&:hover': { bgcolor: currentStep.color, filter: 'brightness(0.9)' },
            fontWeight: 700,
            px: 3,
          }}
        >
          {activeStep === STEPS.length - 1 ? 'Finalizar' : 'Continuar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function FieldNote({ color, bg, text }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, p: 1.5, borderRadius: 2, bgcolor: bg, border: `1px solid ${color}33`, mb: 2 }}>
      <CheckCircleIcon sx={{ color, fontSize: 18, mt: 0.1, flexShrink: 0 }} />
      <Typography variant="body2" color="text.secondary">{text}</Typography>
    </Box>
  );
}

function StepEmpresa({ data, onChange, color, bg }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <FieldNote color={color} bg={bg} text="Ingresá el nombre de tu empresa u organización. Es lo primero que verán los auditores." />
      <TextField label="Nombre de la empresa *" name="nombre" value={data.nombre} onChange={onChange} fullWidth autoFocus
        sx={{ '& .MuiOutlinedInput-root.Mui-focused fieldset': { borderColor: color } }}
      />
      <TextField label="Dirección" name="direccion" value={data.direccion} onChange={onChange} fullWidth />
      <TextField label="Teléfono" name="telefono" value={data.telefono} onChange={onChange} fullWidth />
    </Box>
  );
}

function StepSucursal({ data, onChange, color, bg }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <FieldNote color={color} bg={bg} text="Las sucursales son las sedes o ubicaciones donde se realizan auditorías." />
      <TextField label="Nombre de la sucursal *" name="nombre" value={data.nombre} onChange={onChange} fullWidth autoFocus
        sx={{ '& .MuiOutlinedInput-root.Mui-focused fieldset': { borderColor: color } }}
      />
      <TextField label="Dirección" name="direccion" value={data.direccion} onChange={onChange} fullWidth />
      <TextField label="Teléfono" name="telefono" value={data.telefono} onChange={onChange} fullWidth />
    </Box>
  );
}

