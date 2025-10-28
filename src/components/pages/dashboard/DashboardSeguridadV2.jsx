import React, { useState, useEffect } from "react";
import { Container, Grid, Box, Typography, Paper } from "@mui/material";
import { safetyDashboardService } from "../../../services/safetyDashboardService";
import { useAuth } from "../../context/AuthContext";

// Componentes nuevos
import PeriodSelector from "../../dashboard-seguridad/PeriodSelector";
import SucursalSelector from "../../dashboard-seguridad/SucursalSelector";
import GaugeChart from "../../dashboard-seguridad/GaugeChart";
import EmployeeMetrics from "../../dashboard-seguridad/EmployeeMetrics";
import SafetyGoals from "../../dashboard-seguridad/SafetyGoals";
import TrainingMetrics from "../../dashboard-seguridad/TrainingMetrics";
import SafetyCharts from "../../dashboard-seguridad/SafetyCharts";

export default function DashboardSeguridadV2() {
  const { userProfile, userSucursales } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedSucursal, setSelectedSucursal] = useState('todas');

  // Establecer sucursal inicial cuando se cargan las sucursales
  useEffect(() => {
    if (userSucursales && userSucursales.length > 0 && selectedSucursal === 'todas') {
      // Primero intentar usar la sucursal guardada en localStorage
      const savedSucursal = localStorage.getItem('selectedSucursal');
      const savedEmpresa = localStorage.getItem('selectedEmpresa');
      
      if (savedSucursal && userSucursales.find(s => s.id === savedSucursal)) {
        setSelectedSucursal(savedSucursal);
        // Limpiar localStorage después de usar
        localStorage.removeItem('selectedSucursal');
      } else if (savedEmpresa) {
        // Si hay empresa preseleccionada, filtrar sucursales de esa empresa
        const sucursalesEmpresa = userSucursales.filter(s => s.empresaId === savedEmpresa);
        if (sucursalesEmpresa.length > 0) {
          setSelectedSucursal(sucursalesEmpresa[0].id);
        }
        // Limpiar localStorage después de usar
        localStorage.removeItem('selectedEmpresa');
      }
    }
  }, [userSucursales, selectedSucursal]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const companyId = userProfile?.empresaId || userProfile?.uid || 'company-001';
        const currentPeriod = `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}`;
        
        const dashboardData = await safetyDashboardService.getDashboardData(
          companyId, 
          selectedSucursal === 'todas' ? 'todas' : selectedSucursal,
          currentPeriod
        );
        setData(dashboardData);
      } catch (error) {
        console.error('Error al cargar datos del dashboard:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [userProfile, selectedYear, selectedMonth, selectedSucursal]);

  if (loading || !data) {
    return (
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '400px' 
        }}>
          <Box sx={{ textAlign: 'center' }}>
            <Box sx={{
              width: 60,
              height: 60,
              border: '4px solid #e5e7eb',
              borderTop: '4px solid #3b82f6',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              mx: 'auto',
              mb: 2
            }} />
            <Typography variant="h6" color="text.secondary">
              Cargando datos del sistema...
            </Typography>
          </Box>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header del Dashboard */}
      <Paper elevation={2} sx={{
        p: 3,
        mb: 3,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        borderRadius: '16px'
      }}>
        <Typography variant="h4" sx={{
          fontWeight: 'bold',
          textAlign: 'center',
          mb: 1
        }}>
          SISTEMA DE GESTIÓN DE SEGURIDAD Y SALUD EN EL TRABAJO
        </Typography>
        <Typography variant="subtitle1" sx={{
          textAlign: 'center',
          opacity: 0.9
        }}>
          {data.companyName} - {data.period}
        </Typography>
      </Paper>

      {/* Selectores de Período y Sucursal */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <SucursalSelector
            sucursales={userSucursales || []}
            selectedSucursal={selectedSucursal}
            onSucursalChange={setSelectedSucursal}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <PeriodSelector
            selectedYear={selectedYear}
            selectedMonth={selectedMonth}
            onYearChange={setSelectedYear}
            onMonthChange={setSelectedMonth}
          />
        </Grid>
      </Grid>

      {/* Grid Principal */}
      <Grid container spacing={3}>
        {/* Columna Izquierda - Métricas de Ejecución */}
        <Grid item xs={12} lg={3}>
          <Typography variant="h6" sx={{
            fontWeight: 600,
            color: '#111827',
            mb: 2,
            textAlign: 'center'
          }}>
            EJECUCIÓN DEL PROGRAMA
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <GaugeChart
              value={data.legalCompliance}
              max={100}
              title="Actividades SST/año"
              subtitle="Cumplimiento anual"
              size={140}
            />
            
            <GaugeChart
              value={data.legalCompliance}
              max={100}
              title="Actividades SST/mes"
              subtitle="Cumplimiento mensual"
              size={140}
            />
            
            <GaugeChart
              value={data.legalCompliance}
              max={100}
              title="Capacitaciones, entrenamientos/año"
              subtitle="Programa anual"
              size={140}
            />
          </Box>
        </Grid>

        {/* Columna Central - Empleados y Accidentes */}
        <Grid item xs={12} lg={6}>
          <Grid container spacing={3}>
            {/* Métricas de Empleados */}
            <Grid item xs={12}>
              <EmployeeMetrics
                totalEmployees={data.totalEmployees}
                operators={data.operators}
                administrators={data.administrators}
                daysWithoutAccidents={data.daysWithoutAccidents}
                hoursWorked={data.hoursWorked}
              />
            </Grid>

            {/* Objetivos de Seguridad */}
            <Grid item xs={12}>
              <SafetyGoals
                totalAccidents={data.totalAccidents}
                frequencyIndex={data.frequencyIndex}
                severityIndex={data.severityIndex}
                accidentabilityIndex={data.accidentabilityIndex}
              />
            </Grid>
          </Grid>
        </Grid>

        {/* Columna Derecha - Incidentes y Salud */}
        <Grid item xs={12} lg={3}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Incidentes */}
            <Paper elevation={2} sx={{
              p: 3,
              backgroundColor: 'white',
              borderRadius: '16px',
              border: '1px solid #e5e7eb',
              textAlign: 'center'
            }}>
              <Typography variant="h6" sx={{
                fontWeight: 600,
                color: '#111827',
                mb: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1
              }}>
                🚨 INCIDENTES
              </Typography>
              
              <Typography variant="h1" sx={{
                fontWeight: 'bold',
                color: data.totalIncidents === 0 ? '#22c55e' : '#ef4444',
                lineHeight: 1,
                mb: 2
              }}>
                {data.totalIncidents}
              </Typography>
              
              <Typography variant="body1" sx={{ color: '#64748b', mb: 2 }}>
                Incidentes reportados
              </Typography>

              <Box sx={{
                backgroundColor: '#fef3c7',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #fde68a'
              }}>
                <Typography variant="body2" sx={{
                  fontWeight: 600,
                  color: '#b45309'
                }}>
                  📝 REPORT ALL INCIDENTS
                </Typography>
              </Box>
            </Paper>

            {/* Salud Ocupacional */}
            <Paper elevation={2} sx={{
              p: 3,
              backgroundColor: 'white',
              borderRadius: '16px',
              border: '1px solid #e5e7eb'
            }}>
              <Typography variant="h6" sx={{
                fontWeight: 600,
                color: '#111827',
                mb: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                🏥 SALUD OCUPACIONAL
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: '#f0fdf4',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #bbf7d0'
                }}>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    🩺 Enfermedades ocupacionales
                  </Typography>
                  <Typography variant="h6" sx={{
                    fontWeight: 'bold',
                    color: '#22c55e'
                  }}>
                    0
                  </Typography>
                </Box>

                <Box sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: '#fef2f2',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #fecaca'
                }}>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    🦠 Casos covid positivos
                  </Typography>
                  <Typography variant="h6" sx={{
                    fontWeight: 'bold',
                    color: '#ef4444'
                  }}>
                    1
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Box>
        </Grid>

        {/* Fila Inferior - Capacitaciones e Inspecciones */}
        <Grid item xs={12} lg={6}>
          <TrainingMetrics
            charlas={data.charlasProgress}
            entrenamientos={data.entrenamientosProgress}
            capacitaciones={data.capacitacionesProgress}
          />
        </Grid>

        {/* Inspecciones */}
        <Grid item xs={12} lg={6}>
          <Paper elevation={2} sx={{
            p: 3,
            backgroundColor: 'white',
            borderRadius: '16px',
            border: '1px solid #e5e7eb',
            height: '100%'
          }}>
            <Typography variant="h6" sx={{
              fontWeight: 600,
              color: '#111827',
              mb: 3,
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              🔍 INSPECCIONES
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3 }}>
              <Typography variant="h1" sx={{
                fontWeight: 'bold',
                color: '#3b82f6',
                mr: 2
              }}>
                {data.inspectionsDone}
              </Typography>
              <Typography variant="body1" sx={{ color: '#64748b' }}>
                Inspecciones realizadas
              </Typography>
            </Box>

            {/* Gráfico circular simple */}
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 3
            }}>
              <Box sx={{
                width: 100,
                height: 100,
                borderRadius: '50%',
                background: `conic-gradient(#3b82f6 ${(data.inspectionsDone / data.inspectionsPlanned) * 360}deg, #e5e7eb 0deg)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative'
              }}>
                <Box sx={{
                  width: 60,
                  height: 60,
                  borderRadius: '50%',
                  backgroundColor: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Typography variant="h6" sx={{
                    fontWeight: 'bold',
                    color: '#3b82f6'
                  }}>
                    {Math.round((data.inspectionsDone / data.inspectionsPlanned) * 100)}%
                  </Typography>
                </Box>
              </Box>
            </Box>

            <Typography variant="body2" sx={{
              color: '#64748b',
              textAlign: 'center'
            }}>
              {data.inspectionsDone} de {data.inspectionsPlanned} planificadas
            </Typography>
          </Paper>
        </Grid>

        {/* Gráficos Adicionales */}
        <Grid item xs={12}>
          <SafetyCharts data={data} />
        </Grid>
      </Grid>

      {/* CSS para animación de carga */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </Container>
  );
}
