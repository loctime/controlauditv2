import React from "react";
import { Grid, Typography, Box, Paper } from "@mui/material";
import GaugeChart from "../../../dashboard-seguridad/GaugeChart";
import EmployeeMetrics from "../../../dashboard-seguridad/EmployeeMetrics";
import SafetyGoals from "../../../dashboard-seguridad/SafetyGoals";
import AuditSummaryChips from "../../../dashboard-seguridad/AuditSummaryChips";
import IncidentMetrics from "../../../dashboard-seguridad/IncidentMetrics";
import DashboardOccupationalHealthCard from "./DashboardOccupationalHealthCard";
import AuditClassificationPie from "./AuditClassificationPie";

export default function DashboardMainGrid({
  data,
  saludOcupacional,
  auditClasificaciones,
  capacitacionesMetas
}) {
  // Obtener porcentajes de cumplimiento de capacitaciones
  const porcentajeMensual = capacitacionesMetas?.mensual?.porcentaje || 0;
  const porcentajeAnual = capacitacionesMetas?.anual?.porcentaje || 0;
  
  // Si no hay metas configuradas, no mostrar los gauges
  const tieneMetasMensual = capacitacionesMetas?.mensual?.target > 0;
  const tieneMetasAnual = capacitacionesMetas?.anual?.target > 0;

  return (
    <Grid container spacing={1.5}>
      {/* Columna izquierda: Salud Ocupacional + EJECUCIÓN DEL PROGRAMA */}
      <Grid item xs={12} lg={3}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          <DashboardOccupationalHealthCard
            saludOcupacional={saludOcupacional}
          />
          
          {/* EJECUCIÓN DEL PROGRAMA */}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            {/* Título de capacitaciones */}
            <Typography
              variant="h5"
              component="h5"
              sx={{
                fontWeight: 600,
                color: "#111827",
                textAlign: "center"
              }}
            >
              EJECUCIÓN DEL PROGRAMA
            </Typography>

            {/* Capacitaciones */}
            {tieneMetasAnual ? (
              <GaugeChart
                value={porcentajeAnual}
                max={100}
                title="Capacitaciones - Año"
                subtitle={`${capacitacionesMetas.anual.completadas} de ${capacitacionesMetas.anual.target}`}
                size={140}
              />
            ) : (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "white",
                  borderRadius: "12px",
                  border: "1px solid #e5e7eb",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                  padding: "1.5rem",
                  minHeight: "200px"
                }}
              >
                <Typography variant="body2" color="text.secondary" textAlign="center">
                  Capacitaciones - Año
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                  Sin meta configurada
                </Typography>
              </Box>
            )}

            {tieneMetasMensual ? (
              <GaugeChart
                value={porcentajeMensual}
                max={100}
                title="Capacitaciones - Mes"
                subtitle={`${capacitacionesMetas.mensual.completadas} de ${capacitacionesMetas.mensual.target}`}
                size={140}
              />
            ) : (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "white",
                  borderRadius: "12px",
                  border: "1px solid #e5e7eb",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                  padding: "1.5rem",
                  minHeight: "200px"
                }}
              >
                <Typography variant="body2" color="text.secondary" textAlign="center">
                  Capacitaciones - Mes
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                  Sin meta configurada
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </Grid>

      {/* Columna derecha: Incidentes + Empleados arriba, AUDITORÍAS + gráficos abajo */}
      <Grid item xs={12} lg={9}>
        <Grid container spacing={1.5}>
          {/* Fila 1: Incidentes y Empleados */}
          <Grid item xs={12} lg={4}>
            <IncidentMetrics
              totalIncidents={data.totalIncidents}
              incidentTrend={data.incidentTrend}
              incidentAccidentRatio={data.incidentAccidentRatio}
              daysWithoutIncidents={data.daysWithoutIncidents}
              recentIncidents={data.recentIncidents}
              companyId={data.companyId}
              sucursalId={data.sucursalId}
            />
          </Grid>

          <Grid item xs={12} lg={8}>
            <EmployeeMetrics
              totalEmployees={data.totalEmployees}
              totalEmployeesAll={data.totalEmployeesAll}
              inactiveEmployees={data.inactiveEmployees}
              operators={data.operators}
              administrators={data.administrators}
              daysWithoutAccidents={data.daysWithoutAccidents}
              hoursWorked={data.hoursWorked}
            />
          </Grid>

          {/* Fila 2: AUDITORÍAS y gráficos */}
          <Grid item xs={12}>
            <Paper
              elevation={2}
              sx={{
                p: 2,
                backgroundColor: "white",
                borderRadius: "16px",
                border: "1px solid #e5e7eb"
              }}
            >
              <Typography
                variant="h5"
                component="h5"
                sx={{
                  fontWeight: 600,
                  color: "#111827",
                  mb: 1.5,
                  textAlign: "center",
                  display: "flex",
                  justifyContent: "center",
                  gap: 1,
                  alignItems: "center"
                }}
              >
                📋 AUDITORÍAS
              </Typography>
              <AuditSummaryChips
                total={data.auditsTotal}
                completed={data.auditsCompleted}
                pending={data.auditsPending}
                nonConformities={data.auditsNonConformities}
              />
            </Paper>
          </Grid>

          {/* Condición vs Actitud más pequeño */}
          <Grid item xs={12} md={4}>
            <AuditClassificationPie stats={auditClasificaciones} />
          </Grid>

          {/* ACCIDENTES más grande */}
          <Grid item xs={12} md={8}>
            <SafetyGoals
              totalAccidents={data.totalAccidents}
              frequencyIndex={data.frequencyIndex}
              severityIndex={data.severityIndex}
              accidentabilityIndex={data.accidentabilityIndex}
            />
          </Grid>
        </Grid>
      </Grid>

    </Grid>
  );
}

