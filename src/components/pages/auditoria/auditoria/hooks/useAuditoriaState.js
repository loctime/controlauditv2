import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../../../../context/AuthContext";

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
  
  // Estados de notificaciones
  const [snackbarMsg, setSnackbarMsg] = useState("");
  const [snackbarType, setSnackbarType] = useState("info");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [navegacionError, setNavegacionError] = useState("");
  
  // Estados de firmas
  const [firmaAuditor, setFirmaAuditor] = useState(null);
  const [firmaResponsable, setFirmaResponsable] = useState(null);
  const [firmasCompletadas, setFirmasCompletadas] = useState(false);
  const [auditoriaHash, setAuditoriaHash] = useState('');
  const [firmasValidas, setFirmasValidas] = useState(false);
  const [mostrarAlertaReinicio, setMostrarAlertaReinicio] = useState(false);

  // Helper para logs
  const log = (msg, ...args) => {
    console.log(`[AUDITORIA] ${msg}`, ...args);
  };

  // Función para generar hash de la auditoría
  const generarHashAuditoria = () => {
    const datos = {
      empresa: empresaSeleccionada?.id,
      sucursal: sucursalSeleccionada,
      formulario: formularioSeleccionadoId,
      respuestas: JSON.stringify(respuestas),
      comentarios: JSON.stringify(comentarios),
      imagenes: imagenes.length
    };
    return btoa(JSON.stringify(datos));
  };

  // Verificar cambios en la auditoría y reiniciar firmas si es necesario
  useEffect(() => {
    const nuevoHash = generarHashAuditoria();
    
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

  // Función para reiniciar firmas
  const reiniciarFirmas = () => {
    console.log('[DEBUG] Reiniciando firmas debido a cambios en las respuestas de la auditoría');
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
    setMostrarReporte(false);
    setAuditoriaGenerada(false);
    setActiveStep(0);
    setFirmaAuditor(null);
    setFirmaResponsable(null);
    setFirmasCompletadas(false);
    setAuditoriaHash('');
    setFirmasValidas(false);
    setMostrarAlertaReinicio(false);
    setBloquearDatosAgenda(false);
    setAuditoriaIdAgenda(null);
    setErrores([]);
    setNavegacionError("");
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
    
    // Funciones
    log,
    reiniciarFirmas,
    reiniciarAuditoria,
    generarHashAuditoria
  };
}; 