import { generateCertificatePDFBlob } from '../../components/pages/training/components/certificates/CertificatePDFDocument';

export { generateCertificatePDFBlob };

/**
 * Descarga el PDF del certificado en el navegador (sin subir a storage).
 * @param {Blob} blob - PDF generado
 * @param {string} [fileName] - Nombre del archivo (ej: certificado-JuanPerez.pdf)
 */
export function downloadCertificatePDF(blob, fileName = 'certificado.pdf') {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.target = '_blank';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
