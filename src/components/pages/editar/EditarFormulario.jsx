import React, { useState, useEffect, useCallback } from "react";
import { collection, getDocs, doc, getDoc, onSnapshot } from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import { FormControl, InputLabel, Select, MenuItem, Typography, Box, Alert, Chip, Button } from "@mui/material";
import RefreshIcon from '@mui/icons-material/Refresh';
import EditarSeccionYPreguntas from "./EditarSeccionYPreguntas";
import { useAuth } from "../../context/AuthContext";
import Swal from 'sweetalert2';
import { useNavigate } from "react-router-dom";
import PublicIcon from '@mui/icons-material/Public';
import AddIcon from '@mui/icons-material/Add';
import FormulariosAccordionList from "./FormulariosAccordionList";

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

  // Almacena detalles completos de formularios
  const [formulariosCompletos, setFormulariosCompletos] = useState([]);

  const CACHE_KEY = 'formularios_detalle_cache';
  const CACHE_EXPIRATION_MS = 10 * 60 * 1000; // 10 minutos

  // Cargar detalles completos de todos los formularios permitidos
  const cargarDetallesFormularios = useCallback(async (formulariosPermitidos) => {
    // Intentar recuperar de localStorage
    try {
      const cacheRaw = localStorage.getItem(CACHE_KEY);
      if (cacheRaw) {
        const cache = JSON.parse(cacheRaw);
        if (Date.now() - cache.timestamp < CACHE_EXPIRATION_MS) {
          // Validar que los ids coincidan
          const idsCache = cache.formularios.map(f => f.id).sort().join(',');
          const idsActual = formulariosPermitidos.map(f => f.id).sort().join(',');
          if (idsCache === idsActual) {
            setFormulariosCompletos(cache.formularios);
            console.debug('[EditarFormulario] Formularios completos cargados de cache local');
            setLoading(false);
            return;
          }
        }
      }
    } catch (e) { console.warn('Error leyendo cache local:', e); }
    // Si no hay cache válido, cargar de Firestore
    setLoading(true);
    const detalles = await Promise.all(formulariosPermitidos.map(async (meta) => {
      try {
        const docSnap = await getDoc(doc(db, 'formularios', meta.id));
        const data = docSnap.data();
        return { ...meta, ...data, id: meta.id };
      } catch (e) {
        console.warn('Error cargando detalle de formulario', meta.id, e);
        return meta;
      }
    }));
    setFormulariosCompletos(detalles);
    // Guardar en cache local
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ formularios: detalles, timestamp: Date.now() }));
    } catch (e) { console.warn('Error guardando cache local:', e); }
    setLoading(false);
    console.debug('[EditarFormulario] Formularios completos cargados de Firestore');
  }, []);

  // Suscripción reactiva a formularios multi-tenant
  useEffect(() => {
    if (!user) {
      setFormularios([]);
      setFormulariosCompletos([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const formulariosCollection = collection(db, "formularios");
    const unsubscribe = onSnapshot(formulariosCollection, (res) => {
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
        if (userProfile?.role === 'supermax') return true;
        if (userProfile?.role === 'max') {
          if (formulario.clienteAdminId === user.uid) return true;
          if (formulario.creadorId === user.uid) return true;
          return false;
        }
        if (userProfile?.role === 'operario') {
          if (formulario.creadorId === user.uid) return true;
          if (formulario.clienteAdminId === userProfile.clienteAdminId) return true;
          if (formulario.esPublico) return true;
          if (formulario.permisos?.puedeVer?.includes(user.uid)) return true;
          return false;
        }
        return false;
      });
      setFormularios(formulariosPermitidos);
      // Por defecto, selector en 'Todos'
      setFormularioSeleccionado(null);
      cargarDetallesFormularios(formulariosPermitidos);
      setLoading(false);
      console.debug(`[onSnapshot] ${formulariosPermitidos.length} formularios cargados en tiempo real`);
    }, (error) => {
      setLoading(false);
      console.error('[onSnapshot] Error al obtener formularios:', error);
    });
    return () => unsubscribe();
  }, [user, userProfile, reload, cargarDetallesFormularios]);

  // Cuando el usuario selecciona un formulario, cargar el detalle solo si no está en cache
  const handleChangeFormulario = async (event) => {
    const formularioId = event.target.value;
    if (!formularioId) {
      setFormularioSeleccionado(null);
      return;
    }
    // Buscar en cache primero
    let detalle = formulariosCompletos.find(f => f.id === formularioId);
    if (!detalle) {
      try {
        const formularioDoc = await getDoc(doc(db, "formularios", formularioId));
        const formularioData = formularioDoc.data();
        const meta = formularios.find(f => f.id === formularioId);
        detalle = { ...meta, ...formularioData, id: formularioId };
        setFormulariosCompletos(prev => ([...prev.filter(f => f.id !== formularioId), detalle]));
      } catch (error) {
        console.error("Error al cargar formulario:", error);
        Swal.fire("Error", "No se pudo cargar el formulario.", "error");
        return;
      }
    }
    setFormularioSeleccionado(detalle);
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

  // Ref para hacer scroll a la edición
  const edicionRef = React.useRef(null);

  // Función para scroll suave a la edición
  const scrollToEdicion = () => {
    if (edicionRef.current) {
      edicionRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      console.debug("[EditarFormulario] Scroll a la edición");
    }
  };

  // Callback para el acordeón: selecciona y hace scroll
  const handleEditarDesdeAccordion = async (formularioId) => {
    // Simula el evento del selector
    await handleChangeFormulario({ target: { value: formularioId } });
    setTimeout(scrollToEdicion, 300);
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
      {/* Cabecera optimizada con barra de acciones */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2} flexWrap="wrap" gap={2}>
        <Typography variant="h4" gutterBottom sx={{ flex: 1, minWidth: 200 }}>
          Editar Formularios
        </Typography>
        <FormControl sx={{ minWidth: 250, mr: 2 }} size="small">
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
        <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
          <Button
            variant="outlined"
            startIcon={<PublicIcon />}
            onClick={() => {
              console.debug('[EditarFormulario] Ir a galería de formularios públicos');
              navigate('/formularios-publicos');
            }}
            sx={{ borderRadius: '20px', px: 2, py: 1, minWidth: 0 }}
            title="Ver y copiar plantillas públicas"
          >
            Galería Pública
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => navigate("/formulario")}
            sx={{ borderRadius: '20px', px: 2, py: 1, minWidth: 0 }}
          >
            Crear
          </Button>
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
          {recargando && (
            <Chip
              label="Recargando..."
              color="primary"
              size="small"
              sx={{ animation: 'pulse 1s infinite' }}
            />
          )}
        </Box>
      </Box>
      {/* Layout horizontal para detalle y edición */}
      {formularioSeleccionado && formularioSeleccionado.id && (
        <Box display={{ xs: 'block', md: 'flex' }} gap={3} alignItems="flex-start" ref={edicionRef}>
          {/* Detalle del formulario */}
          <Box flex={1} minWidth={280}>
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                <strong>Creado por:</strong> {formularioSeleccionado.creadorNombre || formularioSeleccionado.creadorEmail || 'Desconocido'}<br/>
                <strong>Fecha de creación:</strong> {
                  formularioSeleccionado.timestamp?.toDate?.()
                    ? formularioSeleccionado.timestamp.toDate().toLocaleString('es-ES')
                    : (formularioSeleccionado.timestamp instanceof Date
                        ? formularioSeleccionado.timestamp.toLocaleString('es-ES')
                        : (console.debug('[EditarFormulario] Fecha de creación no válida:', formularioSeleccionado.timestamp), 'No disponible'))
                }<br/>
                <strong>Última modificación:</strong> {
                  formularioSeleccionado.ultimaModificacion?.toDate?.()
                    ? formularioSeleccionado.ultimaModificacion.toDate().toLocaleString('es-ES')
                    : (formularioSeleccionado.ultimaModificacion instanceof Date
                        ? formularioSeleccionado.ultimaModificacion.toLocaleString('es-ES')
                        : (console.debug('[EditarFormulario] Última modificación no válida:', formularioSeleccionado.ultimaModificacion), 'No disponible'))
                }<br/>
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
      {/* Si se selecciona 'Todos', mostrar acordeón de formularios */}
      {(!formularioSeleccionado || !formularioSeleccionado.id) && (
        <Box mt={4}>
          <FormulariosAccordionList
            formularios={formulariosCompletos}
            onEditar={handleEditarDesdeAccordion}
            formularioSeleccionadoId={formularioSeleccionado?.id || null}
            scrollToEdicion={scrollToEdicion}
          />
        </Box>
      )}
    </div>
  );
};

export default EditarFormulario;
