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
  Chip
} from "@mui/material";
import { Add } from "@mui/icons-material";
import { toast } from 'react-toastify';

const AgendarAuditoriaDialog = ({ open, onClose, onSave, empresas, sucursales, formularios, fechaPreestablecida }) => {
  const [form, setForm] = useState({
    empresa: '',
    sucursal: '',
    formulario: '',
    fecha: '',
    hora: '',
    descripcion: ''
  });

  // Función para obtener el nombre del días
  const getNombreDia = (fechaStr) => {
    if (!fechaStr) return '';
    const fecha = new Date(fechaStr);
    const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return dias[fecha.getDay()];
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
    setForm({ empresa: '', sucursal: '', formulario: '', fecha: '', hora: '', descripcion: '' });
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