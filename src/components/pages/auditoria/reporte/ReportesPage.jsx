import logger from '@/utils/logger';
import React, { useState, useEffect, useRef, useMemo } from "react";
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { reporteService } from "../../../../services/reporteService";
import { db } from "../../../../firebaseControlFile";
import { useLocation, useNavigate } from 'react-router-dom';
import { auditoriaService } from '../../../../services/auditoriaService';
import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  useTheme,
  useMediaQuery,
  Card,
  CardContent,
  Chip,
  alpha,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  Stack,
  Tabs,
  Tab,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  LinearProgress,
} from "@mui/material";
import syncQueueService from '../../../../services/syncQueue';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import BusinessIcon from '@mui/icons-material/Business';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PersonIcon from '@mui/icons-material/Person';
import DeleteIcon from '@mui/icons-material/Delete';
import PrintIcon from '@mui/icons-material/Print';
import BarChartIcon from '@mui/icons-material/BarChart';
import Swal from 'sweetalert2';
import "./ReportesPage.css";
import FiltrosReportes from "./FiltrosReportes";
import { useAuth } from '@/components/context/AuthContext';
import { getEmpresaIdFromReporte } from '../../../../services/useMetadataService';
import dayjs from 'dayjs';
import ReporteDetallePro from './ReporteDetallePro';

// Helpers seguros para obtener nombre de empresa y formulario
const getNombreEmpresa = (reporte, empresas = []) => {
  if (reporte.empresaNombre) return reporte.empresaNombre;
  if (reporte.empresaId && empresas.length > 0) {
    const emp = empresas.find(e => e.id === reporte.empresaId);
    if (emp) return emp.nombre;
  }
  if (reporte.empresa && typeof reporte.empresa === 'object' && reporte.empresa.nombre) return reporte.empresa.nombre;
  if (typeof reporte.empresa === 'string') return reporte.empresa;
  return 'Empresa no disponible';
};

const getNombreFormulario = (reporte) => {
  // Prioridad: formularioNombre > nombreForm > formulario objeto > formulario string
  if (reporte.formularioNombre) return reporte.formularioNombre;
  if (reporte.nombreForm) return reporte.nombreForm;
  if (typeof reporte.formulario === "object" && reporte.formulario?.nombre) return reporte.formulario.nombre;
  if (typeof reporte.formulario === "string") return reporte.formulario;
  return "Formulario no disponible";
};

// Helper para obtener nombre del auditor
const getNombreAuditor = (reporte, userProfile) => {
  return reporte?.nombreInspector || 
         reporte?.auditorNombre || 
         userProfile?.nombre || 
         userProfile?.displayName || 
         userProfile?.email || 
         'N/A';
};

