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
  CircularProgress,
  Autocomplete
} from '@mui/material';
import { collection, addDoc, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../../../firebaseControlFile';
import { useAuth } from '../../context/AuthContext';

export default function AccidenteForm({ open, onClose, onSave, sucursalId, empresaId }) {
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [empleados, setEmpleados] = useState([]);
  const [selectedEmpleado, setSelectedEmpleado] = useState(null);
  const [formData, setFormData] = useState({
    tipo: 'accidente',
    gravedad: 'leve',
    fechaHora: new Date().toISOString().slice(0, 16),
    lugar: '',
    descripcion: '',
    diasPerdidos: 0,
    estado: 'abierto'
  });

  useEffect(() => {
    if (open && sucursalId) {
      loadEmpleados();
    }
  }, [open, sucursalId]);

  const loadEmpleados = async () => {
    try {
      const empleadosRef = collection(db, 'empleados');
      const q = query(
        empleadosRef,
        where('sucursalId', '==', sucursalId),
        where('estado', '==', 'activo')
      );
      
      const snapshot = await getDocs(q);
      const empleadosData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setEmpleados(empleadosData);
    } catch (error) {
      console.error('Error al cargar empleados:', error);
    }
  };

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedEmpleado) {
      alert('Debe seleccionar un empleado');
      return;
    }

    setLoading(true);

    try {
      await addDoc(collection(db, 'accidentes'), {
        ...formData,
        empresaId,
        sucursalId,
        empleadoId: selectedEmpleado.id,
        empleadoNombre: selectedEmpleado.nombre,
        fechaHora: Timestamp.fromDate(new Date(formData.fechaHora)),
        diasPerdidos: parseInt(formData.diasPerdidos) || 0,
        createdAt: Timestamp.now(),
        reportadoPor: userProfile?.uid
      });

      setFormData({
        tipo: 'accidente',
        gravedad: 'leve',
        fechaHora: new Date().toISOString().slice(0, 16),
        lugar: '',
        descripcion: '',
        diasPerdidos: 0,
        estado: 'abierto'
      });
      setSelectedEmpleado(null);
      onSave();
    } catch (error) {
      console.error('Error al guardar accidente:', error);
      alert('Error al guardar el accidente');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Registrar Accidente/Incidente</DialogTitle>
        
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                select
                label="Tipo"
                name="tipo"
                value={formData.tipo}
                onChange={handleChange}
              >
                <MenuItem value="accidente">Accidente</MenuItem>
                <MenuItem value="incidente">Incidente</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                select
                label="Gravedad"
                name="gravedad"
                value={formData.gravedad}
                onChange={handleChange}
              >
                <MenuItem value="leve">Leve</MenuItem>
                <MenuItem value="moderado">Moderado</MenuItem>
                <MenuItem value="grave">Grave</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12}>
              <Autocomplete
                options={empleados}
                getOptionLabel={(option) => `${option.nombre} - ${option.cargo}`}
                value={selectedEmpleado}
                onChange={(event, newValue) => setSelectedEmpleado(newValue)}
                renderInput={(params) => (
                  <TextField {...params} label="Empleado Afectado" required />
                )}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                type="datetime-local"
                label="Fecha y Hora"
                name="fechaHora"
                value={formData.fechaHora}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                label="Lugar"
                name="lugar"
                value={formData.lugar}
                onChange={handleChange}
                placeholder="Ej: Sector de producción - Línea 2"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                multiline
                rows={4}
                label="Descripción del Accidente"
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Días Perdidos"
                name="diasPerdidos"
                value={formData.diasPerdidos}
                onChange={handleChange}
                inputProps={{ min: 0 }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                select
                label="Estado"
                name="estado"
                value={formData.estado}
                onChange={handleChange}
              >
                <MenuItem value="abierto">Abierto</MenuItem>
                <MenuItem value="cerrado">Cerrado</MenuItem>
              </TextField>
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
            {loading ? <CircularProgress size={24} /> : 'Guardar'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

