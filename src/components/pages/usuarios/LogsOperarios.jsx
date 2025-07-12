import React, { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography, Box } from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../../../firebaseConfig';

const LogsOperarios = () => {
  const { role } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const logsRef = collection(db, 'logs_operarios');
      const qLogs = query(logsRef, orderBy('fecha', 'desc'), limit(100));
      const snapshot = await getDocs(qLogs);
      setLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (e) {
      toast.error('Error al cargar logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // Verificar permisos multi-tenant
  if (role !== 'max' && role !== 'supermax') {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">
          Acceso restringido solo para administradores (max) y super administradores (supermax).
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2 }}>Logs de Acciones de Operarios</Typography>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Fecha</TableCell>
              <TableCell>Operario ID</TableCell>
              <TableCell>Acción</TableCell>
              <TableCell>Detalles</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {logs.map(log => (
              <TableRow key={log.id}>
                <TableCell>{log.fecha?.toDate?.().toLocaleString?.() || ''}</TableCell>
                <TableCell>{log.userId}</TableCell>
                <TableCell>{log.accion}</TableCell>
                <TableCell>
                  <pre style={{ fontSize: 12, margin: 0 }}>{JSON.stringify(log.detalles, null, 2)}</pre>
                </TableCell>
              </TableRow>
            ))}
            {logs.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={4} align="center">No hay logs recientes.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default LogsOperarios; 