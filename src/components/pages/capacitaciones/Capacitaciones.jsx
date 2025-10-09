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
  const { userProfile, userSucursales, loadingSucursales, getUserSucursales, userEmpresas } = useAuth();
  const navigate = useNavigate();
  const [capacitaciones, setCapacitaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterTipo, setFilterTipo] = useState('');
  const [filterEstado, setFilterEstado] = useState('');
  const [selectedEmpresa, setSelectedEmpresa] = useState('');
  const [selectedSucursal, setSelectedSucursal] = useState('');
  const [openForm, setOpenForm] = useState(false);
  
  // Estado local para mantener las sucursales una vez cargadas
  const [localSucursales, setLocalSucursales] = useState([]);

  // Usar sucursales locales si están disponibles, sino usar las del contexto
  const sucursalesDisponibles = localSucursales.length > 0 ? localSucursales : userSucursales;
  
  // Filtrar sucursales por empresa seleccionada
  const sucursalesFiltradas = selectedEmpresa 
    ? sucursalesDisponibles.filter(s => s.empresaId === selectedEmpresa)
    : sucursalesDisponibles;

  // Debug: ver qué está pasando con las sucursales
  useEffect(() => {
    console.log('[Capacitaciones] loadingSucursales:', loadingSucursales);
    console.log('[Capacitaciones] userSucursales:', userSucursales);
    console.log('[Capacitaciones] userSucursales.length:', userSucursales?.length);
    
    if (userSucursales && userSucursales.length > 0) {
      console.log('[Capacitaciones] 🎉 Sucursales encontradas:', userSucursales.map(s => s.nombre));
      // Guardar en estado local para evitar que se pierdan
      setLocalSucursales(userSucursales);
    }
  }, [userSucursales, loadingSucursales]);

  useEffect(() => {
    const sucursalesParaUsar = localSucursales.length > 0 ? localSucursales : userSucursales;
    if (sucursalesParaUsar && sucursalesParaUsar.length > 0 && !selectedSucursal) {
      // Primero intentar usar la sucursal guardada en localStorage
      const savedSucursal = localStorage.getItem('selectedSucursal');
      const savedEmpresa = localStorage.getItem('selectedEmpresa');
      
      if (savedSucursal && sucursalesParaUsar.find(s => s.id === savedSucursal)) {
        setSelectedSucursal(savedSucursal);
        // Limpiar localStorage después de usar
        localStorage.removeItem('selectedSucursal');
      } else if (savedEmpresa) {
        // Si hay empresa preseleccionada, filtrar sucursales de esa empresa
        const sucursalesEmpresa = sucursalesParaUsar.filter(s => s.empresaId === savedEmpresa);
        if (sucursalesEmpresa.length > 0) {
          setSelectedSucursal(sucursalesEmpresa[0].id);
        } else {
          setSelectedSucursal(sucursalesParaUsar[0].id);
        }
        // Limpiar localStorage después de usar
        localStorage.removeItem('selectedEmpresa');
      } else {
        setSelectedSucursal(sucursalesParaUsar[0].id);
      }
    }
  }, [userSucursales, localSucursales, selectedSucursal]);

  // Efecto para manejar cambio de empresa
  useEffect(() => {
    if (selectedEmpresa && sucursalesFiltradas.length > 0) {
      // Si hay sucursales filtradas, seleccionar la primera
      setSelectedSucursal(sucursalesFiltradas[0].id);
    } else if (selectedEmpresa && sucursalesFiltradas.length === 0) {
      // Si no hay sucursales para la empresa seleccionada, limpiar sucursal
      setSelectedSucursal('');
    }
  }, [selectedEmpresa, sucursalesFiltradas]);

  useEffect(() => {
    if (selectedSucursal) {
      loadCapacitaciones();
    }
  }, [selectedSucursal]);

  // Efecto para detectar cambios en las sucursales
  useEffect(() => {
    const timer = setTimeout(() => {
      if (userSucursales && userSucursales.length > 0) {
        console.log('[Capacitaciones] ✅ Sucursales estables:', userSucursales.map(s => s.nombre));
      } else if (!loadingSucursales) {
        console.log('[Capacitaciones] ❌ Sucursales perdidas después de cargar');
      }
    }, 2000); // Esperar 2 segundos para ver si se mantienen

    return () => clearTimeout(timer);
  }, [userSucursales, loadingSucursales]);

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

  if (!sucursalesDisponibles || sucursalesDisponibles.length === 0) {
    return (
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Alert severity="warning" sx={{ mb: 2 }}>
          No tienes sucursales asignadas. Contacta con el administrador.
        </Alert>
        
        {/* Debug info */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>🔍 Información de Debug:</Typography>
          <Typography variant="body2">
            <strong>userProfile:</strong> {userProfile ? '✅ Cargado' : '❌ No cargado'}<br/>
            <strong>userEmpresas:</strong> {userEmpresas?.length || 0} empresas<br/>
            <strong>userSucursales:</strong> {userSucursales?.length || 0} sucursales<br/>
            <strong>loadingSucursales:</strong> {loadingSucursales ? '⏳ Cargando...' : '✅ Terminado'}<br/>
            <strong>localSucursales:</strong> {localSucursales?.length || 0} sucursales locales
          </Typography>
        </Paper>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            onClick={() => window.location.reload()}
          >
            🔄 Recargar Página Completa
          </Button>
          <Button
            variant="outlined"
            onClick={() => {
              console.log('🔍 Estado actual:', {
                userProfile,
                userEmpresas,
                userSucursales,
                localSucursales,
                loadingSucursales
              });
            }}
          >
            📊 Ver Estado en Consola
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            Gestión de Capacitaciones
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              onClick={() => {
                console.log('🔄 Recargando página completa...');
                window.location.reload();
              }}
              size="small"
            >
              Recargar Página
            </Button>
            <Button
              variant="outlined"
              onClick={async () => {
                console.log('🔄 Recargando contexto...');
                // Forzar recarga del contexto
                await getUserSucursales();
                setLocalSucursales([]);
                console.log('✅ Contexto recargado');
              }}
              size="small"
              disabled={loadingSucursales}
            >
              {loadingSucursales ? 'Cargando...' : 'Recargar Contexto'}
            </Button>
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
        </Box>
      </Box>

      {/* Selector de Empresa */}
      {userEmpresas && userEmpresas.length > 1 && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <FormControl fullWidth>
            <InputLabel>Empresa</InputLabel>
            <Select
              value={selectedEmpresa}
              label="Empresa"
              onChange={(e) => setSelectedEmpresa(e.target.value)}
            >
              <MenuItem value="">
                <em>Todas las empresas</em>
              </MenuItem>
              {userEmpresas.map((empresa) => (
                <MenuItem key={empresa.id} value={empresa.id}>
                  {empresa.nombre}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Paper>
      )}

      {/* Selector de Sucursal */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <FormControl fullWidth>
          <InputLabel>Sucursal</InputLabel>
          <Select
            value={selectedSucursal}
            label="Sucursal"
            onChange={(e) => setSelectedSucursal(e.target.value)}
          >
            {sucursalesFiltradas.map((sucursal) => (
              <MenuItem key={sucursal.id} value={sucursal.id}>
                {sucursal.nombre}
                {!selectedEmpresa && ` - ${sucursal.empresaNombre}`}
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

