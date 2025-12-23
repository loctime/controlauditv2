import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  Typography
} from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import { getDocs, query, where } from 'firebase/firestore';
import { auditUserCollection } from '../../../../firebaseControlFile';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';

const CapacitacionesTab = ({ empresaId, empresaNombre }) => {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const [capacitaciones, setCapacitaciones] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (empresaId && userProfile?.uid) {
      loadCapacitaciones();
    }
  }, [empresaId, userProfile?.uid]);

  const loadCapacitaciones = async () => {
    if (!userProfile?.uid) {
      console.error('Error: userProfile.uid es requerido');
      return;
    }

    setLoading(true);
    try {
      const sucursalesRef = auditUserCollection(userProfile.uid, 'sucursales');
      const sucursalesSnapshot = await getDocs(query(sucursalesRef, where('empresaId', '==', empresaId)));
      const sucursalesIds = sucursalesSnapshot.docs.map(doc => doc.id);
      
      if (sucursalesIds.length === 0) {
        setCapacitaciones([]);
        return;
      }

      const capacitacionesRef = auditUserCollection(userProfile.uid, 'capacitaciones');
      const capacitacionesSnapshot = await getDocs(query(capacitacionesRef, where('sucursalId', 'in', sucursalesIds)));
      const capacitacionesData = capacitacionesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCapacitaciones(capacitacionesData);
    } catch (error) {
      console.error('Error cargando capacitaciones:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'activa': return 'warning';
      case 'completada': return 'success';
      case 'cancelada': return 'error';
      default: return 'default';
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Capacitaciones de {empresaNombre}</Typography>
        <Button
          variant="contained"
          startIcon={<SchoolIcon />}
          onClick={() => navigate('/capacitaciones')}
        >
          Gestionar Capacitaciones
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
          <CircularProgress />
        </Box>
      ) : capacitaciones.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 3 }}>
          <Typography variant="body1" color="textSecondary">
            No hay capacitaciones registradas para esta empresa
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {capacitaciones.map((capacitacion) => (
            <Grid item xs={12} sm={6} md={4} key={capacitacion.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      {capacitacion.nombre}
                    </Typography>
                    <Chip 
                      label={capacitacion.estado} 
                      color={getEstadoColor(capacitacion.estado)}
                      size="small"
                    />
                  </Box>
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
                    <strong>Tipo:</strong> {capacitacion.tipo}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
                    <strong>Instructor:</strong> {capacitacion.instructor}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                    <strong>Fecha:</strong> {capacitacion.fechaRealizada?.toDate?.()?.toLocaleDateString() || 'N/A'}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    <strong>Asistentes:</strong> {capacitacion.asistentes?.length || 0}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default CapacitacionesTab;

