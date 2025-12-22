import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  Typography
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import { getDocs, query, where } from 'firebase/firestore';
import { auditUserCollection } from '../../../../firebaseControlFile';
import { useAuth } from '../../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const EmpleadosTab = ({ empresaId, empresaNombre }) => {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const [empleados, setEmpleados] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (empresaId && userProfile?.uid) {
      loadEmpleados();
    }
  }, [empresaId, userProfile?.uid]);

  const loadEmpleados = async () => {
    if (!userProfile?.uid) {
      setEmpleados([]);
      return;
    }

    setLoading(true);
    try {
      const sucursalesRef = auditUserCollection(userProfile.uid, 'sucursales');
      const sucursalesSnapshot = await getDocs(query(sucursalesRef, where('empresaId', '==', empresaId)));
      const sucursalesIds = sucursalesSnapshot.docs.map(doc => doc.id);
      
      if (sucursalesIds.length === 0) {
        setEmpleados([]);
        return;
      }

      const empleadosRef = auditUserCollection(userProfile.uid, 'empleados');
      const empleadosSnapshot = await getDocs(query(empleadosRef, where('sucursalId', 'in', sucursalesIds)));
      const empleadosData = empleadosSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setEmpleados(empleadosData);
    } catch (error) {
      console.error('Error cargando empleados:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Empleados de {empresaNombre}</Typography>
        <Button
          variant="contained"
          startIcon={<PeopleIcon />}
          onClick={() => navigate('/empleados')}
        >
          Gestionar Empleados
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
          <CircularProgress />
        </Box>
      ) : empleados.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 3 }}>
          <Typography variant="body1" color="textSecondary">
            No hay empleados registrados para esta empresa
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {empleados.map((empleado) => (
            <Grid item xs={12} sm={6} md={4} key={empleado.id}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                    {empleado.nombre}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
                    <strong>DNI:</strong> {empleado.dni}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
                    <strong>Cargo:</strong> {empleado.cargo}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
                    <strong>Área:</strong> {empleado.area}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    <strong>Estado:</strong> {empleado.estado}
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

export default EmpleadosTab;

