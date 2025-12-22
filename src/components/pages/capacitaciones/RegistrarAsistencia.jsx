import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Button,
  Box,
  Checkbox,
  FormControlLabel,
  Grid,
  CircularProgress,
  Alert,
  Divider
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { db, auditUserCollection } from '../../../firebaseControlFile';
import { useAuth } from '../../context/AuthContext';

export default function RegistrarAsistencia() {
  const { capacitacionId } = useParams();
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const [capacitacion, setCapacitacion] = useState(null);
  const [empleados, setEmpleados] = useState([]);
  const [selectedEmpleados, setSelectedEmpleados] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (userProfile?.uid) {
      loadData();
    }
  }, [capacitacionId, userProfile?.uid]);

  const loadData = async () => {
    if (!userProfile?.uid) {
      alert('Usuario no autenticado');
      navigate('/capacitaciones');
      return;
    }

    setLoading(true);
    try {
      // Cargar capacitación desde arquitectura multi-tenant
      const capacitacionRef = doc(auditUserCollection(userProfile.uid, 'capacitaciones'), capacitacionId);
      const capDoc = await getDoc(capacitacionRef);
      if (!capDoc.exists()) {
        alert('Capacitación no encontrada');
        navigate('/capacitaciones');
        return;
      }
      
      const capData = { id: capDoc.id, ...capDoc.data() };
      setCapacitacion(capData);

      // Cargar empleados de la sucursal
      const empleadosRef = collection(db, 'empleados');
      const q = query(
        empleadosRef,
        where('sucursalId', '==', capData.sucursalId),
        where('estado', '==', 'activo')
      );
      
      const snapshot = await getDocs(q);
      const empleadosData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setEmpleados(empleadosData);

      // Marcar empleados ya registrados
      const registered = new Set(capData.empleados?.map(e => e.empleadoId) || []);
      setSelectedEmpleados(registered);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      alert('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleEmpleado = (empleadoId) => {
    setSelectedEmpleados(prev => {
      const newSet = new Set(prev);
      if (newSet.has(empleadoId)) {
        newSet.delete(empleadoId);
      } else {
        newSet.add(empleadoId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedEmpleados.size === empleados.length) {
      setSelectedEmpleados(new Set());
    } else {
      setSelectedEmpleados(new Set(empleados.map(e => e.id)));
    }
  };

  const handleGuardar = async () => {
    if (!userProfile?.uid) {
      alert('Usuario no autenticado');
      return;
    }

    setSaving(true);
    try {
      const empleadosRegistrados = empleados
        .filter(e => selectedEmpleados.has(e.id))
        .map(e => ({
          empleadoId: e.id,
          empleadoNombre: e.nombre,
          asistio: true,
          fecha: Timestamp.now()
        }));

      // Actualizar en arquitectura multi-tenant
      const capacitacionRef = doc(auditUserCollection(userProfile.uid, 'capacitaciones'), capacitacionId);
      await updateDoc(capacitacionRef, {
        empleados: empleadosRegistrados,
        updatedAt: Timestamp.now()
      });

      alert('Asistencia registrada correctamente');
      navigate('/capacitaciones');
    } catch (error) {
      console.error('Error al guardar:', error);
      alert('Error al guardar la asistencia');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 3, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (!capacitacion) {
    return (
      <Container maxWidth="md" sx={{ py: 3 }}>
        <Alert severity="error">Capacitación no encontrada</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 3 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>
          Registrar Asistencia
        </Typography>
        <Typography variant="h6" color="primary" sx={{ mb: 3 }}>
          {capacitacion.nombre}
        </Typography>

        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" color="text.secondary">
            Instructor: {capacitacion.instructor}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Fecha: {capacitacion.fechaRealizada?.toDate?.()?.toLocaleDateString()}
          </Typography>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Lista de Empleados ({empleados.length})
          </Typography>
          <Button size="small" onClick={handleSelectAll}>
            {selectedEmpleados.size === empleados.length ? 'Desmarcar Todos' : 'Marcar Todos'}
          </Button>
        </Box>

        {empleados.length === 0 ? (
          <Alert severity="info">No hay empleados activos en esta sucursal</Alert>
        ) : (
          <Grid container spacing={1}>
            {empleados.map((empleado) => (
              <Grid item xs={12} sm={6} key={empleado.id}>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 1,
                    backgroundColor: selectedEmpleados.has(empleado.id) ? '#e3f2fd' : 'transparent'
                  }}
                >
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={selectedEmpleados.has(empleado.id)}
                        onChange={() => handleToggleEmpleado(empleado.id)}
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {empleado.nombre}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {empleado.cargo} - {empleado.area}
                        </Typography>
                      </Box>
                    }
                  />
                </Paper>
              </Grid>
            ))}
          </Grid>
        )}

        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
          <Button onClick={() => navigate('/capacitaciones')}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleGuardar}
            disabled={saving || selectedEmpleados.size === 0}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5568d3 0%, #65408b 100%)',
              }
            }}
          >
            {saving ? <CircularProgress size={24} /> : `Guardar (${selectedEmpleados.size} asistentes)`}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}

