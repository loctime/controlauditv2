import React from "react";
import { Grid, Typography, Box, Paper } from "@mui/material";
import GaugeChart from "../../../dashboard-seguridad/GaugeChart";
import EmployeeMetrics from "../../../dashboard-seguridad/EmployeeMetrics";
import SafetyGoals from "../../../dashboard-seguridad/SafetyGoals";
import AuditSummaryChips from "../../../dashboard-seguridad/AuditSummaryChips";
import IncidentMetrics from "../../../dashboard-seguridad/IncidentMetrics";
import DashboardOccupationalHealthCard from "./DashboardOccupationalHealthCard";

export default function DashboardMainGrid({ data, saludOcupacional }) {
  return (
    <Grid container spacing={1.5}>
      <Grid item xs={12} lg={3}>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 600,
            color: "#111827",
            mb: 1.5,
            textAlign: "center"
          }}
        >
          EJECUCIÓN DEL PROGRAMA
        </Typography>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
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
        </Box>
      </Grid>

      <Grid item xs={12} lg={6}>
        <Grid container spacing={1.5}>
          <Grid item xs={12}>
            <EmployeeMetrics
              totalEmployees={data.totalEmployees}
              operators={data.operators}
              administrators={data.administrators}
              daysWithoutAccidents={data.daysWithoutAccidents}
              hoursWorked={data.hoursWorked}
            />
          </Grid>

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
                variant="h6"
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

      <Grid item xs={12} lg={3}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          <IncidentMetrics
            totalIncidents={data.totalIncidents}
            incidentTrend={data.incidentTrend}
            incidentAccidentRatio={data.incidentAccidentRatio}
            daysWithoutIncidents={data.daysWithoutIncidents}
            recentIncidents={data.recentIncidents}
            companyId={data.companyId}
            sucursalId={data.sucursalId}
          />

          <DashboardOccupationalHealthCard
            saludOcupacional={saludOcupacional}
          />
        </Box>
      </Grid>

    </Grid>
  );
}

