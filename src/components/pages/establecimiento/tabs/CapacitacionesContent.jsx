import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { dbAudit } from '../../../../firebaseControlFile';

const CapacitacionesContent = ({ sucursalId, sucursalNombre, navigateToPage }) => {
  const [capacitaciones, setCapacitaciones] = useState([]);
  const [planesAnuales, setPlanesAnuales] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (sucursalId) {
      loadCapacitaciones();
    }
  }, [sucursalId]);

  const loadCapacitaciones = async () => {
    setLoading(true);
    try {
      console.log('Cargando capacitaciones para sucursal:', sucursalId);
      
      // Cargar capacitaciones individuales
      let capacitacionesData = [];
      try {
        const capacitacionesQuery = query(collection(dbAudit, 'capacitaciones'), where('sucursalId', '==', sucursalId));
        const capacitacionesSnapshot = await getDocs(capacitacionesQuery);
        capacitacionesData = capacitacionesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          tipo: 'individual'
        }));
        console.log('Capacitaciones encontradas con sucursalId:', capacitacionesData.length, capacitacionesData);
        
        // Si no encuentra capacitaciones específicas de la sucursal, buscar por empresa
        if (capacitacionesData.length === 0) {
          console.log('No se encontraron capacitaciones específicas de la sucursal, buscando por empresa...');
          // Aquí necesitaríamos el empresaId, pero por ahora solo mostramos el mensaje
        }
      } catch (capError) {
        console.log('Error cargando capacitaciones:', capError);
      }

      // Cargar planes anuales - usar el nombre correcto de la colección
      let planesData = [];
      try {
        const planesQuery = query(collection(dbAudit, 'planes_capacitaciones_anuales'), where('sucursalId', '==', sucursalId));
        const planesSnapshot = await getDocs(planesQuery);
        planesData = planesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          tipo: 'plan_anual'
        }));
        console.log('Planes anuales encontrados:', planesData.length, planesData);
      } catch (planesError) {
        console.log('Error con planes_capacitaciones_anuales:', planesError);
      }

      setCapacitaciones(capacitacionesData);
      setPlanesAnuales(planesData);
    } catch (error) {
      console.error('Error cargando capacitaciones:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Capacitaciones de {sucursalNombre}</Typography>
        <Button
          variant="contained"
          startIcon={<SchoolIcon />}
          onClick={() => navigateToPage('/capacitaciones', sucursalId)}
          size="small"
        >
          Gestionar Capacitaciones
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
          <CircularProgress size={30} />
        </Box>
      ) : capacitaciones.length === 0 && planesAnuales.length === 0 ? (
        <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', py: 2 }}>
          No hay capacitaciones ni planes anuales registrados
        </Typography>
      ) : (
        <Box>
          {/* Capacitaciones Individuales */}
          {capacitaciones.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
                Capacitaciones Individuales ({capacitaciones.length})
              </Typography>
              <TableContainer component={Paper} sx={{ maxHeight: 300 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Nombre</strong></TableCell>
                      <TableCell><strong>Tipo</strong></TableCell>
                      <TableCell><strong>Estado</strong></TableCell>
                      <TableCell><strong>Fecha</strong></TableCell>
                      <TableCell align="center"><strong>Asistentes</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {capacitaciones.map((capacitacion) => (
                      <TableRow key={capacitacion.id} hover>
                        <TableCell>{capacitacion.nombre}</TableCell>
                        <TableCell>{capacitacion.tipo}</TableCell>
                        <TableCell>{capacitacion.estado}</TableCell>
                        <TableCell>
                          {capacitacion.fechaRealizada?.toDate?.()?.toLocaleDateString() || 'N/A'}
                        </TableCell>
                        <TableCell align="center">{capacitacion.asistentes?.length || 0}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {/* Planes Anuales */}
          {planesAnuales.length > 0 && (
            <Box>
              <Typography variant="h6" sx={{ mb: 2, color: 'secondary.main' }}>
                Planes Anuales ({planesAnuales.length})
              </Typography>
              <TableContainer component={Paper} sx={{ maxHeight: 300 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Nombre del Plan</strong></TableCell>
                      <TableCell><strong>Año</strong></TableCell>
                      <TableCell><strong>Estado</strong></TableCell>
                      <TableCell><strong>Fecha Inicio</strong></TableCell>
                      <TableCell align="center"><strong>Capacitaciones</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {planesAnuales.map((plan) => (
                      <TableRow key={plan.id} hover>
                        <TableCell>{plan.nombre}</TableCell>
                        <TableCell>{plan.año}</TableCell>
                        <TableCell>{plan.estado}</TableCell>
                        <TableCell>
                          {plan.fechaInicio?.toDate?.()?.toLocaleDateString() || 'N/A'}
                        </TableCell>
                        <TableCell align="center">{plan.capacitaciones?.length || 0}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};

export default CapacitacionesContent;
