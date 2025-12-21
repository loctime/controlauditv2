import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  Typography,
  Alert,
  Divider
} from '@mui/material';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../../../firebaseControlFile';
import { useNavigate } from 'react-router-dom';

const AccidentesTab = ({ empresaId, empresaNombre }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [recentesAccidentes, setRecentesAccidentes] = useState([]);

  useEffect(() => {
    if (empresaId) {
      loadEstadisticas();
    }
  }, [empresaId]);

  const loadEstadisticas = async () => {
    setLoading(true);
    try {
      const sucursalesSnapshot = await getDocs(query(collection(db, 'sucursales'), where('empresaId', '==', empresaId)));
      const sucursalesIds = sucursalesSnapshot.docs.map(doc => doc.id);
      
      if (sucursalesIds.length === 0) {
        setRecentesAccidentes([]);
        return;
      }

      const accidentesSnapshot = await getDocs(query(collection(db, 'accidentes'), where('sucursalId', 'in', sucursalesIds)));
      const accidentesData = accidentesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Obtener 3 registros más recientes
      const ordenados = accidentesData
        .sort((a, b) => {
          const dateA = a.fechaHora?.toDate?.() || new Date(0);
          const dateB = b.fechaHora?.toDate?.() || new Date(0);
          return dateB - dateA;
        })
        .slice(0, 3);
      
      setRecentesAccidentes(ordenados);
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">Accidentes e Incidentes - {empresaNombre}</Typography>
        <Button
          variant="contained"
          color="error"
          startIcon={<ReportProblemIcon />}
          onClick={() => navigate('/accidentes')}
        >
          Gestionar Registros
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>

          {/* Registros recientes */}
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>
            Registros Recientes
          </Typography>

          {recentesAccidentes.length === 0 ? (
            <Alert severity="info" icon={<CheckCircleIcon />}>
              No hay accidentes o incidentes registrados para esta empresa
            </Alert>
          ) : (
            <Grid container spacing={2}>
              {recentesAccidentes.map((registro) => (
                <Grid item xs={12} md={4} key={registro.id}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        {registro.tipo === 'accidente' ? (
                          <ErrorIcon color="error" />
                        ) : (
                          <WarningIcon color="warning" />
                        )}
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', textTransform: 'capitalize' }}>
                          {registro.tipo}
                        </Typography>
                      </Box>
                      
                      <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
                        <strong>Fecha:</strong> {registro.fechaHora?.toDate?.()?.toLocaleDateString() || 'N/A'}
                      </Typography>
                      
                      <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
                        <strong>Estado:</strong> {registro.estado}
                      </Typography>
                      
                      <Typography 
                        variant="body2" 
                        color="textSecondary" 
                        sx={{ 
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                        }}
                      >
                        {registro.descripcion}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </>
      )}
    </Box>
  );
};

export default AccidentesTab;

