import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Box,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  CheckCircle as CheckCircleIcon,
  ContentCopy as CopyIcon,
  People as PeopleIcon
} from '@mui/icons-material';
import { collection, query, where, getDocs, updateDoc, doc, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../../firebaseConfig';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import CapacitacionForm from './CapacitacionForm';

export default function Capacitaciones() {
  const { userProfile, userSucursales, loadingSucursales } = useAuth();
  const navigate = useNavigate();
  const [capacitaciones, setCapacitaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterTipo, setFilterTipo] = useState('');
  const [filterEstado, setFilterEstado] = useState('');
  const [selectedSucursal, setSelectedSucursal] = useState('');
  const [openForm, setOpenForm] = useState(false);

  // Debug: ver qué está pasando con las sucursales
  useEffect(() => {
    console.log('[Capacitaciones] loadingSucursales:', loadingSucursales);
    console.log('[Capacitaciones] userSucursales:', userSucursales);
    console.log('[Capacitaciones] userSucursales.length:', userSucursales?.length);
  }, [userSucursales, loadingSucursales]);

  useEffect(() => {
    if (userSucursales && userSucursales.length > 0 && !selectedSucursal) {
      // Primero intentar usar la sucursal guardada en localStorage
      const savedSucursal = localStorage.getItem('selectedSucursal');
      const savedEmpresa = localStorage.getItem('selectedEmpresa');
      
      if (savedSucursal && userSucursales.find(s => s.id === savedSucursal)) {
        setSelectedSucursal(savedSucursal);
        // Limpiar localStorage después de usar
        localStorage.removeItem('selectedSucursal');
      } else if (savedEmpresa) {
        // Si hay empresa preseleccionada, filtrar sucursales de esa empresa
        const sucursalesEmpresa = userSucursales.filter(s => s.empresaId === savedEmpresa);
        if (sucursalesEmpresa.length > 0) {
          setSelectedSucursal(sucursalesEmpresa[0].id);
        } else {
          setSelectedSucursal(userSucursales[0].id);
        }
        // Limpiar localStorage después de usar
        localStorage.removeItem('selectedEmpresa');
      } else {
        setSelectedSucursal(userSucursales[0].id);
      }
    }
  }, [userSucursales, selectedSucursal]);

  useEffect(() => {
    if (selectedSucursal) {
      loadCapacitaciones();
    }
  }, [selectedSucursal]);

  const loadCapacitaciones = async () => {
    setLoading(true);
    try {
      const capacitacionesRef = collection(db, 'capacitaciones');
      const q = query(
        capacitacionesRef,
        where('sucursalId', '==', selectedSucursal)
      );
      
      const snapshot = await getDocs(q);
      const capacitacionesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Ordenar por fecha más reciente
      capacitacionesData.sort((a, b) => {
        const dateA = a.fechaRealizada?.toDate?.() || new Date(a.fechaRealizada);
        const dateB = b.fechaRealizada?.toDate?.() || new Date(b.fechaRealizada);
        return dateB - dateA;
      });
      
      setCapacitaciones(capacitacionesData);
    } catch (error) {
      console.error('Error al cargar capacitaciones:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegistrarAsistencia = (capacitacionId) => {
    navigate(`/capacitacion/${capacitacionId}/asistencia`);
  };

  const handleMarcarCompletada = async (capacitacionId) => {
    if (window.confirm('¿Marcar esta capacitación como completada?')) {
      try {
        await updateDoc(doc(db, 'capacitaciones', capacitacionId), {
          estado: 'completada',
          updatedAt: Timestamp.now()
        });
        loadCapacitaciones();
      } catch (error) {
        console.error('Error al marcar completada:', error);
        alert('Error al actualizar la capacitación');
      }
    }
  };

  const handleDuplicar = async (capacitacion) => {
    if (window.confirm(`¿Crear nueva instancia de "${capacitacion.nombre}"?`)) {
      try {
        const nuevaCapacitacion = {
          ...capacitacion,
          estado: 'activa',
          empleados: [],
          fechaRealizada: Timestamp.now(),
          createdAt: Timestamp.now(),
          createdBy: userProfile?.uid
        };
        delete nuevaCapacitacion.id;
        delete nuevaCapacitacion.updatedAt;
        
        await addDoc(collection(db, 'capacitaciones'), nuevaCapacitacion);
        loadCapacitaciones();
      } catch (error) {
        console.error('Error al duplicar:', error);
        alert('Error al duplicar la capacitación');
      }
    }
  };

  const filteredCapacitaciones = capacitaciones.filter(cap => {
    const matchTipo = !filterTipo || cap.tipo === filterTipo;
    const matchEstado = !filterEstado || cap.estado === filterEstado;
    return matchTipo && matchEstado;
  });

  // Mostrar loading mientras se cargan las sucursales
  if (loadingSucursales) {
    return (
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (!userSucursales || userSucursales.length === 0) {
    return (
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Alert severity="warning">
          No tienes sucursales asignadas. Contacta con el administrador.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Gestión de Capacitaciones
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenForm(true)}
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #5568d3 0%, #65408b 100%)',
            }
          }}
        >
          Nueva Capacitación
        </Button>
      </Box>

      {/* Selector de Sucursal */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <FormControl fullWidth>
          <InputLabel>Sucursal</InputLabel>
          <Select
            value={selectedSucursal}
            label="Sucursal"
            onChange={(e) => setSelectedSucursal(e.target.value)}
          >
            {userSucursales.map((sucursal) => (
              <MenuItem key={sucursal.id} value={sucursal.id}>
                {sucursal.nombre}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Paper>

      {/* Filtros */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Tipo</InputLabel>
            <Select
              value={filterTipo}
              label="Tipo"
              onChange={(e) => setFilterTipo(e.target.value)}
            >
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="charla">Charla</MenuItem>
              <MenuItem value="entrenamiento">Entrenamiento</MenuItem>
              <MenuItem value="capacitacion">Capacitación</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Estado</InputLabel>
            <Select
              value={filterEstado}
              label="Estado"
              onChange={(e) => setFilterEstado(e.target.value)}
            >
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="activa">Activa</MenuItem>
              <MenuItem value="completada">Completada</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {/* Grid de Capacitaciones */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : filteredCapacitaciones.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">
            No hay capacitaciones registradas
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {filteredCapacitaciones.map((capacitacion) => (
            <Grid item xs={12} md={6} lg={4} key={capacitacion.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flex: 1 }}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="h6" sx={{ mb: 1 }}>
                      {capacitacion.nombre}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                      <Chip
                        label={capacitacion.tipo}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                      <Chip
                        label={capacitacion.estado}
                        size="small"
                        color={capacitacion.estado === 'completada' ? 'success' : 'warning'}
                      />
                    </Box>
                  </Box>

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {capacitacion.descripcion}
                  </Typography>

                  <Box sx={{ mb: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      Instructor: {capacitacion.instructor}
                    </Typography>
                  </Box>

                  <Box sx={{ mb: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      Fecha: {capacitacion.fechaRealizada?.toDate?.()?.toLocaleDateString() || 'N/A'}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PeopleIcon fontSize="small" color="action" />
                    <Typography variant="caption">
                      {capacitacion.empleados?.length || 0} asistentes
                    </Typography>
                  </Box>
                </CardContent>

                <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                  {capacitacion.estado === 'activa' ? (
                    <>
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => handleRegistrarAsistencia(capacitacion.id)}
                      >
                        Registrar Asistencia
                      </Button>
                      <Button
                        size="small"
                        startIcon={<CheckCircleIcon />}
                        onClick={() => handleMarcarCompletada(capacitacion.id)}
                      >
                        Completar
                      </Button>
                    </>
                  ) : (
                    <Button
                      size="small"
                      startIcon={<CopyIcon />}
                      onClick={() => handleDuplicar(capacitacion)}
                    >
                      Duplicar
                    </Button>
                  )}
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <CapacitacionForm
        open={openForm}
        onClose={() => setOpenForm(false)}
        onSave={() => {
          loadCapacitaciones();
          setOpenForm(false);
        }}
        sucursalId={selectedSucursal}
        empresaId={userProfile?.empresaId || userProfile?.uid}
      />
    </Container>
  );
}

