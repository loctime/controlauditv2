import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Box, CircularProgress, Grid, Paper, Tab, Tabs, Typography } from '@mui/material';
import { useAuth } from '@/components/context/AuthContext';
import { getUsers } from '../../../../core/services/ownerUserService';
import { empleadoService } from '../../../../services/empleadoService';
import {
  employeeTrainingRecordService,
  trainingCatalogService,
  trainingCertificateService,
  trainingComplianceService,
  trainingSessionService
} from '../../../../services/training';
import EmployeeAutocomplete from '../components/people/EmployeeAutocomplete';
import PeopleSummaryTab from '../components/people/PeopleSummaryTab';
import PeopleHistoryTab from '../components/people/PeopleHistoryTab';
import SessionDetailModal from '../components/sessions/SessionDetailModal';

const PEOPLE_SUB_TABS = [
  { id: 'summary', label: 'Resumen' },
  { id: 'history', label: 'Historial' }
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
  const [viewSession, setViewSession] = useState(null);
  const [loadingSessionId, setLoadingSessionId] = useState(null);

  const [complianceSummary, setComplianceSummary] = useState({
    compliant: 0,
    expiringSoon: 0,
    expired: 0,
    missing: 0
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

  const openSessionModal = useCallback(
    async (sessionId) => {
      if (!ownerId || !sessionId) return;
      setLoadingSessionId(sessionId);
      try {
        const [session, catalogList, usersList, employeesList] = await Promise.all([
          trainingSessionService.getSessionById(ownerId, sessionId),
          trainingCatalogService.listAll(ownerId).catch(() => []),
          getUsers(ownerId).catch(() => []),
          userSucursales?.length
            ? empleadoService.getEmpleadosBySucursales(ownerId, userSucursales.map((s) => s.id)).catch(() => [])
            : Promise.resolve([])
        ]);
        if (!session) {
          setLoadingSessionId(null);
          return;
        }
        const catalogMapById = Object.fromEntries((catalogList || []).map((c) => [c.id, c]));
        const branchMapLocal = Object.fromEntries((userSucursales || []).map((b) => [b.id, b]));
        const companyMapLocal = Object.fromEntries((userEmpresas || []).map((c) => [c.id, c]));
        const instructorMap = {
          ...Object.fromEntries((usersList || []).map((u) => [u.id, `${u.apellido || ''} ${u.nombre || ''}`.trim() || u.email || 'Sin dato'])),
          ...Object.fromEntries((employeesList || []).map((e) => [e.id, `${e.apellido || ''} ${e.nombre || ''}`.trim() || e.email || 'Sin dato']))
        };
        if (userProfile?.uid) {
          const fullName = `${userProfile.apellido || ''} ${userProfile.nombre || ''}`.trim();
          instructorMap[userProfile.uid] = fullName || userProfile.email || 'Sin asignar';
        }
        const enrichedSession = {
          ...session,
          trainingTypeName: catalogMapById[session.trainingTypeId]?.name || 'Sin dato',
          branchName: branchMapLocal[session.branchId]?.nombre || 'Sin dato',
          companyName: companyMapLocal[session.companyId]?.nombre || branchMapLocal[session.branchId]?.empresaNombre || 'Sin dato',
          instructorName: instructorMap[session.instructorId] || 'Sin asignar'
        };
        setViewSession(enrichedSession);
      } finally {
        setLoadingSessionId(null);
      }
    },
    [ownerId, userEmpresas, userSucursales, userProfile]
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
        setComplianceSummary({ compliant: 0, expiringSoon: 0, expired: 0, missing: 0 });
        return;
      }
      setLoadingRecords(true);
      setError('');
      try {
        let history = await employeeTrainingRecordService.listByEmployee(ownerId, selectedEmployee.id);

        // Refrescar estado de cumplimiento desde period results para no mostrar todo como "Faltantes"
        if (history.length > 0) {
          await Promise.all(
            history.map((record) =>
              trainingComplianceService.recomputeEmployeeTrainingRecord(
                ownerId,
                selectedEmployee.id,
                record.trainingTypeId,
                { companyId: record.companyId, branchId: record.branchId }
              )
            )
          );
          history = await employeeTrainingRecordService.listByEmployee(ownerId, selectedEmployee.id);
        }

        const [catalog, certificates] = await Promise.all([
          trainingCatalogService.listAll(ownerId),
          trainingCertificateService.listByEmployee(ownerId, selectedEmployee.id).catch(() => [])
        ]);

        const catalogMap = Object.fromEntries(catalog.map((item) => [item.id, item]));
        const certificatesById = Object.fromEntries(certificates.map((c) => [c.id, c]));

        const enriched = history.map((record) => {
          if (record.complianceStatus && record.complianceStatus !== 'missing' && record.validUntil == null) {
            console.warn('[PeopleScreen] Record without validUntil but complianceStatus !== missing', {
              recordId: record.id,
              employeeId: record.employeeId,
              trainingTypeId: record.trainingTypeId,
              complianceStatus: record.complianceStatus
            });
          }
          const training = catalogMap[record.trainingTypeId];
          const branch = branchMap[record.branchId];
          const company = companyMap[record.companyId] || (branch ? companyMap[branch.empresaId] : null);
          const certificate = record.certificateId ? certificatesById[record.certificateId] : null;

          return {
            ...record,
            trainingName: training?.name || 'Sin dato',
            companyName: company?.nombre || null,
            branchName: branch?.nombre || null,
            certificate,
            sessionId: record.lastSessionId || null
          };
        });

        const compliant = enriched.filter((r) => r.complianceStatus === 'compliant').length;
        const expiringSoon = enriched.filter((r) => r.complianceStatus === 'expiring_soon').length;
        const expired = enriched.filter((r) => r.complianceStatus === 'expired').length;
        const missing = enriched.filter((r) => r.complianceStatus === 'missing').length;

        setRecords(enriched);
        setComplianceSummary({
          compliant: Number(compliant) || 0,
          expiringSoon: Number(expiringSoon) || 0,
          expired: Number(expired) || 0,
          missing: Number(missing) || 0
        });
      } catch (err) {
        setError(err.message || 'No se pudo cargar el historial del empleado.');
      } finally {
        setLoadingRecords(false);
      }
    };

    loadRecords();
  }, [ownerId, selectedEmployee, companyMap, branchMap]);

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
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <EmployeeAutocomplete
              options={employees}
              loading={loadingEmployees}
              value={selectedEmployee}
              onChange={setSelectedEmployee}
            />
          </Grid>
          {selectedEmployee && (
            <Grid item xs={12} md={8}>
              <Tabs
                value={peopleSubTab}
                onChange={(_, v) => setPeopleSubTab(v)}
                sx={{ borderBottom: 1, borderColor: 'divider' }}
              >
                {PEOPLE_SUB_TABS.map((t) => (
                  <Tab key={t.id} value={t.id} label={t.label} />
                ))}
              </Tabs>
            </Grid>
          )}
        </Grid>
      </Paper>

      {selectedEmployee && (
        <Box sx={{ mt: 1 }}>
          {peopleSubTab === 'summary' && (
            <PeopleSummaryTab
              selectedEmployee={enrichedEmployee}
              records={records}
              complianceSummary={complianceSummary}
              onViewSession={openSessionModal}
            />
          )}
          {peopleSubTab === 'history' && (
            <PeopleHistoryTab ownerId={ownerId} selectedEmployee={enrichedEmployee} />
          )}
        </Box>
      )}

      {!selectedEmployee && (
        <Typography color="text.secondary">
          Seleccione un empleado para ver su resumen e historial de realizaciones.
        </Typography>
      )}

      <SessionDetailModal
        open={Boolean(viewSession)}
        onClose={() => setViewSession(null)}
        ownerId={ownerId}
        session={viewSession}
      />
    </Box>
  );
}
