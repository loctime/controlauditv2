import React, { useState, useEffect } from 'react';
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
import { addDoc, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { auditUserCollection } from '../../../firebaseControlFile';
import { useAuth } from '../../context/AuthContext';

export default function EmpleadoForm({ open, onClose, onSave, empleado, sucursalId, empresaId }) {
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
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
  });

  useEffect(() => {
    if (empleado) {
      setFormData({
        nombre: empleado.nombre || '',
        apellido: empleado.apellido || '',
        dni: empleado.dni || '',
        email: empleado.email || '',
        telefono: empleado.telefono || '',
        cargo: empleado.cargo || '',
        area: empleado.area || '',
        tipo: empleado.tipo || 'operativo',
        fechaIngreso: empleado.fechaIngreso?.toDate?.()?.toISOString().split('T')[0] || 
                      empleado.fechaIngreso || new Date().toISOString().split('T')[0],
        estado: empleado.estado || 'activo'
      });
    } else {
      setFormData({
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
      });
    }
  }, [empleado, open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!userProfile?.uid) {
      alert('Error: No se pudo identificar el usuario');
      return;
    }

    setLoading(true);

    try {
      const empleadoData = {
        ...formData,
        empresaId,
        sucursalId,
        fechaIngreso: Timestamp.fromDate(new Date(formData.fechaIngreso)),
        updatedAt: Timestamp.now()
      };

      if (empleado) {
        // Actualizar
        await updateDoc(doc(auditUserCollection(userProfile.uid, 'empleados'), empleado.id), empleadoData);
      } else {
        // Crear
        empleadoData.createdAt = Timestamp.now();
        await addDoc(auditUserCollection(userProfile.uid, 'empleados'), empleadoData);
      }

      onSave();
    } catch (error) {
      console.error('Error al guardar empleado:', error);
      alert('Error al guardar el empleado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          {empleado ? 'Editar Empleado' : 'Nuevo Empleado'}
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
                placeholder="Ej: Operario, Supervisor, etc."
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

