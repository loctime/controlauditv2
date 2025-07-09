import React, { useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import PropTypes from 'prop-types';
import './Firma.css';
import { Button } from 'react-bootstrap';

const Firma = ({ title, setFirmaURL }) => {
  const sigCanvas = useRef({});

  const clearSignature = () => {
    sigCanvas.current.clear();
  };

  const saveSignature = () => {
    if (sigCanvas.current.isEmpty()) {
      alert('Please provide a signature first.');
    } else {
      // Obtener la URL de la imagen en base64
      const firmaDataUrl = sigCanvas.current.getTrimmedCanvas().toDataURL('image/png');
      setFirmaURL(firmaDataUrl);
    }
  };

  return (
    <div className="firma-container">
      <h2>{title}</h2>
      <SignatureCanvas
        ref={sigCanvas}
        canvasProps={{ width: 400, height: 100, className: 'sigCanvas' }}
      />
      <Button variant="secondary" onClick={clearSignature}>Clear</Button>
      <Button variant="primary" onClick={saveSignature}>Save</Button>
    </div>
  );
};

Firma.propTypes = {
  title: PropTypes.string.isRequired,
  setFirmaURL: PropTypes.func.isRequired,
};

export default Firma;
