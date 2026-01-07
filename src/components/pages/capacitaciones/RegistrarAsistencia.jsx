import React from 'react';
import { Container } from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/context/AuthContext';
import RegistrarAsistenciaInline from './components/RegistrarAsistenciaInline';

/**
 * Página dedicada para registrar asistencia
 * Mantiene compatibilidad con la ruta /capacitacion/:id/asistencia
 * Internamente usa RegistrarAsistenciaInline
 */
export default function RegistrarAsistencia() {
  const { capacitacionId } = useParams();
  const navigate = useNavigate();
  const { userProfile } = useAuth();

  if (!userProfile?.uid) {
    return null;
  }

  return (
    <Container maxWidth="md" sx={{ py: 3 }}>
      <RegistrarAsistenciaInline
        capacitacionId={capacitacionId}
        userId={userProfile.uid}
        compact={false}
        onSaved={(registroId) => {
          console.log('[RegistrarAsistencia] Registro guardado:', registroId);
          navigate('/capacitaciones');
        }}
        onCancel={() => navigate('/capacitaciones')}
      />
    </Container>
  );
}

