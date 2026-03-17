import logger from '@/utils/logger';
import { useState, useEffect } from 'react';
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
import { useAuth } from '@/components/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { establecimientoOverviewService } from '../../../../services/establecimientoOverviewService';

const EmpleadosTab = ({ empresaId, empresaNombre }) => {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const [empleados, setEmpleados] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (empresaId && userProfile?.ownerId) {
      loadEmpleados();
    }
  }, [empresaId, userProfile?.ownerId]);

  const loadEmpleados = async () => {
    if (!userProfile?.ownerId) {
      setEmpleados([]);
      return;
    }

    setLoading(true);
    try {
      const ownerId = userProfile.ownerId;
      const empleadosData = await establecimientoOverviewService.listEmpleadosByEmpresa(ownerId, empresaId);
      setEmpleados(empleadosData);
    } catch (error) {
      logger.error('Error cargando empleados:', error);
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

