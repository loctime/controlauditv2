import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Box, CircularProgress, Paper, Tab, Tabs, Typography } from '@mui/material';
import { useAuth } from '@/components/context/AuthContext';
import { empleadoService } from '../../../../services/empleadoService';
import {
  employeeTrainingRecordService,
  trainingCatalogService,
  trainingCertificateService
} from '../../../../services/training';
import EmployeeAutocomplete from '../components/people/EmployeeAutocomplete';
import PeopleSummaryTab from '../components/people/PeopleSummaryTab';
import PeopleHistoryTab from '../components/people/PeopleHistoryTab';
import PeopleCertificatesTab from '../components/people/PeopleCertificatesTab';

const PEOPLE_SUB_TABS = [
  { id: 'summary', label: 'Resumen' },
  { id: 'history', label: 'Historial' },
  { id: 'certificates', label: 'Certificados' }
];

export default function PeopleScreen() {
  const { userProfile, userSucursales = [], userEmpresas = [] } = useAuth();
  const ownerId = userProfile?.ownerId;

  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [error, setError] = useState('');
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [records, setRecords] = useState([]);
  const [peopleSubTab, setPeopleSubTab] = useState('summary');

  const [complianceSummary, setComplianceSummary] = useState({
    compliant: 0,
    expiringSoon: 0,
    expired: 0
  });

  const companyMap = useMemo(
    () => Object.fromEntries(userEmpresas.map((company) => [company.id, company])),
    [userEmpresas]
  );

  const branchMap = useMemo(
    () => Object.fromEntries(userSucursales.map((branch) => [branch.id, branch])),
    [userSucursales]
  );

  const enrichedEmployee = useMemo(() => {
    if (!selectedEmployee) return null;
    const branch = branchMap[selectedEmployee.sucursalId];
    const empresaNombre =
      selectedEmployee.empresaNombre ||
      (branch ? companyMap[branch.empresaId]?.nombre : null) ||
      companyMap[selectedEmployee.empresaId]?.nombre;
    const sucursalNombre =
      selectedEmployee.sucursalNombre || branch?.nombre;
    return {
      ...selectedEmployee,
      empresaNombre: empresaNombre || selectedEmployee.empresaNombre,
      sucursalNombre: sucursalNombre || selectedEmployee.sucursalNombre
    };
  }, [selectedEmployee, companyMap, branchMap]);

  useEffect(() => {
    const loadEmployees = async () => {
      if (!ownerId) return;
      setLoadingEmployees(true);
      setError('');
      try {
        const sucursalIds = userSucursales.map((sucursal) => sucursal.id);
        const list = await empleadoService.getEmpleadosBySucursales(ownerId, sucursalIds);
        setEmployees(list);
      } catch (err) {
        setError(err.message || 'No se pudieron cargar los empleados.');
      } finally {
        setLoadingEmployees(false);
      }
    };

    loadEmployees();
  }, [ownerId, userSucursales]);

  useEffect(() => {
    const loadRecords = async () => {
      if (!ownerId || !selectedEmployee?.id) {
        setRecords([]);
        setComplianceSummary({ compliant: 0, expiringSoon: 0, expired: 0 });
        return;
      }
      setLoadingRecords(true);
      setError('');
      try {
        const [history, catalog, certificates] = await Promise.all([
          employeeTrainingRecordService.listByEmployee(ownerId, selectedEmployee.id),
          trainingCatalogService.listAll(ownerId),
          trainingCertificateService.listByEmployee(ownerId, selectedEmployee.id).catch(() => [])
        ]);

        const catalogMap = Object.fromEntries(catalog.map((item) => [item.id, item]));
        const certificatesById = Object.fromEntries(certificates.map((c) => [c.id, c]));

        const enriched = history.map((record) => {
          const training = catalogMap[record.trainingTypeId];
          const branch = branchMap[record.branchId];
          const company = companyMap[record.companyId] || (branch ? companyMap[branch.empresaId] : null);
          const certificate = record.certificateId ? certificatesById[record.certificateId] : null;

          return {
            ...record,
            trainingName: training?.name || 'Sin dato',
            companyName: company?.nombre || null,
            branchName: branch?.nombre || null,
            certificate
          };
        });

        const compliant = enriched.filter((r) => r.complianceStatus === 'compliant').length;
        const expiringSoon = enriched.filter((r) => r.complianceStatus === 'expiring_soon').length;
        const expired = enriched.filter((r) => r.complianceStatus === 'expired').length;

        setRecords(enriched);
        setComplianceSummary({ compliant, expiringSoon, expired });
      } catch (err) {
        setError(err.message || 'No se pudo cargar el historial del empleado.');
      } finally {
        setLoadingRecords(false);
      }
    };

    loadRecords();
  }, [ownerId, selectedEmployee]);

  if (!ownerId) {
    return <Alert severity="warning">No hay contexto de empresa disponible para historial por persona.</Alert>;
  }

  if (loadingEmployees) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {loadingRecords && peopleSubTab === 'summary' && (
        <Alert severity="info" sx={{ mb: 2 }}>Cargando historial del empleado...</Alert>
      )}

      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" sx={{ mb: 1.5 }}>
          Historial de capacitación por persona
        </Typography>
        <EmployeeAutocomplete
          options={employees}
          loading={loadingEmployees}
          value={selectedEmployee}
          onChange={setSelectedEmployee}
        />
      </Paper>

      {selectedEmployee && (
        <>
          <Tabs
            value={peopleSubTab}
            onChange={(_, v) => setPeopleSubTab(v)}
            sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
          >
            {PEOPLE_SUB_TABS.map((t) => (
              <Tab key={t.id} value={t.id} label={t.label} />
            ))}
          </Tabs>
          <Box sx={{ mt: 1 }}>
            {peopleSubTab === 'summary' && (
              <PeopleSummaryTab
                selectedEmployee={enrichedEmployee}
                records={records}
                complianceSummary={complianceSummary}
              />
            )}
            {peopleSubTab === 'history' && (
              <PeopleHistoryTab ownerId={ownerId} selectedEmployee={enrichedEmployee} />
            )}
            {peopleSubTab === 'certificates' && (
              <PeopleCertificatesTab ownerId={ownerId} selectedEmployee={enrichedEmployee} />
            )}
          </Box>
        </>
      )}

      {!selectedEmployee && (
        <Typography color="text.secondary">
          Seleccione un empleado para ver su resumen, historial de realizaciones y certificados.
        </Typography>
      )}
    </Box>
  );
}
