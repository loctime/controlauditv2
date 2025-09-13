import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControlLabel,
  Switch
} from '@mui/material';

const EditClienteDialog = ({ 
  open, 
  onClose, 
  clienteEditando, 
  form, 
  setForm, 
  onSave 
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Editar Cliente: {clienteEditando?.nombre || clienteEditando?.email}
      </DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Límite de Usuarios"
          type="number"
          fullWidth
          value={form.limiteUsuarios}
          onChange={(e) => setForm({ ...form, limiteUsuarios: e.target.value })}
          inputProps={{ min: 1 }}
        />
        <TextField
          margin="dense"
          label="Plan"
          select
          fullWidth
          value={form.plan}
          onChange={(e) => setForm({ ...form, plan: e.target.value })}
          SelectProps={{ native: true }}
        >
          <option value="basico">Básico</option>
          <option value="estandar">Estándar</option>
          <option value="premium">Premium</option>
        </TextField>
        <TextField
          margin="dense"
          label="Estado de Pago"
          select
          fullWidth
          value={form.estadoPago}
          onChange={(e) => setForm({ ...form, estadoPago: e.target.value })}
          SelectProps={{ native: true }}
        >
          <option value="al_dia">Al día</option>
          <option value="pendiente">Pendiente</option>
          <option value="vencido">Vencido</option>
        </TextField>
        <TextField
          margin="dense"
          label="Fecha de Vencimiento (editable)"
          type="date"
          fullWidth
          value={form.fechaVencimiento}
          onChange={(e) => setForm({ ...form, fechaVencimiento: e.target.value })}
          InputLabelProps={{ shrink: true }}
        />
        <FormControlLabel
          control={
            <Switch
              checked={form.esDemo}
              onChange={(e) => setForm({ ...form, esDemo: e.target.checked })}
            />
          }
          label="Es Demo"
          sx={{ mt: 1 }}
        />
        <FormControlLabel
          control={
            <Switch
              checked={form.activo}
              onChange={(e) => setForm({ ...form, activo: e.target.checked })}
            />
          }
          label="Activo"
          sx={{ mt: 1 }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={onSave} variant="contained">
          Guardar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditClienteDialog;
