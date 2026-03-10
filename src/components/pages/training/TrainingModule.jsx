import React, { useMemo, useState } from 'react';
import { Box, Container, Paper, Tab, Tabs, Typography } from '@mui/material';
import DashboardScreen from './screens/DashboardScreen';
import SessionsScreen from './screens/SessionsScreen';
import AnnualPlansScreen from './screens/AnnualPlansScreen';
import CatalogScreen from './screens/CatalogScreen';
import RequirementMatrixScreen from './screens/RequirementMatrixScreen';
import EmployeeHistoryScreen from './screens/EmployeeHistoryScreen';
import CertificatesScreen from './screens/CertificatesScreen';
import ReportsScreen from './screens/ReportsScreen';

const MODULE_TABS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'sessions', label: 'Sessions' },
  { id: 'plans', label: 'Annual Plans' },
  { id: 'catalog', label: 'Training Catalog' },
  { id: 'matrix', label: 'Requirement Matrix' },
  { id: 'history', label: 'Employee Training History' },
  { id: 'certificates', label: 'Certificates' },
  { id: 'reports', label: 'Reports' }
];

export default function TrainingModule() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const tabIndex = useMemo(() => MODULE_TABS.findIndex((tab) => tab.id === activeTab), [activeTab]);

  const renderScreen = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardScreen />;
      case 'sessions':
        return <SessionsScreen />;
      case 'plans':
        return <AnnualPlansScreen />;
      case 'catalog':
        return <CatalogScreen />;
      case 'matrix':
        return <RequirementMatrixScreen />;
      case 'history':
        return <EmployeeHistoryScreen />;
      case 'certificates':
        return <CertificatesScreen />;
      case 'reports':
        return <ReportsScreen />;
      default:
        return <DashboardScreen />;
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          Training Management (EHS)
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Required training, planned training, and executed training are managed in separated entities.
        </Typography>
      </Box>

      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabIndex === -1 ? 0 : tabIndex}
          onChange={(_, index) => setActiveTab(MODULE_TABS[index].id)}
          variant="scrollable"
          scrollButtons="auto"
        >
          {MODULE_TABS.map((tab) => (
            <Tab key={tab.id} label={tab.label} />
          ))}
        </Tabs>
      </Paper>

      {renderScreen()}
    </Container>
  );
}
