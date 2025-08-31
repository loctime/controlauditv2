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
  Code as CodeIcon
} from "@mui/icons-material";
import { controlFileService } from '../../../services/controlFileService';
import { useAuth } from '../../context/AuthContext';

const InfoSistema = () => {
  const { userProfile, user } = useAuth();
  const [controlFileStatus, setControlFileStatus] = useState('checking');
  const [testImage, setTestImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [diagnosticInfo, setDiagnosticInfo] = useState(null);
  const [currentLogo, setCurrentLogo] = useState(null);
  
  // Estados para pruebas de API
  const [apiTests, setApiTests] = useState({
    profile: { loading: false, result: null, error: null },
    presign: { loading: false, result: null, error: null },
    complete: { loading: false, result: null, error: null }
  });
  const [uploadId, setUploadId] = useState('');

  // Verificar estado de ControlFile
  React.useEffect(() => {
    checkControlFileStatus();
  }, []);

  const checkControlFileStatus = async () => {
    try {
      setControlFileStatus('checking');
      
      // Obtener información de diagnóstico
      const diagInfo = await controlFileService.getDiagnosticInfo();
      setDiagnosticInfo(diagInfo);
      
      const hasAccount = await controlFileService.checkUserAccount();
      setControlFileStatus(hasAccount ? 'connected' : 'not-connected');
    } catch (error) {
      console.error('Error verificando ControlFile:', error);
      setControlFileStatus('error');
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setTestImage(file);
      setUploadError(null);
      setUploadResult(null);
    } else {
      alert('Por favor selecciona una imagen válida');
    }
  };

  const handleUploadTest = async (isLogo = false) => {
    if (!testImage) {
      alert('Por favor selecciona una imagen primero');
      return;
    }

    setUploading(true);
    setUploadError(null);
    setUploadResult(null);

    try {
      // Configurar metadatos según el tipo de subida
      const metadata = isLogo ? {
        tipo: 'logo_sistema',
        app: 'controlaudit',
        userId: userProfile?.uid,
        categoria: 'branding',
        uso: 'logo_principal',
        empresa: userProfile?.displayName || 'Sistema',
        test: false
      } : {
        tipo: 'test_upload',
        app: 'controlaudit',
        userId: userProfile?.uid,
        test: true
      };

      // Intentar subida real primero
      const result = await controlFileService.uploadFileComplete(testImage, metadata);

      setUploadResult(result);
      console.log(`✅ ${isLogo ? 'Logo' : 'Subida de prueba'} exitosa:`, result);
    } catch (error) {
      console.error(`❌ Error en ${isLogo ? 'subida de logo' : 'subida de prueba'}:`, error);
      
      // Si falla, intentar modo simulado
      if (error.message.includes('No se puede conectar') || error.message.includes('Failed to fetch')) {
        try {
          console.log('🔄 Intentando modo simulado...');
          const simulatedResult = await controlFileService.simulateUpload(testImage, {
            ...metadata,
            tipo: isLogo ? 'logo_sistema_simulated' : 'test_upload_simulated'
          });
          
          setUploadResult({
            ...simulatedResult,
            simulated: true
          });
          console.log(`✅ ${isLogo ? 'Logo' : 'Subida'} simulada exitosa:`, simulatedResult);
        } catch (simError) {
          console.error(`❌ Error en ${isLogo ? 'subida de logo' : 'subida'} simulada:`, simError);
          setUploadError(`Error en subida real: ${error.message}\n\nModo simulado también falló: ${simError.message}`);
        }
      } else {
        setUploadError(error.message);
      }
    } finally {
      setUploading(false);
    }
  };

  const clearTest = () => {
    setTestImage(null);
    setUploadResult(null);
    setUploadError(null);
  };

  const getStatusIcon = () => {
    switch (controlFileStatus) {
      case 'connected':
        return <CheckCircleIcon color="success" />;
      case 'not-connected':
        return <InfoIcon color="warning" />;
      case 'error':
        return <ErrorIcon color="error" />;
      default:
        return <CircularProgress size={20} />;
    }
  };

  const getStatusText = () => {
    switch (controlFileStatus) {
      case 'connected':
        return 'Conectado a ControlFile';
      case 'not-connected':
        return 'No conectado (se auto-provisionará en la primera subida)';
      case 'error':
        return 'Error de conexión';
      default:
        return 'Verificando conexión...';
    }
  };

  const getStatusColor = () => {
    switch (controlFileStatus) {
      case 'connected':
        return 'success';
      case 'not-connected':
        return 'warning';
      case 'error':
        return 'error';
      default:
        return 'info';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Sistema de Permisos y Colaboración
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body1">
          Este sistema implementa un control de acceso basado en usuarios para garantizar que cada usuario solo pueda ver y gestionar sus propios recursos, con opciones de colaboración.
        </Typography>
      </Alert>

      {/* ControlFile Status */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <CloudIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6">Estado de ControlFile</Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            {getStatusIcon()}
            <Typography 
              variant="body1" 
              sx={{ ml: 1 }}
              color={`${getStatusColor()}.main`}
            >
              {getStatusText()}
            </Typography>
          </Box>

                     <Alert severity={getStatusColor()} sx={{ mb: 2 }}>
             <Typography variant="body2">
               {controlFileStatus === 'connected' && 
                 'Tu cuenta está conectada a ControlFile. Las imágenes se almacenan de forma segura.'
               }
               {controlFileStatus === 'not-connected' && 
                 diagnosticInfo?.serviceAvailable ? 
                   'Tu cuenta se auto-provisionará en ControlFile cuando subas tu primera imagen.' :
                   'El servicio ControlFile no está disponible. Usando backend local para las pruebas.'
               }
               {controlFileStatus === 'error' && 
                 'Error al verificar la conexión con ControlFile. Verifica tu conexión a internet y la configuración.'
               }
             </Typography>
           </Alert>

                     {/* Información de Diagnóstico */}
           {diagnosticInfo && (
             <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
               <Typography variant="subtitle2" gutterBottom>
                 Información de Diagnóstico:
               </Typography>
               <Typography variant="body2" component="div" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                 <div>URL: {diagnosticInfo.baseURL}</div>
                 <div>Entorno: {diagnosticInfo.environment} {diagnosticInfo.isDevelopment ? '(Desarrollo)' : '(Producción)'}</div>
                 <div>Servicio: {diagnosticInfo.serviceAvailable ? '✅ Disponible' : '❌ No disponible'}</div>
                 <div>Usuario: {diagnosticInfo.hasAuth ? diagnosticInfo.authUid : 'No autenticado'}</div>
                 <div>Timestamp: {diagnosticInfo.timestamp}</div>
               </Typography>
             </Box>
           )}

          <Button 
            variant="outlined" 
            onClick={checkControlFileStatus}
            disabled={controlFileStatus === 'checking'}
            startIcon={<CloudIcon />}
          >
            Verificar Conexión
          </Button>
        </CardContent>
      </Card>

      {/* Logo del Sistema */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <BusinessIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6">Logo del Sistema</Typography>
          </Box>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Sube el logo de tu empresa o sistema. Esta imagen se almacenará en ControlFile y podrás usarla en toda la aplicación.
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Button
              variant="outlined"
              component="label"
              startIcon={<UploadIcon />}
              disabled={uploading}
            >
              Seleccionar Logo
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={handleFileSelect}
              />
            </Button>

            {testImage && (
              <Typography variant="body2" color="text.secondary">
                {testImage.name} ({(testImage.size / 1024 / 1024).toFixed(2)} MB)
              </Typography>
            )}

            {testImage && (
              <IconButton onClick={clearTest} color="error" size="small">
                <DeleteIcon />
              </IconButton>
            )}
          </Box>

          {testImage && (
            <Button
              variant="contained"
              onClick={() => handleUploadTest(true)}
              disabled={uploading}
              startIcon={uploading ? <CircularProgress size={16} /> : <CloudIcon />}
              sx={{ mb: 2 }}
            >
              {uploading ? 'Subiendo Logo...' : 'Subir Logo del Sistema'}
            </Button>
          )}

          {uploadResult && (
            <Alert severity={uploadResult.simulated ? "warning" : "success"} sx={{ mb: 2 }}>
              <Typography variant="body2">
                <strong>{uploadResult.simulated ? '⚠️ Logo subido (modo simulado)!' : '✅ Logo subido exitosamente!'}</strong><br />
                <strong>File ID:</strong> {uploadResult.fileId}<br />
                <strong>Nombre:</strong> {testImage?.name}<br />
                <strong>Tamaño:</strong> {(testImage?.size / 1024 / 1024).toFixed(2)} MB<br />
                <strong>Tipo:</strong> {testImage?.type}<br />
                {uploadResult.simulated && (
                  <span style={{ color: 'orange' }}>⚠️ Modo simulado (API no disponible)</span>
                )}
                {uploadResult.simulated && <br />}
                <strong>URL:</strong> <a href={uploadResult.url} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit' }}>
                  Ver logo
                </a>
              </Typography>
              
              {/* Mostrar preview del logo */}
              {uploadResult.url && (
                <Box sx={{ mt: 2, textAlign: 'center' }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Preview del Logo:
                  </Typography>
                  <Box 
                    component="img"
                    src={uploadResult.url}
                    alt="Logo del sistema"
                    sx={{ 
                      maxWidth: '200px', 
                      maxHeight: '100px', 
                      objectFit: 'contain',
                      border: '1px solid #ddd',
                      borderRadius: 1,
                      p: 1,
                      bgcolor: 'white'
                    }}
                  />
                </Box>
              )}
            </Alert>
          )}

          {uploadError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              <Typography variant="body2">
                <strong>❌ Error al subir el logo:</strong><br />
                {uploadError}
              </Typography>
            </Alert>
          )}

          {/* Información sobre el logo */}
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>💡 Información sobre el logo:</strong><br />
              • El logo se almacenará en ControlFile de forma segura<br />
              • Se recomienda usar imágenes PNG o JPG de alta calidad<br />
              • Tamaño recomendado: máximo 5MB<br />
              • El logo aparecerá en el header de la aplicación<br />
              • Puedes cambiar el logo en cualquier momento
            </Typography>
          </Alert>

          {/* Información de Troubleshooting */}
          {uploadError && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'error.50', borderRadius: 1 }}>
              <Typography variant="subtitle2" color="error" gutterBottom>
                Soluciones posibles:
              </Typography>
              <Typography variant="body2" component="div">
                <ul>
                  <li>Verifica tu conexión a internet</li>
                  <li>Confirma que la URL de ControlFile esté correcta</li>
                  <li>Verifica que tu token de Firebase sea válido</li>
                  <li>Intenta con una imagen más pequeña (máximo 5MB recomendado)</li>
                  <li>Revisa la consola del navegador para más detalles</li>
                </ul>
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Test Upload */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <UploadIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6">Prueba de Subida a ControlFile</Typography>
          </Box>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Prueba la funcionalidad de subida de imágenes a ControlFile. Esta imagen se guardará en tu cuenta de ControlFile.
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Button
              variant="outlined"
              component="label"
              startIcon={<UploadIcon />}
              disabled={uploading}
            >
              Seleccionar Imagen
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={handleFileSelect}
              />
            </Button>

            {testImage && (
              <Typography variant="body2" color="text.secondary">
                {testImage.name} ({(testImage.size / 1024 / 1024).toFixed(2)} MB)
              </Typography>
            )}

            {testImage && (
              <IconButton onClick={clearTest} color="error" size="small">
                <DeleteIcon />
              </IconButton>
            )}
          </Box>

          {testImage && (
            <Button
              variant="contained"
              onClick={() => handleUploadTest(false)}
              disabled={uploading}
              startIcon={uploading ? <CircularProgress size={16} /> : <CloudIcon />}
              sx={{ mb: 2 }}
            >
              {uploading ? 'Subiendo...' : 'Probar Subida'}
            </Button>
          )}

          {uploadResult && (
            <Alert severity={uploadResult.simulated ? "warning" : "success"} sx={{ mb: 2 }}>
              <Typography variant="body2">
                <strong>{uploadResult.simulated ? '⚠️ Subida simulada exitosa!' : '✅ Subida exitosa!'}</strong><br />
                File ID: {uploadResult.fileId}<br />
                {uploadResult.simulated && (
                  <span style={{ color: 'orange' }}>⚠️ Modo simulado (API no disponible)</span>
                )}
                {uploadResult.simulated && <br />}
                URL: <a href={uploadResult.url} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit' }}>
                  Ver imagen
                </a>
              </Typography>
            </Alert>
          )}

          {uploadError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              <Typography variant="body2">
                <strong>❌ Error en la subida:</strong><br />
                {uploadError}
              </Typography>
            </Alert>
          )}

          {/* Información de Troubleshooting */}
          {uploadError && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'error.50', borderRadius: 1 }}>
              <Typography variant="subtitle2" color="error" gutterBottom>
                Soluciones posibles:
              </Typography>
              <Typography variant="body2" component="div">
                <ul>
                  <li>Verifica tu conexión a internet</li>
                  <li>Confirma que la URL de ControlFile esté correcta</li>
                  <li>Verifica que tu token de Firebase sea válido</li>
                  <li>Intenta con una imagen más pequeña</li>
                  <li>Revisa la consola del navegador para más detalles</li>
                </ul>
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

             {/* Pruebas de API */}
       <Card sx={{ mb: 3 }}>
         <CardContent>
           <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
             <ApiIcon sx={{ mr: 1, color: 'primary.main' }} />
             <Typography variant="h6">Pruebas de API Backend</Typography>
           </Box>
           
           <Alert severity="info" sx={{ mb: 2 }}>
             <Typography variant="body2">
               Prueba los endpoints del backend que implementamos. Estos tests verifican la funcionalidad de autenticación y subida de archivos.
             </Typography>
           </Alert>

           <Accordion defaultExpanded>
             <AccordionSummary
               expandIcon={<ExpandMoreIcon />}
               aria-controls="profile-test-content"
               id="profile-test-header"
             >
               <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                 <PersonIcon sx={{ mr: 1, color: 'primary.main' }} />
                 <Typography>GET /api/user/profile</Typography>
                 <Box sx={{ ml: 'auto' }}>
                   {apiTests.profile.loading && <CircularProgress size={16} />}
                   {apiTests.profile.result && <CheckCircleIcon color="success" />}
                   {apiTests.profile.error && <ErrorIcon color="error" />}
                 </Box>
               </Box>
             </AccordionSummary>
             <AccordionDetails>
               <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                 Prueba el endpoint que obtiene el perfil del usuario autenticado desde Firestore.
               </Typography>
               
               <Button
                 variant="contained"
                 onClick={() => {
                   setApiTests(prev => ({ ...prev, profile: { loading: true, result: null, error: null } }));
                   controlFileService.testProfile()
                     .then(result => {
                       setApiTests(prev => ({ ...prev, profile: { loading: false, result, error: null } }));
                       console.log('✅ Perfil de usuario probado:', result);
                     })
                     .catch(error => {
                       setApiTests(prev => ({ ...prev, profile: { loading: false, result: null, error } }));
                       console.error('❌ Error en prueba de perfil:', error);
                     });
                 }}
                 disabled={apiTests.profile.loading}
                 startIcon={apiTests.profile.loading ? <CircularProgress size={20} /> : <PlayArrowIcon />}
                 sx={{ mb: 2 }}
               >
                 {apiTests.profile.loading ? 'Probando...' : 'Probar Endpoint'}
               </Button>
               
               {apiTests.profile.result && (
                 <Alert severity="success" sx={{ mb: 2 }}>
                   <Typography variant="body2">
                     <strong>✅ Prueba Exitosa!</strong><br />
                     <strong>Status:</strong> 200 OK<br />
                     <strong>Usuario:</strong> {apiTests.profile.result.user?.displayName || 'N/A'}<br />
                     <strong>Email:</strong> {apiTests.profile.result.user?.email || 'N/A'}<br />
                     <strong>Rol:</strong> {apiTests.profile.result.user?.role || 'N/A'}
                   </Typography>
                 </Alert>
               )}
               
               {apiTests.profile.error && (
                 <Alert severity="error" sx={{ mb: 2 }}>
                   <Typography variant="body2">
                     <strong>❌ Error en la prueba:</strong><br />
                     {apiTests.profile.error.message}
                   </Typography>
                 </Alert>
               )}
             </AccordionDetails>
           </Accordion>

           <Accordion>
             <AccordionSummary
               expandIcon={<ExpandMoreIcon />}
               aria-controls="presign-test-content"
               id="presign-test-header"
             >
               <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                 <UploadIcon sx={{ mr: 1, color: 'primary.main' }} />
                 <Typography>POST /api/uploads/presign</Typography>
                 <Box sx={{ ml: 'auto' }}>
                   {apiTests.presign.loading && <CircularProgress size={16} />}
                   {apiTests.presign.result && <CheckCircleIcon color="success" />}
                   {apiTests.presign.error && <ErrorIcon color="error" />}
                 </Box>
               </Box>
             </AccordionSummary>
             <AccordionDetails>
               <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                 Prueba el endpoint que crea una sesión de subida (presign) para archivos.
               </Typography>
               
               <Button
                 variant="contained"
                 onClick={() => {
                   setApiTests(prev => ({ ...prev, presign: { loading: true, result: null, error: null } }));
                   controlFileService.testPresign()
                     .then(result => {
                       setApiTests(prev => ({ ...prev, presign: { loading: false, result, error: null } }));
                       console.log('✅ Pre-firma de subida probada:', result);
                     })
                     .catch(error => {
                       setApiTests(prev => ({ ...prev, presign: { loading: false, result: null, error } }));
                       console.error('❌ Error en prueba de pre-firma:', error);
                     });
                 }}
                 disabled={apiTests.presign.loading}
                 startIcon={apiTests.presign.loading ? <CircularProgress size={20} /> : <PlayArrowIcon />}
                 sx={{ mb: 2 }}
               >
                 {apiTests.presign.loading ? 'Probando...' : 'Probar Endpoint'}
               </Button>
               
               {apiTests.presign.result && (
                 <Alert severity="success" sx={{ mb: 2 }}>
                   <Typography variant="body2">
                     <strong>✅ Prueba Exitosa!</strong><br />
                     <strong>Status:</strong> 200 OK<br />
                     <strong>Upload ID:</strong> {apiTests.presign.result.uploadId}<br />
                     <strong>Expira:</strong> {new Date(apiTests.presign.result.expiresAt).toLocaleString()}
                   </Typography>
                 </Alert>
               )}
               
               {apiTests.presign.error && (
                 <Alert severity="error" sx={{ mb: 2 }}>
                   <Typography variant="body2">
                     <strong>❌ Error en la prueba:</strong><br />
                     {apiTests.presign.error.message}
                   </Typography>
                 </Alert>
               )}
             </AccordionDetails>
           </Accordion>

           <Accordion>
             <AccordionSummary
               expandIcon={<ExpandMoreIcon />}
               aria-controls="complete-test-content"
               id="complete-test-header"
             >
               <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                 <CloudIcon sx={{ mr: 1, color: 'primary.main' }} />
                 <Typography>POST /api/uploads/complete/:uploadId</Typography>
                 <Box sx={{ ml: 'auto' }}>
                   {apiTests.complete.loading && <CircularProgress size={16} />}
                   {apiTests.complete.result && <CheckCircleIcon color="success" />}
                   {apiTests.complete.error && <ErrorIcon color="error" />}
                 </Box>
               </Box>
             </AccordionSummary>
             <AccordionDetails>
               <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                 Prueba el endpoint que completa la subida de archivos (proxy-upload). Este test ejecuta primero presign y luego complete.
               </Typography>
               
               <Button
                 variant="contained"
                 onClick={() => {
                   setApiTests(prev => ({ ...prev, complete: { loading: true, result: null, error: null } }));
                   controlFileService.testCompleteUpload()
                     .then(result => {
                       setApiTests(prev => ({ ...prev, complete: { loading: false, result, error: null } }));
                       console.log('✅ Subida completa probada:', result);
                     })
                     .catch(error => {
                       setApiTests(prev => ({ ...prev, complete: { loading: false, result: null, error } }));
                       console.error('❌ Error en prueba de subida completa:', error);
                     });
                 }}
                 disabled={apiTests.complete.loading}
                 startIcon={apiTests.complete.loading ? <CircularProgress size={20} /> : <PlayArrowIcon />}
                 sx={{ mb: 2 }}
               >
                 {apiTests.complete.loading ? 'Probando...' : 'Probar Endpoint'}
               </Button>
               
               {apiTests.complete.result && (
                 <Alert severity="success" sx={{ mb: 2 }}>
                   <Typography variant="body2">
                     <strong>✅ Prueba Exitosa!</strong><br />
                     <strong>Presign Status:</strong> 200 OK<br />
                     <strong>Complete Status:</strong> 200 OK<br />
                     <strong>Upload ID:</strong> {apiTests.complete.result.presign?.uploadId}<br />
                     <strong>Archivo:</strong> {apiTests.complete.result.complete?.fileName}
                   </Typography>
                 </Alert>
               )}
               
               {apiTests.complete.error && (
                 <Alert severity="error" sx={{ mb: 2 }}>
                   <Typography variant="body2">
                     <strong>❌ Error en la prueba:</strong><br />
                     {apiTests.complete.error.message}
                   </Typography>
                 </Alert>
               )}
             </AccordionDetails>
           </Accordion>

           {/* Información de Comandos curl */}
           <Accordion>
             <AccordionSummary
               expandIcon={<ExpandMoreIcon />}
               aria-controls="curl-commands-content"
               id="curl-commands-header"
             >
               <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                 <CodeIcon sx={{ mr: 1, color: 'primary.main' }} />
                 <Typography>Comandos curl para Pruebas</Typography>
               </Box>
             </AccordionSummary>
             <AccordionDetails>
               <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                 Puedes probar estos endpoints directamente desde la terminal usando curl:
               </Typography>
               
                               <Box sx={{ bgcolor: 'grey.100', p: 2, borderRadius: 1, mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Probar perfil de usuario:
                  </Typography>
                  <Typography variant="body2" component="pre" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
{`curl -i ${diagnosticInfo?.baseURL || 'http://localhost:4000'}/api/user/profile \\
  -H "Authorization: Bearer {TU_ID_TOKEN}"`}
                  </Typography>
                </Box>
                
                <Box sx={{ bgcolor: 'grey.100', p: 2, borderRadius: 1, mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Crear sesión de subida:
                  </Typography>
                  <Typography variant="body2" component="pre" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
{`curl -i ${diagnosticInfo?.baseURL || 'http://localhost:4000'}/api/uploads/presign \\
  -H "Authorization: Bearer {TU_ID_TOKEN}" \\
  -H "Content-Type: application/json" \\
  -d '{"fileName":"test.jpg","fileSize":12345,"mimeType":"image/jpeg"}'`}
                  </Typography>
                </Box>
                
                <Box sx={{ bgcolor: 'grey.100', p: 2, borderRadius: 1 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Completar subida:
                  </Typography>
                  <Typography variant="body2" component="pre" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
{`curl -i ${diagnosticInfo?.baseURL || 'http://localhost:4000'}/api/uploads/complete/{UPLOAD_ID} \\
  -H "Authorization: Bearer {TU_ID_TOKEN}" \\
  -H "Content-Type: application/json" \\
  -d '{}'`}
                  </Typography>
                </Box>
             </AccordionDetails>
           </Accordion>
         </CardContent>
       </Card>

      <Grid container spacing={3}>
        {/* Control de Empresas */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <BusinessIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">Control de Empresas</Typography>
              </Box>
              
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <InfoIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Propiedad Exclusiva"
                    secondary="Cada empresa tiene un propietario único que la creó"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <SecurityIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Visibilidad Limitada"
                    secondary="Solo puedes ver las empresas que has creado"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <GroupIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Colaboración entre Usuarios"
                    secondary="Puedes compartir empresas con otros usuarios según permisos"
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Control de Auditorías */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AssessmentIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">Control de Auditorías</Typography>
              </Box>
              
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <InfoIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Auditorías Propias"
                    secondary="Solo puedes ver las auditorías que has realizado"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <ShareIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Compartir Auditorías"
                    secondary="Puedes compartir auditorías específicas con otros usuarios"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <GroupIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Auditorías de Otros Usuarios"
                    secondary="Puedes ver auditorías compartidas por otros usuarios"
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Colaboración entre Usuarios */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <GroupIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">Colaboración entre Usuarios</Typography>
              </Box>
              <Typography variant="body1" paragraph>
                El sistema permite colaboración entre usuarios para compartir empresas y auditorías según permisos.
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <ShareIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Compartir Empresas"
                    secondary="Puedes compartir empresas con otros usuarios según permisos"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <AssessmentIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Compartir Auditorías"
                    secondary="Puedes compartir auditorías con otros usuarios"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <BusinessIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Acceso Completo"
                    secondary="Los usuarios con permisos pueden gestionar los recursos compartidos"
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Funcionalidades del Perfil */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <PersonIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">Funcionalidades del Perfil</Typography>
              </Box>
              
              <Typography variant="body1" paragraph>
                En tu perfil puedes gestionar todos los aspectos de tu cuenta:
              </Typography>
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                <Chip label="Ver Mis Empresas" color="primary" />
                <Chip label="Ver Mis Auditorías" color="primary" />
                <Chip label="Gestionar Usuarios" color="primary" />
                <Chip label="Auditorías Compartidas" color="primary" />
                <Chip label="Compartir Auditorías" color="primary" />
                <Chip label="Configurar Permisos" color="primary" />
              </Box>
              
              <Alert severity="success">
                <Typography variant="body2">
                  <strong>Acceso:</strong> Ve a "Mi Perfil" en el menú principal para acceder a todas estas funcionalidades.
                </Typography>
              </Alert>
            </CardContent>
          </Card>
        </Grid>

        {/* Beneficios del Sistema */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Beneficios del Sistema
              </Typography>
              
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <SecurityIcon color="success" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Seguridad"
                    secondary="Cada usuario solo ve sus propios datos, garantizando la privacidad"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <ShareIcon color="success" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Colaboración"
                    secondary="Sistema flexible para compartir recursos específicos o establecer sociedades"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <GroupIcon color="success" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Trabajo en Equipo"
                    secondary="Los usuarios pueden trabajar juntos en las mismas empresas y auditorías"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <InfoIcon color="success" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Control Granular"
                    secondary="Puedes decidir exactamente qué compartir y con quién"
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default InfoSistema;