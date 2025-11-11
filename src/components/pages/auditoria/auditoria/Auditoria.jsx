import React, { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  Container, 
  Typography, 
  Box, 
  Button,
  Alert,
  Snackbar,
  Alert as MuiAlert,
  Button as MuiButton,
  useTheme,
  useMediaQuery,
  alpha,
  Fade,
  Grid,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Paper
} from "@mui/material";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import Swal from 'sweetalert2';
import { useAuth } from "../../../context/AuthContext";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../../../firebaseConfig";

// Hooks personalizados
import { useAuditoriaState } from "./hooks/useAuditoriaState";
import { useAuditoriaData } from "./hooks/useAuditoriaData";
import { useNavigationGuard } from "./hooks/useNavigationGuard";
import { useAuditoriaHandlers } from "./hooks/useAuditoriaHandlers";

// Componentes
import AuditoriaStepper from "./components/AuditoriaStepper";
import AuditoriaCompletada from "./components/AuditoriaCompletada";
import AutoSaveAlert from "./components/AutoSaveAlert";
import AuditoriaHeader from "./components/AuditoriaHeader";
import AlertasFaltantes from "./components/AlertasFaltantes";
import { createAuditoriaSteps } from "./components/AuditoriaSteps";
import SimpleOfflineDebug from "../../../common/SimpleOfflineDebug";
import AuditoriaDebugInfo from "../../../common/AuditoriaDebugInfo";

// Servicios
import AuditoriaService from "../auditoriaService";
import { buildReporteMetadata } from '../../../../services/useMetadataService';
import autoSaveService from "./services/autoSaveService";

// Utilidades
import {
  todasLasPreguntasContestadas,
  calcularProgreso,
  getStepStatus,
  pasoCompleto,
  obtenerTipoUbicacion,
  validarAuditoria,
  configurarFormulario,
  filtrarSucursalesPorEmpresa,
  tieneProgresoReal,
  calcularPasoCorrecto,
  contarPreguntasRespondidas,
  contarTotalPreguntas,
  verificarFirmasCompletadas,
  generarHashAuditoria
} from "./utils/auditoriaUtils";
import {
  generarContenidoImpresion,
  abrirImpresionNativa,
  imprimirAuditoria,
  generarResumenAuditoria
} from "./utils/impresionUtils";

// Componentes de pasos
import SeleccionEmpresa from "./SeleccionEmpresa";
import SeleccionSucursal from "./SeleccionSucursal";
import SeleccionFormulario from "./SeleccionFormulario";
import PreguntasYSeccion from "./PreguntasYSeccion";
import FirmaSection from "../reporte/FirmaSection";
import BotonGenerarReporte from "../reporte/ReporteImprimir";
import ReporteConImpresion from '../reporte/ReporteDetalleConImpresion';

// Iconos para los pasos
import BusinessIcon from '@mui/icons-material/Business';
import AssignmentIcon from '@mui/icons-material/Assignment';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import AssessmentIcon from '@mui/icons-material/Assessment';
import EditIcon from '@mui/icons-material/Edit';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { Fade as MuiFade, Zoom } from "@mui/material";

