import React from 'react';
import { Box, Paper, Tab, Tabs } from '@mui/material';
import CatalogScreenAdapter from './CatalogScreenAdapter';
import RequirementMatrixScreenAdapter from './RequirementMatrixScreenAdapter';
import AnnualPlansScreenAdapter from './AnnualPlansScreenAdapter';

const SECTIONS = [
  { id: 'catalog', label: 'Training Catalog' },
  { id: 'matrix', label: 'Requirement Matrix' },
  { id: 'plans', label: 'Annual Plans' }
];

export default function ConfigurationHub({ activeSection, onSectionChange }) {
  const idx = Math.max(0, SECTIONS.findIndex((section) => section.id === activeSection));

  return (
    <Box>
      <Paper sx={{ mb: 2 }}>
        <Tabs value={idx} onChange={(_, index) => onSectionChange(SECTIONS[index].id)}>
          {SECTIONS.map((section) => (
            <Tab key={section.id} label={section.label} />
          ))}
        </Tabs>
      </Paper>

      {activeSection === 'catalog' && <CatalogScreenAdapter />}
      {activeSection === 'matrix' && <RequirementMatrixScreenAdapter />}
      {activeSection === 'plans' && <AnnualPlansScreenAdapter />}
    </Box>
  );
}
