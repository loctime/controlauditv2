import React, { useState, useEffect, useRef, useMemo } from "react";
import { collection, getDocs, query, where, orderBy, limit } from "firebase/firestore";
import { db } from "../../../../firebaseConfig";
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
} from "@mui/material";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import BusinessIcon from '@mui/icons-material/Business';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PersonIcon from '@mui/icons-material/Person';
import "./ReportesPage.css";
import FiltrosReportes from "./FiltrosReportes";
import { useAuth } from "../../../context/AuthContext";
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

const getNombreFormulario = (formulario, nombreForm) =>
  nombreForm ||
  (typeof formulario === "object" && formulario && formulario.nombre
    ? formulario.nombre
    : typeof formulario === "string"
    ? formulario
    : "Formulario no disponible");

const ReportesPage = () => {
  const { userProfile, userEmpresas } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('xs'));
  
  // Debug para verificar si se está detectando móvil correctamente
  console.log('ReportesPage - isMobile:', isMobile);
  console.log('ReportesPage - isSmallMobile:', isSmallMobile);

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
      const nombreForm = getNombreFormulario(reporte.formulario, reporte.nombreForm);
      if (nombreForm && !formulariosMap.has(nombreForm)) {
        formulariosMap.set(nombreForm, nombreForm);
      }
    });
    return Array.from(formulariosMap.values());
  }, [reportes]);

  // Función para obtener el color del estado del reporte
  const getEstadoColor = (reporte) => {
    if (reporte.estado === 'completado') return 'success';
    if (reporte.estado === 'en_progreso') return 'warning';
    if (reporte.estado === 'pendiente') return 'info';
    return 'default';
  };

  // Función para obtener el texto del estado
  const getEstadoText = (reporte) => {
    if (reporte.estado === 'completado') return 'Completado';
    if (reporte.estado === 'en_progreso') return 'En Progreso';
    if (reporte.estado === 'pendiente') return 'Pendiente';
    return 'Sin Estado';
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

  // Fetch de reportes
  const fetchReportes = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('[DEBUG] Iniciando fetch de reportes con multi-tenant...');
      
      let q = query(
        collection(db, "reportes"),
        orderBy("fechaCreacion", "desc"),
        limit(100)
      );

      // Aplicar filtros de multi-tenant si el usuario no es supermax
      if (userProfile?.role !== 'supermax') {
        if (userProfile?.clienteAdminId) {
          q = query(q, where("clienteAdminId", "==", userProfile.clienteAdminId));
        } else if (userProfile?.empresaId) {
          q = query(q, where("empresaId", "==", userProfile.empresaId));
        }
      }

      const querySnapshot = await getDocs(q);
      const reportesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      console.log('[DEBUG]', reportesData.length, 'reportes cargados con multi-tenant');
      console.log('[DEBUG] Primeros 3 reportes:', reportesData.slice(0, 3));
      setReportes(reportesData);
      setFilteredReportes(reportesData);
    } catch (error) {
      console.error("Error fetching reportes:", error);
      setError("Error al cargar los reportes. Por favor, intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  // Efectos
  useEffect(() => {
    fetchReportes();
  }, [userProfile]);

  useEffect(() => {
    console.log('[DEBUG] Aplicando filtros...');
    console.log('[DEBUG] reportes totales:', reportes.length);
    console.log('[DEBUG] empresasSeleccionadas:', empresasSeleccionadas);
    console.log('[DEBUG] formulariosSeleccionados:', formulariosSeleccionados);
    console.log('[DEBUG] fechaDesde:', fechaDesde);
    console.log('[DEBUG] fechaHasta:', fechaHasta);
    console.log('[DEBUG] searchTerm:', searchTerm);
    
    let filtered = [...reportes];

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
        const nombreForm = getNombreFormulario(reporte.formulario, reporte.nombreForm);
        return formulariosSeleccionados.includes(nombreForm);
      });
    }

    // Filtro por fechas
    if (fechaDesde) {
      filtered = filtered.filter(reporte => {
        const fechaReporte = new Date(reporte.fechaCreacion);
        return fechaReporte >= fechaDesde.toDate();
      });
    }

    if (fechaHasta) {
      filtered = filtered.filter(reporte => {
        const fechaReporte = new Date(reporte.fechaCreacion);
        return fechaReporte <= fechaHasta.toDate();
      });
    }

    // Filtro por búsqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(reporte => {
        const empresaNombre = getNombreEmpresa(reporte, userEmpresas).toLowerCase();
        const formularioNombre = getNombreFormulario(reporte.formulario, reporte.nombreForm).toLowerCase();
        const sucursal = (reporte.sucursal || '').toLowerCase();
        const auditor = (reporte.auditor || '').toLowerCase();
        
        return empresaNombre.includes(term) || 
               formularioNombre.includes(term) || 
               sucursal.includes(term) || 
               auditor.includes(term);
      });
    }

    console.log('[DEBUG] reportes filtrados:', filtered.length);
    setFilteredReportes(filtered);
  }, [reportes, empresasSeleccionadas, formulariosSeleccionados, fechaDesde, fechaHasta, searchTerm, userEmpresas]);

  // Handlers
  const handleSelectReporte = (reporte) => {
    console.log('[DEBUG] Seleccionando reporte:', reporte);
    setSelectedReporte(reporte);
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setSelectedReporte(null);
  };

  const handlePrintReport = () => {
    if (detalleRef.current) {
      detalleRef.current.printReport();
    }
  };

  // Renderizado condicional para móvil vs desktop
  const renderMobileView = () => (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      gap: isSmallMobile ? 2 : 3 
    }}>
      {console.log('Renderizando vista móvil:', true)}
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
            {/* Header con empresa y estado */}
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
              <Chip 
                label={getEstadoText(reporte)}
                color={getEstadoColor(reporte)}
                size="small"
                sx={{ fontSize: isSmallMobile ? '0.75rem' : '0.875rem' }}
              />
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
                  {getNombreFormulario(reporte.formulario, reporte.nombreForm)}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PersonIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  {reporte.auditor || "Auditor no disponible"}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CalendarTodayIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  {formatFecha(reporte.fechaCreacion)}
                </Typography>
              </Box>
            </Stack>

            {/* Botón de acción */}
            <Button
              variant="contained"
              color="primary"
              fullWidth
              startIcon={<VisibilityIcon />}
              onClick={() => handleSelectReporte(reporte)}
              sx={{ 
                mt: 'auto',
                py: isSmallMobile ? 1 : 1.5,
                fontSize: isSmallMobile ? '0.875rem' : '1rem'
              }}
            >
              Ver Detalles
            </Button>
          </CardContent>
        </Card>
      ))}
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
            <TableCell sx={{ fontWeight: 600 }}>Estado</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Acciones</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filteredReportes.map((reporte) => (
            <TableRow key={reporte.id} hover>
              <TableCell>{getNombreEmpresa(reporte, userEmpresas)}</TableCell>
              <TableCell>{reporte.sucursal ?? "Casa Central"}</TableCell>
              <TableCell>{getNombreFormulario(reporte.formulario, reporte.nombreForm)}</TableCell>
              <TableCell>{reporte.auditor || "N/A"}</TableCell>
              <TableCell>{formatFecha(reporte.fechaCreacion)}</TableCell>
              <TableCell>
                <Chip 
                  label={getEstadoText(reporte)}
                  color={getEstadoColor(reporte)}
                  size="small"
                />
              </TableCell>
              <TableCell>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<VisibilityIcon />}
                  onClick={() => handleSelectReporte(reporte)}
                >
                  Ver
                </Button>
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
        <Typography 
          variant={isSmallMobile ? "h5" : "h4"} 
          sx={{ 
            fontWeight: 700, 
            color: 'primary.main',
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

      {/* Contenido principal */}
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
            <Box sx={{
              bgcolor: 'background.paper',
              borderRadius: 3,
              border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
              boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
              p: isSmallMobile ? 3 : 4,
              mb: 3
            }}>
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
          </Box>
        )}
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
