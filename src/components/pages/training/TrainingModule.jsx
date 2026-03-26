import React from 'react';
import { Alert, Container } from '@mui/material';
import { useAuth } from '@/components/context/AuthContext';
import MatrixScreen from './screens/MatrixScreen';

export default function TrainingModule() {
  const { userProfile } = useAuth();
  const ownerId = userProfile?.ownerId;

  if (!ownerId) {
    return (
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Alert severity="warning">
          No hay contexto de empresa disponible para el módulo de capacitaciones.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ pt: 1, pb: 3 }}>
      <MatrixScreen />
    </Container>
  );
}