const ReportesPage = () => {
  const { userProfile, userEmpresas, getAuditoriasCompartidas } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('xs'));
  const location = useLocation();
  const navigate = useNavigate();
  
  // Detectar si viene del perfil
  const vieneDelPerfil = location.state?.from === 'perfil';
  
  // Debug para verificar si se está detectando móvil correctamente
  logger.debug('ReportesPage - isMobile:', isMobile);
  logger.debug('ReportesPage - isSmallMobile:', isSmallMobile);

  // Estados primero
  const [reportes, setReportes] = useState([]);
  const [filteredReportes, setFilteredReportes] = useState([]);
  const [selectedReporte, setSelectedReporte] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [empresasSeleccionadas, setEmpresasSeleccionadas] = useState([]);
  const [formulariosSeleccionados, setFormulariosSeleccionados] = useState([]);
  const [fechaDesde, setFechaDesde] = useState(null);
  const [fechaHasta, setFechaHasta] = useState(dayjs());
  const [searchTerm, setSearchTerm] = useState("");
  const detalleRef = useRef();
  const [openModal, setOpenModal] = useState(false);
  const [expandedAccordion, setExpandedAccordion] = useState(null);
  const [autoPrint, setAutoPrint] = useState(false);
  const lastSyncReportsRefreshAtRef = useRef(0);
  
  // Cache para evitar recargas innecesarias
  const reportesCacheRef = useRef({});
  const lastOwnerIdRef = useRef(null);
  
  // Estados para tabs y análisis
  const [tabValue, setTabValue] = useState(0);
  const [selectedFormulario, setSelectedFormulario] = useState('');
  
  // Estados para dashboard en tiempo real
  const [reportesTiempoReal, setReportesTiempoReal] = useState([]);
  const [preguntasFormulario, setPreguntasFormulario] = useState([]);
  const [analisisTiempoReal, setAnalisisTiempoReal] = useState(null);
  const [loadingAnalisis, setLoadingAnalisis] = useState(false);
  const unsubscribeRef = useRef(null);

  // Estilos responsivos
  const mobileBoxStyle = {
    mb: isMobile ? 1.5 : 3,
    p: isMobile ? 2 : 3,
    borderRadius: 3,
    bgcolor: 'background.paper',
    border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
    overflow: 'hidden',
    minHeight: isMobile ? '120px' : '140px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 8px 25px rgba(0,0,0,0.12)',
      transition: 'all 0.3s ease'
    },
    transition: 'all 0.3s ease'
  };

  // Obtener empresas únicas de los reportes (temporal)
  const empresasDeReportes = useMemo(() => {
    const empresasMap = new Map();
    reportes.forEach(reporte => {
      const empresaId = getEmpresaIdFromReporte(reporte);
      const empresaNombre = getNombreEmpresa(reporte, userEmpresas);
      if (empresaId && !empresasMap.has(empresaId)) {
        empresasMap.set(empresaId, {
          id: empresaId,
          nombre: empresaNombre
        });
      }
    });
    return Array.from(empresasMap.values());
  }, [reportes, userEmpresas]);

  // Obtener formularios únicos de los reportes
  const formulariosDeReportes = useMemo(() => {
    const formulariosMap = new Map();
    reportes.forEach(reporte => {
      const nombreForm = getNombreFormulario(reporte);
      logger.debug('[DEBUG] Formulario encontrado en reporte:', {
        id: reporte.id,
        formularioNombre: reporte.formularioNombre,
        nombreForm: reporte.nombreForm,
        formulario: reporte.formulario,
        nombreFinal: nombreForm
      });
      if (nombreForm && !formulariosMap.has(nombreForm)) {
        formulariosMap.set(nombreForm, nombreForm);
      }
    });
    const formulariosArray = Array.from(formulariosMap.values());
    logger.debug('[DEBUG] Formularios únicos disponibles:', formulariosArray);
    return formulariosArray;
  }, [reportes]);

  // Helper para tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Listener en tiempo real para reportes del formulario seleccionado
  useEffect(() => {
    const setupListener = async () => {
      if (!selectedFormulario || !userProfile?.ownerId) {
        // Limpiar listener si no hay formulario seleccionado
        if (unsubscribeRef.current) {
          unsubscribeRef.current();
          unsubscribeRef.current = null;
        }
        setReportesTiempoReal([]);
        setPreguntasFormulario([]);
        setAnalisisTiempoReal(null);
        return;
      }

      setLoadingAnalisis(true);
      
      // Crear query para la colección de reportes
      const reportesRef = collection(db, 'apps', 'auditoria', 'owners', userProfile.ownerId, 'reportes');
      
      // Debug: mostrar el formulario seleccionado
      logger.debug('[DEBUG] Formulario seleccionado:', selectedFormulario);
      
      // Función para intentar el query con diferentes campos
      const intentarQuery = async (campo) => {
        logger.debug(`[DEBUG] Intentando query con campo: ${campo}`);
        const q = query(reportesRef, where(campo, '==', selectedFormulario));
        
        return new Promise((resolve, reject) => {
          const unsubscribe = onSnapshot(q, (snapshot) => {
            logger.debug(`[DEBUG] Query con ${campo} encontró ${snapshot.size} documentos`);
            resolve({ snapshot, unsubscribe, campo });
          }, (error) => {
            logger.error(`[DEBUG] Error con campo ${campo}:`, error);
            unsubscribe();
            reject(error);
          });
        });
      };

      // Intentar con diferentes campos en orden de prioridad
      const campos = ['formularioNombre', 'nombreForm', 'formulario'];
      let resultado = null;
      
      for (const campo of campos) {
        try {
          resultado = await intentarQuery(campo);
          if (resultado.snapshot.size > 0) {
            logger.debug(`[DEBUG] Éxito con campo: ${campo}`);
            break;
          } else {
            resultado.unsubscribe();
            resultado = null;
          }
        } catch (error) {
          logger.debug(`[DEBUG] Falló campo ${campo}, intentando siguiente...`);
        }
      }

      if (!resultado) {
        logger.debug('[DEBUG] No se encontraron reportes con ningún campo');
        setLoadingAnalisis(false);
        return;
      }

      // Suscribirse a cambios en tiempo real con el campo que funcionó
      const unsubscribe = onSnapshot(query(reportesRef, where(resultado.campo, '==', selectedFormulario)), (snapshot) => {
        logger.debug('[DEBUG] Snapshot recibido, docs:', snapshot.size);
        
        const reportesData = [];
        let preguntasEncontradas = [];
        
        snapshot.forEach((doc) => {
          const reporte = { id: doc.id, ...doc.data() };
          logger.debug('[DEBUG] Reporte encontrado:', {
            id: reporte.id,
            formularioNombre: reporte.formularioNombre,
            nombreForm: reporte.nombreForm,
            formulario: reporte.formulario,
            secciones: reporte.secciones ? 'tiene secciones' : 'sin secciones'
          });
          reportesData.push(reporte);
          
          // Obtener preguntas del primer reporte disponible
          if (preguntasEncontradas.length === 0 && reporte.secciones) {
            preguntasEncontradas = extraerPreguntasDeSecciones(reporte.secciones);
            logger.debug('[DEBUG] Preguntas extraídas:', preguntasEncontradas.length);
          }
        });

        logger.debug('[DEBUG] Total reportes:', reportesData.length);
        logger.debug('[DEBUG] Total preguntas:', preguntasEncontradas.length);

        setReportesTiempoReal(reportesData);
        setPreguntasFormulario(preguntasEncontradas);
        
        // Calcular análisis en tiempo real
        if (reportesData.length > 0 && preguntasEncontradas.length > 0) {
          const analisis = calcularAnalisisTiempoReal(reportesData, preguntasEncontradas);
          setAnalisisTiempoReal(analisis);
          logger.debug('[DEBUG] Análisis calculado:', analisis);
        } else {
          logger.debug('[DEBUG] No se puede calcular análisis - reportes:', reportesData.length, 'preguntas:', preguntasEncontradas.length);
          setAnalisisTiempoReal(null);
        }
        
        setLoadingAnalisis(false);
      }, (error) => {
        logger.error('Error en listener de tiempo real:', error);
        setLoadingAnalisis(false);
      });

      unsubscribeRef.current = unsubscribe;

      return () => {
        if (unsubscribeRef.current) {
          unsubscribeRef.current();
          unsubscribeRef.current = null;
        }
      };
    };

    setupListener();
  }, [selectedFormulario, userProfile?.ownerId]);

  // Función para extraer preguntas de las secciones
  const extraerPreguntasDeSecciones = (secciones) => {
    const preguntas = [];
    if (!secciones || !Array.isArray(secciones)) return preguntas;
    
    secciones.forEach((seccion, sIdx) => {
      if (seccion.preguntas && Array.isArray(seccion.preguntas)) {
        seccion.preguntas.forEach((pregunta, pIdx) => {
          const preguntaText = typeof pregunta === 'string' ? pregunta : pregunta?.texto || pregunta?.text || `Pregunta ${pIdx + 1}`;
          preguntas.push({
            id: `preg-${sIdx + 1}-${pIdx + 1}`,
            texto: preguntaText,
            seccion: seccion.nombre || `Sección ${sIdx + 1}`,
            seccionIndex: sIdx,
            preguntaIndex: pIdx
          });
        });
      }
    });
    
    return preguntas;
  };

  // Función para calcular análisis en tiempo real
  const calcularAnalisisTiempoReal = (reportes, preguntas) => {
    let totalConformes = 0;
    let totalNoConformes = 0;
    let totalPuntaje = 0;
    let conteoPuntaje = 0;

    // Calcular estadísticas generales basándonos en las respuestas reales
    reportes.forEach((reporte, idx) => {
      logger.debug(`[DEBUG] Reporte ${idx} - estadísticas:`, {
        respuestasConformes: reporte.respuestasConformes,
        respuestasNoConformes: reporte.respuestasNoConformes,
        puntaje: reporte.puntaje
      });
      
      // Si los campos pre-calculados no existen, calcularlos desde las respuestas
      let conformesReporte = 0;
      let noConformesReporte = 0;
      let puntajeReporte = 0;
      
      if (reporte.respuestas && Object.keys(reporte.respuestas).length > 0) {
        // Contar respuestas conformes y no conformes desde el mapa de respuestas
        Object.values(reporte.respuestas).forEach(respuesta => {
          if (typeof respuesta === 'string') {
            const respuestaNormalizada = respuesta.trim();
            if (respuestaNormalizada === 'Conforme') {
              conformesReporte++;
            } else if (respuestaNormalizada === 'No conforme') {
              noConformesReporte++;
            }
          }
        });
        
        // Calcular puntaje basado en el porcentaje de conformes
        const totalRespuestasValidas = conformesReporte + noConformesReporte;
        if (totalRespuestasValidas > 0) {
          puntajeReporte = Math.round((conformesReporte / totalRespuestasValidas) * 100);
        }
      }
      
      // Usar valores pre-calculados si existen, si no usar los calculados
      totalConformes += reporte.respuestasConformes || conformesReporte;
      totalNoConformes += reporte.respuestasNoConformes || noConformesReporte;
      
      if (reporte.puntaje !== undefined && reporte.puntaje !== null) {
        totalPuntaje += reporte.puntaje;
        conteoPuntaje++;
      } else if (puntajeReporte > 0) {
        totalPuntaje += puntajeReporte;
        conteoPuntaje++;
      }
      
      logger.debug(`[DEBUG] Reporte ${idx} - cálculo real:`, {
        conformesCalculados: conformesReporte,
        noConformesCalculados: noConformesReporte,
        puntajeCalculado: puntajeReporte
      });
    });

    logger.debug('[DEBUG] Estadísticas generales calculadas:', {
      totalConformes,
      totalNoConformes,
      totalPuntaje,
      conteoPuntaje,
      totalReportes: reportes.length
    });

    // Calcular distribución de respuestas por pregunta
    const analisisPorPregunta = preguntas.map(pregunta => {
      const conteo = {
        'Conforme': 0,
        'No conforme': 0,
        'Necesita mejora': 0,
        'No aplica': 0,
        'Sin responder': 0
      };

      reportes.forEach((reporte, rIdx) => {
        if (reporte.respuestas) {
          logger.debug(`[DEBUG] Reporte ${rIdx} - respuestas disponibles:`, Object.keys(reporte.respuestas));
          logger.debug(`[DEBUG] Buscando clave "${pregunta.id}" en reporte ${rIdx}`);
          
          const claveRespuesta = pregunta.id;
          const respuesta = reporte.respuestas[claveRespuesta];
          
          logger.debug(`[DEBUG] Reporte ${rIdx} - clave "${claveRespuesta}":`, respuesta);
          
          // Si no encuentra con el formato esperado, intentar otros formatos
          let respuestaFinal = respuesta;
          if (!respuesta) {
            // Intentar otros posibles formatos de clave
            const clavesAlternativas = [
              `preg-${pregunta.seccionIndex + 1}-${pregunta.preguntaIndex + 1}`,
              `pregunta_${pregunta.seccionIndex + 1}_${pregunta.preguntaIndex + 1}`,
              `seccion_${pregunta.seccionIndex}_pregunta_${pregunta.preguntaIndex}`,
              `${pregunta.seccionIndex + 1}-${pregunta.preguntaIndex + 1}`
            ];
            
            for (const altClave of clavesAlternativas) {
              if (reporte.respuestas[altClave]) {
                respuestaFinal = reporte.respuestas[altClave];
                logger.debug(`[DEBUG] Encontrado con clave alternativa "${altClave}":`, respuestaFinal);
                break;
              }
            }
          }
          
          if (respuestaFinal && typeof respuestaFinal === 'string') {
            const respuestaNormalizada = respuestaFinal.trim();
            logger.debug(`[DEBUG] Respuesta normalizada: "${respuestaNormalizada}"`);
            if (conteo.hasOwnProperty(respuestaNormalizada)) {
              conteo[respuestaNormalizada]++;
              logger.debug(`[DEBUG] Contado como: ${respuestaNormalizada}`);
            } else {
              conteo['Sin responder']++;
              logger.debug(`[DEBUG] Respuesta no reconocida, contado como Sin responder`);
            }
          } else {
            conteo['Sin responder']++;
            logger.debug(`[DEBUG] Sin respuesta válida, contado como Sin responder`);
          }
        } else {
          conteo['Sin responder']++;
          logger.debug(`[DEBUG] Reporte sin campo respuestas, contado como Sin responder`);
        }
      });

      const totalRespuestas = Object.values(conteo).reduce((sum, val) => sum + val, 0);

      logger.debug(`[DEBUG] Pregunta "${pregunta.texto}" - conteo final:`, conteo);

      return {
        ...pregunta,
        conteo,
        totalRespuestas,
        porcentajes: Object.keys(conteo).reduce((acc, key) => {
          acc[key] = totalRespuestas > 0 ? (conteo[key] / totalRespuestas * 100).toFixed(1) : 0;
          return acc;
        }, {})
      };
    });

    return {
      totalAuditorias: reportes.length,
      puntajePromedio: conteoPuntaje > 0 ? (totalPuntaje / conteoPuntaje).toFixed(1) : 0,
      totalConformes,
      totalNoConformes,
      analisisPorPregunta
    };
  };

  // Importar normalizarRespuestas para el análisis
  const normalizarRespuestas = (res, secciones = []) => {
    // Implementación simple de normalización para el análisis
    if (!res || !secciones) return [];
    
    const resultado = [];
    secciones.forEach((seccion, sIdx) => {
      const seccionRespuestas = [];
      if (seccion.preguntas) {
        seccion.preguntas.forEach((pregunta, pIdx) => {
          const clave = `seccion_${sIdx}_pregunta_${pIdx}`;
          seccionRespuestas.push(res[clave] || 'Sin responder');
        });
      }
      resultado.push(seccionRespuestas);
    });
    return resultado;
  };


  // Función para formatear fecha
  const formatFecha = (fecha) => {
    if (!fecha) return "Fecha no disponible";
    try {
      return new Date(fecha).toLocaleString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return "Fecha no disponible";
    }
  };

  // Fetch de reportes usando auditoriaService (owner-centric)
  const fetchReportes = async (forceRefresh = false) => {
    if (!userProfile?.ownerId) {
      setLoading(false);
      return;
    }

    const ownerId = userProfile.ownerId;
    
    // Verificar cache antes de cargar
    if (!forceRefresh && reportesCacheRef.current[ownerId] && lastOwnerIdRef.current === ownerId) {
      logger.debug('[DEBUG] Usando datos cacheados para owner:', ownerId);
      setReportes(reportesCacheRef.current[ownerId]);
      setFilteredReportes(reportesCacheRef.current[ownerId]);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      logger.debug('[DEBUG] Cargando reportes desde auditoriaService para owner:', ownerId);
      
      // Usar auditoriaService que ya maneja owner-centric
      const reportesData = await auditoriaService.getUserAuditorias(
        ownerId,
        userProfile?.role || 'operario',
        userProfile
      );

      // Ordenar por fecha de creación (más recientes primero)
      const reportesOrdenados = reportesData.sort((a, b) => {
        const fechaA = a.fechaCreacion?.toDate?.() || new Date(a.fechaCreacion || 0);
        const fechaB = b.fechaCreacion?.toDate?.() || new Date(b.fechaCreacion || 0);
        return fechaB - fechaA;
      });

      logger.debug('[DEBUG]', reportesOrdenados.length, 'reportes cargados');
      
      // Guardar en cache
      reportesCacheRef.current[ownerId] = reportesOrdenados;
      lastOwnerIdRef.current = ownerId;
      
      setReportes(reportesOrdenados);
      setFilteredReportes(reportesOrdenados);
    } catch (error) {
      logger.error("Error fetching reportes:", error);
      setError("Error al cargar los reportes. Por favor, intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  // Efectos - Recargar solo si cambia el UID del usuario
  useEffect(() => {
    if (!userProfile?.uid) {
      setLoading(false);
      return;
    }

    fetchReportes();
    getAuditoriasCompartidas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userProfile?.uid]);

  // Refrescar reportes cuando la cola sincronice auditorías (evita que el usuario vea datos viejos)
  useEffect(() => {
    const removeListener = syncQueueService.addListener(async (event, data) => {
      try {
        if (event !== 'item_success') return;
        const item = data?.item;
        if (!item) return;

        // Solo refrescar cuando el item es la auditoría creada/actualizada
        if (item.type !== 'CREATE_AUDITORIA' && item.type !== 'UPDATE_AUDITORIA') return;

        if (!userProfile?.ownerId) return;

        // Forzar recarga para evitar que el cache local del componente tape cambios nuevos
        // (pero throttlear para no disparar muchas queries seguidas)
        const now = Date.now();
        if (now - lastSyncReportsRefreshAtRef.current < 5000) return;
        lastSyncReportsRefreshAtRef.current = now;
        await fetchReportes(true);
      } catch (e) {
        // No romper la UI si el refresh falla por conectividad
        logger.debug('[DEBUG] No se pudo refrescar reportes tras sync:', e?.message || e);
      }
    });

    return removeListener;
  }, [userProfile?.ownerId, userProfile?.uid]);

  useEffect(() => {
    logger.debug('[DEBUG] Aplicando filtros...');
    logger.debug('[DEBUG] reportes totales:', reportes.length);
    logger.debug('[DEBUG] empresasSeleccionadas:', empresasSeleccionadas);
    logger.debug('[DEBUG] formulariosSeleccionados:', formulariosSeleccionados);
    logger.debug('[DEBUG] fechaDesde:', fechaDesde);
    logger.debug('[DEBUG] fechaHasta:', fechaHasta);
    logger.debug('[DEBUG] searchTerm:', searchTerm);
    
    let filtered = [...reportes];

    // Normaliza `fechaCreacion` a `Date` para evitar problemas de tipo (Timestamp vs ISO string).
    const parseFechaCreacion = (fechaCreacion) => {
      if (!fechaCreacion) return null;
      try {
        if (fechaCreacion?.toDate) return fechaCreacion.toDate();
        if (fechaCreacion instanceof Date) return fechaCreacion;
        const d = new Date(fechaCreacion);
        return Number.isNaN(d?.getTime?.()) ? null : d;
      } catch {
        return null;
      }
    };

    // Filtro por empresas
    if (empresasSeleccionadas.length > 0) {
      filtered = filtered.filter(reporte => {
        const empresaId = getEmpresaIdFromReporte(reporte);
        return empresasSeleccionadas.includes(empresaId);
      });
    }

    // Filtro por formularios
    if (formulariosSeleccionados.length > 0) {
      filtered = filtered.filter(reporte => {
        const nombreForm = getNombreFormulario(reporte);
        return formulariosSeleccionados.includes(nombreForm);
      });
    }

    // Filtro por fechas
    if (fechaDesde) {
      const fechaDesdeDate =
        fechaDesde?.startOf && fechaDesde?.toDate
          ? fechaDesde.startOf('day').toDate()
          : (fechaDesde.toDate ? fechaDesde.toDate() : new Date(fechaDesde));

      filtered = filtered.filter(reporte => {
        const fechaReporte = parseFechaCreacion(reporte.fechaCreacion);
        if (!fechaReporte) return false;
        return fechaReporte >= fechaDesdeDate;
      });
    }

    if (fechaHasta) {
      // `DatePicker` suele devolver la fecha a medianoche local; usamos fin de día para incluir
      // documentos “del día seleccionado” completos.
      const fechaHastaDate =
        fechaHasta?.endOf && fechaHasta?.toDate
          ? fechaHasta.endOf('day').toDate()
          : (fechaHasta.toDate ? fechaHasta.toDate() : new Date(fechaHasta));

      filtered = filtered.filter(reporte => {
        const fechaReporte = parseFechaCreacion(reporte.fechaCreacion);
        if (!fechaReporte) return false;
        return fechaReporte <= fechaHastaDate;
      });
    }

    // Filtro por búsqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(reporte => {
        const empresaNombre = getNombreEmpresa(reporte, userEmpresas).toLowerCase();
        const formularioNombre = getNombreFormulario(reporte).toLowerCase();
        const sucursal = (reporte.sucursal || '').toLowerCase();
        const auditor = (reporte.auditor || '').toLowerCase();
        
        return empresaNombre.includes(term) || 
               formularioNombre.includes(term) || 
               sucursal.includes(term) || 
               auditor.includes(term);
      });
    }

    logger.debug('[DEBUG] reportes filtrados:', filtered.length);
    setFilteredReportes(filtered);
  }, [reportes, empresasSeleccionadas, formulariosSeleccionados, fechaDesde, fechaHasta, searchTerm, userEmpresas]);

  // Handlers
  const handleSelectReporte = (reporte) => {
    logger.debug('[DEBUG] Seleccionando reporte:', reporte);
    setSelectedReporte(reporte);
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setSelectedReporte(null);
    setAutoPrint(false);
  };

  const handlePrintReport = () => {
    if (detalleRef.current) {
      detalleRef.current.printReport();
    }
  };

  const handlePrintReporteDirecto = (reporte) => {
    // Seleccionar el reporte y marcar para impresión automática
    setSelectedReporte(reporte);
    setAutoPrint(true);
    setOpenModal(true);
  };

  // Efecto para ejecutar impresión automática cuando el modal esté listo
  useEffect(() => {
    if (openModal && autoPrint && selectedReporte && detalleRef.current) {
      // Esperar un poco más para que los gráficos se preparen
      const timer = setTimeout(() => {
        if (detalleRef.current) {
          detalleRef.current.printReport();
          setAutoPrint(false);
        }
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [openModal, autoPrint, selectedReporte]);

  const handleVolver = () => {
    navigate('/perfil');
  };

  const handleDeleteReporte = async (reporte) => {
    const result = await Swal.fire({
      title: '¿Eliminar reporte?',
      text: `Esta acción eliminará permanentemente el reporte de ${getNombreEmpresa(reporte, userEmpresas)}. Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d32f2f',
      cancelButtonColor: '#757575',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true,
      focusCancel: true,
      customClass: {
        popup: 'swal2-popup-custom',
        confirmButton: 'swal2-confirm-danger'
      }
    });

    if (result.isConfirmed) {
      try {
        const ownerId = userProfile?.ownerId;
        if (!ownerId) {
          throw new Error('ownerId no disponible');
        }

        // Eliminar desde la ruta owner-centric
        await reporteService.deleteReporte(ownerId, reporte.id);
        
        // Actualizar estado local
        setReportes(prev => prev.filter(r => r.id !== reporte.id));
        setFilteredReportes(prev => prev.filter(r => r.id !== reporte.id));
        
        // Limpiar cache
        if (reportesCacheRef.current[ownerId]) {
          reportesCacheRef.current[ownerId] = reportesCacheRef.current[ownerId].filter(r => r.id !== reporte.id);
        }
        
        Swal.fire('Eliminado', 'El reporte ha sido eliminado correctamente', 'success');
      } catch (error) {
        logger.error('Error al eliminar reporte:', error);
        Swal.fire('Error', 'No se pudo eliminar el reporte. Por favor, intenta de nuevo.', 'error');
      }
    }
  };

  // Renderizado condicional para móvil vs desktop
  const renderMobileView = () => (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      gap: isSmallMobile ? 2 : 3 
    }}>
      {logger.debug('Renderizando vista móvil:', true)}
      {filteredReportes.map((reporte) => (
        <Card 
          key={reporte.id}
          sx={mobileBoxStyle}
        >
          <CardContent sx={{ 
            p: isSmallMobile ? 2 : 3,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            {/* Header con empresa */}
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              mb: 2
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <BusinessIcon 
                  color="primary" 
                  sx={{ fontSize: isSmallMobile ? 20 : 24 }} 
                />
                <Typography 
                  variant={isSmallMobile ? "body1" : "h6"} 
                  sx={{ 
                    fontWeight: 600,
                    color: 'primary.main',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    maxWidth: '150px'
                  }}
                >
                  {getNombreEmpresa(reporte, userEmpresas)}
                </Typography>
              </Box>
            </Box>

            {/* Información del reporte */}
            <Stack spacing={1} sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LocationOnIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  {reporte.sucursal ?? "Casa Central"}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AssignmentIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary" sx={{ 
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden'
                }}>
                  {getNombreFormulario(reporte)}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PersonIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  {getNombreAuditor(reporte, userProfile)}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CalendarTodayIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  {formatFecha(reporte.fechaCreacion)}
                </Typography>
              </Box>
            </Stack>

            {/* Botones de acción */}
            <Box sx={{ 
              display: 'flex', 
              gap: 1.5, 
              mt: 'auto',
              alignItems: 'center'
            }}>
              <Button
                variant="contained"
                color="primary"
                fullWidth
                startIcon={<VisibilityIcon />}
                onClick={() => handleSelectReporte(reporte)}
                sx={{ 
                  py: isSmallMobile ? 1 : 1.5,
                  fontSize: isSmallMobile ? '0.875rem' : '1rem'
                }}
              >
                Ver Detalles
              </Button>
              <IconButton
                color="primary"
                onClick={() => handlePrintReporteDirecto(reporte)}
                sx={{ 
                  flexShrink: 0
                }}
                aria-label="Imprimir reporte"
              >
                <PrintIcon />
              </IconButton>
              <IconButton
                color="error"
                onClick={() => handleDeleteReporte(reporte)}
                sx={{ 
                  flexShrink: 0
                }}
                aria-label="Eliminar reporte"
              >
                <DeleteIcon />
              </IconButton>
            </Box>
          </CardContent>
        </Card>
      ))}
    </Box>
  );

  // Renderizar vista de análisis global en tiempo real
  const renderAnalisisGlobal = () => (
    <Box>
      {/* Selector de formulario */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <BarChartIcon sx={{ color: 'primary.main', fontSize: 28 }} />
          <FormControl fullWidth sx={{ maxWidth: 400 }}>
            <InputLabel id="formulario-select-label">Seleccionar Formulario</InputLabel>
            <Select
              labelId="formulario-select-label"
              value={selectedFormulario}
              label="Seleccionar Formulario"
              onChange={(e) => setSelectedFormulario(e.target.value)}
            >
            <MenuItem value="">
              <em>Todos los formularios</em>
            </MenuItem>
            {formulariosDeReportes.map((formulario) => (
              <MenuItem key={formulario} value={formulario}>
                {formulario}
              </MenuItem>
            ))}
          </Select>
          </FormControl>
        </Box>
      </Box>

      {loadingAnalisis ? (
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '200px' 
        }}>
          <CircularProgress />
        </Box>
      ) : selectedFormulario && analisisTiempoReal ? (
        <Box>
          {/* Cards con estadísticas en tiempo real */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ 
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                borderRadius: 3
              }}>
                <CardContent sx={{ textAlign: 'center', py: 3 }}>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                    {analisisTiempoReal.totalAuditorias}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Total de Auditorías
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ 
                bgcolor: alpha(theme.palette.success.main, 0.1),
                border: `2px solid ${alpha(theme.palette.success.main, 0.2)}`,
                borderRadius: 3
              }}>
                <CardContent sx={{ textAlign: 'center', py: 3 }}>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
                    {analisisTiempoReal.puntajePromedio}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Puntaje Promedio
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ 
                bgcolor: alpha(theme.palette.success.main, 0.1),
                border: `2px solid ${alpha(theme.palette.success.main, 0.2)}`,
                borderRadius: 3
              }}>
                <CardContent sx={{ textAlign: 'center', py: 3 }}>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
                    {analisisTiempoReal.totalConformes}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Total Conformes
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ 
                bgcolor: alpha(theme.palette.error.main, 0.1),
                border: `2px solid ${alpha(theme.palette.error.main, 0.2)}`,
                borderRadius: 3
              }}>
                <CardContent sx={{ textAlign: 'center', py: 3 }}>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: 'error.main' }}>
                    {analisisTiempoReal.totalNoConformes}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Total No Conformes
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Dashboard de análisis por pregunta */}
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: 'primary.main' }}>
            📊 Análisis Detallado por Pregunta
          </Typography>
          
          {analisisTiempoReal.analisisPorPregunta.map((preguntaAnalisis, index) => (
            <Card key={preguntaAnalisis.id} sx={{ mb: 3, borderRadius: 3 }}>
              <CardContent>
                {/* Título de la pregunta */}
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.primary' }}>
                    {preguntaAnalisis.texto}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {preguntaAnalisis.seccion} • {preguntaAnalisis.totalRespuestas} respuestas recibidas
                  </Typography>
                </Box>

                {/* Barras de progreso para cada tipo de respuesta */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {/* Conforme - Verde */}
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2" sx={{ fontWeight: 500, color: 'success.main' }}>
                        ✅ Conforme
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {preguntaAnalisis.porcentajes['Conforme']}% ({preguntaAnalisis.conteo['Conforme']})
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={parseFloat(preguntaAnalisis.porcentajes['Conforme'])}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: alpha(theme.palette.success.main, 0.1),
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: theme.palette.success.main,
                          borderRadius: 4,
                        }
                      }}
                    />
                  </Box>

                  {/* No conforme - Rojo */}
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2" sx={{ fontWeight: 500, color: 'error.main' }}>
                        ❌ No conforme
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {preguntaAnalisis.porcentajes['No conforme']}% ({preguntaAnalisis.conteo['No conforme']})
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={parseFloat(preguntaAnalisis.porcentajes['No conforme'])}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: alpha(theme.palette.error.main, 0.1),
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: theme.palette.error.main,
                          borderRadius: 4,
                        }
                      }}
                    />
                  </Box>

                  {/* Necesita mejora - Amarillo */}
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2" sx={{ fontWeight: 500, color: 'warning.main' }}>
                        ⚠️ Necesita mejora
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {preguntaAnalisis.porcentajes['Necesita mejora']}% ({preguntaAnalisis.conteo['Necesita mejora']})
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={parseFloat(preguntaAnalisis.porcentajes['Necesita mejora'])}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: alpha(theme.palette.warning.main, 0.1),
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: theme.palette.warning.main,
                          borderRadius: 4,
                        }
                      }}
                    />
                  </Box>

                  {/* No aplica - Gris */}
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.secondary' }}>
                        ⏭️ No aplica
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {preguntaAnalisis.porcentajes['No aplica']}% ({preguntaAnalisis.conteo['No aplica']})
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={parseFloat(preguntaAnalisis.porcentajes['No aplica'])}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: alpha(theme.palette.text.secondary, 0.1),
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: theme.palette.text.secondary,
                          borderRadius: 4,
                        }
                      }}
                    />
                  </Box>

                  {/* Sin responder - Gris claro */}
                  {preguntaAnalisis.conteo['Sin responder'] > 0 && (
                    <Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500, color: 'grey.500' }}>
                          📝 Sin responder
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {preguntaAnalisis.porcentajes['Sin responder']}% ({preguntaAnalisis.conteo['Sin responder']})
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={parseFloat(preguntaAnalisis.porcentajes['Sin responder'])}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: alpha(theme.palette.grey[300], 0.3),
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: theme.palette.grey[400],
                            borderRadius: 4,
                          }
                        }}
                      />
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      ) : selectedFormulario ? (
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '200px' 
        }}>
          <Typography variant="body1" color="text.secondary">
            No hay datos disponibles para el formulario seleccionado.
          </Typography>
        </Box>
      ) : (
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '200px' 
        }}>
          <Typography variant="body1" color="text.secondary">
            Por favor, selecciona un formulario para ver el análisis en tiempo real.
          </Typography>
        </Box>
      )}
    </Box>
  );

  const renderDesktopView = () => (
    <TableContainer component={Paper} sx={{ borderRadius: 3, overflow: 'hidden' }}>
      <Table>
        <TableHead>
          <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1) }}>
            <TableCell sx={{ fontWeight: 600 }}>Empresa</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Sucursal</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Formulario</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Auditor</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Fecha</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Acciones</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filteredReportes.map((reporte) => (
            <TableRow key={reporte.id} hover>
              <TableCell>{getNombreEmpresa(reporte, userEmpresas)}</TableCell>
              <TableCell>{reporte.sucursal ?? "Casa Central"}</TableCell>
              <TableCell>{getNombreFormulario(reporte)}</TableCell>
              <TableCell>{getNombreAuditor(reporte, userProfile)}</TableCell>
              <TableCell>{formatFecha(reporte.fechaCreacion)}</TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<VisibilityIcon />}
                    onClick={() => handleSelectReporte(reporte)}
                  >
                    Ver
                  </Button>
                  <IconButton
                    color="primary"
                    size="small"
                    onClick={() => handlePrintReporteDirecto(reporte)}
                    aria-label="Imprimir reporte"
                  >
                    <PrintIcon />
                  </IconButton>
                  <IconButton
                    color="error"
                    size="small"
                    onClick={() => handleDeleteReporte(reporte)}
                    aria-label="Eliminar reporte"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  // Renderizado principal
  return (
    <Box sx={{ 
      p: isSmallMobile ? 2 : 4,
      maxWidth: 1200,
      mx: 'auto'
    }}>
      {/* Header */}
      <Box sx={{ 
        textAlign: 'center', 
        mb: isSmallMobile ? 4 : 6 
      }}>
        {/* Botón de volver si viene del perfil */}
        {vieneDelPerfil && (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'flex-start', 
            mb: 2 
          }}>
            <Button
              variant="outlined"
              color="primary"
              onClick={handleVolver}
              sx={{
                borderRadius: 2,
                px: 3,
                py: 1,
                fontWeight: 600,
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.1)
                }
              }}
            >
              ← Volver al Perfil
            </Button>
          </Box>
        )}
        
        <Typography 
          variant={isSmallMobile ? "h5" : "h4"} 
          component="h1"
          sx={{ 
            fontWeight: 700, 
            color: '#1565c0',
            mb: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2
          }}
        >
          📊 Reportes de Auditoría
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ lineHeight: 1.6 }}
        >
          Gestiona y visualiza todos los reportes de auditoría del sistema
        </Typography>
        <Box sx={{ mt: 2 }}>
          <Button
            variant="outlined"
            startIcon={<BarChartIcon />}
            onClick={() => navigate('/congreso-live')}
            sx={{ borderRadius: 2, fontWeight: 600 }}
          >
            Modo Congreso
          </Button>
        </Box>
      </Box>

      {/* Filtros */}
      <Box sx={{ mb: 4 }}>
        <FiltrosReportes
          empresas={empresasDeReportes}
          formularios={formulariosDeReportes}
          empresasSeleccionadas={empresasSeleccionadas}
          onChangeEmpresas={setEmpresasSeleccionadas}
          formulariosSeleccionados={formulariosSeleccionados}
          onChangeFormularios={setFormulariosSeleccionados}
          fechaDesde={fechaDesde}
          onChangeFechaDesde={setFechaDesde}
          fechaHasta={fechaHasta}
          onChangeFechaHasta={setFechaHasta}
          searchTerm={searchTerm}
          onChangeSearchTerm={setSearchTerm}
        />
      </Box>

      {/* Tabs system */}
      <Box sx={{ 
        bgcolor: 'background.paper',
        borderRadius: 3,
        border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
        boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
        overflow: 'hidden'
      }}>
        {/* Tabs header */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange}
            variant="fullWidth"
            sx={{
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '1rem',
                py: 2
              }
            }}
          >
            <Tab 
              label="📊 Reportes" 
              icon={<AssignmentIcon sx={{ mr: 1 }} />}
              iconPosition="start"
            />
            <Tab 
              label="📈 Análisis Global" 
              icon={<BarChartIcon sx={{ mr: 1 }} />}
              iconPosition="start"
            />
          </Tabs>
        </Box>

        {/* Tab content */}
        <Box sx={{ p: isSmallMobile ? 2 : 4 }}>
          {tabValue === 0 && (
            // Tab 1: Reportes (vista existente)
            <Box>
              {loading ? (
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center', 
                  minHeight: '200px' 
                }}>
                  <CircularProgress />
                </Box>
              ) : error ? (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {error}
                </Alert>
              ) : filteredReportes.length === 0 ? (
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center', 
                  minHeight: '300px' 
                }}>
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    gap: 3,
                    maxWidth: '400px'
                  }}>
                    <Box sx={{ 
                      p: 3, 
                      borderRadius: '50%', 
                      bgcolor: alpha(theme.palette.info.main, 0.1),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: `2px solid ${alpha(theme.palette.info.main, 0.2)}`
                    }}>
                      <AssignmentIcon 
                        color="info" 
                        sx={{ fontSize: isSmallMobile ? 40 : 48 }} 
                      />
                    </Box>
                    <Typography 
                      variant={isSmallMobile ? "h6" : "h5"} 
                      sx={{ 
                        fontWeight: 700, 
                        color: 'text.primary',
                        mb: 2,
                        textAlign: 'center'
                      }}
                    >
                      No hay reportes disponibles
                    </Typography>
                    <Typography 
                      variant="body1" 
                      color="text.secondary"
                      sx={{ 
                        fontSize: isSmallMobile ? '1rem' : '1.125rem',
                        maxWidth: '350px',
                        lineHeight: 1.6,
                        textAlign: 'center'
                      }}
                    >
                      {empresasSeleccionadas.length > 0 
                        ? "No se encontraron reportes para la empresa seleccionada. Intenta con otros filtros o modifica los criterios de búsqueda."
                        : "Aún no se han generado reportes de auditoría. Los reportes aparecerán aquí una vez que se completen las auditorías."
                      }
                    </Typography>
                  </Box>
                </Box>
              ) : (
                <Box>
                  {/* Contador de reportes */}
                  <Typography 
                    variant={isSmallMobile ? "h6" : "h5"} 
                    sx={{ 
                      fontWeight: 700, 
                      color: 'primary.main',
                      mb: isSmallMobile ? 3 : 4,
                      textAlign: 'center',
                      pb: 3,
                      borderBottom: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                      fontSize: isSmallMobile ? '1.25rem' : '1.5rem'
                    }}
                  >
                    📊 Reportes Disponibles ({filteredReportes.length})
                  </Typography>
                  
                  {/* Vista condicional */}
                  {isMobile ? renderMobileView() : renderDesktopView()}
                </Box>
              )}
            </Box>
          )}
          
          {tabValue === 1 && (
            // Tab 2: Análisis Global
            <Box>
              {loading ? (
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center', 
                  minHeight: '200px' 
                }}>
                  <CircularProgress />
                </Box>
              ) : (
                renderAnalisisGlobal()
              )}
            </Box>
          )}
        </Box>
      </Box>

      {/* Modal de detalles */}
      <Dialog
        open={openModal}
        onClose={handleCloseModal}
        maxWidth="lg"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Detalles del Reporte</Typography>
            <IconButton onClick={handleCloseModal}>
              <ExpandMoreIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedReporte ? (
            <ReporteDetallePro 
              reporte={selectedReporte} 
              ref={detalleRef}
              onPrint={handlePrintReport}
              modo="modal"
              open={openModal}
              onClose={handleCloseModal}
            />
          ) : (
            <Typography>No se seleccionó ningún reporte</Typography>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default ReportesPage;
