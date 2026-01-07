import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Checkbox,
  IconButton,
  Chip,
  Alert,
  CircularProgress
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { collection, getDocs, doc, deleteDoc, updateDoc, setDoc, query, where } from 'firebase/firestore';
import { db } from '../../../firebaseControlFile';
import { useAuth } from '@/components/context/AuthContext';
import { toast } from 'react-toastify';
import { registrarAccionSistema } from '../../../utils/firestoreUtils';
import Permiso from '../../common/Permiso';
import { usePermiso } from '../../hooks/usePermiso';
import userService from '../../../services/userService';
import OwnerUserCreateDialog from './OwnerUserCreateDialog';
import { getUsers } from '../../../core/services/ownerUserService';

const PERMISOS_LISTA = [
  { key: 'puedeCrearEmpresas', label: 'Crear Empresas' },
  { key: 'puedeCrearSucursales', label: 'Crear Sucursales' },
  { key: 'puedeCrearAuditorias', label: 'Crear Auditorías' },
  { key: 'puedeAgendarAuditorias', label: 'Agendar Auditorías' },
  { key: 'puedeCrearFormularios', label: 'Crear Formularios' },
  { key: 'puedeCompartirFormularios', label: 'Compartir Formularios' }
];

// Los usuarios max solo pueden crear operarios, nunca administradores
// Los roles privilegiados (max/supermax) se crean exclusivamente por script

