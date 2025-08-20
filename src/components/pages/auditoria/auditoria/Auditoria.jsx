import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { 
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
import "./Auditoria.css";
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
  const isLargeScreen = useMediaQuery(theme.breakpoints.up('lg'));

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

  // Funciones básicas
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

  const handleSaveFirmaAuditor = (firmaURL) => {
    setFirmaAuditor(firmaURL);
    verificarFirmasCompletadas();
  };

  const handleSaveFirmaResponsable = (firmaURL) => {
    setFirmaResponsable(firmaURL);
    verificarFirmasCompletadas();
  };

  const verificarFirmasCompletadas = () => {
    const completadas = true; // Firmas opcionales
    setFirmasCompletadas(completadas);
  };

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
    return progreso;
  };

  const getStepStatus = (step) => {
    switch (step) {
      case 0: return empresaSeleccionada ? 'completed' : 'active';
      case 1: return formularioSeleccionadoId ? 'completed' : (empresaSeleccionada ? 'active' : 'disabled');
      case 2: return secciones.length > 0 ? 'completed' : (formularioSeleccionadoId ? 'active' : 'disabled');
      case 3: return todasLasPreguntasContestadas() ? 'completed' : (secciones.length > 0 ? 'active' : 'disabled');
      case 4: return true ? 'completed' : (todasLasPreguntasContestadas() ? 'active' : 'disabled');
      default: return 'disabled';
    }
  };

  const pasoCompleto = (step) => {
    switch (step) {
      case 0: return !!empresaSeleccionada;
      case 1: return !!formularioSeleccionadoId;
      case 2: return todasLasPreguntasContestadas();
      case 3: return true; // Firmas opcionales
      default: return false;
    }
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
    
    setActiveStep(index);
  };

  const generarNuevaAuditoria = () => {
    reiniciarAuditoria();
    navigate('/auditoria', { replace: true });
  };

  const abrirImpresionNativa = () => {
    // Función para impresión nativa
    console.log('Impresión nativa');
  };

  // Verificar firmas cuando cambien
  useEffect(() => {
    verificarFirmasCompletadas();
  }, [firmaAuditor, firmaResponsable]);

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

  // Definir los pasos
  const steps = [
    {
      label: 'Empresa y Ubicación',
      description: 'Selecciona la empresa y ubicación para auditar',
      icon: <BusinessIcon />,
      content: (
        <MuiFade in={true} timeout={800}>
          <Box>
            <Grid container spacing={isMobile ? 1 : (isLargeScreen ? 4 : 3)}>
              <Grid item xs={12} md={6} lg={5}>
                <SeleccionEmpresa
                  empresas={empresas}
                  empresaSeleccionada={empresaSeleccionada}
                  onChange={bloquearDatosAgenda ? () => setOpenAlertaEdicion(true) : handleEmpresaChange}
                  disabled={bloquearDatosAgenda}
                />
              </Grid>
              
              {empresaSeleccionada && (
                <Grid item xs={12} md={6} lg={7}>
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
            <SeleccionFormulario
              formularios={formularios}
              formularioSeleccionadoId={formularioSeleccionadoId}
              onChange={handleSeleccionarFormulario}
              disabled={!empresaSeleccionada}
              formularioAgendadoId={location.state?.formularioId}
            />
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
              onFinalizar={() => setAuditoriaGenerada(true)}
            />
          </Box>
        </MuiFade>
      )
    }
  ];

  return (
    <Box className="page-container auditoria-container">
      <Box className="content-container">
        {/* Header con navegación y progreso */}
        <Box className="header-section">
          {/* Header con botón, título y progreso en la misma línea */}
          <Box sx={{ 
            mb: isMobile ? 0.5 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            gap: 1
          }}>
            {/* Lado izquierdo: Botón Volver */}
            <Button
              onClick={() => {
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
                px: isMobile ? 1 : 1.5,
                py: isMobile ? 0.5 : 0.75,
                flexShrink: 0
              }}
            >
              Volver
            </Button>
            
            {/* Centro: Título */}
            <Typography variant={isMobile ? "h6" : "h4"} sx={{ 
              fontWeight: 700,
              color: '#000000',
              fontSize: isMobile ? '1.1rem' : '1.8rem',
              flex: 1,
              textAlign: 'center'
            }}>
              Nueva Auditoría <Chip 
              label={`${calcularProgreso()}%`}
              color="primary"
              variant="filled"
              size="small"
              sx={{ 
                fontWeight: 600,
                flexShrink: 0
              }}
            />
            </Typography>
          </Box>

          {/* Barra de progreso */}
          <LinearProgress 
            variant="determinate" 
            value={calcularProgreso()} 
            sx={{ 
              height: isMobile ? 4 : 6, 
              borderRadius: 3,
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
              '& .MuiLinearProgress-bar': {
                borderRadius: 3,
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
                  mt: isMobile ? 0.5 : 1.5, 
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
        <Box className="stepper-section">
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
        </Box>

        {/* Reporte */}
        {mostrarReporte && (
          <Zoom in={true} timeout={800}>
            <Paper elevation={6} sx={{ p: 3, mt: 3, borderRadius: 3 }}>
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
      </Box>
    </Box>
  );
};

export default AuditoriaRefactorizada;
