import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  Paper,
  Grid,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Clear as ClearIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import SignaturePad from 'react-signature-canvas';
import { useAuth } from '../../context/AuthContext';
import { logUserAction } from '../usuarios/LogsOperarios';
import EstadisticasFirmas from './EstadisticasFirmas';
import ValidadorCertificado from '../../common/ValidadorCertificado';
import Swal from 'sweetalert2';

const ConfiguracionFirma = () => {
  const { userProfile, updateUserProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [signatureData, setSignatureData] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  const sigPadRef = useRef(null);

  // Verificar si el usuario ya tiene una firma guardada
  useEffect(() => {
    if (userProfile?.firmaDigital) {
      setHasSignature(true);
      setSignatureData(userProfile.firmaDigital);
    }
  }, [userProfile?.firmaDigital]);

  const handleClear = () => {
    if (sigPadRef.current) {
      sigPadRef.current.clear();
    }
  };

  const handleSave = async () => {
    if (!sigPadRef.current || sigPadRef.current.isEmpty()) {
      Swal.fire('Error', 'Por favor dibuja tu firma antes de guardar', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const signatureDataUrl = sigPadRef.current.getTrimmedCanvas().toDataURL('image/png');
      
      await updateUserProfile({
        firmaDigital: signatureDataUrl,
        firmaActualizada: new Date().toISOString()
      });

      // Log de la acción
      await logUserAction('firma_creada', {
        detalles: 'Usuario configuró su firma digital',
        tipoFirma: 'digital',
        tamanioFirma: signatureDataUrl.length
      });

      setSignatureData(signatureDataUrl);
      setHasSignature(true);
      setIsEditing(false);
      
      Swal.fire('Éxito', 'Firma guardada correctamente', 'success');
    } catch (error) {
      console.error('Error al guardar firma:', error);
      Swal.fire('Error', 'Error al guardar la firma', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    const result = await Swal.fire({
      title: '¿Eliminar firma?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      setIsSaving(true);
      try {
        await updateUserProfile({
          firmaDigital: null,
          firmaActualizada: null
        });

        // Log de la acción
        await logUserAction('firma_eliminada', {
          detalles: 'Usuario eliminó su firma digital'
        });

        setSignatureData('');
        setHasSignature(false);
        Swal.fire('Éxito', 'Firma eliminada correctamente', 'success');
      } catch (error) {
        console.error('Error al eliminar firma:', error);
        Swal.fire('Error', 'Error al eliminar la firma', 'error');
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleDownload = () => {
    if (!signatureData) return;
    
    const link = document.createElement('a');
    link.download = `firma_${userProfile?.displayName || 'usuario'}.png`;
    link.href = signatureData;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
      setHasSignature(true);
    };
    reader.readAsDataURL(file);
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Configuración de Firma Digital
      </Typography>
      
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Configura tu firma digital para firmar documentos de forma rápida y segura.
      </Typography>

      <Grid container spacing={3}>
        {/* Vista previa de la firma actual */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                Firma Actual
              </Typography>
              
              {hasSignature ? (
                <Box>
                  <Paper 
                    elevation={2} 
                    sx={{ 
                      p: 2, 
                      mb: 2, 
                      border: '2px dashed #ccc',
                      backgroundColor: '#fafafa',
                      minHeight: 150,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <img 
                      src={signatureData} 
                      alt="Firma del usuario" 
                      style={{ 
                        maxWidth: '100%', 
                        maxHeight: '120px',
                        objectFit: 'contain'
                      }} 
                    />
                  </Paper>
                  
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<EditIcon />}
                      onClick={() => setIsEditing(true)}
                    >
                      Editar
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<DownloadIcon />}
                      onClick={handleDownload}
                    >
                      Descargar
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      startIcon={<DeleteIcon />}
                      onClick={handleDelete}
                    >
                      Eliminar
                    </Button>
                  </Box>
                  
                  {userProfile?.firmaActualizada && (
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      Última actualización: {new Date(userProfile.firmaActualizada).toLocaleDateString()}
                    </Typography>
                  )}
                </Box>
              ) : (
                <Alert severity="info">
                  No tienes una firma configurada. Crea tu primera firma digital.
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Editor de firma */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                {isEditing ? 'Editar Firma' : 'Crear Nueva Firma'}
              </Typography>
              
              {isEditing || !hasSignature ? (
                <Box>
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
                      startIcon={<ClearIcon />}
                      onClick={handleClear}
                    >
                      Limpiar
                    </Button>
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<SaveIcon />}
                      onClick={handleSave}
                      disabled={isSaving}
                    >
                      {isSaving ? 'Guardando...' : 'Guardar Firma'}
                    </Button>
                    {isEditing && (
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => setIsEditing(false)}
                      >
                        Cancelar
                      </Button>
                    )}
                  </Box>
                </Box>
              ) : (
                <Box>
                  <Button
                    variant="contained"
                    startIcon={<EditIcon />}
                    onClick={() => setIsEditing(true)}
                    fullWidth
                  >
                    Editar Firma
                  </Button>
                </Box>
              )}

              {/* Subir archivo de firma */}
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  O sube una imagen de tu firma:
                </Typography>
                <input
                  accept="image/*"
                  style={{ display: 'none' }}
                  id="firma-file-upload"
                  type="file"
                  onChange={handleFileUpload}
                />
                <label htmlFor="firma-file-upload">
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={<UploadIcon />}
                    size="small"
                  >
                    Subir Imagen
                  </Button>
                </label>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Estadísticas de firmas */}
      {hasSignature && (
        <Box sx={{ mt: 3 }}>
          <EstadisticasFirmas />
        </Box>
      )}

      {/* Validador de certificados */}
      <Box sx={{ mt: 3 }}>
        <ValidadorCertificado />
      </Box>

      {/* Información adicional */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom>
            Información sobre Firmas Digitales
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • Tu firma se almacena de forma segura en tu perfil
            <br />
            • Puedes usar esta firma para firmar documentos con un solo clic
            <br />
            • La firma se puede editar o eliminar en cualquier momento
            <br />
            • Se recomienda usar una firma clara y legible
            <br />
            • Cada firma incluye un certificado digital único para validación
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ConfiguracionFirma; 