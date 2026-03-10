import React, { useMemo } from 'react';
import { Alert, Box, Container, Typography } from '@mui/material';
import { useAuth } from '@/components/context/AuthContext';
import TrainingModuleTabs from './TrainingModuleTabs';
import useTrainingTabState from './useTrainingTabState';
import DashboardScreen from './screens/DashboardScreen';
import SessionsScreen from './screens/SessionsScreen';
import CalendarScreen from './screens/CalendarScreen';
import PeopleScreen from './screens/PeopleScreen';
import CertificatesScreen from './screens/CertificatesScreen';
import ConfigurationScreen from './screens/ConfigurationScreen';
import ReportsScreen from './screens/ReportsScreen';

const MODULE_TABS = [
  { id: 'dashboard', label: 'Tablero' },
  { id: 'sessions', label: 'Sesiones' },
  { id: 'calendar', label: 'Calendario' },
  { id: 'people', label: 'Personas' },
  { id: 'certificates', label: 'Certificados' },
  { id: 'configuration', label: 'Configuracion', adminOnly: true },
  { id: 'reports', label: 'Reportes' }
];

export default function TrainingModule() {
  const { userProfile, role } = useAuth();
  const ownerId = userProfile?.ownerId;
  const canViewConfiguration = role === 'admin' || role === 'superdev';

  const visibleTabs = useMemo(
    () => MODULE_TABS.filter((tab) => !tab.adminOnly || canViewConfiguration),
    [canViewConfiguration]
  );

  const { activeTab, activeSection, setTab, setSection } = useTrainingTabState(visibleTabs, canViewConfiguration);

  const renderScreen = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardScreen onNavigate={setTab} />;
      case 'sessions':
        return <SessionsScreen />;
      case 'calendar':
        return <CalendarScreen />;
      case 'people':
        return <PeopleScreen />;
      case 'certificates':
        return <CertificatesScreen />;
      case 'configuration':
        return <ConfigurationScreen activeSection={activeSection} onSectionChange={setSection} />;
      case 'reports':
        return <ReportsScreen />;
      default:
        return <DashboardScreen onNavigate={setTab} />;
    }
  };

  if (!ownerId) {
    return (
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Alert severity="warning">No hay contexto de owner disponible para el modulo de capacitacion.</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          Gestion de Capacitacion
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Ejecucion operativa de capacitaciones, cumplimiento por persona, certificados y reportes.
        </Typography>
      </Box>

      <TrainingModuleTabs tabs={visibleTabs} activeTab={activeTab} onChangeTab={setTab} />
      {renderScreen()}
    </Container>
  );
}


