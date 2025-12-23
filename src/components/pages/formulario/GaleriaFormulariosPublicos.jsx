import React, { useEffect, useState, useMemo } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { dbAudit } from '../../../firebaseControlFile';
import { formularioService } from '../../../services/formularioService';
import {
  Box, Typography, Accordion, AccordionSummary, AccordionDetails, Chip, Button, Grid, Alert, TextField, InputAdornment, Select, MenuItem, Rating, Stack, Tooltip, Avatar, CircularProgress
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SearchIcon from '@mui/icons-material/Search';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const FILTROS = [
  { value: 'todos', label: 'Todos' },
  { value: 'masCopiados', label: 'Más copiados' },
  { value: 'mejorValorados', label: 'Mejor valorados' },
  { value: 'menosPreguntas', label: 'Menos preguntas' },
  { value: 'masPreguntas', label: 'Más preguntas' }
];

const GaleriaFormulariosPublicos = ({ onCopiar }) => {
  const [formularios, setFormularios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtro, setFiltro] = useState('todos');
  const [copiandoId, setCopiandoId] = useState(null);
  const [ratingLoading, setRatingLoading] = useState(null);
  const [copiadoExitoso, setCopiadoExitoso] = useState(null);
  const [misFormulariosCopiados, setMisFormulariosCopiados] = useState([]);
  const navigate = useNavigate();
  const { userProfile } = useAuth();

  useEffect(() => {
    const fetchPublicForms = async () => {
      setLoading(true);
      const q = query(collection(dbAudit, 'formularios'), where('esPublico', '==', true));
      const snapshot = await getDocs(q);
      setFormularios(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
      console.debug('[GaleriaFormulariosPublicos] Formularios públicos cargados:', snapshot.docs.length);
    };
    fetchPublicForms();
  }, []);

  // Cargar formularios del usuario para verificar cuáles ya tiene copiados
  useEffect(() => {
    const fetchMisFormularios = async () => {
      if (!userProfile) return;
      
      try {
        const q = query(
          collection(dbAudit, 'formularios'), 
          where('creadorId', '==', userProfile.uid),
          where('esPublico', '==', false)
        );
        const snapshot = await getDocs(q);
        const misFormularios = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Crear un mapa de formularios copiados basado en el formularioOriginalId o nombre
        const formulariosCopiados = misFormularios.filter(form => {
          // Buscar si hay un formulario público que ya fue copiado por este usuario
          return formularios.some(formPublico => 
            (form.formularioOriginalId === formPublico.id) || // Copia directa por ID
            (form.nombre === formPublico.nombre && 
             formPublico.creadorId !== userProfile.uid && // No es propio
             form.creadorId === userProfile.uid) // Es una copia del usuario actual
          );
        });
        
        console.debug('[GaleriaFormulariosPublicos] Formularios copiados detectados:', formulariosCopiados.map(f => f.nombre));
        
        setMisFormulariosCopiados(formulariosCopiados);
        console.debug('[GaleriaFormulariosPublicos] Formularios del usuario cargados:', misFormularios.length);
      } catch (error) {
        console.error('Error al cargar formularios del usuario:', error);
      }
    };
    
    fetchMisFormularios();
  }, [userProfile, formularios]);

  // Filtro y búsqueda en frontend
  const formulariosFiltrados = useMemo(() => {
    let lista = [...formularios];
    if (busqueda.trim()) {
      const b = busqueda.trim().toLowerCase();
      lista = lista.filter(f =>
        (f.nombre?.toLowerCase().includes(b) ||
         f.creadorEmail?.toLowerCase().includes(b) ||
         f.creadorDisplayName?.toLowerCase?.().includes(b))
      );
    }
    switch (filtro) {
      case 'masCopiados':
        lista.sort((a, b) => (b.copiadoCount || 0) - (a.copiadoCount || 0));
        break;
      case 'mejorValorados':
        lista.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'menosPreguntas':
        lista.sort((a, b) =>
          (a.secciones?.reduce((acc, s) => acc + (s.preguntas?.length || 0), 0) || 0) -
          (b.secciones?.reduce((acc, s) => acc + (s.preguntas?.length || 0), 0) || 0)
        );
        break;
      case 'masPreguntas':
        lista.sort((a, b) =>
          (b.secciones?.reduce((acc, s) => acc + (s.preguntas?.length || 0), 0) || 0) -
          (a.secciones?.reduce((acc, s) => acc + (s.preguntas?.length || 0), 0) || 0)
        );
        break;
      default:
        break;
    }
    return lista;
  }, [formularios, busqueda, filtro]);

  // Copiar formulario: incrementa contador en Firestore y copia realmente el formulario
  const handleCopiar = async (form) => {
    setCopiandoId(form.id);
    try {
      // Verificar si este usuario ya copió este formulario antes
      const yaCopiadoAntes = misFormulariosCopiados.some(
        (copiado) => (copiado.formularioOriginalId === form.id) || 
                     (copiado.nombre === form.nombre && copiado.creadorId === userProfile?.uid)
      );
      
      // También verificar si el usuario ya está en la lista de usuarios que copiaron
      const usuarioYaCopio = form.usuariosQueCopiaron?.includes(userProfile?.uid) || false;
      
      // Solo incrementar contador si es la primera vez que este usuario copia este formulario
      if (!yaCopiadoAntes && !usuarioYaCopio) {
        const usuariosQueCopiaron = form.usuariosQueCopiaron || [];
        await formularioService.incrementarContadorCopias(form.id, userProfile.uid, usuariosQueCopiaron);
        console.debug('[GaleriaFormulariosPublicos] Contador incrementado - primera copia del usuario');
      } else {
        console.debug('[GaleriaFormulariosPublicos] No se incrementa contador - usuario ya copió este formulario antes');
      }
      
      // Copiar realmente el formulario a la cuenta del usuario
      if (userProfile) {
        await formularioService.copiarFormularioPublico(form, userProfile);
        console.debug('[GaleriaFormulariosPublicos] Formulario copiado a sistema:', userProfile.uid);
      }
      
      // Llamar función onCopiar si existe (para compatibilidad)
      onCopiar && onCopiar(form);
      
      // Actualizar estado local solo si es la primera copia
      if (!yaCopiadoAntes && !usuarioYaCopio) {
        setFormularios(prev => prev.map(f => f.id === form.id ? { 
          ...f, 
          copiadoCount: (f.copiadoCount || 0) + 1,
          usuariosQueCopiaron: [...(f.usuariosQueCopiaron || []), userProfile.uid]
        } : f));
      }
      
      console.log('[GaleriaFormulariosPublicos] Formulario copiado:', form.id);
      
      // Actualizar lista de formularios copiados
      setMisFormulariosCopiados(prev => [...prev, { ...form, creadorId: userProfile.uid }]);
      
      // Mostrar mensaje de éxito
      setCopiadoExitoso(form.id);
      setTimeout(() => setCopiadoExitoso(null), 2000);
    } catch (e) {
      console.error('Error al copiar formulario:', e);
    } finally {
      setCopiandoId(null);
    }
  };

  // Puntuar formulario: rating anónimo, promedio simple
  const handlePuntuar = async (form, value) => {
    setRatingLoading(form.id);
    try {
      const ratingsCount = (form.ratingsCount || 0) + 1;
      const newRating = ((form.rating || 0) * (form.ratingsCount || 0) + value) / ratingsCount;
      await formularioService.actualizarRating(form.id, newRating, ratingsCount);
      setFormularios(prev => prev.map(f => f.id === form.id ? { ...f, rating: newRating, ratingsCount } : f));
      console.log('[GaleriaFormulariosPublicos] Formulario puntuado:', form.id, value);
    } catch (e) {
      console.error('Error al puntuar:', e);
    } finally {
      setRatingLoading(null);
    }
  };

  // Obtener UID del usuario actual (desde localStorage)
  const userInfo = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('userInfo'));
    } catch {
      return null;
    }
  }, []);
  const myUid = userInfo?.uid;

  if (loading) return <Alert severity="info">Cargando formularios públicos...</Alert>;
  if (formularios.length === 0) return <Alert severity="info">No hay formularios públicos aún.</Alert>;

  return (
    <Box sx={{ p: 3 }}>
      {/* Botón Volver */}
      <Button
        variant="outlined"
        startIcon={<ArrowBackIcon />}
        onClick={() => {
          console.debug('[GaleriaFormulariosPublicos] Volver a /editar');
          navigate('/editar');
        }}
        aria-label="Volver a edición"
        sx={{ mb: 2 }}
      >
        Volver
      </Button>
      {/* Título */}
      <Typography variant="h5" gutterBottom>Galería de Formularios Públicos</Typography>
      
      {/* Alerta para usuarios no autenticados */}
      {!userProfile && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Debes iniciar sesión para poder copiar formularios a tu sistema.
        </Alert>
      )}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
        <TextField
          placeholder="Buscar por nombre o creador..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          size="small"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            )
          }}
          sx={{ minWidth: 220 }}
        />
        <Select
          value={filtro}
          onChange={e => setFiltro(e.target.value)}
          size="small"
          sx={{ minWidth: 180 }}
        >
          {FILTROS.map(f => <MenuItem key={f.value} value={f.value}>{f.label}</MenuItem>)}
        </Select>
      </Stack>
      <Grid container spacing={2}>
        {formulariosFiltrados.map(form => {
          const esPropio = form.creadorId && myUid && form.creadorId === myUid;
          const yaCopiado = misFormulariosCopiados.some(
            (copiado) => (copiado.formularioOriginalId === form.id) || 
                         (copiado.nombre === form.nombre && copiado.creadorId === userProfile?.uid)
          );
          
          // Debug: mostrar información sobre formularios copiados
          if (form.nombre === 'RGRL') {
            console.debug('[DEBUG] Formulario RGRL:', {
              formId: form.id,
              misFormulariosCopiados: misFormulariosCopiados.map(f => ({ 
                nombre: f.nombre, 
                formularioOriginalId: f.formularioOriginalId,
                creadorId: f.creadorId 
              })),
              yaCopiado
            });
          }
          return (
            <Grid item xs={12} key={form.id}>
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" sx={{ display: 'inline', mr: 1 }}>{form.nombre}</Typography>
                    <Chip label={`Creador: ${form.creadorEmail || form.creadorDisplayName || 'N/A'}`} size="small" sx={{ ml: 1 }} />
                    <Chip label={`Secciones: ${Array.isArray(form.secciones) ? form.secciones.length : 0}`} size="small" sx={{ ml: 1 }} />
                    <Chip label={`Preguntas: ${Array.isArray(form.secciones) ? form.secciones.reduce((acc, s) => acc + (Array.isArray(s.preguntas) ? s.preguntas.length : 0), 0) : 0}`} size="small" sx={{ ml: 1 }} />
                    <Chip label={`Copias: ${form.copiadoCount || 0}`} size="small" color="info" sx={{ ml: 1 }} />
                    <Tooltip title={form.rating ? `Valoración: ${form.rating.toFixed(2)} (${form.ratingsCount || 0} votos)` : 'Sin puntuación'}>
                      <span>
                        <Rating
                          value={form.rating || 0}
                          precision={0.5}
                          readOnly
                          size="small"
                          sx={{ ml: 1, verticalAlign: 'middle' }}
                        />
                      </span>
                    </Tooltip>
                  </Box>
                  <Tooltip title={!userProfile ? 'Debes iniciar sesión para copiar formularios' : 
                                 esPropio ? 'No puedes copiar tu propio formulario' :
                                 yaCopiado ? 'Ya tienes este formulario copiado' : 'Copiar a mi sistema'}>
                    <span>
                      <Button
                        variant="contained"
                        startIcon={<ContentCopyIcon />}
                        onClick={e => { e.stopPropagation(); handleCopiar(form); }}
                        disabled={copiandoId === form.id || esPropio || !userProfile || yaCopiado}
                        sx={{ ml: 2 }}
                                              >
                          {copiandoId === form.id ? <CircularProgress size={18} /> : 
                           copiadoExitoso === form.id ? '¡Copiado!' : 
                           yaCopiado ? 'Ya copiado' : 'Copiar'}
                        </Button>
                    </span>
                  </Tooltip>
                </AccordionSummary>
                <AccordionDetails>
                  <Box>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>Secciones y Preguntas:</Typography>
                    {Array.isArray(form.secciones) && form.secciones.length > 0 ? (
                      form.secciones.map((sec, idx) => (
                        <Box key={idx} sx={{ mb: 2, pl: 1 }}>
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>{sec.nombre || `Sección ${idx + 1}`}</Typography>
                          {Array.isArray(sec.preguntas) && sec.preguntas.length > 0 ? (
                            <ul style={{ margin: 0, paddingLeft: 18 }}>
                              {sec.preguntas.map((preg, i) => (
                                <li key={i}>
                                  <Typography variant="body2">
                                    {typeof preg === 'string' ? preg : preg.texto || preg.pregunta || `Pregunta ${i + 1}`}
                                  </Typography>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <Typography variant="body2" color="text.secondary">Sin preguntas</Typography>
                          )}
                        </Box>
                      ))
                    ) : (
                      <Typography variant="body2" color="text.secondary">Sin secciones</Typography>
                    )}
                    <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Typography variant="body2">¿Te gustó este formulario?</Typography>
                      <Tooltip title={esPropio ? 'No puedes puntuar tu propio formulario' : 'Puntuar'}>
                        <span>
                          <Rating
                            value={form.rating || 0}
                            precision={1}
                            onChange={(_, value) => value && !esPropio && handlePuntuar(form, value)}
                            disabled={!!ratingLoading || esPropio}
                          />
                        </span>
                      </Tooltip>
                      {ratingLoading === form.id && <CircularProgress size={18} />}
                    </Box>
                  </Box>
                </AccordionDetails>
              </Accordion>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
};

export default GaleriaFormulariosPublicos; 