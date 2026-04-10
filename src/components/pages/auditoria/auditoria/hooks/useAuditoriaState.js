import logger from '@/utils/logger';
import { useState, useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from '@/components/context/AuthContext';

export const useAuditoriaState = () => {
  const location = useLocation();
  const { userProfile } = useAuth();
  
  // Estados principales
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState(null);
  const [sucursalSeleccionada, setSucursalSeleccionada] = useState("");
  const [formularioSeleccionadoId, setFormularioSeleccionadoId] = useState("");
  const [secciones, setSecciones] = useState([]);
  const [respuestas, setRespuestas] = useState([]);
  const [comentarios, setComentarios] = useState([]);
  const [imagenes, setImagenes] = useState([]);
  const [clasificaciones, setClasificaciones] = useState([]);
  const [accionesRequeridas, setAccionesRequeridas] = useState([]);
  const [mostrarReporte, setMostrarReporte] = useState(false);
  const [errores, setErrores] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [formularios, setFormularios] = useState([]);
  const [auditoriaGenerada, setAuditoriaGenerada] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  
  // Estados de agenda
  const [bloquearDatosAgenda, setBloquearDatosAgenda] = useState(!!location.state?.auditoriaId);
  const [openAlertaEdicion, setOpenAlertaEdicion] = useState(false);
  const [auditoriaIdAgenda, setAuditoriaIdAgenda] = useState(location.state?.auditoriaId || null);

  // Sincronizar auditoriaIdAgenda si el usuario navega desde SugerenciaAgenda
  // (el componente no se desmonta al navegar dentro de la misma ruta)
  useEffect(() => {
    if (location.state?.auditoriaId) {
      setAuditoriaIdAgenda(location.state.auditoriaId);
      setBloquearDatosAgenda(true);
    }
  }, [location.state?.auditoriaId]);
  
  // Estados de notificaciones
  const [snackbarMsg, setSnackbarMsg] = useState("");
  const [snackbarType, setSnackbarType] = useState("info");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [navegacionError, setNavegacionError] = useState("");
  
  // Estados de firmas
  const [firmaAuditor, setFirmaAuditor] = useState(null);
  const [firmaResponsable, setFirmaResponsable] = useState(null);
  const [firmasCompletadas, setFirmasCompletadas] = useState(true);
  const [auditoriaHash, setAuditoriaHash] = useState('');
  const [firmasValidas, setFirmasValidas] = useState(false);
  const [mostrarAlertaReinicio, setMostrarAlertaReinicio] = useState(false);

  // Estados de información adicional del reporte
  const [datosReporte, setDatosReporte] = useState({
    tareaObservada: '',
    lugarSector: '',
    equiposInvolucrados: '',
    supervisor: '',
    numeroTrabajadores: '',
    nombreResponsable: ''
  });

  // Helper para logs
  const log = (msg, ...args) => {
    logger.debug(`[AUDITORIA] ${msg}`, ...args);
  };

  // Función para generar hash de la auditoría
  const generarHashAuditoria = () => {
    const datos = {
      empresa: empresaSeleccionada?.id,
      sucursal: sucursalSeleccionada,
      formulario: formularioSeleccionadoId,
      respuestas: JSON.stringify(respuestas),
      comentarios: JSON.stringify(comentarios),
      imagenes: imagenes.length,
      clasificaciones: JSON.stringify(clasificaciones),
      accionesRequeridas: JSON.stringify(accionesRequeridas)
    };
    // Unicode-safe base64 encoding
    const jsonStr = JSON.stringify(datos);
    try {
      return btoa(unescape(encodeURIComponent(jsonStr)));
    } catch (error) {
      logger.error('Error encoding hash:', error);
      return btoa(jsonStr); // fallback for simple strings
    }
  };

  // Estabilizar dependencias para evitar loop infinito
  const dependenciasEstables = useMemo(() => ({
    empresaId: empresaSeleccionada?.id,
    sucursal: sucursalSeleccionada,
    formulario: formularioSeleccionadoId,
    respuestasHash: JSON.stringify(respuestas),
    comentariosHash: JSON.stringify(comentarios),
    imagenesLength: imagenes.length,
    clasificacionesHash: JSON.stringify(clasificaciones),
    accionesRequeridasHash: JSON.stringify(accionesRequeridas)
  }), [empresaSeleccionada, sucursalSeleccionada, formularioSeleccionadoId, respuestas, comentarios, imagenes, clasificaciones, accionesRequeridas]);

  // Verificar cambios en la auditoría y reiniciar firmas si es necesario
  useEffect(() => {
    const nuevoHash = generarHashAuditoria();
    
    if (auditoriaHash && auditoriaHash !== nuevoHash && firmasValidas) {
      logger.debug('[DEBUG] Cambios detectados en las respuestas, reiniciando firmas');
      reiniciarFirmas();
    }
    
    setAuditoriaHash(nuevoHash);
  }, [dependenciasEstables, firmasValidas]);

  // Marcar firmas como válidas cuando se completan
  useEffect(() => {
    if (firmaAuditor) {
      setFirmasValidas(true);
    }
  }, [firmaAuditor]);

  // Función para reiniciar firmas
  const reiniciarFirmas = () => {
    logger.debug('[DEBUG] Reiniciando firmas debido a cambios en las respuestas de la auditoría');
    setFirmaAuditor(null);
    setFirmaResponsable(null);
    setFirmasCompletadas(false);
    setFirmasValidas(false);
    setMostrarAlertaReinicio(true);
    
    setTimeout(() => {
      setMostrarAlertaReinicio(false);
    }, 5000);
  };

  // Función para reiniciar toda la auditoría
  const reiniciarAuditoria = () => {
    setEmpresaSeleccionada(null);
    setSucursalSeleccionada("");
    setFormularioSeleccionadoId("");
    setSecciones([]);
    setRespuestas([]);
    setComentarios([]);
    setImagenes([]);
    setClasificaciones([]);
    setAccionesRequeridas([]);
    setMostrarReporte(false);
    setAuditoriaGenerada(false);
    setActiveStep(0);
    setFirmaAuditor(null);
    setFirmaResponsable(null);
    setFirmasCompletadas(true);
    setAuditoriaHash('');
    setFirmasValidas(false);
    setMostrarAlertaReinicio(false);
    setBloquearDatosAgenda(false);
    setAuditoriaIdAgenda(null);
    setErrores([]);
    setNavegacionError("");
    setDatosReporte({
      tareaObservada: '',
      lugarSector: '',
      equiposInvolucrados: '',
      supervisor: '',
      numeroTrabajadores: '',
      nombreResponsable: ''
    });
  };

  return {
    // Estados
    empresaSeleccionada, setEmpresaSeleccionada,
    sucursalSeleccionada, setSucursalSeleccionada,
    formularioSeleccionadoId, setFormularioSeleccionadoId,
    secciones, setSecciones,
    respuestas, setRespuestas,
    comentarios, setComentarios,
    imagenes, setImagenes,
    clasificaciones, setClasificaciones,
    accionesRequeridas, setAccionesRequeridas,
    mostrarReporte, setMostrarReporte,
    errores, setErrores,
    empresas, setEmpresas,
    sucursales, setSucursales,
    formularios, setFormularios,
    auditoriaGenerada, setAuditoriaGenerada,
    activeStep, setActiveStep,
    
    // Estados de agenda
    bloquearDatosAgenda, setBloquearDatosAgenda,
    openAlertaEdicion, setOpenAlertaEdicion,
    auditoriaIdAgenda, setAuditoriaIdAgenda,
    
    // Estados de notificaciones
    snackbarMsg, setSnackbarMsg,
    snackbarType, setSnackbarType,
    snackbarOpen, setSnackbarOpen,
    navegacionError, setNavegacionError,
    
    // Estados de firmas
    firmaAuditor, setFirmaAuditor,
    firmaResponsable, setFirmaResponsable,
    firmasCompletadas, setFirmasCompletadas,
    firmasValidas, setFirmasValidas,
    mostrarAlertaReinicio, setMostrarAlertaReinicio,
    
    // Estados de datos del reporte
    datosReporte, setDatosReporte,
    
    // Funciones
    log,
    reiniciarFirmas,
    reiniciarAuditoria,
    generarHashAuditoria
  };
}; 