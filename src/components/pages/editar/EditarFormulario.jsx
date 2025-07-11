import React, { useState, useEffect, useCallback } from "react";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import { FormControl, InputLabel, Select, MenuItem, Typography, Box, Alert, Chip } from "@mui/material";
import EditarSeccionYPreguntas from "./EditarSeccionYPreguntas";
import { useAuth } from "../../context/AuthContext";
import Swal from 'sweetalert2';

const EditarFormulario = () => {
  const { user, userProfile } = useAuth();
  const [formularios, setFormularios] = useState([]);
  const [formularioSeleccionado, setFormularioSeleccionado] = useState(null);
  const [reload, setReload] = useState(false);
  const [loading, setLoading] = useState(true);

  const obtenerFormularios = useCallback(async () => {
    try {
      if (!user) {
        setFormularios([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      const formulariosCollection = collection(db, "formularios");
      const res = await getDocs(formulariosCollection);
      const todosLosFormularios = res.docs.map((formulario) => ({
        ...formulario.data(),
        id: formulario.id
      }));

      // ✅ Filtrar formularios por permisos
      const formulariosPermitidos = todosLosFormularios.filter(formulario => {
        // Administradores ven todos los formularios
        if (userProfile?.role === 'max') {
          return true;
        }

        // Usuarios ven sus propios formularios
        if (formulario.creadorId === user.uid) {
          return true;
        }

        // Formularios públicos
        if (formulario.esPublico) {
          return true;
        }

        // Formularios donde el usuario tiene permisos explícitos
        if (formulario.permisos?.puedeVer?.includes(user.uid)) {
          return true;
        }

        return false;
      });

      setFormularios(formulariosPermitidos);

      // Seleccionar el primer formulario si no hay uno seleccionado
      if (!formularioSeleccionado && formulariosPermitidos.length > 0) {
        setFormularioSeleccionado(formulariosPermitidos[0]);
      } else if (formulariosPermitidos.length === 0) {
        setFormularioSeleccionado(null);
      }

      console.log(`✅ Formularios cargados: ${formulariosPermitidos.length} de ${todosLosFormularios.length} totales`);
    } catch (error) {
      console.error("Error al obtener formularios:", error);
      Swal.fire("Error", "Error al cargar formularios.", "error");
    } finally {
      setLoading(false);
    }
  }, [user, userProfile, formularioSeleccionado]);

  useEffect(() => {
    obtenerFormularios();
  }, [obtenerFormularios, reload]);

  const handleChangeFormulario = async (event) => {
    const formularioId = event.target.value;
    if (formularioId) {
      const formularioDoc = await getDoc(doc(db, "formularios", formularioId));
      const formularioData = formularioDoc.data();
      setFormularioSeleccionado({ ...formularioData, id: formularioId });
    } else {
      setFormularioSeleccionado(null);
    }
  };

  const handleReload = () => {
    setReload((prev) => !prev);
  };

  // ✅ Función para verificar permisos de edición
  const puedeEditarFormulario = (formulario) => {
    if (!formulario || !user) return false;
    
    // Administradores pueden editar todo
    if (userProfile?.role === 'max') return true;
    
    // Creador puede editar
    if (formulario.creadorId === user.uid) return true;
    
    // Usuarios con permisos explícitos
    if (formulario.permisos?.puedeEditar?.includes(user.uid)) return true;
    
    return false;
  };

  // ✅ Función para verificar permisos de eliminación
  const puedeEliminarFormulario = (formulario) => {
    if (!formulario || !user) return false;
    
    // Administradores pueden eliminar todo
    if (userProfile?.role === 'max') return true;
    
    // Solo el creador puede eliminar
    if (formulario.creadorId === user.uid) return true;
    
    return false;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <Typography>Cargando formularios...</Typography>
      </Box>
    );
  }

  return (
    <div>
      {/* Título y selector alineados horizontalmente */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography variant="h4" gutterBottom>
          Editar Formularios
        </Typography>
        <FormControl sx={{ minWidth: 250 }} size="small">
          <InputLabel id="select-formulario-label">Seleccionar Formulario</InputLabel>
          <Select
            labelId="select-formulario-label"
            id="select-formulario"
            value={formularioSeleccionado ? formularioSeleccionado.id : ""}
            onChange={handleChangeFormulario}
            label="Seleccionar Formulario"
          >
            <MenuItem value=""><em>Todos</em></MenuItem>
            {formularios.map((formulario) => (
              <MenuItem key={formulario.id} value={formulario.id}>
                {formulario.nombre}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Layout horizontal para detalle y edición */}
      {formularioSeleccionado && formularioSeleccionado.id && (
        <Box display={{ xs: 'block', md: 'flex' }} gap={3} alignItems="flex-start">
          {/* Detalle del formulario */}
          <Box flex={1} minWidth={280}>
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                <strong>Creado por:</strong> {formularioSeleccionado.creadorNombre || formularioSeleccionado.creadorEmail || 'Desconocido'}<br/>
                <strong>Fecha de creación:</strong> {formularioSeleccionado.timestamp?.toDate?.()?.toLocaleString?.() || 'No disponible'}<br/>
                <strong>Última modificación:</strong> {formularioSeleccionado.ultimaModificacion?.toLocaleString?.() || 'No disponible'}<br/>
                <strong>Estado:</strong> {formularioSeleccionado.estado || 'Activo'}<br/>
                <strong>Versión:</strong> {formularioSeleccionado.version || '1.0'}<br/>
                <strong>Visibilidad:</strong> {formularioSeleccionado.esPublico ? 'Público' : 'Privado'}
              </Typography>
            </Alert>
          </Box>
          {/* Edición del formulario (Accordion) */}
          <Box flex={2} minWidth={320}>
            <EditarSeccionYPreguntas
              formularioSeleccionado={formularioSeleccionado}
              setFormularioSeleccionado={setFormularioSeleccionado}
              handleReload={handleReload}
              puedeEditar={puedeEditarFormulario(formularioSeleccionado)}
              puedeEliminar={puedeEliminarFormulario(formularioSeleccionado)}
            />
          </Box>
        </Box>
      )}
      {/* Si se selecciona 'Todos', mostrar mensaje o listado general */}
      {(!formularioSeleccionado || !formularioSeleccionado.id) && (
        <Alert severity="info" sx={{ mt: 4 }}>
          Selecciona un formulario para editar o usa la opción "Todos" para ver el listado general.
        </Alert>
      )}
    </div>
  );
};

export default EditarFormulario;
