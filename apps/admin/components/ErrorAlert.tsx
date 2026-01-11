import React from 'react';

interface Props {
  message: string;
  onRetry?: () => void;
}

export default function ErrorAlert({ message, onRetry }: Props) {
  return (
    <div style={{
      padding: '1rem',
      backgroundColor: '#fee',
      border: '1px solid #fcc',
      borderRadius: '8px',
      color: '#c33',
      marginBottom: '1rem',
    }}>
      <strong>Error:</strong> {message}
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            marginLeft: '1rem',
            padding: '0.25rem 0.5rem',
            backgroundColor: '#c33',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Retry
        </button>
      )}
    </div>
  );
}
