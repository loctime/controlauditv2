import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
import { query, where, getDocs, deleteDoc, doc, collection } from 'firebase/firestore';
import { dbAudit } from '../../../firebaseControlFile';
import { firestoreRoutesCore } from '../../../core/firestore/firestoreRoutes.core';
import { useAuth } from '@/components/context/AuthContext';
import { useGlobalSelection } from '../../../hooks/useGlobalSelection';
import { normalizeEmpleado } from '../../../utils/firestoreUtils';
import EmpleadoForm from './EmpleadoForm';
import ImportEmpleadosDialog from './import/ImportEmpleadosDialog';

export default function Empleados() {
  const { userProfile, loadingSucursales, role } = useAuth();
  
  // Determinar si el usuario puede crear empleados
  // Admin siempre puede crear, operario solo si no está bloqueado
  const canCreateEmpleado = !userProfile?.bloqueado && 
    userProfile?.activo !== false && 
    (role === 'admin' || role === 'operario');
  
  // Usar selección global
  const {
    selectedEmpresa,
    selectedSucursal,
    setSelectedEmpresa,
    setSelectedSucursal,
    sucursalesFiltradas: filteredSucursales,
    userEmpresas,
    userSucursales
  } = useGlobalSelection();
  
  const [empleados, setEmpleados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCargo, setFilterCargo] = useState('');
  const [filterTipo, setFilterTipo] = useState('');
  const [filterEstado, setFilterEstado] = useState('');
  const [openForm, setOpenForm] = useState(false);
  const [selectedEmpleado, setSelectedEmpleado] = useState(null);
  const [empresasCargadas, setEmpresasCargadas] = useState(false);
  const [openImportDialog, setOpenImportDialog] = useState(false);

  // Detectar cuando las empresas han sido cargadas
  useEffect(() => {
    if (userEmpresas !== undefined) {
      setEmpresasCargadas(true);
    }
  }, [userEmpresas]);

  const loadEmpleados = useCallback(async () => {
    if (!userProfile?.ownerId || !selectedSucursal) {
      setEmpleados([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const ownerId = userProfile.ownerId;
      const empleadosRef = collection(dbAudit, ...firestoreRoutesCore.empleados(ownerId));
      const q = query(
        empleadosRef,
        where('sucursalId', '==', selectedSucursal)
      );
      
      const snapshot = await getDocs(q);
      const empleadosData = snapshot.docs.map(doc => normalizeEmpleado(doc));
      
      setEmpleados(empleadosData);
    } catch (error) {
      console.error('Error al cargar empleados:', error);
      setEmpleados([]);
    } finally {
      setLoading(false);
    }
  }, [selectedSucursal, userProfile?.ownerId]);

  // Cargar empleados
  useEffect(() => {
    if (selectedSucursal) {
      loadEmpleados();
    } else if (empresasCargadas) {
      // Si no hay sucursal seleccionada pero ya se cargaron las empresas, limpiar empleados
      setEmpleados([]);
      setLoading(false);
    }
  }, [selectedSucursal, empresasCargadas, loadEmpleados]);

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
        const empleadoRef = doc(dbAudit, ...firestoreRoutesCore.empleado(ownerId, empleadoId));
        await deleteDoc(empleadoRef);
        loadEmpleados();
      } catch (error) {
        console.error('Error al eliminar empleado:', error);
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
  if (loadingSucursales || !empresasCargadas) {
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
            {role !== 'operario' && (
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
            )}
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
      {!userEmpresas || userEmpresas.length === 0 ? (
        <Alert severity="error" sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
            <Typography variant="body1">
              🏢 No hay empresas disponibles. Contacta al administrador para asignar empresas a tu usuario.
            </Typography>
            <Button
              variant="contained"
              size="small"
              onClick={() => window.location.href = '/establecimiento'}
            >
              🏢 Ir a Empresas
            </Button>
          </Box>
        </Alert>
      ) : !selectedSucursal && filteredSucursales.length === 0 ? (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
            <Typography variant="body1">
              🏪 No hay sucursales disponibles para la empresa seleccionada.
            </Typography>
            <Button
              variant="contained"
              size="small"
              onClick={() => window.location.href = '/establecimiento'}
            >
              🏪 Crear Sucursales
            </Button>
          </Box>
        </Alert>
      ) : null}

      {/* Selectores de Empresa y Sucursal */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <FormControl sx={{ flex: 1, minWidth: 250 }}>
            <InputLabel>Empresa</InputLabel>
            <Select
              value={selectedEmpresa}
              label="Empresa"
              onChange={(e) => setSelectedEmpresa(e.target.value)}
              disabled={!userEmpresas || userEmpresas.length === 0}
              aria-label="Seleccionar empresa"
            >
              {userEmpresas?.map((empresa) => (
                <MenuItem key={empresa.id} value={empresa.id}>
                  {empresa.nombre}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl sx={{ flex: 1, minWidth: 250 }}>
            <InputLabel>Sucursal</InputLabel>
            <Select
              value={selectedSucursal}
              label="Sucursal"
              onChange={(e) => setSelectedSucursal(e.target.value)}
              disabled={!selectedEmpresa || filteredSucursales.length === 0 || !userEmpresas || userEmpresas.length === 0}
              aria-label="Seleccionar sucursal"
            >
              {filteredSucursales.map((sucursal) => (
                <MenuItem key={sucursal.id} value={sucursal.id}>
                  {sucursal.nombre}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Paper>

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
        ) : !userEmpresas || userEmpresas.length === 0 || !selectedSucursal ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">
              {!userEmpresas || userEmpresas.length === 0 
                ? 'Selecciona una empresa para ver los empleados'
                : 'Selecciona una sucursal para ver los empleados'}
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
      <EmpleadoForm
        open={openForm}
        onClose={handleCloseForm}
        onSave={handleSaveEmpleado}
        empleado={selectedEmpleado}
        sucursalId={selectedSucursal}
        empresaId={userProfile?.empresaId || userProfile?.uid}
      />

      {/* Dialog de Importación Masiva */}
      <ImportEmpleadosDialog
        open={openImportDialog}
        onClose={() => setOpenImportDialog(false)}
        onSuccess={(count) => {
          alert(`¡Importación exitosa! Se crearon ${count} empleado(s)`);
          loadEmpleados();
        }}
        empresaId={selectedEmpresa}
        sucursalId={selectedSucursal}
      />
    </Container>
  );
}

