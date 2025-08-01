import React, { useState, useEffect, useContext } from 'react';
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
  Tooltip,
  Collapse,
  TableSortLabel
} from '@mui/material';
import {
  Edit as EditIcon,
  Visibility as ViewIcon,
  Block as BlockIcon,
  CheckCircle as CheckIcon,
  Payment as PaymentIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  PlayArrow as DemoIcon,
  ExpandMore as ExpandMoreIcon
} from '@mui/icons-material';
import { collection, getDocs, updateDoc, doc, query, where, Timestamp, addDoc } from 'firebase/firestore';
import { db } from '../../../firebaseConfig';
import { toast } from 'react-toastify';
import HistorialPagosModal from './HistorialPagosModal';
import { AuthContext } from '../../context/AuthContext';

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
  const [openHistorial, setOpenHistorial] = useState(false);
  const [clienteHistorial, setClienteHistorial] = useState(null);
  const [expandedRows, setExpandedRows] = useState({});
  const [operariosPorCliente, setOperariosPorCliente] = useState({});
  const [orderBy, setOrderBy] = useState('creadoPor');
  const [order, setOrder] = useState('desc');
  const [openConfirmPago, setOpenConfirmPago] = useState(false);
  const [openConfirmDemo, setOpenConfirmDemo] = useState(false);
  const [clienteConfirmacion, setClienteConfirmacion] = useState(null);
  const { userProfile } = useContext(AuthContext); // Para obtener el email del usuario logueado

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

  // Cargar operarios de un cliente
  const cargarOperarios = async (clienteId) => {
    if (operariosPorCliente[clienteId]) return; // Ya cargados
    try {
      const usuariosRef = collection(db, 'usuarios');
      const q = query(usuariosRef, where('clienteAdminId', '==', clienteId), where('role', '==', 'operario'));
      const snapshot = await getDocs(q);
      setOperariosPorCliente(prev => ({
        ...prev,
        [clienteId]: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      }));
    } catch (error) {
      toast.error('Error al cargar operarios');
    }
  };

  const handleExpandRow = (clienteId) => {
    setExpandedRows(prev => ({ ...prev, [clienteId]: !prev[clienteId] }));
    if (!operariosPorCliente[clienteId]) cargarOperarios(clienteId);
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
        activo: true, // Activar al usuario automáticamente
        fechaVencimiento: Timestamp.fromDate(fechaVencimiento),
        esDemo: false,
        ultimaModificacion: Timestamp.now()
      });
      // Agregar registro al historial de pagos
      const pagosRef = collection(db, 'usuarios', cliente.id, 'pagos');
      await addDoc(pagosRef, {
        fecha: Timestamp.now(),
        tipo: 'pago',
        detalle: 'Se acreditó el pago de ControlDoc. ¡Gracias por su compra!',
        usuarioEmail: userProfile?.email || ''
      });
      toast.success(`Pago procesado para ${cliente.nombre || cliente.email}`);
      cargarClientes();
    } catch (error) {
      console.error('Error al procesar pago:', error);
      toast.error('Error al procesar pago');
    }
  };

  // Función para confirmar pago
  const confirmarPago = (cliente) => {
    setClienteConfirmacion(cliente);
    setOpenConfirmPago(true);
  };

  // Función para ejecutar pago después de confirmación
  const ejecutarPago = async () => {
    if (clienteConfirmacion) {
      await handlePago(clienteConfirmacion);
      setOpenConfirmPago(false);
      setClienteConfirmacion(null);
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
        activo: true, // Activar al usuario automáticamente
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

  // Función para confirmar demo
  const confirmarDemo = (cliente) => {
    setClienteConfirmacion(cliente);
    setOpenConfirmDemo(true);
  };

  // Función para ejecutar demo después de confirmación
  const ejecutarDemo = async () => {
    if (clienteConfirmacion) {
      await handleDemo(clienteConfirmacion);
      setOpenConfirmDemo(false);
      setClienteConfirmacion(null);
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

  // Función para manejar el ordenamiento
  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  // Función para ordenar los clientes
  const sortedClientes = React.useMemo(() => {
    const sorted = [...clientes].sort((a, b) => {
      let aValue, bValue;

      switch (orderBy) {
        case 'nombre':
          aValue = (a.nombre || a.displayName || '').toLowerCase();
          bValue = (b.nombre || b.displayName || '').toLowerCase();
          break;
        case 'email':
          aValue = (a.email || '').toLowerCase();
          bValue = (b.email || '').toLowerCase();
          break;
        case 'plan':
          aValue = (a.plan || 'estandar').toLowerCase();
          bValue = (b.plan || 'estandar').toLowerCase();
          break;
        case 'usuarios':
          aValue = a.usuariosActivos || 0;
          bValue = b.usuariosActivos || 0;
          break;
        case 'semaforo':
          // Ordenar por prioridad: rojo (1), amarillo (2), verde (3)
          const getSemaforoPriority = (semaforo) => {
            switch (semaforo) {
              case 'rojo': return 1;
              case 'amarillo': return 2;
              case 'verde': return 3;
              default: return 4;
            }
          };
          aValue = getSemaforoPriority(a.semaforo);
          bValue = getSemaforoPriority(b.semaforo);
          break;
        case 'estado':
          aValue = (a.estadoPago || 'al_dia').toLowerCase();
          bValue = (b.estadoPago || 'al_dia').toLowerCase();
          break;
        case 'vencimiento':
          aValue = a.fechaVencimiento ? a.fechaVencimiento.toDate() : new Date(0);
          bValue = b.fechaVencimiento ? b.fechaVencimiento.toDate() : new Date(0);
          break;
                 case 'demo':
           aValue = a.esDemo ? 1 : 0;
           bValue = b.esDemo ? 1 : 0;
           break;
                   case 'creadoPor':
            aValue = a.createdAt ? a.createdAt.toDate() : new Date(0);
            bValue = b.createdAt ? b.createdAt.toDate() : new Date(0);
            break;
         default:
           aValue = a[orderBy] || '';
           bValue = b[orderBy] || '';
      }

      if (aValue < bValue) {
        return order === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return order === 'asc' ? 1 : -1;
      }
      return 0;
    });

    return sorted;
  }, [clientes, orderBy, order]);

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
                <TableCell>Detalles</TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'nombre'}
                    direction={orderBy === 'nombre' ? order : 'asc'}
                    onClick={() => handleRequestSort('nombre')}
                  >
                    Cliente
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'email'}
                    direction={orderBy === 'email' ? order : 'asc'}
                    onClick={() => handleRequestSort('email')}
                  >
                    Email
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'plan'}
                    direction={orderBy === 'plan' ? order : 'asc'}
                    onClick={() => handleRequestSort('plan')}
                  >
                    Plan
                  </TableSortLabel>
                </TableCell>
                                 <TableCell width="80px">
                   <TableSortLabel
                     active={orderBy === 'usuarios'}
                     direction={orderBy === 'usuarios' ? order : 'asc'}
                     onClick={() => handleRequestSort('usuarios')}
                   >
                     Usuarios
                   </TableSortLabel>
                 </TableCell>
                 <TableCell width="80px">
                   <TableSortLabel
                     active={orderBy === 'semaforo'}
                     direction={orderBy === 'semaforo' ? order : 'asc'}
                     onClick={() => handleRequestSort('semaforo')}
                   >
                     Semaforo
                   </TableSortLabel>
                 </TableCell>
                 <TableCell width="100px">
                   <TableSortLabel
                     active={orderBy === 'estado'}
                     direction={orderBy === 'estado' ? order : 'asc'}
                     onClick={() => handleRequestSort('estado')}
                   >
                     Estado
                   </TableSortLabel>
                 </TableCell>
                 <TableCell width="120px">
                   <TableSortLabel
                     active={orderBy === 'vencimiento'}
                     direction={orderBy === 'vencimiento' ? order : 'asc'}
                     onClick={() => handleRequestSort('vencimiento')}
                   >
                     Vencimiento
                   </TableSortLabel>
                 </TableCell>
                 <TableCell width="80px">
                   <TableSortLabel
                     active={orderBy === 'demo'}
                     direction={orderBy === 'demo' ? order : 'asc'}
                     onClick={() => handleRequestSort('demo')}
                   >
                     Demo
                   </TableSortLabel>
                 </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'creadoPor'}
                    direction={orderBy === 'creadoPor' ? order : 'asc'}
                    onClick={() => handleRequestSort('creadoPor')}
                  >
                    Creado
                  </TableSortLabel>
                </TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedClientes.map((cliente) => {
                const fechaVencimiento = cliente.fechaVencimiento ? 
                  new Date(cliente.fechaVencimiento.toDate()) : null;
                const diasRestantes = fechaVencimiento ? 
                  Math.ceil((fechaVencimiento - new Date()) / (1000 * 60 * 60 * 24)) : 0;
                
                return (
                  <React.Fragment key={cliente.id}>
                    <TableRow>
                      <TableCell>
                        <Tooltip title={`Estado: ${cliente.semaforo}`}>
                          <IconButton 
                            color={getSemaforoColor(cliente.semaforo)}
                            size="small"
                          >
                            {getSemaforoIcon(cliente.semaforo)}
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
                        <Tooltip title="Ver historial de pagos y acciones">
                          <IconButton
                            onClick={() => {
                              setClienteHistorial(cliente);
                              setOpenHistorial(true);
                            }}
                            color="info"
                            size="small"
                          >
                            <span role="img" aria-label="historial">📜</span>
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
                                             <TableCell width="80px">
                         <Typography variant="body2" align="center">
                           {cliente.usuariosActivos} / {cliente.limiteUsuarios || 10}
                         </Typography>
                         {cliente.usuariosActivos > (cliente.limiteUsuarios || 10) && (
                           <Alert severity="warning" sx={{ mt: 1, fontSize: '0.75rem' }}>
                             Límite excedido
                           </Alert>
                         )}
                       </TableCell>
                       <TableCell width="80px" align="center">
                         <Tooltip title={`Estado: ${cliente.semaforo}`}>
                           <IconButton 
                             color={getSemaforoColor(cliente.semaforo)}
                             size="small"
                           >
                             {getSemaforoIcon(cliente.semaforo)}
                           </IconButton>
                         </Tooltip>
                       </TableCell>
                       <TableCell width="100px">
                         <Chip 
                           label={cliente.estadoPago || 'al_dia'} 
                           color={getEstadoPagoColor(cliente.estadoPago)}
                           size="small"
                         />
                       </TableCell>
                       <TableCell width="120px">
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
                       <TableCell width="80px" align="center">
                         <Chip 
                           label={cliente.esDemo ? 'Sí' : 'No'} 
                           color={cliente.esDemo ? 'warning' : 'default'}
                           size="small"
                         />
                       </TableCell>
                      <TableCell>
                        {cliente.createdAt && (
                          <Typography variant="body2" color="text.secondary">
                            {new Date(cliente.createdAt.toDate ? cliente.createdAt.toDate() : cliente.createdAt).toLocaleDateString()}
                          </Typography>
                        )}
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
                               onClick={() => confirmarPago(cliente)}
                               color="success"
                               size="small"
                             >
                               <PaymentIcon />
                             </IconButton>
                           </Tooltip>
                           <Tooltip title="Activar Demo">
                             <IconButton 
                               onClick={() => confirmarDemo(cliente)}
                               color="warning"
                               size="small"
                             >
                               <DemoIcon />
                             </IconButton>
                           </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                                         <TableRow 
                       onClick={() => handleExpandRow(cliente.id)}
                       sx={{ 
                         cursor: 'pointer',
                         '&:hover': { backgroundColor: 'action.hover' }
                       }}
                     >
                       <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={11}>
                         <Box display="flex" justifyContent="center" alignItems="center" py={1}>
                           <Tooltip title="Ver operarios">
                             <Box display="flex" alignItems="center" gap={1}>
                               <ExpandMoreIcon
                                 style={{ transform: expandedRows[cliente.id] ? 'rotate(180deg)' : 'rotate(0deg)', transition: '0.2s' }}
                                 color="primary"
                               />
                               <Typography variant="body2" color="primary">
                                 {expandedRows[cliente.id] ? 'Ocultar operarios' : 'Ver operarios'}
                               </Typography>
                             </Box>
                           </Tooltip>
                         </Box>
                         <Collapse in={expandedRows[cliente.id]} timeout="auto" unmountOnExit>
                           <Box margin={2}>
                             <Typography variant="subtitle2" gutterBottom>Operarios</Typography>
                             <Table size="small">
                               <TableHead>
                                 <TableRow>
                                   <TableCell>Nombre</TableCell>
                                   <TableCell>Email</TableCell>
                                   <TableCell>Estado</TableCell>
                                 </TableRow>
                               </TableHead>
                               <TableBody>
                                 {(operariosPorCliente[cliente.id] || []).map((operario) => (
                                   <TableRow key={operario.id}>
                                     <TableCell>{operario.nombre || operario.displayName || 'Sin nombre'}</TableCell>
                                     <TableCell>{operario.email}</TableCell>
                                     <TableCell>
                                       <Chip label={operario.activo !== false ? 'Activo' : 'Inactivo'} color={operario.activo !== false ? 'success' : 'error'} size="small" />
                                     </TableCell>
                                   </TableRow>
                                 ))}
                                 {(operariosPorCliente[cliente.id]?.length === 0) && (
                                   <TableRow><TableCell colSpan={3} align="center">Sin operarios</TableCell></TableRow>
                                 )}
                               </TableBody>
                             </Table>
                           </Box>
                         </Collapse>
                       </TableCell>
                     </TableRow>
                  </React.Fragment>
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
            label="Fecha de Vencimiento (editable)"
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
             <HistorialPagosModal
         open={openHistorial}
         onClose={() => setOpenHistorial(false)}
         cliente={clienteHistorial}
       />

       {/* Dialog de confirmación para pago */}
       <Dialog open={openConfirmPago} onClose={() => setOpenConfirmPago(false)}>
         <DialogTitle>Confirmar Procesamiento de Pago</DialogTitle>
         <DialogContent>
           <Typography>
             ¿Estás seguro de que deseas procesar el pago para{' '}
             <strong>{clienteConfirmacion?.nombre || clienteConfirmacion?.email}</strong>?
           </Typography>
           <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
             Esta acción:
           </Typography>
           <ul>
             <li>Activará al usuario automáticamente</li>
             <li>Establecerá el estado de pago como "al día"</li>
             <li>Extenderá el acceso por 1 mes</li>
             <li>Registrará el pago en el historial</li>
           </ul>
         </DialogContent>
         <DialogActions>
           <Button onClick={() => setOpenConfirmPago(false)}>Cancelar</Button>
           <Button onClick={ejecutarPago} variant="contained" color="success">
             Confirmar Pago
           </Button>
         </DialogActions>
       </Dialog>

       {/* Dialog de confirmación para demo */}
       <Dialog open={openConfirmDemo} onClose={() => setOpenConfirmDemo(false)}>
         <DialogTitle>Confirmar Activación de Demo</DialogTitle>
         <DialogContent>
           <Typography>
             ¿Estás seguro de que deseas activar el demo para{' '}
             <strong>{clienteConfirmacion?.nombre || clienteConfirmacion?.email}</strong>?
           </Typography>
           <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
             Esta acción:
           </Typography>
           <ul>
             <li>Activará al usuario automáticamente</li>
             <li>Marcará al cliente como usuario de demostración</li>
             <li>Establecerá el estado de pago como "al día"</li>
             <li>Extenderá el acceso por 1 mes</li>
           </ul>
         </DialogContent>
         <DialogActions>
           <Button onClick={() => setOpenConfirmDemo(false)}>Cancelar</Button>
           <Button onClick={ejecutarDemo} variant="contained" color="warning">
             Confirmar Demo
           </Button>
         </DialogActions>
       </Dialog>
     </Box>
   );
 };

export default GestionClientes; 