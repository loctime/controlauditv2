import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  IconButton,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  Business as BusinessIcon,
  Storefront as StorefrontIcon
} from '@mui/icons-material';
import { collection, addDoc, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '../../../firebaseConfig';
import { useAuth } from '../../context/AuthContext';
import Swal from 'sweetalert2';

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export default function PlanAnualModal({
  open,
  onClose,
  selectedEmpresa,
  selectedSucursal,
  userEmpresas,
  userSucursales,
  planToEdit = null,
  onSave
}) {
  const { userProfile } = useAuth();
  const [planData, setPlanData] = useState({
    nombre: '',
    empresaId: selectedEmpresa,
    sucursalId: selectedSucursal,
    capacitaciones: {}
  });
  const [columnasCapacitaciones, setColumnasCapacitaciones] = useState(2);
  const [errores, setErrores] = useState({});

  // Resetear estado cuando se abre el modal
  React.useEffect(() => {
    if (open) {
      if (planToEdit) {
        // Modo edición: cargar datos del plan existente
        setPlanData({
          nombre: planToEdit.nombre || '',
          empresaId: planToEdit.empresaId || selectedEmpresa,
          sucursalId: planToEdit.sucursalId || selectedSucursal,
          capacitaciones: planToEdit.capacitaciones || {}
        });
        
        // Calcular número de columnas basado en las capacitaciones existentes
        const maxColumnas = Math.max(...Object.values(planToEdit.capacitaciones || {}).map(cap => 
          Object.keys(cap || {}).length
        ), 2);
        setColumnasCapacitaciones(maxColumnas);
      } else {
        // Modo creación: inicializar con valores por defecto
        const empresaNombre = userEmpresas.find(e => e.id === selectedEmpresa)?.nombre || 'Todas las empresas';
        const sucursalNombre = selectedSucursal ? 
          (userSucursales.find(s => s.id === selectedSucursal)?.nombre || 'Sucursal no encontrada') : 'Todas las sucursales';
        
        setPlanData({
          nombre: `Plan Anual ${new Date().getFullYear()} - ${sucursalNombre}`,
          empresaId: selectedEmpresa,
          sucursalId: selectedSucursal,
          capacitaciones: {}
        });
        setColumnasCapacitaciones(2);
      }
      setErrores({});
    }
  }, [open, selectedEmpresa, selectedSucursal, userEmpresas, userSucursales, planToEdit]);

  const handleNombreChange = (e) => {
    setPlanData(prev => ({
      ...prev,
      nombre: e.target.value
    }));
  };

  const handleCapacitacionChange = (mes, columna, valor) => {
    setPlanData(prev => ({
      ...prev,
      capacitaciones: {
        ...prev.capacitaciones,
        [mes]: {
          ...prev.capacitaciones[mes],
          [columna]: valor
        }
      }
    }));

    // Limpiar error si se corrige
    if (errores[`${mes}-${columna}`]) {
      setErrores(prev => {
        const nuevosErrores = { ...prev };
        delete nuevosErrores[`${mes}-${columna}`];
        return nuevosErrores;
      });
    }
  };

  const agregarColumna = () => {
    setColumnasCapacitaciones(prev => prev + 1);
  };

  const quitarColumna = () => {
    if (columnasCapacitaciones > 2) {
      // Limpiar datos de la columna que se quita
      const columnaAQuitar = columnasCapacitaciones - 1;
      setPlanData(prev => {
        const nuevasCapacitaciones = { ...prev.capacitaciones };
        MESES.forEach(mes => {
          if (nuevasCapacitaciones[mes]) {
            delete nuevasCapacitaciones[mes][columnaAQuitar];
          }
        });
        return {
          ...prev,
          capacitaciones: nuevasCapacitaciones
        };
      });
      setColumnasCapacitaciones(prev => prev - 1);
    }
  };

  const validarDatos = () => {
    const nuevosErrores = {};

    // Validar nombre
    if (!planData.nombre.trim()) {
      nuevosErrores.nombre = 'El nombre del plan es requerido';
    }

    // Contar capacitaciones totales y validar duplicados
    let totalCapacitaciones = 0;
    MESES.forEach(mes => {
      const capacitacionesMes = planData.capacitaciones[mes] || {};
      const nombresCapacitaciones = [];
      
      for (let i = 0; i < columnasCapacitaciones; i++) {
        const nombreCapacitacion = capacitacionesMes[i]?.trim();
        
        if (nombreCapacitacion) {
          totalCapacitaciones++;
          // Verificar duplicados en el mismo mes
          if (nombresCapacitaciones.includes(nombreCapacitacion)) {
            nuevosErrores[`${mes}-${i}`] = 'No puede haber capacitaciones duplicadas en el mismo mes';
          } else {
            nombresCapacitaciones.push(nombreCapacitacion);
          }
        }
      }
    });

    // Validar que haya al menos una capacitación
    if (totalCapacitaciones === 0) {
      nuevosErrores.general = 'Debe agregar al menos una capacitación';
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const handleGuardar = async () => {
    if (!validarDatos()) {
      return;
    }

    try {
      // Convertir capacitaciones a array
      const capacitacionesArray = [];
      MESES.forEach(mes => {
        const capacitacionesMes = planData.capacitaciones[mes] || {};
        for (let i = 0; i < columnasCapacitaciones; i++) {
          const nombreCapacitacion = capacitacionesMes[i]?.trim();
          if (nombreCapacitacion) {
            capacitacionesArray.push({
              id: `cap-${mes.toLowerCase()}-${i + 1}`,
              nombre: nombreCapacitacion,
              mes: mes,
              orden: i + 1,
              empleadosAsistieron: [],
              registros: {}
            });
          }
        }
      });

      const empresaNombre = userEmpresas.find(e => e.id === selectedEmpresa)?.nombre || 'Todas las empresas';
      const sucursalNombre = selectedSucursal ? 
        (userSucursales.find(s => s.id === selectedSucursal)?.nombre || 'Sucursal no encontrada') : 'Todas las sucursales';

      const planDocumento = {
        nombre: planData.nombre || 'Plan Anual',
        empresaId: selectedEmpresa || null,
        empresaNombre: empresaNombre || 'Empresa no especificada',
        sucursalId: selectedSucursal || null,
        sucursalNombre: sucursalNombre || 'Sucursal no especificada',
        año: new Date().getFullYear(),
        capacitaciones: capacitacionesArray,
        createdAt: Timestamp.now(),
        createdBy: userProfile?.uid || 'unknown',
        createdByEmail: userProfile?.email || 'unknown@example.com'
      };

      if (planToEdit) {
        // Modo edición: actualizar documento existente
        await updateDoc(doc(db, 'planes_capacitaciones_anuales', planToEdit.id), planDocumento);
        Swal.fire('Éxito', 'Plan anual actualizado correctamente', 'success');
      } else {
        // Modo creación: crear nuevo documento
        await addDoc(collection(db, 'planes_capacitaciones_anuales'), planDocumento);
        Swal.fire('Éxito', 'Plan anual creado correctamente', 'success');
      }
      
      if (onSave) {
        onSave();
      }
      onClose();
      
    } catch (error) {
      console.error('Error creando plan anual:', error);
      Swal.fire('Error', 'Error al crear el plan anual', 'error');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <BusinessIcon color="primary" />
          <Typography variant="h6">
            {planToEdit ? 'Editar Plan Anual de Capacitaciones' : 'Crear Plan Anual de Capacitaciones'}
          </Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
          {/* Información del contexto */}
          <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 1 }}>
            <Typography variant="body2" color="textSecondary">
              <strong>Empresa:</strong> {userEmpresas.find(e => e.id === selectedEmpresa)?.nombre || 'Todas las empresas'} → 
              <strong> Sucursal:</strong> {selectedSucursal ? userSucursales.find(s => s.id === selectedSucursal)?.nombre : 'Todas las sucursales'}
            </Typography>
          </Box>

          {/* Error general */}
          {errores.general && (
            <Alert severity="error">{errores.general}</Alert>
          )}

          {/* Nombre del plan */}
          <TextField
            label="Nombre del Plan"
            value={planData.nombre}
            onChange={handleNombreChange}
            fullWidth
            error={!!errores.nombre}
            helperText={errores.nombre}
            required
          />

          {/* Controles de columnas */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2">Capacitaciones por mes:</Typography>
            <IconButton onClick={quitarColumna} disabled={columnasCapacitaciones <= 2} size="small">
              <RemoveIcon />
            </IconButton>
            <Typography variant="body2">{columnasCapacitaciones}</Typography>
            <IconButton onClick={agregarColumna} size="small">
              <AddIcon />
            </IconButton>
          </Box>

          {/* Tabla de meses y capacitaciones */}
          <TableContainer component={Paper} sx={{ maxHeight: 500, overflow: 'auto' }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Mes</strong></TableCell>
                  {Array.from({ length: columnasCapacitaciones }, (_, i) => (
                    <TableCell key={i} align="center">
                      <strong>Capacitación {i + 1}</strong>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {MESES.map((mes) => (
                  <TableRow key={mes}>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {mes}
                      </Typography>
                    </TableCell>
                    {Array.from({ length: columnasCapacitaciones }, (_, i) => (
                      <TableCell key={i}>
                        <TextField
                          size="small"
                          fullWidth
                          placeholder={`Capacitación ${i + 1}`}
                          value={planData.capacitaciones[mes]?.[i] || ''}
                          onChange={(e) => handleCapacitacionChange(mes, i, e.target.value)}
                          error={!!errores[`${mes}-${i}`]}
                          helperText={errores[`${mes}-${i}`]}
                        />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Resumen */}
          <Box sx={{ bgcolor: 'info.50', p: 2, borderRadius: 1 }}>
            <Typography variant="body2" color="info.main">
              <strong>Resumen:</strong> Se crearán {MESES.reduce((total, mes) => {
                const capacitacionesMes = planData.capacitaciones[mes] || {};
                return total + Object.values(capacitacionesMes).filter(nombre => nombre?.trim()).length;
              }, 0)} capacitaciones distribuidas en {MESES.filter(mes => {
                const capacitacionesMes = planData.capacitaciones[mes] || {};
                return Object.values(capacitacionesMes).some(nombre => nombre?.trim());
              }).length} meses del año {new Date().getFullYear()}.
            </Typography>
          </Box>
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose} variant="outlined">
          Cancelar
        </Button>
        <Button onClick={handleGuardar} variant="contained" color="primary">
          {planToEdit ? 'Actualizar Plan Anual' : 'Guardar Plan Anual'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
