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

// Componentes
import AuditoriaStepper from "./components/AuditoriaStepper";
import AuditoriaCompletada from "./components/AuditoriaCompletada";
import AutoSaveAlert from "./components/AutoSaveAlert";

// Servicios
import AuditoriaService from "../auditoriaService";
import { buildReporteMetadata } from '../../../../services/useMetadataService';
import autoSaveService from "./services/autoSaveService";

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

  // Funciones de manejo de datos
  const handleEmpresaChange = (selectedEmpresa) => {
    setEmpresaSeleccionada(selectedEmpresa);
    setSucursalSeleccionada("");
    setFormularioSeleccionadoId("");
    setActiveStep(0);
  };

  const handleSucursalChange = (e) => {
    setSucursalSeleccionada(e.target.value);
  };

  const handleSeleccionarFormulario = (e) => {
    setFormularioSeleccionadoId(e.target.value);
    setActiveStep(1);
  };

  const handleGuardarRespuestas = (nuevasRespuestas) => {
    setRespuestas(nuevasRespuestas);
  };

  const handleGuardarComentario = (nuevosComentarios) => {
    setComentarios(nuevosComentarios);
  };

  const handleGuardarImagenes = (nuevasImagenes) => {
    setImagenes(nuevasImagenes);
  };

  // Funciones de autoguardado
  const checkUnsavedChanges = useCallback(() => {
    // Verificar si hay datos de auditoría con cambios
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
        imagenes: imagenes.map(seccion => seccion.map(img => img ? 'image' : null)), // Solo guardar referencias
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
  }, [userProfile?.uid, empresaSeleccionada, sucursalSeleccionada, formularioSeleccionadoId, secciones, respuestas, comentarios, imagenes, activeStep]);

  const handleDiscardChanges = useCallback(async () => {
    try {
      autoSaveService.clearLocalStorage();
      setHasUnsavedChanges(false);
      setLastSaved(null);
      console.log('🗑️ Cambios descartados');
    } catch (error) {
      console.error('❌ Error al descartar cambios:', error);
    }
  }, []);

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

  const handleSaveFirmaAuditor = (firmaURL) => {
    console.log('[DEBUG] handleSaveFirmaAuditor llamado con:', firmaURL);
    setFirmaAuditor(firmaURL);
    verificarFirmasCompletadas();
  };

  const handleSaveFirmaResponsable = (firmaURL) => {
    setFirmaResponsable(firmaURL);
    verificarFirmasCompletadas();
  };

  const verificarFirmasCompletadas = () => {
    // Las firmas son opcionales - siempre considerar como completadas
    const completadas = true; // Siempre true porque las firmas son opcionales
    console.log('[DEBUG] Verificando firmas (opcionales):', { firmaAuditor, firmaResponsable, completadas });
    setFirmasCompletadas(completadas);
  };

  // Verificar firmas cuando cambien
  useEffect(() => {
    console.log('[DEBUG] useEffect firmas - firmaAuditor:', firmaAuditor, 'firmaResponsable:', firmaResponsable);
    verificarFirmasCompletadas();
  }, [firmaAuditor, firmaResponsable]);

  // Funciones de validación
  const todasLasPreguntasContestadas = () => {
    return respuestas.every(seccionRespuestas => 
      seccionRespuestas.every(respuesta => respuesta !== '')
    );
  };

  const obtenerTipoUbicacion = () => {
    if (!empresaSeleccionada) return "";
    
    if (sucursales.length === 0) {
      return "Casa Central";
    }
    
    if (sucursalSeleccionada && sucursalSeleccionada !== "Sin sucursal específica") {
      return `Sucursal: ${sucursalSeleccionada}`;
    }
    
    return "Casa Central";
  };

  // Funciones de navegación
  const calcularProgreso = () => {
    let progreso = 0;
    if (empresaSeleccionada) progreso += 25;
    if (formularioSeleccionadoId) progreso += 25;
    if (secciones.length > 0) progreso += 25;
    if (todasLasPreguntasContestadas()) progreso += 25;
    // Las firmas son opcionales, no afectan el progreso
    return progreso;
  };

  const getStepStatus = (step) => {
    switch (step) {
      case 0: return empresaSeleccionada ? 'completed' : 'active';
      case 1: return formularioSeleccionadoId ? 'completed' : (empresaSeleccionada ? 'active' : 'disabled');
      case 2: return secciones.length > 0 ? 'completed' : (formularioSeleccionadoId ? 'active' : 'disabled');
      case 3: return todasLasPreguntasContestadas() ? 'completed' : (secciones.length > 0 ? 'active' : 'disabled');
      case 4: return true ? 'completed' : (todasLasPreguntasContestadas() ? 'active' : 'disabled'); // Firmas opcionales
      default: return 'disabled';
    }
  };

  const pasoCompleto = (step) => {
    const resultado = (() => {
      switch (step) {
        case 0: return !!empresaSeleccionada;
        case 1: return !!formularioSeleccionadoId;
        case 2: return todasLasPreguntasContestadas();
        case 3: return true; // Las firmas son opcionales, siempre considerar como completo
        default: return false;
      }
    })();
    
    console.log(`[DEBUG] Paso ${step} completo:`, resultado);
    return resultado;
  };

  const handleSiguiente = () => {
    setNavegacionError("");
    if (!pasoCompleto(activeStep)) {
      setNavegacionError("Debes completar este paso antes de continuar.");
      return;
    }
    setActiveStep((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const handleAnterior = () => {
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
  };

  const handleStepClick = (index) => {
    setNavegacionError("");
    
    for (let i = 0; i < index; i++) {
      if (!pasoCompleto(i)) {
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
  };

  // Funciones de auditoría
  const generarReporte = () => {
    if (!todasLasPreguntasContestadas()) {
      setErrores(["Por favor, responda todas las preguntas antes de generar el reporte."]);
      return;
    }
    
    if (!firmaAuditor) {
      setErrores(["Por favor, complete la firma del auditor antes de generar el reporte."]);
      return;
    }
    
    setMostrarReporte(true);
    setErrores([]);
    setAuditoriaGenerada(true);
    setActiveStep(4);
  };

  const generarNuevaAuditoria = () => {
    reiniciarAuditoria();
    navigate('/auditoria', { replace: true });
    log("Nueva auditoría iniciada - todos los estados reiniciados");
  };

  const handleFinalizar = async () => {
    await marcarAuditoriaCompletada();
    setAuditoriaGenerada(true);
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

  // Función para generar contenido de impresión
  const generarContenidoImpresion = () => {
    const fecha = new Date().toLocaleDateString('es-ES');
    const hora = new Date().toLocaleTimeString('es-ES');
    
    let contenido = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Auditoría - ${empresaSeleccionada?.nombre || 'Empresa'}</title>
        <style>
          @media print {
            body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
            .empresa-info { margin-bottom: 20px; }
            .seccion { margin-bottom: 30px; page-break-inside: avoid; }
            .seccion h3 { color: #333; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
            .pregunta { margin-bottom: 15px; page-break-inside: avoid; }
            .pregunta-texto { font-weight: bold; margin-bottom: 5px; }
            .respuesta { margin-left: 20px; margin-bottom: 5px; }
            .comentario { margin-left: 20px; font-style: italic; color: #666; }
            .imagen { max-width: 200px; max-height: 150px; margin: 10px 0; }
            .firmas { margin-top: 30px; display: flex; justify-content: space-between; }
            .firma { text-align: center; width: 45%; }
            .firma img { max-width: 200px; max-height: 100px; border: 1px solid #ccc; }
            .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
            @page { margin: 1cm; }
            .no-print, button, .MuiButton-root { display: none !important; }
          }
          body { font-family: Arial, sans-serif; line-height: 1.6; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
          .empresa-info { margin-bottom: 20px; }
          .seccion { margin-bottom: 30px; }
          .seccion h3 { color: #333; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
          .pregunta { margin-bottom: 15px; }
          .pregunta-texto { font-weight: bold; margin-bottom: 5px; }
          .respuesta { margin-left: 20px; margin-bottom: 5px; }
          .comentario { margin-left: 20px; font-style: italic; color: #666; }
          .imagen { max-width: 200px; max-height: 150px; margin: 10px 0; }
          .firmas { margin-top: 30px; display: flex; justify-content: space-between; }
          .firma { text-align: center; width: 45%; }
          .firma img { max-width: 200px; max-height: 100px; border: 1px solid #ccc; }
          .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>REPORTE DE AUDITORÍA</h1>
          <p><strong>Fecha:</strong> ${fecha} | <strong>Hora:</strong> ${hora}</p>
        </div>
        
        <div class="empresa-info">
          <h2>Información de la Auditoría</h2>
          <p><strong>Empresa:</strong> ${empresaSeleccionada?.nombre || 'No especificada'}</p>
          <p><strong>Ubicación:</strong> ${sucursalSeleccionada && sucursalSeleccionada.trim() !== "" ? sucursalSeleccionada : 'Casa Central'}</p>
          <p><strong>Formulario:</strong> ${formularios.find(f => f.id === formularioSeleccionadoId)?.nombre || 'No especificado'}</p>
          <p><strong>Auditor:</strong> ${userProfile?.displayName || userProfile?.email || 'Usuario'}</p>
        </div>
    `;

    // Agregar secciones y preguntas
    if (secciones && secciones.length > 0) {
      secciones.forEach((seccion, seccionIndex) => {
        contenido += `
          <div class="seccion">
            <h3>${seccion.nombre}</h3>
        `;

        if (seccion.preguntas && seccion.preguntas.length > 0) {
          seccion.preguntas.forEach((pregunta, preguntaIndex) => {
            const respuesta = respuestas[seccionIndex]?.[preguntaIndex] || 'No respondida';
            const comentario = comentarios[seccionIndex]?.[preguntaIndex] || '';
            const imagen = imagenes[seccionIndex]?.[preguntaIndex];

            contenido += `
              <div class="pregunta">
                <div class="pregunta-texto">${preguntaIndex + 1}. ${pregunta}</div>
                <div class="respuesta"><strong>Respuesta:</strong> ${respuesta}</div>
                ${comentario && comentario.trim() !== '' ? `<div class="comentario"><strong>Comentario:</strong> ${comentario}</div>` : ''}
                ${imagen && imagen instanceof File ? `<div class="imagen"><img src="${URL.createObjectURL(imagen)}" alt="Imagen de la pregunta" style="max-width: 200px; max-height: 150px;" /></div>` : ''}
              </div>
            `;
          });
        }

        contenido += `</div>`;
      });
    }

    // Agregar sección de firmas
    contenido += `
        <div class="firmas">
          <div class="firma">
            <h4>Firma del Auditor</h4>
            ${firmaAuditor ? `<img src="${firmaAuditor}" alt="Firma del Auditor" />` : '<p>Sin firma</p>'}
            <p><strong>${userProfile?.displayName || userProfile?.email || 'Usuario'}</strong></p>
          </div>
          <div class="firma">
            <h4>Firma del Responsable</h4>
            ${firmaResponsable ? `<img src="${firmaResponsable}" alt="Firma del Responsable" />` : '<p>Sin firma</p>'}
            <p><strong>Responsable de la Empresa</strong></p>
          </div>
        </div>
    `;

    contenido += `
        <div class="footer">
          <p>Reporte generado el ${fecha} a las ${hora}</p>
          <p>Auditoría realizada por: ${userProfile?.displayName || userProfile?.email || 'Usuario'}</p>
        </div>
      </body>
      </html>
    `;

    return contenido;
  };

  // Función para abrir impresión nativa
  const abrirImpresionNativa = () => {
    const contenido = generarContenidoImpresion();
    const nuevaVentana = window.open('', '_blank', 'width=800,height=600');
    
    nuevaVentana.document.write(contenido);
    nuevaVentana.document.close();
    
    nuevaVentana.onload = () => {
      setTimeout(() => {
        nuevaVentana.print();
      }, 500);
    };
  };

  // Configurar secciones cuando cambie el formulario
  useEffect(() => {
    if (formularioSeleccionadoId) {
      const formularioSeleccionado = formularios.find((formulario) => formulario.id === formularioSeleccionadoId);
      
      if (!formularioSeleccionado || !formularioSeleccionado.secciones) {
        setSecciones([]);
        setRespuestas([]);
        setComentarios([]);
        setImagenes([]);
        return;
      }

      const seccionesArray = Array.isArray(formularioSeleccionado.secciones)
        ? formularioSeleccionado.secciones
        : Object.values(formularioSeleccionado.secciones);

      setSecciones(seccionesArray);
      setRespuestas(seccionesArray.map(seccion => Array(seccion.preguntas.length).fill('')));
      setComentarios(seccionesArray.map(seccion => Array(seccion.preguntas.length).fill('')));
      setImagenes(seccionesArray.map(seccion => Array(seccion.preguntas.length).fill(null)));
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

  // Definir los pasos
  const steps = [
    {
      label: 'Empresa y Ubicación',
      description: 'Selecciona la empresa y ubicación para auditar',
      icon: <BusinessIcon />,
      content: (
        <MuiFade in={true} timeout={800}>
          <Box>
            <Grid container spacing={isMobile ? 1 : 3}>
              <Grid item xs={12} md={6}>
                <SeleccionEmpresa
                  empresas={empresas}
                  empresaSeleccionada={empresaSeleccionada}
                  onChange={bloquearDatosAgenda ? () => setOpenAlertaEdicion(true) : handleEmpresaChange}
                  disabled={bloquearDatosAgenda}
                />
              </Grid>
              
              {empresaSeleccionada && (
                <Grid item xs={12} md={6}>
                  {sucursales.length > 0 ? (
                    <SeleccionSucursal
                      sucursales={sucursales}
                      sucursalSeleccionada={sucursalSeleccionada}
                      onChange={bloquearDatosAgenda ? () => setOpenAlertaEdicion(true) : handleSucursalChange}
                      disabled={bloquearDatosAgenda}
                    />
                  ) : (
                    <Card sx={{ 
                      height: '100%', 
                      background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(theme.palette.primary.main, 0.05)})`,
                      border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`
                    }}>
                      <CardContent sx={{ textAlign: 'center', py: isMobile ? 1.5 : 4 }}>
                        <LocationOnIcon sx={{ fontSize: isMobile ? 24 : 48, color: 'primary.main', mb: isMobile ? 0.5 : 2 }} />
                        <Typography variant={isMobile ? "body2" : "h6"} color="primary" gutterBottom>
                          Casa Central
                        </Typography>
                        <Typography variant="body2" color="textSecondary" sx={{ fontSize: isMobile ? '0.75rem' : '1rem' }}>
                          Esta empresa no tiene sucursales registradas. 
                          La auditoría se realizará en casa central.
                        </Typography>
                      </CardContent>
                    </Card>
                  )}
                </Grid>
              )}
            </Grid>

            {empresaSeleccionada && (
              <Zoom in={true} timeout={600}>
                <Box sx={{ 
                  mt: isMobile ? 1 : 3, 
                  background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.1)}, ${alpha(theme.palette.success.main, 0.05)})`,
                  border: `2px solid ${alpha(theme.palette.success.main, 0.2)}`,
                  borderRadius: 2,
                  p: isMobile ? 1 : 3,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                  overflow: 'hidden'
                }}>
                  <Box display="flex" alignItems="center" gap={isMobile ? 1 : 2}>
                    <CheckCircleIcon 
                      color="success" 
                      sx={{ fontSize: isMobile ? 16 : 32 }} 
                    />
                    <Box flex={1}>
                      <Typography 
                        variant={isMobile ? "body2" : "h6"} 
                        color="success.main" 
                        gutterBottom
                        sx={{ 
                          fontWeight: 600,
                          fontSize: isMobile ? '0.8rem' : '1.25rem'
                        }}
                      >
                        Empresa Seleccionada
                      </Typography>
                      <Typography 
                        variant="body2" 
                        color="textSecondary"
                        sx={{ 
                          fontSize: isMobile ? '0.7rem' : '1rem',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden'
                        }}
                      >
                        <strong>Empresa:</strong> {empresaSeleccionada.nombre} | 
                        <strong> Ubicación:</strong> {obtenerTipoUbicacion()}
                      </Typography>
                    </Box>
                    {empresaSeleccionada.logo && (
                      <img
                        src={empresaSeleccionada.logo}
                        alt={`Logo de ${empresaSeleccionada.nombre}`}
                        style={{ 
                          width: isMobile ? "24px" : "60px", 
                          height: isMobile ? "24px" : "60px", 
                          objectFit: 'contain',
                          borderRadius: '8px'
                        }}
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    )}
                  </Box>
                </Box>
              </Zoom>
            )}
          </Box>
        </MuiFade>
      )
    },
    {
      label: 'Formulario de Auditoría',
      description: 'Elige el formulario que vas a utilizar',
      icon: <AssignmentIcon />,
      content: (
        <MuiFade in={true} timeout={800}>
          <Box>
            {location.state?.formularioId && (
              <Box mb={2}>
                <Typography variant="body2" color="info.main">
                  Formulario agendado: {
                    formularios.length === 0
                      ? 'Cargando...'
                      : (formularios.find(f => f.id === location.state.formularioId || f.nombre === location.state.formularioId)?.nombre || 'No disponible')
                  }
                </Typography>
              </Box>
            )}
            <SeleccionFormulario
              formularios={formularios}
              formularioSeleccionadoId={formularioSeleccionadoId}
              onChange={handleSeleccionarFormulario}
              disabled={!empresaSeleccionada}
              formularioAgendadoId={location.state?.formularioId}
            />
            
            {formularioSeleccionadoId && (
              <Zoom in={true} timeout={600}>
                <Card sx={{ 
                  mt: 3, 
                  background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.1)}, ${alpha(theme.palette.info.main, 0.05)})`,
                  border: `2px solid ${alpha(theme.palette.info.main, 0.2)}`
                }}>
                  
                </Card>
              </Zoom>
            )}
          </Box>
        </MuiFade>
      )
    },
    {
      label: 'Responder Preguntas',
      description: 'Completa todas las preguntas del formulario',
      icon: <QuestionAnswerIcon />,
      content: (
        <MuiFade in={true} timeout={800}>
          <Box>
            <PreguntasYSeccion
              secciones={secciones}
              guardarRespuestas={handleGuardarRespuestas}
              guardarComentario={handleGuardarComentario}
              guardarImagenes={handleGuardarImagenes}
              respuestasExistentes={respuestas}
              comentariosExistentes={comentarios}
              imagenesExistentes={imagenes}
            />
            
            {todasLasPreguntasContestadas() && (
              <Zoom in={true} timeout={600}>
                <Card sx={{ 
                  mt: 3, 
                  background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.1)}, ${alpha(theme.palette.success.main, 0.05)})`,
                  border: `2px solid ${alpha(theme.palette.success.main, 0.2)}`
                }}>
                  <CardContent>
                    <Box display="flex" alignItems="center" gap={2}>
                      <CheckCircleIcon color="success" sx={{ fontSize: 32 }} />
                      <Typography variant="h6" color="success.main">
                        ¡Todas las preguntas han sido respondidas!
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Zoom>
            )}
          </Box>
        </MuiFade>
      )
    },
    {
      label: 'Firmar Auditoría',
      description: 'Firma digital de la auditoría',
      icon: <EditIcon />,
      content: (
        <MuiFade in={true} timeout={800}>
          <Box>
            <FirmaSection
              onSaveFirmaAuditor={handleSaveFirmaAuditor}
              onSaveFirmaResponsable={handleSaveFirmaResponsable}
              firmaAuditor={firmaAuditor}
              firmaResponsable={firmaResponsable}
              empresa={empresaSeleccionada}
              sucursal={sucursalSeleccionada}
              formulario={formularios.find(formulario => formulario.id === formularioSeleccionadoId)}
              respuestas={respuestas}
              secciones={secciones}
              encargado={null}
            />
            
            {firmasCompletadas && (
              <Zoom in={true} timeout={600}>
                <Card sx={{ 
                  mt: 3, 
                  background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.1)}, ${alpha(theme.palette.success.main, 0.05)})`,
                  border: `2px solid ${alpha(theme.palette.success.main, 0.2)}`
                }}>
                  <CardContent>
                    <Box display="flex" alignItems="center" gap={2}>
                      <CheckCircleIcon color="success" sx={{ fontSize: 32 }} />
                      <Typography variant="h6" color="success.main">
                        ¡Firmas completadas correctamente!
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Zoom>
            )}
          </Box>
        </MuiFade>
      )
    },
    {
      label: 'Generar Reporte',
      description: 'Revisa y genera el reporte final',
      icon: <AssessmentIcon />,
      content: (
        <MuiFade in={true} timeout={800}>
          <Box>
            <BotonGenerarReporte
              deshabilitado={!todasLasPreguntasContestadas() || !firmasCompletadas}
              empresa={empresaSeleccionada}
              sucursal={sucursalSeleccionada}
              formulario={formularios.find(formulario => formulario.id === formularioSeleccionadoId)}
              respuestas={respuestas}
              comentarios={comentarios}
              imagenes={imagenes}
              secciones={secciones}
              firmaAuditor={firmaAuditor}
              firmaResponsable={firmaResponsable}
              onFinalizar={handleFinalizar}
            />
          </Box>
        </MuiFade>
      )
    }
  ];

  return (
    <Container maxWidth="xl" sx={{ py: isMobile ? 1 : 4 }}>
      {/* Header con navegación y progreso */}
      <Box sx={{ mb: isMobile ? 1 : 3 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={isMobile ? 0.5 : 2}>
          <Box display="flex" alignItems="center" gap={isMobile ? 0.5 : 2}>
            <Button
              onClick={() => {
                // Navegar dinámicamente basado en el origen
                if (location.state?.from === 'perfil') {
                  navigate('/perfil');
                } else {
                  navigate('/cliente-dashboard');
                }
              }}
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              size="small"
              sx={{ 
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                px: isMobile ? 1 : 2,
                py: isMobile ? 0.5 : 1
              }}
            >
              Volver
            </Button>
            <Typography variant={isMobile ? "h6" : "h4"} sx={{ 
              fontWeight: 700,
              background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontSize: isMobile ? '1.1rem' : undefined
            }}>
              Nueva Auditoría
            </Typography>
          </Box>
          
          <Chip 
            label={`${calcularProgreso()}%`}
            color="primary"
            variant="filled"
            size="small"
            sx={{ fontWeight: 600 }}
          />
        </Box>
        
        {/* Barra de progreso */}
        <LinearProgress 
          variant="determinate" 
          value={calcularProgreso()} 
          sx={{ 
            height: isMobile ? 4 : 8, 
            borderRadius: 4,
            backgroundColor: alpha(theme.palette.primary.main, 0.1),
            '& .MuiLinearProgress-bar': {
              borderRadius: 4,
              background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`
            }
          }} 
        />

        {/* Alerta de reinicio de firmas */}
        {mostrarAlertaReinicio && (
          <Fade in={true} timeout={600}>
            <Alert 
              severity="warning" 
              sx={{ 
                mt: isMobile ? 0.5 : 2, 
                borderRadius: 2,
                '& .MuiAlert-message': {
                  width: '100%'
                }
              }}
              onClose={() => setMostrarAlertaReinicio(false)}
            >
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                ⚠️ <strong>Firmas reiniciadas:</strong> Se detectaron cambios en las respuestas de la auditoría. 
                Las firmas han sido reiniciadas para mantener la integridad del documento.
              </Typography>
            </Alert>
          </Fade>
        )}
      </Box>

      {/* Contenido principal */}
      {!auditoriaGenerada ? (
        <AuditoriaStepper
          activeStep={activeStep}
          setActiveStep={setActiveStep}
          steps={steps}
          pasoCompleto={pasoCompleto}
          getStepStatus={getStepStatus}
          handleStepClick={handleStepClick}
          navegacionError={navegacionError}
          errores={errores}
          handleAnterior={handleAnterior}
          handleSiguiente={handleSiguiente}
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
          todasLasPreguntasContestadas={todasLasPreguntasContestadas}
          handleSaveFirmaAuditor={handleSaveFirmaAuditor}
          handleSaveFirmaResponsable={handleSaveFirmaResponsable}
          firmaAuditor={firmaAuditor}
          firmaResponsable={firmaResponsable}
          firmasCompletadas={firmasCompletadas}
          location={location}
          obtenerTipoUbicacion={obtenerTipoUbicacion}
          theme={theme}
        />
      ) : (
        <AuditoriaCompletada
          generarNuevaAuditoria={generarNuevaAuditoria}
          navigate={navigate}
          abrirImpresionNativa={abrirImpresionNativa}
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
      
      {/* Alerta de autoguardado */}
      <AutoSaveAlert
        isSaving={isSaving}
        lastSaved={lastSaved}
        hasUnsavedChanges={hasUnsavedChanges}
        showAlert={true}
      />

      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={() => setSnackbarOpen(false)}>
        <MuiAlert onClose={() => setSnackbarOpen(false)} severity={snackbarType} sx={{ width: '100%' }}>
          {snackbarMsg}
        </MuiAlert>
      </Snackbar>
    </Container>
  );
};

export default AuditoriaRefactorizada; 