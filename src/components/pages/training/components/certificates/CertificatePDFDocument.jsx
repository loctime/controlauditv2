import React from 'react';
import { pdf, Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    paddingHorizontal: 48,
    paddingVertical: 40,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
    fontFamily: 'Helvetica'
  },
  header: {
    alignItems: 'center',
    marginBottom: 24
  },
  logo: {
    width: 64,
    height: 64,
    marginBottom: 8
  },
  companyName: {
    fontSize: 14,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  title: {
    fontSize: 32,
    marginBottom: 24,
    textAlign: 'center',
    fontWeight: 'bold'
  },
  body: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 1.6,
    maxWidth: '80%'
  },
  intro: {
    fontSize: 11,
    marginBottom: 8
  },
  employeeName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8
  },
  line: {
    marginTop: 4
  },
  section: {
    marginTop: 16
  },
  sectionTitle: {
    fontSize: 11,
    textTransform: 'uppercase',
    marginBottom: 4
  },
  divider: {
    marginTop: 20,
    marginBottom: 12,
    borderTopWidth: 1,
    borderTopColor: '#cccccc',
    borderTopStyle: 'solid',
    width: '80%'
  },
  footer: {
    marginTop: 8,
    fontSize: 10,
    textAlign: 'center'
  }
});

function formatDatePdf(value) {
  if (!value) return '';
  const d = value?.toDate ? value.toDate() : new Date(value);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('es-AR');
}

/**
 * Documento PDF para certificado de capacitación.
 * Props principales:
 * - employeeName
 * - trainingName
 * - realizationDate
 * - expiryDate (opcional)
 * - companyName (para header)
 * - branchName (opcional)
 * - instructorName (opcional)
 * - score (string, ej: "3/3", opcional)
 * - evaluationStatus (ej: "Aprobado", opcional)
 * - issuedAt (fecha de emisión)
 * - certificateId (string, puede ser generado)
 * - logoUrl (URL opcional del logo)
 */
export default function CertificatePDFDocument({
  employeeName = '',
  trainingName = '',
  realizationDate = null,
  expiryDate = null,
  companyName = '',
  branchName = '',
  instructorName = '',
  score = '',
  evaluationStatus = '',
  issuedAt = null,
  certificateId = '',
  logoUrl = ''
}) {
  const realizationStr = formatDatePdf(realizationDate);
  const expiryStr = formatDatePdf(expiryDate);
   const issuedStr = formatDatePdf(issuedAt);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          {logoUrl ? <Image src={logoUrl} style={styles.logo} /> : null}
          {companyName ? <Text style={styles.companyName}>{companyName}</Text> : null}
        </View>

        <Text style={styles.title}>CERTIFICADO</Text>

        <View style={styles.body}>
          <Text style={styles.intro}>Se certifica que</Text>
          <Text style={styles.employeeName}>{employeeName}</Text>
          <Text style={styles.line}>
            ha completado la capacitación &quot;{trainingName}&quot;.
          </Text>

          <View style={styles.section}>
            {realizationStr && (
              <Text style={styles.line}>Fecha de realización: {realizationStr}</Text>
            )}
            {expiryStr && (
              <Text style={styles.line}>Válido hasta: {expiryStr}</Text>
            )}
            {branchName && (
              <Text style={styles.line}>Sucursal: {branchName}</Text>
            )}
            {instructorName && (
              <Text style={styles.line}>Instructor: {instructorName}</Text>
            )}
            {score && (
              <Text style={styles.line}>Puntaje: {score}</Text>
            )}
            {evaluationStatus && (
              <Text style={styles.line}>Evaluación: {evaluationStatus}</Text>
            )}
          </View>

          <View style={styles.divider} />

          <View style={styles.footer}>
            {issuedStr && (
              <Text>Fecha de emisión: {issuedStr}</Text>
            )}
            {certificateId && (
              <Text>ID de certificado: {certificateId}</Text>
            )}
          </View>
        </View>
      </Page>
    </Document>
  );
}

/**
 * Genera el blob del PDF del certificado (solo frontend, @react-pdf/renderer).
 * @param {Object} data - { employeeName, trainingName, realizationDate, expiryDate, companyName, branchName, instructorName, score, evaluationStatus, issuedAt, certificateId, logoUrl }
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
      branchName={data.branchName || ''}
      instructorName={data.instructorName || ''}
      score={data.score || ''}
      evaluationStatus={data.evaluationStatus || ''}
      issuedAt={data.issuedAt ?? null}
      certificateId={data.certificateId || ''}
      logoUrl={data.logoUrl || ''}
    />
  );
  return pdf(doc).toBlob();
}
