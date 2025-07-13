import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  Chip,
  Paper,
  Grid,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Verified as VerifiedIcon,
  Warning as WarningIcon,
  ContentCopy as CopyIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import useFirmaDigital from '../../hooks/useFirmaDigital';
import Swal from 'sweetalert2';

const ValidadorCertificado = () => {
  const { validarCertificado } = useFirmaDigital();
  const [formData, setFormData] = useState({
    documentoId: '',
    usuarioId: '',
    certificado: '',
    contenidoDocumento: ''
  });
  const [resultado, setResultado] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const handleValidar = async () => {
    if (!formData.documentoId || !formData.usuarioId || !formData.certificado) {
      Swal.fire('Error', 'Por favor completa todos los campos obligatorios', 'error');
      return;
    }

    setLoading(true);
    try {
      const resultado = await validarCertificado(
        formData.documentoId,
        formData.usuarioId,
        formData.certificado,
        formData.contenidoDocumento
      );
      setResultado(resultado);
    } catch (error) {
      Swal.fire('Error', 'Error al validar el certificado', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLimpiar = () => {
    setFormData({
      documentoId: '',
      usuarioId: '',
      certificado: '',
      contenidoDocumento: ''
    });
    setResultado(null);
  };

  const copiarAlPortapapeles = (texto) => {
    navigator.clipboard.writeText(texto).then(() => {
      Swal.fire('Copiado', 'Texto copiado al portapapeles', 'success');
    });
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Validador de Certificados Digitales
      </Typography>
      
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Valida la autenticidad de un certificado digital de firmas ingresando los datos correspondientes.
      </Typography>

      <Grid container spacing={3}>
        {/* Formulario de validación */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                Datos del Certificado
              </Typography>
              
              <TextField
                fullWidth
                label="ID del Documento *"
                value={formData.documentoId}
                onChange={handleInputChange('documentoId')}
                margin="normal"
                placeholder="ej: doc_123456"
              />
              
              <TextField
                fullWidth
                label="ID del Usuario *"
                value={formData.usuarioId}
                onChange={handleInputChange('usuarioId')}
                margin="normal"
                placeholder="ej: user_abc123"
              />
              
              <TextField
                fullWidth
                label="Certificado Digital *"
                value={formData.certificado}
                onChange={handleInputChange('certificado')}
                margin="normal"
                multiline
                rows={3}
                placeholder="Pega aquí el certificado digital..."
              />
              
              <TextField
                fullWidth
                label="Contenido del Documento (opcional)"
                value={formData.contenidoDocumento}
                onChange={handleInputChange('contenidoDocumento')}
                margin="normal"
                multiline
                rows={4}
                placeholder="Contenido original del documento para validación adicional..."
              />
              
              <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                <Button
                  variant="contained"
                  onClick={handleValidar}
                  disabled={loading}
                  startIcon={<VerifiedIcon />}
                >
                  {loading ? 'Validando...' : 'Validar Certificado'}
                </Button>
                
                <Button
                  variant="outlined"
                  onClick={handleLimpiar}
                  startIcon={<RefreshIcon />}
                >
                  Limpiar
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Resultado de validación */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                Resultado de Validación
              </Typography>
              
              {!resultado ? (
                <Alert severity="info">
                  Ingresa los datos del certificado y haz clic en "Validar" para ver el resultado.
                </Alert>
              ) : (
                <Box>
                  {/* Estado de validación */}
                  <Alert 
                    severity={resultado.valido ? 'success' : 'error'}
                    icon={resultado.valido ? <VerifiedIcon /> : <WarningIcon />}
                    sx={{ mb: 2 }}
                  >
                    <Typography variant="subtitle2">
                      {resultado.valido ? 'Certificado Válido' : 'Certificado Inválido'}
                    </Typography>
                    <Typography variant="body2">
                      {resultado.valido 
                        ? 'El certificado digital es auténtico y no ha sido alterado.'
                        : 'El certificado digital no es válido o ha sido modificado.'
                      }
                    </Typography>
                  </Alert>

                  {/* Detalles del certificado */}
                  <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Detalles del Certificado
                    </Typography>
                    
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Usuario: {resultado.usuarioNombre || 'N/A'}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Fecha de Firma: {resultado.fechaFirma ? new Date(resultado.fechaFirma).toLocaleString() : 'N/A'}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Estado:
                      </Typography>
                      <Chip
                        label={resultado.valido ? 'Válido' : 'Inválido'}
                        color={resultado.valido ? 'success' : 'error'}
                        size="small"
                      />
                    </Box>
                  </Paper>

                  {/* Comparación de certificados */}
                  <Paper elevation={1} sx={{ p: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Comparación de Certificados
                    </Typography>
                    
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Certificado Original:
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <TextField
                          fullWidth
                          size="small"
                          value={resultado.certificadoOriginal || ''}
                          InputProps={{ readOnly: true }}
                          variant="outlined"
                        />
                        <Tooltip title="Copiar">
                          <IconButton 
                            size="small"
                            onClick={() => copiarAlPortapapeles(resultado.certificadoOriginal)}
                          >
                            <CopyIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                    
                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Certificado Calculado:
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <TextField
                          fullWidth
                          size="small"
                          value={resultado.certificadoCalculado || ''}
                          InputProps={{ readOnly: true }}
                          variant="outlined"
                        />
                        <Tooltip title="Copiar">
                          <IconButton 
                            size="small"
                            onClick={() => copiarAlPortapapeles(resultado.certificadoCalculado)}
                          >
                            <CopyIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                  </Paper>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Información adicional */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom>
            ¿Qué es un Certificado Digital?
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Un certificado digital es un hash único generado a partir de los datos de la firma y el contenido del documento. 
            Este certificado garantiza que:
            <br />
            • La firma no ha sido alterada desde su creación
            <br />
            • El documento mantiene su integridad
            <br />
            • La firma pertenece al usuario especificado
            <br />
            • La fecha y hora de firma son auténticas
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ValidadorCertificado; 