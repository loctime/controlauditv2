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
  Typography
} from "@mui/material";
import { Add, Person, PersonOff } from "@mui/icons-material";
import { toast } from 'react-toastify';
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../../../firebaseAudit";
import { useAuth } from "../../../context/AuthContext";

const AgendarAuditoriaDialog = ({ open, onClose, onSave, empresas, sucursales, formularios, fechaPreestablecida }) => {
  const { userProfile } = useAuth();
  const [form, setForm] = useState({
    empresa: '',
    sucursal: '',
    formulario: '',
    fecha: '',
    hora: '',
    descripcion: '',
    encargado: '' // Nuevo campo para el encargado
  });
  const [usuariosOperarios, setUsuariosOperarios] = useState([]);
  const [cargandoUsuarios, setCargandoUsuarios] = useState(false);

  // Función para obtener el nombre del días
  const getNombreDia = (fechaStr) => {
    if (!fechaStr) return '';
    const fecha = new Date(fechaStr);
    const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return dias[fecha.getDay()];
  };

  // Cargar usuarios operarios disponibles
  const cargarUsuariosOperarios = async () => {
    if (!userProfile) return;
    
    setCargandoUsuarios(true);
    try {
      console.log('[DEBUG] Cargando usuarios operarios para clienteAdminId:', userProfile.clienteAdminId || userProfile.uid);
      
      // Query para obtener usuarios operarios del mismo cliente
      const q = query(
        collection(db, "apps", "audit", "users"),
        where("clienteAdminId", "==", userProfile.clienteAdminId || userProfile.uid),
        where("role", "==", "operario")
      );
      
      const querySnapshot = await getDocs(q);
      const usuarios = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log(`[DEBUG] ${usuarios.length} usuarios operarios cargados`);
      setUsuariosOperarios(usuarios);
    } catch (error) {
      console.error('[ERROR] Error al cargar usuarios operarios:', error);
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

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.empresa || !form.formulario || !form.fecha || !form.hora) {
      toast.error('Por favor completa todos los campos obligatorios');
      return;
    }
    onSave(form);
    setForm({ empresa: '', sucursal: '', formulario: '', fecha: '', hora: '', descripcion: '', encargado: '' });
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
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
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
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Sucursal (Opcional)</InputLabel>
                <Select
                  name="sucursal"
                  value={form.sucursal}
                  onChange={handleChange}
                  label="Sucursal (Opcional)"
                >
                  <MenuItem value="">Casa Central</MenuItem>
                  {sucursales
                    .filter(sucursal => !form.empresa || sucursal.empresa === form.empresa)
                    .map((sucursal) => (
                      <MenuItem key={sucursal.id} value={sucursal.nombre}>
                        {sucursal.nombre}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
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
          <Button onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant="contained">
            Agendar Auditoría
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default AgendarAuditoriaDialog; 