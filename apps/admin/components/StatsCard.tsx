import React from 'react';

interface Props {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: string;
  color?: string;
}

export default function StatsCard({ title, value, subtitle, icon, color = '#3498db' }: Props) {
  return (
    <div style={{
      padding: '1.5rem',
      backgroundColor: 'white',
      border: '1px solid #e1e8ed',
      borderRadius: '12px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
        {icon && <span style={{ fontSize: '1.5rem', marginRight: '0.5rem' }}>{icon}</span>}
        <h3 style={{ margin: 0, fontSize: '0.875rem', color: '#657786', fontWeight: '500' }}>
          {title}
        </h3>
      </div>
      <div style={{ fontSize: '2rem', fontWeight: 'bold', color, marginBottom: '0.25rem' }}>
        {value}
      </div>
      {subtitle && (
        <div style={{ fontSize: '0.875rem', color: '#657786' }}>
          {subtitle}
        </div>
      )}
    </div>
  );
}
