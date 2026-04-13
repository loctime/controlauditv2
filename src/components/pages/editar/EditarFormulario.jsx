import logger from '@/utils/logger';
import { FEATURES } from '../../../config/features';
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Box, Tabs, Tab, Typography, Accordion, AccordionSummary, AccordionDetails,
  Chip, Button, TextField, Paper, CircularProgress, Alert, Grid, Rating, Stack,
  Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, InputAdornment,
  Select, MenuItem, Divider, IconButton, useTheme, useMediaQuery,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import { collection, getDocs } from 'firebase/firestore';
import { dbAudit } from '../../../firebaseControlFile';
import { firestoreRoutesCore } from '../../../core/firestore/firestoreRoutes.core';
import { formularioService } from '../../../services/formularioService';
import { useAuth } from '@/components/context/AuthContext';
import { useSearchParams } from 'react-router-dom';
import Swal from 'sweetalert2';
import { useFormulariosData } from './hooks/useFormulariosData';
import { useFormularioPermisos } from './hooks/useFormularioPermisos';
import { useFormularioSeleccionado } from './hooks/useFormularioSeleccionado';
import { usePermissions } from '../admin/hooks/usePermissions';
import EditarSeccionYPreguntas from './EditarSeccionYPreguntas';

const FILTROS_GALERIA = [
  { value: 'todos', label: 'Todos' },
  { value: 'masCopiados', label: 'Más copiados' },
  { value: 'mejorValorados', label: 'Mejor valorados' },
  { value: 'menosPreguntas', label: 'Menos preguntas' },
  { value: 'masPreguntas', label: 'Más preguntas' },
];

