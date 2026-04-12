import logger from '@/utils/logger';
import { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Box,
  Chip,
  IconButton,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  CloudUpload as CloudUploadIcon
} from '@mui/icons-material';
import { useAuth } from '@/components/context/AuthContext';
import EmpleadoFormModal from './EmpleadoForm';
import ImportEmpleadosDialog from './import/ImportEmpleadosDialog';
import { empleadoService } from '../../../services/empleadoService';
import SinSucursalAlert from '@/components/common/SinSucursalAlert';

export default function Empleados() {
  const { userProfile, loadingSucursales, role, selectedEmpresa, selectedSucursal } = useAuth();
  
  // Determinar si el usuario puede crear empleados
  // Admin/superdev siempre puede crear, operario solo si no está bloqueado y está activo
  const isAdminLike = role === 'admin' || role === 'superdev';
  const isActive = userProfile?.status ? userProfile.status === 'active' : (userProfile?.activo !== false);
  const canCreateEmpleado = !userProfile?.bloqueado &&
    isActive &&
    (isAdminLike || role === 'operario');
  
  const [empleados, setEmpleados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCargo, setFilterCargo] = useState('');
  const [filterTipo, setFilterTipo] = useState('');
  const [filterEstado, setFilterEstado] = useState('');
  const [openForm, setOpenForm] = useState(false);
  const [selectedEmpleado, setSelectedEmpleado] = useState(null);
  const [openImportDialog, setOpenImportDialog] = useState(false);

  const loadEmpleados = useCallback(async () => {
    if (!userProfile?.ownerId || !selectedSucursal) {
      setEmpleados([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const ownerId = userProfile.ownerId;
      const empleadosData = await empleadoService.getEmpleadosBySucursal(ownerId, selectedSucursal);
      
      setEmpleados(empleadosData);
    } catch (error) {
      logger.error('Error al cargar empleados:', error);
      setEmpleados([]);
    } finally {
      setLoading(false);
    }
  }, [selectedSucursal, userProfile?.ownerId]);

  // Cargar empleados
  useEffect(() => {
    if (selectedSucursal) {
      loadEmpleados();
    } else {
      // Si no hay sucursal seleccionada, limpiar empleados
      setEmpleados([]);
      setLoading(false);
    }
  }, [selectedSucursal, loadEmpleados]);

  const handleOpenForm = (empleado = null) => {
    setSelectedEmpleado(empleado);
    setOpenForm(true);
  };

  const handleCloseForm = () => {
    setOpenForm(false);
    setSelectedEmpleado(null);
  };

  const handleSaveEmpleado = () => {
    loadEmpleados();
    handleCloseForm();
  };

  const handleDeleteEmpleado = async (empleadoId, nombreEmpleado) => {
    if (!userProfile?.ownerId) {
      alert('Error: No se pudo identificar el owner');
      return;
    }

    if (window.confirm(`¿Está seguro de eliminar a ${nombreEmpleado}?`)) {
      try {
        const ownerId = userProfile.ownerId;
        await empleadoService.deleteEmpleado(ownerId, empleadoId, { uid: userProfile?.uid, role });
        loadEmpleados();
      } catch (error) {
        logger.error('Error al eliminar empleado:', error);
        alert('Error al eliminar el empleado');
      }
    }
  };

  // Filtrar empleados
  const filteredEmpleados = empleados.filter(emp => {
    const nombreCompleto = `${emp.nombre || ''} ${emp.apellido || ''}`.toLowerCase();
    const matchSearch = nombreCompleto.includes(searchTerm.toLowerCase()) ||
                       emp.dni?.includes(searchTerm) ||
                       emp.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCargo = !filterCargo || emp.cargo === filterCargo;
    const matchTipo = !filterTipo || emp.tipo === filterTipo;
    const matchEstado = !filterEstado || emp.estado === filterEstado;
    
    return matchSearch && matchCargo && matchTipo && matchEstado;
  });

  // Obtener cargos únicos para el filtro
  const uniqueCargos = [...new Set(empleados.map(emp => emp.cargo))].filter(Boolean);

  // Mostrar loading mientras se cargan las sucursales
  if (loadingSucursales) {
    return (
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Gestión de Empleados
        </Typography>
        {canCreateEmpleado && (
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<CloudUploadIcon />}
              onClick={() => setOpenImportDialog(true)}
              disabled={!selectedSucursal}
              sx={{
                borderColor: 'primary.main',
                '&:hover': {
                  borderColor: 'primary.dark',
                }
              }}
            >
              Importar Masivo
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenForm()}
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #5568d3 0%, #65408b 100%)',
                }
              }}
            >
              Nuevo Empleado
            </Button>
          </Box>
        )}
      </Box>

      {/* Alertas de estado */}
      {!selectedSucursal ? (
        <SinSucursalAlert empresaId={selectedEmpresa !== 'todas' ? selectedEmpresa : undefined} />
      ) : null}

      
      {/* Filtros */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            label="Buscar por nombre, DNI o email"
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
            }}
            sx={{ minWidth: 280 }}
          />
          
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Cargo</InputLabel>
            <Select
              value={filterCargo}
              label="Cargo"
              onChange={(e) => setFilterCargo(e.target.value)}
              aria-label="Filtrar por cargo"
            >
              <MenuItem value="">Todos</MenuItem>
              {uniqueCargos.map((cargo) => (
                <MenuItem key={cargo} value={cargo}>{cargo}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Tipo</InputLabel>
            <Select
              value={filterTipo}
              label="Tipo"
              onChange={(e) => setFilterTipo(e.target.value)}
              aria-label="Filtrar por tipo de empleado"
            >
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="operativo">Operativo</MenuItem>
              <MenuItem value="administrativo">Administrativo</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Estado</InputLabel>
            <Select
              value={filterEstado}
              label="Estado"
              onChange={(e) => setFilterEstado(e.target.value)}
              aria-label="Filtrar por estado del empleado"
            >
              <MenuItem value="">
                <Chip label="Todos" size="small" />
              </MenuItem>
              <MenuItem value="activo">
                <Chip label="Activo" size="small" color="success" />
              </MenuItem>
              <MenuItem value="inactivo">
                <Chip label="Inactivo" size="small" color="default" />
              </MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {/* Tabla de Empleados */}
      <TableContainer component={Paper}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : !selectedSucursal ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">
              Selecciona una sucursal para ver los empleados
            </Typography>
          </Box>
        ) : filteredEmpleados.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              No hay empleados registrados en esta sucursal
            </Typography>
            {canCreateEmpleado && (
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() => handleOpenForm()}
              >
                Registrar Primer Empleado
              </Button>
            )}
          </Box>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Nombre Completo</strong></TableCell>
                <TableCell><strong>DNI</strong></TableCell>
                <TableCell><strong>Email</strong></TableCell>
                <TableCell><strong>Teléfono</strong></TableCell>
                <TableCell><strong>Cargo</strong></TableCell>
                <TableCell><strong>Área</strong></TableCell>
                <TableCell><strong>Tipo</strong></TableCell>
                <TableCell><strong>Estado</strong></TableCell>
                {role !== 'operario' && (
                  <TableCell align="center"><strong>Acciones</strong></TableCell>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredEmpleados.map((empleado) => (
                <TableRow key={empleado.id} hover>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {empleado.nombre} {empleado.apellido}
                    </Typography>
                  </TableCell>
                  <TableCell>{empleado.dni || '-'}</TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {empleado.email || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {empleado.telefono || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>{empleado.cargo || '-'}</TableCell>
                  <TableCell>{empleado.area || '-'}</TableCell>
                  <TableCell>
                    <Chip
                      label={empleado.tipo || 'N/A'}
                      size="small"
                      color={empleado.tipo === 'operativo' ? 'primary' : 'secondary'}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={empleado.estado || 'activo'}
                      size="small"
                      color={empleado.estado === 'activo' ? 'success' : 'default'}
                    />
                  </TableCell>
                  {role !== 'operario' && (
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleOpenForm(empleado)}
                        aria-label={`Editar empleado ${empleado.nombre} ${empleado.apellido || ''}`}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteEmpleado(empleado.id, `${empleado.nombre} ${empleado.apellido || ''}`)}
                        aria-label={`Eliminar empleado ${empleado.nombre} ${empleado.apellido || ''}`}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </TableContainer>

      {/* Formulario de Empleado */}
      <EmpleadoFormModal
        open={openForm}
        onClose={handleCloseForm}
        initialData={selectedEmpleado || null}
        onSubmit={async (data) => {
          if (!userProfile?.ownerId) throw new Error('ownerId no disponible');
          if (!selectedEmpresa) throw new Error('Empresa no seleccionada');
          if (!selectedSucursal) throw new Error('Sucursal no seleccionada');

          const ownerId = userProfile.ownerId;
          const actor = { uid: userProfile?.uid, role };

          if (selectedEmpleado?.id) {
            await empleadoService.updateEmpleado(ownerId, selectedEmpleado.id, {
              ...data,
              empresaId: selectedEmpresa,
              sucursalId: selectedSucursal
            }, actor);
          } else {
            await empleadoService.crearEmpleado({
              ...data,
              empresaId: selectedEmpresa,
              sucursalId: selectedSucursal
            }, actor);
          }

          handleSaveEmpleado();
        }}
      />

      {/* Dialog de Importación Masiva */}
      <ImportEmpleadosDialog
        open={openImportDialog}
        onClose={() => setOpenImportDialog(false)}
        onSuccess={(stats) => {
          // Manejar tanto el formato antiguo (número) como el nuevo (objeto)
          if (typeof stats === 'number') {
            alert(`¡Importación exitosa! Se crearon ${stats} empleado(s)`);
          } else {
            const mensaje = `¡Importación completada!\n\n` +
              `✔ Creados: ${stats.creados}\n` +
              `⚠ Con error: ${stats.conError}\n` +
              `⚠ Advertencias: ${stats.advertencias}\n` +
              `Total procesados: ${stats.total}`;
            alert(mensaje);
          }
          loadEmpleados();
        }}
        empresaId={selectedEmpresa}
        sucursalId={selectedSucursal}
      />
    </Container>
  );
}

