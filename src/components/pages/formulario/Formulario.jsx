import React, { useState } from "react";
import { Button, TextField, Typography, Box } from "@mui/material";
import { ArrowBack } from "@mui/icons-material";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import { useAuth } from "../../context/AuthContext";
import Swal from 'sweetalert2';
import { useNavigate } from "react-router-dom";
import PublicIcon from '@mui/icons-material/Public';

const Formulario = () => {
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();
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
        // ✅ Campos de creador y permisos multi-tenant
        creadorId: user.uid,
        creadorEmail: user.email,
        creadorNombre: user.displayName || user.email,
        // ✅ Cliente administrador responsable
        clienteAdminId: userProfile?.clienteAdminId || user.uid, // Si no tiene cliente admin, es su propio admin
        esPublico: false, // Por defecto privado
        permisos: {
          puedeEditar: [user.uid], // Solo el creador puede editar inicialmente
          puedeVer: [user.uid], // Solo el creador puede ver inicialmente
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
      {/* Botón para galería de formularios públicos */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button
          variant="outlined"
          startIcon={<PublicIcon />}
          onClick={() => {
            console.debug('[Formulario] Ir a galería de formularios públicos');
            navigate('/formularios-publicos');
          }}
          sx={{ borderRadius: '20px', px: 3, py: 1 }}
        >
          Ver Galería de Formularios Públicos
        </Button>
      </Box>
      {/* Botón Volver */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={() => navigate('/editar')}
          sx={{ 
            borderRadius: '20px',
            px: 3,
            py: 1
          }}
        >
          Volver a Formularios
        </Button>
        <Typography variant="h5" sx={{ flex: 1 }}>
          Crear Nuevo Formulario
        </Typography>
      </Box>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Las preguntas se deben ingresar una debajo de otra por cada sección
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
