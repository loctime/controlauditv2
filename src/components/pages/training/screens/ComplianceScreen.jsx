import logger from '@/utils/logger';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  CircularProgress,
  Grid,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import { useAuth } from '@/components/context/AuthContext';
import {
  auditEvidenceService,
  trainingComplianceService,
  trainingRiskComplianceService,
  trainingRoleRequirementService
} from '../../../../services/training';
import TrainingComplianceDashboard from '../components/compliance/TrainingComplianceDashboard';
import TrainingMatrixView from '../components/compliance/TrainingMatrixView';
import RoleComplianceView from '../components/compliance/RoleComplianceView';
import RiskComplianceView from '../components/compliance/RiskComplianceView';
import AuditExportPanel from '../components/compliance/AuditExportPanel';

export default function ComplianceScreen() {
  const { userProfile, userEmpresas = [], userSucursales = [] } = useAuth();
  const ownerId = userProfile?.ownerId;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    companyId: '',
    branchId: '',
    page: 1,
    pageSize: 50
  });

  const [matrix, setMatrix] = useState({ rows: [], totalCells: 0, totalEmployees: 0, totalTrainingTypes: 0 });
  const [missingByRole, setMissingByRole] = useState([]);
  const [roleSuggestions, setRoleSuggestions] = useState([]);
  const [riskData, setRiskData] = useState({ totals: {}, rows: [] });

  const load = async () => {
    if (!ownerId) return;
    setLoading(true);
    setError('');

    try {
      const companyId = filters.companyId || null;
      const branchId = filters.branchId || null;

      const matrixData = await trainingComplianceService.buildMatrix(ownerId, {
        companyId,
        branchId,
        page: Number(filters.page || 1),
        pageSize: Number(filters.pageSize || 50),
        persist: false
      });

      const [missing, suggestions, risk] = await Promise.all([
        trainingRoleRequirementService.computeMissingByRole(ownerId, { companyId, branchId }),
        trainingRoleRequirementService.suggestSessionsForMissing(ownerId, { companyId, branchId }),
        trainingRiskComplianceService.computeComplianceByRisk(ownerId, { companyId, branchId })
      ]);

      setMatrix(matrixData);
      setMissingByRole(missing);
      setRoleSuggestions(suggestions);
      setRiskData(risk);
    } catch (err) {
      logger.error('[ComplianceScreen] load error', err);
      setError(err.message || 'No se pudo cargar la vista de cumplimiento.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [ownerId, filters.companyId, filters.branchId, filters.page, filters.pageSize]);

  if (!ownerId) {
    return <Alert severity="warning">No hay contexto de owner disponible para cumplimiento de capacitación.</Alert>;
  }

  const branchOptions = userSucursales.filter((branch) => !filters.companyId || branch.empresaId === filters.companyId);

  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ xs: 'stretch', md: 'center' }}>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>Compliance, Role, Risk & Audit</Typography>
          <TextField
            select
            label="Empresa"
            value={filters.companyId}
            onChange={(e) => setFilters((prev) => ({ ...prev, companyId: e.target.value, branchId: '', page: 1 }))}
            sx={{ minWidth: 220 }}
          >
            <MenuItem value="">Todas</MenuItem>
            {userEmpresas.map((company) => <MenuItem key={company.id} value={company.id}>{company.nombre || company.id}</MenuItem>)}
          </TextField>
          <TextField
            select
            label="Sucursal"
            value={filters.branchId}
            onChange={(e) => setFilters((prev) => ({ ...prev, branchId: e.target.value, page: 1 }))}
            sx={{ minWidth: 220 }}
          >
            <MenuItem value="">Todas</MenuItem>
            {branchOptions.map((branch) => <MenuItem key={branch.id} value={branch.id}>{branch.nombre || branch.id}</MenuItem>)}
          </TextField>
          <TextField
            type="number"
            label="Pagina"
            value={filters.page}
            onChange={(e) => setFilters((prev) => ({ ...prev, page: Number(e.target.value || 1) }))}
            sx={{ width: 110 }}
          />
          <TextField
            type="number"
            label="Page size"
            value={filters.pageSize}
            onChange={(e) => setFilters((prev) => ({ ...prev, pageSize: Number(e.target.value || 50), page: 1 }))}
            sx={{ width: 130 }}
          />
        </Stack>
      </Paper>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TrainingComplianceDashboard rows={matrix.rows} />
          </Grid>

          <Grid item xs={12}>
            <TrainingMatrixView rows={matrix.rows} />
          </Grid>

          <Grid item xs={12} md={6}>
            <RoleComplianceView missing={missingByRole} suggestions={roleSuggestions} />
          </Grid>

          <Grid item xs={12} md={6}>
            <RiskComplianceView data={riskData} />
          </Grid>

          <Grid item xs={12}>
            <AuditExportPanel
              companies={userEmpresas}
              branches={userSucursales}
              onExportPdf={(payload) => auditEvidenceService.exportPdf(ownerId, payload)}
              onExportZip={(payload) => auditEvidenceService.exportZip(ownerId, payload)}
            />
          </Grid>
        </Grid>
      )}
    </Box>
  );
}

