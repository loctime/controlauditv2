import React, { useState, useEffect, useRef, useMemo } from "react";
import { collection, getDocs, query, where, orderBy, limit } from "firebase/firestore";
import { db } from "./../../../../firebaseConfig";
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
} from "@mui/material";
import "./ReportesPage.css";
import FiltrosReportes from "./FiltrosReportes";
import { useAuth } from "../../../context/AuthContext";
import ReporteWrapper from './reporte';
import ReactToPrint from 'react-to-print';
import { getEmpresaIdFromReporte } from '../../../../services/useMetadataService';

// Helpers seguros para obtener nombre de empresa y formulario
const getNombreEmpresa = (reporte, empresas = []) => {
  if (reporte.empresaNombre) return reporte.empresaNombre;
  if (reporte.empresaId && empresas.length > 0) {
    const emp = empresas.find(e => e.id === reporte.empresaId);
    if (emp) return emp.nombre;
  }
  if (reporte.empresa && typeof reporte.empresa === 'object' && reporte.empresa.nombre) return reporte.empresa.nombre;
  if (typeof reporte.empresa === 'string') return reporte.empresa;
  return 'Empresa no disponible';
};

const getNombreFormulario = (formulario, nombreForm) =>
  nombreForm ||
  (typeof formulario === "object" && formulario && formulario.nombre
    ? formulario.nombre
    : typeof formulario === "string"
    ? formulario
    : "Formulario no disponible");

