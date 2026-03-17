import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Paper,
  Typography,
} from '@mui/material';
import { formatDateAR } from '@/utils/dateUtils';
import { trainingCertificateService } from '../../../../../services/training';

export default function PeopleCertificatesTab({ ownerId, selectedEmployee }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [certificates, setCertificates] = useState([]);

  const load = useCallback(async () => {
    if (!ownerId || !selectedEmployee?.id) {
      setCertificates([]);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const list = await trainingCertificateService.listByEmployee(ownerId, selectedEmployee.id);
      setCertificates(Array.isArray(list) ? list : []);
    } catch (err) {
      setError(err.message || 'No se pudieron cargar los certificados.');
      setCertificates([]);
    } finally {
      setLoading(false);
    }
  }, [ownerId, selectedEmployee?.id]);

  useEffect(() => {
    load();
  }, [load]);

  if (!selectedEmployee) {
    return (
      <Typography color="text.secondary">
        Seleccione un empleado para ver sus certificados.
      </Typography>
    );
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (certificates.length === 0) {
    return (
      <Alert severity="info">
        No hay certificados registrados para este empleado.
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {certificates.length} certificado(s) encontrado(s).
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {certificates.map((cert) => (
          <Card key={cert.id} variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                Tipo / Sesión
              </Typography>
              <Typography variant="body2" sx={{ mb: 0.5 }}>
                {cert.trainingTypeName || cert.trainingTypeId || '—'}
              </Typography>
              {cert.issuedAt != null && (
                <Typography variant="caption" color="text.secondary" display="block">
                  Emitido: {formatDateAR(cert.issuedAt)}
                </Typography>
              )}
              {cert.expiresAt != null && (
                <Typography variant="caption" color="text.secondary" display="block">
                  Vence: {formatDateAR(cert.expiresAt)}
                </Typography>
              )}
              {cert.fileReference && (
                <Button
                  size="small"
                  variant="outlined"
                  sx={{ mt: 1 }}
                  onClick={() => window.open(cert.fileReference, '_blank', 'noopener,noreferrer')}
                >
                  Ver certificado
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </Box>
    </Box>
  );
}
