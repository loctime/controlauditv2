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

const TerminosYCondiciones = () => {
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
          Términos y Condiciones de Uso
        </Typography>
        <Divider />
      </Box>

      <Section number={1} title="Aceptación de los Términos">
        <Typography variant="body2" color="text.secondary" paragraph>
          Al acceder y utilizar la plataforma ControlAudit (en adelante, "la Plataforma"), el usuario acepta en su
          totalidad los presentes Términos y Condiciones. Si el usuario actúa en representación de una empresa u
          organización, declara tener autoridad suficiente para vincular a dicha entidad a estos términos.
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Si no acepta estos términos, debe abstenerse de utilizar la Plataforma.
        </Typography>
      </Section>

      <Section number={2} title="Descripción del Servicio">
        <Typography variant="body2" color="text.secondary" paragraph>
          ControlAudit es una plataforma SaaS (Software as a Service) orientada a la gestión de higiene y seguridad
          laboral, que incluye funcionalidades de:
        </Typography>
        <BulletList items={[
          'Gestión de auditorías internas',
          'Registro y seguimiento de accidentes e incidentes',
          'Planificación y registro de capacitaciones',
          'Gestión de empleados y sucursales',
          'Reportes y dashboards de cumplimiento',
          'Firma digital y documentación adjunta',
        ]} />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
          El servicio se presta en modalidad online (SaaS) accesible desde navegadores web y como aplicación
          progresiva (PWA).
        </Typography>
      </Section>

      <Section number={3} title="Registro y Cuenta de Usuario">
        <SubSection title="3.1 Requisitos">
          <Typography variant="body2" color="text.secondary">
            Para utilizar la Plataforma es necesario crear una cuenta con datos verídicos y actualizados. El usuario
            es responsable de mantener la confidencialidad de sus credenciales de acceso.
          </Typography>
        </SubSection>
        <SubSection title="3.2 Tipos de usuarios">
          <BulletList items={[
            'Administrador: acceso completo a la configuración y gestión de la cuenta.',
            'Operario: acceso restringido según los permisos otorgados por el administrador.',
            'Superusuario: rol interno de ControlAudit para soporte técnico.',
          ]} />
        </SubSection>
        <SubSection title="3.3 Responsabilidad">
          <Typography variant="body2" color="text.secondary">
            El usuario es responsable de todas las actividades realizadas desde su cuenta. Debe notificar de
            inmediato a ControlAudit ante cualquier uso no autorizado.
          </Typography>
        </SubSection>
      </Section>

      <Section number={4} title="Uso Aceptable">
        <Typography variant="body2" color="text.secondary" paragraph>
          El usuario se compromete a utilizar la Plataforma exclusivamente para fines lícitos y relacionados con la
          gestión de seguridad e higiene laboral. Queda expresamente prohibido:
        </Typography>
        <BulletList items={[
          'Cargar contenido falso, fraudulento o que infrinja derechos de terceros.',
          'Intentar acceder a cuentas o datos de otros usuarios.',
          'Realizar ingeniería inversa o intentar extraer el código fuente de la Plataforma.',
          'Utilizar la Plataforma para actividades ilegales o contrarias al orden público.',
          'Compartir credenciales de acceso con personas no autorizadas.',
        ]} />
      </Section>

      <Section number={5} title="Planes, Precios y Facturación">
        <Typography variant="body2" color="text.secondary" paragraph>
          ControlAudit ofrece distintos planes de suscripción. Los precios, condiciones y características de cada
          plan se publican en la Plataforma y pueden modificarse con previo aviso de 30 días.
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          El pago de la suscripción es obligatorio para mantener el acceso activo. El incumplimiento en el pago
          puede derivar en la suspensión temporal o definitiva del servicio.
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Las tarifas no incluyen impuestos aplicables según la legislación argentina vigente (IVA u otros).
        </Typography>
      </Section>

      <Section number={6} title="Propiedad Intelectual">
        <Typography variant="body2" color="text.secondary" paragraph>
          Todos los derechos de propiedad intelectual sobre la Plataforma, incluyendo su código, diseño, marca,
          logotipos y documentación, pertenecen exclusivamente a ControlAudit o a sus licenciantes.
        </Typography>
        <Typography variant="body2" color="text.secondary">
          El usuario conserva la propiedad de los datos que carga en la Plataforma. ControlAudit no reclamará
          derechos sobre dichos datos.
        </Typography>
      </Section>

      <Section number={7} title="Datos y Privacidad">
        <Typography variant="body2" color="text.secondary">
          El tratamiento de datos personales se rige por la Política de Privacidad de ControlAudit, que forma parte
          integral de estos Términos y Condiciones. ControlAudit cumple con la Ley Nacional N° 25.326 de Protección
          de Datos Personales de la República Argentina.
        </Typography>
      </Section>

      <Section number={8} title="Disponibilidad del Servicio">
        <Typography variant="body2" color="text.secondary" paragraph>
          ControlAudit procura mantener la Plataforma disponible de manera continua, pero no garantiza un
          funcionamiento sin interrupciones. Pueden producirse pausas por mantenimiento, actualizaciones o causas de
          fuerza mayor.
        </Typography>
        <Typography variant="body2" color="text.secondary">
          ControlAudit notificará con la mayor anticipación posible las interrupciones programadas.
        </Typography>
      </Section>

      <Section number={9} title="Limitación de Responsabilidad">
        <Typography variant="body2" color="text.secondary" paragraph>
          ControlAudit no será responsable por:
        </Typography>
        <BulletList items={[
          'Daños indirectos, incidentales o consecuentes derivados del uso o imposibilidad de uso de la Plataforma.',
          'Pérdida de datos causada por el usuario o por eventos fuera del control razonable de ControlAudit.',
          'Decisiones tomadas por el usuario basadas en la información gestionada en la Plataforma.',
          'Incumplimientos normativos del usuario en materia de higiene y seguridad laboral.',
        ]} />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
          La Plataforma es una herramienta de gestión y apoyo. La responsabilidad sobre el cumplimiento normativo
          recae exclusivamente en el empleador y en los responsables de cada empresa.
        </Typography>
      </Section>

      <Section number={10} title="Modificaciones a los Términos">
        <Typography variant="body2" color="text.secondary">
          ControlAudit puede modificar estos Términos en cualquier momento. Los cambios se notificarán por correo
          electrónico o mediante aviso dentro de la Plataforma con al menos 15 días de anticipación. El uso
          continuado de la Plataforma luego del aviso implica la aceptación de los términos modificados.
        </Typography>
      </Section>

      <Section number={11} title="Terminación del Servicio">
        <Typography variant="body2" color="text.secondary" paragraph>
          Cualquiera de las partes puede dar por terminada la relación contractual con previo aviso. ControlAudit
          puede suspender o cancelar el acceso sin previo aviso ante incumplimientos graves de estos Términos.
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Ante la cancelación, el usuario podrá solicitar la exportación de sus datos dentro de los 30 días
          posteriores. Transcurrido ese plazo, ControlAudit podrá eliminar los datos de forma definitiva.
        </Typography>
      </Section>

      <Section number={12} title="Ley Aplicable y Jurisdicción">
        <Typography variant="body2" color="text.secondary">
          Estos Términos se rigen por las leyes de la República Argentina. Ante cualquier controversia, las partes
          se someten a la jurisdicción de los Tribunales Ordinarios de la Ciudad de San Carlos de Bariloche,
          Provincia de Río Negro, con renuncia a cualquier otro fuero que pudiera corresponder.
        </Typography>
      </Section>

      <Section number={13} title="Contacto">
        <Typography variant="body2" color="text.secondary">
          Para consultas sobre estos Términos, el usuario puede comunicarse a través de los canales de soporte
          disponibles en la Plataforma o al correo electrónico indicado en el sitio oficial de ControlAudit.
        </Typography>
      </Section>

      <Divider sx={{ my: 3 }} />
      <Typography variant="caption" color="text.disabled">
        ControlAudit © 2025 — Todos los derechos reservados.
      </Typography>
    </Container>
  );
};

export default TerminosYCondiciones;
