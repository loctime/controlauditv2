import React from 'react';
import {
  Container,
  Typography,
  Box,
  Divider,
  List,
  ListItem,
  ListItemText,
  Button,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';

const Section = ({ number, title, children }) => (
  <Box sx={{ mb: 3 }}>
    <Typography variant="h6" fontWeight={600} gutterBottom>
      {number}. {title}
    </Typography>
    {children}
  </Box>
);

const SubSection = ({ title, children }) => (
  <Box sx={{ mt: 1.5, mb: 1 }}>
    <Typography variant="subtitle2" fontWeight={600} gutterBottom>
      {title}
    </Typography>
    {children}
  </Box>
);

const BulletList = ({ items }) => (
  <List dense disablePadding sx={{ pl: 1 }}>
    {items.map((item, i) => (
      <ListItem key={i} disableGutters sx={{ alignItems: 'flex-start', py: 0.25 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mr: 1, mt: 0.1 }}>•</Typography>
        <ListItemText
          primary={item}
          primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
        />
      </ListItem>
    ))}
  </List>
);

const PoliticaDePrivacidad = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="md" sx={{ py: 5 }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate(-1)}
        sx={{ mb: 3 }}
        color="inherit"
      >
        Volver
      </Button>

      <Box sx={{ mb: 4 }}>
        <Typography variant="overline" color="text.secondary">
          ControlAudit — Bariloche, Argentina · Abril 2025
        </Typography>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Política de Privacidad
        </Typography>
        <Divider />
      </Box>

      <Section number={1} title="Responsable del Tratamiento de Datos">
        <Typography variant="body2" color="text.secondary" paragraph>
          ControlAudit es el responsable del tratamiento de los datos personales recolectados a través de la
          Plataforma, de conformidad con la Ley Nacional N° 25.326 de Protección de Datos Personales de la
          República Argentina y su normativa reglamentaria.
        </Typography>
        <Typography variant="body2" color="text.secondary">
          El responsable de la base de datos se encuentra inscripto ante la Dirección Nacional de Protección de
          Datos Personales (DNPDP) o en proceso de inscripción conforme a la normativa vigente.
        </Typography>
      </Section>

      <Section number={2} title="Datos que Recolectamos">
        <SubSection title="2.1 Datos de cuenta y perfil">
          <BulletList items={[
            'Nombre y apellido',
            'Correo electrónico',
            'Número de teléfono (opcional)',
            'Rol dentro de la organización',
          ]} />
        </SubSection>
        <SubSection title="2.2 Datos de la organización">
          <BulletList items={[
            'Nombre de la empresa o razón social',
            'CUIT / CUIL',
            'Domicilio y sucursales',
            'Logotipos e imágenes institucionales',
          ]} />
        </SubSection>
        <SubSection title="2.3 Datos operativos">
          <BulletList items={[
            'Registros de auditorías e inspecciones',
            'Informes de accidentes e incidentes laborales',
            'Registros de asistencia a capacitaciones',
            'Datos de empleados (nombre, DNI, puesto, firma digital)',
            'Fotografías y documentos adjuntos cargados por el usuario',
            'Ubicación geográfica (cuando el usuario la habilita voluntariamente)',
          ]} />
        </SubSection>
        <SubSection title="2.4 Datos técnicos">
          <BulletList items={[
            'Dirección IP y tipo de dispositivo',
            'Navegador y versión del sistema operativo',
            'Logs de acceso y actividad en la Plataforma',
          ]} />
        </SubSection>
      </Section>

      <Section number={3} title="Finalidad del Tratamiento">
        <Typography variant="body2" color="text.secondary" paragraph>
          Los datos recolectados se utilizan exclusivamente para:
        </Typography>
        <BulletList items={[
          'Prestar el servicio de gestión de higiene y seguridad laboral.',
          'Generar reportes, estadísticas y documentación de cumplimiento normativo.',
          'Enviar notificaciones operativas relacionadas con el uso de la Plataforma.',
          'Brindar soporte técnico y atender consultas.',
          'Mejorar las funcionalidades y la experiencia del usuario.',
          'Cumplir con obligaciones legales aplicables.',
        ]} />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
          ControlAudit <strong>NO</strong> utiliza los datos de los usuarios con fines publicitarios ni los
          comercializa a terceros bajo ninguna circunstancia.
        </Typography>
      </Section>

      <Section number={4} title="Base Legal del Tratamiento">
        <Typography variant="body2" color="text.secondary" paragraph>
          El tratamiento de datos se sustenta en:
        </Typography>
        <BulletList items={[
          'El consentimiento informado del usuario al aceptar estos términos.',
          'La ejecución del contrato de servicio entre el usuario y ControlAudit.',
          'El cumplimiento de obligaciones legales aplicables en materia laboral y de seguridad.',
          'El interés legítimo de ControlAudit en mejorar y asegurar el correcto funcionamiento de la Plataforma.',
        ]} />
      </Section>

      <Section number={5} title="Datos de Empleados — Responsabilidad del Cliente">
        <Typography variant="body2" color="text.secondary" paragraph>
          Cuando el usuario carga datos personales de sus empleados en la Plataforma (nombres, DNI, firmas, etc.),
          actúa como responsable de dichos datos frente a esas personas. ControlAudit actúa como encargado del
          tratamiento en los términos del artículo 25 de la Ley 25.326.
        </Typography>
        <Typography variant="body2" color="text.secondary">
          El cliente es responsable de contar con el consentimiento adecuado de sus empleados para el registro y
          tratamiento de sus datos en la Plataforma.
        </Typography>
      </Section>

      <Section number={6} title="Compartición de Datos con Terceros">
        <Typography variant="body2" color="text.secondary" paragraph>
          ControlAudit puede compartir datos con terceros únicamente en los siguientes casos:
        </Typography>
        <BulletList items={[
          'Proveedores de infraestructura técnica (Firebase / Google Cloud) bajo acuerdos de confidencialidad y cumplimiento de normativa de protección de datos.',
          'Servicios de almacenamiento de archivos (Backblaze B2) bajo acuerdos de seguridad y confidencialidad.',
          'Requerimiento de autoridades judiciales o administrativas competentes conforme a la ley argentina.',
        ]} />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
          En ningún caso ControlAudit vende, alquila ni cede datos personales a terceros con fines comerciales.
        </Typography>
      </Section>

      <Section number={7} title="Almacenamiento y Seguridad">
        <Typography variant="body2" color="text.secondary" paragraph>
          Los datos se almacenan en servidores con medidas técnicas y organizativas adecuadas, incluyendo:
        </Typography>
        <BulletList items={[
          'Cifrado de datos en tránsito (HTTPS/TLS).',
          'Autenticación segura mediante Firebase Authentication.',
          'Reglas de acceso por roles (administrador, operario).',
          'Copias de seguridad periódicas.',
        ]} />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
          No obstante, ningún sistema es 100% infalible. ControlAudit notificará a los usuarios afectados ante
          cualquier incidente de seguridad que comprometa sus datos, dentro de los plazos que establece la
          normativa aplicable.
        </Typography>
      </Section>

      <Section number={8} title="Retención de Datos">
        <Typography variant="body2" color="text.secondary" paragraph>
          Los datos se conservan mientras el usuario mantenga activa su cuenta. Ante la cancelación:
        </Typography>
        <BulletList items={[
          'El usuario puede solicitar la exportación de sus datos dentro de los 30 días posteriores a la baja.',
          'Transcurrido ese plazo, ControlAudit procederá a la eliminación o anonimización de los datos, salvo obligación legal de conservación.',
        ]} />
      </Section>

      <Section number={9} title="Derechos del Usuario (ARCO)">
        <Typography variant="body2" color="text.secondary" paragraph>
          Conforme a la Ley 25.326, el usuario titular de datos personales tiene derecho a:
        </Typography>
        <BulletList items={[
          'Acceso: conocer qué datos personales tiene ControlAudit sobre él.',
          'Rectificación: corregir datos inexactos o incompletos.',
          'Cancelación: solicitar la eliminación de sus datos cuando no sean necesarios.',
          'Oposición: oponerse al tratamiento de sus datos en casos justificados.',
        ]} />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }} paragraph>
          Para ejercer estos derechos, el usuario puede comunicarse a través de los canales de soporte indicados
          en la Plataforma. ControlAudit responderá dentro de los plazos establecidos por la normativa vigente.
        </Typography>
        <Typography variant="body2" color="text.secondary">
          El usuario también puede presentar una reclamación ante la Dirección Nacional de Protección de Datos
          Personales (www.argentina.gob.ar/aaip/datospersonales).
        </Typography>
      </Section>

      <Section number={10} title="Cookies y Tecnologías Similares">
        <Typography variant="body2" color="text.secondary" paragraph>
          La Plataforma puede utilizar cookies y almacenamiento local del navegador para:
        </Typography>
        <BulletList items={[
          'Mantener la sesión activa del usuario.',
          'Recordar preferencias de configuración (modo oscuro, idioma, etc.).',
          'Mejorar el rendimiento y la experiencia de uso.',
        ]} />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
          No se utilizan cookies de seguimiento publicitario ni se comparten datos de navegación con redes
          publicitarias.
        </Typography>
      </Section>

      <Section number={11} title="Modificaciones a esta Política">
        <Typography variant="body2" color="text.secondary">
          ControlAudit puede actualizar esta Política de Privacidad. Los cambios serán notificados por correo
          electrónico o mediante aviso dentro de la Plataforma. El uso continuado del servicio luego de la
          notificación implica la aceptación de la política actualizada.
        </Typography>
      </Section>

      <Section number={12} title="Contacto">
        <Typography variant="body2" color="text.secondary">
          Para consultas, ejercicio de derechos o denuncias relacionadas con la privacidad de datos, el usuario
          puede contactarse a través de los canales de soporte disponibles en la Plataforma o al correo electrónico
          indicado en el sitio oficial de ControlAudit.
        </Typography>
      </Section>

      <Divider sx={{ my: 3 }} />
      <Typography variant="caption" color="text.disabled">
        ControlAudit © 2025 — Todos los derechos reservados. Cumple con la Ley 25.326 de Protección de Datos
        Personales de la República Argentina.
      </Typography>
    </Container>
  );
};

export default PoliticaDePrivacidad;
