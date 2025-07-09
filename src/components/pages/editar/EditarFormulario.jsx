import React, { useState, useEffect, useCallback } from "react";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import { FormControl, InputLabel, Select, MenuItem, Typography } from "@mui/material";
import EditarSeccionYPreguntas from "./EditarSeccionYPreguntas";

const EditarFormulario = () => {
  const [formularios, setFormularios] = useState([]);
  const [formularioSeleccionado, setFormularioSeleccionado] = useState(null);
  const [reload, setReload] = useState(false);

  const obtenerFormularios = useCallback(async () => {
    try {
      const formulariosCollection = collection(db, "formularios");
      const res = await getDocs(formulariosCollection);
      const newArr = res.docs.map((formulario) => ({
        ...formulario.data(),
        id: formulario.id
      }));
      setFormularios(newArr);

      // Seleccionar el formulario primero si no hay uno seleccionado
      if (!formularioSeleccionado) {
        setFormularioSeleccionado(newArr.length > 0 ? newArr[0] : null);
      }
    } catch (error) {
      console.error("Error al obtener formularios:", error);
    }
  }, [formularioSeleccionado]);

  useEffect(() => {
    obtenerFormularios();
  }, [obtenerFormularios, reload]);

  const handleChangeFormulario = async (event) => {
    const formularioId = event.target.value;
    if (formularioId) {
      const formularioDoc = await getDoc(doc(db, "formularios", formularioId));
      const formularioData = formularioDoc.data();
      setFormularioSeleccionado({ ...formularioData, id: formularioId });
    }
  };

  const handleReload = () => {
    setReload((prev) => !prev);
  };

  return (
    <div>
      <Typography variant="h4">Selecciona un formulario para editar</Typography>
      <FormControl fullWidth variant="outlined" margin="normal">
        <InputLabel id="select-formulario-label">Formulario</InputLabel>
        <Select
          labelId="select-formulario-label"
          id="select-formulario"
          value={formularioSeleccionado ? formularioSeleccionado.id : ""}
          onChange={handleChangeFormulario}
        >
          {formularios.map((formulario) => (
            <MenuItem key={formulario.id} value={formulario.id}>
              {formulario.nombre}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <div>
        {formularioSeleccionado && (
          <EditarSeccionYPreguntas
            formularioSeleccionado={formularioSeleccionado}
            setFormularioSeleccionado={setFormularioSeleccionado}
            handleReload={handleReload}
          />
        )}
      </div>
    </div>
  );
};

export default EditarFormulario;
