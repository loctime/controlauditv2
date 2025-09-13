import React, { useState, useMemo, useCallback, memo } from "react";
import {
  Typography,
  Modal,
  Box,
  TextField,
  Button,
  Alert,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CircularProgress
} from "@mui/material";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import { useAuth } from "../../context/AuthContext";
import SeccionItem from "./components/SeccionItem";
import FormularioInfo from "./components/FormularioInfo";
import { 
  useNormalizarSecciones, 
  useFormularioCache, 
  useFormularioStats 
} from "./hooks/useFormularioCache";
import { useFormularioHandlers } from "./handlers/useFormularioHandlers";

const ESTADOS = [
  { value: 'activo', label: 'Activo' },
  { value: 'inactivo', label: 'Inactivo' },
  { value: 'borrador', label: 'Borrador' }
];

const EditarSeccionYPreguntas = ({ 
  formularioSeleccionado, 
  setFormularioSeleccionado,
  puedeEditar = true,
  puedeEliminar = true 
}) => {
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

  // ✅ Hooks personalizados
  const normalizarSecciones = useNormalizarSecciones();
  const seccionesNormalizadas = useMemo(() => {
    return normalizarSecciones(formularioSeleccionado?.secciones);
  }, [formularioSeleccionado?.secciones, normalizarSecciones]);
  
  const { cacheFormulario, recuperarFormularioCache } = useFormularioCache(formularioSeleccionado, seccionesNormalizadas);
  const estadisticas = useFormularioStats(seccionesNormalizadas);

  // ✅ Handlers del formulario
  const handlers = useFormularioHandlers({
    formularioSeleccionado,
    setFormularioSeleccionado,
    seccionesNormalizadas,
    puedeEditar,
    puedeEliminar,
    user
  });

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

  // ✅ Handlers locales simplificados
  const handleGuardarCambiosFormulario = () => {
    handlers.handleGuardarCambiosFormulario(
      nuevoNombreFormulario,
      nuevoEstado,
      nuevaVersion,
      nuevoEsPublico,
      setAccordionOpen
    );
  };

  const handleGuardarCambiosSeccion = () => {
    handlers.handleGuardarCambiosSeccion(
      seccionSeleccionada,
      nuevoNombreSeccion,
      setModalEditarSeccionAbierto
    );
  };

  const handleGuardarCambiosPregunta = () => {
    handlers.handleGuardarCambiosPregunta(
      preguntaSeleccionada,
      nuevoTextoPregunta,
      setModalEditarPreguntaAbierto
    );
  };

  const handleGuardarNuevaPregunta = () => {
    handlers.handleGuardarNuevaPregunta(
      seccionSeleccionada,
      nuevaPregunta,
      setModalAgregarPreguntaAbierto,
      setNuevaPregunta
    );
  };

  const handleEliminarFormulario = (id) => {
    handlers.handleEliminarFormulario(id);
  };

  const handleEliminarSeccion = (nombreSeccion) => {
    handlers.handleEliminarSeccion(nombreSeccion);
  };

  const handleEliminarPregunta = (indexPregunta, nombreSeccion) => {
    handlers.handleEliminarPregunta(indexPregunta, nombreSeccion);
  };

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
