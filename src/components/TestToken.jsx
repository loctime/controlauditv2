import React, { useContext } from 'react';
import { AuthContext } from './context/AuthContext';

const TestToken = () => {
  const { user, userProfile, role, permisos } = useContext(AuthContext);

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', margin: '10px' }}>
      <h3>🔧 Debug de Autenticación</h3>
      
      <div style={{ marginBottom: '10px' }}>
        <strong>Usuario:</strong> {user ? '✅ Autenticado' : '❌ No autenticado'}
      </div>
      
      {user && (
        <>
          <div style={{ marginBottom: '10px' }}>
            <strong>UID:</strong> {user.uid}
          </div>
          <div style={{ marginBottom: '10px' }}>
            <strong>Email:</strong> {user.email}
          </div>
          <div style={{ marginBottom: '10px' }}>
            <strong>Email Verificado:</strong> {user.emailVerified ? '✅' : '❌'}
          </div>
        </>
      )}
      
      <div style={{ marginBottom: '10px' }}>
        <strong>UserProfile:</strong> {userProfile ? '✅ Existe' : '❌ No existe'}
      </div>
      
      {userProfile && (
        <>
          <div style={{ marginBottom: '10px' }}>
            <strong>Profile UID:</strong> {userProfile.uid}
          </div>
          <div style={{ marginBottom: '10px' }}>
            <strong>Profile Role:</strong> {userProfile.role || '❌ NULL'}
          </div>
          <div style={{ marginBottom: '10px' }}>
            <strong>Profile Email:</strong> {userProfile.email}
          </div>
        </>
      )}
      
      <div style={{ marginBottom: '10px' }}>
        <strong>Context Role:</strong> {role || '❌ NULL'}
      </div>
      
      <div style={{ marginBottom: '10px' }}>
        <strong>Permisos:</strong> {Object.keys(permisos || {}).length} permisos
      </div>
      
      <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f0f0f0' }}>
        <h4>📋 Información de Debug:</h4>
        <p>Si el rol es NULL, el usuario no podrá usar ControlFile correctamente.</p>
        <p>Para solucionarlo, recarga la página o contacta al administrador.</p>
      </div>
    </div>
  );
};

export default TestToken;
