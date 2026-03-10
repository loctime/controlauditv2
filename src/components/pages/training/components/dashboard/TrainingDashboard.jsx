import React, { useState } from 'react';
import { Grid } from '@mui/material';
import ComplianceKpiCards from './ComplianceKpiCards';
import OperationalKpiCards from './OperationalKpiCards';
import AlertsPanel from './AlertsPanel';
import QuickActionsBar from './QuickActionsBar';
import UserGuideDialog from './UserGuideDialog';

export default function TrainingDashboard({ compliance, operational, alerts, onNavigate }) {
  const [openGuide, setOpenGuide] = useState(false);

  return (
    <>
      <Grid container spacing={2}>
        <Grid item xs={12}><QuickActionsBar onNavigate={onNavigate} onOpenGuide={() => setOpenGuide(true)} /></Grid>
        <Grid item xs={12} md={6}><ComplianceKpiCards compliance={compliance} /></Grid>
        <Grid item xs={12} md={6}><OperationalKpiCards operational={operational} /></Grid>
        <Grid item xs={12}><AlertsPanel alerts={alerts} /></Grid>
      </Grid>
      <UserGuideDialog open={openGuide} onClose={() => setOpenGuide(false)} />
    </>
  );
}

