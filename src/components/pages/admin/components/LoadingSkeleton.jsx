// src/components/pages/admin/components/LoadingSkeleton.jsx
import React from "react";
import { 
  Box, 
  Skeleton, 
  Grid, 
  Paper 
} from "@mui/material";

const LoadingSkeleton = () => {
  return (
    <Box sx={{ padding: { xs: 1, sm: 2, md: 3 } }}>
      {/* Header skeleton */}
      <Box sx={{ mb: 3 }}>
        <Skeleton variant="text" width="60%" height={40} />
      </Box>

      {/* Tabs skeleton */}
      <Paper elevation={2} sx={{ mb: 3, p: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Skeleton variant="rectangular" width={120} height={36} sx={{ borderRadius: 2 }} />
          <Box display="flex" gap={2}>
            <Skeleton variant="rectangular" width={100} height={36} />
            <Skeleton variant="rectangular" width={100} height={36} />
          </Box>
          <Box sx={{ width: 60 }} />
        </Box>
      </Paper>

      {/* Content skeleton */}
      <Grid container spacing={3}>
        {/* Left side - Calendar skeleton */}
        <Grid item xs={12} lg={6}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Box sx={{ mb: 2 }}>
              <Skeleton variant="text" width="50%" height={32} />
            </Box>
            
            {/* Calendar grid skeleton */}
            <Grid container spacing={1}>
              {/* Week days */}
              {Array.from({ length: 7 }).map((_, index) => (
                <Grid item xs={12/7} key={index}>
                  <Skeleton variant="rectangular" height={30} sx={{ borderRadius: 1 }} />
                </Grid>
              ))}
              
              {/* Calendar days */}
              {Array.from({ length: 35 }).map((_, index) => (
                <Grid item xs={12/7} key={index + 7}>
                  <Skeleton 
                    variant="rectangular" 
                    height={60} 
                    sx={{ borderRadius: 1 }} 
                  />
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>

        {/* Right side - Content skeleton */}
        <Grid item xs={12} lg={6}>
          {/* Auditorías del día skeleton */}
          <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
            <Skeleton variant="text" width="40%" height={28} sx={{ mb: 2 }} />
            {Array.from({ length: 3 }).map((_, index) => (
              <Box key={index} sx={{ mb: 1 }}>
                <Skeleton variant="rectangular" height={60} sx={{ borderRadius: 1 }} />
              </Box>
            ))}
          </Paper>

          {/* Próximas auditorías skeleton */}
          <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
            <Skeleton variant="text" width="50%" height={28} sx={{ mb: 2 }} />
            {Array.from({ length: 2 }).map((_, index) => (
              <Box key={index} sx={{ mb: 1 }}>
                <Skeleton variant="rectangular" height={50} sx={{ borderRadius: 1 }} />
              </Box>
            ))}
          </Paper>

          {/* Resumen general skeleton */}
          <Paper elevation={2} sx={{ p: 2 }}>
            <Skeleton variant="text" width="45%" height={28} sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              {Array.from({ length: 4 }).map((_, index) => (
                <Grid item xs={6} key={index}>
                  <Skeleton variant="rectangular" height={80} sx={{ borderRadius: 1 }} />
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default LoadingSkeleton; 