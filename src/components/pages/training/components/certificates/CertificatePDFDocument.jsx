import React from 'react';
import { pdf, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'Helvetica'
  },
  title: {
    fontSize: 24,
    marginBottom: 24,
    textAlign: 'center'
  },
  body: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 1.6,
    maxWidth: '80%'
  },
  name: {
    fontSize: 14,
    marginTop: 16,
    marginBottom: 8
  },
  line: {
    marginTop: 8
  }
});

function formatDatePdf(value) {
  if (!value) return '';
  const d = value?.toDate ? value.toDate() : new Date(value);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('es-AR');
}

/**
 * Documento PDF simple para certificado de capacitación.
 * Props: employeeName, trainingName, realizationDate, expiryDate, companyName
 */
export default function CertificatePDFDocument({
  employeeName = '',
  trainingName = '',
  realizationDate = null,
  expiryDate = null,
  companyName = ''
}) {
  const realizationStr = formatDatePdf(realizationDate);
  const expiryStr = formatDatePdf(expiryDate);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>CERTIFICADO</Text>
        <View style={styles.body}>
          <Text style={styles.line}>Se certifica que</Text>
          <Text style={styles.name}>{employeeName}</Text>
          <Text style={styles.line}>
            realizó la capacitación &quot;{trainingName}&quot;
          </Text>
          {realizationStr && (
            <Text style={styles.line}>Fecha de realización: {realizationStr}</Text>
          )}
          {expiryStr && (
            <Text style={styles.line}>Válido hasta: {expiryStr}</Text>
          )}
          {companyName && (
            <Text style={styles.line}>Empresa: {companyName}</Text>
          )}
        </View>
      </Page>
    </Document>
  );
}

/**
 * Genera el blob del PDF del certificado (solo frontend, @react-pdf/renderer).
 * @param {Object} data - { employeeName, trainingName, realizationDate, expiryDate, companyName }
 * @returns {Promise<Blob>}
 */
export async function generateCertificatePDFBlob(data) {
  const doc = (
    <CertificatePDFDocument
      employeeName={data.employeeName || ''}
      trainingName={data.trainingName || ''}
      realizationDate={data.realizationDate ?? null}
      expiryDate={data.expiryDate ?? null}
      companyName={data.companyName || ''}
    />
  );
  return pdf(doc).toBlob();
}
