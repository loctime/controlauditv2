import React, { useState, useEffect } from "react";
import DashboardHeader from "../../dashboard-seguridad/DashboardHeader";
import KpiCard from "../../dashboard-seguridad/KpiCard";
import SafetyCharts from "../../dashboard-seguridad/SafetyCharts";
import { safetyDashboardService } from "../../../services/safetyDashboardService";
import { useAuth } from "../../context/AuthContext";
import {
  Warning as AlertTriangle,
  Error as AlertCircle,
  CalendarToday as Calendar,
  Assignment as ClipboardCheck,
  Description as FileCheck,
  Construction as HardHat,
  People as Users,
  TrendingUp,
  ShowChart as Activity,
} from "@mui/icons-material";

export default function DashboardSeguridad() {
  const { userProfile } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Obtener ID de empresa del perfil del usuario
        const companyId = userProfile?.empresaId || userProfile?.uid || 'company-001';
        const currentPeriod = new Date().toISOString().slice(0, 7); // YYYY-MM
        
        const dashboardData = await safetyDashboardService.getDashboardData(companyId, currentPeriod);
        setData(dashboardData);
      } catch (error) {
        console.error('Error al cargar datos del dashboard:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [userProfile]);

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-white">
        <DashboardHeader />
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando datos...</p>
          </div>
        </div>
      </div>
    );
  }

  const getStatusColor = (value, thresholds) => {
    if (value >= thresholds.good) return "success";
    if (value >= thresholds.warning) return "warning";
    return "critical";
  };

  const trainingPercentage = (data.trainingsDone / data.trainingsPlanned) * 100;
  const inspectionPercentage = (data.inspectionsDone / data.inspectionsPlanned) * 100;
  const deviationClosureRate = (data.deviationsClosed / data.deviationsFound) * 100;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'white' }}>
      <DashboardHeader companyName={data.companyName} period={data.period} />

      <main style={{
        maxWidth: '1600px',
        margin: '0 auto',
        padding: '2rem 1.5rem'
      }}>
        {/* Critical Metrics */}
        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            color: '#111827',
            marginBottom: '1rem',
            margin: '0 0 1rem 0'
          }}>
            Indicadores Críticos
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1rem'
          }}>
            <KpiCard
              title="Accidentes"
              value={data.totalAccidents}
              icon={<AlertTriangle style={{ width: '20px', height: '20px' }} />}
              status={data.totalAccidents === 0 ? "success" : data.totalAccidents <= 2 ? "warning" : "critical"}
              subtitle="Total del período"
            />
            <KpiCard
              title="Incidentes"
              value={data.totalIncidents}
              icon={<AlertCircle style={{ width: '20px', height: '20px' }} />}
              status={data.totalIncidents <= 5 ? "success" : data.totalIncidents <= 10 ? "warning" : "critical"}
              subtitle="Reportados"
            />
            <KpiCard
              title="Días sin Accidentes"
              value={data.daysWithoutAccidents}
              icon={<Calendar style={{ width: '20px', height: '20px' }} />}
              status={
                data.daysWithoutAccidents >= 90 ? "success" : data.daysWithoutAccidents >= 30 ? "warning" : "critical"
              }
              subtitle="Consecutivos"
            />
            <KpiCard
              title="Índice de Frecuencia"
              value={data.frequencyIndex.toFixed(2)}
              icon={<Activity style={{ width: '20px', height: '20px' }} />}
              status={data.frequencyIndex <= 5 ? "success" : data.frequencyIndex <= 10 ? "warning" : "critical"}
              subtitle="Por millón de HH"
            />
          </div>
          </div>
        </section>

        {/* Training and Inspections */}
        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            color: '#111827',
            marginBottom: '1rem',
            margin: '0 0 1rem 0'
          }}>
            Capacitaciones e Inspecciones
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1rem'
          }}>
            <KpiCard
              title="Capacitaciones"
              value={`${data.trainingsDone}/${data.trainingsPlanned}`}
              icon={<ClipboardCheck style={{ width: '20px', height: '20px' }} />}
              status={getStatusColor(trainingPercentage, { good: 90, warning: 70 })}
              subtitle={`${trainingPercentage.toFixed(0)}% completado`}
              progress={trainingPercentage}
            />
            <KpiCard
              title="Inspecciones"
              value={`${data.inspectionsDone}/${data.inspectionsPlanned}`}
              icon={<FileCheck style={{ width: '20px', height: '20px' }} />}
              status={getStatusColor(inspectionPercentage, { good: 90, warning: 70 })}
              subtitle={`${inspectionPercentage.toFixed(0)}% completado`}
              progress={inspectionPercentage}
            />
            <KpiCard
              title="Desvíos Cerrados"
              value={`${data.deviationsClosed}/${data.deviationsFound}`}
              icon={<TrendingUp style={{ width: '20px', height: '20px' }} />}
              status={getStatusColor(deviationClosureRate, { good: 80, warning: 60 })}
              subtitle={`${deviationClosureRate.toFixed(0)}% cerrados`}
              progress={deviationClosureRate}
            />
          </div>
          </div>
        </section>

        {/* Compliance Metrics */}
        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            color: '#111827',
            marginBottom: '1rem',
            margin: '0 0 1rem 0'
          }}>
            Cumplimiento
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1rem'
          }}>
            <KpiCard
              title="Cumplimiento Legal"
              value={`${data.legalCompliance}%`}
              icon={<FileCheck style={{ width: '20px', height: '20px' }} />}
              status={getStatusColor(data.legalCompliance, { good: 95, warning: 85 })}
              subtitle="Normativa vigente"
              progress={data.legalCompliance}
            />
            <KpiCard
              title="Entrega de EPP"
              value={`${data.eppDeliveryRate}%`}
              icon={<HardHat style={{ width: '20px', height: '20px' }} />}
              status={getStatusColor(data.eppDeliveryRate, { good: 95, warning: 85 })}
              subtitle="Equipos entregados"
              progress={data.eppDeliveryRate}
            />
            <KpiCard
              title="Contratistas"
              value={`${data.contractorCompliance}%`}
              icon={<Users style={{ width: '20px', height: '20px' }} />}
              status={getStatusColor(data.contractorCompliance, { good: 90, warning: 75 })}
              subtitle="Cumplimiento SST"
              progress={data.contractorCompliance}
            />
          </div>
          </div>
        </section>

        {/* Charts Section */}
        <SafetyCharts data={data} />

        {/* Alerts Section */}
        {data.alerts && data.alerts.length > 0 && (
          <section style={{ marginTop: '2rem' }}>
            <h2 style={{
              fontSize: '1.25rem',
              fontWeight: '600',
              color: '#111827',
              marginBottom: '1rem',
              margin: '0 0 1rem 0'
            }}>
              Alertas y Notificaciones
            </h2>
            <div style={{
              backgroundColor: '#fffbeb',
              border: '1px solid #fed7aa',
              borderRadius: '8px',
              padding: '1rem'
            }}>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {data.alerts.map((alert, index) => (
                  <li key={index} style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.5rem',
                    fontSize: '0.875rem',
                    color: '#92400e',
                    marginBottom: '0.5rem'
                  }}>
                    <AlertTriangle style={{ width: '16px', height: '16px', marginTop: '2px', flexShrink: 0 }} />
                    <span>{alert}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

