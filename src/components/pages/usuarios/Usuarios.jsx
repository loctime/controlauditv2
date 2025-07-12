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
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { collection, getDocs, doc, deleteDoc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../../../firebaseConfig';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../../firebaseConfig';

const PERMISOS_LISTA = [
  { key: 'puedeCrearEmpresas', label: 'Crear Empresas' },
  { key: 'puedeCrearSucursales', label: 'Crear Sucursales' },
  { key: 'puedeCrearAuditorias', label: 'Crear Auditorías' },
  { key: 'puedeCompartirAuditorias', label: 'Compartir Auditorías' },
  { key: 'puedeAgregarSocios', label: 'Agregar Socios' }
];

const ROLES = [
  { value: 'operario', label: 'Usuario' },
  { value: 'max', label: 'Cliente Administrador' },
  { value: 'supermax', label: 'Developer' }
];

const Usuarios = () => {
  const { role, userProfile } = useAuth();
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
      puedeCompartirAuditorias: false,
      puedeAgregarSocios: false
    }
  });

  // Cargar usuarios
  const fetchUsuarios = async () => {
    setLoading(true);
    try {
      const usuariosRef = collection(db, 'usuarios');
      const snapshot = await getDocs(usuariosRef);
      const lista = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsuarios(lista);
    } catch (error) {
      toast.error('Error al cargar usuarios');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsuarios();
  }, []);

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
          puedeCompartirAuditorias: false,
          puedeAgregarSocios: false
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
          puedeCompartirAuditorias: false,
          puedeAgregarSocios: false
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
        puedeCompartirAuditorias: false,
        puedeAgregarSocios: false
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

  // Crear nuevo usuario
  const handleCrearUsuario = async () => {
    if (!formData.email || !formData.password || !formData.nombre) {
      toast.error('Todos los campos son obligatorios');
      return;
    }

    try {
      // Crear usuario en Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      // Crear perfil en Firestore
      const userProfile = {
        uid: userCredential.user.uid,
        email: formData.email,
        displayName: formData.nombre,
        role: formData.role,
        permisos: formData.permisos,
        createdAt: new Date(),
        empresas: [],
        auditorias: [],
        socios: [],
        configuracion: {
          notificaciones: true,
          tema: 'light'
        }
      };

      // Guardar en Firestore usando setDoc en lugar de updateDoc
      await setDoc(doc(db, 'usuarios', userCredential.user.uid), userProfile);

      toast.success('Usuario creado exitosamente');
      handleCloseModal();
      fetchUsuarios();
    } catch (error) {
      console.error('Error al crear usuario:', error);
      let errorMessage = 'Error al crear usuario';
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'El correo electrónico ya está en uso';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'La contraseña es muy débil';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Correo electrónico inválido';
      }
      
      toast.error(errorMessage);
    }
  };

  // Actualizar usuario existente
  const handleActualizarUsuario = async () => {
    if (!editando) return;

    try {
      const userRef = doc(db, 'usuarios', editando.id);
      await updateDoc(userRef, {
        displayName: formData.nombre,
        role: formData.role,
        permisos: formData.permisos
      });

      toast.success('Usuario actualizado exitosamente');
      handleCloseModal();
      fetchUsuarios();
    } catch (error) {
      console.error('Error al actualizar usuario:', error);
      toast.error('Error al actualizar usuario');
    }
  };

  // Eliminar usuario
  const handleEliminarUsuario = async (usuario) => {
    if (usuario.id === userProfile?.uid) {
      toast.error('No puedes eliminar tu propia cuenta');
      return;
    }

    if (window.confirm(`¿Estás seguro de que quieres eliminar al usuario ${usuario.email}?`)) {
      try {
        await deleteDoc(doc(db, 'usuarios', usuario.id));
        toast.success('Usuario eliminado exitosamente');
        fetchUsuarios();
      } catch (error) {
        console.error('Error al eliminar usuario:', error);
        toast.error('Error al eliminar usuario');
      }
    }
  };

  // Verificar permisos
  if (role !== 'max' && role !== 'supermax') {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          No tienes permisos para acceder a esta página. Solo administradores pueden gestionar usuarios.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Gestión de Usuarios
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenModal()}
        >
          Agregar Usuario
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nombre</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Rol</TableCell>
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
                    <Chip
                      label={ROLES.find(r => r.value === usuario.role)?.label || usuario.role}
                      color={usuario.role === 'supermax' ? 'error' : usuario.role === 'max' ? 'warning' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {PERMISOS_LISTA.map((permiso) => (
                        usuario.permisos?.[permiso.key] && (
                          <Chip
                            key={permiso.key}
                            label={permiso.label}
                            size="small"
                            variant="outlined"
                          />
                        )
                      ))}
                    </Box>
                  </TableCell>
                  <TableCell>
                    {usuario.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'}
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
                <FormControlLabel
                  key={permiso.key}
                  control={
                    <Checkbox
                      checked={formData.permisos[permiso.key] || false}
                      onChange={(e) => handleFormChange('permisos', { [permiso.key]: e.target.checked })}
                    />
                  }
                  label={permiso.label}
                />
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

export default Usuarios;
