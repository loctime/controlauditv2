import React, { useState } from 'react';
import { Box, Typography } from '@mui/material';
import { useClientes } from '../../../hooks/useClientes';
import { useClienteSorting } from '../../../hooks/useClienteSorting';
import ClienteMetrics from './components/ClienteMetrics';
import ClienteTable from './components/ClienteTable';
import EditClienteDialog from './components/EditClienteDialog';
import ConfirmDialog from './components/ConfirmDialog';
import HistorialPagosModal from './HistorialPagosModal';

const GestionClientes = () => {
  // Hooks personalizados
  const {
    clientes,
    loading,
    operariosPorCliente,
    cargarOperarios,
    handlePago,
    handleDemo,
    handleToggleActivo,
    handleSaveCliente
  } = useClientes();
  
  const { orderBy, order, handleRequestSort, sortedClientes } = useClienteSorting(clientes);

  // Estados locales
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
  const [openConfirmPago, setOpenConfirmPago] = useState(false);
  const [openConfirmDemo, setOpenConfirmDemo] = useState(false);
  const [clienteConfirmacion, setClienteConfirmacion] = useState(null);

  const handleExpandRow = (clienteId) => {
    setExpandedRows(prev => ({ ...prev, [clienteId]: !prev[clienteId] }));
    if (!operariosPorCliente[clienteId]) cargarOperarios(clienteId);
  };

  const handleEditCliente = (cliente) => {
    setClienteEditando(cliente);
    setForm({
      limiteUsuarios: cliente.limiteUsuarios || 10,
      plan: cliente.plan || 'estandar',
      estadoPago: cliente.estadoPago || 'al_dia',
      fechaVencimiento: cliente.fechaVencimiento ? 
        (cliente.fechaVencimiento.toDate ? new Date(cliente.fechaVencimiento.toDate()).toISOString().split('T')[0] : new Date(cliente.fechaVencimiento).toISOString().split('T')[0]) : '',
      esDemo: cliente.esDemo || false,
      activo: cliente.activo !== false
    });
    setOpenDialog(true);
  };

  const handleSave = async () => {
    await handleSaveCliente(clienteEditando, form);
    setOpenDialog(false);
  };

  // Funciones de confirmación
  const confirmarPago = (cliente) => {
    setClienteConfirmacion(cliente);
    setOpenConfirmPago(true);
  };

  const confirmarDemo = (cliente) => {
    setClienteConfirmacion(cliente);
    setOpenConfirmDemo(true);
  };

  const ejecutarPago = async () => {
    if (clienteConfirmacion) {
      await handlePago(clienteConfirmacion);
      setOpenConfirmPago(false);
      setClienteConfirmacion(null);
    }
  };

  const ejecutarDemo = async () => {
    if (clienteConfirmacion) {
      await handleDemo(clienteConfirmacion);
      setOpenConfirmDemo(false);
      setClienteConfirmacion(null);
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

      <ClienteMetrics
        totalClientes={totalClientes}
        clientesActivos={clientesActivos}
        clientesDemo={clientesDemo}
        clientesVencidos={clientesVencidos}
        totalUsuarios={totalUsuarios}
        ingresosEstimados={ingresosEstimados}
      />

      <ClienteTable
        sortedClientes={sortedClientes}
        orderBy={orderBy}
        order={order}
        onRequestSort={handleRequestSort}
        expandedRows={expandedRows}
        onExpandRow={handleExpandRow}
        operariosPorCliente={operariosPorCliente}
        onEditCliente={handleEditCliente}
        onConfirmPago={confirmarPago}
        onConfirmDemo={confirmarDemo}
        onToggleActivo={handleToggleActivo}
        onOpenHistorial={(cliente) => {
          setClienteHistorial(cliente);
          setOpenHistorial(true);
        }}
      />

      <EditClienteDialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        clienteEditando={clienteEditando}
        form={form}
        setForm={setForm}
        onSave={handleSave}
      />

      <HistorialPagosModal
        open={openHistorial}
        onClose={() => setOpenHistorial(false)}
        cliente={clienteHistorial}
      />

      <ConfirmDialog
        open={openConfirmPago}
        onClose={() => setOpenConfirmPago(false)}
        title="Confirmar Procesamiento de Pago"
        message="¿Estás seguro de que deseas procesar el pago para"
        cliente={clienteConfirmacion}
        actions={[
          'Activará al usuario automáticamente',
          'Establecerá el estado de pago como "al día"',
          'Extenderá el acceso por 1 mes',
          'Registrará el pago en el historial'
        ]}
        color="success"
        onConfirm={ejecutarPago}
      />

      <ConfirmDialog
        open={openConfirmDemo}
        onClose={() => setOpenConfirmDemo(false)}
        title="Confirmar Activación de Demo"
        message="¿Estás seguro de que deseas activar el demo para"
        cliente={clienteConfirmacion}
        actions={[
          'Activará al usuario automáticamente',
          'Marcará al cliente como usuario de demostración',
          'Establecerá el estado de pago como "al día"',
          'Extenderá el acceso por 1 mes'
        ]}
        color="warning"
        onConfirm={ejecutarDemo}
      />
    </Box>
  );
};

export default GestionClientes; 