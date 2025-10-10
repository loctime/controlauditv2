import React, { useState, useEffect } from 'react';
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
  Search as SearchIcon
} from '@mui/icons-material';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../../firebaseConfig';
import { useAuth } from '../../context/AuthContext';
import EmpleadoForm from './EmpleadoForm';

export default function Empleados() {
  const { userProfile, userSucursales, userEmpresas, loadingSucursales } = useAuth();
  const [empleados, setEmpleados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCargo, setFilterCargo] = useState('');
  const [filterTipo, setFilterTipo] = useState('');
  const [filterEstado, setFilterEstado] = useState('');
  const [selectedEmpresa, setSelectedEmpresa] = useState('');
  const [selectedSucursal, setSelectedSucursal] = useState('');
  const [openForm, setOpenForm] = useState(false);
  const [selectedEmpleado, setSelectedEmpleado] = useState(null);

  // Filtrar sucursales por empresa seleccionada
  const filteredSucursales = selectedEmpresa
    ? userSucursales?.filter(s => s.empresaId === selectedEmpresa) || []
    : userSucursales || [];

  // Establecer empresa inicial
  useEffect(() => {
    if (userEmpresas && userEmpresas.length > 0 && !selectedEmpresa) {
      setSelectedEmpresa(userEmpresas[0].id);
    }
  }, [userEmpresas]);

  // Establecer sucursal inicial cuando cambia la empresa
  useEffect(() => {
    if (filteredSucursales.length > 0) {
      // Si hay sucursal seleccionada y pertenece a la empresa actual, mantenerla
      const sucursalExiste = filteredSucursales.find(s => s.id === selectedSucursal);
      if (!sucursalExiste) {
        setSelectedSucursal(filteredSucursales[0].id);
      }
    } else {
      setSelectedSucursal('');
    }
  }, [selectedEmpresa, filteredSucursales]);

  // Cargar empleados
  useEffect(() => {
    if (selectedSucursal) {
      loadEmpleados();
    }
  }, [selectedSucursal]);

  const loadEmpleados = async () => {
    setLoading(true);
    try {
      const empleadosRef = collection(db, 'empleados');
      const q = query(
        empleadosRef,
        where('sucursalId', '==', selectedSucursal)
      );
      
      const snapshot = await getDocs(q);
      const empleadosData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setEmpleados(empleadosData);
    } catch (error) {
      console.error('Error al cargar empleados:', error);
    } finally {
      setLoading(false);
    }
  };

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
    if (window.confirm(`¿Está seguro de eliminar a ${nombreEmpleado}?`)) {
      try {
        await deleteDoc(doc(db, 'empleados', empleadoId));
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
  if (loadingSucursales) {
    return (
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (!userSucursales || userSucursales.length === 0) {
    return (
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Alert severity="warning">
          No tienes sucursales asignadas. Contacta con el administrador.
        </Alert>
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

      {/* Selectores de Empresa y Sucursal */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <FormControl sx={{ flex: 1, minWidth: 250 }}>
            <InputLabel>Empresa</InputLabel>
            <Select
              value={selectedEmpresa}
              label="Empresa"
              onChange={(e) => setSelectedEmpresa(e.target.value)}
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
              disabled={!selectedEmpresa || filteredSucursales.length === 0}
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
        ) : filteredEmpleados.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">
              No hay empleados registrados
            </Typography>
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
                <TableCell align="center"><strong>Acciones</strong></TableCell>
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
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => handleOpenForm(empleado)}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDeleteEmpleado(empleado.id, `${empleado.nombre} ${empleado.apellido || ''}`)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
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
    </Container>
  );
}

