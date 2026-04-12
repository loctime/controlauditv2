import logger from '@/utils/logger';
// src/components/pages/admin/components/AgendarAuditoriaDialog.jsx
import React, { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  Box,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Chip,
  Avatar,
  Typography,
  CircularProgress
} from "@mui/material";
import { Add, Person, PersonOff } from "@mui/icons-material";
import { toast } from 'react-toastify';
import { getDocs, query, where, collection } from "firebase/firestore";
import { dbAudit } from "../../../../firebaseControlFile";
import { firestoreRoutesCore } from "../../../../core/firestore/firestoreRoutes.core";
import { useAuth } from '@/components/context/AuthContext';

const AgendarAuditoriaDialog = ({ open, onClose, onSave, empresas, sucursales, formularios, fechaPreestablecida }) => {
  const { userProfile } = useAuth();
  const [form, setForm] = useState({
    empresa: '',
    empresaId: '',
    sucursal: '',
    formulario: '',
    formularioId: '',
    fecha: '',
    hora: '09:00',
    descripcion: '',
    encargado: ''
  });
  const [usuariosOperarios, setUsuariosOperarios] = useState([]);
  const [cargandoUsuarios, setCargandoUsuarios] = useState(false);
  const [guardando, setGuardando] = useState(false);

  // Función para obtener el nombre del días
  const getNombreDia = (fechaStr) => {
    if (!fechaStr) return '';
    const fecha = new Date(fechaStr);
    const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return dias[fecha.getDay()];
  };

  // Cargar usuarios operarios disponibles
  const cargarUsuariosOperarios = async () => {
    if (!userProfile?.ownerId) return;
    
    setCargandoUsuarios(true);
    try {
      const ownerId = userProfile.ownerId;
      logger.debug('[DEBUG] Cargando usuarios operarios para ownerId:', ownerId);
      
      // Query para obtener usuarios operarios del mismo owner (owner-centric)
      const usuariosRef = collection(dbAudit, ...firestoreRoutesCore.usuarios(ownerId));
      const q = query(
        usuariosRef,
        where("role", "==", "operario")
      );
      
      const querySnapshot = await getDocs(q);
      const usuarios = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      logger.debug(`[DEBUG] ${usuarios.length} usuarios operarios cargados`);
      setUsuariosOperarios(usuarios);
    } catch (error) {
      logger.error('[ERROR] Error al cargar usuarios operarios:', error);
      toast.error('Error al cargar la lista de usuarios');
    } finally {
      setCargandoUsuarios(false);
    }
  };

  // Actualizar el formulario cuando cambie la fecha preestablecida
  useEffect(() => {
    if (fechaPreestablecida) {
      setForm(prev => ({
        ...prev,
        fecha: fechaPreestablecida
      }));
    }
  }, [fechaPreestablecida]);

  // Cargar usuarios operarios cuando se abre el diálogo
  useEffect(() => {
    if (open) {
      cargarUsuariosOperarios();
    }
  }, [open, userProfile]);

  // Efecto para manejar selección automática de empresa y formulario
  useEffect(() => {
    if (empresas.length === 1) {
      setForm(prev => ({ ...prev, empresa: empresas[0].nombre, empresaId: empresas[0].id }));
    }
    if (formularios.length === 1) {
      setForm(prev => ({ ...prev, formulario: formularios[0].nombre, formularioId: formularios[0].id }));
    }
  }, [empresas, formularios]);

  // Efecto para manejar selección automática de sucursal
  useEffect(() => {
    if (form.empresaId) {
      const sucursalesFiltradas = sucursales.filter(s => s.empresaId === form.empresaId);
      if (sucursalesFiltradas.length === 1) {
        setForm(prev => ({ ...prev, sucursal: sucursalesFiltradas[0].nombre }));
      } else if (sucursalesFiltradas.length > 1) {
        setForm(prev => ({ ...prev, sucursal: '' }));
      }
    }
  }, [form.empresaId, sucursales]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'empresa') {
      const emp = empresas.find(emp => emp.nombre === value);
      setForm(prev => ({ ...prev, empresa: value, empresaId: emp?.id || '', sucursal: '' }));
    } else if (name === 'formulario') {
      const form_ = formularios.find(f => f.nombre === value);
      setForm(prev => ({ ...prev, formulario: value, formularioId: form_?.id || '' }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.empresa || !form.formulario || !form.fecha || !form.hora) {
      toast.error('Por favor completa todos los campos obligatorios');
      return;
    }
    
    setGuardando(true);
    try {
      await onSave(form);
      // Limpiar formulario y cerrar modal después de guardar exitosamente
      setForm({ empresa: '', empresaId: '', sucursal: '', formulario: '', formularioId: '', fecha: '', hora: '', descripcion: '', encargado: '' });
      onClose();
    } catch (error) {
      console.error('Error al guardar auditoría:', error);
      toast.error('Error al guardar la auditoría');
    } finally {
      setGuardando(false);
    }
  };

  // Función para obtener el nombre del usuario
  const getNombreUsuario = (userId) => {
    const usuario = usuariosOperarios.find(u => u.id === userId);
    return usuario ? (usuario.displayName || usuario.email) : 'Usuario no encontrado';
  };

  // Función para obtener el email del usuario
  const getEmailUsuario = (userId) => {
    const usuario = usuariosOperarios.find(u => u.id === userId);
    return usuario ? usuario.email : '';
  };

  return (
    <Dialog open={open} onClose={guardando ? null : onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <Add color="primary" />
          Agendar Nueva Auditoría
        </Box>
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Empresa</InputLabel>
                <Select
                  name="empresa"
                  value={form.empresa}
                  onChange={handleChange}
                  label="Empresa"
                >
                  {empresas.map((empresa) => (
                    <MenuItem key={empresa.id} value={empresa.nombre}>
                      {empresa.nombre}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              {empresas.length === 0 && (
                <Box sx={{ mt: 1 }}>
                  <Button 
                    variant="outlined" 
                    size="small" 
                    fullWidth
                    onClick={() => window.open('/admin/empresas', '_blank')}
                  >
                    Crear Empresa
                  </Button>
                </Box>
              )}
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Sucursal</InputLabel>
                <Select
                  name="sucursal"
                  value={form.sucursal}
                  onChange={handleChange}
                  label="Sucursal"
                >
                  {sucursales
                    .filter(sucursal => !form.empresaId || sucursal.empresaId === form.empresaId)
                    .map((sucursal) => (
                      <MenuItem key={sucursal.id} value={sucursal.nombre}>
                        {sucursal.nombre}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
              {form.empresaId && sucursales.filter(s => s.empresaId === form.empresaId).length === 0 && (
                <Box sx={{ mt: 1 }}>
                  <Button 
                    variant="outlined" 
                    size="small" 
                    fullWidth
                    onClick={() => window.open('/admin/sucursales', '_blank')}
                  >
                    Crear Sucursal
                  </Button>
                </Box>
              )}
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Formulario</InputLabel>
                <Select
                  name="formulario"
                  value={form.formulario}
                  onChange={handleChange}
                  label="Formulario"
                >
                  {formularios.map((formulario) => (
                    <MenuItem key={formulario.id} value={formulario.nombre}>
                      {formulario.nombre}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              {formularios.length === 0 && (
                <Box sx={{ mt: 1 }}>
                  <Button 
                    variant="outlined" 
                    size="small" 
                    fullWidth
                    onClick={() => window.open('/admin/formularios', '_blank')}
                  >
                    Crear Formulario
                  </Button>
                </Box>
              )}
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Encargado (Opcional)</InputLabel>
                <Select
                  name="encargado"
                  value={form.encargado}
                  onChange={handleChange}
                  label="Encargado (Opcional)"
                  disabled={cargandoUsuarios}
                >
                  <MenuItem value="">
                    <Box display="flex" alignItems="center" gap={1}>
                      <PersonOff color="action" />
                      <Typography variant="body2" color="text.secondary" component="span">
                        Sin especificar
                      </Typography>
                    </Box>
                  </MenuItem>
                  {usuariosOperarios.map((usuario) => (
                    <MenuItem key={usuario.id} value={usuario.id}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>
                          {usuario.displayName ? usuario.displayName.charAt(0).toUpperCase() : usuario.email.charAt(0).toUpperCase()}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 500 }} component="span">
                            {usuario.displayName || 'Sin nombre'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" component="span">
                            {usuario.email}
                          </Typography>
                        </Box>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <TextField
                  fullWidth
                  required
                  name="fecha"
                  label="Fecha"
                  type="date"
                  value={form.fecha}
                  onChange={handleChange}
                  InputLabelProps={{ shrink: true }}
                />
                {form.fecha && (
                  <Chip
                    label={getNombreDia(form.fecha)}
                    color="primary"
                    variant="outlined"
                    sx={{ minWidth: 80, fontWeight: 'bold' }}
                  />
                )}
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                name="hora"
                label="Hora"
                type="time"
                value={form.hora}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                name="descripcion"
                label="Descripción (Opcional)"
                multiline
                rows={3}
                value={form.descripcion}
                onChange={handleChange}
                placeholder="Agregar notas o detalles sobre la auditoría..."
              />
            </Grid>

            {/* Mostrar información del encargado seleccionado */}
            {form.encargado && (
              <Grid item xs={12}>
                <Box sx={{ 
                  p: 2, 
                  bgcolor: 'primary.light', 
                  borderRadius: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2
                }}>
                  <Person color="primary" />
                  <Box>
                    <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 600 }} component="div">
                      Encargado asignado:
                    </Typography>
                    <Typography variant="body2" component="span">
                      {getNombreUsuario(form.encargado)} ({getEmailUsuario(form.encargado)})
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={guardando}>
            Cancelar
          </Button>
          <Button 
            type="submit" 
            variant="contained" 
            disabled={guardando}
            startIcon={guardando ? <CircularProgress size={20} /> : <Add />}
          >
            {guardando ? 'Guardando...' : 'Agendar Auditoría'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default AgendarAuditoriaDialog;