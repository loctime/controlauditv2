// src/components/pages/admin/components/RecurringScheduler/CreateRecurringDialog.jsx
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
  Typography,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Chip,
  Avatar
} from "@mui/material";
import { Add, Repeat, Person, PersonOff } from "@mui/icons-material";
import { recurringService } from "../../../../../services/recurringService";
import { useAuth } from "../../../../context/AuthContext";
import { useGlobalSelection } from "../../../../../hooks/useGlobalSelection";
import { toast } from 'react-toastify';
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../../../../firebaseConfig";

const CreateRecurringDialog = ({ open, onClose, onSave, recurringToEdit = null, empresas, sucursales, formularios }) => {
  const { userProfile } = useAuth();
  const { selectedEmpresa } = useGlobalSelection();
  const [usuariosOperarios, setUsuariosOperarios] = useState([]);
  const [cargandoUsuarios, setCargandoUsuarios] = useState(false);

  const [form, setForm] = useState({
    nombre: '',
    empresaId: '',
    empresaNombre: '',
    sucursalId: '',
    sucursalNombre: '',
    formularioId: '',
    formularioNombre: '',
    encargadoId: '',
    frecuencia: {
      tipo: 'semanal',
      diasSemana: [],
      diaMes: null,
      intervalo: 1
    },
    hora: '09:00',
    fechaInicio: new Date().toISOString().split('T')[0],
    fechaFin: '',
    activa: true
  });

  const [errors, setErrors] = useState({});

  const diasSemana = [
    { value: 1, label: 'Lunes' },
    { value: 2, label: 'Martes' },
    { value: 3, label: 'Miércoles' },
    { value: 4, label: 'Jueves' },
    { value: 5, label: 'Viernes' },
    { value: 6, label: 'Sábado' },
    { value: 7, label: 'Domingo' }
  ];

  useEffect(() => {
    if (open && userProfile) {
      cargarUsuariosOperarios();
    }
  }, [open, userProfile]);

  useEffect(() => {
    if (recurringToEdit && open) {
      setForm({
        nombre: recurringToEdit.nombre || '',
        empresaId: recurringToEdit.empresaId || '',
        empresaNombre: recurringToEdit.empresaNombre || '',
        sucursalId: recurringToEdit.sucursalId || '',
        sucursalNombre: recurringToEdit.sucursalNombre || '',
        formularioId: recurringToEdit.formularioId || '',
        formularioNombre: recurringToEdit.formularioNombre || '',
        encargadoId: recurringToEdit.encargadoId || '',
        frecuencia: recurringToEdit.frecuencia || {
          tipo: 'semanal',
          diasSemana: [],
          diaMes: null,
          intervalo: 1
        },
        hora: recurringToEdit.hora || '09:00',
        fechaInicio: recurringToEdit.fechaInicio || new Date().toISOString().split('T')[0],
        fechaFin: recurringToEdit.fechaFin || '',
        activa: recurringToEdit.activa !== undefined ? recurringToEdit.activa : true
      });
      setErrors({});
    } else if (open) {
      setForm({
        nombre: '',
        empresaId: selectedEmpresa && selectedEmpresa !== 'todas' ? selectedEmpresa : '',
        empresaNombre: '',
        sucursalId: '',
        sucursalNombre: '',
        formularioId: '',
        formularioNombre: '',
        encargadoId: '',
        frecuencia: {
          tipo: 'semanal',
          diasSemana: [],
          diaMes: null,
          intervalo: 1
        },
        hora: '09:00',
        fechaInicio: new Date().toISOString().split('T')[0],
        fechaFin: '',
        activa: true
      });
      setErrors({});
    }
  }, [recurringToEdit, open, selectedEmpresa]);

  const cargarUsuariosOperarios = async () => {
    if (!userProfile) return;
    
    setCargandoUsuarios(true);
    try {
      const q = query(
        collection(db, "usuarios"),
        where("clienteAdminId", "==", userProfile.clienteAdminId || userProfile.uid),
        where("role", "==", "operario")
      );
      
      const querySnapshot = await getDocs(q);
      const usuarios = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setUsuariosOperarios(usuarios);
    } catch (error) {
      console.error('Error al cargar usuarios operarios:', error);
    } finally {
      setCargandoUsuarios(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => {
      const updated = { ...prev, [name]: value };

      if (name === 'empresaId') {
        const empresa = empresas?.find(e => e.id === value);
        updated.empresaNombre = empresa?.nombre || '';
        if (value !== prev.empresaId) {
          updated.sucursalId = '';
          updated.sucursalNombre = '';
        }
      }
      if (name === 'sucursalId') {
        const sucursal = sucursales?.find(s => s.id === value);
        updated.sucursalNombre = sucursal?.nombre || '';
      }
      if (name === 'formularioId') {
        const formulario = formularios?.find(f => f.id === value);
        updated.formularioNombre = formulario?.nombre || '';
      }

      return updated;
    });
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleFrecuenciaChange = (field, value) => {
    setForm(prev => ({
      ...prev,
      frecuencia: {
        ...prev.frecuencia,
        [field]: value
      }
    }));
  };

  const handleDiaSemanaToggle = (dia) => {
    setForm(prev => {
      const diasSemana = prev.frecuencia.diasSemana || [];
      const index = diasSemana.indexOf(dia);
      const nuevosDias = index >= 0
        ? diasSemana.filter(d => d !== dia)
        : [...diasSemana, dia].sort();
      
      return {
        ...prev,
        frecuencia: {
          ...prev.frecuencia,
          diasSemana: nuevosDias
        }
      };
    });
  };

  const validateForm = () => {
    const newErrors = {};

    if (!form.nombre.trim()) {
      newErrors.nombre = 'Nombre es requerido';
    }
    if (!form.empresaId) {
      newErrors.empresaId = 'Empresa es requerida';
    }
    if (!form.formularioId) {
      newErrors.formularioId = 'Formulario es requerido';
    }
    if (form.frecuencia.tipo === 'semanal' && (!form.frecuencia.diasSemana || form.frecuencia.diasSemana.length === 0)) {
      newErrors.diasSemana = 'Selecciona al menos un día de la semana';
    }
    if (form.frecuencia.tipo === 'mensual' && !form.frecuencia.diaMes) {
      newErrors.diaMes = 'Día del mes es requerido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      const recurringData = {
        ...form,
        clienteAdminId: userProfile?.clienteAdminId || userProfile?.uid
      };

      if (recurringToEdit) {
        await recurringService.updateRecurring(recurringToEdit.id, recurringData);
      } else {
        await recurringService.createRecurring(recurringData);
      }

      if (onSave) {
        onSave();
      }
      onClose();
    } catch (error) {
      console.error('Error guardando programación recurrente:', error);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <Add color="primary" />
          {recurringToEdit ? 'Editar Programación Recurrente' : 'Crear Programación Recurrente'}
        </Box>
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                name="nombre"
                label="Nombre descriptivo"
                value={form.nombre}
                onChange={handleChange}
                error={!!errors.nombre}
                helperText={errors.nombre || 'Ej: Auditoría Semanal Lunes 9AM'}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth required error={!!errors.empresaId}>
                <InputLabel>Empresa</InputLabel>
                <Select
                  name="empresaId"
                  value={form.empresaId}
                  onChange={handleChange}
                  label="Empresa"
                >
                  {empresas?.map(empresa => (
                    <MenuItem key={empresa.id} value={empresa.id}>
                      {empresa.nombre}
                    </MenuItem>
                  ))}
                </Select>
                {errors.empresaId && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                    {errors.empresaId}
                  </Typography>
                )}
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Sucursal (Opcional)</InputLabel>
                <Select
                  name="sucursalId"
                  value={form.sucursalId}
                  onChange={handleChange}
                  label="Sucursal (Opcional)"
                  disabled={!form.empresaId}
                >
                  <MenuItem value="">Todas las sucursales</MenuItem>
                  {sucursales
                    ?.filter(suc => !form.empresaId || suc.empresaId === form.empresaId)
                    .map(sucursal => (
                      <MenuItem key={sucursal.id} value={sucursal.id}>
                        {sucursal.nombre}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth required error={!!errors.formularioId}>
                <InputLabel>Formulario</InputLabel>
                <Select
                  name="formularioId"
                  value={form.formularioId}
                  onChange={handleChange}
                  label="Formulario"
                >
                  {formularios?.map(formulario => (
                    <MenuItem key={formulario.id} value={formulario.id}>
                      {formulario.nombre}
                    </MenuItem>
                  ))}
                </Select>
                {errors.formularioId && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                    {errors.formularioId}
                  </Typography>
                )}
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Encargado (Opcional)</InputLabel>
                <Select
                  name="encargadoId"
                  value={form.encargadoId}
                  onChange={handleChange}
                  label="Encargado (Opcional)"
                  disabled={cargandoUsuarios}
                >
                  <MenuItem value="">
                    <Box display="flex" alignItems="center" gap={1}>
                      <PersonOff color="action" />
                      Sin especificar
                    </Box>
                  </MenuItem>
                  {usuariosOperarios.map(usuario => (
                    <MenuItem key={usuario.id} value={usuario.id}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>
                          {usuario.displayName ? usuario.displayName.charAt(0).toUpperCase() : usuario.email.charAt(0).toUpperCase()}
                        </Avatar>
                        {usuario.displayName || usuario.email}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControl fullWidth required>
                <InputLabel>Tipo de Frecuencia</InputLabel>
                <Select
                  name="frecuencia.tipo"
                  value={form.frecuencia.tipo}
                  onChange={(e) => handleFrecuenciaChange('tipo', e.target.value)}
                  label="Tipo de Frecuencia"
                >
                  <MenuItem value="semanal">Semanal</MenuItem>
                  <MenuItem value="mensual">Mensual</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {form.frecuencia.tipo === 'semanal' && (
              <>
                <Grid item xs={12}>
                  <FormControl fullWidth error={!!errors.diasSemana}>
                    <InputLabel>Días de la Semana *</InputLabel>
                    <Box sx={{ mt: 2 }}>
                      <FormGroup>
                        <Grid container spacing={1}>
                          {diasSemana.map(dia => (
                            <Grid item xs={6} sm={4} md={3} key={dia.value}>
                              <FormControlLabel
                                control={
                                  <Checkbox
                                    checked={form.frecuencia.diasSemana?.includes(dia.value) || false}
                                    onChange={() => handleDiaSemanaToggle(dia.value)}
                                  />
                                }
                                label={dia.label}
                              />
                            </Grid>
                          ))}
                        </Grid>
                      </FormGroup>
                      {errors.diasSemana && (
                        <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                          {errors.diasSemana}
                        </Typography>
                      )}
                    </Box>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    name="intervalo"
                    label="Cada N semanas"
                    type="number"
                    value={form.frecuencia.intervalo}
                    onChange={(e) => handleFrecuenciaChange('intervalo', Number(e.target.value))}
                    inputProps={{ min: 1 }}
                    helperText="Ej: 2 = cada 2 semanas"
                  />
                </Grid>
              </>
            )}

            {form.frecuencia.tipo === 'mensual' && (
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  required
                  name="diaMes"
                  label="Día del mes"
                  type="number"
                  value={form.frecuencia.diaMes || ''}
                  onChange={(e) => handleFrecuenciaChange('diaMes', Number(e.target.value))}
                  error={!!errors.diaMes}
                  helperText={errors.diaMes || 'Del 1 al 31'}
                  inputProps={{ min: 1, max: 31 }}
                />
              </Grid>
            )}

            <Grid item xs={12} md={4}>
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

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                required
                name="fechaInicio"
                label="Fecha de Inicio"
                type="date"
                value={form.fechaInicio}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                name="fechaFin"
                label="Fecha de Fin (Opcional)"
                type="date"
                value={form.fechaFin}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
                helperText="Dejar vacío para sin fin"
              />
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={form.activa}
                    onChange={(e) => setForm(prev => ({ ...prev, activa: e.target.checked }))}
                  />
                }
                label="Programación activa"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant="contained" startIcon={<Repeat />}>
            {recurringToEdit ? 'Actualizar' : 'Crear'} Programación
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default CreateRecurringDialog;
