// src/utils/errorFormat.js

export const formatAuthError = (error) => {
  try {
    if (!error) return 'Error desconocido';

    const asString = (() => {
      try { return String(error); } catch { return null; }
    })();

    const baseMessage = typeof error === 'string' ? error : (error.message || asString || 'Ocurrió un error');
    const code = error.code || error.error || error.status || null;
    const causeMessage = error.cause?.message || null;

    let extra = '';
    if (error?.data && typeof error.data === 'object') {
      try { extra = JSON.stringify(error.data); } catch {}
    }

    if (!extra && error && typeof error === 'object') {
      try {
        const shallow = {};
        for (const k of Object.keys(error)) {
          if (['stack'].includes(k)) continue;
          shallow[k] = error[k];
        }
        const json = JSON.stringify(shallow);
        if (json && json !== '{}') extra = json;
      } catch {}
    }

    if (!extra && error?.stack) {
      const firstLine = error.stack.split('\n')[0];
      if (!firstLine.includes(baseMessage)) extra = firstLine;
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