function TabPanel({ children, value, index }) {
  return value === index ? <Box sx={{ pt: 3 }}>{children}</Box> : null;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function getBadgeFormulario(form) {
  if (form.copiadoDesde) return { label: '📥 Copiado de galería', color: 'warning' };
  if (form.esPublico) return { label: '🌐 Público en galería', color: 'success' };
  return { label: '🔒 Privado', color: 'default' };
}

function contarPreguntas(form) {
  const secs = Array.isArray(form.secciones)
    ? form.secciones
    : typeof form.secciones === 'object' ? Object.values(form.secciones || {}) : [];
  return secs.reduce((acc, s) => acc + (Array.isArray(s.preguntas) ? s.preguntas.length : 0), 0);
}

function contarSeccionesForm(form) {
  if (Array.isArray(form.secciones)) return form.secciones.length;
  if (typeof form.secciones === 'object') return Object.keys(form.secciones || {}).length;
  return 0;
}

async function invalidarCacheFormularios() {
  try {
    if (!window.indexedDB) return;
    const request = indexedDB.open('controlaudit_offline_v1', 2);
    await new Promise((resolve, reject) => {
      request.onsuccess = (ev) => {
        const db = ev.target.result;
        if (!db.objectStoreNames.contains('settings')) { resolve(); return; }
        const tx = db.transaction(['settings'], 'readwrite');
        tx.objectStore('settings').get('complete_user_cache').onsuccess = (e2) => {
          const cached = e2.target.result;
          if (cached?.value) {
            cached.value.formulariosTimestamp = 0;
            cached.value.timestamp = Date.now();
            tx.objectStore('settings').put(cached).onsuccess = () => resolve();
          } else resolve();
        };
      };
      request.onerror = (ev) => reject(ev.target.error);
    });
  } catch (e) {
    logger.warn('[EditarFormulario] Error invalidando cache:', e);
  }
}

// ─── Componente principal ────────────────────────────────────────────────────

const EditarFormulario = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'));
  const { user, userProfile, getUserFormularios } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const { canCompartirFormularios } = usePermissions();

  // ── Tab activo ────────────────────────────────────────────────────────────
  const tabParam = parseInt(searchParams.get('tab') ?? '0', 10);
  const activeTab = [0, 1, 2].includes(tabParam) ? tabParam : 0;

  const handleTabChange = useCallback((_, newValue) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.set('tab', String(newValue));
      return next;
    });
  }, [setSearchParams]);

  // ── TAB 1: Mis formularios ────────────────────────────────────────────────
  const { formularios, formulariosCompletos, loading, recargar } = useFormulariosData(user, userProfile);
  const { puedeEditar, puedeEliminar } = useFormularioPermisos(user, userProfile);

  // Pasamos params vacíos para que el hook no interfiera con nuestra gestión de URL
  const emptyParams = useMemo(() => new URLSearchParams(), []);
  const noopSetParams = useCallback(() => {}, []);
  const { formularioSeleccionado, setFormularioSeleccionado, cargandoFormulario, handleChangeFormulario } =
    useFormularioSeleccionado(formularios, formulariosCompletos, emptyParams, noopSetParams);

  const [expanded, setExpanded] = useState(null);
  const [recargando, setRecargando] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  // Auto-expandir desde ?id= en URL (ej: navegación desde PerfilFormularios)
  const initialIdRef = useRef(searchParams.get('id'));
  useEffect(() => {
    if (initialIdRef.current && formularios.length > 0 && !expanded) {
      const id = initialIdRef.current;
      initialIdRef.current = null;
      setExpanded(id);
      handleChangeFormulario({ target: { value: id } });
      setSearchParams(prev => {
        const next = new URLSearchParams(prev);
        next.delete('id');
        return next;
      });
    }
  }, [formularios]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleExpandAccordion = useCallback((formularioId) => {
    if (expanded === formularioId) {
      setExpanded(null);
    } else {
      setExpanded(formularioId);
      handleChangeFormulario({ target: { value: formularioId } });
    }
  }, [expanded, handleChangeFormulario]);

  const handleRecargar = useCallback(() => {
    setRecargando(true);
    recargar();
    setTimeout(() => {
      setRecargando(false);
      Swal.fire({ icon: 'success', title: 'Lista actualizada', timer: 1200, showConfirmButton: false });
    }, 1000);
  }, [recargar]);

  const handleCompartir = useCallback(async (form) => {
    if (!canCompartirFormularios) return;
    const existing = await formularioService.getSnapshotPublico(form.id);
    if (existing) {
      const result = await Swal.fire({
        title: 'Actualizar versión pública',
        text: '¿Querés actualizar la versión pública con los cambios actuales?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sí, actualizar',
        cancelButtonText: 'Cancelar',
      });
      if (!result.isConfirmed) return;
    }
    try {
      const { publicSharedId } = await formularioService.publicarFormulario(form.id, userProfile, form);
      setShareLink(`${window.location.origin}/formularios/public/${publicSharedId}`);
      setShareDialogOpen(true);
    } catch (e) {
      logger.error('[EditarFormulario] Error al compartir:', e);
      Swal.fire('Error', 'No se pudo compartir el formulario.', 'error');
    }
  }, [canCompartirFormularios, userProfile]);

  const handleCopyLink = useCallback(async () => {
    await navigator.clipboard.writeText(shareLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 1500);
  }, [shareLink]);

  // ── TAB 2: Crear nuevo ────────────────────────────────────────────────────
  const [nombreFormulario, setNombreFormulario] = useState('');
  const [secciones, setSecciones] = useState([{ nombre: '', preguntas: '' }]);

  const totalPreguntas = useMemo(
    () => secciones.reduce((acc, s) => acc + s.preguntas.split('\n').filter(p => p.trim()).length, 0),
    [secciones]
  );

  const handleAgregarSeccion = useCallback(() => setSecciones(s => [...s, { nombre: '', preguntas: '' }]), []);
  const handleEliminarSeccion = useCallback((i) => setSecciones(s => s.filter((_, idx) => idx !== i)), []);
  const handleSeccionNombre = useCallback((i, v) =>
    setSecciones(s => s.map((sec, idx) => idx === i ? { ...sec, nombre: v } : sec)), []);
  const handleSeccionPreguntas = useCallback((i, v) =>
    setSecciones(s => s.map((sec, idx) => idx === i ? { ...sec, preguntas: v } : sec)), []);

  const handleCrearFormulario = async (e) => {
    e.preventDefault();
    if (!user) { Swal.fire('Error', 'Debés iniciar sesión.', 'error'); return; }
    if (!nombreFormulario.trim()) { Swal.fire('Error', 'El nombre es requerido.', 'error'); return; }
    try {
      await formularioService.crearFormulario({
        nombre: nombreFormulario,
        secciones: secciones.map(s => ({
          nombre: s.nombre,
          preguntas: s.preguntas.split('\n').map(p => p.trim()).filter(Boolean),
        })),
      }, user, userProfile);

      await invalidarCacheFormularios();
      setTimeout(async () => { try { await getUserFormularios(); } catch {} }, 1000);

      Swal.fire({ icon: 'success', title: 'Formulario creado', timer: 1500, showConfirmButton: false });
      setNombreFormulario('');
      setSecciones([{ nombre: '', preguntas: '' }]);
      recargar();
      setSearchParams(prev => { const n = new URLSearchParams(prev); n.set('tab', '0'); return n; });
    } catch (e) {
      logger.error('[EditarFormulario] Error al crear formulario:', e);
      Swal.fire('Error', 'Error al crear el formulario.', 'error');
    }
  };

  // ── TAB 3: Galería pública ────────────────────────────────────────────────
  const [galeriaLoaded, setGaleriaLoaded] = useState(false);
  const [formulariosPublicos, setFormulariosPublicos] = useState([]);
  const [loadingGaleria, setLoadingGaleria] = useState(false);
  const [busquedaGaleria, setBusquedaGaleria] = useState('');
  const [filtroGaleria, setFiltroGaleria] = useState('todos');
  const [copiandoId, setCopiandoId] = useState(null);
  const [copiadoExitosoId, setCopiadoExitosoId] = useState(null);
  const [ratingLoadingId, setRatingLoadingId] = useState(null);
  const [copiadosDesdeIds, setCopiadosDesdeIds] = useState(new Set());

  useEffect(() => {
    if (activeTab !== 2 || galeriaLoaded) return;
    const fetchGaleria = async () => {
      setLoadingGaleria(true);
      try {
        const snap = await getDocs(collection(dbAudit, 'formularios_publicos'));
        setFormulariosPublicos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        setGaleriaLoaded(true);
      } catch (e) {
        logger.error('[EditarFormulario] Error cargando galería:', e);
      } finally {
        setLoadingGaleria(false);
      }
    };
    fetchGaleria();
  }, [activeTab, galeriaLoaded]);

  useEffect(() => {
    if (activeTab !== 2 || !userProfile?.ownerId) return;
    const fetchCopiados = async () => {
      try {
        const snap = await getDocs(collection(dbAudit, ...firestoreRoutesCore.formularios(userProfile.ownerId)));
        const ids = snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter(f => !!f.copiadoDesde)
          .map(f => f.copiadoDesde);
        setCopiadosDesdeIds(new Set(ids));
      } catch (e) {
        logger.error('[EditarFormulario] Error cargando copiados:', e);
      }
    };
    fetchCopiados();
  }, [activeTab, userProfile]);

  const formulariosFiltrados = useMemo(() => {
    let lista = [...formulariosPublicos];
    if (busquedaGaleria.trim()) {
      const b = busquedaGaleria.trim().toLowerCase();
      lista = lista.filter(f =>
        f.nombre?.toLowerCase().includes(b) ||
        f.creadorEmail?.toLowerCase().includes(b) ||
        f.creadorNombre?.toLowerCase().includes(b)
      );
    }
    switch (filtroGaleria) {
      case 'masCopiados': lista.sort((a, b) => (b.copiadoCount || 0) - (a.copiadoCount || 0)); break;
      case 'mejorValorados': lista.sort((a, b) => (b.rating || 0) - (a.rating || 0)); break;
      case 'menosPreguntas':
        lista.sort((a, b) =>
          (a.secciones?.reduce((acc, s) => acc + (s.preguntas?.length || 0), 0) || 0) -
          (b.secciones?.reduce((acc, s) => acc + (s.preguntas?.length || 0), 0) || 0));
        break;
      case 'masPreguntas':
        lista.sort((a, b) =>
          (b.secciones?.reduce((acc, s) => acc + (s.preguntas?.length || 0), 0) || 0) -
          (a.secciones?.reduce((acc, s) => acc + (s.preguntas?.length || 0), 0) || 0));
        break;
      default: break;
    }
    return lista;
  }, [formulariosPublicos, busquedaGaleria, filtroGaleria]);

  const handleCopiarGaleria = useCallback(async (form) => {
    setCopiandoId(form.id);
    try {
      const yaCopiado = copiadosDesdeIds.has(form.id) || (form.usuariosQueCopiaron?.includes(userProfile?.uid) ?? false);
      if (!yaCopiado) {
        await formularioService.incrementarContadorCopias(form.id, userProfile.uid, form.usuariosQueCopiaron || []);
        setFormulariosPublicos(prev => prev.map(f => f.id === form.id ? {
          ...f,
          copiadoCount: (f.copiadoCount || 0) + 1,
          usuariosQueCopiaron: [...(f.usuariosQueCopiaron || []), userProfile.uid],
        } : f));
      }
      if (userProfile) {
        await formularioService.copiarFormularioPublico(form, userProfile);
      }
      setCopiadosDesdeIds(prev => new Set([...prev, form.id]));
      setCopiadoExitosoId(form.id);
      setTimeout(() => setCopiadoExitosoId(null), 2000);
      recargar();
    } catch (e) {
      logger.error('[EditarFormulario] Error al copiar:', e);
    } finally {
      setCopiandoId(null);
    }
  }, [copiadosDesdeIds, userProfile, recargar]);

  const handlePuntuarGaleria = useCallback(async (form, value) => {
    setRatingLoadingId(form.id);
    try {
      const ratingsCount = (form.ratingsCount || 0) + 1;
      const newRating = ((form.rating || 0) * (form.ratingsCount || 0) + value) / ratingsCount;
      await formularioService.actualizarRating(form.id, newRating, ratingsCount);
      setFormulariosPublicos(prev => prev.map(f => f.id === form.id ? { ...f, rating: newRating, ratingsCount } : f));
    } catch (e) {
      logger.error('[EditarFormulario] Error al puntuar:', e);
    } finally {
      setRatingLoadingId(null);
    }
  }, []);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <Box sx={{ p: isSmall ? 1 : 2 }}>
      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        variant={isMobile ? 'fullWidth' : 'standard'}
        sx={{ borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab label="Mis formularios" />
        <Tab label="Crear nuevo" />
        {FEATURES.GALERIA_FORMULARIOS_PUBLICOS && <Tab label="Galería pública" />}
      </Tabs>

      {/* ═══════════════════════════════════════════════════════════════════
          TAB 1 — Mis formularios
      ═══════════════════════════════════════════════════════════════════ */}
      <TabPanel value={activeTab} index={0}>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={recargando ? <CircularProgress size={14} /> : <RefreshIcon />}
            onClick={handleRecargar}
            disabled={recargando}
          >
            Recargar
          </Button>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : formularios.length === 0 ? (
          <Alert severity="info">
            No tenés formularios. Usá la tab "Crear nuevo" para empezar.
          </Alert>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {formularios.map((form) => {
              const badge = getBadgeFormulario(form);
              const isExpanded = expanded === form.id;
              const numSecciones = contarSeccionesForm(form);
              const numPreguntas = contarPreguntas(form);

              const esLegacyCopia = !!form.formularioOriginalId && !form.copiadoDesde;
              const esCopiadoConMismoNombre = !!form.copiadoDesde && form.nombre === form.nombreOriginal;
              const compartirDeshabilitado = !canCompartirFormularios || esLegacyCopia || esCopiadoConMismoNombre;
              const tooltipCompartir = !canCompartirFormularios
                ? 'Sin permisos para compartir'
                : esLegacyCopia
                ? 'No podés compartir un formulario copiado'
                : esCopiadoConMismoNombre
                ? 'Cambiá el nombre para poder compartirlo'
                : form.esPublico
                ? 'Actualizar versión pública en la galería'
                : 'Compartir en la galería pública';

              return (
                <Accordion
                  key={form.id}
                  expanded={isExpanded}
                  onChange={() => handleExpandAccordion(form.id)}
                  sx={{
                    border: `1px solid ${alpha(theme.palette.divider, 0.4)}`,
                    borderRadius: '12px !important',
                    '&:before': { display: 'none' },
                    boxShadow: isExpanded
                      ? '0 4px 20px rgba(0,0,0,0.12)'
                      : '0 2px 6px rgba(0,0,0,0.06)',
                    transition: 'box-shadow 0.2s ease',
                  }}
                >
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{
                      display: 'flex',
                      flexDirection: isMobile ? 'column' : 'row',
                      alignItems: isMobile ? 'flex-start' : 'center',
                      gap: 1.5,
                      width: '100%',
                      pr: 1,
                    }}>
                      <Typography variant="subtitle1" fontWeight={700} sx={{ flex: 1 }}>
                        📋 {form.nombre}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                        <Chip label={badge.label} color={badge.color} size="small" variant="outlined" />
                        <Chip label={`${numSecciones} secc.`} size="small" variant="outlined" />
                        <Chip label={`${numPreguntas} preg.`} size="small" color="primary" variant="outlined" />
                      </Box>
                    </Box>
                  </AccordionSummary>

                  <AccordionDetails sx={{ p: isSmall ? 1.5 : 2.5 }}>
                    {/* Metadata inline (reemplaza FormularioDetalleCard) */}
                    <Box sx={{
                      display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2.5,
                      p: 1.5,
                      bgcolor: alpha(theme.palette.info.main, 0.05),
                      borderRadius: 2,
                      border: `1px solid ${alpha(theme.palette.info.main, 0.12)}`,
                    }}>
                      <Typography variant="caption" color="text.secondary">
                        <strong>Estado:</strong> {form.estado || 'activo'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        <strong>Versión:</strong> {form.version || '1.0'}
                      </Typography>
                      {form.creadorNombre && (
                        <Typography variant="caption" color="text.secondary">
                          <strong>Creador:</strong> {form.creadorNombre}
                        </Typography>
                      )}
                      {form.ultimaModificacion && (
                        <Typography variant="caption" color="text.secondary">
                          <strong>Modificado:</strong>{' '}
                          {form.ultimaModificacion?.toDate
                            ? form.ultimaModificacion.toDate().toLocaleString('es-ES')
                            : form.ultimaModificacion instanceof Date
                            ? form.ultimaModificacion.toLocaleString('es-ES')
                            : '—'}
                        </Typography>
                      )}
                    </Box>

                    {/* Editor de secciones y preguntas */}
                    {isExpanded && (
                      cargandoFormulario ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                          <CircularProgress />
                        </Box>
                      ) : formularioSeleccionado?.id === form.id ? (
                        <EditarSeccionYPreguntas
                          formularioSeleccionado={formularioSeleccionado}
                          setFormularioSeleccionado={setFormularioSeleccionado}
                          puedeEditar={puedeEditar(formularioSeleccionado)}
                          puedeEliminar={puedeEliminar(formularioSeleccionado)}
                        />
                      ) : null
                    )}

                    {/* Footer: compartir — oculto hasta activar GALERIA_FORMULARIOS_PUBLICOS */}
                    {FEATURES.GALERIA_FORMULARIOS_PUBLICOS && (
                      <>
                        <Divider sx={{ my: 2 }} />
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                          <Tooltip title={tooltipCompartir}>
                            <span>
                              <Button
                                variant="outlined"
                                size="small"
                                onClick={() => handleCompartir(form)}
                                disabled={compartirDeshabilitado}
                              >
                                {form.esPublico ? '🔄 Actualizar en galería' : '📤 Compartir a galería'}
                              </Button>
                            </span>
                          </Tooltip>
                        </Box>
                      </>
                    )}
                  </AccordionDetails>
                </Accordion>
              );
            })}
          </Box>
        )}
      </TabPanel>

      {/* ═══════════════════════════════════════════════════════════════════
          TAB 2 — Crear nuevo
      ═══════════════════════════════════════════════════════════════════ */}
      <TabPanel value={activeTab} index={1}>
        <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 3 }}>
          <Typography variant="h6" fontWeight={700}>Crear Nuevo Formulario</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Chip label={`${secciones.length} secciones`} color="primary" variant="outlined" size="small" />
            <Chip label={`${totalPreguntas} preguntas`} color="secondary" variant="outlined" size="small" />
          </Box>
        </Box>

        <form onSubmit={handleCrearFormulario}>
          <TextField
            required
            label="Nombre del Formulario"
            fullWidth
            value={nombreFormulario}
            onChange={e => setNombreFormulario(e.target.value)}
            sx={{ mb: 3 }}
          />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="subtitle1" fontWeight={600}>Secciones</Typography>
            <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleAgregarSeccion}>
              Agregar sección
            </Button>
          </Box>

          {secciones.map((sec, i) => {
            const pills = sec.preguntas.split('\n').map(p => p.trim()).filter(Boolean);
            return (
              <Paper
                key={i}
                sx={{ mb: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}
              >
                <Box sx={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  p: 1.5, bgcolor: 'grey.50', borderBottom: '1px solid', borderColor: 'divider',
                }}>
                  <Typography variant="subtitle2" fontWeight={600}>Sección {i + 1}</Typography>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleEliminarSeccion(i)}
                    aria-label={`Eliminar sección ${i + 1}`}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
                <Box sx={{ p: 2 }}>
                  <TextField
                    required
                    label="Nombre de la Sección"
                    fullWidth
                    size="small"
                    value={sec.nombre}
                    onChange={e => handleSeccionNombre(i, e.target.value)}
                    sx={{ mb: 1.5 }}
                  />
                  <TextField
                    required
                    label="Preguntas (una por línea)"
                    multiline
                    fullWidth
                    rows={4}
                    size="small"
                    value={sec.preguntas}
                    onChange={e => handleSeccionPreguntas(i, e.target.value)}
                    sx={{ mb: pills.length > 0 ? 1.5 : 0 }}
                  />
                  {pills.length > 0 && (
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                        Vista previa:
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {pills.map((p, pi) => (
                          <Chip
                            key={pi}
                            label={`${pi + 1}. ${p}`}
                            size="small"
                            variant="outlined"
                            color="primary"
                            sx={{ maxWidth: '100%' }}
                          />
                        ))}
                      </Box>
                    </Box>
                  )}
                </Box>
              </Paper>
            );
          })}

          <Box sx={{
            position: 'sticky', bottom: 0, bgcolor: 'background.paper',
            p: 2, borderTop: '1px solid', borderColor: 'divider',
            display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2,
          }}>
            <Button
              variant="outlined"
              onClick={() => { setNombreFormulario(''); setSecciones([{ nombre: '', preguntas: '' }]); }}
            >
              Limpiar
            </Button>
            <Button type="submit" variant="contained" startIcon={<SaveIcon />}>
              Guardar formulario
            </Button>
          </Box>
        </form>
      </TabPanel>

      {/* ═══════════════════════════════════════════════════════════════════
          TAB 3 — Galería pública (oculto hasta activar FEATURES.GALERIA_FORMULARIOS_PUBLICOS)
      ═══════════════════════════════════════════════════════════════════ */}
      {FEATURES.GALERIA_FORMULARIOS_PUBLICOS && <TabPanel value={activeTab} index={2}>
        <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Galería de Formularios Públicos</Typography>

        {!userProfile && (
          <Alert severity="info" sx={{ mb: 2 }}>Iniciá sesión para poder copiar formularios.</Alert>
        )}

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
          <TextField
            placeholder="Buscar por nombre o creador..."
            value={busquedaGaleria}
            onChange={e => setBusquedaGaleria(e.target.value)}
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start"><SearchIcon /></InputAdornment>
              ),
            }}
            sx={{ minWidth: 220 }}
          />
          <Select
            value={filtroGaleria}
            onChange={e => setFiltroGaleria(e.target.value)}
            size="small"
            sx={{ minWidth: 180 }}
          >
            {FILTROS_GALERIA.map(f => (
              <MenuItem key={f.value} value={f.value}>{f.label}</MenuItem>
            ))}
          </Select>
        </Stack>

        {loadingGaleria ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : formulariosPublicos.length === 0 ? (
          <Alert severity="info">No hay formularios públicos aún.</Alert>
        ) : (
          <Grid container spacing={2}>
            {formulariosFiltrados.map(form => {
              const esPropio = !!userProfile?.uid && form.creadorId === userProfile.uid;
              const yaCopiado = copiadosDesdeIds.has(form.id) || (form.usuariosQueCopiaron?.includes(userProfile?.uid) ?? false);
              const numPreg = (form.secciones || []).reduce((acc, s) => acc + (s.preguntas?.length || 0), 0);

              return (
                <Grid item xs={12} key={form.id}>
                  <Accordion sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: '8px !important',
                    '&:before': { display: 'none' },
                    boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                  }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Box sx={{ flex: 1, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle1" fontWeight={600} sx={{ mr: 0.5 }}>
                          {form.nombre}
                        </Typography>
                        <Chip label="Público" size="small" color="primary" variant="outlined" />
                        {esPropio && <Chip label="Propio" size="small" color="info" />}
                        {yaCopiado && <Chip label="Ya copiado" size="small" color="success" />}
                        <Chip label={`${form.secciones?.length || 0} secc.`} size="small" variant="outlined" />
                        <Chip label={`${numPreg} preg.`} size="small" variant="outlined" />
                        <Chip label={`${form.copiadoCount || 0} copias`} size="small" color="info" variant="outlined" />
                        <Rating value={form.rating || 0} precision={0.5} readOnly size="small" />
                      </Box>
                      <Tooltip title={
                        !userProfile ? 'Iniciá sesión para copiar' :
                        esPropio ? 'No podés copiar tu propio formulario' :
                        yaCopiado ? 'Ya lo tenés copiado' : 'Copiar a mi sistema'
                      }>
                        <span>
                          <Button
                            variant="contained"
                            size="small"
                            startIcon={<ContentCopyIcon />}
                            onClick={e => { e.stopPropagation(); handleCopiarGaleria(form); }}
                            disabled={copiandoId === form.id || esPropio || !userProfile || yaCopiado}
                            sx={{ ml: 2, flexShrink: 0 }}
                          >
                            {copiandoId === form.id ? <CircularProgress size={16} /> :
                             copiadoExitosoId === form.id ? '¡Copiado!' :
                             yaCopiado ? 'Ya copiado' : 'Copiar'}
                          </Button>
                        </span>
                      </Tooltip>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Typography variant="subtitle2" sx={{ mb: 1 }}>Secciones y preguntas:</Typography>
                      {(form.secciones || []).map((sec, si) => (
                        <Box key={si} sx={{ mb: 1.5, pl: 1 }}>
                          <Typography variant="body2" fontWeight={600}>
                            {sec.nombre || `Sección ${si + 1}`}
                          </Typography>
                          <Box component="ul" sx={{ m: 0, pl: 2 }}>
                            {(sec.preguntas || []).map((p, pi) => (
                              <Typography component="li" key={pi} variant="body2">
                                {typeof p === 'string' ? p : p.texto || p.pregunta || `Pregunta ${pi + 1}`}
                              </Typography>
                            ))}
                          </Box>
                        </Box>
                      ))}
                      <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography variant="body2">¿Te gustó?</Typography>
                        <Tooltip title={esPropio ? 'No podés puntuar tu propio formulario' : 'Puntuar'}>
                          <span>
                            <Rating
                              value={form.rating || 0}
                              precision={1}
                              onChange={(_, v) => v && !esPropio && handlePuntuarGaleria(form, v)}
                              disabled={!!ratingLoadingId || esPropio}
                            />
                          </span>
                        </Tooltip>
                        {ratingLoadingId === form.id && <CircularProgress size={18} />}
                      </Box>
                    </AccordionDetails>
                  </Accordion>
                </Grid>
              );
            })}
          </Grid>
        )}
      </TabPanel>}

      {/* Dialog: link de formulario compartido */}
      <Dialog open={shareDialogOpen} onClose={() => setShareDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Formulario publicado en galería</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>Compartí este link con otros administradores:</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TextField value={shareLink} fullWidth InputProps={{ readOnly: true }} size="small" />
            <Button onClick={handleCopyLink} startIcon={<ContentCopyIcon />} disabled={copiedLink}>
              {copiedLink ? '¡Copiado!' : 'Copiar'}
            </Button>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
            Cualquier administrador podrá ver y copiar este formulario a su sistema.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShareDialogOpen(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EditarFormulario;
