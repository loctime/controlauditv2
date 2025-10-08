import React from 'react';

export default function KpiCard({ title, value, icon, status, subtitle, progress }) {
  const statusStyles = {
    success: {
      backgroundColor: '#f0fdf4',
      borderColor: '#bbf7d0',
      color: '#15803d',
      iconBg: '#dcfce7',
      iconColor: '#16a34a',
      progressBg: '#22c55e'
    },
    warning: {
      backgroundColor: '#fffbeb',
      borderColor: '#fed7aa',
      color: '#d97706',
      iconBg: '#fef3c7',
      iconColor: '#f59e0b',
      progressBg: '#f59e0b'
    },
    critical: {
      backgroundColor: '#fef2f2',
      borderColor: '#fecaca',
      color: '#dc2626',
      iconBg: '#fee2e2',
      iconColor: '#ef4444',
      progressBg: '#ef4444'
    }
  };

  const styles = statusStyles[status] || statusStyles.success;

  return (
    <div style={{
      border: `2px solid ${styles.borderColor}`,
      borderRadius: '12px',
      padding: '1rem',
      backgroundColor: styles.backgroundColor,
      color: styles.color,
      transition: 'all 0.2s',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    }}>
      <div style={{ paddingBottom: '0.75rem' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <h3 style={{
            fontSize: '0.875rem',
            fontWeight: '500',
            margin: 0,
            color: '#374151'
          }}>
            {title}
          </h3>
          <div style={{
            padding: '8px',
            borderRadius: '8px',
            backgroundColor: styles.iconBg,
            color: styles.iconColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {icon}
          </div>
        </div>
      </div>
      <div>
        <div>
          <p style={{
            fontSize: '1.875rem',
            fontWeight: 'bold',
            margin: '0 0 0.5rem 0',
            color: '#111827'
          }}>
            {value}
          </p>
          {subtitle && (
            <p style={{
              fontSize: '0.75rem',
              margin: '0 0 0.75rem 0',
              color: '#6b7280'
            }}>
              {subtitle}
            </p>
          )}
          {progress !== undefined && (
            <div style={{
              width: '100%',
              backgroundColor: '#e5e7eb',
              borderRadius: '9999px',
              height: '8px',
              marginTop: '0.75rem'
            }}>
              <div
                style={{
                  height: '8px',
                  borderRadius: '9999px',
                  backgroundColor: styles.progressBg,
                  width: `${Math.min(progress, 100)}%`,
                  transition: 'width 0.3s'
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

