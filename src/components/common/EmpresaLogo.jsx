import React from 'react';
import { Box } from '@mui/material';
import PropTypes from 'prop-types';

const EmpresaLogo = ({ 
  logo, 
  nombre, 
  width = "50px", 
  height = "50px", 
  fontSize = "16px",
  showBorder = true 
}) => {
  if (!logo || logo.trim() === "") {
    return (
      <Box
        sx={{
          width,
          height,
          backgroundColor: "#f0f0f0",
          borderRadius: "4px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize,
          color: "#666",
          border: showBorder ? "2px dashed #ccc" : "none"
        }}
      >
        {nombre ? nombre.charAt(0).toUpperCase() : "E"}
      </Box>
    );
  }

  return (
    <img
      src={logo}
      alt={`Logo de ${nombre}`}
      style={{ 
        width, 
        height: "auto",
        maxHeight: height,
        objectFit: "contain"
      }}
      onError={(e) => {
        e.target.style.display = 'none';
        // Mostrar el fallback cuando la imagen falla
        const fallback = document.createElement('div');
        fallback.style.cssText = `
          width: ${width};
          height: ${height};
          background-color: #f0f0f0;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: ${fontSize};
          color: #666;
          border: ${showBorder ? '2px dashed #ccc' : 'none'};
        `;
        fallback.textContent = nombre ? nombre.charAt(0).toUpperCase() : "E";
        e.target.parentNode.appendChild(fallback);
      }}
    />
  );
};

EmpresaLogo.propTypes = {
  logo: PropTypes.string,
  nombre: PropTypes.string.isRequired,
  width: PropTypes.string,
  height: PropTypes.string,
  fontSize: PropTypes.string,
  showBorder: PropTypes.bool
};

export default EmpresaLogo; 