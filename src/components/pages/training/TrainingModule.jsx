import React, { useMemo, useState } from 'react';
import { Alert, Box, Container, Typography } from '@mui/material';
import { useAuth } from '@/components/context/AuthContext';
import TrainingModuleTabs from './TrainingModuleTabs';
import useTrainingTabState from './useTrainingTabState';
import DashboardScreen from './screens/DashboardScreen';
import SessionsScreen from './screens/SessionsScreen';
import PeopleScreen from './screens/PeopleScreen';
import ConfigurationScreen from './screens/ConfigurationScreen';
import ReportsScreen from './screens/ReportsScreen';
import CalendarScreen from './screens/CalendarScreen';

const MODULE_TABS = [
  { id: 'dashboard', label: 'Tablero' },
  { id: 'sessions', label: 'Sesiones' },
  { id: 'people', label: 'Personas' },
  { id: 'reports', label: 'Reportes' },
  { id: 'configuration', label: 'Configuración', adminOnly: true }
];

export default function TrainingModule() {
  const { userProfile, role } = useAuth();
  const ownerId = userProfile?.ownerId;
  const canViewConfiguration = role === 'admin' || role === 'superdev';

  const [showDashboardCalendar, setShowDashboardCalendar] = useState(false);

  const visibleTabs = useMemo(
    () => MODULE_TABS.filter((tab) => !tab.adminOnly || canViewConfiguration),
    [canViewConfiguration]
  );

  const { activeTab, activeSection, setTab, setSection } = useTrainingTabState(visibleTabs, canViewConfiguration);

  const renderScreen = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardScreen
            onNavigate={(target) => {
              if (target === 'calendar') {
                setShowDashboardCalendar(true);
                return;
              }
              setShowDashboardCalendar(false);
              setTab(target);
            }}
          >
            {showDashboardCalendar && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" sx={{ mb: 1.5 }}>
                  Calendario de sesiones
                </Typography>
                <CalendarScreen />
              </Box>
            )}
          </DashboardScreen>
        );
      case 'sessions':
        return <SessionsScreen />;
      case 'people':
        return <PeopleScreen />;
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
        <Alert severity="warning">
          No hay contexto de empresa disponible para el módulo de capacitaciones.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          Gestión de capacitaciones
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Operación diaria de capacitaciones, seguimiento por persona y control de cumplimiento.
        </Typography>
      </Box>

      <TrainingModuleTabs tabs={visibleTabs} activeTab={activeTab} onChangeTab={setTab} />
      {renderScreen()}
    </Container>
  );
}


