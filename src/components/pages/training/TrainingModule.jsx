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
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'sessions', label: 'Sessions' },
  { id: 'calendar', label: 'Calendar' },
  { id: 'people', label: 'People' },
  { id: 'certificates', label: 'Certificates' },
  { id: 'configuration', label: 'Configuration', adminOnly: true },
  { id: 'reports', label: 'Reports' }
];

export default function TrainingModule() {
  const { userProfile, role } = useAuth();
  const ownerId = userProfile?.ownerId;
  const canViewConfiguration = role === 'admin' || role === 'supermax';

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
        <Alert severity="warning">Owner context is not available for training module.</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          Training Management
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Operational training execution, people compliance tracking, certificates and reporting.
        </Typography>
      </Box>

      <TrainingModuleTabs tabs={visibleTabs} activeTab={activeTab} onChangeTab={setTab} />
      {renderScreen()}
    </Container>
  );
}
