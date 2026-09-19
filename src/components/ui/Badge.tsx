import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'tertiary' | 'success' | 'warning' | 'danger' | 'neutral';
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'sm',
  icon,
  className = '',
}) => {
  const getColors = () => {
    switch (variant) {
      case 'primary':
        return { bg: 'var(--color-primary-100)', color: 'var(--color-primary-900)', border: 'var(--color-primary-300)' };
      case 'secondary':
        return { bg: 'var(--color-secondary-100)', color: 'var(--color-secondary-900)', border: 'var(--color-secondary-300)' };
      case 'tertiary':
        return { bg: 'var(--color-tertiary-500)', color: 'var(--color-primary-900)', border: 'var(--color-tertiary-600)' };
      case 'success':
        return { bg: 'var(--color-success-bg)', color: 'var(--color-success)', border: '#86efac' };
      case 'warning':
        return { bg: 'var(--color-warning-bg)', color: 'var(--color-warning)', border: '#fcd34d' };
      case 'danger':
        return { bg: 'var(--color-danger-bg)', color: 'var(--color-danger)', border: '#fca5a5' };
      default:
        return { bg: 'var(--color-neutral-250)', color: 'var(--color-neutral-700)', border: 'var(--color-neutral-300)' };
    }
  };

  const c = getColors();
  const pad = size === 'sm' ? '3px 10px' : '5px 14px';
  const fontSize = size === 'sm' ? '11px' : '13px';

  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        padding: pad,
        fontSize,
        fontWeight: 700,
        borderRadius: '9999px',
        backgroundColor: c.bg,
        color: c.color,
        border: `1px solid ${c.border}`,
        lineHeight: 1,
        letterSpacing: '0.01em',
      }}
    >
      {icon && <span style={{ display: 'flex', alignItems: 'center' }}>{icon}</span>}
      {children}
    </span>
  );
};
