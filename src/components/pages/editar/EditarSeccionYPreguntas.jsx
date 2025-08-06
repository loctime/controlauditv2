import React, { useState, useMemo, useCallback, memo } from "react";
import {
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Modal,
  Box,
  TextField,
  Button,
  Alert,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControlLabel,
  Switch,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  CircularProgress
} from "@mui/material";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import EditIcon from "@mui/icons-material/Edit";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import AddIcon from "@mui/icons-material/Add";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import Swal from 'sweetalert2';
import Tooltip from '@mui/material/Tooltip';
import clsx from 'clsx';
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const ESTADOS = [
  { value: 'activo', label: 'Activo' },
  { value: 'inactivo', label: 'Inactivo' },
  { value: 'borrador', label: 'Borrador' }
];

// ✅ Cache local para formularios
const formularioCache = new Map();

// ✅ Componente memoizado para secciones
const SeccionItem = memo(({ 
  seccion, 
  seccionIndex, 
  onEditarSeccion, 
  onEliminarSeccion, 
  onAgregarPregunta,
  onEditarPregunta,
  onEliminarPregunta,
  puedeEditar,
  puedeEliminar 
}) => {
  const handleEditarSeccion = useCallback(() => {
    onEditarSeccion(seccion);
  }, [seccion, onEditarSeccion]);

  const handleEliminarSeccion = useCallback(() => {
    onEliminarSeccion(seccion.nombre);
  }, [seccion.nombre, onEliminarSeccion]);

  const handleClickAgregarPregunta = useCallback(() => {
    onAgregarPregunta(seccion);
  }, [seccion, onAgregarPregunta]);

  return (
    <Box mb={2} p={2} bgcolor="#fafbfc" borderRadius={2} boxShadow={0}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
        <Typography variant="subtitle1" fontWeight={500} sx={{ mb: 0 }}>
          {seccion.nombre}
        </Typography>
        <Box display="flex" flexDirection="column" alignItems="flex-end" gap={0.5}>
          {puedeEditar && (
            <Tooltip title="Editar sección" arrow>
              <span>
                <IconButton 
                  size="small" 
                  color="primary" 
                  onClick={handleEditarSeccion}
                  sx={{ opacity: 0.7, ':hover': { opacity: 1 } }}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          )}
          {puedeEliminar && (
            <Tooltip title="Eliminar sección" arrow>
              <span>
                <IconButton 
                  size="small" 
                  color="error" 
                  onClick={handleEliminarSeccion}
                  sx={{ opacity: 0.7, ':hover': { opacity: 1 } }}
                >
                  <DeleteForeverIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          )}
          {puedeEditar && (
            <Tooltip title="Agregar pregunta" arrow>
              <span>
                <IconButton 
                  size="small" 
                  color="primary" 
                  onClick={handleClickAgregarPregunta}
                  sx={{ opacity: 0.7, ':hover': { opacity: 1 } }}
                >
                  <AddIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          )}
        </Box>
      </Box>
      <TableContainer component={Paper} elevation={0} sx={{ boxShadow: 'none', bgcolor: 'transparent' }}>
        <Table size="small" sx={{ minWidth: 400 }}>
          <TableHead>
            <TableRow>
              <TableCell align="left" sx={{ fontWeight: 500, fontSize: 14, bgcolor: '#f3f4f6' }}>Pregunta</TableCell>
              <TableCell align="right" sx={{ fontWeight: 500, fontSize: 14, bgcolor: '#f3f4f6', width: 120 }}>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {seccion.preguntas && seccion.preguntas.map((pregunta, preguntaIndex) => (
              <TableRow
                key={preguntaIndex}
                sx={{
                  transition: 'background 0.2s',
                  '&:hover': { background: '#f5f7fa' }
                }}
              >
                <TableCell align="left" sx={{ fontSize: 14 }}>{pregunta}</TableCell>
                <TableCell align="right" sx={{ p: 0 }}>
                  <Box display="flex" justifyContent="flex-end" gap={0.5}>
                    {puedeEditar && (
                      <Tooltip title="Editar pregunta" arrow>
                        <span>
                          <IconButton 
                            size="small" 
                            color="primary" 
                            onClick={() => {
                              console.log('🔧 [DEBUG] Click en icono editar pregunta:', { pregunta, seccionNombre: seccion.nombre, index: preguntaIndex });
                              onEditarPregunta({ pregunta, seccionNombre: seccion.nombre, index: preguntaIndex });
                            }}
                            sx={{ opacity: 0.7, ':hover': { opacity: 1 } }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    )}
                    {puedeEliminar && (
                      <Tooltip title="Eliminar pregunta" arrow>
                        <span>
                          <IconButton 
                            size="small" 
                            color="error" 
                            onClick={() => onEliminarPregunta(preguntaIndex, seccion.nombre)}
                            sx={{ opacity: 0.7, ':hover': { opacity: 1 } }}
                          >
                            <DeleteForeverIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
});

// ✅ Componente memoizado para información del formulario
const FormularioInfo = memo(({ formulario, puedeEditar, puedeEliminar }) => {
  const metadata = useMemo(() => ({
    creador: formulario.creadorNombre || formulario.creadorEmail || 'Desconocido',
    fechaCreacion: formulario.timestamp?.toDate?.()?.toLocaleString?.() || 'No disponible',
    ultimaModificacion: formulario.ultimaModificacion?.toLocaleString?.() || 'No disponible'
  }), [formulario]);

  return (
    <Box mb={2} p={2} bgcolor="grey.100" borderRadius={1}>
      <Typography variant="h6" gutterBottom>
        {formulario.nombre}
      </Typography>
      <Box display="flex" gap={1} flexWrap="wrap">
        <Chip 
          label={puedeEditar ? "Puede editar" : "Solo lectura"} 
          color={puedeEditar ? "success" : "warning"} 
          size="small" 
        />
        <Chip 
          label={puedeEliminar ? "Puede eliminar" : "No puede eliminar"} 
          color={puedeEliminar ? "success" : "warning"} 
          size="small" 
        />
        {formulario.esPublico && (
          <Chip label="Público" color="primary" size="small" />
        )}
      </Box>
      <Box mt={1}>
        <Typography variant="caption" color="text.secondary">
          <strong>Creado por:</strong> {metadata.creador}<br/>
          <strong>Fecha de creación:</strong> {metadata.fechaCreacion}<br/>
          <strong>Última modificación:</strong> {metadata.ultimaModificacion}
        </Typography>
      </Box>
    </Box>
  );
});

const EditarSeccionYPreguntas = ({ 
  formularioSeleccionado, 
  setFormularioSeleccionado,
  puedeEditar = true,
  puedeEliminar = true 
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [modalEditarFormularioAbierto, setModalEditarFormularioAbierto] = useState(false);
  const [modalEditarSeccionAbierto, setModalEditarSeccionAbierto] = useState(false);
  const [modalEditarPreguntaAbierto, setModalEditarPreguntaAbierto] = useState(false);
  const [modalAgregarPreguntaAbierto, setModalAgregarPreguntaAbierto] = useState(false);
  const [accordionOpen, setAccordionOpen] = useState(false);
  const [nuevoNombreFormulario, setNuevoNombreFormulario] = useState(formularioSeleccionado?.nombre || '');
  const [nuevoEstado, setNuevoEstado] = useState(formularioSeleccionado?.estado || 'activo');
  const [nuevaVersion, setNuevaVersion] = useState(formularioSeleccionado?.version || '1.0');
  const [nuevoEsPublico, setNuevoEsPublico] = useState(!!formularioSeleccionado?.esPublico);
  const [nuevoNombreSeccion, setNuevoNombreSeccion] = useState('');
  const [nuevoTextoPregunta, setNuevoTextoPregunta] = useState('');
  const [nuevaPregunta, setNuevaPregunta] = useState('');
  const [seccionSeleccionada, setSeccionSeleccionada] = useState(null);
  const [preguntaSeleccionada, setPreguntaSeleccionada] = useState(null);

  // ✅ Función para normalizar las secciones (manejar tanto arrays como objetos)
  const normalizarSecciones = useCallback((secciones) => {
    console.log('🔍 Normalizando secciones:', secciones);
    
    if (!secciones) {
      console.log('⚠️ No hay secciones definidas');
      return [];
    }
    
    // Si es un array, devolverlo tal como está
    if (Array.isArray(secciones)) {
      console.log('✅ Secciones ya es un array, longitud:', secciones.length);
      return secciones;
    }
    
    // Si es un objeto, convertirlo a array
    if (typeof secciones === 'object') {
      const seccionesArray = Object.values(secciones);
      console.log('🔄 Secciones convertidas de objeto a array, longitud:', seccionesArray.length);
      return seccionesArray;
    }
    
    console.log('❌ Formato de secciones no reconocido:', typeof secciones);
    return [];
  }, []);

  // ✅ Obtener secciones normalizadas con memoización
  const seccionesNormalizadas = useMemo(() => {
    return normalizarSecciones(formularioSeleccionado?.secciones);
  }, [formularioSeleccionado?.secciones, normalizarSecciones]);

  // ✅ Calcular estadísticas con memoización
  const estadisticas = useMemo(() => {
    const numSecciones = seccionesNormalizadas.length;
    const numPreguntas = seccionesNormalizadas.reduce((acc, s) => acc + (s.preguntas?.length || 0), 0);
    return { numSecciones, numPreguntas };
  }, [seccionesNormalizadas]);

  // ✅ Cache del formulario en localStorage
  const cacheFormulario = useCallback(() => {
    if (!formularioSeleccionado?.id) return;
    
    try {
      const cacheKey = `formulario_${formularioSeleccionado.id}`;
      const cacheData = {
        formulario: formularioSeleccionado,
        timestamp: Date.now(),
        secciones: seccionesNormalizadas
      };
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
      console.log('✅ Formulario cacheado en localStorage:', cacheKey);
    } catch (error) {
      console.warn('⚠️ Error al cachear formulario:', error);
    }
  }, [formularioSeleccionado, seccionesNormalizadas]);

  // ✅ Recuperar formulario del cache
  const recuperarFormularioCache = useCallback(() => {
    if (!formularioSeleccionado?.id) return null;
    
    try {
      const cacheKey = `formulario_${formularioSeleccionado.id}`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const cacheData = JSON.parse(cached);
        const tiempoExpiracion = 5 * 60 * 1000; // 5 minutos
        if (Date.now() - cacheData.timestamp < tiempoExpiracion) {
          console.log('✅ Formulario recuperado del cache:', cacheKey);
          return cacheData.formulario;
        } else {
          localStorage.removeItem(cacheKey);
        }
      }
    } catch (error) {
      console.warn('⚠️ Error al recuperar cache:', error);
    }
    return null;
  }, [formularioSeleccionado?.id]);

  // ✅ Cachear formulario cuando cambie
  React.useEffect(() => {
    if (formularioSeleccionado?.id && seccionesNormalizadas.length > 0) {
      cacheFormulario();
    }
  }, [formularioSeleccionado, seccionesNormalizadas, cacheFormulario]);

  // ✅ Debug cuando cambia el formulario
  React.useEffect(() => {
    console.log('🔄 Formulario seleccionado cambió:', {
      id: formularioSeleccionado?.id,
      nombre: formularioSeleccionado?.nombre,
      secciones: formularioSeleccionado?.secciones,
      seccionesNormalizadas: seccionesNormalizadas,
      estadisticas: estadisticas
    });
  }, [formularioSeleccionado, seccionesNormalizadas, estadisticas]);

  // ✅ Debug para el modal de editar pregunta
  React.useEffect(() => {
    console.log('🔧 [DEBUG] modalEditarPreguntaAbierto cambió a:', modalEditarPreguntaAbierto);
    if (modalEditarPreguntaAbierto) {
      console.log('🔧 [DEBUG] Modal de editar pregunta ABIERTO');
      console.log('🔧 [DEBUG] preguntaSeleccionada:', preguntaSeleccionada);
      console.log('🔧 [DEBUG] nuevoTextoPregunta:', nuevoTextoPregunta);
    }
  }, [modalEditarPreguntaAbierto, preguntaSeleccionada, nuevoTextoPregunta]);

  // ✅ Debug de props recibidas
  React.useEffect(() => {
    console.log('🔧 [DEBUG] EditarSeccionYPreguntas props:', {
      formularioSeleccionado: formularioSeleccionado?.id,
      puedeEditar,
      puedeEliminar,
      seccionesNormalizadas: seccionesNormalizadas?.length
    });
  }, [formularioSeleccionado, puedeEditar, puedeEliminar, seccionesNormalizadas]);

  // ✅ Validar que hay un formulario seleccionado
  if (!formularioSeleccionado || !formularioSeleccionado.id) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '200px',
        bgcolor: 'background.paper',
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider'
      }}>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
            📝 Selecciona un formulario para editar
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Usa el selector de arriba para elegir un formulario
          </Typography>
        </Box>
      </Box>
    );
  }

  const handleGuardarCambiosFormulario = useCallback(async () => {
    if (!puedeEditar) {
      console.log('[DEBUG] Usuario no tiene permisos para editar:', {
        puedeEditar,
        formularioId: formularioSeleccionado?.id,
        usuarioId: user?.uid
      });
      Swal.fire("Error", "No tienes permisos para editar este formulario.", "error");
      return;
    }
    try {
      const formularioRef = doc(db, "formularios", formularioSeleccionado.id);
      await updateDoc(formularioRef, {
        nombre: nuevoNombreFormulario,
        estado: nuevoEstado,
        version: nuevaVersion,
        esPublico: nuevoEsPublico,
        ultimaModificacion: new Date()
      });
      setFormularioSeleccionado(prev => ({
        ...prev,
        nombre: nuevoNombreFormulario,
        estado: nuevoEstado,
        version: nuevaVersion,
        esPublico: nuevoEsPublico,
        ultimaModificacion: new Date()
      }));
      Swal.fire("Éxito", "Formulario actualizado exitosamente.", "success");
      setAccordionOpen(false);
    } catch (error) {
      console.error("Error al actualizar formulario:", error);
      Swal.fire("Error", "Error al actualizar el formulario.", "error");
    }
  }, [puedeEditar, formularioSeleccionado.id, nuevoNombreFormulario, nuevoEstado, nuevaVersion, nuevoEsPublico, setFormularioSeleccionado]);

  const handleGuardarCambiosSeccion = useCallback(async () => {
    if (!puedeEditar) {
      Swal.fire("Error", "No tienes permisos para editar este formulario.", "error");
      return;
    }

    try {
      if (!seccionSeleccionada) {
        Swal.fire("Error", "No se ha seleccionado ninguna sección.", "error");
        return;
      }

      const seccionesActualizadas = seccionesNormalizadas.map(seccion => 
        seccion.nombre === seccionSeleccionada.nombre 
          ? { ...seccion, nombre: nuevoNombreSeccion }
          : seccion
      );

      const formularioRef = doc(db, "formularios", formularioSeleccionado.id);
      await updateDoc(formularioRef, { 
        secciones: seccionesActualizadas,
        ultimaModificacion: new Date()
      });
      setFormularioSeleccionado(prev => ({ ...prev, secciones: seccionesActualizadas }));
      setModalEditarSeccionAbierto(false);
      Swal.fire("Éxito", "Sección actualizada exitosamente.", "success");
    } catch (error) {
      console.error("Error al actualizar sección:", error);
      Swal.fire("Error", "Error al actualizar la sección.", "error");
    }
  }, [puedeEditar, seccionSeleccionada, seccionesNormalizadas, nuevoNombreSeccion, formularioSeleccionado.id, setFormularioSeleccionado]);

  const handleGuardarCambiosPregunta = useCallback(async () => {
    console.log('🔧 [DEBUG] handleGuardarCambiosPregunta llamado');
    console.log('🔧 [DEBUG] puedeEditar:', puedeEditar);
    console.log('🔧 [DEBUG] preguntaSeleccionada:', preguntaSeleccionada);
    console.log('🔧 [DEBUG] nuevoTextoPregunta:', nuevoTextoPregunta);
    console.log('🔧 [DEBUG] seccionesNormalizadas:', seccionesNormalizadas);
    
    if (!puedeEditar) {
      console.log('🔧 [DEBUG] Usuario no tiene permisos para editar');
      Swal.fire("Error", "No tienes permisos para editar este formulario.", "error");
      return;
    }

    try {
      if (!preguntaSeleccionada) {
        console.log('🔧 [DEBUG] No hay pregunta seleccionada');
        Swal.fire("Error", "No se ha seleccionado ninguna pregunta.", "error");
        return;
      }

      const seccionesActualizadas = seccionesNormalizadas.map(seccion => {
        if (seccion.nombre === preguntaSeleccionada.seccionNombre) {
          const preguntasActualizadas = seccion.preguntas.map((pregunta, index) => 
            index === preguntaSeleccionada.index ? nuevoTextoPregunta : pregunta
          );
          return { ...seccion, preguntas: preguntasActualizadas };
        }
        return seccion;
      });

      console.log('🔧 [DEBUG] Secciones actualizadas:', seccionesActualizadas);
      console.log('🔧 [DEBUG] Formulario ID:', formularioSeleccionado.id);

      const formularioRef = doc(db, "formularios", formularioSeleccionado.id);
      await updateDoc(formularioRef, { 
        secciones: seccionesActualizadas,
        ultimaModificacion: new Date()
      });
      
      console.log('🔧 [DEBUG] Documento actualizado en Firestore exitosamente');
      
      setFormularioSeleccionado(prev => ({ ...prev, secciones: seccionesActualizadas }));
      setModalEditarPreguntaAbierto(false);
      Swal.fire("Éxito", "Pregunta actualizada exitosamente.", "success");
    } catch (error) {
      console.error("Error al actualizar pregunta:", error);
      Swal.fire("Error", "Error al actualizar la pregunta.", "error");
    }
  }, [puedeEditar, preguntaSeleccionada, seccionesNormalizadas, nuevoTextoPregunta, formularioSeleccionado.id, setFormularioSeleccionado]);

  const handleGuardarNuevaPregunta = useCallback(async () => {
    console.log('🔧 [DEBUG] handleGuardarNuevaPregunta llamado');
    console.log('🔧 [DEBUG] puedeEditar:', puedeEditar);
    console.log('🔧 [DEBUG] seccionSeleccionada:', seccionSeleccionada);
    console.log('🔧 [DEBUG] nuevaPregunta:', nuevaPregunta);
    console.log('🔧 [DEBUG] seccionesNormalizadas:', seccionesNormalizadas);
    
    if (!puedeEditar) {
      console.log('🔧 [DEBUG] Usuario no tiene permisos para editar');
      Swal.fire("Error", "No tienes permisos para editar este formulario.", "error");
      return;
    }

    try {
      if (!seccionSeleccionada) {
        console.log('🔧 [DEBUG] No hay sección seleccionada');
        Swal.fire("Error", "Sección no proporcionada.", "error");
        return;
      }

      const seccionesActualizadas = seccionesNormalizadas.map(seccion => {
        if (seccion.nombre === seccionSeleccionada.nombre) {
          const preguntasActualizadas = [...seccion.preguntas, nuevaPregunta];
          return { ...seccion, preguntas: preguntasActualizadas };
        }
        return seccion;
      });

      console.log('🔧 [DEBUG] Secciones actualizadas:', seccionesActualizadas);
      console.log('🔧 [DEBUG] Formulario ID:', formularioSeleccionado.id);

      const formularioRef = doc(db, "formularios", formularioSeleccionado.id);
      await updateDoc(formularioRef, { 
        secciones: seccionesActualizadas,
        ultimaModificacion: new Date()
      });
      
      console.log('🔧 [DEBUG] Documento actualizado en Firestore exitosamente');
      
      setFormularioSeleccionado(prev => ({ ...prev, secciones: seccionesActualizadas }));
      setModalAgregarPreguntaAbierto(false);
      setNuevaPregunta('');
      Swal.fire("Éxito", "Pregunta agregada exitosamente.", "success");
    } catch (error) {
      console.error("Error al agregar pregunta:", error);
      Swal.fire("Error", "Error al agregar pregunta.", "error");
    }
  }, [puedeEditar, seccionSeleccionada, seccionesNormalizadas, nuevaPregunta, formularioSeleccionado.id, setFormularioSeleccionado]);

  const handleEliminarFormulario = useCallback(async (id) => {
    if (!puedeEliminar) {
      Swal.fire("Error", "No tienes permisos para eliminar este formulario.", "error");
      return;
    }

    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: "¡No podrás recuperar este formulario!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar'
    });

    if (result.isConfirmed) {
      try {
        await deleteDoc(doc(db, "formularios", id));
        setFormularioSeleccionado(null);
        // Limpiar cache
        localStorage.removeItem(`formulario_${id}`);
        Swal.fire("Eliminado", "Formulario eliminado exitosamente.", "success");
      } catch (error) {
        console.error("Error al eliminar formulario:", error);
        Swal.fire("Error", "Error al eliminar el formulario.", "error");
      }
    }
  }, [puedeEliminar, setFormularioSeleccionado]);

  const handleEliminarSeccion = useCallback(async (nombreSeccion) => {
    if (!puedeEliminar) {
      Swal.fire("Error", "No tienes permisos para eliminar secciones.", "error");
      return;
    }

    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: "¡No podrás recuperar esta sección y sus preguntas!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar'
    });

    if (result.isConfirmed) {
      try {
        const seccionesActualizadas = seccionesNormalizadas.filter(seccion => seccion.nombre !== nombreSeccion);
        const formularioRef = doc(db, "formularios", formularioSeleccionado.id);
        await updateDoc(formularioRef, { 
          secciones: seccionesActualizadas,
          ultimaModificacion: new Date()
        });
        setFormularioSeleccionado(prev => ({ ...prev, secciones: seccionesActualizadas }));
        Swal.fire("Eliminado", "Sección eliminada exitosamente.", "success");
      } catch (error) {
        console.error("Error al eliminar sección:", error);
        Swal.fire("Error", "Error al eliminar la sección.", "error");
      }
    }
  }, [puedeEliminar, seccionesNormalizadas, formularioSeleccionado.id, setFormularioSeleccionado]);

  const handleEliminarPregunta = useCallback(async (indexPregunta, nombreSeccion) => {
    console.log('🔧 [DEBUG] handleEliminarPregunta llamado');
    console.log('🔧 [DEBUG] puedeEliminar:', puedeEliminar);
    console.log('🔧 [DEBUG] indexPregunta:', indexPregunta);
    console.log('🔧 [DEBUG] nombreSeccion:', nombreSeccion);
    console.log('🔧 [DEBUG] seccionesNormalizadas:', seccionesNormalizadas);
    
    if (!puedeEliminar) {
      console.log('🔧 [DEBUG] Usuario no tiene permisos para eliminar');
      Swal.fire("Error", "No tienes permisos para eliminar preguntas.", "error");
      return;
    }

    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: "¡No podrás recuperar esta pregunta!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar'
    });

    if (result.isConfirmed) {
      try {
        const seccionesActualizadas = seccionesNormalizadas.map(seccion => {
          if (seccion.nombre === nombreSeccion) {
            const preguntasActualizadas = seccion.preguntas.filter((_, idx) => idx !== indexPregunta);
            return { ...seccion, preguntas: preguntasActualizadas };
          }
          return seccion;
        });

        console.log('🔧 [DEBUG] Secciones actualizadas:', seccionesActualizadas);
        console.log('🔧 [DEBUG] Formulario ID:', formularioSeleccionado.id);

        const formularioRef = doc(db, "formularios", formularioSeleccionado.id);
        await updateDoc(formularioRef, { 
          secciones: seccionesActualizadas,
          ultimaModificacion: new Date()
        });
        
        console.log('🔧 [DEBUG] Documento actualizado en Firestore exitosamente');
        
        setFormularioSeleccionado(prev => ({ ...prev, secciones: seccionesActualizadas }));
        Swal.fire("Eliminado", "Pregunta eliminada exitosamente.", "success");
      } catch (error) {
        console.error("Error al eliminar pregunta:", error);
        Swal.fire("Error", "Error al eliminar la pregunta.", "error");
      }
    }
  }, [puedeEliminar, seccionesNormalizadas, formularioSeleccionado.id, setFormularioSeleccionado]);

  // ✅ Handlers memoizados para secciones
  const handleEditarSeccion = useCallback((seccion) => {
    setSeccionSeleccionada(seccion);
    setNuevoNombreSeccion(seccion.nombre);
    setModalEditarSeccionAbierto(true);
  }, []);

  const handleAbrirModalAgregarPregunta = useCallback((seccion) => {
    setSeccionSeleccionada(seccion);
    setModalAgregarPreguntaAbierto(true);
  }, []);

  const handleEditarPregunta = useCallback((preguntaData) => {
    console.log('🔧 [DEBUG] handleEditarPregunta llamado con:', preguntaData);
    console.log('🔧 [DEBUG] puedeEditar:', puedeEditar);
    console.log('🔧 [DEBUG] modalEditarPreguntaAbierto antes:', modalEditarPreguntaAbierto);
    
    setPreguntaSeleccionada(preguntaData);
    setNuevoTextoPregunta(preguntaData.pregunta);
    setModalEditarPreguntaAbierto(true);
    
    console.log('🔧 [DEBUG] Estados actualizados - preguntaSeleccionada:', preguntaData);
    console.log('🔧 [DEBUG] Estados actualizados - nuevoTextoPregunta:', preguntaData.pregunta);
    console.log('🔧 [DEBUG] Estados actualizados - modalEditarPreguntaAbierto: true');
  }, [puedeEditar, modalEditarPreguntaAbierto]);

  return (
    <div>
      {/* Botón Volver */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Typography variant="h5" sx={{ flex: 1 }}>
          Editando: {formularioSeleccionado.nombre}
        </Typography>
      </Box>

      {/* Alertas de permisos */}
      {!puedeEditar && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography variant="body2">
            <strong>Modo de solo lectura:</strong> No puedes editar este formulario.
          </Typography>
        </Alert>
      )}
      {!puedeEliminar && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2">
            <strong>Permisos limitados:</strong> No puedes eliminar elementos de este formulario.
          </Typography>
        </Alert>
      )}

      {/* Información del formulario */}
      <FormularioInfo 
        formulario={formularioSeleccionado}
        puedeEditar={puedeEditar}
        puedeEliminar={puedeEliminar}
      />

      {/* Accordion para edición de secciones y preguntas */}
      <Accordion expanded={accordionOpen} onChange={() => setAccordionOpen(!accordionOpen)} sx={{ mb: 2 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle1" fontWeight={600}>
            Editar contenido del formulario
          </Typography>
          <Box ml={2} display="flex" gap={2} alignItems="center">
            <Chip label={`Secciones: ${estadisticas.numSecciones}`} size="small" />
            <Chip label={`Preguntas: ${estadisticas.numPreguntas}`} size="small" />
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          {seccionesNormalizadas.length === 0 && (
            <Alert severity="info" sx={{ my: 2 }}>
              <Box display="flex" alignItems="center" gap={2}>
                {!formularioSeleccionado.secciones && <CircularProgress size={20} />}
                <Typography variant="body2">
                  {formularioSeleccionado.secciones ? 
                    'Este formulario no tiene secciones definidas.' : 
                    'Cargando secciones del formulario...'
                  }
                </Typography>
              </Box>
            </Alert>
          )}
          {seccionesNormalizadas.map((seccion, seccionIndex) => (
            <SeccionItem
              key={`${seccion.nombre}-${seccionIndex}`}
              seccion={seccion}
              seccionIndex={seccionIndex}
              onEditarSeccion={handleEditarSeccion}
              onEliminarSeccion={handleEliminarSeccion}
              onAgregarPregunta={handleAbrirModalAgregarPregunta}
              onEditarPregunta={handleEditarPregunta}
              onEliminarPregunta={handleEliminarPregunta}
              puedeEditar={puedeEditar}
              puedeEliminar={puedeEliminar}
            />
          ))}
        </AccordionDetails>
      </Accordion>

      {/* Botón para eliminar el formulario */}
      {puedeEliminar && (
        <Button
          variant="contained"
          color="error"
          onClick={() => handleEliminarFormulario(formularioSeleccionado.id)}
          sx={{ mb: 2, ml: 2 }}
        >
          Eliminar Formulario
          <DeleteForeverIcon />
        </Button>
      )}

      {/* Modales de edición de secciones y preguntas */}
      <Modal
        open={modalEditarFormularioAbierto}
        onClose={() => setModalEditarFormularioAbierto(false)}
      >
        <Box sx={{ ...style, width: 400 }}>
          <Typography variant="h6">Editar Formulario</Typography>
          <TextField
            fullWidth
            label="Nombre del Formulario"
            value={nuevoNombreFormulario}
            onChange={(e) => setNuevoNombreFormulario(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Button variant="contained" color="primary" onClick={handleGuardarCambiosFormulario}>
            Guardar Cambios
          </Button>
        </Box>
      </Modal>

      <Modal
        open={modalEditarSeccionAbierto}
        onClose={() => setModalEditarSeccionAbierto(false)}
      >
        <Box sx={{ ...style, width: 400 }}>
          <Typography variant="h6">Editar Sección</Typography>
          <TextField
            fullWidth
            label="Nombre de la Sección"
            value={nuevoNombreSeccion}
            onChange={(e) => setNuevoNombreSeccion(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Button variant="contained" color="primary" onClick={handleGuardarCambiosSeccion}>
            Guardar Cambios
          </Button>
        </Box>
      </Modal>

      <Modal
        open={modalEditarPreguntaAbierto}
        onClose={() => {
          console.log('🔧 [DEBUG] Cerrando modal editar pregunta');
          setModalEditarPreguntaAbierto(false);
        }}
      >
        <Box sx={{ ...style, width: 400 }}>
          <Typography variant="h6">Editar Pregunta</Typography>
          <TextField
            fullWidth
            label="Texto de la Pregunta"
            value={nuevoTextoPregunta}
            onChange={(e) => setNuevoTextoPregunta(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Button variant="contained" color="primary" onClick={handleGuardarCambiosPregunta}>
            Guardar Cambios
          </Button>
        </Box>
      </Modal>

      <Modal
        open={modalAgregarPreguntaAbierto}
        onClose={() => setModalAgregarPreguntaAbierto(false)}
      >
        <Box sx={{ ...style, width: 400 }}>
          <Typography variant="h6">Agregar Pregunta</Typography>
          <TextField
            fullWidth
            label="Texto de la Pregunta"
            value={nuevaPregunta}
            onChange={(e) => setNuevaPregunta(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Button variant="contained" color="primary" onClick={handleGuardarNuevaPregunta}>
            Agregar Pregunta
          </Button>
        </Box>
      </Modal>
    </div>
  );
};

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
};

export default memo(EditarSeccionYPreguntas);
