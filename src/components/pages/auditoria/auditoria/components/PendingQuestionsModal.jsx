import React from "react";
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  Typography, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemIcon 
} from "@mui/material";
import WarningIcon from '@mui/icons-material/Warning';

const PendingQuestionsModal = ({ 
  open, 
  onClose, 
  preguntasNoContestadas, 
  onNavigateToQuestion 
}) => {
  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 'bold' }}>
        <WarningIcon color="warning" />
        Preguntas No Contestadas
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Haz clic en cualquier pregunta para navegar directamente a ella:
        </Typography>
        
        <List>
          {preguntasNoContestadas.map((item, index) => (
            <ListItem 
              key={index}
              button
              onClick={() => {
                onClose();
                onNavigateToQuestion(item.seccionIndex, item.preguntaIndex);
              }}
              sx={{ 
                border: '1px solid #ddd', 
                borderRadius: 1, 
                mb: 1,
                '&:hover': { backgroundColor: '#fff3e0' },
                cursor: 'pointer'
              }}
            >
              <ListItemIcon>
                <WarningIcon color="warning" />
              </ListItemIcon>
              <ListItemText
                primary={item.pregunta}
                secondary={`Sección: ${item.seccion}`}
                primaryTypographyProps={{ fontWeight: 500 }}
              />
            </ListItem>
          ))}
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PendingQuestionsModal; 