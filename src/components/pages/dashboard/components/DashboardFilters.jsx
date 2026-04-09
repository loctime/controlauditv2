import React from "react";
import { Box } from "@mui/material";
import PeriodSelector from "../../../dashboard-seguridad/PeriodSelector";

export default function DashboardFilters({
  selectedYear,
  onYearChange
}) {
  return (
    <Box sx={{ mb: 2 }}>
      <PeriodSelector
        selectedYear={selectedYear}
        onYearChange={onYearChange}
      />
    </Box>
  );
}

