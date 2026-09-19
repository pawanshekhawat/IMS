import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  icon,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
      {label && (
        <label 
          htmlFor={inputId}
          style={{ 
            fontSize: '13px', 
            fontWeight: 600, 
            color: 'var(--color-neutral-700)',
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          {label}
        </label>
      )}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%' }}>
        {icon && (
          <div 
            style={{ 
              position: 'absolute', 
              left: '14px', 
              color: 'var(--color-neutral-500)', 
              pointerEvents: 'none',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {icon}
          </div>
        )}
        <input
          id={inputId}
          className={`input-base ${className}`}
          style={{
            paddingLeft: icon ? '42px' : '16px',
            borderColor: error ? 'var(--color-danger)' : undefined,
          }}
          {...props}
        />
      </div>
      {error && (
        <span style={{ fontSize: '12px', color: 'var(--color-danger)', fontWeight: 500 }}>
          {error}
        </span>
      )}
    </div>
  );
};
