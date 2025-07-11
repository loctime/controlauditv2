import React, { useState } from "react";
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
  FormControl
} from "@mui/material";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import EditIcon from "@mui/icons-material/Edit";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import AddIcon from "@mui/icons-material/Add";
import { doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import Swal from 'sweetalert2';
import Tooltip from '@mui/material/Tooltip';
import clsx from 'clsx';

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
  const [modalEditarFormularioAbierto, setModalEditarFormularioAbierto] = useState(false);
  const [modalEditarSeccionAbierto, setModalEditarSeccionAbierto] = useState(false);
  const [modalEditarPreguntaAbierto, setModalEditarPreguntaAbierto] = useState(false);
  const [modalAgregarPreguntaAbierto, setModalAgregarPreguntaAbierto] = useState(false);
  const [accordionOpen, setAccordionOpen] = useState(false);
  const [nuevoNombreFormulario, setNuevoNombreFormulario] = useState(formularioSeleccionado.nombre || '');
  const [nuevoEstado, setNuevoEstado] = useState(formularioSeleccionado.estado || 'activo');
  const [nuevaVersion, setNuevaVersion] = useState(formularioSeleccionado.version || '1.0');
  const [nuevoEsPublico, setNuevoEsPublico] = useState(!!formularioSeleccionado.esPublico);
  const [nuevoNombreSeccion, setNuevoNombreSeccion] = useState('');
  const [nuevoTextoPregunta, setNuevoTextoPregunta] = useState('');
  const [nuevaPregunta, setNuevaPregunta] = useState('');
  const [seccionSeleccionada, setSeccionSeleccionada] = useState(null);
  const [preguntaSeleccionada, setPreguntaSeleccionada] = useState(null);

  const handleGuardarCambiosFormulario = async () => {
    if (!puedeEditar) {
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
  };

  const handleGuardarCambiosSeccion = async () => {
    if (!puedeEditar) {
      Swal.fire("Error", "No tienes permisos para editar este formulario.", "error");
      return;
    }

    try {
      if (!seccionSeleccionada) {
        Swal.fire("Error", "No se ha seleccionado ninguna sección.", "error");
        return;
      }
      const seccionIndex = Object.keys(formularioSeleccionado.secciones).find(key => formularioSeleccionado.secciones[key].nombre === seccionSeleccionada.nombre);
      const seccionesActualizadas = { ...formularioSeleccionado.secciones, [seccionIndex]: { ...formularioSeleccionado.secciones[seccionIndex], nombre: nuevoNombreSeccion } };
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
  };

  const handleGuardarCambiosPregunta = async () => {
    if (!puedeEditar) {
      Swal.fire("Error", "No tienes permisos para editar este formulario.", "error");
      return;
    }

    try {
      if (!preguntaSeleccionada) {
        Swal.fire("Error", "No se ha seleccionado ninguna pregunta.", "error");
        return;
      }
      const seccionIndex = Object.keys(formularioSeleccionado.secciones).find(key => formularioSeleccionado.secciones[key].nombre === preguntaSeleccionada.seccionNombre);
      const preguntasActualizadas = formularioSeleccionado.secciones[seccionIndex].preguntas.map((pregunta, index) => index === preguntaSeleccionada.index ? nuevoTextoPregunta : pregunta);
      const formularioRef = doc(db, "formularios", formularioSeleccionado.id);
      await updateDoc(formularioRef, { 
        [`secciones.${seccionIndex}.preguntas`]: preguntasActualizadas,
        ultimaModificacion: new Date()
      });
      setFormularioSeleccionado(prev => ({
        ...prev,
        secciones: {
          ...prev.secciones,
          [seccionIndex]: {
            ...prev.secciones[seccionIndex],
            preguntas: preguntasActualizadas,
          },
        },
      }));
      setModalEditarPreguntaAbierto(false);
      Swal.fire("Éxito", "Pregunta actualizada exitosamente.", "success");
    } catch (error) {
      console.error("Error al actualizar pregunta:", error);
      Swal.fire("Error", "Error al actualizar la pregunta.", "error");
    }
  };

  const handleAgregarPregunta = async () => {
    if (!puedeEditar) {
      Swal.fire("Error", "No tienes permisos para editar este formulario.", "error");
      return;
    }

    try {
      if (!seccionSeleccionada) {
        Swal.fire("Error", "Sección no proporcionada.", "error");
        return;
      }
      const seccionIndex = Object.keys(formularioSeleccionado.secciones).find(key => formularioSeleccionado.secciones[key].nombre === seccionSeleccionada.nombre);
      const preguntasActualizadas = [...formularioSeleccionado.secciones[seccionIndex].preguntas, nuevaPregunta];
      const formularioRef = doc(db, "formularios", formularioSeleccionado.id);
      await updateDoc(formularioRef, { 
        [`secciones.${seccionIndex}.preguntas`]: preguntasActualizadas,
        ultimaModificacion: new Date()
      });
      setFormularioSeleccionado(prev => ({
        ...prev,
        secciones: {
          ...prev.secciones,
          [seccionIndex]: {
            ...prev.secciones[seccionIndex],
            preguntas: preguntasActualizadas,
          },
        },
      }));
      setModalAgregarPreguntaAbierto(false);
      Swal.fire("Éxito", "Pregunta agregada exitosamente.", "success");
    } catch (error) {
      console.error("Error al agregar pregunta:", error);
      Swal.fire("Error", "Error al agregar pregunta.", "error");
    }
  };

  const handleEliminarFormulario = async (id) => {
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
        Swal.fire("Eliminado", "Formulario eliminado exitosamente.", "success");
      } catch (error) {
        console.error("Error al eliminar formulario:", error);
        Swal.fire("Error", "Error al eliminar el formulario.", "error");
      }
    }
  };

  const handleEliminarSeccion = async (nombreSeccion) => {
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
        const seccionIndex = Object.keys(formularioSeleccionado.secciones).find(key => formularioSeleccionado.secciones[key].nombre === nombreSeccion);
        const { [seccionIndex]: _, ...seccionesActualizadas } = formularioSeleccionado.secciones;
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
  };

  const handleEliminarPregunta = async (indexPregunta, nombreSeccion) => {
    if (!puedeEliminar) {
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
        const seccionIndex = Object.keys(formularioSeleccionado.secciones).find(key => formularioSeleccionado.secciones[key].nombre === nombreSeccion);
        const preguntasActualizadas = formularioSeleccionado.secciones[seccionIndex].preguntas.filter((_, idx) => idx !== indexPregunta);
        const formularioRef = doc(db, "formularios", formularioSeleccionado.id);
        await updateDoc(formularioRef, { 
          [`secciones.${seccionIndex}.preguntas`]: preguntasActualizadas,
          ultimaModificacion: new Date()
        });
        setFormularioSeleccionado(prev => ({
          ...prev,
          secciones: {
            ...prev.secciones,
            [seccionIndex]: {
              ...prev.secciones[seccionIndex],
              preguntas: preguntasActualizadas,
            },
          },
        }));
        Swal.fire("Eliminado", "Pregunta eliminada exitosamente.", "success");
      } catch (error) {
        console.error("Error al eliminar pregunta:", error);
        Swal.fire("Error", "Error al eliminar la pregunta.", "error");
      }
    }
  };

  const seccionesObj = formularioSeleccionado.secciones && typeof formularioSeleccionado.secciones === 'object'
    ? formularioSeleccionado.secciones
    : {};
  const seccionesArr = Object.values(seccionesObj);
  const numSecciones = Object.keys(seccionesObj).length;
  const numPreguntas = seccionesArr.reduce((acc, s) => acc + (s.preguntas?.length || 0), 0);

  return (
    <div>
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
      <Box mb={2} p={2} bgcolor="grey.100" borderRadius={1}>
        <Typography variant="h6" gutterBottom>
          {formularioSeleccionado.nombre}
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
          {formularioSeleccionado.esPublico && (
            <Chip label="Público" color="primary" size="small" />
          )}
        </Box>
        {/* Metadatos solo info */}
        <Box mt={1}>
          <Typography variant="caption" color="text.secondary">
            <strong>Creado por:</strong> {formularioSeleccionado.creadorNombre || formularioSeleccionado.creadorEmail || 'Desconocido'}<br/>
            <strong>Fecha de creación:</strong> {formularioSeleccionado.timestamp?.toDate?.()?.toLocaleString?.() || 'No disponible'}<br/>
            <strong>Última modificación:</strong> {formularioSeleccionado.ultimaModificacion?.toLocaleString?.() || 'No disponible'}
          </Typography>
        </Box>
      </Box>

      {/* Accordion para edición de secciones y preguntas */}
      <Accordion expanded={accordionOpen} onChange={() => setAccordionOpen(!accordionOpen)} sx={{ mb: 2 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle1" fontWeight={600}>
            Editar contenido del formulario
          </Typography>
          <Box ml={2} display="flex" gap={2} alignItems="center">
            <Chip label={`Secciones: ${numSecciones}`} size="small" />
            <Chip label={`Preguntas: ${numPreguntas}`} size="small" />
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          {seccionesArr.length === 0 && (
            <Alert severity="info" sx={{ my: 2 }}>
              Este formulario no tiene secciones o aún se está cargando.
            </Alert>
          )}
          {seccionesArr.map((seccion, seccionIndex) => (
            <Box key={seccionIndex} mb={2} p={2} bgcolor="#fafbfc" borderRadius={2} boxShadow={0}>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                <Typography variant="subtitle1" fontWeight={500} sx={{ mb: 0 }}>
                  {seccion.nombre}
                </Typography>
                <Box display="flex" flexDirection="column" alignItems="flex-end" gap={0.5}>
                  <Tooltip title="Editar sección" arrow>
                    <span>
                      <IconButton size="small" color="primary" onClick={() => { setSeccionSeleccionada(seccion); setNuevoNombreSeccion(seccion.nombre); setModalEditarSeccionAbierto(true); }} sx={{ opacity: 0.7, ':hover': { opacity: 1 } }}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title="Eliminar sección" arrow>
                    <span>
                      <IconButton size="small" color="error" onClick={() => handleEliminarSeccion(seccion.nombre)} sx={{ opacity: 0.7, ':hover': { opacity: 1 } }}>
                        <DeleteForeverIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title="Agregar pregunta" arrow>
                    <span>
                      <IconButton size="small" color="primary" onClick={() => { setSeccionSeleccionada(seccion); setModalAgregarPreguntaAbierto(true); }} sx={{ opacity: 0.7, ':hover': { opacity: 1 } }}>
                        <AddIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
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
                            <Tooltip title="Editar pregunta" arrow>
                              <span>
                                <IconButton size="small" color="primary" onClick={() => { setPreguntaSeleccionada({ pregunta, seccionNombre: seccion.nombre, index: preguntaIndex }); setNuevoTextoPregunta(pregunta); setModalEditarPreguntaAbierto(true); }} sx={{ opacity: 0.7, ':hover': { opacity: 1 } }}>
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>
                            <Tooltip title="Eliminar pregunta" arrow>
                              <span>
                                <IconButton size="small" color="error" onClick={() => handleEliminarPregunta(preguntaIndex, seccion.nombre)} sx={{ opacity: 0.7, ':hover': { opacity: 1 } }}>
                                  <DeleteForeverIcon fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
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

      {/* Modales de edición de secciones y preguntas ... (sin cambios) */}
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
        onClose={() => setModalEditarPreguntaAbierto(false)}
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
          <Button variant="contained" color="primary" onClick={handleAgregarPregunta}>
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

export default EditarSeccionYPreguntas;
