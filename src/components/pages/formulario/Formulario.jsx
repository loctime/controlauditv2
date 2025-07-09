import React, { useState } from "react";
import { Button, TextField, Typography, Box } from "@mui/material";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { db } from "../../../firebaseConfig";

const Formulario = () => {
  const [nombreFormulario, setNombreFormulario] = useState("");
  const [secciones, setSecciones] = useState([{ nombre: "", preguntas: "" }]);

  const handleChangeNombre = (event) => {
    setNombreFormulario(event.target.value);
  };

  const handleChangeSeccionNombre = (index, event) => {
    const nuevasSecciones = [...secciones];
    nuevasSecciones[index].nombre = event.target.value;
    setSecciones(nuevasSecciones);
  };

  const handleChangePreguntas = (index, event) => {
    const nuevasSecciones = [...secciones];
    nuevasSecciones[index].preguntas = event.target.value;
    setSecciones(nuevasSecciones);
  };

  const handleAgregarSeccion = () => {
    setSecciones([...secciones, { nombre: "", preguntas: "" }]);
  };

  const handleEliminarSeccion = (index) => {
    const nuevasSecciones = [...secciones];
    nuevasSecciones.splice(index, 1);
    setSecciones(nuevasSecciones);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const formularioData = {
        nombre: nombreFormulario,
        secciones: secciones.map((seccion) => ({
          nombre: seccion.nombre,
          preguntas: seccion.preguntas.split("\n").map((pregunta) => pregunta.trim()).filter(Boolean),
        })),
        timestamp: Timestamp.now(),
      };
      const docRef = await addDoc(collection(db, "formularios"), formularioData);
      console.log("Formulario creado con ID: ", docRef.id);
      setNombreFormulario("");
      setSecciones([{ nombre: "", preguntas: "" }]);
    } catch (error) {
      console.error("Error al crear el formulario: ", error);
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Crear Nuevo Formulario
        Las pregutas de deberan ingresar una debajo de otra por cada seccion 
      </Typography>
      <form onSubmit={handleSubmit}>
        <TextField
          required
          id="nombreFormulario"
          name="nombreFormulario"
          label="Nombre del Formulario"
          fullWidth
          value={nombreFormulario}
          onChange={handleChangeNombre}
        />
        {secciones.map((seccion, index) => (
          <Box key={index} mt={2}>
            <Typography variant="subtitle1">Sección {index + 1}</Typography>
            <TextField
              required
              id={`nombreSeccion${index}`}
              name={`nombreSeccion${index}`}
              label="Nombre de la Sección"
              fullWidth
              value={seccion.nombre}
              onChange={(event) => handleChangeSeccionNombre(index, event)}
            />
            <TextField
              required
              id={`preguntas${index}`}
              name={`preguntas${index}`}
              label="Preguntas (Ingrese una por línea)"
              multiline
              fullWidth
              rows={5}
              value={seccion.preguntas}
              onChange={(event) => handleChangePreguntas(index, event)}
            />
            <Button variant="contained" color="error" onClick={() => handleEliminarSeccion(index)}>
              Eliminar Sección
            </Button>
          </Box>
        ))}
        <Button variant="contained" color="primary" onClick={handleAgregarSeccion}>
          Agregar Sección
        </Button>
        <Button type="submit" variant="contained" color="primary">
          Cargar Formulario a la Base de Datos
        </Button>
      </form>
    </Box>
  );
};

export default Formulario;
