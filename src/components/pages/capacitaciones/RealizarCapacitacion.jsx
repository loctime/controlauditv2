import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Button,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  IconButton,
  Chip
} from '@mui/material';
import {
  Business as BusinessIcon,
  Storefront as StorefrontIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import { collection, getDocs, query, where, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '../../../firebaseConfig';
import { useAuth } from '../../context/AuthContext';
import Swal from 'sweetalert2';
import ConfirmacionGuardadoModal from './ConfirmacionGuardadoModal';

export default function RealizarCapacitacion({ 
  selectedEmpresa, 
  setSelectedEmpresa, 
  selectedSucursal, 
  setSelectedSucursal,
  userEmpresas,
  userSucursales
}) {
  const { userProfile } = useAuth();
  const [planesAnuales, setPlanesAnuales] = useState([]);
  const [planAnualSeleccionado, setPlanAnualSeleccionado] = useState('');
  const [capacitacionSeleccionada, setCapacitacionSeleccionada] = useState('');
  const [empleados, setEmpleados] = useState([]);
  const [empleadosFiltrados, setEmpleadosFiltrados] = useState([]);
  const [buscadorEmpleados, setBuscadorEmpleados] = useState('');
  const [empleadosPinned, setEmpleadosPinned] = useState(new Set());
  const [empleadosSeleccionados, setEmpleadosSeleccionados] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [hayCambiosSinGuardar, setHayCambiosSinGuardar] = useState(false);
  const [openConfirmacionModal, setOpenConfirmacionModal] = useState(false);

  // Filtrar sucursales por empresa seleccionada
  const sucursalesDisponibles = userSucursales.filter(s => 
    !selectedEmpresa || s.empresaId === selectedEmpresa
  );

  // Cargar planes anuales cuando cambia la sucursal
  useEffect(() => {
    if (selectedSucursal) {
      loadPlanesAnuales();
    } else {
      setPlanesAnuales([]);
      setPlanAnualSeleccionado('');
    }
  }, [selectedSucursal]);

  // Cargar empleados cuando cambia la sucursal
  useEffect(() => {
    if (selectedSucursal) {
      loadEmpleados();
    } else {
      setEmpleados([]);
      setEmpleadosFiltrados([]);
    }
  }, [selectedSucursal]);

  // Filtrar empleados por buscador
  useEffect(() => {
    const filtrados = empleados.filter(empleado => 
      empleado.nombre.toLowerCase().includes(buscadorEmpleados.toLowerCase()) ||
      empleado.apellido.toLowerCase().includes(buscadorEmpleados.toLowerCase()) ||
      empleado.dni.toLowerCase().includes(buscadorEmpleados.toLowerCase())
    );
    
    // Ordenar: pinned primero, luego alfabéticamente
    filtrados.sort((a, b) => {
      const aPinned = empleadosPinned.has(a.id);
      const bPinned = empleadosPinned.has(b.id);
      
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;
      
      return a.nombre.localeCompare(b.nombre);
    });
    
    setEmpleadosFiltrados(filtrados);
  }, [empleados, buscadorEmpleados, empleadosPinned]);

  // Cargar datos de la capacitación seleccionada
  useEffect(() => {
    if (capacitacionSeleccionada && planAnualSeleccionado) {
      loadDatosCapacitacion();
    }
  }, [capacitacionSeleccionada, planAnualSeleccionado]);

  const loadPlanesAnuales = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'planes_capacitaciones_anuales'),
        where('sucursalId', '==', selectedSucursal),
        where('año', '==', new Date().getFullYear())
      );
      const snapshot = await getDocs(q);
      const planes = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPlanesAnuales(planes);
    } catch (error) {
      console.error('Error cargando planes anuales:', error);
      Swal.fire('Error', 'Error al cargar planes anuales', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadEmpleados = async () => {
    try {
      const q = query(
        collection(db, 'empleados'),
        where('sucursalId', '==', selectedSucursal)
      );
      const snapshot = await getDocs(q);
      const empleadosData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setEmpleados(empleadosData);
    } catch (error) {
      console.error('Error cargando empleados:', error);
      Swal.fire('Error', 'Error al cargar empleados', 'error');
    }
  };

  const loadDatosCapacitacion = () => {
    const plan = planesAnuales.find(p => p.id === planAnualSeleccionado);
    if (plan) {
      const capacitacion = plan.capacitaciones.find(c => c.id === capacitacionSeleccionada);
      if (capacitacion) {
        // Marcar empleados que ya asistieron
        setEmpleadosSeleccionados(new Set(capacitacion.empleadosAsistieron || []));
      }
    }
  };

  const handleTogglePin = (empleadoId) => {
    const newPinned = new Set(empleadosPinned);
    if (newPinned.has(empleadoId)) {
      newPinned.delete(empleadoId);
    } else {
      newPinned.add(empleadoId);
    }
    setEmpleadosPinned(newPinned);
  };

  const handleToggleEmpleado = async (empleadoId) => {
    const empleado = empleados.find(e => e.id === empleadoId);
    const yaAsistio = empleadosSeleccionados.has(empleadoId);
    
    if (yaAsistio) {
      // Confirmar desmarcar
      const result = await Swal.fire({
        title: '¿Desmarcar empleado?',
        text: `¿Estás seguro de que ${empleado?.nombre} ${empleado?.apellido} no asistió a esta capacitación?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, desmarcar',
        cancelButtonText: 'Cancelar'
      });
      
      if (!result.isConfirmed) return;
    }

    const newSeleccionados = new Set(empleadosSeleccionados);
    if (yaAsistio) {
      newSeleccionados.delete(empleadoId);
    } else {
      newSeleccionados.add(empleadoId);
    }
    setEmpleadosSeleccionados(newSeleccionados);
    setHayCambiosSinGuardar(true);
  };

  const handleGuardar = () => {
    if (!capacitacionSeleccionada || !planAnualSeleccionado) {
      Swal.fire('Error', 'Selecciona una capacitación', 'error');
      return;
    }
    
    setOpenConfirmacionModal(true);
  };

  const confirmarGuardado = async () => {
    try {
      const plan = planesAnuales.find(p => p.id === planAnualSeleccionado);
      const capacitacion = plan.capacitaciones.find(c => c.id === capacitacionSeleccionada);
      
      // Actualizar registros
      const registros = {};
      const empleadosSeleccionadosArray = Array.from(empleadosSeleccionados);
      
      // Mantener registros existentes
      if (capacitacion.registros) {
        Object.assign(registros, capacitacion.registros);
      }
      
      // Actualizar/agregar registros para empleados seleccionados
      empleadosSeleccionadosArray.forEach(empleadoId => {
        registros[empleadoId] = {
          fecha: Timestamp.now(),
          registradoPor: userProfile.uid,
          registradoPorEmail: userProfile.email
        };
      });
      
      // Eliminar registros de empleados desmarcados
      Object.keys(registros).forEach(empleadoId => {
        if (!empleadosSeleccionados.has(empleadoId)) {
          delete registros[empleadoId];
        }
      });
      
      // Actualizar capacitación en el plan
      const capacitacionesActualizadas = plan.capacitaciones.map(c => {
        if (c.id === capacitacionSeleccionada) {
          return {
            ...c,
            empleadosAsistieron: empleadosSeleccionadosArray,
            registros: registros
          };
        }
        return c;
      });
      
      // Actualizar documento en Firestore
      await updateDoc(doc(db, 'planes_capacitaciones_anuales', planAnualSeleccionado), {
        capacitaciones: capacitacionesActualizadas
      });
      
      setHayCambiosSinGuardar(false);
      setOpenConfirmacionModal(false);
      
      Swal.fire('Éxito', 'Capacitación guardada correctamente', 'success');
      
    } catch (error) {
      console.error('Error guardando capacitación:', error);
      Swal.fire('Error', 'Error al guardar la capacitación', 'error');
    }
  };

  return (
    <Box>
      {/* Selectores superiores */}
      <Paper sx={{ p: 2, mb: 3, bgcolor: 'primary.50' }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap', mb: 2 }}>
          {/* Selector Empresa */}
          <FormControl sx={{ minWidth: 200, flex: 1 }}>
            <InputLabel>Empresa</InputLabel>
            <Select
              value={selectedEmpresa}
              label="Empresa"
              onChange={(e) => setSelectedEmpresa(e.target.value)}
              startAdornment={<BusinessIcon sx={{ mr: 1, color: 'primary.main' }} />}
            >
              <MenuItem value="">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <BusinessIcon fontSize="small" />
                  <em>Todas las empresas</em>
                </Box>
              </MenuItem>
              {userEmpresas.map((empresa) => (
                <MenuItem key={empresa.id} value={empresa.id}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <BusinessIcon fontSize="small" />
                    {empresa.nombre}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Selector Sucursal */}
          <FormControl sx={{ minWidth: 200, flex: 1 }}>
            <InputLabel>Sucursal</InputLabel>
            <Select
              value={selectedSucursal}
              label="Sucursal"
              onChange={(e) => setSelectedSucursal(e.target.value)}
              startAdornment={<StorefrontIcon sx={{ mr: 1, color: 'primary.main' }} />}
            >
              <MenuItem value="">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <StorefrontIcon fontSize="small" />
                  <em>Todas las sucursales</em>
                </Box>
              </MenuItem>
              {sucursalesDisponibles.map((sucursal) => (
                <MenuItem key={sucursal.id} value={sucursal.id}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <StorefrontIcon fontSize="small" />
                    {sucursal.nombre}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {/* Selectores de Plan y Capacitación */}
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Plan Anual</InputLabel>
            <Select
              value={planAnualSeleccionado}
              label="Plan Anual"
              onChange={(e) => {
                setPlanAnualSeleccionado(e.target.value);
                setCapacitacionSeleccionada('');
              }}
              disabled={!selectedSucursal}
            >
              {planesAnuales.map((plan) => (
                <MenuItem key={plan.id} value={plan.id}>
                  {plan.nombre}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Capacitación</InputLabel>
            <Select
              value={capacitacionSeleccionada}
              label="Capacitación"
              onChange={(e) => setCapacitacionSeleccionada(e.target.value)}
              disabled={!planAnualSeleccionado}
            >
              {planesAnuales.find(p => p.id === planAnualSeleccionado)?.capacitaciones.map((cap) => (
                <MenuItem key={cap.id} value={cap.id}>
                  {cap.nombre} ({cap.mes})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Indicador de cambios sin guardar */}
          {hayCambiosSinGuardar && (
            <Chip 
              label="Cambios sin guardar" 
              color="warning" 
              size="small"
            />
          )}

          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleGuardar}
            disabled={!capacitacionSeleccionada || !hayCambiosSinGuardar}
            sx={{ ml: 'auto' }}
          >
            Guardar
          </Button>
        </Box>
      </Paper>

      {/* Buscador y tabla de empleados */}
      {selectedSucursal && (
        <Paper sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              label="Buscar empleados"
              value={buscadorEmpleados}
              onChange={(e) => setBuscadorEmpleados(e.target.value)}
              placeholder="Nombre, apellido o DNI"
              sx={{ flex: 1 }}
            />
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : empleadosFiltrados.length === 0 ? (
            <Alert severity="info">
              No hay empleados registrados en esta sucursal
            </Alert>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell width="60">Pin</TableCell>
                    <TableCell>Nombre</TableCell>
                    <TableCell>DNI</TableCell>
                    <TableCell>Cargo</TableCell>
                    <TableCell width="100">Asistió</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {empleadosFiltrados.map((empleado) => {
                    const estaPinned = empleadosPinned.has(empleado.id);
                    const yaAsistio = empleadosSeleccionados.has(empleado.id);
                    
                    return (
                      <TableRow 
                        key={empleado.id} 
                        hover
                        sx={{
                          backgroundColor: empleado.estado === 'inactivo' ? 'grey.100' : 'inherit',
                          borderLeft: empleado.estado === 'inactivo' ? '4px solid red' : 'none'
                        }}
                      >
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => handleTogglePin(empleado.id)}
                          >
                            {estaPinned ? (
                              <StarIcon color="primary" />
                            ) : (
                              <StarBorderIcon />
                            )}
                          </IconButton>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" fontWeight={estaPinned ? 'bold' : 'normal'}>
                              {empleado.nombre} {empleado.apellido}
                            </Typography>
                            {empleado.estado === 'inactivo' && (
                              <Chip label="Inactivo" color="error" size="small" />
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>{empleado.dni}</TableCell>
                        <TableCell>{empleado.cargo}</TableCell>
                        <TableCell>
                          <Checkbox
                            checked={yaAsistio}
                            onChange={() => handleToggleEmpleado(empleado.id)}
                            color="primary"
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      )}

      {/* Modal de confirmación */}
      <ConfirmacionGuardadoModal
        open={openConfirmacionModal}
        onClose={() => setOpenConfirmacionModal(false)}
        onConfirm={confirmarGuardado}
        planAnual={planesAnuales.find(p => p.id === planAnualSeleccionado)}
        capacitacion={planesAnuales.find(p => p.id === planAnualSeleccionado)?.capacitaciones.find(c => c.id === capacitacionSeleccionada)}
        empleadosSeleccionados={Array.from(empleadosSeleccionados)}
        empleados={empleados}
      />
    </Box>
  );
}
