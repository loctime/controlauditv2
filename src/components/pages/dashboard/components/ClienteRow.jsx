import React from 'react';
import {
  TableRow,
  TableCell,
  Typography,
  Chip,
  Box,
  Alert,
  IconButton,
  Tooltip,
  Collapse
} from '@mui/material';
import {
  Edit as EditIcon,
  Block as BlockIcon,
  CheckCircle as CheckIcon,
  Payment as PaymentIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  PlayArrow as DemoIcon,
  ExpandMore as ExpandMoreIcon
} from '@mui/icons-material';
import { Table, TableBody, TableHead } from '@mui/material';

const ClienteRow = ({
  cliente,
  expanded,
  operarios,
  onExpand,
  onEdit,
  onConfirmPago,
  onConfirmDemo,
  onToggleActivo,
  onOpenHistorial
}) => {
  // Funciones helper
  const getEstadoPagoColor = (estado) => {
    switch (estado) {
      case 'al_dia': return 'success';
      case 'vencido': return 'error';
      case 'pendiente': return 'warning';
      default: return 'default';
    }
  };

  const getSemaforoColor = (semaforo) => {
    switch (semaforo) {
      case 'verde': return 'success';
      case 'amarillo': return 'warning';
      case 'rojo': return 'error';
      default: return 'default';
    }
  };

  const getSemaforoIcon = (semaforo) => {
    switch (semaforo) {
      case 'verde': return <CheckIcon />;
      case 'amarillo': return <WarningIcon />;
      case 'rojo': return <ErrorIcon />;
      default: return <ErrorIcon />;
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

  const fechaVencimiento = cliente.fechaVencimiento ? 
    (cliente.fechaVencimiento.toDate ? new Date(cliente.fechaVencimiento.toDate()) : new Date(cliente.fechaVencimiento)) : null;
  const diasRestantes = fechaVencimiento ? 
    Math.ceil((fechaVencimiento - new Date()) / (1000 * 60 * 60 * 24)) : 0;

  return (
    <React.Fragment>
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
              onClick={onToggleActivo}
              color={cliente.activo ? 'error' : 'success'}
              size="small"
            >
              {cliente.activo ? <BlockIcon /> : <CheckIcon />}
            </IconButton>
          </Tooltip>
          <Tooltip title="Ver historial de pagos y acciones">
            <IconButton
              onClick={onOpenHistorial}
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
                onClick={onEdit}
                color="primary"
                size="small"
              >
                <EditIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Procesar Pago">
              <IconButton 
                onClick={onConfirmPago}
                color="success"
                size="small"
              >
                <PaymentIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Activar Demo">
              <IconButton 
                onClick={onConfirmDemo}
                color="warning"
                size="small"
              >
                <DemoIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </TableCell>
      </TableRow>
      
      {/* Fila expandible para operarios */}
      <TableRow 
        onClick={onExpand}
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
                  style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: '0.2s' }}
                  color="primary"
                />
                <Typography variant="body2" color="primary">
                  {expanded ? 'Ocultar operarios' : 'Ver operarios'}
                </Typography>
              </Box>
            </Tooltip>
          </Box>
          <Collapse in={expanded} timeout="auto" unmountOnExit>
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
                  {operarios.map((operario) => (
                    <TableRow key={operario.id}>
                      <TableCell>{operario.nombre || operario.displayName || 'Sin nombre'}</TableCell>
                      <TableCell>{operario.email}</TableCell>
                      <TableCell>
                        <Chip 
                          label={operario.activo !== false ? 'Activo' : 'Inactivo'} 
                          color={operario.activo !== false ? 'success' : 'error'} 
                          size="small" 
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                  {operarios.length === 0 && (
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
};

export default ClienteRow;
