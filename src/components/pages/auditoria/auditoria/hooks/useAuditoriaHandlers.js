import { useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import autoSaveService from '../services/autoSaveService';
import { verificarFirmasCompletadas, filtrarSucursalesPorEmpresa } from '../utils/auditoriaUtils';
import { generarContenidoImpresion, abrirImpresionNativa } from '../utils/impresionUtils';
import logger from '../../../../../utils/logger';

/**
 * Hook personalizado para manejar todos los handlers de la auditoría
 * @param {Object} params - Parámetros del hook
 * @returns {Object} - Objeto con todos los handlers
 */
export const useAuditoriaHandlers = ({
  // Estados
  empresaSeleccionada,
  sucursalSeleccionada,
  formularioSeleccionadoId,
  secciones,
  respuestas,
  comentarios,
  imagenes,
  clasificaciones,
  accionesRequeridas,
  activeStep,
  firmaAuditor,
  firmaResponsable,
  firmasValidas,
  hasUnsavedChanges,
  userProfile,
  
  // Setters
  setEmpresaSeleccionada,
  setSucursalSeleccionada,
  setFormularioSeleccionadoId,
  setActiveStep,
  setRespuestas,
  setComentarios,
  setImagenes,
  setClasificaciones,
  setAccionesRequeridas,
  setFirmaAuditor,
  setFirmaResponsable,
  setFirmasCompletadas,
  setNavegacionError,
  setErrores,
  setMostrarReporte,
  setAuditoriaGenerada,
  setIsSaving,
  setLastSaved,
  setHasUnsavedChanges,
  
  // Otros
  navigate,
  log,
  reiniciarAuditoria
}) => {
  
  // Handlers de datos básicos
  const handleEmpresaChange = useCallback((selectedEmpresa, sucursalesDisponibles = []) => {
    setEmpresaSeleccionada(selectedEmpresa);
    
    // Filtrar sucursales por la empresa seleccionada
    const sucursalesFiltradas = filtrarSucursalesPorEmpresa(sucursalesDisponibles, selectedEmpresa);
    
    // Auto-seleccionar si hay exactamente 1 sucursal
    if (sucursalesFiltradas.length === 1) {
      setSucursalSeleccionada(sucursalesFiltradas[0].nombre);
    } else {
      setSucursalSeleccionada("");
    }
    
    setFormularioSeleccionadoId("");
    setActiveStep(0);
  }, [setEmpresaSeleccionada, setSucursalSeleccionada, setFormularioSeleccionadoId, setActiveStep]);

  const handleSucursalChange = useCallback((e) => {
    setSucursalSeleccionada(e.target.value);
  }, [setSucursalSeleccionada]);

  const handleSeleccionarFormulario = useCallback((e) => {
    setFormularioSeleccionadoId(e.target.value);
    setActiveStep(1);
  }, [setFormularioSeleccionadoId, setActiveStep]);

  // Refs para debounce y control de guardado
  const autoSaveTimeoutRef = useRef(null);
  const isSavingRef = useRef(false);
  const pendingSaveRef = useRef(false);

  // Handlers de autoguardado
  const checkUnsavedChanges = useCallback(() => {
    const hasData = empresaSeleccionada || sucursalSeleccionada || formularioSeleccionadoId || 
                   respuestas.some(seccion => seccion.some(resp => resp !== '')) ||
                   comentarios.some(seccion => seccion.some(com => com !== '')) ||
                   imagenes.some(seccion => seccion.some(img => img !== null)) ||
                   clasificaciones.some(seccion => seccion.some(clas => clas && (clas.condicion || clas.actitud))) ||
                   accionesRequeridas.some(seccion => seccion.some(acc => acc && acc.requiereAccion && acc.accionTexto));
    
    return hasData && hasUnsavedChanges;
  }, [empresaSeleccionada, sucursalSeleccionada, formularioSeleccionadoId, respuestas, comentarios, imagenes, clasificaciones, accionesRequeridas, hasUnsavedChanges]);

  // Función de guardado interno optimizada con manejo robusto de errores
  const performAutoSave = useCallback(async (force = false) => {
    if (!userProfile?.uid) return false;
    
    // Si ya está guardando, marcar como pendiente y salir
    if (isSavingRef.current && !force) {
      pendingSaveRef.current = true;
      return false;
    }

    // Si no hay cambios y no es forzado, no guardar
    if (!force && !hasUnsavedChanges) {
      return false;
    }

    // OPTIMIZACIÓN: Detectar si solo hay empresa/sucursal (sin respuestas/imágenes)
    const tieneRespuestas = respuestas.some(seccion => seccion.some(resp => resp !== ''));
    const tieneImagenes = imagenes.some(seccion => seccion.some(img => img !== null));
    const tieneComentarios = comentarios.some(seccion => seccion.some(com => com !== ''));
    const tieneClasificaciones = clasificaciones.some(seccion => seccion.some(clas => clas && (clas.condicion || clas.actitud)));
    const esGuardadoSimple = !tieneRespuestas && !tieneImagenes && !tieneComentarios && !tieneClasificaciones;

    isSavingRef.current = true;
    setIsSaving(true);
    
    try {
      // Guardar imágenes REALES (File objects), no solo strings
      const auditoriaData = {
        empresaSeleccionada,
        sucursalSeleccionada,
        formularioSeleccionadoId,
        secciones,
        respuestas,
        comentarios,
        imagenes, // Guardar las imágenes reales (File objects)
        clasificaciones,
        activeStep,
        firmaAuditor, // Guardar firma del auditor
        firmaResponsable, // Guardar firma del responsable
        timestamp: Date.now()
      };

      // OPTIMIZACIÓN: Si es guardado simple, usar método rápido (solo localStorage)
      if (esGuardadoSimple) {
        // Guardado rápido solo en localStorage para empresa/sucursal/formulario
        autoSaveService.saveToLocalStorage({
          ...auditoriaData,
          userId: userProfile.uid,
          sessionId: `session_${userProfile.uid}_${Date.now()}`,
          timestamp: Date.now(),
          lastModified: Date.now(), // Usar timestamp en lugar de Date object
          autoSaved: true
        });
        logger.autosave('Autoguardado rápido (simple)');
      } else {
        // Guardado completo con imágenes en IndexedDB
        await autoSaveService.saveAuditoria(userProfile.uid, auditoriaData, userProfile);
        logger.autosave('Autoguardado exitoso (completo con imágenes)');
      }
      
      setLastSaved(Date.now());
      setHasUnsavedChanges(false);
      pendingSaveRef.current = false;
      
      return true;
    } catch (error) {
      logger.error('Error en autoguardado:', error);
      // No marcar como guardado si falló
      pendingSaveRef.current = true;
      return false;
    } finally {
      isSavingRef.current = false;
      setIsSaving(false);
      
      // Si había un guardado pendiente, ejecutarlo ahora
      if (pendingSaveRef.current) {
        pendingSaveRef.current = false;
        setTimeout(() => performAutoSave(true), 500);
      }
    }
  }, [userProfile?.uid, empresaSeleccionada, sucursalSeleccionada, formularioSeleccionadoId, secciones, respuestas, comentarios, imagenes, clasificaciones, activeStep, firmaAuditor, firmaResponsable, hasUnsavedChanges, setIsSaving, setLastSaved, setHasUnsavedChanges]);

  // Función de guardado con debounce (para cambios frecuentes)
  const handleAutoSave = useCallback(async (force = false) => {
    // Si es forzado (cambio de paso), guardar inmediatamente
    if (force) {
      return await performAutoSave(true);
    }

    // Limpiar timeout anterior si existe
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // Programar guardado con debounce de 1 segundo
    return new Promise((resolve) => {
      autoSaveTimeoutRef.current = setTimeout(async () => {
        const result = await performAutoSave(false);
        resolve(result);
      }, 1000);
    });
  }, [performAutoSave]);

  const handleGuardarRespuestas = useCallback((nuevasRespuestas) => {
    setRespuestas(nuevasRespuestas);
    // Guardar automáticamente después de actualizar respuestas
    handleAutoSave(false).catch(err => logger.debug('Error en autoguardado de respuestas:', err));
  }, [setRespuestas, handleAutoSave]);

  const handleGuardarComentario = useCallback((nuevosComentarios) => {
    setComentarios(nuevosComentarios);
    // Guardar automáticamente después de actualizar comentarios
    handleAutoSave(false).catch(err => logger.debug('Error en autoguardado de comentarios:', err));
  }, [setComentarios, handleAutoSave]);

  const handleGuardarImagenes = useCallback((nuevasImagenes) => {
    setImagenes(nuevasImagenes);
    // Guardar automáticamente después de actualizar imágenes (forzar guardado inmediato por tamaño)
    handleAutoSave(true).catch(err => logger.debug('Error en autoguardado de imágenes:', err));
  }, [setImagenes, handleAutoSave]);

  const handleGuardarClasificaciones = useCallback((nuevasClasificaciones) => {
    logger.debug('Recibidas nuevas clasificaciones', { count: nuevasClasificaciones?.length || 0 });
    setClasificaciones(nuevasClasificaciones);
    // Guardar automáticamente después de actualizar clasificaciones
    handleAutoSave(false).catch(err => logger.debug('Error en autoguardado de clasificaciones:', err));
  }, [setClasificaciones, handleAutoSave]);

  const handleGuardarAccionesRequeridas = useCallback((nuevasAcciones) => {
    setAccionesRequeridas(nuevasAcciones);
    // Guardar automáticamente después de actualizar acciones requeridas
    handleAutoSave(false).catch(err => logger.debug('Error en autoguardado de acciones requeridas:', err));
  }, [setAccionesRequeridas, handleAutoSave]);

  // Handlers de firmas
  const verificarFirmasCompletadasLocal = useCallback(() => {
    const completadas = verificarFirmasCompletadas(firmaAuditor, firmaResponsable);
    logger.debug('Verificando firmas (opcionales)', { completadas });
    setFirmasCompletadas(completadas);
  }, [firmaAuditor, firmaResponsable, setFirmasCompletadas]);

  const handleSaveFirmaAuditor = useCallback((firmaURL) => {
    logger.debug('handleSaveFirmaAuditor llamado');
    setFirmaAuditor(firmaURL);
    verificarFirmasCompletadasLocal();
    // Guardar automáticamente después de guardar firma (forzar guardado inmediato)
    handleAutoSave(true).catch(err => logger.debug('Error en autoguardado de firma auditor:', err));
  }, [setFirmaAuditor, verificarFirmasCompletadasLocal, handleAutoSave]);

  const handleSaveFirmaResponsable = useCallback((firmaURL) => {
    setFirmaResponsable(firmaURL);
    verificarFirmasCompletadasLocal();
    // Guardar automáticamente después de guardar firma (forzar guardado inmediato)
    handleAutoSave(true).catch(err => logger.debug('Error en autoguardado de firma responsable:', err));
  }, [setFirmaResponsable, verificarFirmasCompletadasLocal, handleAutoSave]);

  const handleDiscardChanges = useCallback(async () => {
    try {
      await autoSaveService.clearLocalStorage(userProfile?.uid || null);
      setHasUnsavedChanges(false);
      setLastSaved(null);
      logger.debug('Cambios descartados');
    } catch (error) {
      logger.error('Error al descartar cambios:', error);
    }
  }, [setHasUnsavedChanges, setLastSaved, userProfile?.uid]);

  // Handlers de navegación optimizados
  const handleSiguiente = useCallback(async (pasoCompletoAuditoria) => {
    setNavegacionError("");
    if (!pasoCompletoAuditoria(activeStep)) {
      setNavegacionError("Debes completar este paso antes de continuar.");
      return;
    }
    
    // OPTIMIZACIÓN: Cambiar de paso inmediatamente para mejor UX
    setActiveStep((prev) => Math.min(prev + 1, 4)); // 5 pasos (0-4)
    
    // Guardar en segundo plano (sin bloquear la navegación)
    handleAutoSave(true).catch(err => {
      logger.debug('Error al guardar en segundo plano:', err);
      // No mostrar error al usuario para no interrumpir el flujo
    });
  }, [activeStep, setNavegacionError, setActiveStep, handleAutoSave]);

  const handleAnterior = useCallback(() => {
    setNavegacionError("");
    
    if (firmasValidas && activeStep > 0) {
      Swal.fire({
        title: '⚠️ Información',
        text: 'Puede navegar hacia atrás para revisar o editar. Las firmas se mantendrán si no hace cambios en las respuestas.',
        icon: 'info',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Continuar',
        cancelButtonText: 'Cancelar'
      }).then((result) => {
        if (result.isConfirmed) {
          setActiveStep((prev) => Math.max(prev - 1, 0));
        }
      });
      return;
    }
    
    setActiveStep((prev) => Math.max(prev - 1, 0));
  }, [activeStep, firmasValidas, setNavegacionError, setActiveStep]);

  const handleStepClick = useCallback((index, pasoCompletoAuditoria) => {
    setNavegacionError("");
    
    for (let i = 0; i < index; i++) {
      if (!pasoCompletoAuditoria(i)) {
        setNavegacionError("Completa los pasos anteriores antes de avanzar.");
        return;
      }
    }

    if (firmasValidas && index < activeStep) {
      Swal.fire({
        title: '⚠️ Información',
        text: 'Puede navegar hacia atrás para revisar o editar. Las firmas se mantendrán si no hace cambios en las respuestas.',
        icon: 'info',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Continuar',
        cancelButtonText: 'Cancelar'
      }).then((result) => {
        if (result.isConfirmed) {
          setActiveStep(index);
        }
      });
      return;
    }
    
    setActiveStep(index);
  }, [activeStep, firmasValidas, setNavegacionError, setActiveStep]);

  // Handlers de auditoría
  const generarReporte = useCallback((validarAuditoria) => {
    const erroresValidacion = validarAuditoria({
      respuestas,
      firmaAuditor,
      empresaSeleccionada,
      formularioSeleccionadoId
    });
    
    if (erroresValidacion.length > 0) {
      setErrores(erroresValidacion);
      return;
    }
    
    setMostrarReporte(true);
    setErrores([]);
    setAuditoriaGenerada(true);
    setActiveStep(4);
  }, [respuestas, firmaAuditor, empresaSeleccionada, formularioSeleccionadoId, setErrores, setMostrarReporte, setAuditoriaGenerada, setActiveStep]);

  const generarNuevaAuditoria = useCallback(() => {
    reiniciarAuditoria();
    navigate('/auditoria', { replace: true });
    log("Nueva auditoría iniciada - todos los estados reiniciados");
  }, [reiniciarAuditoria, navigate, log]);

  const handleFinalizar = useCallback(async (marcarAuditoriaCompletada) => {
    await marcarAuditoriaCompletada();
    setAuditoriaGenerada(true);
  }, [setAuditoriaGenerada]);

  // Handler de impresión
  const abrirImpresionNativa = useCallback((params) => {
    const contenido = generarContenidoImpresion(params);
    abrirImpresionNativa(contenido);
  }, []);

  return {
    // Handlers básicos
    handleEmpresaChange,
    handleSucursalChange,
    handleSeleccionarFormulario,
    handleGuardarRespuestas,
    handleGuardarComentario,
    handleGuardarImagenes,
    handleGuardarClasificaciones,
    handleGuardarAccionesRequeridas,
    
    // Handlers de firmas
    handleSaveFirmaAuditor,
    handleSaveFirmaResponsable,
    verificarFirmasCompletadas: verificarFirmasCompletadasLocal,
    
    // Handlers de autoguardado
    checkUnsavedChanges,
    handleAutoSave,
    handleDiscardChanges,
    
    // Handlers de navegación
    handleSiguiente,
    handleAnterior,
    handleStepClick,
    
    // Handlers de auditoría
    generarReporte,
    generarNuevaAuditoria,
    handleFinalizar,
    
    // Handler de impresión
    abrirImpresionNativa
  };
};

export default useAuditoriaHandlers;
