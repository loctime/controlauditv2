import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Box, CircularProgress } from '@mui/material';
import { useAuth } from '@/components/context/AuthContext';
import { empleadoService } from '../../../../services/empleadoService';
import {
  employeeTrainingRecordService,
  trainingCatalogService,
  trainingCertificateService
} from '../../../../services/training';
import PeopleTrainingHistoryView from '../components/people/PeopleTrainingHistoryView';

export default function PeopleScreen() {
  const { userProfile, userSucursales = [], userEmpresas = [] } = useAuth();
  const ownerId = userProfile?.ownerId;

  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [error, setError] = useState('');
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [records, setRecords] = useState([]);

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
            trainingName: training?.name || record.trainingTypeId,
            companyName: company?.nombre || null,
            branchName: branch?.nombre || record.branchId || null,
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
      {loadingRecords && <Alert severity="info" sx={{ mb: 2 }}>Cargando historial del empleado...</Alert>}
      <PeopleTrainingHistoryView
        employees={employees}
        loadingEmployees={loadingEmployees}
        selectedEmployee={selectedEmployee}
        onSelectEmployee={setSelectedEmployee}
        records={records}
        complianceSummary={complianceSummary}
      />
    </Box>
  );
}

