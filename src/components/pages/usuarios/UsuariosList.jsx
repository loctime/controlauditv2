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
import { db } from '../../../firebaseConfig';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { registrarAccionSistema } from '../../../utils/firestoreUtils';
import Permiso from '../../common/Permiso';
import { usePermiso } from '../../hooks/usePermiso';
import userService from '../../../services/userService';

const PERMISOS_LISTA = [
  { key: 'puedeCrearEmpresas', label: 'Crear Empresas' },
  { key: 'puedeCrearSucursales', label: 'Crear Sucursales' },
  { key: 'puedeCrearAuditorias', label: 'Crear Auditorías' },
  { key: 'puedeAgendarAuditorias', label: 'Agendar Auditorías' },
  { key: 'puedeCrearFormularios', label: 'Crear Formularios' },
  { key: 'puedeCompartirFormularios', label: 'Compartir Formularios' }
];

const ROLES = [
  { value: 'operario', label: 'Usuario' },
  { value: 'max', label: 'Cliente Administrador' },
  { value: 'supermax', label: 'Developer' }
];

// Límite de usuarios: SIEMPRE usar userProfile.limiteUsuarios para validación y visualización. No usar sociosMaximos para usuarios.
const UsuariosList = ({ clienteAdminId, showAddButton = true }) => {
  const { role, userProfile } = useAuth();
  // Filtrado multi-tenant robusto
  let adminId = null;
  if (role === 'supermax') {
    adminId = null; // Ver todos
  } else if (userProfile?.clienteAdminId) {
    adminId = userProfile.clienteAdminId;
  } else {
    adminId = userProfile?.uid;
  }
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
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
  const usuariosActuales = usuarios.length;
  const puedeAgregar = usuariosActuales < limiteUsuarios || !limiteUsuarios; // Si no hay límite, permitir

  // Cargar usuarios usando el backend
  const fetchUsuarios = async () => {
    setLoading(true);
    try {
      // Usar el servicio del backend en lugar de consultas directas a Firestore
      const lista = await userService.listUsers();
      setUsuarios(lista);
    } catch (error) {
      toast.error('Error al cargar usuarios: ' + error.message);
      setUsuarios([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsuarios();
    // eslint-disable-next-line
  }, [clienteAdminId]);

  // Abrir modal para crear/editar usuario
  const handleOpenModal = (usuario = null) => {
    if (usuario) {
      setEditando(usuario);
      setFormData({
        email: usuario.email,
        password: '',
        nombre: usuario.displayName || '',
        role: usuario.role || 'operario',
        permisos: usuario.permisos || {
          puedeCrearEmpresas: false,
          puedeCrearSucursales: false,
          puedeCrearAuditorias: false,
          puedeAgendarAuditorias: false,
          puedeCrearFormularios: false,
          puedeCompartirFormularios: false
        }
      });
    } else {
      setEditando(null);
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
    }
    setOpenModal(true);
  };

  // Cerrar modal
  const handleCloseModal = () => {
    setOpenModal(false);
    setEditando(null);
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
  };

  // Manejar cambios en el formulario
  const handleFormChange = (field, value) => {
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
      const result = await userService.createUser({
        email: formData.email,
        password: formData.password,
        nombre: formData.nombre,
        role: formData.role,
        permisos: formData.permisos,
        clienteAdminId: clienteAdminId || (userProfile?.role === 'max' ? userProfile?.uid : null)
      });

      // Registrar log de la acción
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
      await userService.updateUser(editando.id, {
        displayName: formData.nombre,
        role: formData.role,
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
          roleNuevo: formData.role,
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
    if (window.confirm(`¿Estás seguro de que quieres eliminar al usuario ${usuario.email}?`)) {
      try {
        await userService.deleteUser(usuario.id);

        // Registrar log de la acción
        await registrarAccionSistema(
          userProfile?.uid || 'system',
          `Eliminar usuario: ${usuario.email}`,
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
      ) : usuarios.length === 0 ? (
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
                  <TableCell>{usuario.displayName || 'Sin nombre'}</TableCell>
                  <TableCell>{usuario.email}</TableCell>
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
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      onClick={() => handleEliminarUsuario(usuario)}
                      color="error"
                      size="small"
                      disabled={usuario.id === userProfile?.uid}
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
      {/* Modal para crear/editar usuario */}
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
            <TextField
              select
              label="Rol"
              value={formData.role}
              onChange={(e) => handleFormChange('role', e.target.value)}
              fullWidth
              SelectProps={{ native: true }}
            >
              {ROLES.map((rol) => (
                <option key={rol.value} value={rol.value}>
                  {rol.label}
                </option>
              ))}
            </TextField>
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