import React from "react";
import PropTypes from "prop-types";
import ReporteConImpresion from './ReporteConImpresion';
import { reconstruirDatosDesdeFirestore } from '../../../../utils/firestoreUtils';

// Wrapper para reconstruir datos y pasar a ReporteConImpresion
const ReporteWrapper = (props) => {
  // Si los datos vienen planos desde Firestore, reconstruirlos
  let datos = props;
  if (props.metadata) {
    datos = { ...props, ...reconstruirDatosDesdeFirestore(props) };
  }
  return <ReporteConImpresion {...datos} />;
};

ReporteWrapper.propTypes = {
  empresa: PropTypes.any,
  sucursal: PropTypes.any,
  respuestas: PropTypes.any,
  comentarios: PropTypes.any,
  imagenes: PropTypes.any,
  secciones: PropTypes.any,
  formularios: PropTypes.any,
  metadata: PropTypes.any,
};

export default ReporteWrapper;
