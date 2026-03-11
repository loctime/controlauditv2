import React from 'react';
import { Box, Alert, List, ListItem, ListItemText, Typography } from '@mui/material';
import { validateFiles, WARNING_FILE_SIZE } from '../../../services/fileValidationPolicy';

const BYTES_IN_MB = 1024 * 1024;

export default function UnifiedFileUploader({
  id,
  accept = '*/*',
  files = [],
  onFilesChange,
  disabled = false,
  helperText = 'Se permiten multiples archivos',
  inputProps = {}
}) {
  const [errors, setErrors] = React.useState([]);
  const [warnings, setWarnings] = React.useState([]);

  const handleChange = (event) => {
    const selected = Array.from(event.target.files || []);
    const result = validateFiles(selected);

    setErrors(result.rejected);
    setWarnings(result.warnings);

    const merged = [...files, ...result.accepted];
    if (onFilesChange) onFilesChange(merged, result);

    event.target.value = '';
  };

  return (
    <Box>
      <input
        id={id}
        type="file"
        multiple
        accept={accept}
        onChange={handleChange}
        disabled={disabled}
        {...inputProps}
      />

      {helperText ? (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
          {helperText} | Advertencia desde {Math.round(WARNING_FILE_SIZE / BYTES_IN_MB)}MB
        </Typography>
      ) : null}

      {warnings.length > 0 && (
        <Alert severity="warning" sx={{ mt: 1 }}>
          {warnings.map((w) => `${w.fileName}: ${w.warnings.map((item) => item.message).join(', ')}`).join(' | ')}
        </Alert>
      )}

      {errors.length > 0 && (
        <Alert severity="error" sx={{ mt: 1 }}>
          <List dense sx={{ py: 0 }}>
            {errors.map((error) => (
              <ListItem key={`${error.fileName}-${error.issues[0]?.code || 'ERR'}`} sx={{ px: 0 }}>
                <ListItemText
                  primary={error.fileName}
                  secondary={error.issues.map((issue) => issue.message).join(', ')}
                />
              </ListItem>
            ))}
          </List>
        </Alert>
      )}
    </Box>
  );
}
