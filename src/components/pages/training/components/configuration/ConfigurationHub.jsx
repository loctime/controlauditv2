import React, { useCallback, useMemo, useState } from 'react';
import { Box, Paper, Stack, Tab, Tabs } from '@mui/material';
import { useAuth } from '@/components/context/AuthContext';
import CatalogScreenAdapter from './CatalogScreenAdapter';
import AnnualPlansScreenAdapter from './AnnualPlansScreenAdapter';
import PlanFiltersBar from './PlanFiltersBar';

const CONFIG_SECTIONS = [
  { id: 'catalog', label: 'Catalogo de capacitacion' },
  { id: 'plans', label: 'Planes anuales' }
];

const currentYear = new Date().getFullYear();
const DEFAULT_YEARS = Array.from({ length: 8 }, (_, i) => currentYear + 2 - i);

export default function ConfigurationHub({ activeSection, onSectionChange, onNavigateToPlans }) {
  const { userEmpresas = [], userSucursales = [] } = useAuth();
  const currentIndex = Math.max(0, CONFIG_SECTIONS.findIndex((section) => section.id === activeSection));

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCompany, setFilterCompany] = useState('');
  const [filterBranch, setFilterBranch] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const branchesByCompany = useMemo(() => {
    if (!filterCompany) return [];
    return (userSucursales || []).filter((s) => s.empresaId === filterCompany);
  }, [userSucursales, filterCompany]);

  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setFilterCompany('');
    setFilterBranch('');
    setFilterYear('');
    setFilterStatus('');
  }, []);

  const handleFilterCompany = useCallback((v) => {
    setFilterCompany(v);
    setFilterBranch('');
  }, []);

  const filterProps = {
    searchTerm,
    onSearchTerm: setSearchTerm,
    filterCompany,
    onFilterCompany: handleFilterCompany,
    filterBranch,
    onFilterBranch: setFilterBranch,
    filterYear,
    onFilterYear: setFilterYear,
    filterStatus,
    onFilterStatus: setFilterStatus,
    onClearFilters: clearFilters,
    companies: userEmpresas || [],
    branches: userSucursales || [],
    branchesByCompany,
    availableYears: DEFAULT_YEARS
  };

  return (
    <Stack spacing={1}>
      <Paper sx={{ p: 1.5 }}>
        <Stack direction="row" alignItems="center" flexWrap="wrap" spacing={2} sx={{ gap: 1 }}>
          <Tabs
            value={currentIndex}
            onChange={(_, index) => onSectionChange(CONFIG_SECTIONS[index].id)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ minHeight: 42, flexShrink: 0 }}
          >
            {CONFIG_SECTIONS.map((section) => (
              <Tab key={section.id} label={section.label} />
            ))}
          </Tabs>
          {activeSection === 'plans' && (
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <PlanFiltersBar {...filterProps} />
            </Box>
          )}
        </Stack>
      </Paper>

      {activeSection === 'catalog' && (
        <CatalogScreenAdapter onNavigateToPlans={onNavigateToPlans || (() => onSectionChange('plans'))} />
      )}
      {activeSection === 'plans' && (
        <AnnualPlansScreenAdapter
          filterSearchTerm={searchTerm}
          filterCompany={filterCompany}
          filterBranch={filterBranch}
          filterYear={filterYear}
          filterStatus={filterStatus}
        />
      )}
    </Stack>
  );
}
