/**
 * Mini SDK para ControlFile
 * Basado en la guía de integración oficial
 */

export class ControlFileClient {
  constructor(baseURL, getToken) {
    this.baseURL = baseURL;
    this.getToken = getToken;
  }

  async request(endpoint, options = {}) {
    const token = await this.getToken();
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`ControlFile API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Listar archivos
  async list({ parentId = null, pageSize = 50 } = {}) {
    return this.request(`/api/files/list?parentId=${parentId}&pageSize=${pageSize}`);
  }

  // Crear sesión de subida
  async presignUpload({ name, size, mime, parentId = null }) {
    return this.request('/api/uploads/presign', {
      method: 'POST',
      body: JSON.stringify({ name, size, mime, parentId }),
    });
  }

  // Confirmar subida (PUT simple)
  async confirm({ uploadSessionId, etag }) {
    return this.request('/api/uploads/confirm', {
      method: 'POST',
      body: JSON.stringify({ uploadSessionId, etag }),
    });
  }

  // Obtener URL de descarga
  async presignGet({ fileId }) {
    return this.request('/api/files/presign-get', {
      method: 'POST',
      body: JSON.stringify({ fileId }),
    });
  }

  // Verificar conectividad
  async health() {
    return this.request('/api/health');
  }

  // Obtener perfil de usuario
  async getUserProfile() {
    return this.request('/api/user/profile');
  }
}
