import logger from '@/utils/logger';
import React, { useEffect, useState, useMemo } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { dbAudit } from '../../../firebaseControlFile';
import { firestoreRoutesCore } from '../../../core/firestore/firestoreRoutes.core';
import { formularioService } from '../../../services/formularioService';
import {
  Box, Typography, Accordion, AccordionSummary, AccordionDetails, Chip, Button, Grid, Alert, TextField, InputAdornment, Select, MenuItem, Rating, Stack, Tooltip, CircularProgress
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SearchIcon from '@mui/icons-material/Search';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/context/AuthContext';

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
  // Set de IDs de formularios_publicos que el usuario ya copió
  const [copiadosDesdeIds, setCopiadosDesdeIds] = useState(new Set());
  const navigate = useNavigate();
  const { userProfile } = useAuth();

  // Cargar galería desde formularios_publicos
  useEffect(() => {
    const fetchPublicForms = async () => {
      setLoading(true);
      try {
        const snapshot = await getDocs(collection(dbAudit, 'formularios_publicos'));
        setFormularios(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        logger.debug('[GaleriaFormulariosPublicos] Formularios públicos cargados:', snapshot.docs.length);
      } catch (error) {
        logger.error('[GaleriaFormulariosPublicos] Error al cargar galería:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPublicForms();
  }, []);

  // Cargar IDs de formularios que el usuario ya copió (desde su colección owner-centric)
  useEffect(() => {
    const fetchMisCopiados = async () => {
      if (!userProfile?.ownerId) return;
      try {
        const snapshot = await getDocs(
          collection(dbAudit, ...firestoreRoutesCore.formularios(userProfile.ownerId))
        );
        const copiados = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(f => !!f.copiadoDesde);
        setCopiadosDesdeIds(new Set(copiados.map(f => f.copiadoDesde)));
        logger.debug('[GaleriaFormulariosPublicos] IDs copiados del usuario:', copiados.length);
      } catch (error) {
        logger.error('[GaleriaFormulariosPublicos] Error al cargar copiados:', error);
      }
    };
    fetchMisCopiados();
  }, [userProfile, formularios]);

  // Filtro y búsqueda en frontend
  const formulariosFiltrados = useMemo(() => {
    let lista = [...formularios];
    if (busqueda.trim()) {
      const b = busqueda.trim().toLowerCase();
      lista = lista.filter(f =>
        (f.nombre?.toLowerCase().includes(b) ||
         f.creadorEmail?.toLowerCase().includes(b) ||
         f.creadorNombre?.toLowerCase?.().includes(b))
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

  // Copiar formulario desde la galería
  const handleCopiar = async (form) => {
    setCopiandoId(form.id);
    try {
      const yaCopiado = copiadosDesdeIds.has(form.id) || (form.usuariosQueCopiaron?.includes(userProfile?.uid) ?? false);

      if (!yaCopiado) {
        await formularioService.incrementarContadorCopias(
          form.id,
          userProfile.uid,
          form.usuariosQueCopiaron || []
        );
        setFormularios(prev => prev.map(f => f.id === form.id ? {
          ...f,
          copiadoCount: (f.copiadoCount || 0) + 1,
          usuariosQueCopiaron: [...(f.usuariosQueCopiaron || []), userProfile.uid]
        } : f));
      }

      if (userProfile) {
        await formularioService.copiarFormularioPublico(form, userProfile);
        logger.debug('[GaleriaFormulariosPublicos] Formulario copiado a sistema:', userProfile.uid);
      }

      onCopiar && onCopiar(form);

      setCopiadosDesdeIds(prev => new Set([...prev, form.id]));
      setCopiadoExitoso(form.id);
      setTimeout(() => setCopiadoExitoso(null), 2000);
      logger.debug('[GaleriaFormulariosPublicos] Formulario copiado:', form.id);
    } catch (e) {
      logger.error('Error al copiar formulario:', e);
    } finally {
      setCopiandoId(null);
    }
  };

  // Puntuar formulario
  const handlePuntuar = async (form, value) => {
    setRatingLoading(form.id);
    try {
      const ratingsCount = (form.ratingsCount || 0) + 1;
      const newRating = ((form.rating || 0) * (form.ratingsCount || 0) + value) / ratingsCount;
      await formularioService.actualizarRating(form.id, newRating, ratingsCount);
      setFormularios(prev => prev.map(f => f.id === form.id ? { ...f, rating: newRating, ratingsCount } : f));
      logger.debug('[GaleriaFormulariosPublicos] Formulario puntuado:', form.id, value);
    } catch (e) {
      logger.error('Error al puntuar:', e);
    } finally {
      setRatingLoading(null);
    }
  };

  if (loading) return <Alert severity="info">Cargando formularios públicos...</Alert>;
  if (formularios.length === 0) return <Alert severity="info">No hay formularios públicos aún.</Alert>;

  return (
    <Box sx={{ p: 3 }}>
      {/* Botón Volver */}
      <Button
        variant="outlined"
        startIcon={<ArrowBackIcon />}
        onClick={() => {
          logger.debug('[GaleriaFormulariosPublicos] Volver a /editar');
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
          const esPropio = !!userProfile?.uid && form.creadorId === userProfile.uid;
          const yaCopiado = copiadosDesdeIds.has(form.id) || (form.usuariosQueCopiaron?.includes(userProfile?.uid) ?? false);

          return (
            <Grid item xs={12} key={form.id}>
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" sx={{ display: 'inline', mr: 1 }}>{form.nombre}</Typography>
                    {/* Chips de estado */}
                    <Chip label="Público" size="small" color="primary" variant="outlined" sx={{ ml: 1 }} />
                    {esPropio && (
                      <Chip label="Propio" size="small" color="info" sx={{ ml: 1 }} />
                    )}
                    {yaCopiado && (
                      <Chip label="Ya copiado" size="small" color="success" sx={{ ml: 1 }} />
                    )}
                    {/* Chips de metadata */}
                    <Chip label={`Creador: ${form.creadorEmail || form.creadorNombre || 'N/A'}`} size="small" sx={{ ml: 1 }} />
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
                                 yaCopiado ? 'Ya tenés este formulario copiado' : 'Copiar a mi sistema'}>
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
