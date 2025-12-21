import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Button,
  TextField,
  Paper,
  Stack,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Divider,
  Chip
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import InfoIcon from '@mui/icons-material/Info';
import { uploadToControlFile } from '../../../services/controlFileUpload';
import { useAuth } from '../../../components/context/AuthContext';
import { auth } from '../../../firebaseConfig';

const TestControlFile = () => {
  const { user, loading: authLoading, isLogged } = useAuth();
  const [file, setFile] = useState(null);
  const [auditId, setAuditId] = useState('test-audit-' + Date.now());
  const [companyId, setCompanyId] = useState('test-company-123');
  const [seccionId, setSeccionId] = useState('0');
  const [preguntaId, setPreguntaId] = useState('0');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState({
    authCurrentUser: null,
    userFromContext: null,
    isLogged: false,
    authLoading: true,
    tokenObtained: false,
    tokenError: null,
    lastError: null
  });

  // Actualizar información de debug visible en UI
  useEffect(() => {
    const updateDebugInfo = async () => {
      const authCurrentUser = auth.currentUser;
      let tokenObtained = false;
      let tokenError = null;

      if (user) {
        try {
          const token = await user.getIdToken();
          tokenObtained = !!token;
        } catch (err) {
          tokenError = err.message || 'Error al obtener token';
        }
      }

      setDebugInfo({
        authCurrentUser: authCurrentUser ? {
          uid: authCurrentUser.uid,
          email: authCurrentUser.email
        } : null,
        userFromContext: user ? {
          uid: user.uid,
          email: user.email
        } : null,
        isLogged,
        authLoading,
        tokenObtained,
        tokenError,
        lastError: error
      });
    };

    updateDebugInfo();
  }, [user, isLogged, authLoading, error]);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Por favor selecciona un archivo');
      return;
    }

    if (!auditId || !companyId) {
      setError('auditId y companyId son requeridos');
      return;
    }

    // Validar que el usuario esté autenticado desde el contexto
    if (!user || !isLogged || authLoading) {
      const authStatus = [];
      if (!user) authStatus.push('user es null');
      if (!isLogged) authStatus.push('isLogged es false');
      if (authLoading) authStatus.push('authLoading es true');
      
      const errorMsg = `Usuario no autenticado o autenticación en proceso. Estado: ${authStatus.join(', ')}. auth.currentUser: ${auth.currentUser ? 'existe' : 'null'}`;
      setError(errorMsg);
      setDebugInfo(prev => ({ ...prev, lastError: errorMsg }));
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Obtener el token desde el usuario del contexto
      let idToken;
      try {
        idToken = await user.getIdToken();
      } catch (tokenErr) {
        const tokenErrorMsg = `Error al obtener token: ${tokenErr.message || tokenErr}`;
        setError(tokenErrorMsg);
        setDebugInfo(prev => ({ ...prev, tokenError: tokenErrorMsg, lastError: tokenErrorMsg }));
        setLoading(false);
        return;
      }
      
      if (!idToken) {
        const noTokenMsg = 'No se pudo obtener el token de autenticación (token es null/undefined)';
        setError(noTokenMsg);
        setDebugInfo(prev => ({ ...prev, tokenError: noTokenMsg, lastError: noTokenMsg }));
        setLoading(false);
        return;
      }

      const uploadResult = await uploadToControlFile({
        file,
        idToken,
        auditId,
        companyId,
        seccionId: seccionId || undefined,
        preguntaId: preguntaId || undefined,
        fecha: new Date()
      });

      setResult(uploadResult);
      setDebugInfo(prev => ({ ...prev, tokenObtained: true, tokenError: null, lastError: null }));
      console.log('✅ Archivo subido exitosamente:', uploadResult);
    } catch (err) {
      const errorMsg = err.message || 'Error desconocido al subir archivo';
      console.error('❌ Error al subir archivo:', err);
      setError(errorMsg);
      setDebugInfo(prev => ({ ...prev, lastError: errorMsg }));
    } finally {
      setLoading(false);
    }
  };

  const isImage = file?.type?.startsWith('image/');

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
          🧪 Prueba de Subida a ControlFile
        </Typography>

        <Stack spacing={3}>
          {/* Panel de Debug - Visible en UI para producción */}
          <Card variant="outlined" sx={{ bgcolor: 'info.light', border: '2px solid', borderColor: 'info.main' }}>
            <CardContent>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                <InfoIcon color="info" />
                <Typography variant="h6">
                  🔍 DEBUG - Estado de Autenticación (Visible en UI)
                </Typography>
              </Stack>
              <Stack spacing={1.5}>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    <strong>auth.currentUser:</strong>
                  </Typography>
                  {debugInfo.authCurrentUser ? (
                    <Chip 
                      label={`✅ Existe (${debugInfo.authCurrentUser.email})`} 
                      color="success" 
                      size="small" 
                    />
                  ) : (
                    <Chip 
                      label="❌ NULL (problema de timing)" 
                      color="error" 
                      size="small" 
                    />
                  )}
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    <strong>user desde AuthContext:</strong>
                  </Typography>
                  {debugInfo.userFromContext ? (
                    <Chip 
                      label={`✅ Existe (${debugInfo.userFromContext.email})`} 
                      color="success" 
                      size="small" 
                    />
                  ) : (
                    <Chip 
                      label="❌ NULL" 
                      color="error" 
                      size="small" 
                    />
                  )}
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    <strong>isLogged:</strong>
                  </Typography>
                  <Chip 
                    label={debugInfo.isLogged ? '✅ true' : '❌ false'} 
                    color={debugInfo.isLogged ? 'success' : 'error'} 
                    size="small" 
                  />
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    <strong>authLoading:</strong>
                  </Typography>
                  <Chip 
                    label={debugInfo.authLoading ? '⏳ true' : '✅ false'} 
                    color={debugInfo.authLoading ? 'warning' : 'success'} 
                    size="small" 
                  />
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    <strong>Token obtenido:</strong>
                  </Typography>
                  <Chip 
                    label={debugInfo.tokenObtained ? '✅ Sí' : '❌ No'} 
                    color={debugInfo.tokenObtained ? 'success' : 'error'} 
                    size="small" 
                  />
                </Box>
                {debugInfo.tokenError && (
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      <strong>Error al obtener token:</strong>
                    </Typography>
                    <Alert severity="error" sx={{ mt: 0.5 }}>
                      <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                        {debugInfo.tokenError}
                      </Typography>
                    </Alert>
                  </Box>
                )}
                {debugInfo.lastError && (
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      <strong>Último error:</strong>
                    </Typography>
                    <Alert severity="error" sx={{ mt: 0.5 }}>
                      <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                        {debugInfo.lastError}
                      </Typography>
                    </Alert>
                  </Box>
                )}
              </Stack>
            </CardContent>
          </Card>

          {/* Campos de configuración */}
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Configuración
              </Typography>
              <Stack spacing={2}>
                <TextField
                  label="Audit ID"
                  value={auditId}
                  onChange={(e) => setAuditId(e.target.value)}
                  fullWidth
                  required
                  helperText="ID de la auditoría"
                />
                <TextField
                  label="Company ID"
                  value={companyId}
                  onChange={(e) => setCompanyId(e.target.value)}
                  fullWidth
                  required
                  helperText="ID de la empresa"
                />
                <TextField
                  label="Sección ID (opcional)"
                  value={seccionId}
                  onChange={(e) => setSeccionId(e.target.value)}
                  fullWidth
                  helperText="ID de la sección"
                />
                <TextField
                  label="Pregunta ID (opcional)"
                  value={preguntaId}
                  onChange={(e) => setPreguntaId(e.target.value)}
                  fullWidth
                  helperText="ID de la pregunta"
                />
              </Stack>
            </CardContent>
          </Card>

          {/* Selección de archivo */}
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Archivo
              </Typography>
              <Stack spacing={2}>
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<CloudUploadIcon />}
                  fullWidth
                  sx={{ py: 2 }}
                >
                  {file ? file.name : 'Seleccionar archivo'}
                  <input
                    type="file"
                    hidden
                    onChange={handleFileChange}
                    accept="image/*,application/pdf,.xlsx,.xls"
                  />
                </Button>
                {file && (
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Nombre:</strong> {file.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Tamaño:</strong> {(file.size / 1024).toFixed(2)} KB
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Tipo:</strong> {file.type || 'No especificado'}
                    </Typography>
                  </Box>
                )}
              </Stack>
            </CardContent>
          </Card>

          {/* Botón de subida */}
          <Button
            variant="contained"
            size="large"
            onClick={handleUpload}
            disabled={!file || loading || !auditId || !companyId || !user || !isLogged || authLoading}
            startIcon={loading ? <CircularProgress size={20} /> : <CloudUploadIcon />}
            fullWidth
            sx={{ py: 1.5 }}
          >
            {loading ? 'Subiendo...' : 'Subir a ControlFile'}
          </Button>

          {/* Vista previa de imagen */}
          {file && isImage && (
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Vista Previa
                </Typography>
                <Box
                  component="img"
                  src={URL.createObjectURL(file)}
                  alt="Vista previa"
                  sx={{
                    maxWidth: '100%',
                    maxHeight: '400px',
                    borderRadius: 2,
                    border: '1px solid #ddd'
                  }}
                />
              </CardContent>
            </Card>
          )}

          {/* Resultado exitoso */}
          {result && (
            <Alert
              icon={<CheckCircleIcon />}
              severity="success"
              sx={{ mt: 2 }}
            >
              <Typography variant="h6" gutterBottom>
                ✅ Archivo subido exitosamente
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Stack spacing={1}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    <strong>File ID:</strong>
                  </Typography>
                  <Typography variant="body1" sx={{ wordBreak: 'break-all' }}>
                    {result.fileId}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    <strong>File URL:</strong>
                  </Typography>
                  <Typography
                    variant="body1"
                    component="a"
                    href={result.fileURL}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                      wordBreak: 'break-all',
                      color: 'primary.main',
                      textDecoration: 'none',
                      '&:hover': {
                        textDecoration: 'underline'
                      }
                    }}
                  >
                    {result.fileURL}
                  </Typography>
                </Box>
                {isImage && result.fileURL && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      <strong>Imagen subida:</strong>
                    </Typography>
                    <Box
                      component="img"
                      src={result.fileURL}
                      alt="Imagen subida"
                      sx={{
                        maxWidth: '100%',
                        maxHeight: '400px',
                        borderRadius: 2,
                        border: '1px solid #ddd',
                        mt: 1
                      }}
                    />
                  </Box>
                )}
              </Stack>
            </Alert>
          )}

          {/* Error */}
          {error && (
            <Alert
              icon={<ErrorIcon />}
              severity="error"
              sx={{ mt: 2 }}
            >
              <Typography variant="h6" gutterBottom>
                ❌ Error
              </Typography>
              <Typography variant="body1">
                {error}
              </Typography>
            </Alert>
          )}
        </Stack>
      </Paper>
    </Container>
  );
};

export default TestControlFile;

