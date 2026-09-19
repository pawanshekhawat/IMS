import React from 'react';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string | number; label: string }[];
}

export const Select: React.FC<SelectProps> = ({
  label,
  error,
  options,
  className = '',
  id,
  ...props
}) => {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
      {label && (
        <label 
          htmlFor={selectId}
          style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-neutral-700)' }}
        >
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={`input-base ${className}`}
        style={{
          borderColor: error ? 'var(--color-danger)' : undefined,
          cursor: 'pointer',
          appearance: 'auto',
        }}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && (
        <span style={{ fontSize: '12px', color: 'var(--color-danger)', fontWeight: 500 }}>
          {error}
        </span>
      )}
    </div>
  );
};
