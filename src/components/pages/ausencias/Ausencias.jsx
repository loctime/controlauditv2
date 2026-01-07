import React, { useEffect, useMemo, useState } from "react";
import {
  Container,
  Paper,
  Box,
  Typography,
  Button,
  Stack,
  TextField,
  Chip,
  Divider,
  CircularProgress,
  Alert
} from "@mui/material";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import { useGlobalSelection } from "../../../hooks/useGlobalSelection";
import { useAusenciasData } from "./hooks/useAusenciasData";
import AusenciasFilters from "./components/AusenciasFilters";
import AusenciasTable from "./components/AusenciasTable";
import AusenciaFormDialog from "./components/AusenciaFormDialog";
import { getAusenciaTipos } from "../../../services/ausenciasService";
import { useAuth } from '@/components/context/AuthContext';

const defaultFilters = {
  tipo: "todos",
  estado: "activas",
  startDate: null,
  endDate: null,
  search: ""
};

export default function Ausencias() {
  const { userProfile } = useAuth();
  const {
    selectedEmpresa,
    setSelectedEmpresa,
    selectedSucursal,
    setSelectedSucursal,
    userEmpresas,
    userSucursales,
    sucursalesFiltradas
  } = useGlobalSelection();

  const [filters, setFilters] = useState(defaultFilters);
  const [openDialog, setOpenDialog] = useState(false);
  const [tipoOptions, setTipoOptions] = useState([]);

  const empresaSeleccionada = useMemo(
    () => userEmpresas?.find((empresa) => empresa.id === selectedEmpresa),
    [userEmpresas, selectedEmpresa]
  );

  const sucursalSeleccionada = useMemo(
    () => userSucursales?.find((sucursal) => sucursal.id === selectedSucursal),
    [userSucursales, selectedSucursal]
  );

  const { ausencias, loading, recargar } = useAusenciasData(
    selectedEmpresa,
    selectedSucursal,
    sucursalesFiltradas,
    filters
  );

  useEffect(() => {
    let active = true;
    const fetchTipos = async () => {
      const tipos = await getAusenciaTipos({}, userProfile);
      if (active) {
        setTipoOptions(tipos);
      }
    };
    fetchTipos();
    return () => {
      active = false;
    };
  }, []);

  const handleChangeFilters = (changedFilters) => {
    setFilters((prev) => ({
      ...prev,
      ...changedFilters
    }));
  };

  const handleResetFilters = () => {
    setFilters(defaultFilters);
  };

  const totalActivas = useMemo(
    () =>
      ausencias.filter((ausencia) => {
        const estado = (ausencia.estado || "abierto").toLowerCase();
        return estado !== "cerrada" && estado !== "cerrado";
      }).length,
    [ausencias]
  );

  const totalOcupacionales = useMemo(
    () =>
      ausencias.filter((ausencia) => {
        const tipo =
          ausencia.tipo ||
          ausencia.clasificacion ||
          ausencia.categoria ||
          "";
        return tipo.toLowerCase().includes("ocupacional");
      }).length,
    [ausencias]
  );

  const totalPorTipo = useMemo(() => {
    const counts = ausencias.reduce((acc, ausencia) => {
      const rawTipo =
        ausencia.tipo ||
        ausencia.categoria ||
        ausencia.clasificacion ||
        ausencia.etiqueta ||
        "";
      const normalized = rawTipo.trim() || "Sin tipo";
      acc[normalized] = (acc[normalized] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);
  }, [ausencias]);

  const handleTipoAdded = (nuevoTipo) => {
    const normalized = (nuevoTipo || "").trim();
    if (!normalized) return;
    setTipoOptions((prev) => {
      const exists = prev.some(
        (tipo) => tipo.toLowerCase() === normalized.toLowerCase()
      );
      if (exists) return prev;
      return [...prev, normalized].sort((a, b) =>
        a.localeCompare(b, "es", { sensitivity: "base" })
      );
    });
  };

  const handleTipoRemoved = (tipo) => {
    const normalized = (tipo || "").trim();
    if (!normalized) return;
    setTipoOptions((prev) =>
      prev.filter(
        (item) => item.toLowerCase() !== normalized.toLowerCase()
      )
    );
    setFilters((prev) => {
      if (prev.tipo.toLowerCase?.() === normalized.toLowerCase()) {
        return { ...prev, tipo: "todos" };
      }
      return prev;
    });
  };

  const canCreate =
    selectedEmpresa &&
    selectedSucursal &&
    selectedSucursal !== "todas" &&
    userEmpresas?.length > 0;

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Paper
        elevation={2}
        sx={{
          p: { xs: 2, md: 3 },
          borderRadius: "18px",
          border: "1px solid #e5e7eb"
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            flexWrap: "wrap",
            justifyContent: "space-between",
            gap: 2,
            mb: 3
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <LocalHospitalIcon sx={{ color: "#16a34a", fontSize: 32 }} />
            <Box>
              <Typography
                variant="h5"
                sx={{ fontWeight: 700, color: "#111827" }}
              >
                Salud Ocupacional
              </Typography>
              <Typography variant="body2" sx={{ color: "#6b7280" }}>
                Gestiona ausencias, enfermedades y licencias médicas del
                personal.
              </Typography>
            </Box>
          </Box>

          <Button
            variant="contained"
            startIcon={<AddCircleIcon />}
            onClick={() => setOpenDialog(true)}
            disabled={!canCreate}
            sx={{
              textTransform: "none",
              fontWeight: 600,
              borderRadius: "14px",
              px: 2.5,
              py: 1.2,
              boxShadow: "0 10px 30px rgba(22,163,74,0.25)",
              background:
                "linear-gradient(135deg, rgba(22,163,74,1) 0%, rgba(34,197,94,1) 100%)"
            }}
          >
            Registrar ausencia
          </Button>
        </Box>

        {!canCreate && (
          <Alert
            severity="info"
            sx={{ mb: 3 }}
          >
            Selecciona una empresa y sucursal específica para habilitar el
            registro de ausencias.
          </Alert>
        )}

        <AusenciasFilters
          selectedEmpresa={selectedEmpresa}
          setSelectedEmpresa={setSelectedEmpresa}
          selectedSucursal={selectedSucursal}
          setSelectedSucursal={setSelectedSucursal}
          userEmpresas={userEmpresas}
          userSucursales={userSucursales}
          tipoOptions={tipoOptions}
          filters={filters}
          onChangeFilters={handleChangeFilters}
          onResetFilters={handleResetFilters}
        />

        <Paper
          elevation={0}
          sx={{
            p: 2,
            borderRadius: "16px",
            border: "1px solid #e5e7eb",
            backgroundColor: "#f9fafb",
            mb: 3
          }}
        >
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.5}
            alignItems={{ xs: "flex-start", sm: "center" }}
          >
            <TextField
              fullWidth
              size="small"
              placeholder="Buscar por persona o descripción..."
              value={filters.search}
              onChange={(event) =>
                handleChangeFilters({ search: event.target.value })
              }
            />

            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              <Chip
                label={`Activas: ${totalActivas}`}
                color="success"
                variant="outlined"
              />
              <Chip
                label={`Ocupacionales: ${totalOcupacionales}`}
                color="secondary"
                variant="outlined"
              />
              {totalPorTipo.map((item) => (
                <Chip
                  key={item.label}
                  label={`${item.label}: ${item.value}`}
                  variant="outlined"
                />
              ))}
            </Box>
          </Stack>
        </Paper>

        <Divider sx={{ mb: 3 }} />

        {loading ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              py: 6
            }}
          >
            <CircularProgress />
          </Box>
        ) : (
          <AusenciasTable
            ausencias={ausencias}
            onRecargar={recargar}
          />
        )}
      </Paper>

      <AusenciaFormDialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        empresa={empresaSeleccionada}
        sucursal={sucursalSeleccionada}
        selectedEmpresa={selectedEmpresa}
        selectedSucursal={selectedSucursal}
        tipoOptions={tipoOptions}
        onAddTipo={handleTipoAdded}
        onRemoveTipo={handleTipoRemoved}
        onSaved={async () => {
          await recargar();
          const tiposActualizados = await getAusenciaTipos({}, userProfile);
          setTipoOptions(tiposActualizados);
          setOpenDialog(false);
        }}
      />
    </Container>
  );
}


