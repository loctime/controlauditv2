import React from "react";
import { Box } from "@mui/material";
import PeriodSelector from "../../../dashboard-seguridad/PeriodSelector";

export default function DashboardFilters({
  selectedYear,
  selectedMonth,
  onYearChange,
  onMonthChange
}) {
  return (
    <Box sx={{ mb: 2 }}>
      <PeriodSelector
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
        onYearChange={onYearChange}
        onMonthChange={onMonthChange}
      />
    </Box>
  );
}

