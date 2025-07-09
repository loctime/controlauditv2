import React, { useState } from "react";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import SucursalForm from "../formularioSucursal/SucursalForm";
import ListaSucursales from "./ListaSucursales";
import { Alert, Box, Typography, Tabs, Tab } from "@mui/material";
import { useParams } from "react-router-dom";

const SucursalContainer = () => {
  const { empresaId } = useParams();
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [activeTab, setActiveTab] = useState(0); // Ahora el listado es el tab 0
  const [refreshList, setRefreshList] = useState(false);

  const agregarSucursal = async (sucursal) => {
    try {
      setError(null);
      setSuccess(null);
      
      const sucursalRef = collection(db, "sucursales");
      await addDoc(sucursalRef, {
        ...sucursal,
        empresaId: empresaId,
        fechaCreacion: Timestamp.now(),
      });
      
      console.log("Sucursal agregada correctamente:", sucursal);
      setSuccess(`Sucursal "${sucursal.nombre}" agregada exitosamente.`);
      
      // Refrescar la lista de sucursales
      setRefreshList(!refreshList);
      
      // Cambiar a la pestaña de lista
      setActiveTab(0);
      
      // Limpiar mensaje de éxito después de 5 segundos
      setTimeout(() => {
        setSuccess(null);
      }, 5000);
      
    } catch (error) {
      console.error("Error al agregar la sucursal:", error);
      setError("Error al agregar la sucursal. Por favor, intente nuevamente.");
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Gestión de Sucursales
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 3 }}>
        <Tab label="Ver Sucursales" />
        <Tab label="Agregar Sucursal" />
      </Tabs>

      {activeTab === 0 && (
        <ListaSucursales key={refreshList} empresaId={empresaId} />
      )}

      {activeTab === 1 && (
        <SucursalForm agregarSucursal={agregarSucursal} empresaId={empresaId} />
      )}
    </Box>
  );
};

export default SucursalContainer;
