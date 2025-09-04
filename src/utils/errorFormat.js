// src/utils/errorFormat.js

export const formatAuthError = (error) => {
  try {
    if (!error) return 'Error desconocido';

    const baseMessage = typeof error === 'string' ? error : (error.message || 'Ocurrió un error');
    const code = error.code || error.error || error.status || null;
    const causeMessage = error.cause?.message || null;

    let extra = '';
    if (error?.data && typeof error.data === 'object') {
      extra = JSON.stringify(error.data);
    } else if (error?.stack && typeof error.stack === 'string') {
      const firstLine = error.stack.split('\n')[0];
      extra = firstLine.includes(baseMessage) ? '' : firstLine;
    }

    // Si no hay nada útil aún, incluir un volcado compacto del objeto de error
    if (!code && !extra) {
      try {
        const shallow = {};
        for (const k of Object.keys(error)) {
          if (['stack'].includes(k)) continue;
          shallow[k] = error[k];
        }
        const json = JSON.stringify(shallow);
        if (json && json !== '{}') extra = json;
      } catch (_) {}
    }

    const parts = [baseMessage];
    if (code) parts.push(`[${code}]`);
    if (causeMessage && causeMessage !== baseMessage) parts.push(`Causa: ${causeMessage}`);
    if (extra) parts.push(extra);

    return parts.join(' - ');
  } catch (_) {
    return 'Error de autenticación (detalle no disponible)';
  }
};

export default formatAuthError;
