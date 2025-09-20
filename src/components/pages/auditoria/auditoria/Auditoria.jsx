import React, { useEffect, useState, useCallback } from "react";
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
  const { userProfile, userEmpresas, userFormularios } = useAuth();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Estados para autoguardado
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

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
    userFormularios
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
  });

  // Extraer handlers del hook
  const {
    handleEmpresaChange,
    handleSucursalChange,
    handleSeleccionarFormulario,
    handleGuardarRespuestas,
    handleGuardarComentario,
    handleGuardarImagenes,
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
                   imagenes.some(seccion => seccion.some(img => img !== null));
    
    if (hasData) {
      setHasUnsavedChanges(true);
    }
  }, [empresaSeleccionada, sucursalSeleccionada, formularioSeleccionadoId, respuestas, comentarios, imagenes]);

  // Intentar restaurar auditoría al cargar
  useEffect(() => {
    const restoreAuditoria = async () => {
      if (!userProfile?.uid) return;

      try {
        const savedData = await autoSaveService.restoreAuditoria(userProfile.uid);
        if (savedData && !location.state?.auditoriaId) {
          // Mostrar confirmación para restaurar
          const shouldRestore = await Swal.fire({
            title: '🔄 Auditoría encontrada',
            text: 'Se encontró una auditoría guardada automáticamente. ¿Quieres restaurarla?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Restaurar',
            cancelButtonText: 'Comenzar nueva',
            reverseButtons: true
          });

          if (shouldRestore.isConfirmed) {
            setEmpresaSeleccionada(savedData.empresaSeleccionada);
            setSucursalSeleccionada(savedData.sucursalSeleccionada);
            setFormularioSeleccionadoId(savedData.formularioSeleccionadoId);
            setSecciones(savedData.secciones || []);
            setRespuestas(savedData.respuestas || []);
            setComentarios(savedData.comentarios || []);
            setImagenes(savedData.imagenes || []);
            setActiveStep(savedData.activeStep || 0);
            setHasUnsavedChanges(false);
            setLastSaved(savedData.timestamp);
            
            console.log('✅ Auditoría restaurada');
          } else {
            // Limpiar datos guardados si no se quiere restaurar
            autoSaveService.clearLocalStorage();
          }
        }
      } catch (error) {
        console.error('❌ Error al restaurar auditoría:', error);
      }
    };

    restoreAuditoria();
  }, [userProfile?.uid, location.state?.auditoriaId]);


  // Verificar firmas cuando cambien
  useEffect(() => {
    console.log('[DEBUG] useEffect firmas - firmaAuditor:', firmaAuditor, 'firmaResponsable:', firmaResponsable);
    verificarFirmasCompletadas();
  }, [firmaAuditor, firmaResponsable]);

  // Funciones de validación (ahora usando utils)
  const validarTodasLasPreguntas = () => todasLasPreguntasContestadas(respuestas);
  const obtenerUbicacion = () => obtenerTipoUbicacion(empresaSeleccionada, sucursalSeleccionada, sucursales);

  // Funciones de navegación (ahora usando utils)
  const calcularProgresoAuditoria = () => calcularProgreso({
    empresaSeleccionada,
    formularioSeleccionadoId,
    secciones,
    respuestas,
    firmasCompletadas
  });

  const getStepStatusAuditoria = (step) => getStepStatus(step, {
    empresaSeleccionada,
    formularioSeleccionadoId,
    secciones,
    respuestas
  });

  const pasoCompletoAuditoria = (step) => {
    const resultado = pasoCompleto(step, {
      empresaSeleccionada,
      formularioSeleccionadoId,
      respuestas
    });
    console.log(`[DEBUG] Paso ${step} completo:`, resultado);
    return resultado;
  };



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
  useEffect(() => {
    if (formularioSeleccionadoId) {
      const configuracion = configurarFormulario(formularioSeleccionadoId, formularios);
      setSecciones(configuracion.secciones);
      setRespuestas(configuracion.respuestas);
      setComentarios(configuracion.comentarios);
      setImagenes(configuracion.imagenes);
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

  // Crear los pasos usando el componente
  const steps = createAuditoriaSteps({
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
    firmaAuditor,
    firmaResponsable,
    firmasCompletadas,
    bloquearDatosAgenda,
    location,
    
    // Handlers
    handleEmpresaChange,
    handleSucursalChange,
    handleSeleccionarFormulario,
    handleGuardarRespuestas,
    handleGuardarComentario,
    handleGuardarImagenes,
    handleSaveFirmaAuditor,
    handleSaveFirmaResponsable,
    handleFinalizar: () => handleFinalizar(marcarAuditoriaCompletada),
    
    // Funciones
    obtenerUbicacion,
    validarTodasLasPreguntas,
    setOpenAlertaEdicion,
    
    // Tema
    theme,
    isMobile
  });

  return (
    <Container maxWidth={isMobile ? false : "xl"} sx={{ py: isMobile ? 1 : 4, px: isMobile ? 0 : 2 }}>
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