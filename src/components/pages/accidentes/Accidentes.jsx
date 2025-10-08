import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Button,
  Box,
  Card,
  CardContent,
  Grid,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../firebaseConfig';
import { useAuth } from '../../context/AuthContext';
import AccidenteForm from './AccidenteForm';

export default function Accidentes() {
  const { userProfile, userSucursales } = useAuth();
  const [accidentes, setAccidentes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterTipo, setFilterTipo] = useState('');
  const [filterGravedad, setFilterGravedad] = useState('');
  const [filterEstado, setFilterEstado] = useState('');
  const [selectedSucursal, setSelectedSucursal] = useState('');
  const [openForm, setOpenForm] = useState(false);

  useEffect(() => {
    if (userSucursales && userSucursales.length > 0 && !selectedSucursal) {
      setSelectedSucursal(userSucursales[0].id);
    }
  }, [userSucursales, selectedSucursal]);

  useEffect(() => {
    if (selectedSucursal) {
      loadAccidentes();
    }
  }, [selectedSucursal]);

  const loadAccidentes = async () => {
    setLoading(true);
    try {
      const accidentesRef = collection(db, 'accidentes');
      const q = query(
        accidentesRef,
        where('sucursalId', '==', selectedSucursal)
      );
      
      const snapshot = await getDocs(q);
      const accidentesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      accidentesData.sort((a, b) => {
        const dateA = a.fechaHora?.toDate?.() || new Date(a.fechaHora);
        const dateB = b.fechaHora?.toDate?.() || new Date(b.fechaHora);
        return dateB - dateA;
      });
      
      setAccidentes(accidentesData);
    } catch (error) {
      console.error('Error al cargar accidentes:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAccidentes = accidentes.filter(acc => {
    const matchTipo = !filterTipo || acc.tipo === filterTipo;
    const matchGravedad = !filterGravedad || acc.gravedad === filterGravedad;
    const matchEstado = !filterEstado || acc.estado === filterEstado;
    return matchTipo && matchGravedad && matchEstado;
  });

  const getGravedadColor = (gravedad) => {
    switch (gravedad) {
      case 'leve': return 'success';
      case 'moderado': return 'warning';
      case 'grave': return 'error';
      default: return 'default';
    }
  };

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
          Registro de Accidentes e Incidentes
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
          Registrar Accidente
        </Button>
      </Box>

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

      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Tipo</InputLabel>
            <Select value={filterTipo} label="Tipo" onChange={(e) => setFilterTipo(e.target.value)}>
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="accidente">Accidente</MenuItem>
              <MenuItem value="incidente">Incidente</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Gravedad</InputLabel>
            <Select value={filterGravedad} label="Gravedad" onChange={(e) => setFilterGravedad(e.target.value)}>
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="leve">Leve</MenuItem>
              <MenuItem value="moderado">Moderado</MenuItem>
              <MenuItem value="grave">Grave</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Estado</InputLabel>
            <Select value={filterEstado} label="Estado" onChange={(e) => setFilterEstado(e.target.value)}>
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="abierto">Abierto</MenuItem>
              <MenuItem value="cerrado">Cerrado</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : filteredAccidentes.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">No hay accidentes registrados</Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {filteredAccidentes.map((accidente) => (
            <Grid item xs={12} md={6} lg={4} key={accidente.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Chip
                      label={accidente.tipo}
                      color={accidente.tipo === 'accidente' ? 'error' : 'warning'}
                      size="small"
                    />
                    <Chip
                      label={accidente.gravedad}
                      color={getGravedadColor(accidente.gravedad)}
                      size="small"
                    />
                  </Box>

                  <Typography variant="h6" sx={{ mb: 1 }}>
                    {accidente.empleadoNombre}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {accidente.descripcion}
                  </Typography>

                  <Box sx={{ mt: 2 }}>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Lugar: {accidente.lugar}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Fecha: {accidente.fechaHora?.toDate?.()?.toLocaleString()}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Días perdidos: {accidente.diasPerdidos || 0}
                    </Typography>
                  </Box>

                  <Box sx={{ mt: 2 }}>
                    <Chip
                      label={accidente.estado}
                      size="small"
                      color={accidente.estado === 'cerrado' ? 'success' : 'default'}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <AccidenteForm
        open={openForm}
        onClose={() => setOpenForm(false)}
        onSave={() => {
          loadAccidentes();
          setOpenForm(false);
        }}
        sucursalId={selectedSucursal}
        empresaId={userProfile?.empresaId || userProfile?.uid}
      />
    </Container>
  );
}

