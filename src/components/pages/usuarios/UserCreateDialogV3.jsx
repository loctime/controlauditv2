import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
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
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
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

const UserCreateDialogV3 = ({ open, onClose, onSuccess, limiteUsuarios, usuariosActuales }) => {
  const theme = useTheme();
  const { userProfile } = useAuth();
  const clienteAdminId = userProfile?.clienteAdminId || userProfile?.uid;

  const [loading, setLoading] = useState(false);
  const [createdUserPending, setCreatedUserPending] = useState(false);
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

  const handleReset = () => {
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

  const handleCreate = async () => {
    // Validaciones
    if (!formData.nombre.trim()) {
      toast.error('El nombre es obligatorio');
      return;
    }
    if (!formData.email.trim()) {
      toast.error('El email es obligatorio');
      return;
    }
    if (formData.password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }
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

      // Manejar resultado según estado
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
  const isFormValid = formData.nombre.trim() !== '' && formData.email.trim() !== '' && formData.password.length >= 6;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      {/* Header */}
      <DialogTitle>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Crear nuevo usuario
          </Typography>
          <Typography variant="body2" color="text.secondary">
            El usuario se creará en esta aplicación con permisos configurables.
            La autorización real depende del backend.
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
          {/* Sección 1: Datos básicos */}
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
              Datos básicos
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
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
            </Box>
          </Box>

          <Divider />

          {/* Sección 2: Permisos */}
          <Box>
            <Box sx={{ mb: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Permisos de interfaz
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Definen qué opciones se muestran en la interfaz. No reemplazan validaciones del backend.
              </Typography>
            </Box>
            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
                {Object.entries(PERMISOS_AGRUPADOS).map(([categoriaKey, categoria]) => (
                  <Box key={categoriaKey}>
                    <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600 }}>
                      {categoria.icon} {categoria.label}
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
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
              </Box>
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Permisos activos: <strong>{permisosActivos}</strong> de {Object.keys(formData.permisos).length}
            </Typography>
          </Box>

          {/* Sección 3: Estado (solo si es pending) */}
          {createdUserPending && (
            <>
              <Divider />
              <Alert severity="warning" icon={<PendingIcon />}>
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
            </>
          )}

          {/* Validación de límite */}
          {!puedeAgregar && (
            <Alert severity="error">
              Has alcanzado el límite de usuarios permitidos ({limiteUsuarios}).
            </Alert>
          )}
        </Box>
      </DialogContent>

      {/* Footer: Acciones */}
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={loading}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handleCreate}
          disabled={loading || !puedeAgregar || !isFormValid}
          startIcon={loading ? <CircularProgress size={16} /> : <CheckCircleIcon />}
        >
          {loading ? 'Creando...' : 'Crear usuario'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UserCreateDialogV3;
