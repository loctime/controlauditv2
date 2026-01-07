import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Box,
  Typography,
  Alert,
  FormControlLabel,
  Checkbox,
  Chip,
  CircularProgress,
  Divider,
  useTheme,
  alpha
} from '@mui/material';
import {
  Person as PersonIcon,
  Lock as LockIcon,
  Security as SecurityIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
  Pending as PendingIcon
} from '@mui/icons-material';
import { useAuth } from '@/components/context/AuthContext';
import { toast } from 'react-toastify';
import userService from '../../../services/userService';
import { registrarAccionSistema } from '../../../utils/firestoreUtils';

// Permisos agrupados por categoría
const PERMISOS_AGRUPADOS = {
  empresas: {
    label: 'Gestión de Empresas y Sucursales',
    icon: '🏢',
    permisos: [
      { key: 'puedeCrearEmpresas', label: 'Crear Empresas' },
      { key: 'puedeCrearSucursales', label: 'Crear Sucursales' }
    ]
  },
  auditorias: {
    label: 'Gestión de Auditorías',
    icon: '📋',
    permisos: [
      { key: 'puedeCrearAuditorias', label: 'Crear Auditorías' },
      { key: 'puedeAgendarAuditorias', label: 'Agendar Auditorías' }
    ]
  },
  formularios: {
    label: 'Gestión de Formularios',
    icon: '📝',
    permisos: [
      { key: 'puedeCrearFormularios', label: 'Crear Formularios' },
      { key: 'puedeCompartirFormularios', label: 'Compartir Formularios' }
    ]
  }
};

// Perfiles informativos (solo referencia visual, NO modifican permisos)
const PERFILES_UI = {
  ejecutor: {
    label: 'Ejecutor',
    description: 'Ejecuta auditorías y crea formularios'
  },
  gestor: {
    label: 'Gestor',
    description: 'Gestiona empresas, sucursales y auditorías'
  },
  soloLectura: {
    label: 'Solo Lectura',
    description: 'Solo visualiza información'
  }
};

