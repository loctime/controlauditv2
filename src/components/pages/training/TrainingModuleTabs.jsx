import React from 'react';
import { Paper, Tab, Tabs } from '@mui/material';

export default function TrainingModuleTabs({ tabs = [], activeTab, onChangeTab }) {
  const currentIndex = tabs.findIndex((tab) => tab.id === activeTab);

  return (
    <Paper sx={{ mb: 3 }}>
      <Tabs
        value={currentIndex === -1 ? 0 : currentIndex}
        onChange={(_, index) => onChangeTab(tabs[index].id)}
        variant="scrollable"
        scrollButtons="auto"
      >
        {tabs.map((tab) => (
          <Tab key={tab.id} label={tab.label} />
        ))}
      </Tabs>
    </Paper>
  );
}
