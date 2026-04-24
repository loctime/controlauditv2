import logger from '@/utils/logger';
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Box, Tabs, Tab, Typography, Accordion, AccordionSummary, AccordionDetails,
  Chip, Button, TextField, Paper, CircularProgress, Alert,
  IconButton, useTheme, useMediaQuery,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import RefreshIcon from '@mui/icons-material/Refresh';
import { formularioService } from '../../../services/formularioService';
import { useAuth } from '@/components/context/AuthContext';
import { useSearchParams } from 'react-router-dom';
import Swal from 'sweetalert2';
import { useFormulariosData } from './hooks/useFormulariosData';
import { useFormularioPermisos } from './hooks/useFormularioPermisos';
import { useFormularioSeleccionado } from './hooks/useFormularioSeleccionado';
import EditarSeccionYPreguntas from './EditarSeccionYPreguntas';

function TabPanel({ children, value, index }) {
  return value === index ? <Box sx={{ pt: 3 }}>{children}</Box> : null;
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

  // ── Tab activo ────────────────────────────────────────────────────────────
  const tabParam = parseInt(searchParams.get('tab') ?? '0', 10);
  const activeTab = [0, 1].includes(tabParam) ? tabParam : 0;

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

  const emptyParams = useMemo(() => new URLSearchParams(), []);
  const noopSetParams = useCallback(() => {}, []);
  const { formularioSeleccionado, setFormularioSeleccionado, cargandoFormulario, handleChangeFormulario } =
    useFormularioSeleccionado(formularios, formulariosCompletos, emptyParams, noopSetParams);

  const [expanded, setExpanded] = useState(null);
  const [recargando, setRecargando] = useState(false);

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

  const handleEliminarFormulario = async (formulario) => {
    // Confirmación con SweetAlert2
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      html: `¿Deseas eliminar el formulario "<strong>${formulario.nombre}</strong>"?<br><br>Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      await formularioService.deleteFormulario(formulario.id, user, userProfile);

      // Invalidar cache offline después de eliminar formulario
      await invalidarCacheFormularios();

      // Recargar formularios del contexto después de un pequeño delay
      setTimeout(async () => {
        try {
          await getUserFormularios();
          await recargar();
        } catch (error) {
          logger.warn('⚠️ Error recargando formularios:', error);
        }
      }, 1000);

      // Mostrar mensaje de éxito
      await Swal.fire({
        icon: 'success',
        title: 'Formulario eliminado',
        text: `El formulario "${formulario.nombre}" ha sido eliminado correctamente.`,
        timer: 2000,
        showConfirmButton: false
      });

    } catch (error) {
      logger.error("[EditarFormulario] Error al eliminar formulario:", error);
      await Swal.fire({
        icon: 'error',
        title: 'Error al eliminar',
        text: 'No se pudo eliminar el formulario. Por favor, inténtalo de nuevo.',
        confirmButtonColor: '#3085d6'
      });
    }
  };

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
              const isExpanded = expanded === form.id;
              const numSecciones = contarSeccionesForm(form);
              const numPreguntas = contarPreguntas(form);

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
                        <Chip label={`${numSecciones} secc.`} size="small" variant="outlined" />
                        <Chip label={`${numPreguntas} preg.`} size="small" color="primary" variant="outlined" />
                        <Button
                          variant="outlined"
                          color="error"
                          size="small"
                          startIcon={<DeleteIcon />}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEliminarFormulario(form);
                          }}
                          sx={{ 
                            minWidth: isMobile ? '100%' : 100,
                            fontWeight: 600,
                            borderRadius: 2,
                            '&:hover': {
                              transform: 'translateY(-1px)',
                              boxShadow: '0 4px 12px rgba(211,47,47,0.15)',
                              transition: 'all 0.2s ease'
                            },
                            transition: 'all 0.2s ease'
                          }}
                        >
                          🗑️ Eliminar
                        </Button>
                      </Box>
                    </Box>
                  </AccordionSummary>

                  <AccordionDetails sx={{ p: isSmall ? 1.5 : 2.5 }}>
                    {/* Metadata */}
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
    </Box>
  );
};

export default EditarFormulario;
