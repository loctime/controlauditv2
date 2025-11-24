// src/components/pages/admin/components/TargetsManager/CreateTargetDialog.jsx
import React, { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Card,
  CardContent,
  Chip,
  Divider,
  Avatar,
  Paper,
  Stack,
  Alert
} from "@mui/material";
import { Add, ExpandMore, Lightbulb, PersonAdd } from "@mui/icons-material";
import { collection, getDocs, query, where, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../../../../firebaseConfig";
import { targetsService } from "../../../../../services/targetsService";
import { useAuth } from "../../../../context/AuthContext";
import { useGlobalSelection } from "../../../../../hooks/useGlobalSelection";
import { toast } from 'react-toastify';

const CreateTargetDialog = ({ open, onClose, onSave, targetToEdit = null, empresas, sucursales, formularios }) => {
  const { userProfile } = useAuth();
  const { userEmpresas, sucursalesFiltradas, selectedEmpresa } = useGlobalSelection();
  
  // Usar empresas y sucursales pasadas como props, o las del hook global como fallback
  const empresasDisponibles = empresas && empresas.length > 0 ? empresas : userEmpresas;
  const sucursalesDisponibles = sucursales && sucursales.length > 0 ? sucursales : sucursalesFiltradas;
  
  const [form, setForm] = useState({
    empresaId: '',
    empresaNombre: '',
    sucursalId: '',
    sucursalNombre: '',
    periodo: 'mensual',
    cantidad: 0,
    año: new Date().getFullYear(),
    mes: new Date().getMonth() + 1,
    activo: true
  });

  const [errors, setErrors] = useState({});
  const [usuariosOperarios, setUsuariosOperarios] = useState([]);
  const [cargandoUsuarios, setCargandoUsuarios] = useState(false);
  const [auditoriasConfiguradas, setAuditoriasConfiguradas] = useState([]);
  const [diasPreferidos, setDiasPreferidos] = useState([]); // Días de la semana preferidos (1-7)
  const [diasExcluidos, setDiasExcluidos] = useState([]); // Días de la semana excluidos (1-7)
  const [programacionGuardada, setProgramacionGuardada] = useState(false);
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  
  // Cargar usuarios operarios
  useEffect(() => {
    const cargarUsuarios = async () => {
      if (!userProfile || !open) return;
      
      setCargandoUsuarios(true);
      try {
        const q = query(
          collection(db, "usuarios"),
          where("clienteAdminId", "==", userProfile.clienteAdminId || userProfile.uid),
          where("role", "==", "operario")
        );
        const querySnapshot = await getDocs(q);
        const usuarios = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setUsuariosOperarios(usuarios);
      } catch (error) {
        console.error('Error cargando usuarios:', error);
      } finally {
        setCargandoUsuarios(false);
      }
    };
    
    cargarUsuarios();
  }, [open, userProfile]);
  
  // Días de la semana disponibles (1=Lunes, 7=Domingo)
  const diasSemanaDisponibles = [
    { value: 1, label: 'Lunes' },
    { value: 2, label: 'Martes' },
    { value: 3, label: 'Miércoles' },
    { value: 4, label: 'Jueves' },
    { value: 5, label: 'Viernes' },
    { value: 6, label: 'Sábado' },
    { value: 7, label: 'Domingo' }
  ];

  // Calcular días sugeridos basados en el período, cantidad y preferencias
  const calcularDiasSugeridos = useMemo(() => {
    if (!form.cantidad || form.cantidad <= 0 || !form.periodo) return [];
    
    const { cantidad, periodo, año, mes } = form;
    const dias = [];
    
    // Días de la semana disponibles (excluir días excluidos, preferir días preferidos)
    let diasDisponibles = [1, 2, 3, 4, 5]; // Por defecto días laborables
    
    if (diasExcluidos.length > 0) {
      diasDisponibles = diasDisponibles.filter(dia => !diasExcluidos.includes(dia));
    }
    
    if (diasPreferidos.length > 0) {
      // Priorizar días preferidos
      const diasPreferidosFiltrados = diasPreferidos.filter(dia => !diasExcluidos.includes(dia));
      const otrosDias = diasDisponibles.filter(dia => !diasPreferidos.includes(dia));
      diasDisponibles = [...diasPreferidosFiltrados, ...otrosDias];
    }
    
    // Si no hay días disponibles, usar todos menos excluidos
    if (diasDisponibles.length === 0) {
      diasDisponibles = [1, 2, 3, 4, 5, 6, 7].filter(dia => !diasExcluidos.includes(dia));
    }
    
    if (periodo === 'mensual' && mes) {
      const diasEnMes = new Date(año, mes, 0).getDate();
      
      // Encontrar todos los días del mes que coinciden con días disponibles
      const diasValidos = [];
      for (let dia = 1; dia <= diasEnMes; dia++) {
        const fecha = new Date(año, mes - 1, dia);
        const diaSemana = fecha.getDay() === 0 ? 7 : fecha.getDay();
        if (diasDisponibles.includes(diaSemana)) {
          diasValidos.push({ diaSemana, diaMes: dia, fecha });
        }
      }
      
      // Distribuir las auditorías uniformemente a lo largo del mes COMPLETO
      if (diasValidos.length > 0 && cantidad > 0) {
        if (cantidad === 1) {
          // Si solo hay una auditoría, ponerla en el medio del mes
          const idx = Math.floor(diasValidos.length / 2);
          if (diasValidos[idx]) {
            dias.push(diasValidos[idx]);
          }
        } else if (cantidad <= diasValidos.length) {
          // Distribución uniforme desde el PRIMER día válido hasta el ÚLTIMO día válido del mes
          // Esto asegura que usemos todo el rango del mes
          for (let i = 0; i < cantidad; i++) {
            // Calcular posición uniforme desde 0 hasta diasValidos.length - 1
            const posicion = cantidad === 1 ? 0 : (i / (cantidad - 1)) * (diasValidos.length - 1);
            const idx = Math.round(posicion);
            // Asegurar que no exceda el índice máximo
            const idxFinal = Math.min(Math.max(0, idx), diasValidos.length - 1);
            if (diasValidos[idxFinal]) {
              dias.push(diasValidos[idxFinal]);
            }
          }
        } else {
          // Si hay más auditorías que días válidos, distribuir en múltiples rondas
          // Pero siempre mantener la distribución uniforme a lo largo del mes
          const rondas = Math.ceil(cantidad / diasValidos.length);
          
          for (let ronda = 0; ronda < rondas; ronda++) {
            const auditoriasEstaRonda = Math.min(diasValidos.length, cantidad - dias.length);
            
            if (auditoriasEstaRonda === diasValidos.length) {
              // Si usamos todos los días, agregarlos todos
              dias.push(...diasValidos.filter(d => d));
            } else if (auditoriasEstaRonda > 0) {
              // Distribuir uniformemente en el rango completo del mes
              for (let i = 0; i < auditoriasEstaRonda; i++) {
                const posicion = auditoriasEstaRonda === 1 ? 0 : (i / (auditoriasEstaRonda - 1)) * (diasValidos.length - 1);
                const idx = Math.round(posicion);
                const idxFinal = Math.min(Math.max(0, idx), diasValidos.length - 1);
                if (diasValidos[idxFinal]) {
                  dias.push(diasValidos[idxFinal]);
                }
              }
            }
            
            if (dias.length >= cantidad) break;
          }
        }
      }
    } else if (periodo === 'semanal') {
      // Para semanal, usar días disponibles en rotación
      for (let i = 0; i < cantidad; i++) {
        const diaSemana = diasDisponibles[i % diasDisponibles.length];
        dias.push({ diaSemana: diaSemana, diaMes: null, fecha: null });
      }
    } else if (periodo === 'anual') {
      // Para anual, distribuir a lo largo del año
      const auditoriasPorMes = Math.ceil(cantidad / 12);
      let contador = 0;
      
      for (let mesActual = 1; mesActual <= 12 && contador < cantidad; mesActual++) {
        const diasEnMesActual = new Date(año, mesActual, 0).getDate();
        const auditoriasEsteMes = Math.min(auditoriasPorMes, cantidad - contador);
        
        // Encontrar días válidos del mes
        const diasValidosMes = [];
        for (let dia = 1; dia <= diasEnMesActual; dia++) {
          const fecha = new Date(año, mesActual - 1, dia);
          const diaSemana = fecha.getDay() === 0 ? 7 : fecha.getDay();
          if (diasDisponibles.includes(diaSemana)) {
            diasValidosMes.push({ diaSemana, diaMes: dia, fecha, mes: mesActual });
          }
        }
        
        // Distribuir auditorías en el mes
        if (diasValidosMes.length > 0) {
          const intervalo = Math.floor(diasValidosMes.length / auditoriasEsteMes);
          for (let j = 0; j < auditoriasEsteMes && contador < cantidad; j++) {
            const idx = Math.min(j * intervalo, diasValidosMes.length - 1);
            dias.push(diasValidosMes[idx]);
            contador++;
          }
        }
      }
    }
    
    // Filtrar elementos undefined y ordenar por día del mes para meses, por día de semana para semanas
    const diasFiltrados = dias.filter(d => d && d.diaSemana !== undefined);
    
    if (periodo === 'mensual') {
      diasFiltrados.sort((a, b) => (a.diaMes || 0) - (b.diaMes || 0));
    } else if (periodo === 'anual') {
      diasFiltrados.sort((a, b) => {
        if ((a.mes || 0) !== (b.mes || 0)) return (a.mes || 0) - (b.mes || 0);
        return (a.diaMes || 0) - (b.diaMes || 0);
      });
    }
    
    return diasFiltrados.slice(0, cantidad);
  }, [form.cantidad, form.periodo, form.año, form.mes, diasPreferidos, diasExcluidos]);
  
  // Inicializar auditorías configuradas cuando cambia la cantidad o los días sugeridos
  useEffect(() => {
    if (calcularDiasSugeridos.length > 0 && calcularDiasSugeridos.every(dia => dia && dia.diaSemana !== undefined)) {
      const nuevasAuditorias = calcularDiasSugeridos
        .filter(dia => dia && dia.diaSemana !== undefined)
        .map((dia, index) => ({
          id: `aud-${index}`,
          diaSemana: dia.diaSemana || 1,
          diaMes: dia.diaMes || null,
          mes: dia.mes || null,
          encargadoId: '',
          formularioId: '',
          hora: '09:00'
        }));
      setAuditoriasConfiguradas(nuevasAuditorias);
    } else if (form.cantidad === 0 || !form.cantidad) {
      setAuditoriasConfiguradas([]);
    }
  }, [calcularDiasSugeridos, form.cantidad]);
  
  // Calcular sugerencias basadas en el formulario actual (ya no usado pero lo dejo por si acaso)
  const sugerencias = useMemo(() => {
    if (!form.empresaId || !form.cantidad || form.cantidad <= 0) return [];
    
    const { cantidad, periodo, año, mes } = form;
    const sugerencias = [];
    
    if (periodo === 'mensual') {
      const diasEnMes = mes ? new Date(año, mes, 0).getDate() : 30;
      const semanasEnMes = Math.ceil(diasEnMes / 7);
      const auditoriasPorSemana = Math.ceil(cantidad / semanasEnMes);
      
      if (auditoriasPorSemana >= 1 && auditoriasPorSemana <= 5) {
        const diasPorSemana = auditoriasPorSemana === 1 ? [1] :
                              auditoriasPorSemana === 2 ? [1, 4] :
                              auditoriasPorSemana === 3 ? [1, 3, 5] :
                              auditoriasPorSemana === 4 ? [1, 2, 4, 5] :
                              [1, 2, 3, 4, 5];
        
        sugerencias.push({
          id: 'semanal-uniforme',
          titulo: `${auditoriasPorSemana} auditoría${auditoriasPorSemana > 1 ? 's' : ''} por semana`,
          descripcion: `Distribuidas uniformemente cada semana`,
          frecuencia: {
            tipo: 'semanal',
            diasSemana: diasPorSemana,
            intervalo: 1
          },
          color: 'primary'
        });
      }
      
      if (cantidad >= 8) {
        sugerencias.push({
          id: 'inicio-fin-semana',
          titulo: 'Lunes y Viernes',
          descripcion: 'Al inicio y final de cada semana',
          frecuencia: {
            tipo: 'semanal',
            diasSemana: [1, 5],
            intervalo: 1
          },
          color: 'success'
        });
      }
    } else if (periodo === 'semanal') {
      const diasPorSemana = cantidad <= 2 ? [1, 4] :
                            cantidad === 3 ? [1, 3, 5] :
                            cantidad === 4 ? [1, 2, 4, 5] :
                            [1, 2, 3, 4, 5];
      
      sugerencias.push({
        id: 'semanal-fijo',
        titulo: `${cantidad} auditoría${cantidad > 1 ? 's' : ''} por semana`,
        descripcion: `Distribuidas a lo largo de la semana`,
        frecuencia: {
          tipo: 'semanal',
          diasSemana: diasPorSemana.slice(0, cantidad),
          intervalo: 1
        },
        color: 'primary'
      });
    } else if (periodo === 'anual') {
      const auditoriasPorMes = Math.ceil(cantidad / 12);
      
      sugerencias.push({
        id: 'mensual-anual',
        titulo: `${auditoriasPorMes} auditoría${auditoriasPorMes > 1 ? 's' : ''} por mes`,
        descripcion: `Distribución mensual para cumplir el target anual`,
        frecuencia: {
          tipo: 'mensual',
          diaMes: 1,
          intervalo: 1
        },
        color: 'primary'
      });
    }
    
    return sugerencias.slice(0, 3);
  }, [form]);
  
  const puedeMostrarSugerencias = form.empresaId && form.cantidad > 0;

  // Cargar datos del target a editar
  useEffect(() => {
    if (targetToEdit && open) {
      setForm({
        empresaId: targetToEdit.empresaId || '',
        empresaNombre: targetToEdit.empresaNombre || '',
        sucursalId: targetToEdit.sucursalId || '',
        sucursalNombre: targetToEdit.sucursalNombre || '',
        periodo: targetToEdit.periodo || 'mensual',
        cantidad: targetToEdit.cantidad || 0,
        año: targetToEdit.año || new Date().getFullYear(),
        mes: targetToEdit.mes || new Date().getMonth() + 1,
        activo: targetToEdit.activo !== undefined ? targetToEdit.activo : true
      });
    } else if (open) {
      // Resetear formulario
      setForm({
        empresaId: selectedEmpresa && selectedEmpresa !== 'todas' ? selectedEmpresa : '',
        empresaNombre: '',
        sucursalId: '',
        sucursalNombre: '',
        periodo: 'mensual',
        cantidad: 0,
        año: new Date().getFullYear(),
        mes: new Date().getMonth() + 1,
        activo: true
      });
      setErrors({});
    }
  }, [targetToEdit, open, selectedEmpresa]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => {
      const updated = { ...prev, [name]: value };

      // Actualizar nombre de empresa/sucursal cuando se selecciona
      if (name === 'empresaId') {
        const empresa = empresasDisponibles?.find(e => e.id === value);
        updated.empresaNombre = empresa?.nombre || '';
        // Resetear sucursal si cambia la empresa
        if (value !== prev.empresaId) {
          updated.sucursalId = '';
          updated.sucursalNombre = '';
        }
      }
      if (name === 'sucursalId') {
        const sucursal = sucursalesDisponibles?.find(s => s.id === value);
        updated.sucursalNombre = sucursal?.nombre || '';
      }

      return updated;
    });
    // Limpiar error del campo
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!form.empresaId) {
      newErrors.empresaId = 'Empresa es requerida';
    }
    if (form.periodo === 'mensual' && !form.mes) {
      newErrors.mes = 'Mes es requerido para período mensual';
    }
    if (form.cantidad <= 0) {
      newErrors.cantidad = 'La cantidad debe ser mayor a 0';
    }
    if (form.año < new Date().getFullYear() - 1 || form.año > new Date().getFullYear() + 1) {
      newErrors.año = 'Año inválido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Guardar programación de auditorías
  const handleGuardarProgramacion = async () => {
    if (!form.empresaId || auditoriasConfiguradas.length === 0) {
      toast.error('No hay auditorías configuradas para guardar');
      return;
    }

    try {
      const empresaSeleccionada = empresasDisponibles?.find(e => e.id === form.empresaId);
      const sucursalSeleccionada = form.sucursalId 
        ? sucursalesDisponibles?.find(s => s.id === form.sucursalId)
        : null;

      // Calcular fechas basadas en el período
      const año = form.año;
      const mes = form.periodo === 'mensual' ? form.mes : null;

      // Crear todas las auditorías programadas
      const auditoriasCreadas = [];
      for (const auditoria of auditoriasConfiguradas) {
        let fechaAuditoria = null;
        
        if (form.periodo === 'mensual' && auditoria.diaMes) {
          // Para mensual, usar el día del mes
          fechaAuditoria = new Date(año, mes - 1, auditoria.diaMes);
        } else if (form.periodo === 'anual' && auditoria.diaMes && auditoria.mes) {
          // Para anual, usar mes y día
          fechaAuditoria = new Date(año, auditoria.mes - 1, auditoria.diaMes);
        } else {
          // Para semanal o si no hay día específico, calcular fecha basada en día de la semana
          const hoy = new Date();
          const diasHastaProximo = (auditoria.diaSemana - hoy.getDay() + 7) % 7;
          fechaAuditoria = new Date(hoy);
          fechaAuditoria.setDate(hoy.getDate() + diasHastaProximo);
        }

        // Obtener información del encargado si existe
        let encargadoInfo = null;
        if (auditoria.encargadoId) {
          const encargado = usuariosOperarios.find(u => u.id === auditoria.encargadoId);
          if (encargado) {
            encargadoInfo = {
              id: encargado.id,
              nombre: encargado.displayName || encargado.email,
              email: encargado.email
            };
          }
        }

        // Obtener información del formulario si existe
        let formularioInfo = null;
        if (auditoria.formularioId) {
          const formulario = formularios?.find(f => f.id === auditoria.formularioId);
          if (formulario) {
            formularioInfo = {
              id: formulario.id,
              nombre: formulario.nombre
            };
          }
        }

        const nuevaAuditoria = {
          empresa: empresaSeleccionada?.nombre || '',
          empresaId: form.empresaId,
          sucursal: sucursalSeleccionada?.nombre || '',
          sucursalId: form.sucursalId || null,
          formulario: formularioInfo?.nombre || '',
          formularioId: auditoria.formularioId || null,
          fecha: fechaAuditoria.toISOString().split('T')[0],
          hora: auditoria.hora || '09:00',
          estado: 'pendiente',
          encargado: encargadoInfo?.id || null,
          encargadoNombre: encargadoInfo?.nombre || null,
          clienteAdminId: userProfile?.clienteAdminId || userProfile?.uid,
          usuarioId: userProfile?.uid,
          fechaCreacion: serverTimestamp(),
          targetId: null, // Se actualizará después de crear el target
          descripcion: `Auditoría programada desde target`
        };

        const docRef = await addDoc(collection(db, 'auditorias_agendadas'), nuevaAuditoria);
        auditoriasCreadas.push(docRef.id);
      }

      setProgramacionGuardada(true);
      toast.success(`Programación guardada: ${auditoriasCreadas.length} auditoría${auditoriasCreadas.length > 1 ? 's' : ''} creada${auditoriasCreadas.length > 1 ? 's' : ''}`);
    } catch (error) {
      console.error('Error guardando programación:', error);
      toast.error('Error al guardar la programación');
    }
  };

  // Función auxiliar para crear el target
  const crearTarget = async () => {
    try {
      const targetData = {
        ...form,
        cantidad: Number(form.cantidad),
        año: Number(form.año),
        mes: form.periodo === 'mensual' ? Number(form.mes) : null,
        clienteAdminId: userProfile?.clienteAdminId || userProfile?.uid
      };

      if (targetToEdit) {
        await targetsService.updateTarget(targetToEdit.id, targetData);
        toast.success('Target actualizado exitosamente');
      } else {
        await targetsService.createTarget(targetData);
        toast.success('Target creado exitosamente');
      }

      if (onSave) {
        onSave();
      }
      
      // Cerrar el dialog de creación
      onClose();
    } catch (error) {
      console.error('Error guardando target:', error);
      toast.error('Error al guardar el target');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Verificar si hay programación sin guardar
    if (auditoriasConfiguradas.length > 0 && !programacionGuardada && !targetToEdit) {
      setMostrarConfirmacion(true);
      return;
    }

    // Crear el target
    await crearTarget();
  };

  const generarOpcionesAños = () => {
    const añoActual = new Date().getFullYear();
    return [añoActual - 1, añoActual, añoActual + 1];
  };

  const generarOpcionesMeses = () => {
    return [
      { value: 1, label: 'Enero' },
      { value: 2, label: 'Febrero' },
      { value: 3, label: 'Marzo' },
      { value: 4, label: 'Abril' },
      { value: 5, label: 'Mayo' },
      { value: 6, label: 'Junio' },
      { value: 7, label: 'Julio' },
      { value: 8, label: 'Agosto' },
      { value: 9, label: 'Septiembre' },
      { value: 10, label: 'Octubre' },
      { value: 11, label: 'Noviembre' },
      { value: 12, label: 'Diciembre' }
    ];
  };

  return (
    <>
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <Add color="primary" />
          {targetToEdit ? 'Editar Target' : 'Crear Nuevo Target'}
        </Box>
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required error={!!errors.empresaId}>
                <InputLabel>Empresa</InputLabel>
                <Select
                  name="empresaId"
                  value={form.empresaId}
                  onChange={handleChange}
                  label="Empresa"
                >
                  {empresasDisponibles?.map(empresa => (
                    <MenuItem key={empresa.id} value={empresa.id}>
                      {empresa.nombre}
                    </MenuItem>
                  ))}
                </Select>
                {errors.empresaId && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                    {errors.empresaId}
                  </Typography>
                )}
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Sucursal (Opcional)</InputLabel>
                <Select
                  name="sucursalId"
                  value={form.sucursalId}
                  onChange={handleChange}
                  label="Sucursal (Opcional)"
                  disabled={!form.empresaId}
                >
                    <MenuItem value="">Todas las sucursales</MenuItem>
                  {sucursalesDisponibles
                    ?.filter(suc => !form.empresaId || suc.empresaId === form.empresaId || suc.empresa === empresasDisponibles?.find(e => e.id === form.empresaId)?.nombre)
                    .map(sucursal => (
                      <MenuItem key={sucursal.id} value={sucursal.id}>
                        {sucursal.nombre}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControl fullWidth required>
                <InputLabel>Período</InputLabel>
                <Select
                  name="periodo"
                  value={form.periodo}
                  onChange={handleChange}
                  label="Período"
                >
                  <MenuItem value="semanal">Semanal</MenuItem>
                  <MenuItem value="mensual">Mensual</MenuItem>
                  <MenuItem value="anual">Anual</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                required
                name="cantidad"
                label="Cantidad de Auditorías"
                type="number"
                value={form.cantidad}
                onChange={handleChange}
                error={!!errors.cantidad}
                helperText={errors.cantidad}
                inputProps={{ min: 1 }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                required
                name="año"
                label="Año"
                type="number"
                value={form.año}
                onChange={handleChange}
                error={!!errors.año}
                helperText={errors.año}
                select
                SelectProps={{ native: true }}
              >
                {generarOpcionesAños().map(año => (
                  <option key={año} value={año}>{año}</option>
                ))}
              </TextField>
            </Grid>

            {form.periodo === 'mensual' && (
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required error={!!errors.mes}>
                  <InputLabel>Mes</InputLabel>
                  <Select
                    name="mes"
                    value={form.mes}
                    onChange={handleChange}
                    label="Mes"
                  >
                    {generarOpcionesMeses().map(mes => (
                      <MenuItem key={mes.value} value={mes.value}>
                        {mes.label}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.mes && (
                    <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                      {errors.mes}
                    </Typography>
                  )}
                </FormControl>
              </Grid>
            )}

            <Grid item xs={12}>
              <FormControl>
                <Box display="flex" alignItems="center" gap={1}>
                  <input
                    type="checkbox"
                    checked={form.activo}
                    onChange={(e) => setForm(prev => ({ ...prev, activo: e.target.checked }))}
                    id="activo-checkbox"
                  />
                  <label htmlFor="activo-checkbox">
                    <Typography variant="body2">Target activo</Typography>
                  </label>
                </Box>
              </FormControl>
            </Grid>
            
            {/* Configuración de Auditorías Programadas */}
            {puedeMostrarSugerencias && auditoriasConfiguradas.length > 0 && !targetToEdit && (
              <Grid item xs={12}>
                <Accordion defaultExpanded>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Lightbulb color="warning" />
                      <Typography variant="subtitle1" fontWeight="bold">
                        📅 Configurar Auditorías Programadas
                      </Typography>
                      <Chip 
                        label={`${auditoriasConfiguradas.length} auditoría${auditoriasConfiguradas.length > 1 ? 's' : ''}`}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                      Configura tus preferencias de días y luego cada auditoría individualmente. Los días serán sugeridos automáticamente basándose en tus preferencias.
                    </Typography>
                    
                    {/* Preferencias de días */}
                    <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: 'background.default' }}>
                      <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 2 }}>
                        Preferencias de Días
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                          <FormControl fullWidth>
                            <InputLabel>Días preferidos para auditar</InputLabel>
                            <Select
                              multiple
                              value={diasPreferidos}
                              onChange={(e) => setDiasPreferidos(e.target.value)}
                              renderValue={(selected) => (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                  {selected.map((value) => {
                                    const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
                                    const diasSemanaValues = [7, 1, 2, 3, 4, 5, 6];
                                    const idx = diasSemanaValues.indexOf(value);
                                    const label = idx >= 0 ? diasSemana[idx] : value;
                                    return (
                                      <Chip key={value} label={label} size="small" color="primary" />
                                    );
                                  })}
                                </Box>
                              )}
                              label="Días preferidos para auditar"
                            >
                              {diasSemanaDisponibles.map((dia) => (
                                <MenuItem key={dia.value} value={dia.value}>
                                  <Box display="flex" alignItems="center" gap={1}>
                                    {diasPreferidos.includes(dia.value) && (
                                      <Chip label={dia.label} size="small" color="primary" variant="outlined" />
                                    )}
                                    <Typography>{dia.label}</Typography>
                                  </Box>
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <FormControl fullWidth>
                            <InputLabel>Días donde no se auditara</InputLabel>
                            <Select
                              multiple
                              value={diasExcluidos}
                              onChange={(e) => setDiasExcluidos(e.target.value)}
                              renderValue={(selected) => (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                  {selected.map((value) => {
                                    const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
                                    const diasSemanaValues = [7, 1, 2, 3, 4, 5, 6];
                                    const idx = diasSemanaValues.indexOf(value);
                                    const label = idx >= 0 ? diasSemana[idx] : value;
                                    return (
                                      <Chip key={value} label={label} size="small" color="error" />
                                    );
                                  })}
                                </Box>
                              )}
                              label="Días donde no se auditara"
                            >
                              {diasSemanaDisponibles.map((dia) => (
                                <MenuItem key={dia.value} value={dia.value}>
                                  <Box display="flex" alignItems="center" gap={1}>
                                    {diasExcluidos.includes(dia.value) && (
                                      <Chip label={dia.label} size="small" color="error" variant="outlined" />
                                    )}
                                    <Typography>{dia.label}</Typography>
                                  </Box>
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>
                      </Grid>
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                        💡 El sistema distribuirá las {form.cantidad || 0} auditorías considerando tus preferencias
                      </Typography>
                    </Paper>
                    
                    {auditoriasConfiguradas.length > 0 ? (
                      <Stack spacing={2}>
                        {auditoriasConfiguradas.map((auditoria, index) => {
                          const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
                        return (
                          <Paper key={auditoria.id} variant="outlined" sx={{ p: 2 }}>
                            <Box display="flex" alignItems="center" gap={2} mb={2}>
                              <Chip 
                                label={`Auditoría #${index + 1}`}
                                color="primary"
                                size="small"
                              />
                              <Typography variant="caption" color="text.secondary">
                                {auditoria.mes && `Mes ${auditoria.mes} - `}
                                {auditoria.diaMes && `Día ${auditoria.diaMes}`}
                              </Typography>
                            </Box>
                            <Grid container spacing={2}>
                              <Grid item xs={12} md={3}>
                                <FormControl fullWidth>
                                  <InputLabel>Día de la semana</InputLabel>
                                  <Select
                                    value={auditoria.diaSemana}
                                    onChange={(e) => {
                                      const nuevasAuditorias = [...auditoriasConfiguradas];
                                      nuevasAuditorias[index].diaSemana = e.target.value;
                                      setAuditoriasConfiguradas(nuevasAuditorias);
                                    }}
                                    label="Día de la semana"
                                  >
                                    {diasSemana.map((dia, idx) => (
                                      <MenuItem key={idx + 1} value={idx === 0 ? 7 : idx}>
                                        {dia}
                                      </MenuItem>
                                    ))}
                                  </Select>
                                </FormControl>
                              </Grid>
                              <Grid item xs={12} md={4}>
                                <FormControl fullWidth>
                                  <InputLabel>Encargado (Opcional)</InputLabel>
                                  <Select
                                    value={auditoria.encargadoId}
                                    onChange={(e) => {
                                      const nuevasAuditorias = [...auditoriasConfiguradas];
                                      nuevasAuditorias[index].encargadoId = e.target.value;
                                      setAuditoriasConfiguradas(nuevasAuditorias);
                                    }}
                                    label="Encargado (Opcional)"
                                    disabled={cargandoUsuarios}
                                  >
                                    <MenuItem value="">
                                      <Box display="flex" alignItems="center" gap={1}>
                                        <PersonAdd fontSize="small" color="action" />
                                        <Typography variant="body2" color="text.secondary">
                                          Sin asignar
                                        </Typography>
                                      </Box>
                                    </MenuItem>
                                    {usuariosOperarios.map((usuario) => (
                                      <MenuItem key={usuario.id} value={usuario.id}>
                                        <Box display="flex" alignItems="center" gap={1}>
                                          <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>
                                            {usuario.displayName?.charAt(0).toUpperCase() || usuario.email?.charAt(0).toUpperCase()}
                                          </Avatar>
                                          <Box>
                                            <Typography variant="body2" fontWeight={500}>
                                              {usuario.displayName || 'Sin nombre'}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                              {usuario.email}
                                            </Typography>
                                          </Box>
                                        </Box>
                                      </MenuItem>
                                    ))}
                                  </Select>
                                </FormControl>
                              </Grid>
                              <Grid item xs={12} md={4}>
                                <FormControl fullWidth>
                                  <InputLabel>Formulario (Opcional)</InputLabel>
                                  <Select
                                    value={auditoria.formularioId}
                                    onChange={(e) => {
                                      const nuevasAuditorias = [...auditoriasConfiguradas];
                                      nuevasAuditorias[index].formularioId = e.target.value;
                                      setAuditoriasConfiguradas(nuevasAuditorias);
                                    }}
                                    label="Formulario (Opcional)"
                                  >
                                    <MenuItem value="">
                                      <Typography variant="body2" color="text.secondary">
                                        Elegir el día de la auditoría
                                      </Typography>
                                    </MenuItem>
                                    {formularios?.map((formulario) => (
                                      <MenuItem key={formulario.id} value={formulario.id}>
                                        {formulario.nombre}
                                      </MenuItem>
                                    ))}
                                  </Select>
                                </FormControl>
                              </Grid>
                              <Grid item xs={12} md={1}>
                                <FormControl fullWidth>
                                  <TextField
                                    type="time"
                                    label="Hora"
                                    value={auditoria.hora}
                                    onChange={(e) => {
                                      const nuevasAuditorias = [...auditoriasConfiguradas];
                                      nuevasAuditorias[index].hora = e.target.value;
                                      setAuditoriasConfiguradas(nuevasAuditorias);
                                    }}
                                    InputLabelProps={{ shrink: true }}
                                    size="small"
                                  />
                                </FormControl>
                              </Grid>
                            </Grid>
                          </Paper>
                        );
                      })}
                      </Stack>
                    ) : (
                      <Box textAlign="center" py={4}>
                        <Typography variant="body2" color="text.secondary">
                          Completa el formulario del target para ver las sugerencias de auditorías programadas
                        </Typography>
                      </Box>
                    )}
                    <Box mt={3} display="flex" gap={2} justifyContent="flex-end">
                      {programacionGuardada ? (
                        <Alert severity="success" sx={{ width: '100%' }}>
                          ✅ Programación guardada exitosamente
                        </Alert>
                      ) : (
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={handleGuardarProgramacion}
                          disabled={auditoriasConfiguradas.length === 0}
                        >
                          Guardar Programación
                        </Button>
                      )}
                    </Box>
                  </AccordionDetails>
                </Accordion>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant="contained">
            {targetToEdit ? 'Actualizar' : 'Crear'} Target
          </Button>
        </DialogActions>
      </form>

      {/* Diálogo de confirmación para programación sin guardar */}
      <Dialog open={mostrarConfirmacion} onClose={() => setMostrarConfirmacion(false)}>
        <DialogTitle>¿Guardar programación?</DialogTitle>
        <DialogContent>
          <Typography>
            Tienes {auditoriasConfiguradas.length} auditoría{auditoriasConfiguradas.length > 1 ? 's' : ''} programada{auditoriasConfiguradas.length > 1 ? 's' : ''} que no se ha{auditoriasConfiguradas.length > 1 ? 'n' : ''} guardado.
          </Typography>
          <Typography sx={{ mt: 2 }}>
            ¿Deseas guardar la programación antes de crear el target?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMostrarConfirmacion(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={async () => {
              setMostrarConfirmacion(false);
              await handleGuardarProgramacion();
              // Esperar un momento y luego crear el target
              setTimeout(async () => {
                await crearTarget();
              }, 500);
            }} 
            variant="contained"
            color="primary"
          >
            Guardar y Crear Target
          </Button>
          <Button 
            onClick={async () => {
              setMostrarConfirmacion(false);
              // Crear target sin guardar programación
              await crearTarget();
            }} 
            color="inherit"
          >
            Crear Target sin guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
    </>
  );
};

export default CreateTargetDialog;
