import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Grid,
  Chip,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import { collection, getDocs, query, where, addDoc, updateDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '../../../../firebaseControlFile';
import { useAuth } from '../../../context/AuthContext';
import Swal from 'sweetalert2';

const EmpleadosContent = ({ sucursalId, sucursalNombre, navigateToPage, reloadSucursalesStats, loadEmpresasStats, userEmpresas }) => {
  const { userProfile } = useAuth();
  const [empleados, setEmpleados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openEmpleadoForm, setOpenEmpleadoForm] = useState(false);
  const [openEditEmpleadoForm, setOpenEditEmpleadoForm] = useState(false);
  const [empleadoEdit, setEmpleadoEdit] = useState(null);
  const [empleadoForm, setEmpleadoForm] = useState({
    nombre: '',
    apellido: '',
    dni: '',
    telefono: '',
    email: '',
    cargo: '',
    area: '',
    fechaIngreso: ''
  });

  useEffect(() => {
    if (sucursalId) {
      loadEmpleados();
    }
  }, [sucursalId]);

  const loadEmpleados = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'empleados'), where('sucursalId', '==', sucursalId));
      const snapshot = await getDocs(q);
      const empleadosData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setEmpleados(empleadosData);
    } catch (error) {
      console.error('Error cargando empleados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEmpleadoFormChange = (e) => {
    const { name, value } = e.target;
    setEmpleadoForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddEmpleado = async () => {
    if (!empleadoForm.nombre.trim() || !empleadoForm.apellido.trim()) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'El nombre y apellido son requeridos'
      });
      return;
    }

    try {
      await addDoc(collection(db, 'empleados'), {
        ...empleadoForm,
        sucursalId: sucursalId,
        sucursalNombre: sucursalNombre,
        estado: 'activo',
        fechaCreacion: Timestamp.now()
      });

      setEmpleadoForm({
        nombre: '',
        apellido: '',
        dni: '',
        telefono: '',
        email: '',
        cargo: '',
        area: '',
        fechaIngreso: ''
      });
      setOpenEmpleadoForm(false);
      
      // Recargar lista de empleados
      await loadEmpleados();

      // Recargar estadísticas de la sucursal
      if (typeof reloadSucursalesStats === 'function') {
        await reloadSucursalesStats();
      }

      // Recargar estadísticas de la empresa completa
      if (typeof loadEmpresasStats === 'function' && userEmpresas) {
        await loadEmpresasStats(userEmpresas);
      }

      Swal.fire({
        icon: 'success',
        title: 'Éxito',
        text: 'Empleado creado exitosamente'
      });
    } catch (error) {
      console.error('Error creando empleado:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Error al crear el empleado: ' + error.message
      });
    }
  };

  const handleVerEmpleado = (empleado) => {
    Swal.fire({
      title: `Detalles de ${empleado.nombre} ${empleado.apellido}`,
      html: `
        <div style="text-align: left;">
          <p><strong>Nombre:</strong> ${empleado.nombre} ${empleado.apellido}</p>
          <p><strong>Email:</strong> ${empleado.email || 'Sin email'}</p>
          <p><strong>Teléfono:</strong> ${empleado.telefono || 'Sin teléfono'}</p>
          <p><strong>DNI:</strong> ${empleado.dni || 'Sin DNI'}</p>
          <p><strong>Cargo:</strong> ${empleado.cargo || 'Sin cargo'}</p>
          <p><strong>Área:</strong> ${empleado.area || 'Sin área'}</p>
          <p><strong>Estado:</strong> ${empleado.estado}</p>
          <p><strong>Fecha de Ingreso:</strong> ${empleado.fechaIngreso || 'Sin fecha'}</p>
        </div>
      `,
      showConfirmButton: true,
      confirmButtonText: 'Cerrar'
    });
  };

  const handleEditarEmpleado = (empleado) => {
    setEmpleadoEdit(empleado);
    setOpenEditEmpleadoForm(true);
  };

  const handleEditEmpleadoFormChange = (e) => {
    const { name, value } = e.target;
    setEmpleadoEdit(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUpdateEmpleado = async () => {
    if (!empleadoEdit.nombre.trim() || !empleadoEdit.apellido.trim()) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'El nombre y apellido son requeridos'
      });
      return;
    }

    try {
      await updateDoc(doc(db, 'empleados', empleadoEdit.id), {
        nombre: empleadoEdit.nombre,
        apellido: empleadoEdit.apellido,
        dni: empleadoEdit.dni,
        telefono: empleadoEdit.telefono,
        email: empleadoEdit.email,
        cargo: empleadoEdit.cargo,
        area: empleadoEdit.area,
        fechaIngreso: empleadoEdit.fechaIngreso,
        fechaActualizacion: Timestamp.now()
      });

      setOpenEditEmpleadoForm(false);
      setEmpleadoEdit(null);
      
      // Recargar lista de empleados
      await loadEmpleados();

      // Recargar estadísticas
      if (typeof reloadSucursalesStats === 'function') {
        await reloadSucursalesStats();
      }

      if (typeof loadEmpresasStats === 'function' && userEmpresas) {
        await loadEmpresasStats(userEmpresas);
      }

      Swal.fire({
        icon: 'success',
        title: 'Éxito',
        text: 'Empleado actualizado exitosamente'
      });
    } catch (error) {
      console.error('Error actualizando empleado:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Error al actualizar el empleado: ' + error.message
      });
    }
  };

  const handleDesactivarEmpleado = async (empleado) => {
    const result = await Swal.fire({
      title: '¿Desactivar empleado?',
      text: `¿Estás seguro de que quieres desactivar a ${empleado.nombre} ${empleado.apellido}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, desactivar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await updateDoc(doc(db, 'empleados', empleado.id), {
          estado: 'inactivo',
          fechaActualizacion: Timestamp.now()
        });

        // Recargar datos
        await loadEmpleados();
        if (typeof reloadSucursalesStats === 'function') {
          await reloadSucursalesStats();
        }
        if (typeof loadEmpresasStats === 'function' && userEmpresas) {
          await loadEmpresasStats(userEmpresas);
        }

        Swal.fire({
          icon: 'success',
          title: 'Empleado desactivado',
          text: `${empleado.nombre} ${empleado.apellido} ha sido desactivado`
        });
      } catch (error) {
        console.error('Error desactivando empleado:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Error al desactivar el empleado'
        });
      }
    }
  };

  const handleEliminarEmpleado = async (empleado) => {
    const result = await Swal.fire({
      title: '¿Eliminar empleado?',
      text: `¿Estás seguro de que quieres eliminar permanentemente a ${empleado.nombre} ${empleado.apellido}? Esta acción no se puede deshacer.`,
      icon: 'error',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await deleteDoc(doc(db, 'empleados', empleado.id));

        // Recargar datos
        await loadEmpleados();
        if (typeof reloadSucursalesStats === 'function') {
          await reloadSucursalesStats();
        }
        if (typeof loadEmpresasStats === 'function' && userEmpresas) {
          await loadEmpresasStats(userEmpresas);
        }

        Swal.fire({
          icon: 'success',
          title: 'Empleado eliminado',
          text: `${empleado.nombre} ${empleado.apellido} ha sido eliminado permanentemente`
        });
      } catch (error) {
        console.error('Error eliminando empleado:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Error al eliminar el empleado'
        });
      }
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Empleados de {sucursalNombre}</Typography>
        <Button
          variant="contained"
          startIcon={<PeopleIcon />}
          onClick={() => setOpenEmpleadoForm(true)}
          size="small"
        >
          Agregar Empleado
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
          <CircularProgress size={30} />
        </Box>
      ) : empleados.length === 0 ? (
        <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', py: 2 }}>
          No hay empleados registrados
        </Typography>
      ) : (
        <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell><strong>Nombre</strong></TableCell>
                <TableCell><strong>Email</strong></TableCell>
                <TableCell><strong>Teléfono</strong></TableCell>
                <TableCell><strong>Cargo</strong></TableCell>
                <TableCell><strong>Estado</strong></TableCell>
                <TableCell align="center"><strong>Acciones</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {empleados.map((empleado) => (
                <TableRow key={empleado.id} hover>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                      {empleado.nombre} {empleado.apellido}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="textSecondary">
                      {empleado.email || 'Sin email'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="textSecondary">
                      {empleado.telefono || 'Sin teléfono'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {empleado.cargo || 'Sin cargo'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={empleado.estado} 
                      color={empleado.estado === 'activo' ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                      <Tooltip title="Ver detalles">
                        <IconButton 
                          size="small" 
                          color="primary"
                          onClick={() => handleVerEmpleado(empleado)}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Editar empleado">
                        <IconButton 
                          size="small" 
                          color="secondary"
                          onClick={() => handleEditarEmpleado(empleado)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Modal para agregar empleado */}
      {openEmpleadoForm && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1300
          }}
          onClick={() => setOpenEmpleadoForm(false)}
        >
          <Paper
            sx={{ p: 3, maxWidth: 600, width: '90%', maxHeight: '90vh', overflow: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <Typography variant="h6" sx={{ mb: 3 }}>
              Agregar Empleado a {sucursalNombre}
            </Typography>
            
            <Grid container spacing={2}>
              {/* Nombre */}
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Nombre *
                </Typography>
                <input
                  type="text"
                  name="nombre"
                  value={empleadoForm.nombre}
                  onChange={handleEmpleadoFormChange}
                  placeholder="Nombre del empleado"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </Grid>

              {/* Apellido */}
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Apellido *
                </Typography>
                <input
                  type="text"
                  name="apellido"
                  value={empleadoForm.apellido}
                  onChange={handleEmpleadoFormChange}
                  placeholder="Apellido del empleado"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </Grid>

              {/* DNI */}
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  DNI
                </Typography>
                <input
                  type="text"
                  name="dni"
                  value={empleadoForm.dni}
                  onChange={handleEmpleadoFormChange}
                  placeholder="Número de DNI"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </Grid>

              {/* Teléfono */}
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Teléfono
                </Typography>
                <input
                  type="text"
                  name="telefono"
                  value={empleadoForm.telefono}
                  onChange={handleEmpleadoFormChange}
                  placeholder="Teléfono de contacto"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </Grid>

              {/* Email */}
              <Grid item xs={12}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Email
                </Typography>
                <input
                  type="email"
                  name="email"
                  value={empleadoForm.email}
                  onChange={handleEmpleadoFormChange}
                  placeholder="Email del empleado"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </Grid>

              {/* Cargo */}
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Cargo
                </Typography>
                <input
                  type="text"
                  name="cargo"
                  value={empleadoForm.cargo}
                  onChange={handleEmpleadoFormChange}
                  placeholder="Cargo o puesto"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </Grid>

              {/* Área */}
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Área
                </Typography>
                <input
                  type="text"
                  name="area"
                  value={empleadoForm.area}
                  onChange={handleEmpleadoFormChange}
                  placeholder="Área o departamento"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </Grid>

              {/* Fecha de Ingreso */}
              <Grid item xs={12}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Fecha de Ingreso
                </Typography>
                <input
                  type="date"
                  name="fechaIngreso"
                  value={empleadoForm.fechaIngreso}
                  onChange={handleEmpleadoFormChange}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </Grid>
            </Grid>

            <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
              <Button
                variant="contained"
                onClick={handleAddEmpleado}
                sx={{ flex: 1 }}
              >
                Crear Empleado
              </Button>
              <Button
                variant="outlined"
                onClick={() => setOpenEmpleadoForm(false)}
                sx={{ flex: 1 }}
              >
                Cancelar
              </Button>
            </Box>
          </Paper>
        </Box>
      )}

      {/* Modal para editar empleado */}
      {openEditEmpleadoForm && empleadoEdit && (
        <Dialog open={openEditEmpleadoForm} onClose={() => setOpenEditEmpleadoForm(false)} maxWidth="md" fullWidth>
          <DialogTitle>Editar Empleado - {empleadoEdit.nombre} {empleadoEdit.apellido}</DialogTitle>
          
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              {/* Nombre */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  label="Nombre"
                  name="nombre"
                  value={empleadoEdit.nombre}
                  onChange={handleEditEmpleadoFormChange}
                />
              </Grid>

              {/* Apellido */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  label="Apellido"
                  name="apellido"
                  value={empleadoEdit.apellido}
                  onChange={handleEditEmpleadoFormChange}
                />
              </Grid>

              {/* DNI */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="DNI"
                  name="dni"
                  value={empleadoEdit.dni}
                  onChange={handleEditEmpleadoFormChange}
                />
              </Grid>

              {/* Teléfono */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Teléfono"
                  name="telefono"
                  value={empleadoEdit.telefono}
                  onChange={handleEditEmpleadoFormChange}
                />
              </Grid>

              {/* Email */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  type="email"
                  value={empleadoEdit.email}
                  onChange={handleEditEmpleadoFormChange}
                />
              </Grid>

              {/* Cargo */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Cargo"
                  name="cargo"
                  value={empleadoEdit.cargo}
                  onChange={handleEditEmpleadoFormChange}
                />
              </Grid>

              {/* Área */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Área"
                  name="area"
                  value={empleadoEdit.area}
                  onChange={handleEditEmpleadoFormChange}
                />
              </Grid>

              {/* Fecha de Ingreso */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Fecha de Ingreso"
                  name="fechaIngreso"
                  type="date"
                  value={empleadoEdit.fechaIngreso}
                  onChange={handleEditEmpleadoFormChange}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              {/* Estado */}
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Estado</InputLabel>
                  <Select
                    name="estado"
                    value={empleadoEdit.estado}
                    onChange={handleEditEmpleadoFormChange}
                    label="Estado"
                  >
                    <MenuItem value="activo">Activo</MenuItem>
                    <MenuItem value="inactivo">Inactivo</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </DialogContent>

          <DialogActions sx={{ p: 3, gap: 1 }}>
            <Button
              variant="outlined"
              color="error"
              onClick={() => handleEliminarEmpleado(empleadoEdit)}
              sx={{ mr: 'auto' }}
            >
              Eliminar
            </Button>
            
            <Button
              variant="outlined"
              color="warning"
              onClick={() => handleDesactivarEmpleado(empleadoEdit)}
            >
              Desactivar
            </Button>
            
            <Button
              variant="outlined"
              onClick={() => setOpenEditEmpleadoForm(false)}
            >
              Cancelar
            </Button>
            
            <Button
              variant="contained"
              onClick={handleUpdateEmpleado}
            >
              Guardar Cambios
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
};

export default EmpleadosContent;
