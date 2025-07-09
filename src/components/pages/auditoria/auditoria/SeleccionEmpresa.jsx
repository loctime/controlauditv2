import React, { useState, useEffect } from "react";
import { FormControl, InputLabel, MenuItem, Select, Box, Typography, Paper } from "@mui/material";

const SeleccionEmpresa = ({ empresas, empresaSeleccionada, onChange }) => {
  const [empresaSeleccionadaLocal, setEmpresaSeleccionadaLocal] = useState(empresaSeleccionada);

  useEffect(() => {
    setEmpresaSeleccionadaLocal(empresaSeleccionada);
  }, [empresaSeleccionada]);

  const handleChange = (event) => {
    const selectedEmpresa = empresas.find((empresa) => empresa.nombre === event.target.value);
    setEmpresaSeleccionadaLocal(selectedEmpresa);
    onChange(selectedEmpresa);
  };

  return (
    <Paper elevation={1} sx={{ p: 2, height: '100%' }}>
      <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', mb: 2 }}>
        Seleccionar Empresa
      </Typography>
      
      <FormControl fullWidth size="large">
        <InputLabel sx={{ fontSize: '1.1rem' }}>Empresa</InputLabel>
        <Select
          value={empresaSeleccionadaLocal ? empresaSeleccionadaLocal.nombre : ""}
          onChange={handleChange}
          sx={{ 
            minHeight: '56px',
            '& .MuiSelect-select': {
              fontSize: '1rem',
              padding: '16px 14px'
            }
          }}
        >
          <MenuItem value="">
            <em>Seleccione una empresa</em>
          </MenuItem>
          {empresas.map((empresa) => (
            <MenuItem key={empresa.nombre} value={empresa.nombre} sx={{ py: 1.5 }}>
              <Box display="flex" alignItems="center" sx={{ width: '100%' }}>
                {empresa.logo && empresa.logo.trim() !== "" ? (
                  <img
                    src={empresa.logo}
                    alt={`${empresa.nombre} logo`}
                    style={{ 
                      width: "60px", 
                      height: "60px", 
                      marginRight: "15px",
                      objectFit: 'contain',
                      borderRadius: '8px'
                    }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                ) : (
                  <Box
                    sx={{
                      width: "60px",
                      height: "60px",
                      backgroundColor: "#f0f0f0",
                      borderRadius: "8px",
                      marginRight: "15px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "18px",
                      color: "#666",
                      border: "2px dashed #ccc"
                    }}
                  >
                    {empresa.nombre.charAt(0).toUpperCase()}
                  </Box>
                )}
                <Typography variant="body1" sx={{ fontSize: '1rem', fontWeight: 500 }}>
                  {empresa.nombre}
                </Typography>
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Paper>
  );
};

export default SeleccionEmpresa;
