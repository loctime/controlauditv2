import React, { useState, useEffect } from "react";
import { Button, TextField, Grid, Typography, Box, MenuItem, FormControl, InputLabel, Select, Paper, Alert, CircularProgress } from "@mui/material";
import { db } from "../../../firebaseAudit";
import { getDocs, collection, query, where } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const SucursalForm = ({ agregarSucursal, empresaId }) => {
  const [empresas, setEmpresas] = useState([]);
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState(null);
  const [sucursal, setSucursal] = useState({
    nombre: "",
    direccion: "",
    telefono: "",
    empresa: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { userProfile, role, userEmpresas } = useAuth();

  useEffect(() => {
    const obtenerEmpresas = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Si no hay usuario autenticado, no cargar nada
        if (!userProfile) {
          setEmpresas([]);
          setLoading(false);
          setError("No hay usuario autenticado");
          return;
        }

        // Usar userEmpresas del contexto que ya está filtrado por multi-tenant
        const empresasData = userEmpresas || [];
        
        if (empresasData.length === 0) {
          setEmpresas([]);
          setLoading(false);
          setError("No hay empresas disponibles para este usuario");
          return;
        }
        
        setEmpresas(empresasData);
        
        // Si hay empresaId, seleccionarla automáticamente
        if (empresaId) {
          const empresa = empresasData.find(e => e.id === empresaId);
          if (empresa) {
            setEmpresaSeleccionada(empresa);
            setSucursal((prev) => ({ ...prev, empresa: empresa.nombre }));
          } else {
            setError(`No se encontró la empresa con ID: ${empresaId}`);
          }
        }
        
      } catch (error) {
        console.error("[SucursalForm] Error al obtener empresas:", error);
        setError("Error al cargar las empresas: " + error.message);
      } finally {
        setLoading(false);
      }
    };
    
    obtenerEmpresas();
  }, [empresaId, userProfile, userEmpresas]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setSucursal((prevSucursal) => ({
      ...prevSucursal,
      [name]: value,
    }));
    
    if (name === "empresa") {
      const empresa = empresas.find(e => e.nombre === value);
      setEmpresaSeleccionada(empresa);
      if (empresa && empresa.id !== empresaId) {
        navigate(`/establecimiento`);
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!empresaSeleccionada) {
      setError("Debe seleccionar una empresa");
      return;
    }
    
    if (!sucursal.nombre.trim()) {
      setError("El nombre de la sucursal es requerido");
      return;
    }
    
    if (!sucursal.direccion.trim()) {
      setError("La dirección es requerida");
      return;
    }
    
    if (!sucursal.telefono.trim()) {
      setError("El teléfono es requerido");
      return;
    }
    
    agregarSucursal(sucursal);
    setSucursal({
      nombre: "",
      direccion: "",
      telefono: "",
      empresa: empresaSeleccionada ? empresaSeleccionada.nombre : "",
    });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px" flexDirection="column" gap={2}>
        <CircularProgress />
        <Typography>Cargando formulario de sucursal...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Agregar Sucursal
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <form onSubmit={handleSubmit}>
        <Grid container spacing={2}>
          {/* Selector de empresa SIEMPRE primero */}
          <Grid item xs={12}>
            <FormControl fullWidth required>
              <InputLabel>Empresa</InputLabel>
              <Select
                name="empresa"
                value={sucursal.empresa}
                onChange={handleChange}
                label="Empresa"
                error={!sucursal.empresa}
              >
                <MenuItem value="">
                  <em>Seleccione una empresa</em>
                </MenuItem>
                {empresas.map((empresa) => (
                  <MenuItem key={empresa.id} value={empresa.nombre}>
                    {empresa.nombre}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Mostrar nombre y logo de la empresa seleccionada */}
          {empresaSeleccionada && (
            <Grid item xs={12}>
              <Paper elevation={2} sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', minWidth: 'fit-content' }}>
                  Empresa seleccionada:
                </Typography>
                <Typography variant="h6" color="primary" sx={{ flex: 1 }}>
                  {empresaSeleccionada.nombre}
                </Typography>
                {empresaSeleccionada.logo && empresaSeleccionada.logo.trim() !== "" ? (
                  <img
                    src={empresaSeleccionada.logo}
                    alt={`Logo de ${empresaSeleccionada.nombre}`}
                    style={{ width: "60px", height: "60px", objectFit: 'contain', borderRadius: '8px' }}
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
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "20px",
                      color: "#666",
                      border: "2px dashed #ccc"
                    }}
                  >
                    {empresaSeleccionada.nombre.charAt(0).toUpperCase()}
                  </Box>
                )}
              </Paper>
            </Grid>
          )}

          {/* Campos de sucursal */}
          <Grid item xs={12} sm={6}>
            <TextField
              name="nombre"
              label="Nombre de la Sucursal"
              fullWidth
              value={sucursal.nombre}
              onChange={handleChange}
              required
              error={!sucursal.nombre.trim()}
              helperText={!sucursal.nombre.trim() ? "El nombre es requerido" : ""}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              name="direccion"
              label="Dirección"
              fullWidth
              value={sucursal.direccion}
              onChange={handleChange}
              required
              error={!sucursal.direccion.trim()}
              helperText={!sucursal.direccion.trim() ? "La dirección es requerida" : ""}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              name="telefono"
              label="Teléfono"
              fullWidth
              value={sucursal.telefono}
              onChange={handleChange}
              required
              error={!sucursal.telefono.trim()}
              helperText={!sucursal.telefono.trim() ? "El teléfono es requerido" : ""}
            />
          </Grid>
        </Grid>
        <Button 
          type="submit" 
          variant="contained" 
          color="primary" 
          sx={{ mt: 2 }}
          disabled={!empresaSeleccionada || !sucursal.nombre.trim() || !sucursal.direccion.trim() || !sucursal.telefono.trim()}
        >
          Agregar Sucursal
        </Button>
      </form>
    </Box>
  );
};

export default SucursalForm;
