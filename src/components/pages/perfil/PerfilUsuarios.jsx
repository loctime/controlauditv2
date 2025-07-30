import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Alert, 
  useTheme, 
  useMediaQuery, 
  alpha, 
  Button,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  CircularProgress
} from '@mui/material';
import { Group as GroupIcon, PersonAdd as PersonAddIcon } from '@mui/icons-material';
import UsuariosList from '../usuarios/UsuariosList';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import userService from '../../../services/userService';
import { registrarAccionSistema } from '../../../utils/firestoreUtils';

const PerfilUsuarios = ({ usuariosCreados, loading }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Log de depuración
  const { userProfile } = useAuth();
  const clienteAdminId = userProfile?.clienteAdminId || userProfile?.uid;
  console.debug('[PerfilUsuarios] usuariosCreados:', usuariosCreados);

  // Estado para el modal de agregar usuario
  const [openModal, setOpenModal] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    nombre: '',
    role: 'operario',
    permisos: {
      puedeCrearEmpresas: false,
      puedeCrearSucursales: false,
      puedeCrearAuditorias: false,
      puedeAgendarAuditorias: false,
      puedeCrearFormularios: false,
      puedeCompartirFormularios: false
    }
  });
  const [loadingCreate, setLoadingCreate] = useState(false);

  // Validación de límite de usuarios
  const limiteUsuarios = userProfile?.limiteUsuarios ?? 0;
  const usuariosActuales = usuariosCreados?.length || 0;
  const puedeAgregar = usuariosActuales < limiteUsuarios || !limiteUsuarios;

  // ROLES disponibles
  const ROLES = [
    { value: 'operario', label: 'Operario' },
    { value: 'max', label: 'Administrador' }
  ];

  // PERMISOS disponibles
  const PERMISOS_LISTA = [
    { key: 'puedeCrearEmpresas', label: 'Crear Empresas' },
    { key: 'puedeCrearSucursales', label: 'Crear Sucursales' },
    { key: 'puedeCrearAuditorias', label: 'Crear Auditorías' },
    { key: 'puedeAgendarAuditorias', label: 'Agendar Auditorías' },
    { key: 'puedeCrearFormularios', label: 'Crear Formularios' },
    { key: 'puedeCompartirFormularios', label: 'Compartir Formularios' }
  ];
  
  return (
    <Box sx={{ 
      p: isSmallMobile ? 1 : 3,
      bgcolor: 'background.paper',
      borderRadius: 3,
      border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
      boxShadow: '0 2px 12px rgba(0,0,0,0.08)'
    }}>
      {/* Header con título y botón de agregar usuario */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: isSmallMobile ? 3 : 4,
        flexDirection: isMobile ? 'column' : 'row',
        gap: isSmallMobile ? 2 : 3
      }}>
        <Box sx={{ textAlign: isMobile ? 'center' : 'left' }}>
          <Typography 
            variant={isSmallMobile ? "h5" : "h4"} 
            sx={{ 
              fontWeight: 700, 
              color: 'primary.main',
              mb: 1
            }}
          >
            👥 Mis Usuarios
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {usuariosCreados?.length || 0} usuario(s) registrado(s)
          </Typography>
          {!puedeAgregar && (
            <Alert severity="warning" sx={{ mt: 1 }}>
              Has alcanzado el límite de usuarios permitidos para tu plan ({limiteUsuarios}). Contacta a soporte para ampliarlo.
            </Alert>
          )}
        </Box>
        
        <Button
          variant="contained"
          color="primary"
          startIcon={<PersonAddIcon />}
          onClick={() => {
            if (!puedeAgregar) {
              toast.error('Has alcanzado el límite de usuarios permitidos para tu plan.');
              return;
            }
            setOpenModal(true);
          }}
          disabled={!puedeAgregar}
          sx={{ 
            py: isSmallMobile ? 1.5 : 2,
            px: isSmallMobile ? 3 : 4,
            fontSize: isSmallMobile ? '0.875rem' : '1rem',
            fontWeight: 600,
            borderRadius: 2,
            '&:hover': {
              transform: 'translateY(-1px)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              transition: 'all 0.2s ease'
            },
            transition: 'all 0.2s ease'
          }}
        >
          ➕ Agregar Usuario
        </Button>
      </Box>
      
      {/* Contenido de usuarios */}
      {loading ? (
        <Box sx={{
          bgcolor: alpha(theme.palette.info.main, 0.05),
          borderRadius: 2,
          p: isSmallMobile ? 3 : 4,
          border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`,
          textAlign: 'center'
        }}>
          <Typography variant="body1" color="info.main">
            Cargando usuarios...
          </Typography>
        </Box>
      ) : !usuariosCreados || usuariosCreados.length === 0 ? (
        <Box sx={{
          bgcolor: alpha(theme.palette.warning.main, 0.05),
          borderRadius: 2,
          p: isSmallMobile ? 3 : 4,
          border: `1px solid ${alpha(theme.palette.warning.main, 0.1)}`,
          textAlign: 'center'
        }}>
          <GroupIcon sx={{ fontSize: 48, color: 'warning.main', mb: 2 }} />
          <Typography variant="h6" color="warning.main" sx={{ mb: 1 }}>
            No hay usuarios para mostrar
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Comienza agregando usuarios para gestionar tu equipo
          </Typography>
        </Box>
      ) : (
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: isSmallMobile ? 2 : 3 
        }}>
          <UsuariosList clienteAdminId={clienteAdminId} showAddButton={false} />
        </Box>
      )}

      {/* Modal para agregar usuario */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="md" fullWidth>
        <DialogTitle>Crear Nuevo Usuario</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Nombre completo"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Contraseña"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              fullWidth
              required
              helperText="Mínimo 6 caracteres"
            />
            <FormControl fullWidth>
              <InputLabel>Rol</InputLabel>
              <Select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                label="Rol"
              >
                {ROLES.map((rol) => (
                  <MenuItem key={rol.value} value={rol.value}>
                    {rol.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Typography variant="h6" sx={{ mt: 2 }}>
              Permisos
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 1 }}>
              {PERMISOS_LISTA.map((permiso) => (
                <FormControlLabel
                  key={permiso.key}
                  control={
                    <Checkbox
                      checked={formData.permisos[permiso.key] || false}
                      onChange={(e) => setFormData({
                        ...formData,
                        permisos: { ...formData.permisos, [permiso.key]: e.target.checked }
                      })}
                    />
                  }
                  label={permiso.label}
                />
              ))}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenModal(false)}>Cancelar</Button>
          <Button
            onClick={async () => {
              if (!formData.email || !formData.password || !formData.nombre) {
                toast.error('Todos los campos son obligatorios');
                return;
              }
              if (!puedeAgregar) {
                toast.error('Has alcanzado el límite de usuarios permitidos para tu plan.');
                return;
              }

              setLoadingCreate(true);
              try {
                const result = await userService.createUser({
                  email: formData.email,
                  password: formData.password,
                  nombre: formData.nombre,
                  role: formData.role,
                  permisos: formData.permisos,
                  clienteAdminId: clienteAdminId
                });

                await registrarAccionSistema(
                  userProfile?.uid || 'system',
                  `Crear usuario: ${formData.email}`,
                  { 
                    email: formData.email, 
                    nombre: formData.nombre, 
                    role: formData.role,
                    permisos: formData.permisos 
                  },
                  'crear',
                  'usuario',
                  result.uid
                );

                toast.success('Usuario creado exitosamente');
                setOpenModal(false);
                setFormData({
                  email: '',
                  password: '',
                  nombre: '',
                  role: 'operario',
                  permisos: {
                    puedeCrearEmpresas: false,
                    puedeCrearSucursales: false,
                    puedeCrearAuditorias: false,
                    puedeAgendarAuditorias: false,
                    puedeCrearFormularios: false,
                    puedeCompartirFormularios: false
                  }
                });
                // Recargar la página para mostrar el nuevo usuario
                window.location.reload();
              } catch (error) {
                toast.error(error.message);
              } finally {
                setLoadingCreate(false);
              }
            }}
            variant="contained"
            disabled={loadingCreate}
          >
            {loadingCreate ? <CircularProgress size={20} /> : 'Crear Usuario'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PerfilUsuarios;
