import React, { useState } from 'react';
import { IconButton, Menu, MenuItem } from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';

export default function CertificateActionsMenu({ onView, onDownload, onRevoke }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  return (
    <>
      <IconButton size="small" onClick={(event) => setAnchorEl(event.currentTarget)}>
        <MoreVertIcon fontSize="small" />
      </IconButton>
      <Menu anchorEl={anchorEl} open={open} onClose={() => setAnchorEl(null)}>
        <MenuItem onClick={() => { setAnchorEl(null); onView(); }}>Ver</MenuItem>
        <MenuItem onClick={() => { setAnchorEl(null); onDownload(); }}>Descargar</MenuItem>
        <MenuItem onClick={() => { setAnchorEl(null); onRevoke(); }}>Revocar</MenuItem>
      </Menu>
    </>
  );
}

