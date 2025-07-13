import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
  Grid,
  Chip,
  IconButton,
  Alert,
  Switch,
  FormControlLabel,
  Tooltip
} from '@mui/material';
import {
  Edit as EditIcon,
  Visibility as ViewIcon,
  Block as BlockIcon,
  CheckCircle as CheckIcon,
  Payment as PaymentIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  PlayArrow as DemoIcon
} from '@mui/icons-material';
import { collection, getDocs, updateDoc, doc, query, where, Timestamp } from 'firebase/firestore';
import { db } from '../../../firebaseConfig';
import { toast } from 'react-toastify';

const GestionClientes = () => {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [clienteEditando, setClienteEditando] = useState(null);
  const [form, setForm] = useState({
    limiteUsuarios: 0,
    plan: 'estandar',
    estadoPago: 'al_dia',
    fechaVencimiento: '',
    esDemo: false,
    activo: true
  });

  // Cargar todos los clientes (max)
  const cargarClientes = async () => {
    setLoading(true);
    try {
      const usuariosRef = collection(db, 'usuarios');
      const q = query(usuariosRef, where('role', '==', 'max'));
      const snapshot = await getDocs(q);
      
      const clientesData = await Promise.all(
        snapshot.docs.map(async (doc) => {
          const cliente = { id: doc.id, ...doc.data() };
          
          // Contar usuarios activos (operarios)
          const qOperarios = query(usuariosRef, where('clienteAdminId', '==', doc.id));
          const snapshotOperarios = await getDocs(qOperarios);
          cliente.usuariosActivos = snapshotOperarios.size;
          
          // Contar empresas
          const empresasRef = collection(db, 'empresas');
          const qEmpresas = query(empresasRef, where('propietarioId', '==', doc.id));
          const snapshotEmpresas = await getDocs(qEmpresas);
          cliente.empresasCount = snapshotEmpresas.size;
          
          // Calcular estado del semáforo
          cliente.semaforo = calcularSemaforo(cliente);
          
          return cliente;
        })
      );
      
      setClientes(clientesData);
    } catch (error) {
      console.error('Error al cargar clientes:', error);
      toast.error('Error al cargar clientes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarClientes();
  }, []);

  const handleEditCliente = (cliente) => {
    setClienteEditando(cliente);
    setForm({
      limiteUsuarios: cliente.limiteUsuarios || 10,
      plan: cliente.plan || 'estandar',
      estadoPago: cliente.estadoPago || 'al_dia',
      fechaVencimiento: cliente.fechaVencimiento ? 
        new Date(cliente.fechaVencimiento.toDate()).toISOString().split('T')[0] : '',
      esDemo: cliente.esDemo || false,
      activo: cliente.activo !== false
    });
    setOpenDialog(true);
  };

  const handleSaveCliente = async () => {
    try {
      const userRef = doc(db, 'usuarios', clienteEditando.id);
      const updateData = {
        limiteUsuarios: Number(form.limiteUsuarios),
        plan: form.plan,
        estadoPago: form.estadoPago,
        esDemo: form.esDemo,
        activo: form.activo,
        ultimaModificacion: Timestamp.now()
      };
      
      // Si hay fecha de vencimiento, convertirla
      if (form.fechaVencimiento) {
        updateData.fechaVencimiento = Timestamp.fromDate(new Date(form.fechaVencimiento));
      }
      
      await updateDoc(userRef, updateData);
      
      toast.success('Cliente actualizado correctamente');
      setOpenDialog(false);
      cargarClientes();
    } catch (error) {
      console.error('Error al actualizar cliente:', error);
      toast.error('Error al actualizar cliente');
    }
  };

  const getEstadoPagoColor = (estado) => {
    switch (estado) {
      case 'al_dia': return 'success';
      case 'vencido': return 'error';
      case 'pendiente': return 'warning';
      default: return 'default';
    }
  };

  // Función para calcular el estado del semáforo
  const calcularSemaforo = (cliente) => {
    const hoy = new Date();
    const fechaVencimiento = cliente.fechaVencimiento ? new Date(cliente.fechaVencimiento.toDate()) : null;
    const diasRestantes = fechaVencimiento ? Math.ceil((fechaVencimiento - hoy) / (1000 * 60 * 60 * 24)) : 0;
    
    if (!cliente.activo) return 'rojo';
    if (cliente.esDemo) {
      if (diasRestantes <= 0) return 'rojo';
      if (diasRestantes <= 7) return 'amarillo';
      return 'verde';
    }
    if (cliente.estadoPago === 'vencido') return 'rojo';
    if (cliente.estadoPago === 'pendiente') return 'amarillo';
    if (diasRestantes <= 7) return 'amarillo';
    return 'verde';
  };

  // Función para obtener el color del semáforo
  const getSemaforoColor = (semaforo) => {
    switch (semaforo) {
      case 'verde': return 'success';
      case 'amarillo': return 'warning';
      case 'rojo': return 'error';
      default: return 'default';
    }
  };

  // Función para obtener el icono del semáforo
  const getSemaforoIcon = (semaforo) => {
    switch (semaforo) {
      case 'verde': return <CheckIcon />;
      case 'amarillo': return <WarningIcon />;
      case 'rojo': return <ErrorIcon />;
      default: return <ErrorIcon />;
    }
  };

  // Función para procesar pago
  const handlePago = async (cliente) => {
    try {
      const userRef = doc(db, 'usuarios', cliente.id);
      const fechaVencimiento = new Date();
      fechaVencimiento.setMonth(fechaVencimiento.getMonth() + 1); // 1 mes
      
      await updateDoc(userRef, {
        estadoPago: 'al_dia',
        fechaVencimiento: Timestamp.fromDate(fechaVencimiento),
        esDemo: false,
        ultimaModificacion: Timestamp.now()
      });
      
      toast.success(`Pago procesado para ${cliente.nombre || cliente.email}`);
      cargarClientes();
    } catch (error) {
      console.error('Error al procesar pago:', error);
      toast.error('Error al procesar pago');
    }
  };

  // Función para activar demo
  const handleDemo = async (cliente) => {
    try {
      const userRef = doc(db, 'usuarios', cliente.id);
      const fechaVencimiento = new Date();
      fechaVencimiento.setMonth(fechaVencimiento.getMonth() + 1); // 1 mes de demo
      
      await updateDoc(userRef, {
        esDemo: true,
        fechaVencimiento: Timestamp.fromDate(fechaVencimiento),
        estadoPago: 'al_dia',
        ultimaModificacion: Timestamp.now()
      });
      
      toast.success(`Demo activado para ${cliente.nombre || cliente.email}`);
      cargarClientes();
    } catch (error) {
      console.error('Error al activar demo:', error);
      toast.error('Error al activar demo');
    }
  };

  // Función para activar/desactivar cliente
  const handleToggleActivo = async (cliente) => {
    try {
      const userRef = doc(db, 'usuarios', cliente.id);
      await updateDoc(userRef, {
        activo: !cliente.activo,
        ultimaModificacion: Timestamp.now()
      });
      
      toast.success(`${cliente.activo ? 'Desactivado' : 'Activado'} ${cliente.nombre || cliente.email}`);
      cargarClientes();
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      toast.error('Error al cambiar estado');
    }
  };

  const getPlanColor = (plan) => {
    switch (plan) {
      case 'premium': return 'primary';
      case 'estandar': return 'secondary';
      case 'basico': return 'default';
      default: return 'default';
    }
  };

  // Calcular métricas
  const totalClientes = clientes.length;
  const clientesActivos = clientes.filter(c => c.activo !== false).length;
  const clientesDemo = clientes.filter(c => c.esDemo).length;
  const clientesVencidos = clientes.filter(c => c.semaforo === 'rojo').length;
  const totalUsuarios = clientes.reduce((sum, c) => sum + c.usuariosActivos, 0);
  const ingresosEstimados = clientes.reduce((sum, c) => {
    const precioPorUsuario = c.plan === 'premium' ? 50 : c.plan === 'estandar' ? 30 : 20;
    return sum + (c.usuariosActivos * precioPorUsuario);
  }, 0);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Gestión de Clientes
      </Typography>

      {/* Métricas */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Clientes
              </Typography>
              <Typography variant="h4">
                {totalClientes}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Clientes Activos
              </Typography>
              <Typography variant="h4" color="success.main">
                {clientesActivos}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                En Demo
              </Typography>
              <Typography variant="h4" color="warning.main">
                {clientesDemo}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Vencidos
              </Typography>
              <Typography variant="h4" color="error.main">
                {clientesVencidos}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Usuarios
              </Typography>
              <Typography variant="h4" color="primary.main">
                {totalUsuarios}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Ingresos Estimados
              </Typography>
              <Typography variant="h4" color="success.main">
                ${ingresosEstimados.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabla de Clientes */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Semáforo</TableCell>
                <TableCell>Cliente</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Plan</TableCell>
                <TableCell>Usuarios</TableCell>
                <TableCell>Empresas</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Vencimiento</TableCell>
                <TableCell>Demo</TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {clientes.map((cliente) => {
                const fechaVencimiento = cliente.fechaVencimiento ? 
                  new Date(cliente.fechaVencimiento.toDate()) : null;
                const diasRestantes = fechaVencimiento ? 
                  Math.ceil((fechaVencimiento - new Date()) / (1000 * 60 * 60 * 24)) : 0;
                
                return (
                  <TableRow key={cliente.id}>
                    <TableCell>
                      <Tooltip title={`Estado: ${cliente.semaforo}`}>
                        <IconButton 
                          color={getSemaforoColor(cliente.semaforo)}
                          size="small"
                        >
                          {getSemaforoIcon(cliente.semaforo)}
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Typography variant="subtitle2">
                        {cliente.nombre || cliente.displayName || 'Sin nombre'}
                      </Typography>
                      <Chip 
                        label={cliente.activo ? 'Activo' : 'Inactivo'} 
                        color={cliente.activo ? 'success' : 'error'}
                        size="small"
                        sx={{ mt: 0.5 }}
                      />
                    </TableCell>
                    <TableCell>{cliente.email}</TableCell>
                    <TableCell>
                      <Chip 
                        label={cliente.plan || 'estandar'} 
                        color={getPlanColor(cliente.plan)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {cliente.usuariosActivos} / {cliente.limiteUsuarios || 10}
                      </Typography>
                      {cliente.usuariosActivos > (cliente.limiteUsuarios || 10) && (
                        <Alert severity="warning" sx={{ mt: 1, fontSize: '0.75rem' }}>
                          Límite excedido
                        </Alert>
                      )}
                    </TableCell>
                    <TableCell>{cliente.empresasCount || 0}</TableCell>
                    <TableCell>
                      <Chip 
                        label={cliente.estadoPago || 'al_dia'} 
                        color={getEstadoPagoColor(cliente.estadoPago)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {fechaVencimiento ? (
                        <Box>
                          <Typography variant="body2">
                            {fechaVencimiento.toLocaleDateString()}
                          </Typography>
                          <Typography 
                            variant="caption" 
                            color={diasRestantes <= 7 ? 'error' : 'text.secondary'}
                          >
                            {diasRestantes > 0 ? `${diasRestantes} días` : 'Vencido'}
                          </Typography>
                        </Box>
                      ) : (
                        'N/A'
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={cliente.esDemo ? 'Sí' : 'No'} 
                        color={cliente.esDemo ? 'warning' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box display="flex" gap={1}>
                        <Tooltip title="Editar">
                          <IconButton 
                            onClick={() => handleEditCliente(cliente)}
                            color="primary"
                            size="small"
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Procesar Pago">
                          <IconButton 
                            onClick={() => handlePago(cliente)}
                            color="success"
                            size="small"
                          >
                            <PaymentIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Activar Demo">
                          <IconButton 
                            onClick={() => handleDemo(cliente)}
                            color="warning"
                            size="small"
                          >
                            <DemoIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={cliente.activo ? 'Desactivar' : 'Activar'}>
                          <IconButton 
                            onClick={() => handleToggleActivo(cliente)}
                            color={cliente.activo ? 'error' : 'success'}
                            size="small"
                          >
                            {cliente.activo ? <BlockIcon /> : <CheckIcon />}
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Dialog para editar cliente */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Editar Cliente: {clienteEditando?.nombre || clienteEditando?.email}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Límite de Usuarios"
            type="number"
            fullWidth
            value={form.limiteUsuarios}
            onChange={(e) => setForm({ ...form, limiteUsuarios: e.target.value })}
            inputProps={{ min: 1 }}
          />
          <TextField
            margin="dense"
            label="Plan"
            select
            fullWidth
            value={form.plan}
            onChange={(e) => setForm({ ...form, plan: e.target.value })}
            SelectProps={{ native: true }}
          >
            <option value="basico">Básico</option>
            <option value="estandar">Estándar</option>
            <option value="premium">Premium</option>
          </TextField>
          <TextField
            margin="dense"
            label="Estado de Pago"
            select
            fullWidth
            value={form.estadoPago}
            onChange={(e) => setForm({ ...form, estadoPago: e.target.value })}
            SelectProps={{ native: true }}
          >
            <option value="al_dia">Al día</option>
            <option value="pendiente">Pendiente</option>
            <option value="vencido">Vencido</option>
          </TextField>
          <TextField
            margin="dense"
            label="Fecha de Vencimiento"
            type="date"
            fullWidth
            value={form.fechaVencimiento}
            onChange={(e) => setForm({ ...form, fechaVencimiento: e.target.value })}
            InputLabelProps={{ shrink: true }}
          />
          <FormControlLabel
            control={
              <Switch
                checked={form.esDemo}
                onChange={(e) => setForm({ ...form, esDemo: e.target.checked })}
              />
            }
            label="Es Demo"
            sx={{ mt: 1 }}
          />
          <FormControlLabel
            control={
              <Switch
                checked={form.activo}
                onChange={(e) => setForm({ ...form, activo: e.target.checked })}
              />
            }
            label="Activo"
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
          <Button onClick={handleSaveCliente} variant="contained">
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GestionClientes; 