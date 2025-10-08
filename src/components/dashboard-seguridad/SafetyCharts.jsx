import React from 'react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function SafetyCharts({ data }) {
  // Data for incidents by type - usar datos reales si están disponibles
  const incidentData = data.chartData?.incidentsByType?.length > 0 
    ? data.chartData.incidentsByType.map(item => ({
        name: item.type,
        value: item.count,
        color: item.type.toLowerCase().includes('accidente') ? "#ef4444" : "#f59e0b"
      }))
    : [
        { name: "Accidentes", value: data.totalAccidents, color: "#ef4444" },
        { name: "Incidentes", value: data.totalIncidents, color: "#f59e0b" },
      ];

  // Data for training and inspections
  const complianceData = [
    {
      name: "Capacitaciones",
      Realizadas: data.trainingsDone,
      Planificadas: data.trainingsPlanned,
    },
    {
      name: "Inspecciones",
      Realizadas: data.inspectionsDone,
      Planificadas: data.inspectionsPlanned,
    },
  ];

  // Data for compliance metrics
  const compliancePercentages = [
    { name: "Legal", value: data.legalCompliance },
    { name: "EPP", value: data.eppDeliveryRate },
    { name: "Contratistas", value: data.contractorCompliance },
  ];

  // Gauge data for severity index
  const severityGaugeData = [
    {
      name: "Índice",
      value: data.severityIndex,
      color: data.severityIndex <= 50 ? "#22c55e" : data.severityIndex <= 100 ? "#f59e0b" : "#ef4444",
    },
    { name: "Restante", value: Math.max(0, 200 - data.severityIndex), color: "#e5e7eb" },
  ];

  return (
    <section style={{ marginTop: '2rem' }}>
      <h2 style={{
        fontSize: '1.25rem',
        fontWeight: '600',
        color: '#111827',
        marginBottom: '1.5rem'
      }}>
        Análisis Gráfico
      </h2>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: '1.5rem'
      }}>
        {/* Incidents Pie Chart */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          padding: '1.5rem'
        }}>
          <h3 style={{
            fontSize: '1rem',
            fontWeight: '600',
            marginBottom: '1rem',
            color: '#111827'
          }}>
            Distribución de Eventos
          </h3>
          <div>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={incidentData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {incidentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Compliance Bar Chart */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          padding: '1.5rem'
        }}>
          <h3 style={{
            fontSize: '1rem',
            fontWeight: '600',
            marginBottom: '1rem',
            color: '#111827'
          }}>
            Capacitaciones e Inspecciones
          </h3>
          <div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={complianceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fill: "#6b7280" }} />
                <YAxis tick={{ fill: "#6b7280" }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Realizadas" fill="#22c55e" radius={[8, 8, 0, 0]} />
                <Bar dataKey="Planificadas" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Compliance Percentages */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          padding: '1.5rem'
        }}>
          <h3 style={{
            fontSize: '1rem',
            fontWeight: '600',
            marginBottom: '1rem',
            color: '#111827'
          }}>
            Porcentajes de Cumplimiento
          </h3>
          <div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={compliancePercentages} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" domain={[0, 100]} tick={{ fill: "#6b7280" }} />
                <YAxis dataKey="name" type="category" tick={{ fill: "#6b7280" }} />
                <Tooltip />
                <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                  {compliancePercentages.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.value >= 95 ? "#22c55e" : entry.value >= 85 ? "#f59e0b" : "#ef4444"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Severity Index Gauge */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          padding: '1.5rem'
        }}>
          <h3 style={{
            fontSize: '1rem',
            fontWeight: '600',
            marginBottom: '1rem',
            color: '#111827'
          }}>
            Índice de Gravedad
          </h3>
          <div>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={severityGaugeData}
                  cx="50%"
                  cy="50%"
                  startAngle={180}
                  endAngle={0}
                  innerRadius={80}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {severityGaugeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
              <p style={{
                fontSize: '1.875rem',
                fontWeight: 'bold',
                color: '#111827',
                margin: '0 0 0.25rem 0'
              }}>
                {data.severityIndex.toFixed(1)}
              </p>
              <p style={{
                fontSize: '0.875rem',
                color: '#6b7280',
                margin: 0
              }}>
                Por millón de HH trabajadas
              </p>
            </div>
          </div>
        </div>

        {/* Compliance Trend Chart */}
        {data.chartData?.complianceTrend?.length > 0 && (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            padding: '1.5rem'
          }}>
            <h3 style={{
              fontSize: '1rem',
              fontWeight: '600',
              marginBottom: '1rem',
              color: '#111827'
            }}>
              Tendencia de Cumplimiento
            </h3>
            <div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.chartData.complianceTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" tick={{ fill: "#6b7280" }} />
                  <YAxis domain={[0, 100]} tick={{ fill: "#6b7280" }} />
                  <Tooltip 
                    formatter={(value) => [`${value}%`, 'Cumplimiento']}
                    labelStyle={{ color: '#111827' }}
                  />
                  <Bar 
                    dataKey="compliance" 
                    radius={[8, 8, 0, 0]}
                    fill="#22c55e"
                  >
                    {data.chartData.complianceTrend.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.compliance >= 95 ? "#22c55e" : entry.compliance >= 85 ? "#f59e0b" : "#ef4444"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Accidents by Month Chart */}
        {data.chartData?.accidentsByMonth?.length > 0 && (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            padding: '1.5rem'
          }}>
            <h3 style={{
              fontSize: '1rem',
              fontWeight: '600',
              marginBottom: '1rem',
              color: '#111827'
            }}>
              Accidentes por Mes
            </h3>
            <div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.chartData.accidentsByMonth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" tick={{ fill: "#6b7280" }} />
                  <YAxis tick={{ fill: "#6b7280" }} />
                  <Tooltip />
                  <Bar 
                    dataKey="accidents" 
                    radius={[8, 8, 0, 0]}
                    fill="#ef4444"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}