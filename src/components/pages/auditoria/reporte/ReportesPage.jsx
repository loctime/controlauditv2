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
} from "@mui/material";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import BusinessIcon from '@mui/icons-material/Business';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import VisibilityIcon from '@mui/icons-material/Visibility';
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
    const empresasArray = Array.from(empresasMap.values());
    return empresasArray;
  }, [reportes, userEmpresas]);

  // Ahora sí puedes usar empresasSeleccionadas
  const empresaSeleccionada = empresasSeleccionadas.length > 0
    ? (empresasDeReportes.find(e => e.id === empresasSeleccionadas[0]) || null)
    : null;

  // ✅ Query segura con filtro multi-tenant
  useEffect(() => {
    const fetchReportes = async () => {
      try {
        if (!userProfile) return;
        
        console.log("[DEBUG] Iniciando fetch de reportes con multi-tenant para:", userProfile.clienteAdminId || userProfile.uid);

        // Query optimizada con filtro multi-tenant en Firestore
        const q = query(
          collection(db, "reportes"),
          where("clienteAdminId", "==", userProfile.clienteAdminId || userProfile.uid),
          orderBy("fechaCreacion", "desc"),
          limit(100) // Limitar para mejor performance
        );

        const querySnapshot = await getDocs(q);
        const reportesData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        console.log(`[DEBUG] ${reportesData.length} reportes cargados con multi-tenant`);

        setReportes(reportesData);
        setFilteredReportes(reportesData);
      } catch (error) {
        console.error("[ERROR] Error al obtener reportes:", error);
        setError("Error al obtener reportes: " + error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchReportes();
  }, [userProfile]);

  // ✅ Filtrar reportes por múltiples criterios
  useEffect(() => {
    let filtered = [...reportes];

    // Filtrar por empresas seleccionadas
    if (empresasSeleccionadas.length > 0) {
      filtered = filtered.filter((reporte) => 
        empresasSeleccionadas.includes(getEmpresaIdFromReporte(reporte))
      );
    }

    // Filtrar por formularios seleccionados
    if (formulariosSeleccionados.length > 0) {
      filtered = filtered.filter((reporte) => 
        formulariosSeleccionados.includes(reporte.formularioId || reporte.formulario?.id)
      );
    }

    // Filtrar por rango de fechas
    if (fechaDesde) {
      filtered = filtered.filter((reporte) => {
        const fechaReporte = reporte.fechaCreacion?.toDate?.() || new Date(reporte.fechaCreacion);
        return fechaReporte >= fechaDesde;
      });
    }

    if (fechaHasta) {
      filtered = filtered.filter((reporte) => {
        const fechaReporte = reporte.fechaCreacion?.toDate?.() || new Date(reporte.fechaCreacion);
        return fechaReporte <= fechaHasta;
      });
    }

    // Filtrar por término de búsqueda
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((reporte) => {
        const nombreEmpresa = getNombreEmpresa(reporte, userEmpresas).toLowerCase();
        const nombreFormulario = getNombreFormulario(reporte.formulario, reporte.nombreForm).toLowerCase();
        const sucursal = (reporte.sucursal || '').toLowerCase();
        
        return nombreEmpresa.includes(term) || 
               nombreFormulario.includes(term) || 
               sucursal.includes(term);
      });
    }

    setFilteredReportes(filtered);
  }, [empresasSeleccionadas, formulariosSeleccionados, fechaDesde, fechaHasta, searchTerm, reportes, userEmpresas]);

  // Elimino el useMemo de empresas y uso directamente userEmpresas

  const handleSelectReporte = (reporte) => {
    setSelectedReporte(reporte);
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setSelectedReporte(null);
  };

  // Obtener formularios únicos de los reportes
  const formulariosDisponibles = useMemo(() => {
    const formulariosMap = new Map();
    reportes.forEach(reporte => {
      const formId = reporte.formularioId || reporte.formulario?.id;
      const formNombre = getNombreFormulario(reporte.formulario, reporte.nombreForm);
      if (formId && !formulariosMap.has(formId)) {
        formulariosMap.set(formId, {
          id: formId,
          nombre: formNombre,
          empresaId: getEmpresaIdFromReporte(reporte)
        });
      }
    });
    const formulariosArray = Array.from(formulariosMap.values());
    return formulariosArray;
  }, [reportes]);

  // Función para imprimir el contenido del reporte
  const handlePrintReport = () => {
    window.print();
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
        <Typography variant="body2" sx={{ ml: 2 }}>
          Cargando reportes...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box className="reportes-container" p={3}>
      {/* Modal para ver el detalle del reporte */}
      <ReporteDetallePro
        open={openModal}
        onClose={handleCloseModal}
        reporte={selectedReporte}
        modo="modal"
        onImprimir={() => window.print()}
      />
      {/* Tabla y filtros siempre visibles */}
      <FiltrosReportes
        empresas={empresasDeReportes.length > 0 ? empresasDeReportes : userEmpresas}
        formularios={formulariosDisponibles}
        empresasSeleccionadas={empresasSeleccionadas}
        formulariosSeleccionados={formulariosSeleccionados}
        fechaDesde={fechaDesde}
        fechaHasta={fechaHasta}
        onChangeEmpresas={setEmpresasSeleccionadas}
        onChangeFormularios={setFormulariosSeleccionados}
        onChangeFechaDesde={setFechaDesde}
        onChangeFechaHasta={setFechaHasta}
        searchTerm={searchTerm}
        onChangeSearchTerm={setSearchTerm}
        loading={loading}
      />
      {/* Vista responsiva: Cards para móvil, Tabla para desktop */}
      {console.log('Renderizando vista móvil:', isMobile)}
      {/* Forzar vista móvil para testing */}
      {true ? (
        // Vista móvil con cards expandibles
        <Box sx={{ mt: 2 }}>
          {filteredReportes.length === 0 ? (
            <Box sx={{ 
              textAlign: 'center', 
              py: 6,
              px: 4,
              bgcolor: alpha(theme.palette.info.main, 0.05),
              borderRadius: 3,
              border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
              boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
              mb: 3,
              minHeight: isSmallMobile ? '200px' : '250px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
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
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: isSmallMobile ? 2 : 3,
                pt: 1
              }}>
                <Grid container spacing={isSmallMobile ? 2 : 3}>
                {console.log('Renderizando reportes:', filteredReportes.length)}
                {filteredReportes.map((reporte) => (
                  <Grid item xs={12} key={reporte.id}>
                    <Accordion 
                      expanded={expandedAccordion === reporte.id}
                      onChange={(event, isExpanded) => {
                        setExpandedAccordion(isExpanded ? reporte.id : null);
                      }}
                      sx={{ 
                        borderRadius: 3,
                        boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                        '&:before': { display: 'none' },
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
                        bgcolor: 'background.paper',
                        '&:hover': {
                          boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                          borderColor: alpha(theme.palette.primary.main, 0.3),
                          transform: 'translateY(-2px)',
                          transition: 'all 0.3s ease'
                        },
                        transition: 'all 0.3s ease'
                      }}
                    >
                    <AccordionSummary
                      expandIcon={<ExpandMoreIcon />}
                      sx={{ 
                        px: isSmallMobile ? 3 : 4,
                        py: isSmallMobile ? 2 : 3,
                        '& .MuiAccordionSummary-content': {
                          margin: 0
                        },
                        '&:hover': {
                          bgcolor: alpha(theme.palette.primary.main, 0.02)
                        }
                      }}
                    >
                      <Box sx={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        gap: 1, 
                        width: '100%' 
                      }}>
                        {/* Header principal */}
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'space-between',
                          mb: 1
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
                                maxWidth: '200px'
                              }}
                            >
                              {getNombreEmpresa(reporte, userEmpresas)}
                            </Typography>
                          </Box>
                          <Chip 
                            label="Ver detalles" 
                            color="primary" 
                            size={isSmallMobile ? "small" : "medium"}
                            icon={<VisibilityIcon />}
                            sx={{ fontSize: isSmallMobile ? '0.75rem' : '0.875rem' }}
                          />
                        </Box>
                        
                        {/* Información rápida */}
                        <Box sx={{ 
                          display: 'flex', 
                          flexWrap: 'wrap', 
                          gap: 1,
                          fontSize: isSmallMobile ? '0.875rem' : '1rem'
                        }}>
                          <Chip 
                            icon={<LocationOnIcon />}
                            label={reporte.sucursal ?? "Casa Central"} 
                            size="small" 
                            variant="outlined"
                            sx={{ fontSize: isSmallMobile ? '0.75rem' : '0.875rem' }}
                          />
                          <Chip 
                            icon={<AssignmentIcon />}
                            label={getNombreFormulario(reporte.formulario, reporte.nombreForm)} 
                            size="small" 
                            variant="outlined"
                            sx={{ fontSize: isSmallMobile ? '0.75rem' : '0.875rem' }}
                          />
                        </Box>
                      </Box>
                    </AccordionSummary>
                    
                                        <AccordionDetails sx={{ 
                      px: isSmallMobile ? 3 : 4, 
                      pb: isSmallMobile ? 3 : 4,
                      pt: isSmallMobile ? 2 : 3
                    }}>
                      <Box sx={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        gap: 2,
                        p: 2,
                        bgcolor: alpha(theme.palette.primary.main, 0.03),
                        borderRadius: 2,
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
                      }}>
                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                          📅 Fecha: {reporte.fechaCreacion ? new Date(reporte.fechaCreacion).toLocaleString() : "Fecha no disponible"}
                        </Typography>
                        <Button
                          variant="contained"
                          color="primary"
                          fullWidth
                          onClick={() => handleSelectReporte(reporte)}
                          sx={{ 
                            mt: 1,
                            py: isSmallMobile ? 1.5 : 2,
                            fontWeight: 600,
                            textTransform: 'none',
                            fontSize: isSmallMobile ? '0.875rem' : '1rem'
                          }}
                        >
                          👁️ Ver Detalles Completos
                        </Button>
                      </Box>
                    </AccordionDetails>
                  </Accordion>
                </Grid>
              ))}
            </Grid>
              </Box>
            </Box>
          )}
        </Box>
      ) : (
        // Vista desktop con tabla
        <TableContainer component={Paper} sx={{ mt: 2 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Empresa</TableCell>
                <TableCell>Sucursal</TableCell>
                <TableCell>Formulario</TableCell>
                <TableCell>Fecha de Guardado</TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredReportes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="textSecondary">
                      {empresasSeleccionadas.length > 0 
                        ? "No se encontraron reportes para esta empresa"
                        : "No hay reportes disponibles"
                      }
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredReportes.map((reporte) => (
                  <TableRow key={reporte.id}>
                    <TableCell>{getNombreEmpresa(reporte, userEmpresas)}</TableCell>
                    <TableCell>{reporte.sucursal ?? "Sucursal no disponible"}</TableCell>
                    <TableCell>{getNombreFormulario(reporte.formulario, reporte.nombreForm)}</TableCell>
                    <TableCell>
                      {reporte.fechaCreacion
                        ? new Date(reporte.fechaCreacion).toLocaleString()
                        : "Fecha no disponible"}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={() => handleSelectReporte(reporte)}
                      >
                        Ver Detalles
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default ReportesPage;
