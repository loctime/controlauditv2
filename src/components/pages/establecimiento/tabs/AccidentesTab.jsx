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
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../../../firebaseConfig';
import { useNavigate } from 'react-router-dom';

const AccidentesTab = ({ empresaId, empresaNombre }) => {
  const navigate = useNavigate();
  const [accidentes, setAccidentes] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (empresaId) {
      loadAccidentes();
    }
  }, [empresaId]);

  const loadAccidentes = async () => {
    setLoading(true);
    try {
      const sucursalesSnapshot = await getDocs(query(collection(db, 'sucursales'), where('empresaId', '==', empresaId)));
      const sucursalesIds = sucursalesSnapshot.docs.map(doc => doc.id);
      
      if (sucursalesIds.length === 0) {
        setAccidentes([]);
        return;
      }

      const accidentesSnapshot = await getDocs(query(collection(db, 'accidentes'), where('sucursalId', 'in', sucursalesIds)));
      const accidentesData = accidentesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAccidentes(accidentesData);
    } catch (error) {
      console.error('Error cargando accidentes:', error);
    } finally {
      setLoading(false);
    }
  };

  const getGravedadColor = (gravedad) => {
    switch (gravedad) {
      case 'leve': return 'success';
      case 'moderado': return 'warning';
      case 'grave': return 'error';
      default: return 'default';
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Accidentes de {empresaNombre}</Typography>
        <Button
          variant="contained"
          startIcon={<ReportProblemIcon />}
          onClick={() => navigate('/accidentes')}
        >
          Gestionar Accidentes
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
          <CircularProgress />
        </Box>
      ) : accidentes.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 3 }}>
          <Typography variant="body1" color="textSecondary">
            No hay accidentes registrados para esta empresa
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {accidentes.map((accidente) => (
            <Grid item xs={12} sm={6} md={4} key={accidente.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      {accidente.tipo}
                    </Typography>
                    <Chip 
                      label={accidente.gravedad} 
                      color={getGravedadColor(accidente.gravedad)}
                      size="small"
                    />
                  </Box>
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
                    <strong>Empleado:</strong> {accidente.empleadoNombre}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
                    <strong>Fecha:</strong> {accidente.fechaHora?.toDate?.()?.toLocaleDateString() || 'N/A'}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
                    <strong>Lugar:</strong> {accidente.lugar}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                    <strong>Días perdidos:</strong> {accidente.diasPerdidos || 0}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    <strong>Estado:</strong> {accidente.estado}
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

export default AccidentesTab;

