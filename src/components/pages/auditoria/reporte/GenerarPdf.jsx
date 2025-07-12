import React, { useState, useEffect, useRef } from "react";
import { collection, getDocs } from "firebase/firestore";
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
} from "@mui/material";
import "./ReportesPage.css";
import FiltrosReportes from "./FiltrosReportes";
import { useAuth } from "../../../context/AuthContext";

// Helpers seguros para obtener nombre de empresa y formulario
const getNombreEmpresa = (empresa) =>
  typeof empresa === "object" && empresa && empresa.nombre
    ? empresa.nombre
    : typeof empresa === "string"
    ? empresa
    : "Empresa no disponible";

const getNombreFormulario = (formulario, nombreForm) =>
  nombreForm ||
  (typeof formulario === "object" && formulario && formulario.nombre
    ? formulario.nombre
    : typeof formulario === "string"
    ? formulario
    : "Formulario no disponible");

const ReportesPage = () => {
  const { userProfile, userAuditorias, auditoriasCompartidas, canViewAuditoria } = useAuth();
  const [reportes, setReportes] = useState([]);
  const [filteredReportes, setFilteredReportes] = useState([]);
  const [selectedReporte, setSelectedReporte] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEmpresa, setSelectedEmpresa] = useState("");
  const detalleRef = useRef();

  useEffect(() => {
    const fetchReportes = async () => {
      try {
        if (!userProfile) return;
        
        const querySnapshot = await getDocs(collection(db, "reportes"));
        const todasLasAuditorias = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Filtrar auditorías que el usuario puede ver
        const auditoriasPermitidas = todasLasAuditorias.filter(auditoria => 
          canViewAuditoria(auditoria.id)
        );

        auditoriasPermitidas.sort((a, b) => {
          const fechaA = a.fechaGuardado
            ? new Date(a.fechaGuardado.seconds * 1000)
            : new Date(0);
          const fechaB = b.fechaGuardado
            ? new Date(b.fechaGuardado.seconds * 1000)
            : new Date(0);
          return fechaB - fechaA;
        });

        setReportes(auditoriasPermitidas);
        setFilteredReportes(auditoriasPermitidas);
      } catch (error) {
        setError("Error al obtener reportes: " + error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchReportes();
  }, [userProfile, canViewAuditoria]);

  useEffect(() => {
    if (selectedEmpresa) {
      setFilteredReportes(
        reportes.filter((reporte) => getNombreEmpresa(reporte.empresa) === selectedEmpresa)
      );
    } else {
      setFilteredReportes(reportes);
    }
  }, [selectedEmpresa, reportes]);

  const handleSelectReporte = (reporte) => {
    setSelectedReporte(reporte);
  };

  const handleCloseDetalles = () => {
    setSelectedReporte(null);
  };

  const handleChangeEmpresa = (event) => {
    setSelectedEmpresa(event.target.value);
  };

  // Función para imprimir el contenido del reporte
  const handlePrintReport = () => {
    // Opcional: si deseas imprimir solo la sección del reporte,
    // podrías abrir una nueva ventana con el contenido de "detalleRef.current".
    // En este ejemplo, se imprimirá la ventana actual.
    window.print();
  };

  if (loading) return <Typography>Cargando reportes...</Typography>;
  if (error) return <Typography color="error">{error}</Typography>;

  const empresas = [...new Set(reportes.map((reporte) => getNombreEmpresa(reporte.empresa)).filter(Boolean))];

  return (
    <Box className="reportes-container" p={3}>
      {selectedReporte ? (
        <Box ref={detalleRef} className="public-report-content">
          <Box className="membrete" mb={3}>
            <Typography variant="h4">
              {getNombreEmpresa(selectedReporte.empresa)}
            </Typography>
            <Typography variant="h6">
              Sucursal: {selectedReporte.sucursal ?? "Sucursal no disponible"}
            </Typography>
            <Typography variant="h6">
              Fecha:{" "}
              {selectedReporte.fechaGuardado
                ? new Date(selectedReporte.fechaGuardado.seconds * 1000).toLocaleString()
                : "Fecha no disponible"}
            </Typography>
          </Box>

          {selectedReporte.imagenes &&
            selectedReporte.imagenes.map((imagen, idx) => (
              <Box key={idx} className="imagen-detalle" mb={3} textAlign="center">
                <img
                  src={imagen}
                  alt="Imagen Auditoría"
                  style={{
                    width: "100%",
                    maxWidth: "600px",
                    borderRadius: "10px",
                    boxShadow: "0px 4px 6px rgba(0,0,0,0.1)",
                  }}
                />
                <TableContainer component={Paper} style={{ marginTop: "15px" }}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Formulario</TableCell>
                        <TableCell>Sección</TableCell>
                        <TableCell>Pregunta</TableCell>
                        <TableCell>Respuesta</TableCell>
                        <TableCell>Comentario</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow>
                        <TableCell>{getNombreFormulario(selectedReporte.formulario, selectedReporte.nombreForm)}</TableCell>
                        <TableCell>
                          {selectedReporte.secciones?.[idx]?.nombre ?? "Sección no disponible"}
                        </TableCell>
                        <TableCell>
                          {selectedReporte.secciones?.[idx]?.preguntas?.[idx] ?? "Pregunta no disponible"}
                        </TableCell>
                        <TableCell>
                          {selectedReporte.respuestas?.[idx] ?? "Respuesta no disponible"}
                        </TableCell>
                        <TableCell>
                          {selectedReporte.comentarios?.[idx] ?? "Comentario no disponible"}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            ))}

          <Box display="flex" justifyContent="flex-end">
            <Button
              variant="contained"
              color="primary"
              onClick={handlePrintReport}
              style={{ padding: "10px", minWidth: "50px", minHeight: "50px" }}
            >
              Imprimir
            </Button>
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
            empresas={empresas.map((nombre) => ({ nombre }))}
            empresaSeleccionada={selectedEmpresa}
            onChangeEmpresa={handleChangeEmpresa}
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
                {filteredReportes.map((reporte) => (
                  <TableRow key={reporte.id}>
                    <TableCell>{getNombreEmpresa(reporte.empresa)}</TableCell>
                    <TableCell>{reporte.sucursal ?? "Sucursal no disponible"}</TableCell>
                    <TableCell>{getNombreFormulario(reporte.formulario, reporte.nombreForm)}</TableCell>
                    <TableCell>
                      {reporte.fechaGuardado
                        ? new Date(reporte.fechaGuardado.seconds * 1000).toLocaleString()
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
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </Box>
  );
};

export default ReportesPage;
