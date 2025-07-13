import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  IconButton,
  Alert
} from "@mui/material";
import {
  Delete as DeleteIcon,
  Edit as EditIcon
} from "@mui/icons-material";
import { collection, getDocs, deleteDoc, doc, query, where } from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import { useAuth } from "../../context/AuthContext";

const ListaSucursales = ({ empresaId }) => {
  const [sucursales, setSucursales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { userProfile, userEmpresas, role } = useAuth();

  useEffect(() => {
    cargarSucursales();
    // eslint-disable-next-line
  }, [empresaId, userProfile, userEmpresas, role]);

  const cargarSucursales = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('=== DEBUG ListaSucursales ===');
      console.log('userProfile:', userProfile);
      console.log('userEmpresas:', userEmpresas);
      console.log('empresaId:', empresaId);
      console.log('role:', role);

      // Si no hay usuario autenticado, no cargar nada
      if (!userProfile) {
        console.log('No hay userProfile, no cargando sucursales');
        setSucursales([]);
        return;
      }

      let sucursalesData = [];

      // Usar userEmpresas del contexto que ya está filtrado por multi-tenant
      const empresasDisponibles = userEmpresas || [];
      console.log('Empresas disponibles del contexto:', empresasDisponibles.length);

      if (empresasDisponibles.length === 0) {
        console.log('No hay empresas disponibles');
        setSucursales([]);
        return;
      }

      // Determinar qué empresas consultar
      let empresasAConsultar = empresasDisponibles;
      
      // Si hay empresaId específico, filtrar solo esa empresa
      if (empresaId) {
        const empresaEspecifica = empresasDisponibles.find(e => e.id === empresaId);
        if (empresaEspecifica) {
          empresasAConsultar = [empresaEspecifica];
          console.log('Filtrando por empresa específica:', empresaEspecifica.nombre);
        } else {
          console.log('Empresa específica no encontrada en empresas disponibles');
          setSucursales([]);
          return;
        }
      }

      // Obtener IDs de empresas para la consulta
      const empresasIds = empresasAConsultar.map(e => e.id);
      console.log('IDs de empresas a consultar:', empresasIds);

      // Obtener sucursales de las empresas disponibles
      if (empresasIds.length > 0) {
        const sucursalesRef = collection(db, "sucursales");
        const sucursalesQuery = query(sucursalesRef, where("empresaId", "in", empresasIds));
        const sucursalesSnapshot = await getDocs(sucursalesQuery);
        
        sucursalesData = sucursalesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          fechaCreacion: doc.data().fechaCreacion?.toDate?.() || new Date()
        }));

        console.log('Sucursales encontradas:', sucursalesData.length);
      }

      setSucursales(sucursalesData);
      console.log('=== FIN DEBUG ===');
    } catch (error) {
      console.error("Error al cargar sucursales:", error);
      setError("Error al cargar las sucursales");
    } finally {
      setLoading(false);
    }
  };

  const handleEliminar = async (sucursalId, nombreSucursal) => {
    if (window.confirm(`¿Está seguro de que desea eliminar la sucursal "${nombreSucursal}"?`)) {
      try {
        await deleteDoc(doc(db, "sucursales", sucursalId));
        // Recargar sucursales después de eliminar
        await cargarSucursales();
      } catch (error) {
        console.error("Error al eliminar sucursal:", error);
        setError("Error al eliminar la sucursal");
      }
    }
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Verificar permisos de acceso
  if (!userProfile) {
    return (
      <Box>
        <Alert severity="error">
          No tienes permisos para acceder a esta sección.
        </Alert>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <Typography>Cargando sucursales...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Sucursales Registradas ({sucursales.length})
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {sucursales.length === 0 ? (
        <Box textAlign="center" py={4}>
          <Typography variant="h6" color="textSecondary">
            No hay sucursales registradas
          </Typography>
          {empresaId && (
            <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
              Para esta empresa específica
            </Typography>
          )}
        </Box>
      ) : (
        <Grid container spacing={2}>
          {sucursales.map((sucursal) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={sucursal.id}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Typography variant="h6" component="div">
                      {sucursal.nombre}
                    </Typography>
                    <Chip 
                      label={sucursal.empresa || sucursal.empresaId} 
                      color="primary"
                      size="small"
                    />
                  </Box>
                  
                  <Typography color="textSecondary" gutterBottom>
                    <strong>Dirección:</strong> {sucursal.direccion}
                  </Typography>
                  
                  <Typography color="textSecondary" gutterBottom>
                    <strong>Teléfono:</strong> {sucursal.telefono}
                  </Typography>
                  
                  <Typography color="textSecondary" gutterBottom>
                    <strong>Fecha de creación:</strong> {formatearFecha(sucursal.fechaCreacion)}
                  </Typography>

                  <Box display="flex" gap={1} mt={2}>
                    <IconButton 
                      size="small" 
                      color="primary"
                      disabled
                    >
                      <EditIcon />
                    </IconButton>
                    
                    <IconButton 
                      size="small" 
                      onClick={() => handleEliminar(sucursal.id, sucursal.nombre)}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default ListaSucursales; 