const UserCreateDialogV2 = ({ open, onClose, onSuccess, limiteUsuarios, usuariosActuales }) => {
  const theme = useTheme();
  const { userProfile } = useAuth();
  const clienteAdminId = userProfile?.clienteAdminId || userProfile?.uid;
  
  // Determinar texto del cliente admin
  const clienteAdminTexto = clienteAdminId === userProfile?.uid 
    ? 'Asignado a tu cuenta' 
    : (userProfile?.displayName || clienteAdminId || 'No asignado');

  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '',
    permisos: {
      puedeCrearEmpresas: false,
      puedeCrearSucursales: false,
      puedeCrearAuditorias: false,
      puedeAgendarAuditorias: false,
      puedeCrearFormularios: false,
      puedeCompartirFormularios: false
    }
  });

  const puedeAgregar = usuariosActuales < limiteUsuarios || !limiteUsuarios;

  // Validar paso actual
  const isStepValid = (step) => {
    switch (step) {
      case 0:
        return formData.nombre.trim() !== '' && formData.email.trim() !== '' && formData.password.length >= 6;
      case 1:
        return true; // Siempre válido, solo muestra información
      case 2:
        return true; // Permisos son opcionales
      case 3:
        return true; // Confirmación
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (isStepValid(activeStep)) {
      setActiveStep((prev) => prev + 1);
    } else {
      toast.error('Por favor completa todos los campos requeridos');
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleReset = () => {
    setActiveStep(0);
    setCreatedUserPending(false);
    setFormData({
      nombre: '',
      email: '',
      password: '',
      permisos: {
        puedeCrearEmpresas: false,
        puedeCrearSucursales: false,
        puedeCrearAuditorias: false,
        puedeAgendarAuditorias: false,
        puedeCrearFormularios: false,
        puedeCompartirFormularios: false
      }
    });
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handlePermisoChange = (key, value) => {
    setFormData((prev) => ({
      ...prev,
      permisos: { ...prev.permisos, [key]: value }
    }));
  };

  const [createdUserPending, setCreatedUserPending] = useState(false);

  const handleCreate = async () => {
    if (!puedeAgregar) {
      toast.error('Has alcanzado el límite de usuarios permitidos para tu plan.');
      return;
    }

    setLoading(true);
    setCreatedUserPending(false);
    try {
      const result = await userService.createUser({
        email: formData.email,
        password: formData.password,
        nombre: formData.nombre,
        permisos: formData.permisos,
        clienteAdminId: clienteAdminId
      });

      // Registrar acción en el sistema
      await registrarAccionSistema(
        userProfile?.uid || 'system',
        `Crear usuario: ${formData.email}`,
        {
          email: formData.email,
          nombre: formData.nombre,
          role: 'operario',
          permisos: formData.permisos,
          clienteAdminId: clienteAdminId,
          pending: result.pending || false
        },
        'crear',
        'usuario',
        result.uid
      );

      // Guardar estado pending para mostrar en UI
      if (result.pending) {
        setCreatedUserPending(true);
        toast.warning('Usuario creado en modo PENDIENTE. Este usuario aún no puede iniciar sesión hasta que el backend esté disponible.', {
          autoClose: 5000
        });
        // Mantener diálogo abierto un momento más para mostrar estado pending
        setTimeout(() => {
          handleReset();
          if (onSuccess) {
            onSuccess();
          }
          onClose();
        }, 2000);
      } else {
        toast.success('Usuario creado exitosamente');
        handleReset();
        if (onSuccess) {
          onSuccess();
        }
        onClose();
      }
    } catch (error) {
      console.error('Error al crear usuario:', error);
      toast.error(error.message || 'Error al crear el usuario');
    } finally {
      setLoading(false);
    }
  };

  const permisosActivos = Object.values(formData.permisos).filter(Boolean).length;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PersonIcon color="primary" />
          <Typography variant="h6">Crear Nuevo Usuario</Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Stepper activeStep={activeStep} orientation="vertical">
            {/* Paso 1: Datos Básicos */}
            <Step>
              <StepLabel>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PersonIcon fontSize="small" />
                  <Typography variant="subtitle1">Datos Básicos</Typography>
                </Box>
              </StepLabel>
              <StepContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
                  <TextField
                    label="Nombre completo"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    fullWidth
                    required
                    autoFocus
                  />
                  <TextField
                    label="Email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    fullWidth
                    required
                    autoComplete="off"
                  />
                  <TextField
                    label="Contraseña"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    fullWidth
                    required
                    helperText="Mínimo 6 caracteres"
                    autoComplete="new-password"
                  />
                  <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    <Button variant="contained" onClick={handleNext} disabled={!isStepValid(0)}>
                      Continuar
                    </Button>
                  </Box>
                </Box>
              </StepContent>
            </Step>

            {/* Paso 3: Perfil de Permisos */}
            <Step>
              <StepLabel>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LockIcon fontSize="small" />
                  <Typography variant="subtitle1">Perfil de Permisos</Typography>
                </Box>
              </StepLabel>
              <StepContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 2 }}>
                  <Alert severity="info">
                    <Typography variant="body2">
                      <strong>Nota:</strong> Los permisos definen qué opciones se muestran en la interfaz 
                      para organizar la experiencia de uso. La autorización real depende del backend.
                    </Typography>
                  </Alert>

                  {/* Perfiles informativos (solo referencia visual) */}
                  <Box>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                      Ejemplos de perfiles comunes (solo referencia):
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {Object.entries(PERFILES_UI).map(([key, perfil]) => (
                        <Box
                          key={key}
                          sx={{
                            p: 1.5,
                            border: `1px solid ${theme.palette.divider}`,
                            borderRadius: 1,
                            bgcolor: alpha(theme.palette.action.hover, 0.3)
                          }}
                        >
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {perfil.label}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {perfil.description}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, fontStyle: 'italic' }}>
                      Estos son solo ejemplos. Selecciona los permisos individuales según tus necesidades.
                    </Typography>
                  </Box>

                  <Divider />

                  {/* Permisos agrupados por categoría */}
                  {Object.entries(PERMISOS_AGRUPADOS).map(([categoriaKey, categoria]) => (
                    <Box key={categoriaKey}>
                      <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600 }}>
                        {categoria.icon} {categoria.label}
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, ml: 2 }}>
                        {categoria.permisos.map((permiso) => (
                          <FormControlLabel
                            key={permiso.key}
                            control={
                              <Checkbox
                                checked={formData.permisos[permiso.key] || false}
                                onChange={(e) => handlePermisoChange(permiso.key, e.target.checked)}
                              />
                            }
                            label={permiso.label}
                          />
                        ))}
                      </Box>
                    </Box>
                  ))}

                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Permisos activos: <strong>{permisosActivos}</strong> de {Object.keys(formData.permisos).length}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    <Button onClick={handleBack}>Atrás</Button>
                    <Button variant="contained" onClick={handleNext}>
                      Continuar
                    </Button>
                  </Box>
                </Box>
              </StepContent>
            </Step>

            {/* Paso 4: Confirmación */}
            <Step>
              <StepLabel>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckCircleIcon fontSize="small" />
                  <Typography variant="subtitle1">Confirmación</Typography>
                </Box>
              </StepLabel>
              <StepContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
                  <Alert severity="success" icon={<CheckCircleIcon />}>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                      Resumen del usuario a crear:
                    </Typography>
                  </Alert>

                  <Box sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05), p: 2, borderRadius: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Typography variant="body2">
                        <strong>Nombre:</strong> {formData.nombre}
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Email:</strong> {formData.email}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Typography variant="body2">
                        <strong>Rol:</strong>
                      </Typography>
                      <Chip label="Operario" size="small" color="primary" />
                    </Box>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Cliente Admin:</strong> {clienteAdminTexto}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Permisos activos:</strong> {permisosActivos}
                    </Typography>
                    {createdUserPending && (
                      <Alert severity="warning" icon={<PendingIcon />} sx={{ mt: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            Estado:
                          </Typography>
                          <Chip 
                            label="PENDIENTE" 
                            color="warning" 
                            size="small"
                            icon={<PendingIcon />}
                          />
                        </Box>
                        <Typography variant="body2">
                          Este usuario aún no puede iniciar sesión. Se activará automáticamente 
                          cuando el backend esté disponible.
                        </Typography>
                      </Alert>
                    )}
                    {permisosActivos > 0 && (
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                          Permisos seleccionados:
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {Object.entries(formData.permisos)
                            .filter(([_, value]) => value)
                            .map(([key]) => {
                              const permiso = Object.values(PERMISOS_AGRUPADOS)
                                .flatMap((cat) => cat.permisos)
                                .find((p) => p.key === key);
                              return permiso ? (
                                <Chip key={key} label={permiso.label} size="small" variant="outlined" />
                              ) : null;
                            })}
                        </Box>
                      </Box>
                    )}
                  </Box>

                  {!puedeAgregar && (
                    <Alert severity="error">
                      Has alcanzado el límite de usuarios permitidos ({limiteUsuarios}).
                    </Alert>
                  )}

                  <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    <Button onClick={handleBack}>Atrás</Button>
                    <Button
                      variant="contained"
                      onClick={handleCreate}
                      disabled={loading || !puedeAgregar}
                      startIcon={loading ? <CircularProgress size={16} /> : <CheckCircleIcon />}
                    >
                      {loading ? 'Creando...' : 'Crear Usuario'}
                    </Button>
                  </Box>
                </Box>
              </StepContent>
            </Step>
          </Stepper>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancelar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UserCreateDialogV2;