const AuditoriaRefactorizada = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    userProfile, 
    userEmpresas, 
    userFormularios, 
    userSucursales,
    getUserEmpresas,
    getUserSucursales,
    getUserFormularios,
    role,
    loading
  } = useAuth();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Verificar si el contexto está cargando
  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4, px: 2 }}>
        <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="50vh">
          <LinearProgress sx={{ width: '100%', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            Cargando datos de autenticación...
          </Typography>
        </Box>
      </Container>
    );
  }

  // Estados para autoguardado
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Estado para carga de datos de respaldo
  const [cargandoDatosRespaldo, setCargandoDatosRespaldo] = useState(false);
  const [datosRespaldoCargados, setDatosRespaldoCargados] = useState(false);

  // Cargar datos de respaldo si no están disponibles (solo una vez)
  useEffect(() => {
    const cargarDatosRespaldo = async () => {
      if (!userProfile || datosRespaldoCargados) return;
      
      // Verificar si faltan datos críticos
      const faltanDatos = (
        (!userEmpresas || userEmpresas.length === 0) ||
        (!userSucursales || userSucursales.length === 0) ||
        (!userFormularios || userFormularios.length === 0)
      );
      
      if (faltanDatos) {
        console.log('🔄 [Auditoria] Datos faltantes detectados, cargando de respaldo...');
        setCargandoDatosRespaldo(true);
        setDatosRespaldoCargados(true);
        
        try {
          await Promise.allSettled([
            getUserEmpresas(),
            getUserSucursales(),
            getUserFormularios()
          ]);
          console.log('✅ [Auditoria] Datos de respaldo cargados');
        } catch (error) {
          console.warn('⚠️ [Auditoria] Error cargando datos de respaldo:', error);
        } finally {
          setCargandoDatosRespaldo(false);
        }
      } else {
        setDatosRespaldoCargados(true);
      }
    };

    // Esperar un poco para que el contexto se estabilice
    const timer = setTimeout(cargarDatosRespaldo, 1000);
    return () => clearTimeout(timer);
  }, [userProfile, datosRespaldoCargados]);

  // Hook para manejar todo el estado
  const auditoriaState = useAuditoriaState();
  const {
    empresaSeleccionada, setEmpresaSeleccionada,
    sucursalSeleccionada, setSucursalSeleccionada,
    formularioSeleccionadoId, setFormularioSeleccionadoId,
    secciones, setSecciones,
    respuestas, setRespuestas,
    comentarios, setComentarios,
    imagenes, setImagenes,
    clasificaciones, setClasificaciones,
    mostrarReporte, setMostrarReporte,
    errores, setErrores,
    empresas, setEmpresas,
    sucursales, setSucursales,
    formularios, setFormularios,
    auditoriaGenerada, setAuditoriaGenerada,
    activeStep, setActiveStep,
    bloquearDatosAgenda, setBloquearDatosAgenda,
    openAlertaEdicion, setOpenAlertaEdicion,
    auditoriaIdAgenda, setAuditoriaIdAgenda,
    snackbarMsg, setSnackbarMsg,
    snackbarType, setSnackbarType,
    snackbarOpen, setSnackbarOpen,
    navegacionError, setNavegacionError,
    firmaAuditor, setFirmaAuditor,
    firmaResponsable, setFirmaResponsable,
    firmasCompletadas, setFirmasCompletadas,
    firmasValidas, setFirmasValidas,
    mostrarAlertaReinicio, setMostrarAlertaReinicio,
    datosReporte, setDatosReporte,
    log,
    reiniciarAuditoria,
    generarHashAuditoria
  } = auditoriaState;

  // Hook para cargar datos
  useAuditoriaData(
    setEmpresas,
    setSucursales,
    setFormularios,
    empresaSeleccionada,
    userProfile,
    userEmpresas,
    userFormularios,
    userSucursales
  );

  // Hook para manejar todos los handlers
  const handlers = useAuditoriaHandlers({
    // Estados
        empresaSeleccionada,
        sucursalSeleccionada,
        formularioSeleccionadoId,
        secciones,
        respuestas,
        comentarios,
    imagenes,
        clasificaciones,
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
  });

  // Extraer handlers del hook
  const {
    handleEmpresaChange,
    handleSucursalChange,
    handleSeleccionarFormulario,
    handleGuardarRespuestas,
    handleGuardarComentario,
    handleGuardarImagenes,
    handleGuardarClasificaciones,
    handleSaveFirmaAuditor,
    handleSaveFirmaResponsable,
    verificarFirmasCompletadas,
    checkUnsavedChanges,
    handleAutoSave,
    handleDiscardChanges,
    handleSiguiente,
    handleAnterior,
    handleStepClick,
    generarReporte,
    generarNuevaAuditoria,
    handleFinalizar,
    abrirImpresionNativa
  } = handlers;

  // Hook de navegación guardada
  const navigationGuard = useNavigationGuard({
    hasUnsavedChanges: checkUnsavedChanges,
    onSave: handleAutoSave,
    onDiscard: handleDiscardChanges,
    autoSaveInterval: 30000, // 30 segundos
    showConfirmation: true
  });

  // Detectar cambios en los datos de auditoría
  useEffect(() => {
    const hasData = empresaSeleccionada || sucursalSeleccionada || formularioSeleccionadoId || 
                   respuestas.some(seccion => seccion.some(resp => resp !== '')) ||
                   comentarios.some(seccion => seccion.some(com => com !== '')) ||
                   imagenes.some(seccion => seccion.some(img => img !== null)) ||
                   clasificaciones.some(seccion => seccion.some(clas => clas && (clas.condicion || clas.actitud)));
    
    if (hasData) {
      setHasUnsavedChanges(true);
    }
  }, [empresaSeleccionada, sucursalSeleccionada, formularioSeleccionadoId, respuestas, comentarios, imagenes, clasificaciones]);

  // Refs para evitar bucle infinito en restauración
  const restoreAttemptedRef = useRef(false);
  const restoreRetriesRef = useRef(0);
  const MAX_RESTORE_RETRIES = 10; // Máximo 10 segundos de espera

  // Intentar restaurar auditoría al cargar
  useEffect(() => {
    // Evitar múltiples intentos simultáneos
    if (restoreAttemptedRef.current) return;
    if (!userProfile?.uid) return;

    const restoreAuditoria = async () => {
      if (restoreAttemptedRef.current) return;
      
      try {
        const savedData = await autoSaveService.restoreAuditoria(userProfile.uid);
        
        // Solo restaurar si hay datos Y no viene de agenda
        if (savedData && !location.state?.auditoriaId) {
          // Verificar que haya progreso real (al menos una pregunta respondida)
          const respuestasGuardadas = savedData.respuestas || [];
          const tieneProgreso = tieneProgresoReal(respuestasGuardadas);
          
          if (!tieneProgreso) {
            // No hay progreso real, limpiar y no restaurar
            restoreAttemptedRef.current = true;
            await autoSaveService.clearLocalStorage(userProfile.uid);
            return;
          }
          
          // Verificar que la auditoría esté incompleta
          const todasCompletadas = todasLasPreguntasContestadas(respuestasGuardadas);
          const isIncomplete = !savedData.estadoCompletada && 
                              (!todasCompletadas || !savedData.auditoriaGenerada);
          
          if (!isIncomplete) {
            // Si está completada, limpiar el autoguardado
            restoreAttemptedRef.current = true;
            await autoSaveService.clearLocalStorage(userProfile.uid);
            return;
          }

          // Esperar a que los formularios estén cargados antes de restaurar
          if (formularios.length === 0) {
            if (restoreRetriesRef.current < MAX_RESTORE_RETRIES) {
              restoreRetriesRef.current++;
              setTimeout(() => restoreAuditoria(), 1000);
              return;
            } else {
              // Si ya se intentó muchas veces sin éxito, marcar como intentado y salir
              restoreAttemptedRef.current = true;
              return;
            }
          }

          // Calcular el paso correcto basado en el progreso real
          const pasoCorrecto = calcularPasoCorrecto({
            respuestas: respuestasGuardadas,
            todasLasPreguntasCompletadas: todasCompletadas,
            activeStepGuardado: savedData.activeStep || 0,
            firmaAuditor: savedData.firmaAuditor,
            auditoriaGenerada: savedData.auditoriaGenerada
          });
          
          if (pasoCorrecto === null) {
            // No hay progreso suficiente para restaurar
            restoreAttemptedRef.current = true;
            await autoSaveService.clearLocalStorage(userProfile.uid);
            return;
          }

          // Marcar como intentado antes de mostrar el diálogo
          restoreAttemptedRef.current = true;

          // Calcular información del progreso para mostrar en el diálogo
          const preguntasRespondidas = contarPreguntasRespondidas(respuestasGuardadas);
          const totalPreguntas = contarTotalPreguntas(savedData.secciones || []);
          const porcentajeProgreso = totalPreguntas > 0 
            ? Math.round((preguntasRespondidas / totalPreguntas) * 100) 
            : 0;

          // Mostrar confirmación con información del progreso
          const shouldRestore = await Swal.fire({
            title: '🔄 Auditoría encontrada',
            html: `
              <p>Se encontró una auditoría guardada automáticamente.</p>
              <p style="margin-top: 10px;">
                <strong>Progreso:</strong> ${preguntasRespondidas} de ${totalPreguntas} preguntas respondidas (${porcentajeProgreso}%)
              </p>
              <p style="margin-top: 10px;">¿Quieres continuar donde lo dejaste?</p>
            `,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Continuar',
            cancelButtonText: 'Comenzar nueva',
            reverseButtons: true
          });

          if (shouldRestore.isConfirmed) {
            console.log('🔄 Restaurando auditoría con datos:', {
              respuestas: savedData.respuestas?.length || 0,
              comentarios: savedData.comentarios?.length || 0,
              imagenes: savedData.imagenes?.length || 0,
              clasificaciones: savedData.clasificaciones?.length || 0,
              secciones: savedData.secciones?.length || 0,
              contenidoRespuestas: savedData.respuestas
            });
            
            setEmpresaSeleccionada(savedData.empresaSeleccionada);
            setSucursalSeleccionada(savedData.sucursalSeleccionada);
            setFormularioSeleccionadoId(savedData.formularioSeleccionadoId);
            setSecciones(savedData.secciones || []);
            
            // Asegurar que respuestas, comentarios e imágenes sean arrays
            const respuestasRestauradas = Array.isArray(savedData.respuestas) 
              ? savedData.respuestas 
              : (typeof savedData.respuestas === 'string' ? JSON.parse(savedData.respuestas) : []);
            
            const comentariosRestaurados = Array.isArray(savedData.comentarios) 
              ? savedData.comentarios 
              : (typeof savedData.comentarios === 'string' ? JSON.parse(savedData.comentarios) : []);
            
            const imagenesRestauradas = Array.isArray(savedData.imagenes) 
              ? savedData.imagenes 
              : (typeof savedData.imagenes === 'string' ? JSON.parse(savedData.imagenes) : []);
            
            const clasificacionesRestauradas = Array.isArray(savedData.clasificaciones) 
              ? savedData.clasificaciones 
              : (typeof savedData.clasificaciones === 'string' ? JSON.parse(savedData.clasificaciones) : []);
            
            console.log('📋 Respuestas restauradas (contenido):', JSON.stringify(respuestasRestauradas));
            console.log('📋 Respuestas restauradas (estructura):', {
              length: respuestasRestauradas.length,
              primeraSeccion: respuestasRestauradas[0],
              todasLasSecciones: respuestasRestauradas.map((seccion, idx) => ({
                seccion: idx,
                length: seccion?.length || 0,
                contenido: seccion,
                todasRespondidas: seccion?.every(resp => resp !== '' && resp !== null && resp !== undefined) || false
              }))
            });
            
            // Verificar inmediatamente si están completas
            const todasCompletadasAhora = todasLasPreguntasContestadas(respuestasRestauradas);
            console.log('✅ Verificación inmediata - Todas completadas:', todasCompletadasAhora);
            
            // Restaurar estados - IMPORTANTE: hacerlo en este orden
            setRespuestas(respuestasRestauradas);
            setComentarios(comentariosRestaurados);
            setImagenes(imagenesRestauradas);
            setClasificaciones(clasificacionesRestauradas);
            
            // Restaurar firmas si existen (pero no las usaremos para determinar el paso)
            if (savedData.firmaAuditor) {
              setFirmaAuditor(savedData.firmaAuditor);
            }
            if (savedData.firmaResponsable) {
              setFirmaResponsable(savedData.firmaResponsable);
            }
            
            // SIMPLIFICADO: Siempre ir al paso de preguntas si hay respuestas guardadas
            setActiveStep(2); // Paso de preguntas
            setHasUnsavedChanges(false);
            setLastSaved(savedData.timestamp);
            
            // Forzar re-render para que el botón "Siguiente" se actualice correctamente
            // Usar setTimeout para asegurar que el estado se haya actualizado completamente
            setTimeout(() => {
              console.log('🔄 [Auditoria] Estado después de restaurar:', {
                respuestasLength: respuestasRestauradas.length,
                todasCompletadas: todasLasPreguntasContestadas(respuestasRestauradas),
                pasoCompleto2: pasoCompleto(2, {
                  empresaSeleccionada: savedData.empresaSeleccionada,
                  formularioSeleccionadoId: savedData.formularioSeleccionadoId,
                  respuestas: respuestasRestauradas
                })
              });
              
              // Forzar actualización del botón "Siguiente" re-evaluando pasoCompletoAuditoria
              // Esto asegura que el botón se habilite correctamente
              const paso2Completo = pasoCompletoAuditoria(2);
              console.log('🔄 [Auditoria] Re-evaluando paso 2 después de restaurar:', paso2Completo);
              
              // Forzar un re-render adicional para asegurar que el botón se actualice
              // Esto es necesario porque React puede no actualizar inmediatamente después de setState
              setForceUpdate(prev => prev + 1);
            }, 200);
            
            console.log('✅ Auditoría restaurada:', {
              paso: 2,
              progreso: `${preguntasRespondidas}/${totalPreguntas}`,
              respuestasRestauradas: respuestasRestauradas.length,
              comentariosRestaurados: comentariosRestaurados.length,
              imagenesRestauradas: imagenesRestauradas.length,
              clasificacionesRestauradas: clasificacionesRestauradas.length,
              todasCompletadas: todasLasPreguntasContestadas(respuestasRestauradas)
            });
          } else {
            // Limpiar datos guardados si no se quiere restaurar
            await autoSaveService.clearLocalStorage(userProfile.uid);
          }
        } else {
          // No hay datos para restaurar, marcar como intentado
          restoreAttemptedRef.current = true;
        }
      } catch (error) {
        console.error('❌ Error al restaurar auditoría:', error);
        restoreAttemptedRef.current = true;
      }
    };

    restoreAuditoria();
  }, [userProfile?.uid, location.state?.auditoriaId, formularios]);
  
  // Resetear la bandera cuando cambian los formularios (para permitir reintento si se cargan después)
  useEffect(() => {
    if (formularios.length > 0 && !restoreAttemptedRef.current && restoreRetriesRef.current > 0) {
      // Si los formularios se cargaron después de un intento fallido, permitir un nuevo intento
      restoreAttemptedRef.current = false;
      restoreRetriesRef.current = 0;
    }
  }, [formularios.length]);

  // Forzar actualización del botón "Siguiente" cuando se restauran las respuestas
  useEffect(() => {
    // Este efecto se ejecutará cada vez que cambien las respuestas
    // Esto asegura que el botón "Siguiente" se actualice correctamente
    if (respuestas && respuestas.length > 0) {
      const todasCompletadas = todasLasPreguntasContestadas(respuestas);
      const paso2Completo = pasoCompleto(2, {
        empresaSeleccionada,
        formularioSeleccionadoId,
        respuestas
      });
      
      console.log('🔄 [Auditoria] Respuestas cambiaron, verificando paso completo:', {
        todasCompletadas,
        paso2Completo,
        respuestasLength: respuestas.length,
        respuestasEstructura: respuestas.map((seccion, idx) => ({
          seccion: idx,
          length: seccion?.length || 0,
          todasRespondidas: seccion?.every(resp => resp !== '' && resp !== null && resp !== undefined) || false,
          contenido: seccion
        }))
      });
    }
  }, [respuestas, empresaSeleccionada, formularioSeleccionadoId]);

  // Guardar antes de cerrar/refrescar la página
  useEffect(() => {
    const handleBeforeUnload = async (e) => {
      // Solo guardar si hay cambios sin guardar
      if (checkUnsavedChanges && checkUnsavedChanges()) {
        // Intentar guardar de forma síncrona usando sendBeacon o similar
        // Como no podemos hacer async en beforeunload, guardamos de forma sincrónica
        try {
          // Forzar guardado inmediato antes de cerrar
          await handleAutoSave(true);
          console.log('💾 Guardado antes de cerrar/refrescar');
        } catch (error) {
          console.error('❌ Error al guardar antes de cerrar:', error);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [checkUnsavedChanges, handleAutoSave]);


  // Verificar firmas cuando cambien
  useEffect(() => {
    console.log('[DEBUG] useEffect firmas - firmaAuditor:', firmaAuditor, 'firmaResponsable:', firmaResponsable);
    verificarFirmasCompletadas();
  }, [firmaAuditor, firmaResponsable]);

  // Funciones de validación (ahora usando utils)
  const validarTodasLasPreguntas = () => todasLasPreguntasContestadas(respuestas);
  const obtenerUbicacion = () => obtenerTipoUbicacion(empresaSeleccionada, sucursalSeleccionada, sucursales);

  // Funciones de navegación (ahora usando utils)
  const calcularProgresoAuditoria = useCallback(() => calcularProgreso({
    empresaSeleccionada,
    formularioSeleccionadoId,
    secciones,
    respuestas,
    firmasCompletadas
  }), [empresaSeleccionada, formularioSeleccionadoId, secciones, respuestas, firmasCompletadas]);

  const getStepStatusAuditoria = (step) => getStepStatus(step, {
    empresaSeleccionada,
    formularioSeleccionadoId,
    secciones,
    respuestas
  });

  const pasoCompletoAuditoria = useCallback((step) => {
    const todasCompletadas = todasLasPreguntasContestadas(respuestas);
    const resultado = pasoCompleto(step, {
      empresaSeleccionada,
      formularioSeleccionadoId,
      respuestas
    });
    
    // Log detallado solo para el paso 2 (preguntas)
    if (step === 2) {
      console.log(`[DEBUG] Paso ${step} completo:`, resultado, {
        respuestasLength: respuestas?.length || 0,
        respuestasEstructura: respuestas?.map((seccion, idx) => ({
          seccion: idx,
          length: seccion?.length || 0,
          todasRespondidas: seccion?.every(resp => resp !== '' && resp !== null && resp !== undefined) || false,
          contenido: seccion
        })) || [],
        todasCompletadas,
        todasCompletadasDetalle: respuestas?.every(seccionRespuestas => {
          if (!Array.isArray(seccionRespuestas)) return false;
          return seccionRespuestas.every(respuesta => 
            respuesta !== '' && respuesta !== null && respuesta !== undefined
          );
        }) || false
      });
    }
    
    return resultado;
  }, [empresaSeleccionada, formularioSeleccionadoId, respuestas]);

  // Estado para forzar re-render
  const [forceUpdate, setForceUpdate] = useState(0);

  // Función para forzar actualización del estado (botón "Actualizar")
  const handleForzarActualizacion = useCallback(() => {
    console.log('🔄 [Auditoria] Forzando actualización del estado...');
    console.log('🔄 [Auditoria] Estado actual respuestas:', respuestas);
    
    // Si hay respuestas, simplemente llamar a handleGuardarRespuestas para forzar actualización
    if (respuestas && respuestas.length > 0) {
      // Crear una copia nueva del array para forzar la actualización
      const nuevasRespuestas = respuestas.map(seccion => [...seccion]);
      
      // Encontrar la primera respuesta con valor para desmarcar y remarcar
      let encontrada = false;
      for (let i = 0; i < nuevasRespuestas.length && !encontrada; i++) {
        if (nuevasRespuestas[i] && Array.isArray(nuevasRespuestas[i])) {
          for (let j = 0; j < nuevasRespuestas[i].length && !encontrada; j++) {
            if (nuevasRespuestas[i][j] && nuevasRespuestas[i][j] !== '' && nuevasRespuestas[i][j] !== null && nuevasRespuestas[i][j] !== undefined) {
              const valorOriginal = nuevasRespuestas[i][j];
              console.log(`🔄 [Auditoria] Desmarcando y remarcando respuesta en sección ${i}, pregunta ${j}: ${valorOriginal}`);
              
              // Desmarcar temporalmente
              nuevasRespuestas[i][j] = '';
              
              // Guardar primero con la respuesta desmarcada
              handleGuardarRespuestas(nuevasRespuestas);
              
              // Remarcar después de un pequeño delay
              setTimeout(() => {
                nuevasRespuestas[i][j] = valorOriginal;
                handleGuardarRespuestas(nuevasRespuestas);
                console.log('🔄 [Auditoria] Respuesta remarcada');
              }, 100);
              
              encontrada = true;
            }
          }
        }
      }
      
      if (!encontrada) {
        console.log('⚠️ [Auditoria] No se encontraron respuestas válidas, forzando guardado de todas formas');
        // Si no hay respuestas válidas, simplemente forzar guardado
        handleGuardarRespuestas(nuevasRespuestas);
      }
    } else {
      console.log('⚠️ [Auditoria] No hay respuestas para actualizar');
      setForceUpdate(prev => prev + 1);
    }
  }, [respuestas, handleGuardarRespuestas]);

  // Función para marcar auditoría como completada
  const marcarAuditoriaCompletada = async () => {
    try {
      if (auditoriaIdAgenda) {
        await updateDoc(doc(db, "auditorias", auditoriaIdAgenda), { estado: "completada" });
        log("Auditoría agendada (ID: %s) marcada como completada.", auditoriaIdAgenda);
        setSnackbarMsg("Auditoría agendada marcada como completada.");
        setSnackbarType("success");
        setSnackbarOpen(true);
      }
    } catch (error) {
      log("Error al marcar auditoría como completada:", error);
      setSnackbarMsg("Error al marcar auditoría como completada.");
      setSnackbarType("error");
      setSnackbarOpen(true);
    }
  };


  // Configurar secciones cuando cambie el formulario (ahora usando utils)
  // IMPORTANTE: No sobrescribir respuestas si ya existen (por ejemplo, después de restaurar)
  useEffect(() => {
    if (formularioSeleccionadoId) {
      const configuracion = configurarFormulario(formularioSeleccionadoId, formularios);
      setSecciones(configuracion.secciones);
      
      // Solo resetear respuestas si no hay respuestas existentes con datos
      const tieneRespuestasExistentes = respuestas && respuestas.length > 0 && 
        respuestas.some(seccion => seccion && seccion.some(resp => resp !== '' && resp !== null && resp !== undefined));
      
      if (!tieneRespuestasExistentes) {
        setRespuestas(configuracion.respuestas);
        setComentarios(configuracion.comentarios);
        setImagenes(configuracion.imagenes);
        setClasificaciones(configuracion.clasificaciones);
      } else {
        // Si hay respuestas existentes, solo asegurar que las secciones coincidan
        // pero mantener las respuestas existentes
        console.log('🔄 [Auditoria] Manteniendo respuestas existentes al cambiar formulario');
      }
    }
  }, [formularioSeleccionadoId, formularios]);

  // Configurar datos de agenda
  useEffect(() => {
    if (
      location.state?.empresa &&
      empresas.length > 0 &&
      !empresaSeleccionada
    ) {
      const empresa = empresas.find(e => e.id === location.state.empresa || e.nombre === location.state.empresa);
      if (empresa) {
        setEmpresaSeleccionada(empresa);
        console.log('[DEBUG Auditoria] Empresa seleccionada por agenda:', empresa);
      }
    }
    
    if (
      location.state?.sucursal &&
      sucursales.length > 0 &&
      !sucursalSeleccionada
    ) {
      const sucursal = sucursales.find(s => s.id === location.state.sucursal || s.nombre === location.state.sucursal);
      if (sucursal) {
        setSucursalSeleccionada(sucursal.nombre);
        console.log('[DEBUG Auditoria] Sucursal seleccionada por agenda:', sucursal);
      } else {
        setSucursalSeleccionada(location.state.sucursal);
      }
    }
  }, [location.state, empresas, sucursales, empresaSeleccionada, sucursalSeleccionada]);

  // Salto automático al paso 2 si viene de la agenda
  useEffect(() => {
    if (
      location.state?.empresa &&
      location.state?.formularioId &&
      empresaSeleccionada &&
      sucursalSeleccionada &&
      formularioSeleccionadoId &&
      activeStep === 0
    ) {
      setActiveStep(1);
      console.log('[DEBUG Auditoria] Salto automático al paso 2 por agenda');
    }
  }, [location.state, empresaSeleccionada, sucursalSeleccionada, formularioSeleccionadoId, activeStep]);

  // Debug: Verificar clasificaciones antes de crear pasos
  useEffect(() => {
    console.log('🔍 [Auditoria] clasificaciones en estado:', clasificaciones);
    console.log('🔍 [Auditoria] Tipo:', typeof clasificaciones, Array.isArray(clasificaciones));
    if (Array.isArray(clasificaciones) && clasificaciones.length > 0) {
      console.log('🔍 [Auditoria] Contenido:', JSON.stringify(clasificaciones, null, 2));
    }
  }, [clasificaciones]);

  // Crear los pasos usando el componente
  const steps = useMemo(() => createAuditoriaSteps({
    // Estados
    empresas,
    empresaSeleccionada,
    sucursales,
    sucursalSeleccionada,
    formularios,
    formularioSeleccionadoId,
    secciones,
    respuestas,
    comentarios,
    imagenes,
    clasificaciones,
    firmaAuditor,
    firmaResponsable,
    firmasCompletadas,
    datosReporte,
    bloquearDatosAgenda,
    location,
    
    // Handlers
    handleEmpresaChange,
    handleSucursalChange,
    handleSeleccionarFormulario,
    handleGuardarRespuestas,
    handleGuardarComentario,
    handleGuardarImagenes,
    handleGuardarClasificaciones,
    handleSaveFirmaAuditor,
    handleSaveFirmaResponsable,
    handleFinalizar: () => handleFinalizar(marcarAuditoriaCompletada),
    setDatosReporte,
    
    // Funciones
    obtenerUbicacion,
    validarTodasLasPreguntas,
    setOpenAlertaEdicion,
    
    // Tema
    theme,
    isMobile
  }), [
    empresas,
    empresaSeleccionada,
    sucursales,
    sucursalSeleccionada,
    formularios,
    formularioSeleccionadoId,
    secciones,
    respuestas,
    comentarios,
    imagenes,
    clasificaciones,
    firmaAuditor,
    firmaResponsable,
    firmasCompletadas,
    datosReporte,
    bloquearDatosAgenda,
    location,
    handleEmpresaChange,
    handleSucursalChange,
    handleSeleccionarFormulario,
    handleGuardarRespuestas,
    handleGuardarComentario,
    handleGuardarImagenes,
    handleGuardarClasificaciones,
    handleSaveFirmaAuditor,
    handleSaveFirmaResponsable,
    setDatosReporte,
    obtenerUbicacion,
    validarTodasLasPreguntas,
    setOpenAlertaEdicion,
    theme,
    isMobile
  ]);

  // Scroll al top cuando se llega al paso de firmas (paso 3)
  useEffect(() => {
    if (activeStep === 3) {
      // Delay para asegurar que el contenido se haya renderizado
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        // También intentar hacer scroll al Container principal
        const container = document.querySelector('[class*="MuiContainer"]');
        if (container) {
          container.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 400);
    }
  }, [activeStep]);

  return (
    <Container maxWidth={isMobile ? false : "xl"} sx={{ py: isMobile ? 1 : 4, px: isMobile ? 0 : 2 }}>
      {/* Indicador de carga de datos de respaldo */}
      {cargandoDatosRespaldo && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2">
            🔄 Cargando datos necesarios para crear auditorías...
          </Typography>
          <LinearProgress sx={{ mt: 1 }} />
        </Alert>
      )}
      
      {/* Debug info - solo para supermax */}
      {role === 'supermax' && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2">
            <strong>Debug Info:</strong>
            <br />
            🌐 Navegador: {navigator.userAgent.includes('Edg') ? 'Edge' : 'Chrome/Firefox'}
            <br />
            📊 Empresas: {userEmpresas?.length || 0}
            <br />
            🏢 Sucursales: {userSucursales?.length || 0}
            <br />
            📋 Formularios: {userFormularios?.length || 0}
            <br />
            👤 Usuario: {userProfile?.email || 'Sin usuario'}
            <br />
            💾 Cache localStorage: {localStorage.getItem('complete_user_cache') ? 'Disponible' : 'No disponible'}
          </Typography>
          <Button 
            size="small" 
            onClick={() => window.location.reload()} 
            sx={{ mt: 1 }}
          >
            🔄 Recargar página
          </Button>
        </Alert>
      )}
      
      {/* Header con navegación y progreso */}
      <AuditoriaHeader
        navigate={navigate}
        location={location}
        calcularProgresoAuditoria={calcularProgresoAuditoria}
        mostrarAlertaReinicio={mostrarAlertaReinicio}
        setMostrarAlertaReinicio={setMostrarAlertaReinicio}
        theme={theme}
        isMobile={isMobile}
      />

      {/* Alertas de estado para datos faltantes */}
      <AlertasFaltantes
        cargandoDatosRespaldo={cargandoDatosRespaldo}
        userEmpresas={userEmpresas}
        userSucursales={userSucursales}
        userFormularios={userFormularios}
        empresas={empresas}
        sucursales={sucursales}
        formularios={formularios}
      />

      {/* Contenido principal */}
      {!auditoriaGenerada ? (
        <AuditoriaStepper
          activeStep={activeStep}
          setActiveStep={setActiveStep}
          steps={steps}
          pasoCompleto={pasoCompletoAuditoria}
          getStepStatus={getStepStatusAuditoria}
          handleStepClick={(index) => handleStepClick(index, pasoCompletoAuditoria)}
          navegacionError={navegacionError}
          errores={errores}
          handleAnterior={handleAnterior}
          handleSiguiente={() => handleSiguiente(pasoCompletoAuditoria)}
          handleForzarActualizacion={handleForzarActualizacion}
          // Props para los componentes
          empresas={empresas}
          empresaSeleccionada={empresaSeleccionada}
          handleEmpresaChange={handleEmpresaChange}
          sucursales={sucursales}
          sucursalSeleccionada={sucursalSeleccionada}
          handleSucursalChange={handleSucursalChange}
          bloquearDatosAgenda={bloquearDatosAgenda}
          setOpenAlertaEdicion={setOpenAlertaEdicion}
          formularios={formularios}
          formularioSeleccionadoId={formularioSeleccionadoId}
          handleSeleccionarFormulario={handleSeleccionarFormulario}
          secciones={secciones}
          handleGuardarRespuestas={handleGuardarRespuestas}
          handleGuardarComentario={handleGuardarComentario}
          handleGuardarImagenes={handleGuardarImagenes}
          respuestas={respuestas}
          comentarios={comentarios}
          imagenes={imagenes}
          todasLasPreguntasContestadas={validarTodasLasPreguntas}
          handleSaveFirmaAuditor={handleSaveFirmaAuditor}
          handleSaveFirmaResponsable={handleSaveFirmaResponsable}
          firmaAuditor={firmaAuditor}
          firmaResponsable={firmaResponsable}
          firmasCompletadas={firmasCompletadas}
          location={location}
          obtenerTipoUbicacion={obtenerUbicacion}
          theme={theme}
        />
      ) : (
        <AuditoriaCompletada
          generarNuevaAuditoria={generarNuevaAuditoria}
          navigate={navigate}
          abrirImpresionNativa={() => abrirImpresionNativa({
            empresaSeleccionada,
            sucursalSeleccionada,
            formularios,
            formularioSeleccionadoId,
            userProfile,
            secciones,
            respuestas,
            comentarios,
            imagenes,
            clasificaciones,
            firmaAuditor,
            firmaResponsable
          })}
        />
      )}

      {/* Reporte */}
      {mostrarReporte && (
        <Zoom in={true} timeout={800}>
          <Paper elevation={6} sx={{ p: 4, mt: 4, borderRadius: 3 }}>
            <ReporteConImpresion 
              empresa={empresaSeleccionada} 
              sucursal={sucursalSeleccionada} 
              formulario={formularios.find(formulario => formulario.id === formularioSeleccionadoId)}
              respuestas={respuestas} 
              comentarios={comentarios}
              imagenes={imagenes}
              secciones={secciones} 
              formularios={formularios}
            />
          </Paper>
        </Zoom>
      )}

      {/* Snackbars */}
      <Snackbar open={openAlertaEdicion} autoHideDuration={6000} onClose={() => setOpenAlertaEdicion(false)}>
        <MuiAlert
          onClose={() => setOpenAlertaEdicion(false)}
          severity="warning"
          action={
            <MuiButton color="inherit" size="small" onClick={() => {
              setBloquearDatosAgenda(false);
              setOpenAlertaEdicion(false);
              log("El usuario desbloqueó los datos de agenda para edición manual.");
              setSnackbarMsg("Ahora puedes editar los datos de empresa, sucursal y formulario.");
              setSnackbarType("info");
              setSnackbarOpen(true);
            }}>
              Editar Igualmente
            </MuiButton>
          }
        >
          Esta auditoría proviene de la agenda. ¿Deseas editar los datos igualmente?
        </MuiAlert>
      </Snackbar>
      
      {/* Alerta de autoguardado - Deshabilitada para no interferir con la cámara */}
      <AutoSaveAlert
        isSaving={isSaving}
        lastSaved={lastSaved}
        hasUnsavedChanges={hasUnsavedChanges}
        showAlert={false}
      />

      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={() => setSnackbarOpen(false)}>
        <MuiAlert onClose={() => setSnackbarOpen(false)} severity={snackbarType} sx={{ width: '100%' }}>
          {snackbarMsg}
        </MuiAlert>
      </Snackbar>

      {/* Debug offline para verificar datos del usuario */}
      <SimpleOfflineDebug />
      
      {/* Debug específico para auditorías */}
      <AuditoriaDebugInfo />
    </Container>
  );
};

export default AuditoriaRefactorizada; 