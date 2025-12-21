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
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../../../firebaseControlFile';

const AccidentesContent = ({ sucursalId, sucursalNombre, empresaId, navigateToPage }) => {
  const [accidentes, setAccidentes] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (sucursalId) {
      loadAccidentes();
    }
  }, [sucursalId]);

  const loadAccidentes = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'accidentes'), where('sucursalId', '==', sucursalId));
      const snapshot = await getDocs(q);
      const accidentesData = snapshot.docs.map(doc => ({
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

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Accidentes de {sucursalNombre}</Typography>
        <Button
          variant="contained"
          startIcon={<ReportProblemIcon />}
          onClick={() => navigateToPage('/accidentes', { empresaId, sucursalId })}
          size="small"
        >
          Gestionar Accidentes
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
          <CircularProgress size={30} />
        </Box>
      ) : accidentes.length === 0 ? (
        <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', py: 2 }}>
          No hay accidentes registrados
        </Typography>
      ) : (
        <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell><strong>Tipo</strong></TableCell>
                <TableCell><strong>Empleado</strong></TableCell>
                <TableCell><strong>Gravedad</strong></TableCell>
                <TableCell><strong>Fecha</strong></TableCell>
                <TableCell><strong>Estado</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {accidentes.map((accidente) => (
                <TableRow key={accidente.id} hover>
                  <TableCell>{accidente.tipo}</TableCell>
                  <TableCell>{accidente.empleadoNombre}</TableCell>
                  <TableCell>{accidente.gravedad}</TableCell>
                  <TableCell>
                    {accidente.fechaHora?.toDate?.()?.toLocaleDateString() || 'N/A'}
                  </TableCell>
                  <TableCell>{accidente.estado}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default AccidentesContent;
