import React, { useState, useEffect } from "react";
import Firma from "./Firma";
import ResumenAuditoriaModal from "./ResumenAuditoriaModal";
import { Grid, Box, Typography, Alert, Chip, Button } from "@mui/material";
import { CheckCircle, Edit, Person, Visibility } from "@mui/icons-material";
import { useAuth } from "../../../context/AuthContext";
import './ReportesPage.css'; // Asegúrate de que la clase CSS esté disponible

const FirmaSection = ({ 
  isPdf = false, 
  onSaveFirmaAuditor, 
  onSaveFirmaResponsable,
  firmaAuditor,
  firmaResponsable,
  // Props para el resumen de auditoría
  empresa,
  sucursal,
  formulario,
  respuestas,
  secciones,
  encargado
}) => {
  const { userProfile } = useAuth();
  const [firmaAuditorURL, setFirmaAuditorURL] = useState(firmaAuditor);
  const [firmaResponsableURL, setFirmaResponsableURL] = useState(firmaResponsable);
  const [firmaAuditorAutoAplicada, setFirmaAuditorAutoAplicada] = useState(false);
  const [modalResumenAbierto, setModalResumenAbierto] = useState(false);

  // Aplicar automáticamente la firma del auditor si tiene una configurada
  useEffect(() => {
    if (userProfile?.firmaDigital && !firmaAuditorURL && !firmaAuditorAutoAplicada) {
      console.log('[DEBUG] Aplicando firma automática del auditor desde perfil');
      setFirmaAuditorURL(userProfile.firmaDigital);
      setFirmaAuditorAutoAplicada(true);
      if (onSaveFirmaAuditor) {
        onSaveFirmaAuditor(userProfile.firmaDigital);
      }
    }
  }, [userProfile?.firmaDigital, firmaAuditorURL, firmaAuditorAutoAplicada, onSaveFirmaAuditor]);

  const handleSaveFirmaAuditor = (url) => {
    setFirmaAuditorURL(url);
    if (onSaveFirmaAuditor) {
      onSaveFirmaAuditor(url);
    }
  };

  const handleSaveFirmaResponsable = (url) => {
    setFirmaResponsableURL(url);
    if (onSaveFirmaResponsable) {
      onSaveFirmaResponsable(url);
    }
  };

  // Estilos específicos para el PDF
  const pdfStyle = isPdf ? {
    width: '50%', // Ajusta el ancho para el PDF
    margin: '0 auto', // Centra horizontalmente
    display: 'flex',
    justifyContent: 'space-between',
    flexDirection: 'row', // Mantén las firmas en fila
    alignItems: 'flex-start', // Alinea las firmas al inicio
    padding: '10px 0', // Ajusta el padding
  } : {};

  const firmasCompletadas = firmaAuditorURL && firmaResponsableURL;

  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ 
        color: 'primary.main', 
        mb: 3, 
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        gap: 1
      }}>
        <Edit color="primary" />
        Firmas Digitales de la Auditoría
      </Typography>

      {firmasCompletadas && (
        <Alert severity="success" sx={{ mb: 3 }}>
          <Typography variant="body2">
            ✅ Firma del auditor completada correctamente
          </Typography>
        </Alert>
      )}

      <Grid container spacing={3} style={pdfStyle}>
        <Grid item xs={12} md={6}>
          <Box className="signature-container" sx={{ 
            p: 3, 
            border: '2px solid', 
            borderColor: firmaAuditorURL ? 'success.main' : 'grey.300',
            borderRadius: 2,
            backgroundColor: firmaAuditorURL ? 'success.light' : 'background.paper',
            position: 'relative'
          }}>
            {firmaAuditorURL && (
              <Chip
                icon={<CheckCircle />}
                label={firmaAuditorAutoAplicada ? "Firma Automática" : "Firma Completada"}
                color="success"
                size="small"
                sx={{ position: 'absolute', top: 8, right: 8 }}
              />
            )}
            
            {/* Firma del Auditor - Automática desde perfil */}
            <Box sx={{ textAlign: 'center', mb: 2 }}>
              <Typography variant="h6" color="primary" sx={{ fontWeight: 600 }}>
                Firma del Auditor
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {userProfile?.displayName || userProfile?.email}
              </Typography>
            </Box>

            {firmaAuditorURL ? (
              <Box sx={{ textAlign: 'center' }}>
                <img 
                  src={firmaAuditorURL} 
                  alt="Firma del auditor" 
                  style={{ 
                    maxWidth: '100%', 
                    maxHeight: '120px',
                    objectFit: 'contain',
                    border: '1px solid #e0e0e0',
                    borderRadius: '4px',
                    padding: '8px',
                    backgroundColor: '#fff'
                  }} 
                />
                {firmaAuditorAutoAplicada && (
                  <Typography variant="caption" color="success.main" sx={{ display: 'block', mt: 1 }}>
                    ✅ Aplicada automáticamente desde tu perfil
                  </Typography>
                )}
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<Edit />}
                  onClick={() => handleSaveFirmaAuditor('')}
                  sx={{ mt: 1 }}
                >
                  Cambiar Firma
                </Button>
              </Box>
            ) : (
              <Box sx={{ textAlign: 'center', py: 3 }}>
                <Person sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {userProfile?.firmaDigital 
                    ? 'Haz clic para aplicar tu firma del perfil'
                    : 'No tienes una firma configurada en tu perfil'
                  }
                </Typography>
                {userProfile?.firmaDigital && (
                  <Button
                    variant="contained"
                    startIcon={<CheckCircle />}
                    onClick={() => handleSaveFirmaAuditor(userProfile.firmaDigital)}
                  >
                    Aplicar Firma del Perfil
                  </Button>
                )}
              </Box>
            )}
          </Box>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Box className="signature-container" sx={{ 
            p: 3, 
            border: '2px solid', 
            borderColor: firmaResponsableURL ? 'success.main' : 'grey.300',
            borderRadius: 2,
            backgroundColor: firmaResponsableURL ? 'success.light' : 'background.paper',
            position: 'relative'
          }}>
            {firmaResponsableURL && (
              <Chip
                icon={<CheckCircle />}
                label="Firma Completada"
                color="success"
                size="small"
                sx={{ position: 'absolute', top: 8, right: 8 }}
              />
            )}
            
            {/* Botón para ver resumen completo y firmar */}
            <Box sx={{ textAlign: 'center' }}>
              <Button
                variant="contained"
                startIcon={<Visibility />}
                onClick={() => setModalResumenAbierto(true)}
                size="large"
                sx={{ mb: 2 }}
                color={firmaResponsableURL ? "success" : "primary"}
              >
                {firmaResponsableURL ? 'Ver Resumen y Firma' : 'Revisar y Firmar (Opcional)'}
              </Button>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {firmaResponsableURL 
                  ? 'Firma del responsable completada. Puede revisar el resumen nuevamente.'
                  : 'Revisa todos los detalles y opcionalmente firma la auditoría'
                }
              </Typography>
              
              {firmaResponsableURL && (
                <Box sx={{ 
                  p: 2, 
                  bgcolor: 'success.light', 
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'success.main'
                }}>
                  <Typography variant="body2" color="success.main" sx={{ fontWeight: 500 }}>
                    ✅ Firma del responsable completada (opcional)
                  </Typography>
                </Box>
              )}

              {!firmaResponsableURL && (
                <Box sx={{ 
                  p: 2, 
                  bgcolor: 'info.light', 
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'info.main'
                }}>
                  <Typography variant="body2" color="info.main" sx={{ fontWeight: 500 }}>
                    ℹ️ La firma del responsable es opcional. Puede continuar sin firmar.
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        </Grid>
      </Grid>

      {!firmasCompletadas && (
        <Alert severity="info" sx={{ mt: 3 }}>
          <Typography variant="body2">
            📝 Complete la firma del auditor para continuar con la auditoría
            {!userProfile?.firmaDigital && (
              <span style={{ display: 'block', marginTop: '4px' }}>
                💡 <strong>Consejo:</strong> Configura tu firma en el perfil para aplicarla automáticamente
              </span>
            )}
          </Typography>
        </Alert>
      )}

      {/* Modal de Resumen Completo */}
      <ResumenAuditoriaModal
        open={modalResumenAbierto}
        onClose={() => setModalResumenAbierto(false)}
        empresa={empresa}
        sucursal={sucursal}
        formulario={formulario}
        respuestas={respuestas}
        secciones={secciones}
        encargado={encargado}
        onSaveFirmaResponsable={handleSaveFirmaResponsable}
        firmaResponsable={firmaResponsableURL}
      />
    </Box>
  );
};

export default FirmaSection;