// Límite de usuarios: SIEMPRE usar userProfile.limiteUsuarios para validación y visualización. No usar sociosMaximos para usuarios.
const UsuariosList = ({ ownerId: propOwnerId, showAddButton = true }) => {
  const { role, userProfile } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [openOwnerDialog, setOpenOwnerDialog] = useState(false);
  const [editando, setEditando] = useState(null);
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

  // Validación de límite de usuarios
  const limiteUsuarios = userProfile?.limiteUsuarios ?? 0;
  const usuariosActuales = Array.isArray(usuarios) ? usuarios.length : 0;
  const puedeAgregar = usuariosActuales < limiteUsuarios || !limiteUsuarios; // Si no hay límite, permitir

  // Obtener ownerId del usuario autenticado (viene del token)
  const ownerId = propOwnerId || userProfile?.ownerId;

  // Cargar usuarios (combina legacy y owner-centric)
  const fetchUsuarios = async () => {
    setLoading(true);
    try {
      if (!ownerId) {
        console.warn('[UsuariosList] No hay ownerId, usando servicio legacy');
        // Fallback a servicio legacy si no hay ownerId
        const lista = await userService.listUsers();
        setUsuarios(Array.isArray(lista) ? lista : []);
        return;
      }

      // Usar servicio owner-centric que combina legacy y owner-centric
      const lista = await getUsers(ownerId);
      setUsuarios(Array.isArray(lista) ? lista : []);
    } catch (error) {
      // No mostrar error si es permission-denied (error visual falso después de crear usuario)
      const isPermissionDenied = 
        error.code === 'permission-denied' ||
        error.message?.includes('permission-denied') ||
        error.message?.includes('Missing or insufficient permissions') ||
        error.response?.data?.error?.includes('permission-denied');
      
      if (isPermissionDenied) {
        console.debug('[UsuariosList] Permission denied al cargar usuarios (esperado después de crear usuario en Core)');
        setUsuarios([]);
      } else {
        console.error('[UsuariosList] Error al cargar usuarios:', error);
        toast.error('Error al cargar usuarios: ' + error.message);
        setUsuarios([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsuarios();
    // eslint-disable-next-line
  }, [ownerId]);

  // Abrir modal para crear/editar usuario
  const handleOpenModal = (usuario = null) => {
    if (usuario) {
      // No permitir editar usuarios legacy (solo lectura)
      if (usuario.legacy) {
        toast.warning('Los usuarios legacy son de solo lectura. No se pueden editar.');
        return;
      }
      
      // Editar usuario: usar diálogo legacy
      setEditando(usuario);
      setFormData({
        email: usuario.email || '',
        password: '',
        nombre: usuario.displayName || '',
        // role no se modifica desde frontend
        permisos: usuario.permisos || {
          puedeCrearEmpresas: false,
          puedeCrearSucursales: false,
          puedeCrearAuditorias: false,
          puedeAgendarAuditorias: false,
          puedeCrearFormularios: false,
          puedeCompartirFormularios: false
        }
      });
      setOpenModal(true);
    } else {
      // Crear usuario nuevo: usar diálogo Core owner-centric
      setOpenOwnerDialog(true);
    }
  };

  // Cerrar modal
  const handleCloseModal = () => {
    setOpenModal(false);
    setEditando(null);
    setFormData({
      email: '',
      password: '',
      nombre: '',
      // role no se envía - el backend lo fuerza a 'operario'
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

  // Manejar cambios en el formulario
  const handleFormChange = (field, value) => {
    // Prevenir loops infinitos con validaciones pesadas
    if (field === 'email' && typeof value === 'string') {
      // Limitar longitud para evitar problemas de rendimiento
      if (value.length > 100) return;
    }
    
    if (field === 'permisos') {
      setFormData(prev => ({
        ...prev,
        permisos: { ...prev.permisos, ...value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  // Crear nuevo usuario usando el backend
  const handleCrearUsuario = async () => {
    if (!formData.email || !formData.password || !formData.nombre) {
      toast.error('Todos los campos son obligatorios');
      return;
    }
    // Validar límite antes de crear
    if (!puedeAgregar) {
      toast.error('Has alcanzado el límite de usuarios permitidos para tu plan.');
      return;
    }

    try {
      // Usar el servicio del backend para crear usuario
      // No enviar role - el backend lo fuerza a 'operario' para usuarios max
      const result = await userService.createUser({
        email: formData.email,
        password: formData.password,
        nombre: formData.nombre,
        // role no se envía - el backend lo fuerza automáticamente
        permisos: formData.permisos,
        ownerId: ownerId || userProfile?.ownerId
      });

      // Registrar log de la acción
      await registrarAccionSistema(
        userProfile?.uid || 'system',
        `Crear usuario: ${formData.email}`,
        { 
          email: formData.email, 
          nombre: formData.nombre, 
          role: 'operario', // Siempre operario desde frontend
          permisos: formData.permisos 
        },
        'crear',
        'usuario',
        result.uid
      );

      toast.success('Usuario creado exitosamente sin desconectar tu sesión');
      handleCloseModal();
      fetchUsuarios();
    } catch (error) {
      toast.error(error.message);
    }
  };

  // Actualizar usuario existente usando el backend
  const handleActualizarUsuario = async () => {
    if (!editando) return;
    try {
      // No permitir cambiar role desde frontend - solo supermax puede hacerlo
      await userService.updateUser(editando.id, {
        displayName: formData.nombre,
        // role no se modifica desde frontend
        permisos: formData.permisos
      });

      // Registrar log de la acción
      await registrarAccionSistema(
        userProfile?.uid || 'system',
        `Editar usuario: ${editando.email}`,
        { 
          email: editando.email,
          nombreAnterior: editando.displayName,
          nombreNuevo: formData.nombre,
          roleAnterior: editando.role,
          roleNuevo: editando.role, // No se modifica desde frontend
          permisosAnteriores: editando.permisos,
          permisosNuevos: formData.permisos
        },
        'editar',
        'usuario',
        editando.id
      );

      toast.success('Usuario actualizado exitosamente');
      handleCloseModal();
      fetchUsuarios();
    } catch (error) {
      console.error('Error al actualizar usuario:', error);
      toast.error(error.message);
    }
  };

  // Eliminar usuario usando el backend
  const handleEliminarUsuario = async (usuario) => {
    if (usuario.id === userProfile?.uid) {
      toast.error('No puedes eliminar tu propia cuenta');
      return;
    }
    
    // No permitir eliminar usuarios legacy (solo lectura)
    if (usuario.legacy) {
      toast.warning('Los usuarios legacy son de solo lectura. No se pueden eliminar.');
      return;
    }
    
    if (window.confirm(`¿Estás seguro de que quieres eliminar al usuario ${usuario.email || usuario.id}?`)) {
      try {
        await userService.deleteUser(usuario.id);

        // Registrar log de la acción
        await registrarAccionSistema(
          userProfile?.uid || 'system',
          `Eliminar usuario: ${usuario.email || usuario.id}`,
          { 
            email: usuario.email,
            nombre: usuario.displayName,
            role: usuario.role,
            permisos: usuario.permisos
          },
          'eliminar',
          'usuario',
          usuario.id
        );

        toast.success('Usuario eliminado exitosamente');
        fetchUsuarios();
      } catch (error) {
        console.error('Error al eliminar usuario:', error);
        toast.error(error.message);
      }
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" component="h2">
          Usuarios
        </Typography>
        {showAddButton && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenModal()}
            disabled={!puedeAgregar}
          >
            Agregar Usuario
          </Button>
        )}
      </Box>
      {/* Mensaje de límite alcanzado */}
      {showAddButton && !puedeAgregar && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Has alcanzado el límite de usuarios permitidos para tu plan ({limiteUsuarios}). Contacta a soporte para ampliarlo.
        </Alert>
      )}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : !Array.isArray(usuarios) || usuarios.length === 0 ? (
        <Alert severity="info">No hay usuarios para mostrar.</Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nombre</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Permisos</TableCell>
                <TableCell>Fecha Creación</TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {usuarios.map((usuario) => (
                <TableRow key={usuario.id}>
                  <TableCell>
                    {usuario.displayName || 'Sin nombre'}
                    {usuario.legacy && (
                      <Chip 
                        label="Legacy" 
                        size="small" 
                        color="warning" 
                        sx={{ ml: 1 }}
                        title="Usuario legacy - Solo lectura"
                      />
                    )}
                  </TableCell>
                  <TableCell>{usuario.email || usuario.id}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {PERMISOS_LISTA.map((permiso) => (
                        <Permiso permiso={permiso.key} key={permiso.key} fallback={null}>
                          {usuario.permisos?.[permiso.key] && (
                            <Chip
                              key={permiso.key}
                              label={permiso.label}
                              size="small"
                              variant="outlined"
                            />
                          )}
                        </Permiso>
                      ))}
                    </Box>
                  </TableCell>
                  <TableCell>
                    {(() => {
                      // Soporta Firestore Timestamp, string ISO o Date
                      const fecha = usuario.createdAt;
                      if (!fecha) return 'N/A';
                      if (typeof fecha === 'string' || fecha instanceof Date) {
                        const d = new Date(fecha);
                        return isNaN(d.getTime()) ? 'N/A' : d.toLocaleDateString('es-ES');
                      }
                      if (fecha.seconds) {
                        // Firestore Timestamp
                        const d = new Date(fecha.seconds * 1000);
                        return d.toLocaleDateString('es-ES');
                      }
                      if (typeof fecha.toDate === 'function') {
                        try {
                          return fecha.toDate().toLocaleDateString('es-ES');
                        } catch {
                          return 'N/A';
                        }
                      }
                      return 'N/A';
                    })()}
                  </TableCell>
                  <TableCell>
                    <IconButton
                      onClick={() => handleOpenModal(usuario)}
                      color="primary"
                      size="small"
                      disabled={usuario.legacy}
                      title={usuario.legacy ? 'Usuario legacy - Solo lectura' : 'Editar usuario'}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      onClick={() => handleEliminarUsuario(usuario)}
                      color="error"
                      size="small"
                      disabled={usuario.id === userProfile?.uid || usuario.legacy}
                      title={usuario.legacy ? 'Usuario legacy - Solo lectura' : usuario.id === userProfile?.uid ? 'No puedes eliminar tu propia cuenta' : 'Eliminar usuario'}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      {/* Diálogo Core para crear usuario nuevo */}
      <OwnerUserCreateDialog
        open={openOwnerDialog}
        onClose={() => setOpenOwnerDialog(false)}
        onSuccess={() => {
          fetchUsuarios();
        }}
      />
      {/* Modal legacy para editar usuario */}
      <Dialog open={openModal} onClose={handleCloseModal} maxWidth="md" fullWidth>
        <DialogTitle>
          {editando ? 'Editar Usuario' : 'Crear Nuevo Usuario'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Nombre completo"
              value={formData.nombre}
              onChange={(e) => handleFormChange('nombre', e.target.value)}
              fullWidth
              required
            />
            <TextField
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => handleFormChange('email', e.target.value)}
              fullWidth
              required
              disabled={!!editando}
              autoComplete="off"
              inputProps={{
                autoComplete: 'off',
                autoCorrect: 'off',
                autoCapitalize: 'off',
                spellCheck: 'false'
              }}
            />
            {!editando && (
              <TextField
                label="Contraseña"
                type="password"
                value={formData.password}
                onChange={(e) => handleFormChange('password', e.target.value)}
                fullWidth
                required
                helperText="Mínimo 6 caracteres"
              />
            )}
            <Alert severity="info" sx={{ mt: 1 }}>
              {editando 
                ? `Rol actual: ${editando.role || 'operario'}. Los roles no se pueden modificar desde el frontend.`
                : 'El usuario se creará con rol Operario. Los administradores se crean exclusivamente mediante scripts del backend.'
              }
            </Alert>
            <Typography variant="h6" sx={{ mt: 2 }}>
              Permisos
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 1 }}>
              {PERMISOS_LISTA.map((permiso) => (
                <Permiso permiso={permiso.key} key={permiso.key} fallback={null}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.permisos[permiso.key] || false}
                        onChange={(e) => handleFormChange('permisos', { [permiso.key]: e.target.checked })}
                      />
                    }
                    label={permiso.label}
                  />
                </Permiso>
              ))}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal}>Cancelar</Button>
          <Button
            onClick={editando ? handleActualizarUsuario : handleCrearUsuario}
            variant="contained"
          >
            {editando ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UsuariosList; 