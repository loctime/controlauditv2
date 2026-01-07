import React, { useState, useMemo, useCallback, memo } from "react";
import {
  Typography,
  Modal,
  Box,
  TextField,
  Button,
  Chip,
  CircularProgress,
  Card,
  CardContent,
  Divider,
  IconButton,
  Paper,
  Alert
} from "@mui/material";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import EditIcon from "@mui/icons-material/Edit";
import QuestionAnswerIcon from "@mui/icons-material/QuestionAnswer";
import LabelIcon from "@mui/icons-material/Label";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import { useAuth } from '@/components/context/AuthContext';
import { alpha } from "@mui/material/styles";
import { 
  useNormalizarSecciones, 
  useFormularioCache, 
  useFormularioStats 
} from "./hooks/useFormularioCache";
import { useFormularioHandlers } from "./handlers/useFormularioHandlers";
import ModalEditarFormulario from "./components/ModalEditarFormulario";
import ModalEditarSeccion from "./components/ModalEditarSeccion";
import ModalEditarPregunta from "./components/ModalEditarPregunta";
import ModalAgregarPregunta from "./components/ModalAgregarPregunta";
import ModalAgregarSeccion from "./components/ModalAgregarSeccion";

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
  const [modalAgregarSeccionAbierto, setModalAgregarSeccionAbierto] = useState(false);
  const [accordionOpen, setAccordionOpen] = useState(false);
  const [nuevoNombreFormulario, setNuevoNombreFormulario] = useState(formularioSeleccionado?.nombre || '');
  const [nuevoEstado, setNuevoEstado] = useState(formularioSeleccionado?.estado || 'activo');
  const [nuevaVersion, setNuevaVersion] = useState(formularioSeleccionado?.version || '1.0');
  const [nuevoEsPublico, setNuevoEsPublico] = useState(!!formularioSeleccionado?.esPublico);
  const [nuevoNombreSeccion, setNuevoNombreSeccion] = useState('');
  const [nuevoTextoPregunta, setNuevoTextoPregunta] = useState('');
  const [nuevaPregunta, setNuevaPregunta] = useState('');
  const [nuevaSeccion, setNuevaSeccion] = useState('');
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

  // ✅ Actualizar nombre del formulario cuando cambie
  React.useEffect(() => {
    if (formularioSeleccionado?.nombre) {
      setNuevoNombreFormulario(formularioSeleccionado.nombre);
    }
  }, [formularioSeleccionado?.nombre]);

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
    setModalEditarFormularioAbierto(false);
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

  const handleAgregarSeccion = () => {
    handlers.handleAgregarSeccion(nuevaSeccion);
    setModalAgregarSeccionAbierto(false);
    setNuevaSeccion('');
  };

  const handleCloseModalAgregarSeccion = () => {
    setModalAgregarSeccionAbierto(false);
    setNuevaSeccion('');
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
    
    setPreguntaSeleccionada(preguntaData);
    setNuevoTextoPregunta(preguntaData.pregunta);
    setModalEditarPreguntaAbierto(true);
    
    console.log('🔧 [DEBUG] Estados actualizados - preguntaSeleccionada:', preguntaData);
    console.log('🔧 [DEBUG] Estados actualizados - nuevoTextoPregunta:', preguntaData.pregunta);
    console.log('🔧 [DEBUG] Estados actualizados - modalEditarPreguntaAbierto: true');
  }, [puedeEditar]);

  return (
    <Box sx={{ pb: 4 }}>
      {/* Header con estadísticas */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 3, 
          mb: 3,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: 2,
          color: 'white'
        }}
      >
        <Box display="flex" alignItems="center" gap={2} mb={2}>
          <LabelIcon sx={{ fontSize: 32 }} />
          <Box flex={1}>
            <Box display="flex" alignItems="center" gap={1}>
              <Typography variant="h4" fontWeight={700}>
                {formularioSeleccionado.nombre}
              </Typography>
              {puedeEditar && (
                <IconButton
                  size="small"
                  onClick={() => {
                    setNuevoNombreFormulario(formularioSeleccionado.nombre);
                    setModalEditarFormularioAbierto(true);
                  }}
                  aria-label={`Editar nombre del formulario ${formularioSeleccionado.nombre}`}
                  sx={{ 
                    color: 'white',
                    background: 'rgba(255,255,255,0.15)',
                    ml: 1,
                    '&:hover': { 
                      background: 'rgba(255,255,255,0.25)',
                      transform: 'scale(1.1)'
                    },
                    transition: 'all 0.2s ease'
                  }}
                  title="Editar nombre del formulario"
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              )}
            </Box>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Edita el contenido de tu formulario
            </Typography>
          </Box>
      </Box>

        <Box display="flex" gap={2}>
          <Paper 
            sx={{ 
              px: 3, 
              py: 1.5, 
              background: alpha('#fff', 0.2),
              backdropFilter: 'blur(10px)',
              borderRadius: 2
            }}
          >
            <Box display="flex" alignItems="center" gap={1}>
              <LabelIcon />
              <Typography variant="h6" fontWeight={600}>
                {estadisticas.numSecciones}
          </Typography>
              <Typography variant="body2">Sección{estadisticas.numSecciones !== 1 ? 'es' : ''}</Typography>
            </Box>
          </Paper>
          
          <Paper 
            sx={{ 
              px: 3, 
              py: 1.5,
              background: alpha('#fff', 0.2),
              backdropFilter: 'blur(10px)',
              borderRadius: 2
            }}
          >
            <Box display="flex" alignItems="center" gap={1}>
              <QuestionAnswerIcon />
              <Typography variant="h6" fontWeight={600}>
                {estadisticas.numPreguntas}
          </Typography>
              <Typography variant="body2">Pregunta{estadisticas.numPreguntas !== 1 ? 's' : ''}</Typography>
            </Box>
          </Paper>
          </Box>
      </Paper>

      {/* Secciones */}
          {seccionesNormalizadas.length === 0 && (
        <Alert severity="info" sx={{ my: 3 }}>
              <Box display="flex" alignItems="center" gap={2}>
                {!formularioSeleccionado.secciones && <CircularProgress size={20} />}
                <Typography variant="body2">
                  {formularioSeleccionado.secciones ? 
                'Este formulario no tiene secciones definidas. Haz clic en "Agregar Nueva Sección" para comenzar.' : 
                    'Cargando secciones del formulario...'
                  }
                </Typography>
              </Box>
            </Alert>
          )}

          {seccionesNormalizadas.map((seccion, seccionIndex) => (
        <Card 
              key={`${seccion.nombre}-${seccionIndex}`}
          sx={{ 
            mb: 3,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 3,
            overflow: 'hidden',
            transition: 'all 0.3s ease',
            '&:hover': {
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
              borderColor: 'primary.main'
            }
          }}
        >
          <CardContent>
            {/* Header de sección */}
            <Box 
              display="flex" 
              alignItems="center" 
              justifyContent="space-between" 
              mb={2}
              sx={{
                p: 2,
                background: alpha('#667eea', 0.08),
                borderRadius: 2,
                borderLeft: '4px solid #667eea'
              }}
            >
              <Box display="flex" alignItems="center" gap={2} flex={1}>
                <DragIndicatorIcon sx={{ color: 'text.secondary', cursor: 'grab' }} />
                <Typography variant="h6" fontWeight={600} color="primary">
                  {seccion.nombre}
                </Typography>
              </Box>
              
              <Box display="flex" gap={1}>
                {puedeEditar && (
                  <>
                    <IconButton 
                      size="small" 
                      color="primary" 
                      onClick={() => handleEditarSeccion(seccion)}
                      aria-label={`Editar sección ${seccion.nombre}`}
                      sx={{ 
                        background: alpha('#667eea', 0.1),
                        '&:hover': { background: alpha('#667eea', 0.2) }
                      }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<AddCircleOutlineIcon />}
                      onClick={() => handleAbrirModalAgregarPregunta(seccion)}
                      sx={{ 
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)'
                        }
                      }}
                    >
                      Agregar
                    </Button>
                  </>
                )}
                {puedeEliminar && (
                  <IconButton 
                    size="small" 
                    color="error"
                    onClick={() => handleEliminarSeccion(seccion.nombre)}
                    aria-label={`Eliminar sección ${seccion.nombre}`}
                    sx={{ 
                      background: alpha('#d32f2f', 0.1),
                      '&:hover': { background: alpha('#d32f2f', 0.2) }
                    }}
                  >
                    <DeleteForeverIcon fontSize="small" />
                  </IconButton>
                )}
              </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Lista de preguntas */}
            {seccion.preguntas && seccion.preguntas.length > 0 ? (
              <Box>
                <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Preguntas ({seccion.preguntas.length})
                </Typography>
                <Box sx={{ mt: 2 }}>
                  {seccion.preguntas.map((pregunta, preguntaIndex) => (
                    <Paper
                      key={preguntaIndex}
                      elevation={0}
                      sx={{
                        p: 2,
                        mb: 1.5,
                        background: 'grey.50',
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          background: 'grey.100',
                          borderColor: 'primary.main'
                        }
                      }}
                    >
                      <Box display="flex" alignItems="center" gap={2} flex={1}>
                        <QuestionAnswerIcon sx={{ color: 'primary.main' }} />
                        <Typography variant="body1">
                          {pregunta}
                        </Typography>
                      </Box>
                      
                      <Box display="flex" gap={0.5}>
                        {puedeEditar && (
                          <IconButton 
                            size="small"
                            onClick={() => {
                              console.log('🔧 [DEBUG] Click en editar pregunta:', { pregunta, seccionNombre: seccion.nombre, index: preguntaIndex });
                              handleEditarPregunta({ pregunta, seccionNombre: seccion.nombre, index: preguntaIndex });
                            }}
                            aria-label={`Editar pregunta: ${pregunta}`}
                            sx={{ color: 'primary.main' }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        )}
                        {puedeEliminar && (
                          <IconButton 
                            size="small"
                            onClick={() => handleEliminarPregunta(preguntaIndex, seccion.nombre)}
                            aria-label={`Eliminar pregunta: ${pregunta}`}
                            sx={{ color: 'error.main' }}
                          >
                            <DeleteForeverIcon fontSize="small" />
                          </IconButton>
                        )}
                      </Box>
                    </Paper>
                  ))}
                </Box>
              </Box>
            ) : (
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  No hay preguntas en esta sección. Haz clic en "Agregar" para crear una.
                </Typography>
              </Alert>
            )}
          </CardContent>
        </Card>
      ))}

      {/* Botón para agregar sección */}
      {puedeEditar && (
        <Paper 
          elevation={0}
          sx={{
            mt: 3,
            p: 3,
            background: alpha('#667eea', 0.05),
            border: '2px dashed',
            borderColor: 'primary.main',
            borderRadius: 2,
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            '&:hover': {
              background: alpha('#667eea', 0.1),
              borderColor: 'primary.dark'
            }
          }}
          onClick={() => setModalAgregarSeccionAbierto(true)}
        >
          <Box display="flex" alignItems="center" justifyContent="center" gap={2}>
            <AddCircleOutlineIcon sx={{ fontSize: 40, color: 'primary.main' }} />
            <Box>
              <Typography variant="h6" fontWeight={700} color="primary">
                Agregar Nueva Sección
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Crea una nueva sección para organizar tus preguntas
              </Typography>
            </Box>
          </Box>
        </Paper>
      )}

      {/* Botón para eliminar el formulario */}
      {puedeEliminar && (
        <Paper
          elevation={0}
          sx={{
            mt: 4,
            p: 3,
            background: alpha('#d32f2f', 0.08),
            border: '1px dashed',
            borderColor: 'error.main',
            borderRadius: 2,
            textAlign: 'center'
          }}
        >
          <Typography variant="body2" color="text.secondary" mb={2}>
            Si ya no necesitas este formulario, puedes eliminarlo permanentemente
          </Typography>
        <Button
            variant="outlined"
          color="error"
          onClick={() => handleEliminarFormulario(formularioSeleccionado.id)}
            startIcon={<DeleteForeverIcon />}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              px: 3,
              borderWidth: 2,
              '&:hover': {
                borderWidth: 2
              }
            }}
        >
          Eliminar Formulario
        </Button>
        </Paper>
      )}

      {/* Modales de edición de secciones y preguntas */}
      <ModalEditarFormulario
        open={modalEditarFormularioAbierto}
        onClose={() => setModalEditarFormularioAbierto(false)}
        nombreFormulario={nuevoNombreFormulario}
        onNombreChange={setNuevoNombreFormulario}
        onGuardar={handleGuardarCambiosFormulario}
      />

      <ModalEditarSeccion
        open={modalEditarSeccionAbierto}
        onClose={() => setModalEditarSeccionAbierto(false)}
        nombreSeccion={nuevoNombreSeccion}
        onNombreChange={setNuevoNombreSeccion}
        onGuardar={handleGuardarCambiosSeccion}
      />

      <ModalEditarPregunta
        open={modalEditarPreguntaAbierto}
        onClose={() => setModalEditarPreguntaAbierto(false)}
        textoPregunta={nuevoTextoPregunta}
        onTextoChange={setNuevoTextoPregunta}
        onGuardar={handleGuardarCambiosPregunta}
      />

      <ModalAgregarPregunta
        open={modalAgregarPreguntaAbierto}
        onClose={() => setModalAgregarPreguntaAbierto(false)}
        nuevaPregunta={nuevaPregunta}
        onNuevaPreguntaChange={setNuevaPregunta}
        onGuardar={handleGuardarNuevaPregunta}
      />

      <ModalAgregarSeccion
        open={modalAgregarSeccionAbierto}
        onClose={handleCloseModalAgregarSeccion}
        nuevaSeccion={nuevaSeccion}
        onNuevaSeccionChange={setNuevaSeccion}
        onGuardar={handleAgregarSeccion}
      />
    </Box>
  );
};

export default memo(EditarSeccionYPreguntas);
