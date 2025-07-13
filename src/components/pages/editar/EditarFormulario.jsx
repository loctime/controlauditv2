import React, { useState, useEffect, useCallback } from "react";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import { FormControl, InputLabel, Select, MenuItem, Typography, Box, Alert, Chip, Button } from "@mui/material";
import RefreshIcon from '@mui/icons-material/Refresh';
import EditarSeccionYPreguntas from "./EditarSeccionYPreguntas";
import { useAuth } from "../../context/AuthContext";
import Swal from 'sweetalert2';
import { useNavigate } from "react-router-dom";

const EditarFormulario = () => {
  const { user, userProfile } = useAuth();
  const [formularios, setFormularios] = useState([]); // Solo metadatos
  const [formularioSeleccionado, setFormularioSeleccionado] = useState(null);
  const [formulariosCache, setFormulariosCache] = useState({}); // id -> formulario completo
  const [reload, setReload] = useState(false);
  const [loading, setLoading] = useState(true);
  const [cargandoFormulario, setCargandoFormulario] = useState(false); // Nuevo estado
  const [recargando, setRecargando] = useState(false); // Estado para animación del botón
  const navigate = useNavigate();

  // Cargar solo metadatos al inicio
  const obtenerFormularios = useCallback(async () => {
    try {
      if (!user) {
        setFormularios([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      
      // Limpiar cache si es una recarga
      if (reload) {
        setFormulariosCache({});
        console.log('🔄 Cache de formularios limpiado');
      }
      
      const formulariosCollection = collection(db, "formularios");
      const res = await getDocs(formulariosCollection);
      const metadatos = res.docs.map((formulario) => {
        const data = formulario.data();
        return {
          id: formulario.id,
          nombre: data.nombre,
          creadorId: data.creadorId,
          creadorNombre: data.creadorNombre,
          creadorEmail: data.creadorEmail,
          clienteAdminId: data.clienteAdminId, // Nuevo campo para multi-tenant
          estado: data.estado,
          version: data.version,
          esPublico: data.esPublico,
          timestamp: data.timestamp,
          ultimaModificacion: data.ultimaModificacion,
          permisos: data.permisos
        };
      });
      // Filtrar por permisos multi-tenant
      const formulariosPermitidos = metadatos.filter(formulario => {
        // Super administradores ven todos los formularios
        if (userProfile?.role === 'supermax') {
          return true;
        }

        // Clientes administradores ven sus formularios y los de sus usuarios
        if (userProfile?.role === 'max') {
          // Si es el cliente admin del formulario
          if (formulario.clienteAdminId === user.uid) {
            return true;
          }
          // Si es el creador del formulario
          if (formulario.creadorId === user.uid) {
            return true;
          }
          return false;
        }

        // Usuarios operarios ven sus formularios y los de su cliente admin
        if (userProfile?.role === 'operario') {
          // Sus propios formularios
          if (formulario.creadorId === user.uid) {
            return true;
          }

          // Formularios de su cliente administrador
          if (formulario.clienteAdminId === userProfile.clienteAdminId) {
            return true;
          }

          // Formularios públicos
          if (formulario.esPublico) {
            return true;
          }

          // Formularios con permisos explícitos
          if (formulario.permisos?.puedeVer?.includes(user.uid)) {
            return true;
          }

          return false;
        }

        return false;
      });
      setFormularios(formulariosPermitidos);
      // Seleccionar el primero si no hay uno seleccionado
      if (!formularioSeleccionado && formulariosPermitidos.length > 0) {
        setFormularioSeleccionado(formulariosPermitidos[0]);
      } else if (formulariosPermitidos.length === 0) {
        setFormularioSeleccionado(null);
      }
    } catch (error) {
      console.error("Error al obtener formularios:", error);
      Swal.fire("Error", "Error al cargar formularios.", "error");
    } finally {
      setLoading(false);
    }
  }, [user, userProfile, formularioSeleccionado, reload]);

  useEffect(() => {
    obtenerFormularios();
  }, [obtenerFormularios, reload]);

  // Cuando el usuario selecciona un formulario, cargar el detalle solo si no está en cache
  const handleChangeFormulario = async (event) => {
    const formularioId = event.target.value;
    if (!formularioId) {
      setFormularioSeleccionado(null);
      setCargandoFormulario(false);
      return;
    }
    
    setCargandoFormulario(true);
    
    // Si ya está en cache, usarlo
    if (formulariosCache[formularioId]) {
      setFormularioSeleccionado(formulariosCache[formularioId]);
      setCargandoFormulario(false);
      return;
    }
    
    try {
      const formularioDoc = await getDoc(doc(db, "formularios", formularioId));
      const formularioData = formularioDoc.data();
      const meta = formularios.find(f => f.id === formularioId);
      const completo = { ...meta, ...formularioData, id: formularioId };
      
      setFormularioSeleccionado(completo);
      setFormulariosCache(prev => ({ ...prev, [formularioId]: completo }));
    } catch (error) {
      console.error("Error al cargar formulario:", error);
      Swal.fire("Error", "No se pudo cargar el formulario.", "error");
    } finally {
      setCargandoFormulario(false);
    }
  };

  const handleReload = async () => {
    setRecargando(true);
    setReload((prev) => !prev);
    
    // Simular un pequeño delay para la animación
    setTimeout(() => {
      setRecargando(false);
      // Mostrar mensaje de confirmación
      Swal.fire({
        icon: 'success',
        title: 'Lista Actualizada',
        text: 'La lista de formularios se ha recargado exitosamente.',
        timer: 1500,
        showConfirmButton: false
      });
    }, 1000);
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
      <style>
        {`
          @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
          }
        `}
      </style>
      {/* Título, selector y botón crear alineados horizontalmente */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography variant="h4" gutterBottom>
          Editar Formularios
        </Typography>
        <Box display="flex" alignItems="center" gap={2}>
          {recargando && (
            <Chip 
              label="Recargando..." 
              color="primary" 
              size="small"
              sx={{ animation: 'pulse 1s infinite' }}
            />
          )}
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
          <Button
            variant="outlined"
            color="primary"
            onClick={handleReload}
            disabled={recargando}
            sx={{ 
              minWidth: 40, 
              width: 40, 
              height: 40,
              borderRadius: '50%',
              p: 0
            }}
            title="Recargar lista de formularios"
          >
            <RefreshIcon 
              sx={{ 
                animation: recargando ? 'spin 1s linear infinite' : 'none',
                '@keyframes spin': {
                  '0%': { transform: 'rotate(0deg)' },
                  '100%': { transform: 'rotate(360deg)' }
                }
              }} 
            />
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate("/formulario")}
            sx={{ whiteSpace: 'nowrap', minWidth: 100 }}
          >
            Crear
          </Button>
        </Box>
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
            {cargandoFormulario ? (
              <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                <Typography>Cargando formulario...</Typography>
              </Box>
            ) : (
              <EditarSeccionYPreguntas
                formularioSeleccionado={formularioSeleccionado}
                setFormularioSeleccionado={setFormularioSeleccionado}
                handleReload={handleReload}
                puedeEditar={puedeEditarFormulario(formularioSeleccionado)}
                puedeEliminar={puedeEliminarFormulario(formularioSeleccionado)}
              />
            )}
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
