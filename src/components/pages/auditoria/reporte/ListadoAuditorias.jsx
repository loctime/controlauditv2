import React, { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
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
} from "@mui/material";

const ListadoAuditorias = ({ onSelect, empresaSeleccionada }) => {
  const [reportes, setReportes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { userProfile } = useAuth();

  useEffect(() => {
    const fetchReportes = async () => {
      if (!userProfile) return;
      try {
        // Filtrar por clienteAdminId (multi-tenant seguro)
        const q = query(
          collection(db, "reportes"),
          where("clienteAdminId", "==", userProfile.clienteAdminId || userProfile.uid)
        );
        const querySnapshot = await getDocs(q);
        const reportesData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        reportesData.sort((a, b) => {
          const fechaA = a.fecha
            ? new Date(a.fecha.seconds * 1000)
            : a.fechaGuardado
            ? new Date(a.fechaGuardado)
            : new Date(0);
          const fechaB = b.fecha
            ? new Date(b.fecha.seconds * 1000)
            : b.fechaGuardado
            ? new Date(b.fechaGuardado)
            : new Date(0);
          return fechaB - fechaA;
        });

        setReportes(reportesData);
        console.log("[DEBUG] Reportes filtrados por clienteAdminId:", reportesData);
      } catch (error) {
        setError("Error al obtener reportes: " + error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchReportes();
  }, [userProfile]);

  if (loading) return <Typography>Cargando reportes...</Typography>;
  if (error) return <Typography color="error">{error}</Typography>;

  // Filtrar los reportes si hay una empresa seleccionada
  const reportesFiltrados = empresaSeleccionada
    ? reportes.filter((reporte) => {
        const nombreEmpresa = typeof reporte.empresa === 'object' 
          ? reporte.empresa.nombre 
          : reporte.empresa;
        return nombreEmpresa === empresaSeleccionada;
      })
    : reportes;

  return (
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
          {reportesFiltrados.map((reporte) => {
            const nombreEmpresa = typeof reporte.empresa === 'object' 
              ? reporte.empresa.nombre 
              : reporte.empresa;
            
            const nombreFormulario = reporte.nombreForm || 
              (typeof reporte.formulario === 'object' 
                ? reporte.formulario.nombre 
                : reporte.formulario);
            
            const fecha = reporte.fecha
              ? new Date(reporte.fecha.seconds * 1000).toLocaleString()
              : reporte.fechaGuardado
              ? new Date(reporte.fechaGuardado).toLocaleString()
              : "Fecha no disponible";

            return (
              <TableRow key={reporte.id}>
                <TableCell>{nombreEmpresa || "Empresa no disponible"}</TableCell>
                <TableCell>{reporte.sucursal || "Sucursal no disponible"}</TableCell>
                <TableCell>{nombreFormulario || "Formulario no disponible"}</TableCell>
                <TableCell>{fecha}</TableCell>
                <TableCell>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => onSelect(reporte)}
                  >
                    Ver Detalles
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default ListadoAuditorias;
