import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  action,
  children,
  className = '',
  style,
  ...props
}) => {
  return (
    <div className={`card ${className}`} style={{ display: 'flex', flexDirection: 'column', ...style }} {...props}>
      {(title || action) && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px',
        }}>
          <div>
            {title && <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-neutral-900)' }}>{title}</h3>}
            {subtitle && <p style={{ fontSize: '13px', color: 'var(--color-neutral-500)', marginTop: '2px' }}>{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
};
