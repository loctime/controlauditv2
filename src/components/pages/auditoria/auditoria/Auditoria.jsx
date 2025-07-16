import React, { useState, useEffect } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../../../firebaseConfig";
import SeleccionEmpresa from "./SeleccionEmpresa";
import SeleccionSucursal from "./SeleccionSucursal";
import SeleccionFormulario from "./SeleccionFormulario";
import PreguntasYSeccion from "./PreguntasYSeccion";
import FirmaSection from "../reporte/FirmaSection";
import BotonGenerarReporte from "../reporte/ReporteImprimir";
import { 
  Typography, 
  Grid, 
  Alert, 
  Box, 
  Button, 
  Paper, 
  Container, 
  IconButton, 
  Divider,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Fade,
  Zoom,
  useTheme,
  alpha
} from "@mui/material";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import BusinessIcon from '@mui/icons-material/Business';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AssignmentIcon from '@mui/icons-material/Assignment';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import AssessmentIcon from '@mui/icons-material/Assessment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EditIcon from '@mui/icons-material/Edit';
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import Swal from 'sweetalert2';
import ReporteConImpresion from '../reporte/ReporteDetalleConImpresion';

const Auditoria = () => {
  const theme = useTheme();
  const { userProfile, userEmpresas, canViewEmpresa } = useAuth();
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState(null);
  const [sucursalSeleccionada, setSucursalSeleccionada] = useState("");
  const [formularioSeleccionadoId, setFormularioSeleccionadoId] = useState("");
  const [secciones, setSecciones] = useState([]);
  const [respuestas, setRespuestas] = useState([]);
  const [comentarios, setComentarios] = useState([]);
  const [imagenes, setImagenes] = useState([]);
  const [mostrarReporte, setMostrarReporte] = useState(false);
  const [errores, setErrores] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [formularios, setFormularios] = useState([]);
  const [auditoriaGenerada, setAuditoriaGenerada] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const navigate = useNavigate();
  // Agregar estado para errores de navegación
  const [navegacionError, setNavegacionError] = useState("");
  
  // Estados para las firmas digitales
  const [firmaAuditor, setFirmaAuditor] = useState(null);
  const [firmaResponsable, setFirmaResponsable] = useState(null);
  const [firmasCompletadas, setFirmasCompletadas] = useState(false);

  // Estados para rastrear cambios y reiniciar firmas
  const [auditoriaHash, setAuditoriaHash] = useState('');
  const [firmasValidas, setFirmasValidas] = useState(false);
  const [mostrarAlertaReinicio, setMostrarAlertaReinicio] = useState(false);

  // Función para generar hash de la auditoría (para detectar cambios)
  const generarHashAuditoria = () => {
    const datos = {
      empresa: empresaSeleccionada?.id,
      sucursal: sucursalSeleccionada,
      formulario: formularioSeleccionadoId,
      respuestas: JSON.stringify(respuestas),
      comentarios: JSON.stringify(comentarios),
      imagenes: imagenes.length // Solo contamos cantidad, no contenido
    };
    return btoa(JSON.stringify(datos)); // Hash simple en base64
  };

  // Función para reiniciar firmas
  const reiniciarFirmas = () => {
    console.log('[DEBUG] Reiniciando firmas debido a cambios en las respuestas de la auditoría');
    setFirmaAuditor(null);
    setFirmaResponsable(null);
    setFirmasCompletadas(false);
    setFirmasValidas(false);
    setMostrarAlertaReinicio(true);
    
    // Ocultar alerta después de 5 segundos
    setTimeout(() => {
      setMostrarAlertaReinicio(false);
    }, 5000);
  };

  // Verificar cambios en la auditoría y reiniciar firmas si es necesario
  useEffect(() => {
    const nuevoHash = generarHashAuditoria();
    
    // Solo reiniciar si hay firmas válidas y se detectan cambios
    if (auditoriaHash && auditoriaHash !== nuevoHash && firmasValidas) {
      console.log('[DEBUG] Cambios detectados en las respuestas, reiniciando firmas');
      reiniciarFirmas();
    }
    
    setAuditoriaHash(nuevoHash);
  }, [empresaSeleccionada, sucursalSeleccionada, formularioSeleccionadoId, respuestas, comentarios, imagenes]);

  // Marcar firmas como válidas cuando se completan
  useEffect(() => {
    if (firmaAuditor) {
      setFirmasValidas(true);
    }
  }, [firmaAuditor]);

  // Calcular progreso de la auditoría
  const calcularProgreso = () => {
    let progreso = 0;
    if (empresaSeleccionada) progreso += 20;
    if (formularioSeleccionadoId) progreso += 20;
    if (secciones.length > 0) progreso += 20;
    if (todasLasPreguntasContestadas()) progreso += 20;
    if (firmasCompletadas) progreso += 20;
    return progreso;
  };

  // Obtener estado del paso actual
  const getStepStatus = (step) => {
    switch (step) {
      case 0: return empresaSeleccionada ? 'completed' : 'active';
      case 1: return formularioSeleccionadoId ? 'completed' : (empresaSeleccionada ? 'active' : 'disabled');
      case 2: return secciones.length > 0 ? 'completed' : (formularioSeleccionadoId ? 'active' : 'disabled');
      case 3: return todasLasPreguntasContestadas() ? 'completed' : (secciones.length > 0 ? 'active' : 'disabled');
      case 4: return firmasCompletadas ? 'completed' : (todasLasPreguntasContestadas() ? 'active' : 'disabled');
      default: return 'disabled';
    }
  };

  // Validar si el paso actual está completo
  const pasoCompleto = (step) => {
    switch (step) {
      case 0:
        return !!empresaSeleccionada;
      case 1:
        return !!formularioSeleccionadoId;
      case 2:
        return todasLasPreguntasContestadas();
      case 3:
        return firmasCompletadas;
      default:
        return false;
    }
  };

  // Manejar avance manual
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
    
    // Solo mostrar advertencia si hay firmas válidas
    // Las firmas se mantendrán si no se hacen cambios
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

  // Permitir navegación directa en el stepper solo si los pasos previos están completos
  const handleStepClick = (index) => {
    setNavegacionError("");
    
    // Solo permitir si todos los pasos previos están completos
    for (let i = 0; i < index; i++) {
      if (!pasoCompleto(i)) {
        setNavegacionError("Completa los pasos anteriores antes de avanzar.");
        return;
      }
    }

    // Solo mostrar advertencia si hay firmas válidas y se está navegando hacia atrás
    // Las firmas se mantendrán si no se hacen cambios
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

  // Manejar guardado de firmas
  const handleSaveFirmaAuditor = (firmaURL) => {
    setFirmaAuditor(firmaURL);
    verificarFirmasCompletadas();
  };

  const handleSaveFirmaResponsable = (firmaURL) => {
    setFirmaResponsable(firmaURL);
    verificarFirmasCompletadas();
  };

  const verificarFirmasCompletadas = () => {
    // Solo la firma del auditor es obligatoria
    const completadas = firmaAuditor; // Removido firmaResponsable de la validación
    setFirmasCompletadas(completadas);
  };

  // Verificar firmas cuando cambien
  useEffect(() => {
    verificarFirmasCompletadas();
  }, [firmaAuditor, firmaResponsable]);

  useEffect(() => {
    const obtenerEmpresas = async () => {
      try {
        if (!userProfile) return;
        
        // Obtener todas las empresas y filtrar por permisos
        const empresasCollection = collection(db, "empresas");
        const snapshot = await getDocs(empresasCollection);
        const todasLasEmpresas = snapshot.docs.map((doc) => ({
          id: doc.id,
          nombre: doc.data().nombre,
          logo: doc.data().logo,
          propietarioId: doc.data().propietarioId,
        }));
        
        // Filtrar empresas que el usuario puede ver
        const empresasPermitidas = todasLasEmpresas.filter(empresa => 
          canViewEmpresa(empresa.id)
        );
        
        setEmpresas(empresasPermitidas);
      } catch (error) {
        console.error("Error al obtener empresas:", error);
      }
    };

    obtenerEmpresas();
  }, [userProfile, canViewEmpresa]);

  useEffect(() => {
    const obtenerSucursales = async () => {
      if (empresaSeleccionada) {
        try {
          const sucursalesCollection = collection(db, "sucursales");
          const q = query(sucursalesCollection, where("empresa", "==", empresaSeleccionada.nombre));
          const snapshot = await getDocs(q);
          const sucursalesData = snapshot.docs.map((doc) => ({
            id: doc.id,
            nombre: doc.data().nombre,
          }));
          setSucursales(sucursalesData);
        } catch (error) {
          console.error("Error al obtener sucursales:", error);
        }
      } else {
        setSucursales([]);
      }
    };

    obtenerSucursales();
  }, [empresaSeleccionada]);

  useEffect(() => {
    const obtenerFormularios = async () => {
      try {
        if (!userProfile) return;
        
        const formulariosCollection = collection(db, "formularios");
        const snapshot = await getDocs(formulariosCollection);
        const todosLosFormularios = snapshot.docs.map((doc) => ({
          id: doc.id,
          nombre: doc.data().nombre,
          secciones: doc.data().secciones,
          creadorId: doc.data().creadorId,
          creadorEmail: doc.data().creadorEmail,
          esPublico: doc.data().esPublico,
          permisos: doc.data().permisos,
          clienteAdminId: doc.data().clienteAdminId
        }));

        // ✅ Filtrar formularios por permisos multi-tenant
        const formulariosPermitidos = todosLosFormularios.filter(formulario => {
          if (userProfile.role === 'supermax') return true;
          
          if (userProfile.role === 'max') {
            return formulario.clienteAdminId === userProfile.uid || 
                   formulario.creadorId === userProfile.uid;
          }
          
          if (userProfile.role === 'operario') {
            return formulario.creadorId === userProfile.uid ||
                   formulario.clienteAdminId === userProfile.clienteAdminId ||
                   formulario.esPublico ||
                   formulario.permisos?.puedeVer?.includes(userProfile.uid);
          }
          
          return false;
        });

        setFormularios(formulariosPermitidos);
        console.log(`✅ Formularios disponibles: ${formulariosPermitidos.length} de ${todosLosFormularios.length}`);
      } catch (error) {
        console.error("Error al obtener formularios:", error);
      }
    };

    obtenerFormularios();
  }, [userProfile]);

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

  useEffect(() => {
    if (empresaSeleccionada) {
      setSucursalSeleccionada("");
    }
  }, [empresaSeleccionada]);

  useEffect(() => {
    if (empresaSeleccionada && sucursales.length === 0) {
      setSucursalSeleccionada("Sin sucursal específica");
    } else if (empresaSeleccionada && sucursales.length > 0 && sucursalSeleccionada === "Sin sucursal específica") {
      setSucursalSeleccionada("");
    }
  }, [empresaSeleccionada, sucursales.length, sucursalSeleccionada]);

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

  const handleGuardarRespuestas = (nuevasRespuestas) => {
    setRespuestas(nuevasRespuestas);
  };

  const handleGuardarComentario = (nuevosComentarios) => {
    setComentarios(nuevosComentarios);
  };

  const handleGuardarImagenes = (nuevasImagenes) => {
    setImagenes(nuevasImagenes);
  };

  const todasLasPreguntasContestadas = () => {
    return respuestas.every(seccionRespuestas => 
      seccionRespuestas.every(respuesta => respuesta !== '')
    );
  };

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
    setEmpresaSeleccionada(null);
    setSucursalSeleccionada("");
    setFormularioSeleccionadoId("");
    setSecciones([]);
    setRespuestas([]);
    setComentarios([]);
    setImagenes([]);
    setMostrarReporte(false);
    setAuditoriaGenerada(false);
    setActiveStep(0);
    setFirmaAuditor(null);
    setFirmaResponsable(null);
    setFirmasCompletadas(false);
    // Reiniciar estados de hash y alertas
    setAuditoriaHash('');
    setFirmasValidas(false);
    setMostrarAlertaReinicio(false);
  };

  const handleFinalizar = () => {
    setAuditoriaGenerada(true);
  };

  const steps = [
    {
      label: 'Empresa y Ubicación',
      description: 'Selecciona la empresa y ubicación para auditar',
      icon: <BusinessIcon />,
      content: (
        <Fade in={true} timeout={800}>
          <Box>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <SeleccionEmpresa
                  empresas={empresas}
                  empresaSeleccionada={empresaSeleccionada}
                  onChange={handleEmpresaChange}
                />
              </Grid>
              
              {empresaSeleccionada && (
                <Grid item xs={12} md={6}>
                  {sucursales.length > 0 ? (
                    <SeleccionSucursal
                      sucursales={sucursales}
                      sucursalSeleccionada={sucursalSeleccionada}
                      onChange={handleSucursalChange}
                    />
                  ) : (
                    <Card sx={{ 
                      height: '100%', 
                      background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(theme.palette.primary.main, 0.05)})`,
                      border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`
                    }}>
                      <CardContent sx={{ textAlign: 'center', py: 4 }}>
                        <LocationOnIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                        <Typography variant="h6" color="primary" gutterBottom>
                          Casa Central
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
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
                <Card sx={{ 
                  mt: 3, 
                  background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.1)}, ${alpha(theme.palette.success.main, 0.05)})`,
                  border: `2px solid ${alpha(theme.palette.success.main, 0.2)}`
                }}>
                  <CardContent>
                    <Box display="flex" alignItems="center" gap={2}>
                      <CheckCircleIcon color="success" sx={{ fontSize: 32 }} />
                      <Box flex={1}>
                        <Typography variant="h6" color="success.main" gutterBottom>
                          Empresa Seleccionada
                        </Typography>
                        <Typography variant="body1" color="textSecondary">
                          <strong>Empresa:</strong> {empresaSeleccionada.nombre} | 
                          <strong> Ubicación:</strong> {obtenerTipoUbicacion()}
                        </Typography>
                      </Box>
                      {empresaSeleccionada.logo && (
                        <img
                          src={empresaSeleccionada.logo}
                          alt={`Logo de ${empresaSeleccionada.nombre}`}
                          style={{ 
                            width: "60px", 
                            height: "60px", 
                            objectFit: 'contain',
                            borderRadius: '8px'
                          }}
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Zoom>
            )}
          </Box>
        </Fade>
      )
    },
    {
      label: 'Formulario de Auditoría',
      description: 'Elige el formulario que vas a utilizar',
      icon: <AssignmentIcon />,
      content: (
        <Fade in={true} timeout={800}>
          <Box>
            <SeleccionFormulario
              formularios={formularios}
              formularioSeleccionadoId={formularioSeleccionadoId}
              onChange={handleSeleccionarFormulario}
              disabled={!empresaSeleccionada}
            />
            
            {formularioSeleccionadoId && (
              <Zoom in={true} timeout={600}>
                <Card sx={{ 
                  mt: 3, 
                  background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.1)}, ${alpha(theme.palette.info.main, 0.05)})`,
                  border: `2px solid ${alpha(theme.palette.info.main, 0.2)}`
                }}>
                  <CardContent>
                    <Box display="flex" alignItems="center" gap={2}>
                      <CheckCircleIcon color="info" sx={{ fontSize: 32 }} />
                      <Box flex={1}>
                        <Typography variant="h6" color="info.main" gutterBottom>
                          Formulario Seleccionado
                        </Typography>
                        <Typography variant="body1" color="textSecondary">
                          {formularios.find(f => f.id === formularioSeleccionadoId)?.nombre}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Zoom>
            )}
          </Box>
        </Fade>
      )
    },
    {
      label: 'Responder Preguntas',
      description: 'Completa todas las preguntas del formulario',
      icon: <QuestionAnswerIcon />,
      content: (
        <Fade in={true} timeout={800}>
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
        </Fade>
      )
    },
    {
      label: 'Firmar Auditoría',
      description: 'Firma digital de la auditoría',
      icon: <EditIcon />,
      content: (
        <Fade in={true} timeout={800}>
          <Box>
            <FirmaSection
              onSaveFirmaAuditor={handleSaveFirmaAuditor}
              onSaveFirmaResponsable={handleSaveFirmaResponsable}
              firmaAuditor={firmaAuditor}
              firmaResponsable={firmaResponsable}
              // Props para el resumen de auditoría
              empresa={empresaSeleccionada}
              sucursal={sucursalSeleccionada}
              formulario={formularios.find(formulario => formulario.id === formularioSeleccionadoId)}
              respuestas={respuestas}
              secciones={secciones}
              encargado={null} // Por ahora null, se puede implementar después si es necesario
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
        </Fade>
      )
    },
    {
      label: 'Generar Reporte',
      description: 'Revisa y genera el reporte final',
      icon: <AssessmentIcon />,
      content: (
        <Fade in={true} timeout={800}>
          <Box>
            <BotonGenerarReporte
              onClick={generarReporte}
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
        </Fade>
      )
    }
  ];

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header con navegación y progreso */}
      <Box sx={{ mb: 4 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
          <Box display="flex" alignItems="center" gap={2}>
            <Button
              onClick={() => navigate('/cliente-dashboard')}
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              sx={{ 
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600
              }}
            >
              Volver
            </Button>
            <Typography variant="h4" sx={{ 
              fontWeight: 700,
              background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Nueva Auditoría
            </Typography>
          </Box>
          
          <Chip 
            label={`${calcularProgreso()}% Completado`}
            color="primary"
            variant="filled"
            sx={{ fontWeight: 600 }}
          />
        </Box>
        
        {/* Barra de progreso */}
        <LinearProgress 
          variant="determinate" 
          value={calcularProgreso()} 
          sx={{ 
            height: 8, 
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
                mt: 2, 
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
        <Box>
          {/* Stepper vertical */}
          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Paper elevation={3} sx={{ p: 3, borderRadius: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
                  Progreso de la Auditoría
                </Typography>
                <Stepper orientation="vertical" activeStep={activeStep}>
                  {steps.map((step, index) => (
                    <Step key={step.label} completed={pasoCompleto(index)}>
                      <StepLabel
                        StepIconComponent={() => (
                          <Box sx={{
                            color: pasoCompleto(index)
                              ? 'success.main'
                              : getStepStatus(index) === 'active'
                              ? 'primary.main'
                              : 'text.disabled',
                          }}>
                            {pasoCompleto(index) ? <CheckCircleIcon color="success" /> : step.icon}
                          </Box>
                        )}
                        onClick={() => handleStepClick(index)}
                        sx={{ cursor: 'pointer' }}
                      >
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          {step.label}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {step.description}
                        </Typography>
                      </StepLabel>
                    </Step>
                  ))}
                </Stepper>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={8}>
              <Paper elevation={3} sx={{ p: 4, borderRadius: 3, minHeight: '600px' }}>
                {steps[activeStep]?.content}
                
                <Box display="flex" gap={2} mt={4}>
                  <Button
                    variant="outlined"
                    color="primary"
                    onClick={handleAnterior}
                    disabled={activeStep === 0}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleSiguiente}
                    disabled={!pasoCompleto(activeStep) || activeStep === steps.length - 1}
                  >
                    Siguiente
                  </Button>
                </Box>

                {navegacionError && (
                  <Alert severity="error" sx={{ mt: 2 }}>
                    {navegacionError}
                  </Alert>
                )}
                
                {/* Errores */}
                {errores.length > 0 && (
                  <Fade in={true} timeout={600}>
                    <Alert severity="error" sx={{ mt: 3, borderRadius: 2 }}>
                      {errores.map((error, index) => (
                        <Typography key={index} variant="body2">
                          {error}
                        </Typography>
                      ))}
                    </Alert>
                  </Fade>
                )}
              </Paper>
            </Grid>
          </Grid>
        </Box>
      ) : (
        /* Pantalla de éxito */
        <Zoom in={true} timeout={800}>
          <Paper elevation={6} sx={{ 
            p: 6, 
            textAlign: "center", 
            borderRadius: 4,
            background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.1)}, ${alpha(theme.palette.success.main, 0.05)})`,
            border: `2px solid ${alpha(theme.palette.success.main, 0.2)}`
          }}>
            <CheckCircleIcon sx={{ fontSize: 80, color: 'success.main', mb: 3 }} />
            <Typography variant="h4" gutterBottom sx={{ mb: 3, color: 'success.main', fontWeight: 700 }}>
              ✅ Auditoría Completada
            </Typography>
            <Typography variant="h6" sx={{ mb: 4, color: 'text.secondary' }}>
              La auditoría ha sido guardada exitosamente en el sistema.
            </Typography>
            <Box display="flex" gap={2} justifyContent="center" flexWrap="wrap">
              {/* Botón para nueva auditoría */}
              <Button 
                variant="contained" 
                color="primary" 
                size="large"
                onClick={generarNuevaAuditoria}
              >
                Nueva Auditoría
              </Button>
              {/* Botón para ver reportes */}
              <Button 
                variant="outlined" 
                color="primary" 
                size="large"
                onClick={() => navigate('/reporte')}
              >
                Ver Reportes
              </Button>
              {/* Botón para volver al inicio */}
              <Button 
                variant="outlined" 
                color="secondary" 
                size="large"
                onClick={() => navigate('/')}
              >
                Volver al Inicio
              </Button>
            </Box>
          </Paper>
        </Zoom>
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
    </Container>
  );
};

export default Auditoria;
