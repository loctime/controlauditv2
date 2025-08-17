import React, { useState, useEffect, useCallback } from "react";
import { collection, getDocs, doc, getDoc, onSnapshot } from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import {
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Typography, 
  Box, 
  Alert, 
  Chip, 
  Button,
  useTheme,
  useMediaQuery,
  alpha,
  Card,
  CardContent,
  IconButton,
  CircularProgress
} from "@mui/material";
import RefreshIcon from '@mui/icons-material/Refresh';
import EditarSeccionYPreguntas from "./EditarSeccionYPreguntas";
import { useAuth } from "../../context/AuthContext";
import Swal from 'sweetalert2';
import { useNavigate } from "react-router-dom";
import PublicIcon from '@mui/icons-material/Public';
import AddIcon from '@mui/icons-material/Add';
import FormulariosAccordionList from "./FormulariosAccordionList";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const EditarFormulario = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
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

  // ✅ Debug del estado loading
  React.useEffect(() => {
    console.log('🔧 [DEBUG] Estado loading cambió:', loading);
  }, [loading]);

  // Cuando el usuario selecciona un formulario, cargar el detalle solo si no está en cache
  const handleChangeFormulario = async (event) => {
    const formularioId = event.target.value;
    console.log('[DEBUG] handleChangeFormulario llamado con formularioId:', formularioId);
    
    if (!formularioId) {
      console.log('[DEBUG] FormularioId vacío, estableciendo formularioSeleccionado a null');
      setFormularioSeleccionado(null);
      return;
    }
    
    console.log('[DEBUG] Seleccionando formulario:', formularioId);
    console.log('[DEBUG] Formularios completos disponibles:', formulariosCompletos.length);
    
    // Buscar en cache primero
    let detalle = formulariosCompletos.find(f => f.id === formularioId);
    if (!detalle) {
      console.log('[DEBUG] Formulario no encontrado en cache, cargando desde Firestore...');
      try {
        const formularioDoc = await getDoc(doc(db, "formularios", formularioId));
        if (!formularioDoc.exists()) {
          console.error("Formulario no encontrado en Firestore:", formularioId);
          Swal.fire("Error", "El formulario seleccionado no existe.", "error");
          return;
        }
        const formularioData = formularioDoc.data();
        const meta = formularios.find(f => f.id === formularioId);
        detalle = { ...meta, ...formularioData, id: formularioId };
        setFormulariosCompletos(prev => ([...prev.filter(f => f.id !== formularioId), detalle]));
        console.log('[DEBUG] Formulario cargado exitosamente:', detalle);
      } catch (error) {
        console.error("Error al cargar formulario:", error);
        Swal.fire("Error", "No se pudo cargar el formulario. Verifica tu conexión a internet.", "error");
        return;
      }
    } else {
      console.log('[DEBUG] Formulario encontrado en cache:', detalle);
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
    console.log('🔧 [DEBUG] puedeEditarFormulario llamado con:', {
      formulario: formulario?.id,
      user: user?.uid,
      userProfile: userProfile,
      userProfileRole: userProfile?.role,
      formularioCreadorId: formulario?.creadorId,
      formularioPermisos: formulario?.permisos
    });
    
    if (!formulario || !user) {
      console.log('🔧 [DEBUG] No hay formulario o usuario');
      return false;
    }
    
    // Supermax puede editar todo
    if (userProfile?.role === 'supermax') {
      console.log('🔧 [DEBUG] Usuario es supermax - puede editar');
      return true;
    }
    
    // Administradores pueden editar todo
    if (userProfile?.role === 'max') {
      console.log('🔧 [DEBUG] Usuario es max - puede editar');
      return true;
    }
    
    // Creador puede editar
    if (formulario.creadorId === user.uid) {
      console.log('🔧 [DEBUG] Usuario es creador - puede editar');
      return true;
    }
    
    // Usuarios con permisos explícitos
    if (formulario.permisos?.puedeEditar?.includes(user.uid)) {
      console.log('🔧 [DEBUG] Usuario tiene permisos explícitos - puede editar');
      return true;
    }
    
    console.log('🔧 [DEBUG] Usuario NO puede editar');
    return false;
  };

  // ✅ Función para verificar permisos de eliminación
  const puedeEliminarFormulario = (formulario) => {
    console.log('🔧 [DEBUG] puedeEliminarFormulario llamado con:', {
      formulario: formulario?.id,
      user: user?.uid,
      userProfile: userProfile,
      userProfileRole: userProfile?.role,
      formularioCreadorId: formulario?.creadorId,
      formularioPermisos: formulario?.permisos
    });
    
    if (!formulario || !user) {
      console.log('🔧 [DEBUG] No hay formulario o usuario');
      return false;
    }
    
    // Supermax puede eliminar todo
    if (userProfile?.role === 'supermax') {
      console.log('🔧 [DEBUG] Usuario es supermax - puede eliminar');
      return true;
    }
    
    // Administradores pueden eliminar todo
    if (userProfile?.role === 'max') {
      console.log('🔧 [DEBUG] Usuario es max - puede eliminar');
      return true;
    }
    
    // El creador puede eliminar (incluye formularios copiados)
    if (formulario.creadorId === user.uid) {
      console.log('🔧 [DEBUG] Usuario es creador - puede eliminar');
      return true;
    }
    
    // Usuarios con permisos explícitos de eliminación
    if (formulario.permisos?.puedeEliminar?.includes(user.uid)) {
      console.log('🔧 [DEBUG] Usuario tiene permisos explícitos - puede eliminar');
      return true;
    }
    
    console.log('🔧 [DEBUG] Usuario NO puede eliminar');
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

  // ✅ Debug del estado del usuario y permisos
  React.useEffect(() => {
    console.log('🔧 [DEBUG] Estado del usuario y permisos:', {
      user: user?.uid,
      userProfile: userProfile,
      userProfileRole: userProfile?.role,
      loading: loading,
      formularioSeleccionado: formularioSeleccionado?.id,
      formularioSeleccionadoCompleto: formularioSeleccionado,
      puedeEditar: formularioSeleccionado ? puedeEditarFormulario(formularioSeleccionado) : false,
      puedeEliminar: formularioSeleccionado ? puedeEliminarFormulario(formularioSeleccionado) : false
    });
  }, [user, userProfile, loading, formularioSeleccionado]);

  // ✅ Debug cuando cambia el formulario seleccionado
  React.useEffect(() => {
    console.log('🔧 [DEBUG] formularioSeleccionado cambió:', {
      id: formularioSeleccionado?.id,
      nombre: formularioSeleccionado?.nombre,
      completo: formularioSeleccionado
    });
  }, [formularioSeleccionado]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={40} sx={{ mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            Cargando formularios...
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Esto puede tomar unos segundos
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box className="content-container" sx={{ 
      bgcolor: 'background.paper',
      borderRadius: { xs: 0, sm: 3 },
      border: { xs: 'none', sm: `1px solid ${alpha(theme.palette.divider, 0.3)}` },
      boxShadow: { xs: 'none', sm: '0 2px 12px rgba(0,0,0,0.08)' }
    }}>
      <style>
        {`
          @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
          }
        `}
      </style>
      
      {/* Botón Volver */}
      <Button
        variant="outlined"
        startIcon={<ArrowBackIcon />}
        onClick={() => {
          console.debug('[EditarFormulario] Volver a /perfil?tab=formularios');
          navigate('/perfil?tab=formularios');
        }}
        aria-label="Volver a perfil, pestaña formularios"
        sx={{ 
          mb: isSmallMobile ? 2 : 3,
          fontSize: isSmallMobile ? '0.875rem' : '1rem'
        }}
      >
        Volver
      </Button>
      
      {/* Header con título y controles */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: isMobile ? 'column' : 'row',
        alignItems: isMobile ? 'stretch' : 'center',
        justifyContent: 'space-between', 
        mb: isSmallMobile ? 3 : 4,
        gap: isSmallMobile ? 2 : 3
      }}>
        <Typography 
          variant={isSmallMobile ? "h5" : "h4"} 
          sx={{ 
            fontWeight: 700, 
            color: 'primary.main',
            textAlign: isMobile ? 'center' : 'left',
            mb: isMobile ? 2 : 0
          }}
        >
          📝 Editar Formularios
        </Typography>
        
        <Box sx={{ 
          display: 'flex', 
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: 'center',
          gap: isSmallMobile ? 2 : 3,
          flexWrap: 'wrap'
        }}>
          <FormControl 
            size={isSmallMobile ? "small" : "medium"}
            sx={{ 
              minWidth: isMobile ? '100%' : 250,
              mb: isMobile ? 2 : 0
            }}
          >
            <InputLabel id="select-formulario-label">Seleccionar Formulario</InputLabel>
            <Select
              labelId="select-formulario-label"
              id="select-formulario"
              value={formularioSeleccionado?.id || ""}
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
          
          <Box sx={{ 
            display: 'flex', 
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: 'center',
            gap: isSmallMobile ? 1 : 2,
            flexWrap: 'wrap'
          }}>
            <Button
              variant="outlined"
              startIcon={<PublicIcon />}
              onClick={() => {
                console.debug('[EditarFormulario] Ir a galería de formularios públicos');
                navigate('/formularios-publicos');
              }}
              sx={{ 
                borderRadius: 2,
                px: isSmallMobile ? 2 : 3,
                py: isSmallMobile ? 1 : 1.5,
                fontSize: isSmallMobile ? '0.875rem' : '1rem',
                fontWeight: 600,
                minWidth: isMobile ? '100%' : 'auto',
                '&:hover': {
                  transform: 'translateY(-1px)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  transition: 'all 0.2s ease'
                },
                transition: 'all 0.2s ease'
              }}
              title="Ver y copiar plantillas públicas"
            >
              🌐 Galería Pública
            </Button>
            
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => navigate("/formulario")}
              sx={{ 
                borderRadius: 2,
                px: isSmallMobile ? 2 : 3,
                py: isSmallMobile ? 1 : 1.5,
                fontSize: isSmallMobile ? '0.875rem' : '1rem',
                fontWeight: 600,
                minWidth: isMobile ? '100%' : 'auto',
                '&:hover': {
                  transform: 'translateY(-1px)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  transition: 'all 0.2s ease'
                },
                transition: 'all 0.2s ease'
              }}
            >
              ➕ Crear
            </Button>
            
            <Button
              variant="outlined"
              color="primary"
              onClick={handleReload}
              disabled={recargando}
              sx={{
                minWidth: isSmallMobile ? 40 : 48,
                width: isSmallMobile ? 40 : 48,
                height: isSmallMobile ? 40 : 48,
                borderRadius: '50%',
                p: 0,
                '&:hover': {
                  transform: 'translateY(-1px)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  transition: 'all 0.2s ease'
                },
                transition: 'all 0.2s ease'
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
                sx={{ 
                  animation: 'pulse 1s infinite',
                  fontWeight: 600
                }}
              />
            )}
          </Box>
        </Box>
      </Box>
      {/* Layout horizontal para detalle y edición */}
      {formularioSeleccionado && formularioSeleccionado.id && (
        <Box 
          sx={{ 
            display: { xs: 'block', md: 'flex' }, 
            gap: isSmallMobile ? 2 : 3, 
            alignItems: 'flex-start',
            mt: isSmallMobile ? 3 : 4
          }} 
          ref={edicionRef}
        >
          {/* Detalle del formulario */}
          <Card 
            sx={{ 
              flex: 1, 
              minWidth: 280,
              bgcolor: 'background.paper',
              borderRadius: 3,
              border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
              boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
              overflow: 'hidden'
            }}
          >
            <CardContent sx={{ p: isSmallMobile ? 2 : 3 }}>
              <Typography 
                variant={isSmallMobile ? "h6" : "h5"} 
                sx={{ 
                  fontWeight: 700, 
                  color: 'primary.main',
                  mb: isSmallMobile ? 2 : 3,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}
              >
                📋 Información del Formulario
              </Typography>
              
              <Box sx={{
                bgcolor: alpha(theme.palette.info.main, 0.05),
                borderRadius: 2,
                p: isSmallMobile ? 2 : 3,
                border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`
              }}>
                                 <Box sx={{ lineHeight: 1.8 }}>
                   <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                     <Typography component="span" sx={{ fontWeight: 600, color: 'text.primary' }}>
                       👤 Creado por:
                     </Typography>
                     <Typography component="span" color="text.secondary">
                       {formularioSeleccionado.creadorNombre || formularioSeleccionado.creadorEmail || 'Desconocido'}
                     </Typography>
                   </Box>
                   
                   <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                     <Typography component="span" sx={{ fontWeight: 600, color: 'text.primary' }}>
                       📅 Fecha de creación:
                     </Typography>
                     <Typography component="span" color="text.secondary">
                       {formularioSeleccionado.timestamp?.toDate?.()
                         ? formularioSeleccionado.timestamp.toDate().toLocaleString('es-ES')
                         : (formularioSeleccionado.timestamp instanceof Date
                             ? formularioSeleccionado.timestamp.toLocaleString('es-ES')
                             : (console.debug('[EditarFormulario] Fecha de creación no válida:', formularioSeleccionado.timestamp), 'No disponible'))}
                     </Typography>
                   </Box>
                   
                   <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                     <Typography component="span" sx={{ fontWeight: 600, color: 'text.primary' }}>
                       🔄 Última modificación:
                     </Typography>
                     <Typography component="span" color="text.secondary">
                       {formularioSeleccionado.ultimaModificacion?.toDate?.()
                         ? formularioSeleccionado.ultimaModificacion.toDate().toLocaleString('es-ES')
                         : (formularioSeleccionado.ultimaModificacion instanceof Date
                             ? formularioSeleccionado.ultimaModificacion.toLocaleString('es-ES')
                             : (console.debug('[EditarFormulario] Última modificación no válida:', formularioSeleccionado.ultimaModificacion), 'No disponible'))}
                     </Typography>
                   </Box>
                   
                   <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                     <Typography component="span" sx={{ fontWeight: 600, color: 'text.primary' }}>
                       📊 Estado:
                     </Typography>
                     <Chip 
                       label={formularioSeleccionado.estado || 'Activo'} 
                       size="small" 
                       color="success" 
                       variant="outlined"
                     />
                   </Box>
                   
                   <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                     <Typography component="span" sx={{ fontWeight: 600, color: 'text.primary' }}>
                       🏷️ Versión:
                     </Typography>
                     <Typography component="span" color="text.secondary">
                       {formularioSeleccionado.version || '1.0'}
                     </Typography>
                   </Box>
                   
                   <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                     <Typography component="span" sx={{ fontWeight: 600, color: 'text.primary' }}>
                       👁️ Visibilidad:
                     </Typography>
                     <Chip 
                       label={formularioSeleccionado.esPublico ? 'Público' : 'Privado'} 
                       size="small" 
                       color={formularioSeleccionado.esPublico ? "success" : "default"} 
                       variant="outlined"
                     />
                   </Box>
                 </Box>
              </Box>
            </CardContent>
          </Card>
          
          {/* Edición del formulario (Accordion) */}
          <Card 
            sx={{ 
              flex: 2, 
              minWidth: 320,
              bgcolor: 'background.paper',
              borderRadius: 3,
              border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
              boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
              overflow: 'hidden'
            }}
          >
            <CardContent sx={{ p: isSmallMobile ? 2 : 3 }}>
              <Typography 
                variant={isSmallMobile ? "h6" : "h5"} 
                sx={{ 
                  fontWeight: 700, 
                  color: 'primary.main',
                  mb: isSmallMobile ? 2 : 3,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}
              >
                ✏️ Editar Formulario
              </Typography>
              
              {cargandoFormulario ? (
                <Box 
                  sx={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center', 
                    minHeight: 200,
                    bgcolor: alpha(theme.palette.info.main, 0.05),
                    borderRadius: 2,
                    border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`
                  }}
                >
                  <Typography color="info.main" sx={{ fontWeight: 600 }}>
                    Cargando formulario...
                  </Typography>
                </Box>
              ) : (
                <EditarSeccionYPreguntas
                  formularioSeleccionado={formularioSeleccionado}
                  setFormularioSeleccionado={setFormularioSeleccionado}
                  handleReload={handleReload}
                  puedeEditar={formularioSeleccionado ? puedeEditarFormulario(formularioSeleccionado) : false}
                  puedeEliminar={formularioSeleccionado ? puedeEliminarFormulario(formularioSeleccionado) : false}
                />
              )}
            </CardContent>
          </Card>
        </Box>
      )}
      
      {/* Si se selecciona 'Todos', mostrar acordeón de formularios */}
      {(!formularioSeleccionado || !formularioSeleccionado.id) && (
        <Card 
          sx={{ 
            mt: isSmallMobile ? 3 : 4,
            bgcolor: 'background.paper',
            borderRadius: 3,
            border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
            boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
            overflow: 'hidden'
          }}
        >
          <CardContent sx={{ p: isSmallMobile ? 2 : 3 }}>
            <Typography 
              variant={isSmallMobile ? "h6" : "h5"} 
              sx={{ 
                fontWeight: 700, 
                color: 'primary.main',
                mb: isSmallMobile ? 2 : 3,
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}
            >
              📋 Lista de Formularios
            </Typography>
            
            <FormulariosAccordionList
              formularios={formulariosCompletos}
              onEditar={handleEditarDesdeAccordion}
              formularioSeleccionadoId={formularioSeleccionado?.id || null}
              scrollToEdicion={scrollToEdicion}
            />
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default EditarFormulario;
