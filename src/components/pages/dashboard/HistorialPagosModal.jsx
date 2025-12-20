import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  Typography,
  CircularProgress,
  Box
} from '@mui/material';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../../firebaseConfig';
import PaymentIcon from '@mui/icons-material/Payment';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import EditIcon from '@mui/icons-material/Edit';
import AutorenewIcon from '@mui/icons-material/Autorenew';

const tipoIcono = {
  pago: <PaymentIcon color="success" />,
  demo: <PlayArrowIcon color="warning" />,
  cambio_plan: <EditIcon color="primary" />,
  cambio_limite: <AutorenewIcon color="secondary" />,
};

const tipoLabel = {
  pago: 'Pago',
  demo: 'Demo',
  cambio_plan: 'Cambio de Plan',
  cambio_limite: 'Cambio de Límite',
};

const HistorialPagosModal = ({ open, onClose, cliente }) => {
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchHistorial = async () => {
      if (!cliente) return;
      setLoading(true);
      try {
        const pagosRef = collection(db, 'apps', 'audit', 'users', cliente.id, 'pagos');
        const q = query(pagosRef, orderBy('fecha', 'desc'));
        const snapshot = await getDocs(q);
        setHistorial(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        setHistorial([]);
      } finally {
        setLoading(false);
      }
    };
    if (open) fetchHistorial();
  }, [open, cliente]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Historial de Pagos y Acciones</DialogTitle>
      <DialogContent>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" py={4}>
            <CircularProgress />
          </Box>
        ) : historial.length === 0 ? (
          <Typography variant="body1" color="text.secondary" sx={{ py: 4 }}>
            No hay historial registrado para este cliente.
          </Typography>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Fecha</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Monto</TableCell>
                <TableCell>Usuario</TableCell>
                <TableCell>Detalle</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {historial.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    {item.fecha?.toDate ? new Date(item.fecha.toDate()).toLocaleString() : ''}
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={tipoIcono[item.tipo] || <EditIcon />}
                      label={tipoLabel[item.tipo] || item.tipo}
                      color={
                        item.tipo === 'pago' ? 'success' :
                        item.tipo === 'demo' ? 'warning' :
                        item.tipo === 'cambio_plan' ? 'primary' :
                        'secondary'
                      }
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {item.monto ? `$${item.monto}` : '-'}
                  </TableCell>
                  <TableCell>
                    {item.usuarioEmail || item.usuario || '-'}
                  </TableCell>
                  <TableCell>
                    {item.detalle || '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
};

export default HistorialPagosModal; 