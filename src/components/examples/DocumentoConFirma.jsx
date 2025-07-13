import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Divider,
  Grid,
  Paper,
  Chip,
  Alert
} from '@mui/material';
import {
  Description as DocumentIcon,
  CheckCircle as SignedIcon,
  Schedule as PendingIcon
} from '@mui/icons-material';
import FirmaDigital from '../common/FirmaDigital';
import useFirmaDigital from '../../hooks/useFirmaDigital';

const DocumentoConFirma = ({ documento }) => {
  const { firmarDocumento, verificarFirma, isFirmando } = useFirmaDigital();
  const [estaFirmado, setEstaFirmado] = useState(false);

  const handleFirmar = async (firmaData) => {
    const resultado = await firmarDocumento(
      documento.id, 
      'auditoria', 
      { 
        empresaId: documento.empresaId,
        auditorId: documento.auditorId 
      }
    );
    
    if (resultado) {
      setEstaFirmado(true);
    }
  };

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DocumentIcon color="primary" />
            <Typography variant="h6">
              {documento.nombre || 'Documento sin título'}
            </Typography>
          </Box>
          
          <Chip
            icon={estaFirmado ? <SignedIcon /> : <PendingIcon />}
            label={estaFirmado ? 'Firmado' : 'Pendiente de firma'}
            color={estaFirmado ? 'success' : 'warning'}
            variant={estaFirmado ? 'filled' : 'outlined'}
          />
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={12} md={8}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              <strong>Empresa:</strong> {documento.empresa?.nombre || 'N/A'}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              <strong>Fecha:</strong> {new Date(documento.fecha?.seconds * 1000).toLocaleDateString()}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              <strong>Auditor:</strong> {documento.auditor?.nombre || 'N/A'}
            </Typography>
            
            {documento.descripcion && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                {documento.descripcion}
              </Typography>
            )}
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {estaFirmado ? (
                <Alert severity="success" sx={{ mb: 1 }}>
                  Documento firmado exitosamente
                </Alert>
              ) : (
                <FirmaDigital
                  onFirmar={handleFirmar}
                  disabled={isFirmando}
                  showPreview={true}
                  size="small"
                >
                  <FirmaDigital.Button
                    variant="contained"
                    size="small"
                    disabled={isFirmando}
                  >
                    {isFirmando ? 'Firmando...' : 'Firmar Documento'}
                  </FirmaDigital.Button>
                </FirmaDigital>
              )}
            </Box>
          </Grid>
        </Grid>

        {estaFirmado && (
          <>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Firmado por: {documento.auditor?.nombre || 'Usuario'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}
              </Typography>
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );
};

// Componente de ejemplo para mostrar múltiples documentos
const ListaDocumentosConFirma = () => {
  const documentosEjemplo = [
    {
      id: '1',
      nombre: 'Auditoría de Seguridad - Q1 2024',
      empresa: { nombre: 'Empresa ABC' },
      fecha: { seconds: Date.now() / 1000 },
      auditor: { nombre: 'Juan Pérez' },
      descripcion: 'Auditoría completa de seguridad informática del primer trimestre.'
    },
    {
      id: '2',
      nombre: 'Reporte de Cumplimiento',
      empresa: { nombre: 'Empresa XYZ' },
      fecha: { seconds: Date.now() / 1000 },
      auditor: { nombre: 'María García' },
      descripcion: 'Evaluación de cumplimiento normativo y procedimientos.'
    }
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Documentos para Firmar
      </Typography>
      
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Ejemplo de cómo se verían los documentos con la funcionalidad de firma digital integrada.
      </Typography>

      {documentosEjemplo.map((documento) => (
        <DocumentoConFirma key={documento.id} documento={documento} />
      ))}
    </Box>
  );
};

export default ListaDocumentosConFirma; 