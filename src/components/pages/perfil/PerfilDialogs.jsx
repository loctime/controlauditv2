import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Typography } from '@mui/material';

const PerfilDialogs = ({
  openDialogSocio,
  setOpenDialogSocio,
  emailSocio,
  setEmailSocio,
  loading,
  handleAgregarSocio,
  openDialogCompartir,
  setOpenDialogCompartir,
  auditoriaSeleccionada,
  setAuditoriaSeleccionada,
  userAuditorias,
  emailCompartir,
  setEmailCompartir,
  handleCompartirAuditoria
}) => {
  // Log de depuración
  console.debug('[PerfilDialogs] render');
  return (
    <>
      {/* Dialog para agregar socio */}
      <Dialog open={openDialogSocio} onClose={() => setOpenDialogSocio(false)}>
        <DialogTitle>Agregar Socio</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Email del socio"
            type="email"
            fullWidth
            variant="outlined"
            value={emailSocio}
            onChange={(e) => setEmailSocio(e.target.value)}
            placeholder="usuario@ejemplo.com"
          />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Los socios podrán ver tus empresas y auditorías, y tú podrás ver las suyas.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialogSocio(false)}>Cancelar</Button>
          <Button 
            onClick={handleAgregarSocio} 
            variant="contained"
            disabled={loading}
          >
            {loading ? 'Agregando...' : 'Agregar Socio'}
          </Button>
        </DialogActions>
      </Dialog>
      {/* Dialog para compartir auditoría */}
      <Dialog open={openDialogCompartir} onClose={() => setOpenDialogCompartir(false)}>
        <DialogTitle>Compartir Auditoría</DialogTitle>
        <DialogContent>
          <TextField
            select
            margin="dense"
            label="Seleccionar Auditoría"
            fullWidth
            variant="outlined"
            value={auditoriaSeleccionada}
            onChange={(e) => setAuditoriaSeleccionada(e.target.value)}
            sx={{ mb: 2 }}
          >
            {userAuditorias && userAuditorias.map((auditoria) => (
              <option key={auditoria.id} value={auditoria.id}>
                {auditoria.nombreArchivo || 'Auditoría sin nombre'}
              </option>
            ))}
          </TextField>
          <TextField
            margin="dense"
            label="Email del usuario"
            type="email"
            fullWidth
            variant="outlined"
            value={emailCompartir}
            onChange={(e) => setEmailCompartir(e.target.value)}
            placeholder="usuario@ejemplo.com"
          />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            El usuario podrá ver y copiar esta auditoría.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialogCompartir(false)}>Cancelar</Button>
          <Button 
            onClick={handleCompartirAuditoria} 
            variant="contained"
            disabled={loading}
          >
            {loading ? 'Compartiendo...' : 'Compartir Auditoría'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default PerfilDialogs;
