import React from 'react';

export default function DashboardHeader({ companyName, period }) {
  return (
    <header style={{
      backgroundColor: '#2563eb',
      color: 'white',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      marginBottom: '2rem'
    }}>
      <div style={{
        maxWidth: '1600px',
        margin: '0 auto',
        padding: '1rem 1.5rem'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              padding: '8px',
              boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
            }}>
              <img
                src="/loguitoaudit.png"
                alt="ControlAudit Logo"
                style={{ height: '40px', width: 'auto' }}
              />
            </div>
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>
                Dashboard de Higiene y Seguridad
              </h1>
              {companyName && (
                <p style={{ fontSize: '0.875rem', margin: '4px 0 0 0', color: '#bfdbfe' }}>
                  {companyName}
                </p>
              )}
            </div>
          </div>
          {period && (
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '0.875rem', margin: 0, color: '#bfdbfe' }}>Período</p>
              <p style={{ fontSize: '1.125rem', fontWeight: '600', margin: '4px 0 0 0' }}>
                {period}
              </p>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

