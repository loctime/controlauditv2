import React, { useState, useEffect } from 'react';
import {
  Typography, Chip, CircularProgress, Button, Tabs, Tab, Box,
  useTheme, useMediaQuery, alpha, TextField
} from '@mui/material';
import { Draw as DrawIcon, Share as ShareIcon, Edit as EditIcon, Delete as DeleteIcon, Save as SaveIcon, Cancel as CancelIcon, ContentCopy as CopyIcon } from '@mui/icons-material';
import { doc, updateDoc, deleteDoc, collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../../../firebaseConfig';
import { v4 as uuidv4 } from 'uuid';
import { usePermissions } from '../admin/hooks/usePermissions';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Swal from 'sweetalert2';

const PerfilFormularios = ({ formularios: formulariosProp, loading }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const { userProfile } = useAuth();

  const [activeTab, setActiveTab] = useState(0);
  const [formulariosPublicos, setFormulariosPublicos] = useState([]);
  const [loadingPublicos, setLoadingPublicos] = useState(false);
  const [copiandoId, setCopiandoId] = useState(null);
  const [misFormulariosCopiados, setMisFormulariosCopiados] = useState([]);

  const [seccionSeleccionada, setSeccionSeleccionada] = useState({}); // {formId: seccionIndex}
  const [modoEdicion, setModoEdicion] = useState({}); // {formId: seccionIndex: boolean}
  const [preguntasEditadas, setPreguntasEditadas] = useState({}); // {formId: {seccionIndex: [preguntas]}}
  const [guardando, setGuardando] = useState({}); // {formId: boolean}
  const [compartiendo, setCompartiendo] = useState({}); // {formId: boolean}
  const [formularios, setFormularios] = useState(formulariosProp || []); // Estado local para formularios
  const { canCompartirFormularios } = usePermissions();

  // Actualizar formularios cuando cambien las props
  React.useEffect(() => {
    setFormularios(formulariosProp || []);
  }, [formulariosProp]);

  // Cargar formularios públicos
  useEffect(() => {
    const fetchPublicForms = async () => {
      if (activeTab === 1) { // Solo cargar cuando esté en la pestaña de públicos
        setLoadingPublicos(true);
        try {
          const q = query(collection(db, 'formularios'), where('esPublico', '==', true));
          const snapshot = await getDocs(q);
          const publicForms = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setFormulariosPublicos(publicForms);
          console.debug('[PerfilFormularios] Formularios públicos cargados:', publicForms.length);
        } catch (error) {
          console.error('Error al cargar formularios públicos:', error);
        } finally {
          setLoadingPublicos(false);
        }
      }
    };

    fetchPublicForms();
  }, [activeTab]);

  // Cargar formularios copiados del usuario
  useEffect(() => {
    const fetchMisFormulariosCopiados = async () => {
      if (!userProfile || activeTab !== 1) return;
      
      try {
        const q = query(
          collection(db, 'formularios'), 
          where('creadorId', '==', userProfile.uid),
          where('esPublico', '==', false)
        );
        const snapshot = await getDocs(q);
        const misFormularios = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Filtrar formularios copiados
        const formulariosCopiados = misFormularios.filter(form => {
          return formulariosPublicos.some(formPublico => 
            (form.formularioOriginalId === formPublico.id) || 
            (form.nombre === formPublico.nombre && 
             formPublico.creadorId !== userProfile.uid && 
             form.creadorId === userProfile.uid)
          );
        });
        
        setMisFormulariosCopiados(formulariosCopiados);
        console.debug('[PerfilFormularios] Formularios copiados detectados:', formulariosCopiados.map(f => f.nombre));
      } catch (error) {
        console.error('Error al cargar formularios copiados:', error);
      }
    };

    fetchMisFormulariosCopiados();
  }, [userProfile, formulariosPublicos, activeTab]);

  // Función para actualizar un formulario específico en el estado local
  const updateFormularioLocal = (formId, updates) => {
    setFormularios(prev => prev.map(form => 
      form.id === formId ? { ...form, ...updates } : form
    ));
  };

  // Función para copiar formulario público
  const handleCopiarFormularioPublico = async (form) => {
    if (!userProfile) {
      Swal.fire('Error', 'Debes iniciar sesión para copiar formularios', 'error');
      return;
    }

    const yaCopiado = misFormulariosCopiados.some(
      (copiado) => (copiado.formularioOriginalId === form.id) || 
                   (copiado.nombre === form.nombre && copiado.creadorId === userProfile.uid)
    );

    if (yaCopiado) {
      Swal.fire('Información', 'Ya tienes este formulario copiado en tu sistema', 'info');
      return;
    }

    setCopiandoId(form.id);

    try {
      // Actualizar contador de copias en el formulario original
      await updateDoc(doc(db, 'formularios', form.id), {
        copiadoCount: (form.copiadoCount || 0) + 1,
        usuariosQueCopiaron: [...(form.usuariosQueCopiaron || []), userProfile.uid]
      });

      // Copiar el formulario a la cuenta del usuario
      const nuevoFormulario = {
        ...form,
        clienteAdminId: userProfile.clienteAdminId || userProfile.uid,
        creadorId: userProfile.uid,
        esPublico: false,
        publicSharedId: null,
        formularioOriginalId: form.id,
        createdAt: new Date()
      };
      delete nuevoFormulario.id;
      
      const docRef = await addDoc(collection(db, 'formularios'), nuevoFormulario);
      
      // Crear el objeto del formulario copiado con el ID generado
      const formularioCopiado = {
        id: docRef.id,
        ...nuevoFormulario
      };
      
      // Actualizar estado local de formularios propios (reactivo)
      setFormularios(prev => [...prev, formularioCopiado]);
      
      // Actualizar estado local de formularios copiados
      setMisFormulariosCopiados(prev => [...prev, formularioCopiado]);
      
      // Cambiar automáticamente a la pestaña "Mis Formularios" para mostrar el nuevo formulario
      setActiveTab(0);
      
      Swal.fire('Éxito', 'Formulario copiado exitosamente a tu sistema', 'success');
      console.debug('[PerfilFormularios] Formulario copiado:', form.id, '->', docRef.id);
    } catch (error) {
      console.error('Error al copiar formulario:', error);
      Swal.fire('Error', 'No se pudo copiar el formulario', 'error');
    } finally {
      setCopiandoId(null);
    }
  };

    const handleCompartir = async (form) => {
    if (!canCompartirFormularios) return;
    
    // Verificar si el formulario es propio (no copiado)
    if (form.formularioOriginalId) {
      console.warn('[PerfilFormularios] No se puede compartir un formulario copiado:', form.id);
      return;
    }
    
    setCompartiendo(prev => ({ ...prev, [form.id]: true }));
    
    try {
      if (form.esPublico && form.publicSharedId) {
        // Si ya está compartido, desactivar el compartir
        await updateDoc(doc(db, 'formularios', form.id), {
          esPublico: false,
          publicSharedId: null
        });
        console.debug('[PerfilFormularios] Formulario desactivado como público:', form.id);
        // Actualizar estado local reactivamente
        updateFormularioLocal(form.id, { esPublico: false, publicSharedId: null });
        Swal.fire('Éxito', 'El formulario ya no es público', 'success');
      } else {
        // Si no está compartido, activar el compartir
        const publicSharedId = uuidv4();
        await updateDoc(doc(db, 'formularios', form.id), {
          esPublico: true,
          publicSharedId
        });
        console.debug('[CompartirFormulario] Formulario actualizado como público:', form.id, publicSharedId);
        // Actualizar estado local reactivamente
        updateFormularioLocal(form.id, { esPublico: true, publicSharedId });
        
        const url = `${window.location.origin}/formularios/public/${publicSharedId}`;
        
                 // Mostrar modal con SweetAlert2
         Swal.fire({
           title: '¡Formulario Compartido!',
           html: `
             <div style="text-align: left; margin-bottom: 16px;">
               <p style="margin-bottom: 12px; font-weight: 500;">Comparte este link con otros administradores:</p>
               <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
                 <input 
                   id="shareLinkInput" 
                   value="${url}" 
                   readonly 
                   style="
                     flex: 1; 
                     padding: 8px 12px; 
                     border: 1px solid #ddd; 
                     border-radius: 4px; 
                     font-size: 0.875rem; 
                     background-color: #f5f5f5;
                     font-family: monospace;
                   "
                 />
                 <button 
                   id="copyButton" 
                   style="
                     padding: 8px 16px; 
                     background-color: #1976d2; 
                     color: white; 
                     border: none; 
                     border-radius: 4px; 
                     cursor: pointer;
                     font-size: 0.875rem;
                   "
                 >
                   Copiar
                 </button>
               </div>
               <p style="font-size: 0.875rem; color: #666; margin: 0;">
                 Cualquier administrador podrá ver y copiar este formulario a su sistema.
               </p>
             </div>
           `,
           icon: 'success',
           showConfirmButton: true,
           confirmButtonText: 'Cerrar',
           confirmButtonColor: '#1976d2',
           width: '500px',
           allowOutsideClick: false,
           allowEscapeKey: false,
           timer: undefined,
           timerProgressBar: false,
           didOpen: () => {
             // Agregar funcionalidad de copiar
             const copyButton = document.getElementById('copyButton');
             const shareLinkInput = document.getElementById('shareLinkInput');
             
             copyButton.addEventListener('click', async () => {
               try {
                 await navigator.clipboard.writeText(url);
                 copyButton.textContent = '¡Copiado!';
                 copyButton.style.backgroundColor = '#4caf50';
                 setTimeout(() => {
                   copyButton.textContent = 'Copiar';
                   copyButton.style.backgroundColor = '#1976d2';
                 }, 2000);
               } catch (error) {
                 console.error('Error al copiar:', error);
                 copyButton.textContent = 'Error';
                 copyButton.style.backgroundColor = '#f44336';
                 setTimeout(() => {
                   copyButton.textContent = 'Copiar';
                   copyButton.style.backgroundColor = '#1976d2';
                 }, 2000);
               }
             });
           }
         });
      }
    } catch (error) {
      console.error('Error al cambiar estado de compartir:', error);
      Swal.fire('Error', 'No se pudo cambiar el estado del formulario', 'error');
    } finally {
      setCompartiendo(prev => ({ ...prev, [form.id]: false }));
    }
  };



  const handleEliminarFormulario = async (form) => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: `¿Quieres eliminar el formulario "${form.nombre}"? ¡Esta acción no se puede deshacer!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await deleteDoc(doc(db, 'formularios', form.id));
        // Actualizar estado local reactivamente
        setFormularios(prev => prev.filter(f => f.id !== form.id));
        Swal.fire('Eliminado', 'El formulario ha sido eliminado exitosamente.', 'success');
      } catch (error) {
        console.error('Error al eliminar formulario:', error);
        Swal.fire('Error', 'No se pudo eliminar el formulario.', 'error');
      }
    }
  };

  // Calcular estadísticas del formulario
  const getFormularioStats = (form) => {
    const secciones = Array.isArray(form.secciones) ? form.secciones.length : 0;
    const preguntas = Array.isArray(form.secciones) 
      ? form.secciones.reduce((acc, s) => acc + (Array.isArray(s.preguntas) ? s.preguntas.length : 0), 0) 
      : 0;
    return { secciones, preguntas };
  };

  // Obtener las secciones del formulario con sus preguntas
  const getSeccionesFormulario = (form) => {
    if (!Array.isArray(form.secciones)) return [];
    return form.secciones.map((seccion, index) => ({
      nombre: seccion.nombre || `Sección ${index + 1}`,
      preguntas: Array.isArray(seccion.preguntas) ? seccion.preguntas.length : 0,
      preguntasList: Array.isArray(seccion.preguntas) ? seccion.preguntas : []
    }));
  };

  // Obtener las preguntas de la sección seleccionada
  const getPreguntasSeccion = (form) => {
    if (!seccionSeleccionada[form.id] && seccionSeleccionada[form.id] !== 0) return [];
    
    const secciones = getSeccionesFormulario(form);
    const seccionIndex = seccionSeleccionada[form.id];
    
    if (seccionIndex >= 0 && seccionIndex < secciones.length) {
      return secciones[seccionIndex].preguntasList.slice(0, 4); // Máximo 4 preguntas
    }
    
    return [];
  };

  // Manejar click en sección
  const handleSeccionClick = (formId, seccionIndex) => {
    setSeccionSeleccionada(prev => ({
      ...prev,
      [formId]: prev[formId] === seccionIndex ? null : seccionIndex // Toggle: si ya está seleccionada, la deselecciona
    }));
  };

  // Manejar inicio de edición
  const handleIniciarEdicion = (formId, seccionIndex) => {
    const form = formularios.find(f => f.id === formId);
    if (!form || !form.secciones || !form.secciones[seccionIndex]) return;

    const seccion = form.secciones[seccionIndex];
    const preguntasActuales = Array.isArray(seccion.preguntas) ? seccion.preguntas : [];
    
    // Inicializar las preguntas editadas con las actuales
    setPreguntasEditadas(prev => ({
      ...prev,
      [formId]: {
        ...prev[formId],
        [seccionIndex]: [...preguntasActuales]
      }
    }));
    
    // Activar modo edición
    setModoEdicion(prev => ({
      ...prev,
      [formId]: {
        ...prev[formId],
        [seccionIndex]: true
      }
    }));
  };

  // Manejar cambio en pregunta editada
  const handlePreguntaChange = (formId, seccionIndex, preguntaIndex, nuevoTexto) => {
    setPreguntasEditadas(prev => ({
      ...prev,
      [formId]: {
        ...prev[formId],
        [seccionIndex]: prev[formId]?.[seccionIndex]?.map((pregunta, index) => 
          index === preguntaIndex ? nuevoTexto : pregunta
        ) || []
      }
    }));
  };

  // Manejar cancelar edición
  const handleCancelarEdicion = (formId, seccionIndex) => {
    setModoEdicion(prev => ({
      ...prev,
      [formId]: {
        ...prev[formId],
        [seccionIndex]: false
      }
    }));
    
    // Limpiar preguntas editadas
    setPreguntasEditadas(prev => {
      const nuevo = { ...prev };
      if (nuevo[formId]) {
        delete nuevo[formId][seccionIndex];
        if (Object.keys(nuevo[formId]).length === 0) {
          delete nuevo[formId];
        }
      }
      return nuevo;
    });
  };

  // Manejar guardar edición
  const handleGuardarEdicion = async (formId, seccionIndex) => {
    const form = formularios.find(f => f.id === formId);
    if (!form) return;

    setGuardando(prev => ({ ...prev, [formId]: true }));

    try {
      const preguntasActualizadas = [...form.secciones];
      preguntasActualizadas[seccionIndex] = {
        ...preguntasActualizadas[seccionIndex],
        preguntas: preguntasEditadas[formId][seccionIndex]
      };

      await updateDoc(doc(db, 'formularios', formId), {
        secciones: preguntasActualizadas,
        ultimaModificacion: new Date()
      });

      // Actualizar estado local reactivamente
      updateFormularioLocal(formId, { secciones: preguntasActualizadas, ultimaModificacion: new Date() });

      // Desactivar modo edición
      setModoEdicion(prev => ({
        ...prev,
        [formId]: {
          ...prev[formId],
          [seccionIndex]: false
        }
      }));

      // Limpiar preguntas editadas
      setPreguntasEditadas(prev => {
        const nuevo = { ...prev };
        if (nuevo[formId]) {
          delete nuevo[formId][seccionIndex];
          if (Object.keys(nuevo[formId]).length === 0) {
            delete nuevo[formId];
          }
        }
        return nuevo;
      });

      Swal.fire('Éxito', 'Preguntas actualizadas correctamente', 'success');
    } catch (error) {
      console.error('Error al guardar preguntas:', error);
      Swal.fire('Error', 'No se pudieron guardar las preguntas', 'error');
    } finally {
      setGuardando(prev => ({ ...prev, [formId]: false }));
    }
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        padding: '64px 16px',
        gap: '16px'
      }}>
        <CircularProgress size={48} />
        <Typography variant="h6" color="primary.main">
          Cargando formularios...
        </Typography>
      </div>
    );
  }

  if (!formularios || formularios.length === 0) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        padding: '64px 16px',
        gap: '24px'
      }}>
        <DrawIcon style={{ fontSize: 64, color: theme.palette.text.secondary }} />
        <Typography variant="h5" color="text.secondary" style={{ textAlign: 'center' }}>
          No tienes formularios registrados
        </Typography>
        <Typography variant="body1" color="text.secondary" style={{ textAlign: 'center', maxWidth: 400 }}>
          Comienza creando tu primer formulario para realizar auditorías
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate('/editar')}
          style={{ marginTop: '16px' }}
        >
          📋 Crear Primer Formulario
        </Button>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', maxWidth: '100%' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '24px',
        flexDirection: isMobile ? 'column' : 'row',
        gap: '16px'
      }}>
        <div>
          <Typography variant="h4" style={{ 
            fontWeight: 700, 
            color: theme.palette.primary.main, 
            marginBottom: '8px' 
          }}>
            📋 Mis Formularios
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {activeTab === 0 ? `${formularios.length} formulario(s) registrado(s)` : `${formulariosPublicos.length} formulario(s) público(s) disponible(s)`}
          </Typography>
        </div>
        
        {activeTab === 0 && (
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate('/editar')}
            style={{ 
              padding: '12px 24px',
              fontWeight: 600,
              borderRadius: '8px'
            }}
          >
            🔧 Gestionar Formularios
          </Button>
        )}
        
      </div>

      {/* Pestañas */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', marginBottom: '24px' }}>
        <Tabs 
          value={activeTab} 
          onChange={(e, newValue) => setActiveTab(newValue)}
          variant={isMobile ? "fullWidth" : "standard"}
          sx={{
            '& .MuiTab-root': {
              fontWeight: 600,
              fontSize: '1rem',
              textTransform: 'none'
            }
          }}
        >
          <Tab 
            label={`Mis Formularios (${formularios.length})`} 
            icon={<DrawIcon />} 
            iconPosition="start"
          />
          <Tab 
            label={`Públicos (${formulariosPublicos.length})`} 
            icon={<ShareIcon />} 
            iconPosition="start"
          />
        </Tabs>
      </Box>

      {/* Contenido de las pestañas */}
      {activeTab === 0 && (
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '16px' 
        }}>
        {formularios.map((form) => {
          const stats = getFormularioStats(form);
          return (
            <div key={form.id} style={{
              backgroundColor: theme.palette.background.paper,
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              border: 'none',
              overflow: 'hidden',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.boxShadow = '0 4px 16px rgba(0,0,0,0.15)';
              e.target.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
              e.target.style.transform = 'translateY(0)';
            }}>
              <div style={{ padding: '24px' }}>
                {/* Estructura usando tabla CSS con 3 columnas */}
                <table style={{ 
                  width: '100%', 
                  borderCollapse: 'collapse'
                }}>
                  <tbody>
                    <tr>
                      {/* Botones de acción (antes era el icono) */}
                      <td style={{ 
                        width: '60px', 
                        verticalAlign: 'top',
                        paddingRight: '16px'
                      }}>
                        <Typography variant="subtitle2" style={{ 
                          fontWeight: 600, 
                          marginBottom: '8px',
                          color: theme.palette.text.primary,
                          fontSize: '0.7rem'
                        }}>
                          🔧 Acciones
                        </Typography>
                        <div style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '4px'
                        }}>
                          <Button
                            variant={form.esPublico && form.publicSharedId ? "contained" : "outlined"}
                            color={form.esPublico && form.publicSharedId ? "success" : "primary"}
                            size="small"
                            onClick={() => handleCompartir(form)}
                            disabled={!canCompartirFormularios || !!form.formularioOriginalId || compartiendo[form.id]}
                            style={{ 
                              padding: '2px 6px',
                              fontSize: '0.65rem',
                              minWidth: 'auto',
                              justifyContent: 'flex-start',
                              height: '24px',
                              fontWeight: form.esPublico && form.publicSharedId ? 600 : 400
                            }}
                            startIcon={compartiendo[form.id] ? <CircularProgress size={10} /> : <ShareIcon style={{ fontSize: 12 }} />}
                          >
                            {compartiendo[form.id] ? 'PROCESANDO...' : (form.esPublico && form.publicSharedId ? 'COMPARTIDO' : 'COMPARTIR')}
                          </Button>
                          
                          <Button
                            variant="outlined"
                            color="secondary"
                            size="small"
                            onClick={() => navigate(`/editar/${form.id}`)}
                            style={{ 
                              padding: '2px 6px',
                              fontSize: '0.65rem',
                              minWidth: 'auto',
                              justifyContent: 'flex-start',
                              height: '24px'
                            }}
                            startIcon={<EditIcon style={{ fontSize: 12 }} />}
                          >
                            EDITAR
                          </Button>
                          
                          <Button
                            variant="outlined"
                            color="error"
                            size="small"
                            onClick={() => handleEliminarFormulario(form)}
                            style={{ 
                              padding: '2px 6px',
                              fontSize: '0.65rem',
                              minWidth: 'auto',
                              justifyContent: 'flex-start',
                              height: '24px'
                            }}
                            startIcon={<DeleteIcon style={{ fontSize: 12 }} />}
                          >
                            ELIMINAR
                          </Button>
                        </div>
                      </td>
                      
                      {/* Información principal */}
                      <td style={{ 
                        verticalAlign: 'top',
                        paddingRight: '24px',
                        width: '50%'
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          marginBottom: '8px',
                          flexWrap: 'wrap'
                        }}>
                          <Typography variant="h6" style={{ 
                            fontWeight: 600, 
                            color: theme.palette.primary.main,
                            flex: 1,
                            minWidth: 0
                          }}>
                            {form.nombre}
                          </Typography>
                        </div>

                        {/* Secciones individuales */}
                        <div style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '2px',
                          marginBottom: '8px'
                        }}>
                          {(() => {
                            const secciones = getSeccionesFormulario(form);
                            const seccionesAMostrar = secciones.slice(0, 4);
                            const hayMasSecciones = secciones.length > 4;
                            
                            return (
                              <>
                                {seccionesAMostrar.map((seccion, index) => (
                                  <div 
                                    key={index} 
                                    style={{ 
                                      display: 'flex', 
                                      alignItems: 'center', 
                                      gap: '8px',
                                      fontSize: '0.75rem',
                                      color: seccionSeleccionada[form.id] === index 
                                        ? theme.palette.primary.main 
                                        : theme.palette.text.secondary,
                                      fontWeight: seccionSeleccionada[form.id] === index ? 600 : 500,
                                      cursor: 'pointer',
                                      padding: '2px 4px',
                                      borderRadius: '4px',
                                      backgroundColor: seccionSeleccionada[form.id] === index 
                                        ? alpha(theme.palette.primary.main, 0.1) 
                                        : 'transparent',
                                      transition: 'all 0.2s ease'
                                    }}
                                    onClick={() => handleSeccionClick(form.id, index)}
                                    onMouseEnter={(e) => {
                                      if (seccionSeleccionada[form.id] !== index) {
                                        e.target.style.backgroundColor = alpha(theme.palette.primary.main, 0.05);
                                      }
                                    }}
                                    onMouseLeave={(e) => {
                                      if (seccionSeleccionada[form.id] !== index) {
                                        e.target.style.backgroundColor = 'transparent';
                                      }
                                    }}
                                  >
                                    <span>📊 {seccion.nombre}: preguntas {seccion.preguntas}</span>
                                  </div>
                                ))}
                                {hayMasSecciones && (
                                  <div style={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: '8px',
                                    fontSize: '0.75rem',
                                    color: theme.palette.primary.main,
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    textDecoration: 'underline'
                                  }}>
                                    Ver más ({secciones.length - 4} secciones más)
                                  </div>
                                )}
                              </>
                            );
                          })()}
                        </div>

                        {/* Chips de estado */}
                        <div style={{
                          display: 'flex',
                          gap: '4px',
                          flexWrap: 'wrap'
                        }}>
                          {form.formularioOriginalId && (
                            <Chip 
                              label="Copia" 
                              size="small"
                              color="warning" 
                              style={{ fontWeight: 600, height: '20px', fontSize: '0.65rem' }}
                            />
                          )}
                          {form.esPublico && (
                            <Chip 
                              label="Público" 
                              size="small"
                              color="success" 
                              style={{ fontWeight: 600, height: '20px', fontSize: '0.65rem' }}
                            />
                          )}
                          {Array.isArray(form.compartidoCon) && form.compartidoCon.length > 0 && (
                            <Chip 
                              label="Compartido" 
                              size="small"
                              color="info" 
                              style={{ fontWeight: 600, height: '20px', fontSize: '0.65rem' }}
                            />
                          )}
                        </div>
                      </td>
                      
                      {/* Tercera columna - Preguntas de la sección seleccionada */}
                      <td style={{ 
                        verticalAlign: 'top',
                        width: '40%'
                      }}>
                        {(() => {
                          const preguntas = getPreguntasSeccion(form);
                          const seccionSeleccionadaIndex = seccionSeleccionada[form.id];
                          const secciones = getSeccionesFormulario(form);
                          const seccionActual = seccionSeleccionadaIndex >= 0 && seccionSeleccionadaIndex < secciones.length 
                            ? secciones[seccionSeleccionadaIndex] 
                            : null;

                          if (!seccionActual || preguntas.length === 0) {
                            return (
                              <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                minHeight: '80px',
                                color: theme.palette.text.secondary,
                                fontSize: '0.75rem',
                                textAlign: 'center'
                              }}>
                                <span>📝 Haz clic en una sección para ver sus preguntas</span>
                              </div>
                            );
                          }

                          return (
                            <div>
                              <Typography variant="subtitle2" style={{ 
                                fontWeight: 600, 
                                marginBottom: '8px',
                                color: theme.palette.primary.main,
                                fontSize: '0.7rem'
                              }}>
                                ❓ Preguntas de {seccionActual.nombre}
                              </Typography>
                              
                              {/* Botones de edición */}
                              {!modoEdicion[form.id]?.[seccionSeleccionadaIndex] ? (
                                <Button
                                  variant="outlined"
                                  color="primary"
                                  size="small"
                                  onClick={() => handleIniciarEdicion(form.id, seccionSeleccionadaIndex)}
                                  style={{ 
                                    marginBottom: '8px',
                                    padding: '2px 8px',
                                    fontSize: '0.65rem',
                                    height: '24px'
                                  }}
                                  startIcon={<EditIcon style={{ fontSize: 12 }} />}
                                >
                                  EDITAR PREGUNTAS
                                </Button>
                              ) : (
                                <div style={{ 
                                  display: 'flex', 
                                  gap: '4px', 
                                  marginBottom: '8px' 
                                }}>
                                  <Button
                                    variant="contained"
                                    color="success"
                                    size="small"
                                    onClick={() => handleGuardarEdicion(form.id, seccionSeleccionadaIndex)}
                                    disabled={guardando[form.id]}
                                    style={{ 
                                      padding: '2px 8px',
                                      fontSize: '0.65rem',
                                      height: '24px'
                                    }}
                                    startIcon={<SaveIcon style={{ fontSize: 12 }} />}
                                  >
                                    {guardando[form.id] ? 'GUARDANDO...' : 'GUARDAR'}
                                  </Button>
                                  <Button
                                    variant="outlined"
                                    color="error"
                                    size="small"
                                    onClick={() => handleCancelarEdicion(form.id, seccionSeleccionadaIndex)}
                                    disabled={guardando[form.id]}
                                    style={{ 
                                      padding: '2px 8px',
                                      fontSize: '0.65rem',
                                      height: '24px'
                                    }}
                                    startIcon={<CancelIcon style={{ fontSize: 12 }} />}
                                  >
                                    CANCELAR
                                  </Button>
                                </div>
                              )}
                              
                              <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '4px'
                              }}>
                                {(() => {
                                  const preguntasAMostrar = modoEdicion[form.id]?.[seccionSeleccionadaIndex] 
                                    ? preguntasEditadas[form.id]?.[seccionSeleccionadaIndex] || []
                                    : preguntas;
                                  
                                  return preguntasAMostrar.map((pregunta, index) => (
                                    <div 
                                      key={index}
                                      style={{
                                        fontSize: '0.7rem',
                                        color: theme.palette.text.secondary,
                                        padding: '4px 6px',
                                        backgroundColor: alpha(theme.palette.background.default, 0.5),
                                        borderRadius: '4px',
                                        border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
                                        wordBreak: 'break-word'
                                      }}
                                    >
                                      {modoEdicion[form.id]?.[seccionSeleccionadaIndex] ? (
                                        <TextField
                                          fullWidth
                                          size="small"
                                          value={pregunta || ''}
                                          onChange={(e) => handlePreguntaChange(form.id, seccionSeleccionadaIndex, index, e.target.value)}
                                          variant="outlined"
                                          style={{
                                            fontSize: '0.7rem'
                                          }}
                                          InputProps={{
                                            style: {
                                              fontSize: '0.7rem',
                                              padding: '2px 4px'
                                            }
                                          }}
                                        />
                                      ) : (
                                        <><strong>{index + 1}.</strong> {typeof pregunta === 'string' ? pregunta : pregunta.texto || pregunta.pregunta || `Pregunta ${index + 1}`}</>
                                      )}
                                    </div>
                                  ));
                                })()}
                                
                                {seccionActual.preguntas > 4 && !modoEdicion[form.id]?.[seccionSeleccionadaIndex] && (
                                  <div style={{
                                    fontSize: '0.65rem',
                                    color: theme.palette.primary.main,
                                    fontWeight: 600,
                                    textAlign: 'center',
                                    padding: '2px',
                                    fontStyle: 'italic'
                                  }}>
                                    ... y {seccionActual.preguntas - 4} preguntas más
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })()}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
        </div>
      )}

      {/* Pestaña de Formularios Públicos */}
      {activeTab === 1 && (
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '16px' 
        }}>
          {loadingPublicos ? (
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center',
              padding: '64px 16px',
              gap: '16px'
            }}>
              <CircularProgress size={48} />
              <Typography variant="h6" color="primary.main">
                Cargando formularios públicos...
              </Typography>
            </div>
          ) : formulariosPublicos.length === 0 ? (
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center',
              padding: '64px 16px',
              gap: '24px'
            }}>
              <ShareIcon style={{ fontSize: 64, color: theme.palette.text.secondary }} />
              <Typography variant="h5" color="text.secondary" style={{ textAlign: 'center' }}>
                No hay formularios públicos disponibles
              </Typography>
              <Typography variant="body1" color="text.secondary" style={{ textAlign: 'center', maxWidth: 400 }}>
                Los formularios públicos aparecerán aquí cuando otros administradores compartan sus formularios
              </Typography>
            </div>
          ) : (
            formulariosPublicos.map((form) => {
              const stats = getFormularioStats(form);
              const yaCopiado = misFormulariosCopiados.some(
                (copiado) => (copiado.formularioOriginalId === form.id) || 
                             (copiado.nombre === form.nombre && copiado.creadorId === userProfile?.uid)
              );
              const esPropio = form.creadorId && userProfile?.uid && form.creadorId === userProfile.uid;

              return (
                <div key={form.id} style={{
                  backgroundColor: theme.palette.background.paper,
                  borderRadius: '8px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  border: 'none',
                  overflow: 'hidden',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.boxShadow = '0 4px 16px rgba(0,0,0,0.15)';
                  e.target.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                  e.target.style.transform = 'translateY(0)';
                }}>
                  <div style={{ padding: '24px' }}>
                    <table style={{ 
                      width: '100%', 
                      borderCollapse: 'collapse'
                    }}>
                      <tbody>
                        <tr>
                          {/* Botones de acción */}
                          <td style={{ 
                            width: '60px', 
                            verticalAlign: 'top',
                            paddingRight: '16px'
                          }}>
                            <Typography variant="subtitle2" style={{ 
                              fontWeight: 600, 
                              marginBottom: '8px',
                              color: theme.palette.text.primary,
                              fontSize: '0.7rem'
                            }}>
                              🔧 Acciones
                            </Typography>
                            <div style={{
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '4px'
                            }}>
                              <Button
                                variant={yaCopiado ? "contained" : "outlined"}
                                color={yaCopiado ? "success" : "primary"}
                                size="small"
                                onClick={() => handleCopiarFormularioPublico(form)}
                                disabled={!!esPropio || !!yaCopiado || copiandoId === form.id}
                                style={{ 
                                  padding: '2px 6px',
                                  fontSize: '0.65rem',
                                  minWidth: 'auto',
                                  justifyContent: 'flex-start',
                                  height: '24px',
                                  fontWeight: yaCopiado ? 600 : 400
                                }}
                                startIcon={copiandoId === form.id ? <CircularProgress size={10} /> : <CopyIcon style={{ fontSize: 12 }} />}
                              >
                                {copiandoId === form.id ? 'COPIANDO...' : (yaCopiado ? 'COPIADO' : 'COPIAR')}
                              </Button>
                            </div>
                          </td>
                          
                          {/* Información principal */}
                          <td style={{ 
                            verticalAlign: 'top',
                            paddingRight: '24px',
                            width: '50%'
                          }}>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              marginBottom: '8px',
                              flexWrap: 'wrap'
                            }}>
                              <Typography variant="h6" style={{ 
                                fontWeight: 600, 
                                color: theme.palette.primary.main,
                                flex: 1,
                                minWidth: 0
                              }}>
                                {form.nombre}
                              </Typography>
                            </div>

                            {/* Información del creador */}
                            <Typography variant="body2" color="text.secondary" style={{ marginBottom: '8px' }}>
                              Creado por: {form.creadorEmail || form.creadorNombre || 'Usuario'}
                            </Typography>

                            {/* Secciones individuales */}
                            <div style={{
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '2px',
                              marginBottom: '8px'
                            }}>
                              {(() => {
                                const secciones = getSeccionesFormulario(form);
                                const seccionesAMostrar = secciones.slice(0, 4);
                                const hayMasSecciones = secciones.length > 4;
                                
                                return (
                                  <>
                                    {seccionesAMostrar.map((seccion, index) => (
                                      <div 
                                        key={index} 
                                        style={{ 
                                          display: 'flex', 
                                          alignItems: 'center', 
                                          gap: '8px',
                                          fontSize: '0.75rem',
                                          color: theme.palette.text.secondary,
                                          fontWeight: 500
                                        }}
                                      >
                                        <span>📊 {seccion.nombre}: preguntas {seccion.preguntas}</span>
                                      </div>
                                    ))}
                                    {hayMasSecciones && (
                                      <div style={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: '8px',
                                        fontSize: '0.75rem',
                                        color: theme.palette.primary.main,
                                        fontWeight: 600
                                      }}>
                                        Ver más ({secciones.length - 4} secciones más)
                                      </div>
                                    )}
                                  </>
                                );
                              })()}
                            </div>

                            {/* Chips de estado */}
                            <div style={{
                              display: 'flex',
                              gap: '4px',
                              flexWrap: 'wrap'
                            }}>
                              <Chip 
                                label="Público" 
                                size="small"
                                color="success" 
                                style={{ fontWeight: 600, height: '20px', fontSize: '0.65rem' }}
                              />
                              {form.copiadoCount > 0 && (
                                <Chip 
                                  label={`${form.copiadoCount} copias`} 
                                  size="small"
                                  color="info" 
                                  style={{ fontWeight: 600, height: '20px', fontSize: '0.65rem' }}
                                />
                              )}
                              {esPropio && (
                                <Chip 
                                  label="Mi formulario" 
                                  size="small"
                                  color="warning" 
                                  style={{ fontWeight: 600, height: '20px', fontSize: '0.65rem' }}
                                />
                              )}
                            </div>
                          </td>
                          
                          {/* Tercera columna - Información adicional */}
                          <td style={{ 
                            verticalAlign: 'top',
                            width: '40%'
                          }}>
                            <div style={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              minHeight: '80px',
                              color: theme.palette.text.secondary,
                              fontSize: '0.75rem',
                              textAlign: 'center'
                            }}>
                              {esPropio ? (
                                <span>📝 Este es tu formulario público</span>
                              ) : yaCopiado ? (
                                <span>✅ Ya tienes este formulario en tu sistema</span>
                              ) : (
                                <span>📋 Haz clic en "COPIAR" para agregarlo a tu sistema</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default PerfilFormularios;
