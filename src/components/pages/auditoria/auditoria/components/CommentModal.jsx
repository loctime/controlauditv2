import React from "react";
import { Modal, Box, Typography, TextField, Button } from "@mui/material";

const CommentModal = ({ 
  open, 
  onClose, 
  comentario, 
  onComentarioChange, 
  onGuardarComentario 
}) => {
  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={{ 
        position: 'absolute', 
        top: '50%', 
        left: '50%', 
        transform: 'translate(-50%, -50%)', 
        width: 400, 
        bgcolor: 'background.paper', 
        p: 4, 
        boxShadow: 24,
        borderRadius: 2
      }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>
          Agregar Comentario
        </Typography>
        <TextField
          fullWidth
          multiline
          rows={4}
          variant="outlined"
          value={comentario}
          onChange={onComentarioChange}
          autoFocus
          placeholder="Escribe tu comentario aquí..."
          inputRef={(input) => {
            if (input && open) {
              setTimeout(() => input.focus(), 100);
            }
          }}
          sx={{ mb: 2 }}
        />
        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
          <Button onClick={onClose} variant="outlined">
            Cancelar
          </Button>
          <Button onClick={onGuardarComentario} variant="contained" color="primary">
            Guardar
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default CommentModal; 