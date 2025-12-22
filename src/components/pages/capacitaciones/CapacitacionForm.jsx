import React, { useState } from 'react';
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
import { addDoc, Timestamp } from 'firebase/firestore';
import { auditUserCollection } from '../../../firebaseControlFile';
import { useAuth } from '../../context/AuthContext';

export default function CapacitacionForm({ open, onClose, onSave, sucursalId, empresaId }) {
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    tipo: 'charla',
    instructor: '',
    fechaRealizada: new Date().toISOString().split('T')[0]
  });

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!userProfile?.uid) {
      alert('Error: Usuario no autenticado');
      return;
    }

    setLoading(true);

    try {
      // Guardar en arquitectura multi-tenant - sin campos de identidad
      const capacitacionesRef = auditUserCollection(userProfile.uid, 'capacitaciones');
      await addDoc(capacitacionesRef, {
        ...formData,
        empresaId,
        sucursalId,
        estado: 'activa',
        empleados: [],
        fechaRealizada: Timestamp.fromDate(new Date(formData.fechaRealizada)),
        createdAt: Timestamp.now()
      });

      setFormData({
        nombre: '',
        descripcion: '',
        tipo: 'charla',
        instructor: '',
        fechaRealizada: new Date().toISOString().split('T')[0]
      });
      onSave();
    } catch (error) {
      console.error('Error al guardar capacitación:', error);
      alert('Error al guardar la capacitación');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Nueva Capacitación</DialogTitle>
        
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                label="Nombre de la Capacitación"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Descripción"
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                required
                select
                label="Tipo"
                name="tipo"
                value={formData.tipo}
                onChange={handleChange}
              >
                <MenuItem value="charla">Charla</MenuItem>
                <MenuItem value="entrenamiento">Entrenamiento</MenuItem>
                <MenuItem value="capacitacion">Capacitación</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                required
                label="Instructor"
                name="instructor"
                value={formData.instructor}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                required
                type="date"
                label="Fecha"
                name="fechaRealizada"
                value={formData.fechaRealizada}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose} disabled={loading}>Cancelar</Button>
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
            {loading ? <CircularProgress size={24} /> : 'Crear'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