const ReportesPage = () => {
  const { userProfile, userEmpresas } = useAuth();
  

  const [reportes, setReportes] = useState([]);
  const [filteredReportes, setFilteredReportes] = useState([]);
  const [selectedReporte, setSelectedReporte] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [empresasSeleccionadas, setEmpresasSeleccionadas] = useState([]);
  const [formulariosSeleccionados, setFormulariosSeleccionados] = useState([]);
  const [fechaDesde, setFechaDesde] = useState(null);
  const [fechaHasta, setFechaHasta] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState("");
  const detalleRef = useRef();

  // ✅ Query segura con filtro multi-tenant
  useEffect(() => {
    const fetchReportes = async () => {
      try {
        if (!userProfile) return;
        
        console.log("[DEBUG] Iniciando fetch de reportes con multi-tenant para:", userProfile.clienteAdminId || userProfile.uid);

        // Query optimizada con filtro multi-tenant en Firestore
        const q = query(
          collection(db, "reportes"),
          where("clienteAdminId", "==", userProfile.clienteAdminId || userProfile.uid),
          orderBy("fechaCreacion", "desc"),
          limit(100) // Limitar para mejor performance
        );

        const querySnapshot = await getDocs(q);
        const reportesData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        console.log(`[DEBUG] ${reportesData.length} reportes cargados con multi-tenant`);

        setReportes(reportesData);
        setFilteredReportes(reportesData);
      } catch (error) {
        console.error("[ERROR] Error al obtener reportes:", error);
        setError("Error al obtener reportes: " + error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchReportes();
  }, [userProfile]);

  // ✅ Filtrar reportes por múltiples criterios
  useEffect(() => {
    let filtered = [...reportes];

    // Filtrar por empresas seleccionadas
    if (empresasSeleccionadas.length > 0) {
      filtered = filtered.filter((reporte) => 
        empresasSeleccionadas.includes(getEmpresaIdFromReporte(reporte))
      );
    }

    // Filtrar por formularios seleccionados
    if (formulariosSeleccionados.length > 0) {
      filtered = filtered.filter((reporte) => 
        formulariosSeleccionados.includes(reporte.formularioId || reporte.formulario?.id)
      );
    }

    // Filtrar por rango de fechas
    if (fechaDesde) {
      filtered = filtered.filter((reporte) => {
        const fechaReporte = reporte.fechaCreacion?.toDate?.() || new Date(reporte.fechaCreacion);
        return fechaReporte >= fechaDesde;
      });
    }

    if (fechaHasta) {
      filtered = filtered.filter((reporte) => {
        const fechaReporte = reporte.fechaCreacion?.toDate?.() || new Date(reporte.fechaCreacion);
        return fechaReporte <= fechaHasta;
      });
    }

    // Filtrar por término de búsqueda
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((reporte) => {
        const nombreEmpresa = getNombreEmpresa(reporte, userEmpresas).toLowerCase();
        const nombreFormulario = getNombreFormulario(reporte.formulario, reporte.nombreForm).toLowerCase();
        const sucursal = (reporte.sucursal || '').toLowerCase();
        
        return nombreEmpresa.includes(term) || 
               nombreFormulario.includes(term) || 
               sucursal.includes(term);
      });
    }

    setFilteredReportes(filtered);
  }, [empresasSeleccionadas, formulariosSeleccionados, fechaDesde, fechaHasta, searchTerm, reportes, userEmpresas]);

  // Elimino el useMemo de empresas y uso directamente userEmpresas

  const handleSelectReporte = (reporte) => {
    setSelectedReporte(reporte);
  };

  const handleCloseDetalles = () => {
    setSelectedReporte(null);
  };

  // Obtener empresas únicas de los reportes (temporal)
  const empresasDeReportes = useMemo(() => {
    const empresasMap = new Map();
    reportes.forEach(reporte => {
      const empresaId = getEmpresaIdFromReporte(reporte);
      const empresaNombre = getNombreEmpresa(reporte, userEmpresas);
      if (empresaId && !empresasMap.has(empresaId)) {
        empresasMap.set(empresaId, {
          id: empresaId,
          nombre: empresaNombre
        });
      }
    });
    const empresasArray = Array.from(empresasMap.values());
    return empresasArray;
  }, [reportes, userEmpresas]);

  // Obtener formularios únicos de los reportes
  const formulariosDisponibles = useMemo(() => {
    const formulariosMap = new Map();
    reportes.forEach(reporte => {
      const formId = reporte.formularioId || reporte.formulario?.id;
      const formNombre = getNombreFormulario(reporte.formulario, reporte.nombreForm);
      if (formId && !formulariosMap.has(formId)) {
        formulariosMap.set(formId, {
          id: formId,
          nombre: formNombre,
          empresaId: getEmpresaIdFromReporte(reporte)
        });
      }
    });
    const formulariosArray = Array.from(formulariosMap.values());
    return formulariosArray;
  }, [reportes]);

  // Función para imprimir el contenido del reporte
  const handlePrintReport = () => {
    window.print();
  };

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
      </Alert>
    );
  }

  return (
    <Box className="reportes-container" p={3}>
      {selectedReporte ? (
        <Box ref={detalleRef} className="public-report-content">
          <ReporteWrapper {...selectedReporte} />
          <Box display="flex" justifyContent="flex-end" mt={2}>
            <ReactToPrint
              trigger={() => (
                <Button variant="contained" color="primary" style={{ padding: "10px", minWidth: "50px", minHeight: "50px" }}>
                  Imprimir
                </Button>
              )}
              content={() => detalleRef.current}
              onBeforeGetContent={() => new Promise(resolve => setTimeout(resolve, 500))}
            />
            <Button
              variant="outlined"
              color="secondary"
              onClick={handleCloseDetalles}
              style={{ marginLeft: "10px" }}
            >
              Volver
            </Button>
          </Box>
        </Box>
      ) : (
        <>
          <FiltrosReportes
            empresas={empresasDeReportes.length > 0 ? empresasDeReportes : userEmpresas}
            formularios={formulariosDisponibles}
            empresasSeleccionadas={empresasSeleccionadas}
            formulariosSeleccionados={formulariosSeleccionados}
            fechaDesde={fechaDesde}
            fechaHasta={fechaHasta}
            onChangeEmpresas={setEmpresasSeleccionadas}
            onChangeFormularios={setFormulariosSeleccionados}
            onChangeFechaDesde={setFechaDesde}
            onChangeFechaHasta={setFechaHasta}
            searchTerm={searchTerm}
            onChangeSearchTerm={setSearchTerm}
            loading={loading}
          />
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Empresa</TableCell>
                  <TableCell>Sucursal</TableCell>
                  <TableCell>Formulario</TableCell>
                  <TableCell>Fecha de Guardado</TableCell>
                  <TableCell>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredReportes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                      <Typography variant="body2" color="textSecondary">
                        {selectedEmpresa 
                          ? "No se encontraron reportes para esta empresa"
                          : "No hay reportes disponibles"
                        }
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredReportes.map((reporte) => (
                    <TableRow key={reporte.id}>
                      <TableCell>{getNombreEmpresa(reporte, userEmpresas)}</TableCell>
                      <TableCell>{reporte.sucursal ?? "Sucursal no disponible"}</TableCell>
                      <TableCell>{getNombreFormulario(reporte.formulario, reporte.nombreForm)}</TableCell>
                      <TableCell>
                        {reporte.fechaCreacion
                          ? new Date(reporte.fechaCreacion).toLocaleString()
                          : "Fecha no disponible"}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={() => handleSelectReporte(reporte)}
                        >
                          Ver Detalles
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </Box>
  );
};

export default ReportesPage;
