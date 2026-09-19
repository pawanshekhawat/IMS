import { useState, useEffect } from 'react';
import { Search, Plus, Calendar, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onQuickAction?: () => void;
  quickActionLabel?: string;
  onSearch?: (term: string) => void;
  lowStockCount?: number;
  onAlertClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  onQuickAction,
  quickActionLabel = 'New Bill',
  onSearch,
  lowStockCount = 0,
  onAlertClick,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    onSearch?.(e.target.value);
  };

  const formattedDate = currentTime.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

  const formattedTime = currentTime.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <header
      style={{
        height: '74px',
        padding: '0 28px',
        backgroundColor: '#FFFFFF',
        borderBottom: '1px solid var(--color-neutral-300)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        userSelect: 'none',
      }}
    >
      {/* Page Title & Breadcrumb */}
      <div>
        <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-neutral-900)' }}>
          {title}
        </h2>
        {subtitle && (
          <p style={{ fontSize: '13px', color: 'var(--color-neutral-500)', marginTop: '2px' }}>
            {subtitle}
          </p>
        )}
      </div>

      {/* Center Search / Action Area */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ position: 'relative', width: '280px' }}>
          <Search
            size={16}
            color="var(--color-neutral-500)"
            style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }}
          />
          <input
            type="text"
            placeholder="Quick search (SKU, name, invoice)..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="input-base"
            style={{
              paddingLeft: '38px',
              paddingRight: '14px',
              height: '38px',
              fontSize: '13px',
              backgroundColor: 'var(--color-neutral-200)',
              border: '1px solid var(--color-neutral-300)',
            }}
          />
        </div>

        {/* Low Stock Warning Pill */}
        {lowStockCount > 0 && (
          <button
            onClick={onAlertClick}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '9999px',
              backgroundColor: 'var(--color-warning-bg)',
              color: 'var(--color-warning)',
              border: '1px solid #fcd34d',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'transform 0.15s ease',
            }}
            title="Items needing restock"
          >
            <AlertCircle size={14} />
            <span>{lowStockCount} Low Stock</span>
          </button>
        )}

        {/* Date & Time Widget */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 14px',
            borderRadius: '9999px',
            backgroundColor: 'var(--color-neutral-200)',
            border: '1px solid var(--color-neutral-300)',
            fontSize: '12px',
            fontWeight: 600,
            color: 'var(--color-neutral-700)',
          }}
        >
          <Calendar size={13} color="var(--color-neutral-500)" />
          <span>{formattedDate}</span>
          <span style={{ color: 'var(--color-neutral-400)' }}>•</span>
          <span style={{ color: 'var(--color-neutral-900)', fontWeight: 700 }}>{formattedTime}</span>
        </div>

        {/* Main CTA */}
        {onQuickAction && (
          <Button
            variant="primary"
            size="md"
            icon={<Plus size={16} />}
            onClick={onQuickAction}
          >
            {quickActionLabel}
          </Button>
        )}
      </div>
    </header>
  );
};
