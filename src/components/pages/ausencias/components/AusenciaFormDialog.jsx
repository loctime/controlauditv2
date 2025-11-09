import React, { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Checkbox,
  FormControlLabel
} from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { createAusencia } from "../../../../services/ausenciasService";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy
} from "firebase/firestore";
import { db } from "../../../../firebaseConfig";
import dayjs from "dayjs";

const getInitialState = () => ({
  empleadoId: "",
  tipo: "",
  estado: "abierta",
  fechaInicio: dayjs(),
  fechaFin: null,
  observaciones: "",
  horasPorDia: "",
  relacionAccidente: false,
  accidenteId: ""
});

const normalizeEmployees = (snapshot) =>
  snapshot.docs.map((docSnapshot) => ({
    id: docSnapshot.id,
    ...docSnapshot.data()
  }));

export default function AusenciaFormDialog({
  open,
  onClose,
  empresa,
  sucursal,
  selectedEmpresa,
  selectedSucursal,
  tipoOptions = [],
  onAddTipo,
  onSaved
}) {
  const [form, setForm] = useState(getInitialState);
  const [empleados, setEmpleados] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const sucursalNombre = sucursal?.nombre || sucursal?.alias || "";
  const empresaNombre = empresa?.nombre || empresa?.razonSocial || "";

  const canSubmit = useMemo(() => {
    const fechaInicioValida =
      form.fechaInicio &&
      (typeof form.fechaInicio?.isValid === "function"
        ? form.fechaInicio.isValid()
        : true);
    return (
      selectedEmpresa &&
      selectedSucursal &&
      selectedSucursal !== "todas" &&
      form.empleadoId &&
      fechaInicioValida
    );
  }, [selectedEmpresa, selectedSucursal, form.empleadoId, form.fechaInicio]);

  const tipoSuggestions = useMemo(() => {
    const base = Array.isArray(tipoOptions) ? tipoOptions : [];
    const unique = new Set(
      base
        .map((tipo) => (typeof tipo === "string" ? tipo.trim() : ""))
        .filter(Boolean)
    );
    if (form.tipo && !unique.has(form.tipo.trim())) {
      unique.add(form.tipo.trim());
    }
    return Array.from(unique).sort((a, b) =>
      a.localeCompare(b, "es", { sensitivity: "base" })
    );
  }, [tipoOptions, form.tipo]);

  useEffect(() => {
    if (!open) return;
    setForm((prev) => ({
      ...getInitialState(),
      fechaInicio: dayjs(),
      estado: "abierta"
    }));
    setError("");
  }, [open]);

  useEffect(() => {
    const fetchEmployees = async () => {
      if (!open || !selectedSucursal || selectedSucursal === "todas") {
        setEmpleados([]);
        return;
      }
      setLoadingEmployees(true);
      try {
        const empleadosRef = collection(db, "empleados");
        const q = query(
          empleadosRef,
          where("sucursalId", "==", selectedSucursal),
          orderBy("nombre", "asc")
        );
        const snapshot = await getDocs(q);
        setEmpleados(normalizeEmployees(snapshot));
      } catch (fetchError) {
        console.error("Error cargando empleados:", fetchError);
        setEmpleados([]);
      } finally {
        setLoadingEmployees(false);
      }
    };
    fetchEmployees();
  }, [open, selectedSucursal]);

  const handleChange = (field) => (event) => {
    const value =
      event && event.target ? event.target.value : event?.target?.checked;
    setForm((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async () => {
    if (!canSubmit) {
      setError("Completa los campos obligatorios.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const empleadoSeleccionado = empleados.find(
        (emp) => emp.id === form.empleadoId
      );

      const fechaInicio = form.fechaInicio?.toDate
        ? form.fechaInicio.toDate()
        : form.fechaInicio || null;
      const fechaFin = form.fechaFin?.toDate
        ? form.fechaFin.toDate()
        : form.fechaFin || null;

      await createAusencia({
        empresaId: selectedEmpresa === "todas" ? null : selectedEmpresa,
        sucursalId: selectedSucursal,
        empresaNombre,
        sucursalNombre,
        empleadoId: form.empleadoId,
        empleadoNombre:
          empleadoSeleccionado?.nombre ||
          empleadoSeleccionado?.displayName ||
          "Empleado sin nombre",
        tipo: form.tipo,
        estado: form.estado,
        fechaInicio,
        fechaFin,
        observaciones: form.observaciones,
        horasPorDia:
          form.horasPorDia !== ""
            ? Number.parseFloat(form.horasPorDia)
            : undefined,
        relacionAccidente: form.relacionAccidente
          ? form.accidenteId || true
          : null
      });

      const tipoNormalizado = (form.tipo || "").trim();
      if (tipoNormalizado && typeof onAddTipo === "function") {
        onAddTipo(tipoNormalizado);
      }

      if (onSaved) {
        await onSaved();
      }
      setForm(getInitialState());
    } catch (submitError) {
      console.error("Error creando ausencia:", submitError);
      setError(
        "No se pudo crear la ausencia. Verifica los datos e intenta nuevamente."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>
        Registrar ausencia por salud
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <Stack spacing={0.5}>
            <TextField
              label="Empresa"
              value={
                empresaNombre ||
                (selectedEmpresa === "todas"
                  ? "Todas las empresas"
                  : "Sin empresa")
              }
              variant="outlined"
              size="small"
              fullWidth
              InputProps={{ readOnly: true }}
            />
            <TextField
              label="Sucursal"
              value={
                sucursalNombre ||
                (selectedSucursal === "todas"
                  ? "Todas las sucursales"
                  : "Sin sucursal")
              }
              variant="outlined"
              size="small"
              fullWidth
              InputProps={{ readOnly: true }}
            />
          </Stack>

          <FormControl fullWidth size="small">
            <InputLabel>Empleado</InputLabel>
            <Select
              label="Empleado"
              value={form.empleadoId}
              onChange={handleChange("empleadoId")}
              disabled={
                loadingEmployees ||
                !selectedSucursal ||
                selectedSucursal === "todas"
              }
            >
              <MenuItem value="">Selecciona un empleado</MenuItem>
              {empleados.map((empleado) => (
                <MenuItem key={empleado.id} value={empleado.id}>
                  {empleado.nombre ||
                    empleado.displayName ||
                    `${empleado.apellido || ""} ${empleado.nombre || ""}` ||
                    empleado.id}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {loadingEmployees && (
            <Stack direction="row" spacing={1} alignItems="center">
          <CircularProgress size={18} />
              <span>Cargando empleados...</span>
            </Stack>
          )}

          <Autocomplete
            freeSolo
            clearOnBlur
            handleHomeEndKeys
            options={tipoSuggestions}
            value={form.tipo || ""}
            onChange={(_, newValue) => {
              const nextValue = (newValue || "").trim();
              setForm((prev) => ({
                ...prev,
                tipo: nextValue
              }));
            }}
            onInputChange={(_, newInputValue) => {
              setForm((prev) => ({
                ...prev,
                tipo: newInputValue
              }));
            }}
            renderInput={(params) => (
              <TextField {...params} label="Tipo" size="small" fullWidth />
            )}
            fullWidth
          />

          <DatePicker
            label="Fecha inicio"
            value={form.fechaInicio}
            onChange={(value) => setForm((prev) => ({ ...prev, fechaInicio: value }))}
            slotProps={{
              textField: {
                size: "small",
                fullWidth: true
              }
            }}
          />

          <DatePicker
            label="Fecha fin (opcional)"
            value={form.fechaFin}
            onChange={(value) => setForm((prev) => ({ ...prev, fechaFin: value }))}
            slotProps={{
              textField: {
                size: "small",
                fullWidth: true
              }
            }}
          />

          <TextField
            label="Horas por día (opcional)"
            type="number"
            size="small"
            value={form.horasPorDia}
            onChange={handleChange("horasPorDia")}
            fullWidth
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={form.relacionAccidente}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    relacionAccidente: event.target.checked
                  }))
                }
              />
            }
            label="Relacionado a accidente"
          />

          {form.relacionAccidente && (
            <TextField
              label="Referencia accidente (opcional)"
              size="small"
              value={form.accidenteId}
              onChange={handleChange("accidenteId")}
              fullWidth
            />
          )}

          <TextField
            label="Observaciones"
            size="small"
            value={form.observaciones}
            onChange={handleChange("observaciones")}
            fullWidth
            multiline
            minRows={3}
          />

          {error && (
            <Alert severity="error" onClose={() => setError("")}>
              {error}
            </Alert>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={onClose}
          sx={{ textTransform: "none" }}
          disabled={submitting}
        >
          Cancelar
        </Button>
        <Button
          variant="contained"
          sx={{ textTransform: "none", fontWeight: 600 }}
          onClick={handleSubmit}
          disabled={!canSubmit || submitting}
        >
          {submitting ? "Guardando..." : "Guardar ausencia"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}


