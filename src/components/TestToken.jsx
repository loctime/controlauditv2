import React, { useState } from 'react';
import { auth } from '../firebaseConfig';

const TestToken = () => {
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const testToken = async () => {
    setLoading(true);
    setError('');
    setToken('');

    try {
      if (!auth.currentUser) {
        setError('❌ No hay usuario autenticado. Inicia sesión primero.');
        return;
      }

      console.log('✅ Usuario autenticado:', auth.currentUser.email);
      console.log('🆔 UID:', auth.currentUser.uid);

      const tokenResult = await auth.currentUser.getIdToken(true);
      
      setToken(tokenResult);
      console.log('🔑 Token obtenido:', tokenResult);
      console.log('📏 Longitud:', tokenResult.length);
      console.log('🔍 Primeros 50 caracteres:', tokenResult.substring(0, 50) + '...');
      
    } catch (err) {
      setError('❌ Error obteniendo token: ' + err.message);
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h2>🧪 Prueba de Token de Firebase</h2>
      
      <button 
        onClick={testToken} 
        disabled={loading}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          backgroundColor: '#1976d2',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: loading ? 'not-allowed' : 'pointer'
        }}
      >
        {loading ? '⏳ Obteniendo token...' : '🔑 Probar Token'}
      </button>

      {error && (
        <div style={{ 
          marginTop: '10px', 
          padding: '10px', 
          backgroundColor: '#ffebee', 
          color: '#c62828',
          borderRadius: '4px'
        }}>
          {error}
        </div>
      )}

      {token && (
        <div style={{ marginTop: '20px' }}>
          <h3>✅ Token Obtenido:</h3>
          <div style={{ 
            backgroundColor: '#f5f5f5', 
            padding: '10px', 
            borderRadius: '4px',
            wordBreak: 'break-all',
            fontSize: '12px',
            fontFamily: 'monospace'
          }}>
            <strong>Longitud:</strong> {token.length} caracteres<br/>
            <strong>Primeros 50:</strong> {token.substring(0, 50)}...<br/>
            <strong>Últimos 50:</strong> ...{token.substring(token.length - 50)}<br/>
            <strong>Token completo:</strong><br/>
            {token}
          </div>
        </div>
      )}
    </div>
  );
};

export default TestToken;
