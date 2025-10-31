import React, { memo } from 'react';
import { Modal, Box, Typography, TextField, Button } from '@mui/material';
import QuestionAnswerIcon from "@mui/icons-material/QuestionAnswer";

const ModalEditarPregunta = memo(({
  open,
  onClose,
  textoPregunta,
  onTextoChange,
  onGuardar
}) => {
  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={modalStyle}>
        <Box display="flex" alignItems="center" gap={2} mb={3}>
          <QuestionAnswerIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h5" fontWeight={700} color="primary">
            Editar Pregunta
          </Typography>
        </Box>
        <TextField
          fullWidth
          label="Texto de la Pregunta"
          value={textoPregunta}
          onChange={(e) => onTextoChange(e.target.value)}
          sx={{ mb: 3 }}
          autoFocus
          multiline
          rows={3}
        />
        <Box display="flex" gap={2} justifyContent="flex-end">
          <Button variant="outlined" onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            variant="contained" 
            onClick={onGuardar}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)'
              }
            }}
          >
            Guardar Cambios
          </Button>
        </Box>
      </Box>
    </Modal>
  );
});

const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: { xs: '90%', sm: 500 },
  bgcolor: 'background.paper',
  borderRadius: 3,
  boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
  p: 4,
  outline: 'none'
};

ModalEditarPregunta.displayName = 'ModalEditarPregunta';

export default ModalEditarPregunta;

