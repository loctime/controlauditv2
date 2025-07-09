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
  Button
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import AddIcon from "@mui/icons-material/Add";
import { doc, updateDoc, deleteField, deleteDoc } from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import Swal from 'sweetalert2';
const EditarSeccionYPreguntas = ({ formularioSeleccionado, setFormularioSeleccionado }) => {
  const [modalEditarFormularioAbierto, setModalEditarFormularioAbierto] = useState(false);
  const [modalEditarSeccionAbierto, setModalEditarSeccionAbierto] = useState(false);
  const [modalEditarPreguntaAbierto, setModalEditarPreguntaAbierto] = useState(false);
  const [modalAgregarPreguntaAbierto, setModalAgregarPreguntaAbierto] = useState(false);
  const [nuevoNombreFormulario, setNuevoNombreFormulario] = useState('');
  const [nuevoNombreSeccion, setNuevoNombreSeccion] = useState('');
  const [nuevoTextoPregunta, setNuevoTextoPregunta] = useState('');
  const [nuevaPregunta, setNuevaPregunta] = useState('');
  const [seccionSeleccionada, setSeccionSeleccionada] = useState(null);
  const [preguntaSeleccionada, setPreguntaSeleccionada] = useState(null);

  const handleGuardarCambiosFormulario = async () => {
    try {
      const formularioRef = doc(db, "formularios", formularioSeleccionado.id);
      await updateDoc(formularioRef, { nombre: nuevoNombreFormulario });
      setFormularioSeleccionado(prev => ({ ...prev, nombre: nuevoNombreFormulario }));
      setModalEditarFormularioAbierto(false);
      Swal.fire("Éxito", "Formulario actualizado exitosamente.", "success");
    } catch (error) {
      Swal.fire("Error", "Error al actualizar el formulario.", "error");
    }
  };

  const handleGuardarCambiosSeccion = async () => {
    try {
      if (!seccionSeleccionada) {
        Swal.fire("Error", "No se ha seleccionado ninguna sección.", "error");
        return;
      }
      const seccionIndex = Object.keys(formularioSeleccionado.secciones).find(key => formularioSeleccionado.secciones[key].nombre === seccionSeleccionada.nombre);
      const seccionesActualizadas = { ...formularioSeleccionado.secciones, [seccionIndex]: { ...formularioSeleccionado.secciones[seccionIndex], nombre: nuevoNombreSeccion } };
      const formularioRef = doc(db, "formularios", formularioSeleccionado.id);
      await updateDoc(formularioRef, { secciones: seccionesActualizadas });
      setFormularioSeleccionado(prev => ({ ...prev, secciones: seccionesActualizadas }));
      setModalEditarSeccionAbierto(false);
      Swal.fire("Éxito", "Sección actualizada exitosamente.", "success");
    } catch (error) {
      Swal.fire("Error", "Error al actualizar la sección.", "error");
    }
  };

  const handleGuardarCambiosPregunta = async () => {
    try {
      if (!preguntaSeleccionada) {
        Swal.fire("Error", "No se ha seleccionado ninguna pregunta.", "error");
        return;
      }
      const seccionIndex = Object.keys(formularioSeleccionado.secciones).find(key => formularioSeleccionado.secciones[key].nombre === preguntaSeleccionada.seccionNombre);
      const preguntasActualizadas = formularioSeleccionado.secciones[seccionIndex].preguntas.map((pregunta, index) => index === preguntaSeleccionada.index ? nuevoTextoPregunta : pregunta);
      const formularioRef = doc(db, "formularios", formularioSeleccionado.id);
      await updateDoc(formularioRef, { [`secciones.${seccionIndex}.preguntas`]: preguntasActualizadas });
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
      Swal.fire("Error", "Error al actualizar la pregunta.", "error");
    }
  };

  const handleAgregarPregunta = async () => {
    try {
      if (!seccionSeleccionada) {
        Swal.fire("Error", "Sección no proporcionada.", "error");
        return;
      }
      const seccionIndex = Object.keys(formularioSeleccionado.secciones).find(key => formularioSeleccionado.secciones[key].nombre === seccionSeleccionada.nombre);
      const preguntasActualizadas = [...formularioSeleccionado.secciones[seccionIndex].preguntas, nuevaPregunta];
      const formularioRef = doc(db, "formularios", formularioSeleccionado.id);
      await updateDoc(formularioRef, { [`secciones.${seccionIndex}.preguntas`]: preguntasActualizadas });
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
      Swal.fire("Error", "Error al agregar pregunta.", "error");
    }
  };

  const handleEliminarFormulario = async (id) => {
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
        Swal.fire("Error", "Error al eliminar el formulario.", "error");
      }
    }
  };

  const handleEliminarSeccion = async (nombreSeccion) => {
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
        await updateDoc(formularioRef, { secciones: seccionesActualizadas });
        setFormularioSeleccionado(prev => ({ ...prev, secciones: seccionesActualizadas }));
        Swal.fire("Eliminado", "Sección eliminada exitosamente.", "success");
      } catch (error) {
        Swal.fire("Error", "Error al eliminar la sección.", "error");
      }
    }
  };

  const handleEliminarPregunta = async (indexPregunta, nombreSeccion) => {
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
        await updateDoc(formularioRef, { [`secciones.${seccionIndex}.preguntas`]: preguntasActualizadas });
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
        Swal.fire("Error", "Error al eliminar la pregunta.", "error");
      }
    }
  };

  return (
    <div>
      {/* Sección para editar el formulario */}
      <Button onClick={() => setModalEditarFormularioAbierto(true)}>
        Editar Formulario
      </Button>

      {/* Botón para eliminar el formulario */}
      <Button
        variant="contained"
        color="error"
        onClick={() => handleEliminarFormulario(formularioSeleccionado.id)}
      >
        Eliminar Formulario
        <DeleteForeverIcon />
      </Button>

      <Typography variant="h4">{formularioSeleccionado.nombre}</Typography>
      
      {/* Aquí puedes añadir más secciones y preguntas */}
      {Object.values(formularioSeleccionado.secciones).map((seccion, seccionIndex) => (
        <div key={seccionIndex}>
          <Typography variant="h5">{seccion.nombre}</Typography>
          <IconButton onClick={() => {
            setSeccionSeleccionada(seccion);
            setNuevoNombreSeccion(seccion.nombre);
            setModalEditarSeccionAbierto(true);
          }}>
            <EditIcon color="primary" />
          </IconButton>
          <IconButton onClick={() => handleEliminarSeccion(seccion.nombre)}>
            <DeleteForeverIcon color="error" />
          </IconButton>
          <IconButton onClick={() => {
            setSeccionSeleccionada(seccion);
            setModalAgregarPreguntaAbierto(true);
          }}>
            <AddIcon color="primary" />
          </IconButton>
          <TableContainer component={Paper}>
            <Table sx={{ minWidth: 650 }} aria-label="simple table">
              <TableHead>
                <TableRow>
                  <TableCell align="left">Pregunta</TableCell>
                  <TableCell align="left">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {seccion.preguntas && seccion.preguntas.map((pregunta, preguntaIndex) => (
                  <TableRow key={preguntaIndex} sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
                    <TableCell align="left">{pregunta}</TableCell>
                    <TableCell align="left">
                      <IconButton onClick={() => {
                        setPreguntaSeleccionada({ pregunta, seccionNombre: seccion.nombre, index: preguntaIndex });
                        setNuevoTextoPregunta(pregunta);
                        setModalEditarPreguntaAbierto(true);
                      }}>
                        <EditIcon color="primary" />
                      </IconButton>
                      <IconButton onClick={() => handleEliminarPregunta(preguntaIndex, seccion.nombre)}>
                        <DeleteForeverIcon color="error" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </div>
      ))}

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
