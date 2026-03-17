import logger from '@/utils/logger';
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  MenuItem,
  CircularProgress
} from '@mui/material';
import { getUserDisplayName } from '../../../utils/userDisplayNames';

const DEFAULT_FORM = {
  nombre: '',
  apellido: '',
  dni: '',
  email: '',
  telefono: '',
  cargo: '',
  area: '',
  tipo: 'operativo',
  fechaIngreso: new Date().toISOString().split('T')[0],
  estado: 'activo'
};

export default function EmpleadoFormModal({ open, onClose, onSubmit, initialData }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(DEFAULT_FORM);

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...DEFAULT_FORM,
        ...initialData,
        fechaIngreso: initialData.fechaIngreso?.toDate?.()?.toISOString().split('T')[0] ||
          initialData.fechaIngreso ||
          DEFAULT_FORM.fechaIngreso
      });
    } else {
      setFormData(DEFAULT_FORM);
    }
  }, [initialData, open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);

    try {
      if (!formData.nombre?.trim() || !formData.apellido?.trim()) {
        throw new Error('El nombre y apellido son requeridos');
      }

      await onSubmit?.({ ...formData });
    } catch (error) {
      logger.error('Error al guardar empleado:', error);
      alert('Error al guardar el empleado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          {initialData?.id ? 'Editar Empleado' : 'Nuevo Empleado'}
        </DialogTitle>
        
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                label="Nombre"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                placeholder="Ej: Juan"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                label="Apellido"
                name="apellido"
                value={formData.apellido}
                onChange={handleChange}
                placeholder="Ej: Pérez"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="DNI"
                name="dni"
                value={formData.dni}
                onChange={handleChange}
                placeholder="12345678"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="empleado@ejemplo.com"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Teléfono"
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
                placeholder="+54 11 1234-5678"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Cargo"
                name="cargo"
                value={formData.cargo}
                onChange={handleChange}
                placeholder={`Ej: ${getUserDisplayName('default')}, Supervisor, etc.`}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Área"
                name="area"
                value={formData.area}
                onChange={handleChange}
                placeholder="Ej: Producción, Administración, etc."
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                select
                label="Tipo"
                name="tipo"
                value={formData.tipo}
                onChange={handleChange}
              >
                <MenuItem value="operativo">Operativo</MenuItem>
                <MenuItem value="administrativo">Administrativo</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                type="date"
                label="Fecha de Ingreso"
                name="fechaIngreso"
                value={formData.fechaIngreso}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                select
                label="Estado"
                name="estado"
                value={formData.estado}
                onChange={handleChange}
              >
                <MenuItem value="activo">Activo</MenuItem>
                <MenuItem value="inactivo">Inactivo</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5568d3 0%, #65408b 100%)',
              }
            }}
          >
            {loading ? <CircularProgress size={24} /> : 'Guardar'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

