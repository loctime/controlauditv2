import React from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  useTheme,
  useMediaQuery,
  alpha,
  Fade as MuiFade,
  Zoom
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LocationOnIcon from '@mui/icons-material/LocationOn';

// Iconos para los pasos
import BusinessIcon from '@mui/icons-material/Business';
import AssignmentIcon from '@mui/icons-material/Assignment';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import AssessmentIcon from '@mui/icons-material/Assessment';
import EditIcon from '@mui/icons-material/Edit';

// Componentes de pasos
import SeleccionEmpresa from "../SeleccionEmpresa";
import SeleccionSucursal from "../SeleccionSucursal";
import SeleccionFormulario from "../SeleccionFormulario";
import PreguntasYSeccion from "../PreguntasYSeccion";
import FirmaSection from "../../reporte/FirmaSection";
import BotonGenerarReporte from "../../reporte/ReporteImprimir";

// Utilidades
import { filtrarSucursalesPorEmpresa } from '../utils/auditoriaUtils';

/**
 * Componente que define todos los pasos del stepper de auditoría
 * @param {Object} props - Propiedades del componente
 * @returns {Array} - Array de pasos configurados
 */
export const createAuditoriaSteps = ({
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
  handleFinalizar,
  
  // Funciones
  obtenerUbicacion,
  validarTodasLasPreguntas,
  setOpenAlertaEdicion,
  
  // Tema
  theme,
  isMobile
}) => {
  return [
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
                  {(() => {
                    // Filtrar sucursales por la empresa seleccionada
                    const sucursalesFiltradas = filtrarSucursalesPorEmpresa(sucursales, empresaSeleccionada);
                    
                    return sucursalesFiltradas.length > 0 ? (
                      <SeleccionSucursal
                        sucursales={sucursalesFiltradas}
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
                    );
                  })()}
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
                        <strong> Ubicación:</strong> {obtenerUbicacion()}
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
            
            {validarTodasLasPreguntas() && (
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
              deshabilitado={!validarTodasLasPreguntas() || !firmasCompletadas}
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
};

export default createAuditoriaSteps;
