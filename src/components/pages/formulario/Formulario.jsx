import React, { useState } from "react";
import { Button, TextField, Typography, Box } from "@mui/material";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import { useAuth } from "../../context/AuthContext";
import Swal from 'sweetalert2';

const Formulario = () => {
  const { user, userProfile } = useAuth();
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
    
    if (!user) {
      Swal.fire("Error", "Debe iniciar sesión para crear formularios.", "error");
      return;
    }

    try {
      const formularioData = {
        nombre: nombreFormulario,
        secciones: secciones.map((seccion) => ({
          nombre: seccion.nombre,
          preguntas: seccion.preguntas.split("\n").map((pregunta) => pregunta.trim()).filter(Boolean),
        })),
        timestamp: Timestamp.now(),
        // ✅ Campos de creador y permisos
        creadorId: user.uid,
        creadorEmail: user.email,
        creadorNombre: user.displayName || user.email,
        esPublico: false, // Por defecto privado
        permisos: {
          puedeEditar: [user.uid], // Solo el creador puede editar
          puedeVer: [user.uid], // Solo el creador puede ver
          puedeEliminar: [user.uid] // Solo el creador puede eliminar
        },
        // ✅ Metadatos adicionales
        version: "1.0",
        estado: "activo",
        ultimaModificacion: Timestamp.now()
      };
      
      const docRef = await addDoc(collection(db, "formularios"), formularioData);
      console.log("Formulario creado con ID: ", docRef.id);
      
      Swal.fire("Éxito", "Formulario creado exitosamente.", "success");
      
      // Limpiar formulario
      setNombreFormulario("");
      setSecciones([{ nombre: "", preguntas: "" }]);
    } catch (error) {
      console.error("Error al crear el formulario: ", error);
      Swal.fire("Error", "Error al crear el formulario.", "error");
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Crear Nuevo Formulario
        Las preguntas se deben ingresar una debajo de otra por cada sección 
      </Typography>
      
      {/* ✅ Información del creador */}
      {user && (
        <Box mb={2} p={2} bgcolor="primary.light" borderRadius={1}>
          <Typography variant="body2" color="white">
            <strong>Creador:</strong> {user.displayName || user.email}
          </Typography>
          <Typography variant="body2" color="white">
            <strong>Rol:</strong> {userProfile?.role || 'Usuario'}
          </Typography>
        </Box>
      )}
      
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
