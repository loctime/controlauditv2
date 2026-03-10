import React from 'react';
import { Paper, Stack, Tab, Tabs } from '@mui/material';
import CatalogScreenAdapter from './CatalogScreenAdapter';
import RequirementMatrixScreenAdapter from './RequirementMatrixScreenAdapter';
import AnnualPlansScreenAdapter from './AnnualPlansScreenAdapter';

const CONFIG_SECTIONS = [
  { id: 'catalog', label: 'Catalogo de capacitacion' },
  { id: 'matrix', label: 'Matriz de requerimientos' },
  { id: 'plans', label: 'Planes anuales' }
];

export default function ConfigurationHub({ activeSection, onSectionChange }) {
  const currentIndex = Math.max(0, CONFIG_SECTIONS.findIndex((section) => section.id === activeSection));

  return (
    <Stack spacing={2}>
      <Paper>
        <Tabs
          value={currentIndex}
          onChange={(_, index) => onSectionChange(CONFIG_SECTIONS[index].id)}
          variant="scrollable"
          scrollButtons="auto"
        >
          {CONFIG_SECTIONS.map((section) => (
            <Tab key={section.id} label={section.label} />
          ))}
        </Tabs>
      </Paper>

      {activeSection === 'catalog' && <CatalogScreenAdapter />}
      {activeSection === 'matrix' && <RequirementMatrixScreenAdapter />}
      {activeSection === 'plans' && <AnnualPlansScreenAdapter />}
    </Stack>
  );
}

