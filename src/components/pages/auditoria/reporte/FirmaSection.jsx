import React, { useState, useEffect, useRef } from "react";
import Firma from "./Firma";
import ResumenAuditoriaModal from "./ResumenAuditoriaModal";
import { 
  Grid, 
  Box, 
  Typography, 
  Alert, 
  Chip, 
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
  TextField,
  Card,
  CardContent
} from "@mui/material";
import { CheckCircle, Edit, Person, Visibility, Save, Clear, Upload } from "@mui/icons-material";
import { useAuth } from "../../../context/AuthContext";
import SignaturePad from 'react-signature-canvas';
import Swal from 'sweetalert2';
import './ReportesPage.css'; // Asegúrate de que la clase CSS esté disponible

const capitalizeWords = (str) => {
  return str.replace(/\b\w+/g, (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
};

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
  const { userProfile, updateUserProfile } = useAuth();
  const [firmaAuditorURL, setFirmaAuditorURL] = useState(firmaAuditor);
  const [firmaResponsableURL, setFirmaResponsableURL] = useState(firmaResponsable);
  const [firmaAuditorAutoAplicada, setFirmaAuditorAutoAplicada] = useState(false);
  const [modalResumenAbierto, setModalResumenAbierto] = useState(false);
  
  // Estados para el modal de creación de firma
  const [modalCrearFirmaAbierto, setModalCrearFirmaAbierto] = useState(false);
  const [nombre, setNombre] = useState(userProfile?.nombre || '');
  const [dni, setDni] = useState(userProfile?.dni || '');
  const [telefono, setTelefono] = useState(userProfile?.telefono || '');
  const [isSaving, setIsSaving] = useState(false);
  const [signatureData, setSignatureData] = useState('');
  const sigPadRef = useRef(null);

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

  // Cargar datos del perfil cuando se abre el modal
  useEffect(() => {
    if (modalCrearFirmaAbierto) {
      setNombre(userProfile?.nombre || '');
      setDni(userProfile?.dni || '');
      setTelefono(userProfile?.telefono || '');
      setSignatureData('');
    }
  }, [modalCrearFirmaAbierto, userProfile]);

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

  // Funciones para el modal de creación de firma
  const handleClearSignature = () => {
    if (sigPadRef.current) {
      sigPadRef.current.clear();
    }
  };

  const handleSaveFirma = async () => {
    if (!nombre.trim()) {
      Swal.fire('Error', 'Por favor ingresa tu nombre y apellido', 'error');
      return;
    }
    if (!dni.trim()) {
      Swal.fire('Error', 'Por favor ingresa tu DNI', 'error');
      return;
    }
    if ((!sigPadRef.current || sigPadRef.current.isEmpty()) && !signatureData) {
      Swal.fire('Error', 'Por favor dibuja tu firma antes de guardar', 'error');
      return;
    }
    
    setIsSaving(true);
    try {
      const signatureDataUrl = sigPadRef.current && !sigPadRef.current.isEmpty()
        ? sigPadRef.current.getTrimmedCanvas().toDataURL('image/png')
        : signatureData;
      
      const nombreFormateado = capitalizeWords(nombre.trim());
      
      await updateUserProfile({
        firmaDigital: signatureDataUrl,
        firmaActualizada: new Date().toISOString(),
        nombre: nombreFormateado,
        dni: dni.trim(),
        telefono: telefono.trim()
      });
      
      // Aplicar la firma inmediatamente
      setFirmaAuditorURL(signatureDataUrl);
      setFirmaAuditorAutoAplicada(false); // No es automática, es manual
      if (onSaveFirmaAuditor) {
        onSaveFirmaAuditor(signatureDataUrl);
      }
      
      setModalCrearFirmaAbierto(false);
      Swal.fire('Éxito', 'Firma creada y aplicada correctamente', 'success');
    } catch (error) {
      console.error('Error al guardar firma:', error);
      Swal.fire('Error', 'Error al guardar la firma', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      Swal.fire('Error', 'Por favor selecciona un archivo de imagen', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setSignatureData(e.target.result);
    };
    reader.readAsDataURL(file);
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

  // Solo la firma del auditor es obligatoria
  const firmasCompletadas = firmaAuditorURL;

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
                {userProfile?.firmaDigital ? (
                  <Button
                    variant="contained"
                    startIcon={<CheckCircle />}
                    onClick={() => handleSaveFirmaAuditor(userProfile.firmaDigital)}
                  >
                    Aplicar Firma del Perfil
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    startIcon={<Edit />}
                    onClick={() => setModalCrearFirmaAbierto(true)}
                    color="primary"
                  >
                    Crear Firma Digital
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

      {/* Modal para crear firma */}
      <Dialog 
        open={modalCrearFirmaAbierto} 
        onClose={() => setModalCrearFirmaAbierto(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Crear Firma Digital
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    Datos Personales
                  </Typography>
                  <TextField
                    fullWidth
                    label="Nombre y Apellido"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    margin="normal"
                    required
                    placeholder="Ingresa tu nombre y apellido"
                  />
                  <TextField
                    fullWidth
                    label="DNI"
                    value={dni}
                    onChange={(e) => setDni(e.target.value)}
                    margin="normal"
                    required
                    placeholder="Ingresa tu DNI"
                  />
                  <TextField
                    fullWidth
                    label="Teléfono (opcional)"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    margin="normal"
                    placeholder="Ingresa tu teléfono"
                  />
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    Dibuja tu Firma
                  </Typography>
                  <Paper 
                    elevation={2} 
                    sx={{ 
                      border: '2px solid #e0e0e0',
                      backgroundColor: '#fff',
                      mb: 2
                    }}
                  >
                    <SignaturePad
                      ref={sigPadRef}
                      canvasProps={{
                        width: 400,
                        height: 200,
                        className: 'signature-canvas'
                      }}
                      backgroundColor="#ffffff"
                    />
                  </Paper>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<Clear />}
                      onClick={handleClearSignature}
                    >
                      Limpiar
                    </Button>
                    <input
                      accept="image/*"
                      style={{ display: 'none' }}
                      id="firma-file-upload-modal"
                      type="file"
                      onChange={handleFileUpload}
                    />
                    <label htmlFor="firma-file-upload-modal">
                      <Button
                        variant="outlined"
                        component="span"
                        startIcon={<Upload />}
                        size="small"
                      >
                        Subir Imagen
                      </Button>
                    </label>
                  </Box>
                  {signatureData && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Vista previa:
                      </Typography>
                      <img 
                        src={signatureData} 
                        alt="Vista previa de firma" 
                        style={{ 
                          maxWidth: '100%', 
                          maxHeight: '80px',
                          objectFit: 'contain',
                          border: '1px solid #e0e0e0',
                          borderRadius: '4px',
                          padding: '4px',
                          backgroundColor: '#fff'
                        }} 
                      />
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setModalCrearFirmaAbierto(false)}
            color="inherit"
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleSaveFirma}
            variant="contained"
            startIcon={<Save />}
            disabled={isSaving}
          >
            {isSaving ? 'Guardando...' : 'Guardar y Aplicar Firma'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FirmaSection;
