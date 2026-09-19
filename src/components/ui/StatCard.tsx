import React from 'react';

export interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'warning' | 'danger' | 'neutral';
  trend?: { value: string; isPositive: boolean };
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subtext,
  icon,
  variant = 'neutral',
  trend,
}) => {
  const getIconBackground = () => {
    switch (variant) {
      case 'primary':
        return { bg: 'var(--color-primary-100)', color: 'var(--color-primary-800)' };
      case 'secondary':
        return { bg: 'var(--color-secondary-100)', color: 'var(--color-secondary-700)' };
      case 'warning':
        return { bg: 'var(--color-warning-bg)', color: 'var(--color-warning)' };
      case 'danger':
        return { bg: 'var(--color-danger-bg)', color: 'var(--color-danger)' };
      default:
        return { bg: 'var(--color-neutral-250)', color: 'var(--color-neutral-700)' };
    }
  };

  const c = getIconBackground();

  return (
    <div className="card" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-neutral-600)' }}>
          {label}
        </span>
        <div style={{
          width: '38px',
          height: '38px',
          borderRadius: '50%',
          backgroundColor: c.bg,
          color: c.color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {icon}
        </div>
      </div>

      <div>
        <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-neutral-900)', letterSpacing: '-0.02em' }}>
          {value}
        </div>
        {(subtext || trend) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
            {trend && (
              <span style={{
                fontSize: '12px',
                fontWeight: 700,
                color: trend.isPositive ? 'var(--color-success)' : 'var(--color-danger)',
              }}>
                {trend.isPositive ? '↑' : '↓'} {trend.value}
              </span>
            )}
            {subtext && (
              <span style={{ fontSize: '12px', color: 'var(--color-neutral-500)' }}>
                {subtext}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
