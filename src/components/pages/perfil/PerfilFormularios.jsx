import React from 'react';
import {
  Box, Typography, ListItem, ListItemAvatar, Avatar, ListItemText, Alert,
  Accordion, AccordionSummary, AccordionDetails, Chip, Button, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, TextField
} from '@mui/material';
import { Draw as DrawIcon, ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import ShareIcon from '@mui/icons-material/Share';
import { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../firebaseConfig';
import { v4 as uuidv4 } from 'uuid';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { usePermissions } from '../admin/hooks/usePermissions';
import { useNavigate } from 'react-router-dom';

const PerfilFormularios = ({ formularios, loading }) => {
  // Log de depuración
  console.debug('[PerfilFormularios] formularios:', formularios);
  const [openShareId, setOpenShareId] = useState(null);
  const [shareLink, setShareLink] = useState('');
  const [copying, setCopying] = useState(false);
  const { canCompartirFormularios } = usePermissions();
  const navigate = useNavigate();

  const handleCompartir = async (form) => {
    if (!canCompartirFormularios) return;
    let publicSharedId = form.publicSharedId;
    if (!form.esPublico || !form.publicSharedId) {
      publicSharedId = uuidv4();
      await updateDoc(doc(db, 'formularios', form.id), {
        esPublico: true,
        publicSharedId
      });
      console.debug('[CompartirFormulario] Formulario actualizado como público:', form.id, publicSharedId);
    }
    const url = `${window.location.origin}/formularios/public/${publicSharedId}`;
    setShareLink(url);
    setOpenShareId(form.id);
  };

  const handleCopy = async () => {
    setCopying(true);
    await navigator.clipboard.writeText(shareLink);
    setTimeout(() => setCopying(false), 1000);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Mis Formularios</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            {formularios.length} formulario(s)
          </Typography>
          {/* Botón para ir a gestión de empresas */}
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              console.log('[PerfilFormularios] Navegando a /establecimiento');
              navigate('/editar');
            }}
            sx={{ ml: 2 }}
          >
            Gestionar Formularios
          </Button>
        </Box>
      </Box>
      {loading ? (
        <Alert severity="info">Cargando formularios...</Alert>
      ) : formularios.length === 0 ? (
        <Alert severity="info">No tienes formularios registrados.</Alert>
      ) : (
        formularios.map((form) => (
          <Accordion key={form.id} disableGutters>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <ListItem disableGutters>
                <ListItemAvatar>
                  <Avatar>
                    <DrawIcon />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={form.nombre}
                  secondary={form.descripcion || ''}
                />
                {form.esPublico && <Chip label="Público" size="small" color="success" sx={{ ml: 1 }} />}
                {Array.isArray(form.compartidoCon) && form.compartidoCon.length > 0 && (
                  <Chip label="Compartido" size="small" color="info" sx={{ ml: 1 }} />
                )}
              </ListItem>
            </AccordionSummary>
            <AccordionDetails>
              {/* Mostrar cantidad de secciones y preguntas */}
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                <strong>Secciones:</strong> {Array.isArray(form.secciones) ? form.secciones.length : 0}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                <strong>Preguntas:</strong> {Array.isArray(form.secciones) ? form.secciones.reduce((acc, s) => acc + (Array.isArray(s.preguntas) ? s.preguntas.length : 0), 0) : 0}
              </Typography>
              {form.version && (
                <Typography variant="body2" color="text.secondary">
                  <strong>Versión:</strong> {form.version}
                </Typography>
              )}
              {form.timestamp && (
                <Typography variant="body2" color="text.secondary">
                  <strong>Creado:</strong> {new Date(form.timestamp.seconds ? form.timestamp.seconds * 1000 : form.timestamp).toLocaleString('es-ES')}
                </Typography>
              )}
              {form.esPublico && (
                <Typography variant="body2" color="success.main">
                  Este formulario es público y puede ser usado por otros usuarios.
                </Typography>
              )}
              <Button
                variant="outlined"
                startIcon={<ShareIcon />}
                size="small"
                sx={{ mt: 2 }}
                disabled={!canCompartirFormularios}
                onClick={() => handleCompartir(form)}
              >
                Compartir
              </Button>
              <Dialog open={openShareId === form.id} onClose={() => setOpenShareId(null)}>
                <DialogTitle>Compartir Formulario</DialogTitle>
                <DialogContent>
                  <Typography>
                    ¡Listo! Comparte este link con otros administradores:
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                    <TextField
                      value={shareLink}
                      fullWidth
                      InputProps={{ readOnly: true }}
                      size="small"
                    />
                    <Button
                      onClick={handleCopy}
                      startIcon={<ContentCopyIcon />}
                      sx={{ ml: 1 }}
                      disabled={copying}
                    >
                      {copying ? 'Copiado!' : 'Copiar'}
                    </Button>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                    Cualquier administrador podrá ver y copiar este formulario a su sistema.
                  </Typography>
                </DialogContent>
                <DialogActions>
                  <Button onClick={() => setOpenShareId(null)}>Cerrar</Button>
                </DialogActions>
              </Dialog>
            </AccordionDetails>
          </Accordion>
        ))
      )}
    </Box>
  );
};

export default PerfilFormularios;
