import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import autoSaveService from '../services/autoSaveService';
import { verificarFirmasCompletadas } from '../utils/auditoriaUtils';
import { generarContenidoImpresion, abrirImpresionNativa } from '../utils/impresionUtils';

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
  const handleEmpresaChange = useCallback((selectedEmpresa) => {
    setEmpresaSeleccionada(selectedEmpresa);
    setSucursalSeleccionada("");
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

  const handleGuardarRespuestas = useCallback((nuevasRespuestas) => {
    setRespuestas(nuevasRespuestas);
  }, [setRespuestas]);

  const handleGuardarComentario = useCallback((nuevosComentarios) => {
    setComentarios(nuevosComentarios);
  }, [setComentarios]);

  const handleGuardarImagenes = useCallback((nuevasImagenes) => {
    setImagenes(nuevasImagenes);
  }, [setImagenes]);

  // Handlers de firmas
  const handleSaveFirmaAuditor = useCallback((firmaURL) => {
    console.log('[DEBUG] handleSaveFirmaAuditor llamado con:', firmaURL);
    setFirmaAuditor(firmaURL);
    verificarFirmasCompletadas();
  }, [setFirmaAuditor]);

  const handleSaveFirmaResponsable = useCallback((firmaURL) => {
    setFirmaResponsable(firmaURL);
    verificarFirmasCompletadas();
  }, [setFirmaResponsable]);

  const verificarFirmasCompletadas = useCallback(() => {
    const completadas = verificarFirmasCompletadas(firmaAuditor, firmaResponsable);
    console.log('[DEBUG] Verificando firmas (opcionales):', { firmaAuditor, firmaResponsable, completadas });
    setFirmasCompletadas(completadas);
  }, [firmaAuditor, firmaResponsable, setFirmasCompletadas]);

  // Handlers de autoguardado
  const checkUnsavedChanges = useCallback(() => {
    const hasData = empresaSeleccionada || sucursalSeleccionada || formularioSeleccionadoId || 
                   respuestas.some(seccion => seccion.some(resp => resp !== '')) ||
                   comentarios.some(seccion => seccion.some(com => com !== '')) ||
                   imagenes.some(seccion => seccion.some(img => img !== null));
    
    return hasData && hasUnsavedChanges;
  }, [empresaSeleccionada, sucursalSeleccionada, formularioSeleccionadoId, respuestas, comentarios, imagenes, hasUnsavedChanges]);

  const handleAutoSave = useCallback(async () => {
    if (!userProfile?.uid) return;

    setIsSaving(true);
    
    try {
      const auditoriaData = {
        empresaSeleccionada,
        sucursalSeleccionada,
        formularioSeleccionadoId,
        secciones,
        respuestas,
        comentarios,
        imagenes: imagenes.map(seccion => seccion.map(img => img ? 'image' : null)),
        activeStep,
        timestamp: Date.now()
      };

      await autoSaveService.saveToFirestore(userProfile.uid, auditoriaData);
      setLastSaved(Date.now());
      setHasUnsavedChanges(false);
      
      console.log('✅ Autoguardado exitoso');
    } catch (error) {
      console.error('❌ Error en autoguardado:', error);
    } finally {
      setIsSaving(false);
    }
  }, [userProfile?.uid, empresaSeleccionada, sucursalSeleccionada, formularioSeleccionadoId, secciones, respuestas, comentarios, imagenes, activeStep, setIsSaving, setLastSaved, setHasUnsavedChanges]);

  const handleDiscardChanges = useCallback(async () => {
    try {
      autoSaveService.clearLocalStorage();
      setHasUnsavedChanges(false);
      setLastSaved(null);
      console.log('🗑️ Cambios descartados');
    } catch (error) {
      console.error('❌ Error al descartar cambios:', error);
    }
  }, [setHasUnsavedChanges, setLastSaved]);

  // Handlers de navegación
  const handleSiguiente = useCallback((pasoCompletoAuditoria) => {
    setNavegacionError("");
    if (!pasoCompletoAuditoria(activeStep)) {
      setNavegacionError("Debes completar este paso antes de continuar.");
      return;
    }
    setActiveStep((prev) => Math.min(prev + 1, 4)); // 5 pasos (0-4)
  }, [activeStep, setNavegacionError, setActiveStep]);

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
    
    // Handlers de firmas
    handleSaveFirmaAuditor,
    handleSaveFirmaResponsable,
    verificarFirmasCompletadas,
    
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
