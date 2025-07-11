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
            <Chip label={`Secciones: ${Object.keys(formularioSeleccionado.secciones).length}`} size="small" />
            <Chip label={`Preguntas: ${Object.values(formularioSeleccionado.secciones).reduce((acc, s) => acc + (s.preguntas?.length || 0), 0)}`} size="small" />
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          {/* Aquí va TODO el contenido editable: secciones y preguntas */}
          {Object.values(formularioSeleccionado.secciones).map((seccion, seccionIndex) => (
            <Box key={seccionIndex} mb={3}>
              <Typography variant="h5">{seccion.nombre}</Typography>
              <Box display="flex" gap={1} mb={2}>
                {puedeEditar && (
                  <IconButton 
                    onClick={() => {
                      setSeccionSeleccionada(seccion);
                      setNuevoNombreSeccion(seccion.nombre);
                      setModalEditarSeccionAbierto(true);
                    }}
                    color="primary"
                    size="small"
                  >
                    <EditIcon />
                  </IconButton>
                )}
                {puedeEliminar && (
                  <IconButton 
                    onClick={() => handleEliminarSeccion(seccion.nombre)}
                    color="error"
                    size="small"
                  >
                    <DeleteForeverIcon />
                  </IconButton>
                )}
                {puedeEditar && (
                  <IconButton 
                    onClick={() => {
                      setSeccionSeleccionada(seccion);
                      setModalAgregarPreguntaAbierto(true);
                    }}
                    color="primary"
                    size="small"
                  >
                    <AddIcon />
                  </IconButton>
                )}
              </Box>
              <TableContainer component={Paper}>
                <Table sx={{ minWidth: 650 }} aria-label="simple table">
                  <TableHead>
                    <TableRow>
                      <TableCell align="left">Pregunta</TableCell>
                      {puedeEditar || puedeEliminar ? (
                        <TableCell align="left">Acciones</TableCell>
                      ) : null}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {seccion.preguntas && seccion.preguntas.map((pregunta, preguntaIndex) => (
                      <TableRow key={preguntaIndex} sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
                        <TableCell align="left">{pregunta}</TableCell>
                        {(puedeEditar || puedeEliminar) && (
                          <TableCell align="left">
                            {puedeEditar && (
                              <IconButton 
                                onClick={() => {
                                  setPreguntaSeleccionada({ pregunta, seccionNombre: seccion.nombre, index: preguntaIndex });
                                  setNuevoTextoPregunta(pregunta);
                                  setModalEditarPreguntaAbierto(true);
                                }}
                                color="primary"
                                size="small"
                              >
                                <EditIcon />
                              </IconButton>
                            )}
                            {puedeEliminar && (
                              <IconButton 
                                onClick={() => handleEliminarPregunta(preguntaIndex, seccion.nombre)}
                                color="error"
                                size="small"
                              >
                                <DeleteForeverIcon />
                              </IconButton>
                            )}
                          </TableCell>
                        )}
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
