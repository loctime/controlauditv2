import React, { useState, useEffect } from "react";
import { Button, TextField, Grid, Typography, Box, MenuItem, FormControl, InputLabel, Select, Paper } from "@mui/material";
import { db } from "../../../firebaseConfig";
import { getDocs, collection } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

const SucursalForm = ({ agregarSucursal, empresaId }) => {
  const [empresas, setEmpresas] = useState([]);
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState(null);
  const [sucursal, setSucursal] = useState({
    nombre: "",
    direccion: "",
    telefono: "",
    empresa: "",
  });
  const navigate = useNavigate();

  useEffect(() => {
    const obtenerEmpresas = async () => {
      try {
        const empresasSnapshot = await getDocs(collection(db, "empresas"));
        const empresasData = [];
        empresasSnapshot.forEach((doc) => {
          empresasData.push({
            id: doc.id,
            nombre: doc.data().nombre,
            logo: doc.data().logo || ""
          });
        });
        setEmpresas(empresasData);
        // Si hay empresaId, seleccionarla automáticamente
        if (empresaId) {
          const empresa = empresasData.find(e => e.id === empresaId);
          setEmpresaSeleccionada(empresa);
          setSucursal((prev) => ({ ...prev, empresa: empresa ? empresa.nombre : "" }));
        }
      } catch (error) {
        console.error("Error al obtener empresas:", error);
      }
    };
    obtenerEmpresas();
    // eslint-disable-next-line
  }, [empresaId]);

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
        navigate(`/sucursales/${empresa.id}`);
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    agregarSucursal(sucursal);
    setSucursal({
      nombre: "",
      direccion: "",
      telefono: "",
      empresa: empresaSeleccionada ? empresaSeleccionada.nombre : "",
    });
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Agregar Sucursal
      </Typography>
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
            />
          </Grid>
        </Grid>
        <Button type="submit" variant="contained" color="primary" sx={{ mt: 2 }}>
          Agregar Sucursal
        </Button>
      </form>
    </Box>
  );
};

export default SucursalForm;
