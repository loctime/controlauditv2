import React, { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Alert,
  Chip,
  Grid,
  Button,
  CircularProgress,
  IconButton,
  TextField,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from "@mui/material";
import {
  Security as SecurityIcon,
  Business as BusinessIcon,
  Assessment as AssessmentIcon,
  Share as ShareIcon,
  Group as GroupIcon,
  Info as InfoIcon,
  Person as PersonIcon,
  Cloud as CloudIcon,
  Upload as UploadIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Delete as DeleteIcon,
  Api as ApiIcon,
  ExpandMore as ExpandMoreIcon,
  PlayArrow as PlayArrowIcon,
  Code as CodeIcon,
  Refresh as RefreshIcon
} from "@mui/icons-material";
import { useAuth } from '../../context/AuthContext';
import { auth } from '../../../firebaseConfig';
import { uploadFile } from '../../../lib/controlfile-upload';
import Swal from 'sweetalert2';

const InfoSistema = () => {
  const { userProfile, user } = useAuth();
  const [currentLogo, setCurrentLogo] = useState(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadedLogoUrl, setUploadedLogoUrl] = useState(null);
  
  // Estados para información del sistema
  const [systemInfo, setSystemInfo] = useState({
    environment: import.meta.env.MODE,
    isDevelopment: import.meta.env.DEV || window.location.hostname === 'localhost',
    userAgent: navigator.userAgent,
    timestamp: new Date().toISOString(),
    hasAuth: !!auth.currentUser,
    authUid: auth.currentUser?.uid,
    authEmail: auth.currentUser?.email
  });

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setCurrentLogo(file);
    } else {
      alert('Por favor selecciona una imagen válida');
    }
  };

  const clearLogo = () => {
    setCurrentLogo(null);
  };

  const handleUploadLogo = async () => {
    if (!currentLogo) {
      Swal.fire('Error', 'Por favor selecciona un logo antes de subir', 'error');
      return;
    }

    setUploadingLogo(true);
    try {
      // Obtener token de autenticación
      const idToken = await auth.currentUser.getIdToken();
      
      // Subir logo a ControlFile
      const uploadResult = await uploadFile(currentLogo, idToken, null); // Usar null para carpeta raíz por defecto
      
      if (uploadResult.success) {
        const logoUrl = `https://files.controldoc.app/${uploadResult.fileId}`;
        setUploadedLogoUrl(logoUrl);
        
        // Limpiar archivo seleccionado
        setCurrentLogo(null);
        
        // Mostrar mensaje de éxito
        Swal.fire({
          icon: 'success',
          title: '¡Logo subido exitosamente!',
          text: `El logo del sistema se ha subido a ControlFile y está disponible en: ${logoUrl}`,
          confirmButtonText: 'Perfecto'
        });
        
        console.log('✅ Logo del sistema subido exitosamente:', {
          fileId: uploadResult.fileId,
          url: logoUrl,
          fileName: uploadResult.fileName,
          fileSize: uploadResult.fileSize
        });
        
      } else {
        throw new Error('Error en la subida del logo');
      }
    } catch (error) {
      console.error('❌ Error subiendo logo del sistema:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error al subir logo',
        text: `No se pudo subir el logo: ${error.message}`,
        confirmButtonText: 'Entendido'
      });
    } finally {
      setUploadingLogo(false);
    }
  };

  const getEnvironmentInfo = () => {
    return {
      environment: import.meta.env.MODE,
      isDevelopment: import.meta.env.DEV || window.location.hostname === 'localhost',
      hostname: window.location.hostname,
      protocol: window.location.protocol,
      port: window.location.port,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      hasAuth: !!auth.currentUser,
      authUid: auth.currentUser?.uid,
      authEmail: auth.currentUser?.email
    };
  };

  const getStatusIcon = () => {
    return <CheckCircleIcon color="success" />;
  };

  const getStatusText = () => {
    return 'Sistema funcionando correctamente';
  };

  const getStatusColor = () => {
    return 'success';
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Información del Sistema
      </Typography>

      {/* Estado del Sistema */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Typography variant="h6">Estado del Sistema</Typography>
            <Chip
              icon={getStatusIcon()}
              label={getStatusText()}
              color={getStatusColor()}
              variant="outlined"
            />
          </Box>
          
          <Typography variant="body2" color="text.secondary">
            El sistema está funcionando correctamente con la nueva integración de ControlFile a través del backend compartido.
          </Typography>
        </CardContent>
      </Card>

      {/* Información del Usuario */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Información del Usuario
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="body2">
                <strong>UID:</strong> {systemInfo.authUid || 'No disponible'}
              </Typography>
              <Typography variant="body2">
                <strong>Email:</strong> {systemInfo.authEmail || 'No disponible'}
              </Typography>
              <Typography variant="body2">
                <strong>Rol:</strong> {userProfile?.role || 'No disponible'}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2">
                <strong>Empresas:</strong> {userProfile?.empresas?.length || 0}
              </Typography>
              <Typography variant="body2">
                <strong>Auditorías:</strong> {userProfile?.auditorias?.length || 0}
              </Typography>
              <Typography variant="body2">
                <strong>Miembro desde:</strong> {userProfile?.createdAt ? new Date(userProfile.createdAt).toLocaleDateString() : 'No disponible'}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Información del Entorno */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Información del Entorno
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="body2">
                <strong>Entorno:</strong> {systemInfo.environment}
              </Typography>
              <Typography variant="body2">
                <strong>Desarrollo:</strong> {systemInfo.isDevelopment ? 'Sí' : 'No'}
              </Typography>
              <Typography variant="body2">
                <strong>Hostname:</strong> {systemInfo.hostname}
              </Typography>
              <Typography variant="body2">
                <strong>Protocolo:</strong> {systemInfo.protocol}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2">
                <strong>Puerto:</strong> {systemInfo.port || '80/443'}
              </Typography>
              <Typography variant="body2">
                <strong>Timestamp:</strong> {new Date(systemInfo.timestamp).toLocaleString()}
              </Typography>
              <Typography variant="body2">
                <strong>Autenticado:</strong> {systemInfo.hasAuth ? 'Sí' : 'No'}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Gestión de Logo */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Gestión de Logo del Sistema
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Sube el logo de tu empresa o sistema. Esta imagen se almacenará en el sistema de archivos compartido de ControlFile.
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Button
              variant="contained"
              component="label"
              startIcon={<UploadIcon />}
              disabled={uploadingLogo}
            >
              Seleccionar Logo
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={handleFileSelect}
              />
            </Button>
            
            {currentLogo && (
              <>
                <Typography variant="body2">
                  Archivo seleccionado: {currentLogo.name}
                </Typography>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={clearLogo}
                  startIcon={<DeleteIcon />}
                  disabled={uploadingLogo}
                >
                  Limpiar
                </Button>
              </>
            )}
          </Box>
          
          {/* Botón de subida */}
          {currentLogo && (
            <Box sx={{ mb: 2 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleUploadLogo}
                disabled={uploadingLogo}
                startIcon={uploadingLogo ? <CircularProgress size={20} /> : <CloudIcon />}
                sx={{ minWidth: 200 }}
              >
                {uploadingLogo ? 'Subiendo...' : 'Subir a ControlFile'}
              </Button>
            </Box>
          )}
          
          {/* Logo subido exitosamente */}
          {uploadedLogoUrl && (
            <Alert severity="success" sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>✅ Logo subido exitosamente a ControlFile</strong><br />
                <strong>URL:</strong> <a href={uploadedLogoUrl} target="_blank" rel="noopener noreferrer">{uploadedLogoUrl}</a><br />
                <strong>Nota:</strong> Este logo está ahora disponible en el sistema de archivos compartido.
              </Typography>
            </Alert>
          )}
          
          {currentLogo && (
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>Archivo:</strong> {currentLogo.name}<br />
                <strong>Tamaño:</strong> {(currentLogo.size / 1024 / 1024).toFixed(2)} MB<br />
                <strong>Tipo:</strong> {currentLogo.type}<br />
                <strong>Última modificación:</strong> {new Date(currentLogo.lastModified).toLocaleString()}
              </Typography>
            </Alert>
          )}
          
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Nota:</strong> El logo se almacenará en el sistema de archivos compartido de ControlFile de forma segura y podrás usarlo en toda la aplicación.
            </Typography>
          </Alert>
        </CardContent>
      </Card>

      {/* Información Técnica */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Información Técnica
          </Typography>
          
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography>Detalles del Navegador</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" component="pre" sx={{ 
                backgroundColor: 'grey.100', 
                p: 2, 
                borderRadius: 1,
                overflow: 'auto',
                fontSize: '0.875rem'
              }}>
                {systemInfo.userAgent}
              </Typography>
            </AccordionDetails>
          </Accordion>
          
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography>Variables de Entorno</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" component="pre" sx={{ 
                backgroundColor: 'grey.100', 
                p: 2, 
                borderRadius: 1,
                overflow: 'auto',
                fontSize: '0.875rem'
              }}>
                {JSON.stringify({
                  NODE_ENV: import.meta.env.NODE_ENV,
                  MODE: import.meta.env.MODE,
                  DEV: import.meta.env.DEV,
                  PROD: import.meta.env.PROD,
                  BASE_URL: import.meta.env.VITE_BASE_URL,
                  BACKEND_URL: import.meta.env.VITE_BACKEND_URL
                }, null, 2)}
              </Typography>
            </AccordionDetails>
          </Accordion>
        </CardContent>
      </Card>
    </Box>
  );
};

export default InfoSistema;