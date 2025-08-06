import React, { useRef, useState, useMemo } from "react";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Box,
  Chip,
  Button,
  Stack,
  Tooltip,
  TextField,
  InputAdornment,
  useTheme,
  useMediaQuery,
  alpha,
  Card,
  CardContent,
  IconButton,
  Alert
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import EditIcon from "@mui/icons-material/Edit";
import PublicIcon from '@mui/icons-material/Public';
import SearchIcon from '@mui/icons-material/Search';
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import EditarFormularioModal from "./EditarFormularioModal";

/**
 * Lista de formularios en modo acordeón expandible.
 * @param {Object[]} formularios - Array de formularios (con metadatos y preguntas)
 * @param {Function} onEditar - Callback al hacer click en Editar (recibe el id)
 * @param {string} formularioSeleccionadoId - Id del formulario actualmente seleccionado
 * @param {Function} scrollToEdicion - Función para hacer scroll a la sección de edición
 */
const FormulariosAccordionList = ({ formularios, onEditar, formularioSeleccionadoId, scrollToEdicion }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const lastClickedRef = useRef(null);
  const [busqueda, setBusqueda] = useState("");
  const [openEditModal, setOpenEditModal] = useState(false);
  const [formularioEdit, setFormularioEdit] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleEditar = (id) => {
    console.debug(`[FormulariosAccordionList] Editar formulario: ${id}`);
    onEditar(id);
    setTimeout(() => {
      if (scrollToEdicion) scrollToEdicion();
    }, 300); // Espera para asegurar el render
  };

  const handleOpenEditModal = (formulario) => {
    setFormularioEdit(formulario);
    setOpenEditModal(true);
    setError(null);
  };

  const handleCloseEditModal = () => {
    setOpenEditModal(false);
    setFormularioEdit(null);
    setError(null);
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setFormularioEdit((prevFormulario) => {
      const updated = { ...prevFormulario, [name]: value };
      
      // Manejar campos especiales
      if (name === 'esPublico') {
        updated.esPublico = value === 'publico';
      }
      
      return updated;
    });
  };

  const handleEditFormulario = async () => {
    if (!formularioEdit.nombre.trim()) {
      setError("El nombre del formulario es requerido");
      return;
    }

    setEditLoading(true);
    try {
      await updateDoc(doc(db, "formularios", formularioEdit.id), {
        nombre: formularioEdit.nombre,
        estado: formularioEdit.estado,
        version: formularioEdit.version,
        esPublico: formularioEdit.esPublico,
        ultimaModificacion: new Date()
      });

      setError(null);
      setOpenEditModal(false);
      setFormularioEdit(null);
    } catch (error) {
      console.error("[FormulariosAccordionList] Error al actualizar formulario:", error);
      setError("Error al actualizar el formulario: " + error.message);
    } finally {
      setEditLoading(false);
    }
  };

  // Filtro de formularios por nombre, propietario o preguntas
  const formulariosFiltrados = useMemo(() => {
    if (!busqueda.trim()) return formularios;
    const q = busqueda.trim().toLowerCase();
    return formularios.filter(f => {
      // Nombre
      if (f.nombre?.toLowerCase().includes(q)) return true;
      // Propietario
      if ((f.creadorNombre || f.creadorEmail || "").toLowerCase().includes(q)) return true;
      // Preguntas
      const secciones = Array.isArray(f.secciones)
        ? f.secciones
        : (typeof f.secciones === 'object' ? Object.values(f.secciones) : []);
      for (const seccion of secciones) {
        for (const pregunta of (seccion.preguntas || [])) {
          if (typeof pregunta === "string" && pregunta.toLowerCase().includes(q)) return true;
          if (typeof pregunta === "object") {
            if ((pregunta.titulo && pregunta.titulo.toLowerCase().includes(q)) ||
                (pregunta.texto && pregunta.texto.toLowerCase().includes(q)) ||
                (pregunta.pregunta && pregunta.pregunta.toLowerCase().includes(q))) return true;
          }
        }
      }
      return false;
    });
  }, [busqueda, formularios]);

  // Función para contar preguntas en todas las secciones
  const contarPreguntas = (formulario) => {
    if (!formulario.secciones) return 0;
    let secciones = Array.isArray(formulario.secciones)
      ? formulario.secciones
      : (typeof formulario.secciones === 'object' ? Object.values(formulario.secciones) : []);
    return secciones.reduce((acc, s) => acc + (s.preguntas?.length || 0), 0);
  };

  if (!formularios || formularios.length === 0) {
    return (
      <Box sx={{
        bgcolor: alpha(theme.palette.warning.main, 0.05),
        borderRadius: 2,
        p: isSmallMobile ? 3 : 4,
        border: `1px solid ${alpha(theme.palette.warning.main, 0.1)}`,
        textAlign: 'center'
      }}>
        <Typography variant="h6" color="warning.main" sx={{ mb: 1 }}>
          No hay formularios disponibles
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Crea tu primer formulario para comenzar
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 2 }}>
      {/* Barra de búsqueda */}
      <Box sx={{ mb: isSmallMobile ? 2 : 3 }}>
        <TextField
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre, propietario o pregunta..."
          size={isSmallMobile ? "small" : "medium"}
          fullWidth
          sx={{ 
            maxWidth: isMobile ? '100%' : 500,
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              '&:hover': {
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: theme.palette.primary.main,
                }
              }
            }
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="primary" />
              </InputAdornment>
            ),
            'aria-label': 'Buscar formularios'
          }}
        />
      </Box>
      
      {/* Lista de formularios en acordeón */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: isSmallMobile ? 1 : 2 }}>
        {formulariosFiltrados.map((formulario) => (
          <Card 
            key={formulario.id}
            sx={{ 
              bgcolor: 'background.paper',
              borderRadius: 3,
              border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
              boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
              overflow: 'hidden',
              '&:hover': {
                transform: 'translateY(-1px)',
                boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                transition: 'all 0.2s ease'
              },
              transition: 'all 0.2s ease'
            }}
          >
            <Accordion 
              defaultExpanded={false} 
              sx={{ 
                boxShadow: 'none',
                '&:before': { display: 'none' },
                '& .MuiAccordionSummary-root': {
                  p: isSmallMobile ? 2 : 3,
                  '&:hover': {
                    bgcolor: alpha(theme.palette.primary.main, 0.05)
                  }
                },
                '& .MuiAccordionDetails-root': {
                  p: isSmallMobile ? 2 : 3,
                  pt: 0
                }
              }}
            >
              <AccordionSummary 
                expandIcon={<ExpandMoreIcon color="primary" />} 
                aria-controls={`panel-${formulario.id}-content`} 
                id={`panel-${formulario.id}-header`}
              >
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: isMobile ? 'column' : 'row',
                  alignItems: isMobile ? 'stretch' : 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  gap: isSmallMobile ? 1 : 2
                }}>
                  {/* Información principal */}
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: isMobile ? 'column' : 'row',
                    alignItems: isMobile ? 'stretch' : 'center',
                    gap: isSmallMobile ? 1 : 2,
                    flex: 1
                  }}>
                    <Typography 
                      variant={isSmallMobile ? "subtitle1" : "h6"} 
                      sx={{ 
                        fontWeight: 700, 
                        color: 'text.primary',
                        flex: 1,
                        wordBreak: 'break-word'
                      }}
                    >
                      📋 {formulario.nombre}
                    </Typography>
                    
                    <Box sx={{ 
                      display: 'flex', 
                      flexDirection: isMobile ? 'row' : 'row',
                      alignItems: 'center',
                      gap: 1,
                      flexWrap: 'wrap'
                    }}>
                      <Tooltip title="Número de preguntas">
                        <Chip 
                          label={`❓ ${contarPreguntas(formulario)}`} 
                          size="small" 
                          color="primary" 
                          variant="outlined"
                          sx={{ fontWeight: 600 }}
                        />
                      </Tooltip>
                      
                      <Tooltip title="Última edición">
                        <Chip 
                          label={formulario.ultimaModificacion ? new Date(formulario.ultimaModificacion.seconds * 1000).toLocaleString('es-ES') : 'Sin fecha'} 
                          size="small" 
                          variant="outlined"
                          sx={{ fontWeight: 600 }}
                        />
                      </Tooltip>
                      
                      <Tooltip title={formulario.esPublico ? 'Público' : 'Privado'}>
                        <Chip 
                          icon={formulario.esPublico ? <PublicIcon /> : null} 
                          label={formulario.esPublico ? '🌐 Público' : '🔒 Privado'} 
                          size="small" 
                          color={formulario.esPublico ? 'success' : 'default'} 
                          variant="outlined"
                          sx={{ fontWeight: 600 }}
                        />
                      </Tooltip>
                    </Box>
                  </Box>
                  
                  {/* Botones de acción */}
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: isMobile ? 'column' : 'row',
                    gap: 1,
                    minWidth: isMobile ? '100%' : 'auto'
                  }}>
                    <Button
                      variant={formularioSeleccionadoId === formulario.id ? "contained" : "outlined"}
                      color="primary"
                      size={isSmallMobile ? "small" : "medium"}
                      startIcon={<EditIcon />}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditar(formulario.id);
                      }}
                      sx={{ 
                        minWidth: isMobile ? '100%' : 120,
                        fontWeight: 600,
                        borderRadius: 2,
                        '&:hover': {
                          transform: 'translateY(-1px)',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                          transition: 'all 0.2s ease'
                        },
                        transition: 'all 0.2s ease'
                      }}
                    >
                      ✏️ Editar
                    </Button>
                    
                    <Button
                      variant="outlined"
                      color="secondary"
                      size={isSmallMobile ? "small" : "medium"}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEditModal(formulario);
                      }}
                      sx={{ 
                        minWidth: isMobile ? '100%' : 120,
                        fontWeight: 600,
                        borderRadius: 2,
                        '&:hover': {
                          transform: 'translateY(-1px)',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                          transition: 'all 0.2s ease'
                        },
                        transition: 'all 0.2s ease'
                      }}
                    >
                      ⚙️ Configurar
                    </Button>
                  </Box>
                </Box>
              </AccordionSummary>
              
              <AccordionDetails>
                <Box sx={{
                  bgcolor: alpha(theme.palette.info.main, 0.05),
                  borderRadius: 2,
                  p: isSmallMobile ? 2 : 3,
                  border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`
                }}>
                  {/* Información detallada */}
                  <Box sx={{ mb: isSmallMobile ? 2 : 3 }}>
                    <Typography variant="subtitle2" color="primary.main" sx={{ fontWeight: 700, mb: 1 }}>
                      📊 Información del Formulario
                    </Typography>
                    
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography component="span" sx={{ fontWeight: 600, color: 'text.primary' }}>
                          👤 Propietario:
                        </Typography>
                        <Typography component="span" color="text.secondary">
                          {formulario.creadorNombre || formulario.creadorEmail || 'Desconocido'}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography component="span" sx={{ fontWeight: 600, color: 'text.primary' }}>
                          📊 Estado:
                        </Typography>
                        <Chip 
                          label={formulario.estado || 'Sin estado'} 
                          size="small" 
                          color="info" 
                          variant="outlined"
                        />
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography component="span" sx={{ fontWeight: 600, color: 'text.primary' }}>
                          🏷️ Versión:
                        </Typography>
                        <Typography component="span" color="text.secondary">
                          {formulario.version || 'N/A'}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                  
                  {/* Lista de preguntas */}
                  <Box>
                    <Typography variant="subtitle2" color="primary.main" sx={{ fontWeight: 700, mb: 2 }}>
                      ❓ Preguntas del Formulario
                    </Typography>
                    
                    {contarPreguntas(formulario) > 0 ? (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {(Array.isArray(formulario.secciones)
                          ? formulario.secciones
                          : (typeof formulario.secciones === 'object' ? Object.values(formulario.secciones) : [])
                        ).map((seccion, sidx) => (
                          <Box key={sidx} sx={{
                            bgcolor: 'background.paper',
                            borderRadius: 2,
                            p: isSmallMobile ? 2 : 3,
                            border: `1px solid ${alpha(theme.palette.divider, 0.2)}`
                          }}>
                            <Typography variant="subtitle2" color="primary.main" sx={{ fontWeight: 600, mb: 1 }}>
                              📝 {seccion.nombre || `Sección ${sidx + 1}`}
                            </Typography>
                            <Box component="ul" sx={{ 
                              margin: 0, 
                              paddingLeft: isSmallMobile ? 2 : 3,
                              listStyle: 'none',
                              '& li': {
                                mb: 0.5,
                                '&:before': {
                                  content: '"•"',
                                  color: theme.palette.primary.main,
                                  fontWeight: 'bold',
                                  display: 'inline-block',
                                  width: '1em',
                                  marginLeft: '-1em'
                                }
                              }
                            }}>
                              {(seccion.preguntas || []).map((pregunta, pidx) => (
                                <Box component="li" key={sidx + '-' + pidx}>
                                  <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                                    {typeof pregunta === "string"
                                      ? pregunta
                                      : (pregunta.titulo || pregunta.texto || pregunta.pregunta || '(Sin texto)')}
                                  </Typography>
                                </Box>
                              ))}
                            </Box>
                          </Box>
                        ))}
                      </Box>
                    ) : (
                      <Box sx={{
                        bgcolor: alpha(theme.palette.warning.main, 0.05),
                        borderRadius: 2,
                        p: isSmallMobile ? 2 : 3,
                        border: `1px solid ${alpha(theme.palette.warning.main, 0.1)}`,
                        textAlign: 'center'
                      }}>
                        <Typography variant="body2" color="warning.main" sx={{ fontWeight: 600 }}>
                          ⚠️ Sin preguntas definidas
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Box>
              </AccordionDetails>
            </Accordion>
          </Card>
        ))}
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
      
      {openEditModal && formularioEdit && (
        <EditarFormularioModal
          open={openEditModal}
          handleClose={handleCloseEditModal}
          handleEditFormulario={handleEditFormulario}
          formulario={formularioEdit}
          handleInputChange={handleEditInputChange}
          loading={editLoading}
        />
      )}
    </Box>
  );
};

export default FormulariosAccordionList; 