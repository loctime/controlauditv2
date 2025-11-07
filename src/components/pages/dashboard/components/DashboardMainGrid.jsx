import React from "react";
import { Grid, Typography, Box, Paper } from "@mui/material";
import GaugeChart from "../../../dashboard-seguridad/GaugeChart";
import EmployeeMetrics from "../../../dashboard-seguridad/EmployeeMetrics";
import SafetyGoals from "../../../dashboard-seguridad/SafetyGoals";
import TrainingMetrics from "../../../dashboard-seguridad/TrainingMetrics";
import SafetyCharts from "../../../dashboard-seguridad/SafetyCharts";
import AuditSummaryChips from "../../../dashboard-seguridad/AuditSummaryChips";

export default function DashboardMainGrid({ data }) {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12} lg={3}>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 600,
            color: "#111827",
            mb: 2,
            textAlign: "center"
          }}
        >
          EJECUCIÓN DEL PROGRAMA
        </Typography>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
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

      <Grid item xs={12} lg={6}>
        <Grid container spacing={3}>
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
                p: 3,
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
                  mb: 2,
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
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <Paper
            elevation={2}
            sx={{
              p: 3,
              backgroundColor: "white",
              borderRadius: "16px",
              border: "1px solid #e5e7eb",
              textAlign: "center"
            }}
          >
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                color: "#111827",
                mb: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 1
              }}
            >
              🚨 INCIDENTES
            </Typography>

            <Typography
              variant="h1"
              sx={{
                fontWeight: "bold",
                color: data.totalIncidents === 0 ? "#22c55e" : "#ef4444",
                lineHeight: 1,
                mb: 2
              }}
            >
              {data.totalIncidents}
            </Typography>

            <Typography variant="body1" sx={{ color: "#64748b", mb: 2 }}>
              Incidentes reportados
            </Typography>

            <Box
              sx={{
                backgroundColor: "#fef3c7",
                padding: "12px",
                borderRadius: "8px",
                border: "1px solid #fde68a"
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  color: "#b45309"
                }}
              >
                📝 REPORT ALL INCIDENTS
              </Typography>
            </Box>
          </Paper>

          <Paper
            elevation={2}
            sx={{
              p: 3,
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
                mb: 2,
                display: "flex",
                alignItems: "center",
                gap: 1
              }}
            >
              🏥 SALUD OCUPACIONAL
            </Typography>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  backgroundColor: "#f0fdf4",
                  padding: "12px",
                  borderRadius: "8px",
                  border: "1px solid #bbf7d0"
                }}
              >
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  🩺 Enfermedades ocupacionales
                </Typography>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: "bold",
                    color: "#22c55e"
                  }}
                >
                  0
                </Typography>
              </Box>

              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  backgroundColor: "#fef2f2",
                  padding: "12px",
                  borderRadius: "8px",
                  border: "1px solid #fecaca"
                }}
              >
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  🦠 Casos covid positivos
                </Typography>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: "bold",
                    color: "#ef4444"
                  }}
                >
                  1
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Box>
      </Grid>

      <Grid item xs={12} lg={6}>
        <TrainingMetrics
          charlas={data.charlasProgress}
          entrenamientos={data.entrenamientosProgress}
          capacitaciones={data.capacitacionesProgress}
        />
      </Grid>

      <Grid item xs={12} lg={6}>
        <Paper
          elevation={2}
          sx={{
            p: 3,
            backgroundColor: "white",
            borderRadius: "16px",
            border: "1px solid #e5e7eb",
            height: "100%"
          }}
        >
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              color: "#111827",
              mb: 3,
              display: "flex",
              alignItems: "center",
              gap: 1
            }}
          >
            🔍 INSPECCIONES
          </Typography>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mb: 3
            }}
          >
            <Typography
              variant="h1"
              sx={{
                fontWeight: "bold",
                color: "#3b82f6",
                mr: 2
              }}
            >
              {data.inspectionsDone}
            </Typography>
            <Typography variant="body1" sx={{ color: "#64748b" }}>
              Inspecciones realizadas
            </Typography>
          </Box>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mb: 3
            }}
          >
            <Box
              sx={{
                width: 100,
                height: 100,
                borderRadius: "50%",
                background: `conic-gradient(#3b82f6 ${
                  (data.inspectionsDone / data.inspectionsPlanned) * 360
                }deg, #e5e7eb 0deg)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative"
              }}
            >
              <Box
                sx={{
                  width: 60,
                  height: 60,
                  borderRadius: "50%",
                  backgroundColor: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: "bold",
                    color: "#3b82f6"
                  }}
                >
                  {Math.round(
                    (data.inspectionsDone / data.inspectionsPlanned) * 100
                  )}
                  %
                </Typography>
              </Box>
            </Box>
          </Box>

          <Typography
            variant="body2"
            sx={{
              color: "#64748b",
              textAlign: "center"
            }}
          >
            {data.inspectionsDone} de {data.inspectionsPlanned} planificadas
          </Typography>
        </Paper>
      </Grid>

      <Grid item xs={12}>
        <SafetyCharts data={data} />
      </Grid>
    </Grid>
  );
}

