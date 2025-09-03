import React, { useState } from 'react';
import { 
  Button, 
  Tooltip,
  Badge
} from '@mui/material';
import { BugReport } from '@mui/icons-material';
import FirebaseDiagnosticModal from './FirebaseDiagnosticModal';

const FirebaseDiagnosticButton = ({ 
  variant = 'outlined', 
  size = 'small',
  showBadge = false,
  badgeContent = 0,
  children = 'Diagnóstico Firebase',
  ...props 
}) => {
  const [open, setOpen] = useState(false);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  return (
    <>
      <Tooltip title="Abrir diagnóstico de Firebase">
        <Button
          variant={variant}
          size={size}
          startIcon={<BugReport />}
          onClick={handleOpen}
          {...props}
        >
          {showBadge ? (
            <Badge badgeContent={badgeContent} color="error">
              {children}
            </Badge>
          ) : (
            children
          )}
        </Button>
      </Tooltip>

      <FirebaseDiagnosticModal 
        open={open} 
        onClose={handleClose} 
      />
    </>
  );
};

export default FirebaseDiagnosticButton;
