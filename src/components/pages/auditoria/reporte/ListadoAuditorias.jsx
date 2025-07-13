import React, { useEffect, useState, useMemo, useCallback } from "react";
import { collection, getDocs, query, where, orderBy, limit } from "firebase/firestore";
import { db } from "./../../../../firebaseConfig";
import { useAuth } from "../../context/AuthContext";
import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Chip,
  IconButton,
  Tooltip,
  TextField,
  InputAdornment,
} from "@mui/material";
import { Search, Refresh, Visibility } from "@mui/icons-material";

const ListadoAuditorias = ({ onSelect, empresaSeleccionada }) => {
  const [reportes, setReportes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const { userProfile } = useAuth();

  // Memoizar la función de fetch para evitar re-renders innecesarios
  const fetchReportes = useCallback(async (isRefresh = false) => {
    if (!userProfile) return;
    
    try {
      setLoading(!isRefresh);
      setRefreshing(isRefresh);
      setError(null);

      console.log("[DEBUG] Iniciando fetch de reportes para clienteAdminId:", userProfile.clienteAdminId || userProfile.uid);

      // Query optimizada con ordenamiento en Firestore
      const q = query(
        collection(db, "reportes"),
        where("clienteAdminId", "==", userProfile.clienteAdminId || userProfile.uid),
        orderBy("fechaGuardado", "desc"),
        limit(100) // Limitar resultados para mejor performance
      );

      const querySnapshot = await getDocs(q);
      const reportesData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setReportes(reportesData);
      console.log(`[DEBUG] ${reportesData.length} reportes cargados exitosamente`);
    } catch (error) {
      console.error("[ERROR] Error al obtener reportes:", error);
      setError(`Error al obtener reportes: ${error.message}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userProfile]);

  useEffect(() => {
    fetchReportes();
  }, [fetchReportes]);

  // Memoizar el filtrado para evitar recálculos innecesarios
  const reportesFiltrados = useMemo(() => {
    let filtered = reportes;

    // Filtrar por empresa seleccionada
    if (empresaSeleccionada) {
      filtered = filtered.filter((reporte) => {
        const nombreEmpresa = typeof reporte.empresa === 'object' 
          ? reporte.empresa.nombre 
          : reporte.empresa;
        return nombreEmpresa === empresaSeleccionada;
      });
    }

    // Filtrar por término de búsqueda
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((reporte) => {
        const nombreEmpresa = typeof reporte.empresa === 'object' 
          ? reporte.empresa.nombre?.toLowerCase() 
          : reporte.empresa?.toLowerCase();
        const nombreFormulario = reporte.nombreForm?.toLowerCase() || 
          (typeof reporte.formulario === 'object' 
            ? reporte.formulario.nombre?.toLowerCase() 
            : reporte.formulario?.toLowerCase());
        const sucursal = reporte.sucursal?.toLowerCase();

        return nombreEmpresa?.includes(term) || 
               nombreFormulario?.includes(term) || 
               sucursal?.includes(term);
      });
    }

    return filtered;
  }, [reportes, empresaSeleccionada, searchTerm]);

  // Función para formatear fecha de manera consistente
  const formatDate = useCallback((reporte) => {
    try {
      if (reporte.fecha?.seconds) {
        return new Date(reporte.fecha.seconds * 1000).toLocaleString('es-ES', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
      if (reporte.fechaGuardado) {
        return new Date(reporte.fechaGuardado).toLocaleString('es-ES', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
      return "Fecha no disponible";
    } catch (error) {
      console.error("[ERROR] Error formateando fecha:", error);
      return "Fecha inválida";
    }
  }, []);

  // Función para extraer nombre de empresa de manera segura
  const getEmpresaNombre = useCallback((reporte) => {
    try {
      return typeof reporte.empresa === 'object' 
        ? reporte.empresa.nombre 
        : reporte.empresa || "Empresa no disponible";
    } catch (error) {
      console.error("[ERROR] Error obteniendo nombre de empresa:", error);
      return "Empresa no disponible";
    }
  }, []);

  // Función para extraer nombre de formulario de manera segura
  const getFormularioNombre = useCallback((reporte) => {
    try {
      return reporte.nombreForm || 
        (typeof reporte.formulario === 'object' 
          ? reporte.formulario.nombre 
          : reporte.formulario) || "Formulario no disponible";
    } catch (error) {
      console.error("[ERROR] Error obteniendo nombre de formulario:", error);
      return "Formulario no disponible";
    }
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
        <Typography variant="body2" sx={{ ml: 2 }}>
          Cargando reportes...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
        <Button 
          size="small" 
          onClick={() => fetchReportes(true)}
          sx={{ ml: 1 }}
        >
          Reintentar
        </Button>
      </Alert>
    );
  }

  return (
    <Box>
      {/* Barra de búsqueda y controles */}
      <Box display="flex" gap={2} mb={2} alignItems="center">
        <TextField
          size="small"
          placeholder="Buscar por empresa, formulario o sucursal..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
          sx={{ flexGrow: 1, maxWidth: 400 }}
        />
        
        <Tooltip title="Actualizar reportes">
          <IconButton 
            onClick={() => fetchReportes(true)}
            disabled={refreshing}
          >
            <Refresh className={refreshing ? 'MuiCircularProgress-root' : ''} />
          </IconButton>
        </Tooltip>

        <Chip 
          label={`${reportesFiltrados.length} reportes`}
          color="primary"
          variant="outlined"
        />
      </Box>

      {/* Tabla de reportes */}
      <TableContainer component={Paper} elevation={2}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>Empresa</strong></TableCell>
              <TableCell><strong>Sucursal</strong></TableCell>
              <TableCell><strong>Formulario</strong></TableCell>
              <TableCell><strong>Fecha</strong></TableCell>
              <TableCell align="center"><strong>Acciones</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {reportesFiltrados.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" color="textSecondary">
                    {searchTerm || empresaSeleccionada 
                      ? "No se encontraron reportes con los filtros aplicados"
                      : "No hay reportes disponibles"
                    }
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              reportesFiltrados.map((reporte) => (
                <TableRow key={reporte.id} hover>
                  <TableCell>{getEmpresaNombre(reporte)}</TableCell>
                  <TableCell>{reporte.sucursal || "Sucursal no disponible"}</TableCell>
                  <TableCell>{getFormularioNombre(reporte)}</TableCell>
                  <TableCell>{formatDate(reporte)}</TableCell>
                  <TableCell align="center">
                    <Tooltip title="Ver detalles del reporte">
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<Visibility />}
                        onClick={() => onSelect(reporte)}
                      >
                        Ver Detalles
                      </Button>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default ListadoAuditorias;
