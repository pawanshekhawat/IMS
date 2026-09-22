import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Calendar, AlertCircle, AlertTriangle } from 'lucide-react';
import { Button } from '../ui/Button';
import { BusinessCalendarModal } from '../calendar/BusinessCalendarModal';
import { dataService } from '../../services/dataService';
import { useAuth } from '../../context/AuthContext';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onQuickAction?: () => void;
  quickActionLabel?: string;
  onSearch?: (term: string) => void;
  lowStockCount?: number;
  outOfStockCount?: number;
  onAlertClick?: () => void;
  onOutOfStockClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  onQuickAction,
  quickActionLabel = 'New Bill',
  onSearch,
  lowStockCount,
  outOfStockCount,
  onAlertClick,
  onOutOfStockClick,
}) => {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [liveCounts, setLiveCounts] = useState<{ low: number; out: number } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (lowStockCount === undefined && outOfStockCount === undefined) {
      if (isAdmin) {
        dataService.getDashboardStats().then(s => {
          setLiveCounts({ low: s.lowStockCount, out: s.outOfStockCount });
        }).catch(() => {});
      } else {
        dataService.getStockAlertCounts().then(counts => {
          setLiveCounts(counts);
        }).catch(() => {});
      }
    }
  }, [lowStockCount, outOfStockCount, isAdmin]);

  const effectiveOutCount = outOfStockCount !== undefined ? outOfStockCount : (liveCounts?.out || 0);
  const effectiveLowCount = lowStockCount !== undefined ? lowStockCount : (liveCounts?.low || 0);

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
        minHeight: '74px',
        flexShrink: 0,
        width: '100%',
        boxSizing: 'border-box',
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
      <div style={{ minWidth: 0, flexShrink: 1, marginRight: '16px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-neutral-900)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {title}
        </h2>
        {subtitle && (
          <p style={{ fontSize: '13px', color: 'var(--color-neutral-500)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {subtitle}
          </p>
        )}
      </div>

      {/* Center Search / Action Area */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexShrink: 0 }}>
        <div style={{ position: 'relative', width: '260px', flexShrink: 0 }}>
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

        {/* Out of Stock Urgent Alert Pill */}
        {effectiveOutCount > 0 && (
          <button
            type="button"
            onClick={onOutOfStockClick || (() => navigate('/inventory?filter=out'))}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '9999px',
              backgroundColor: 'var(--color-danger-bg, #fee2e2)',
              color: 'var(--color-danger, #b91c1c)',
              border: '1px solid #fca5a5',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'transform 0.15s ease',
            }}
            title={`${effectiveOutCount} item${effectiveOutCount === 1 ? '' : 's'} completely out of stock`}
          >
            <AlertTriangle size={14} color="var(--color-danger, #b91c1c)" />
            <span>{effectiveOutCount} Out of Stock</span>
          </button>
        )}

        {/* Low Stock Warning Pill */}
        {effectiveLowCount > 0 && (
          <button
            type="button"
            onClick={onAlertClick || (() => navigate('/inventory?filter=low'))}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '9999px',
              backgroundColor: 'var(--color-warning-bg, #fef3c7)',
              color: 'var(--color-warning, #b45309)',
              border: '1px solid #fcd34d',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'transform 0.15s ease',
            }}
            title={`${effectiveLowCount} item${effectiveLowCount === 1 ? '' : 's'} running low on stock`}
          >
            <AlertCircle size={14} color="var(--color-warning, #b45309)" />
            <span>{effectiveLowCount} Low Stock</span>
          </button>
        )}

        {/* Date & Time Display (Calendar restricted strictly to Admin) */}
        {isAdmin ? (
          <button
            type="button"
            onClick={() => setIsCalendarOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '7px 16px',
              borderRadius: '9999px',
              backgroundColor: 'var(--color-neutral-200)',
              border: '1px solid var(--color-neutral-300)',
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--color-neutral-800)',
              cursor: 'pointer',
              flexShrink: 0,
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-primary-50)';
              e.currentTarget.style.borderColor = 'var(--color-primary-300)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-neutral-200)';
              e.currentTarget.style.borderColor = 'var(--color-neutral-300)';
            }}
            title="Click to view Monthly Financial Calendar & Daily Profits"
          >
            <Calendar size={14} color="var(--color-primary-800)" />
            <span>{formattedDate}</span>
            <span style={{ color: 'var(--color-neutral-400)' }}>•</span>
            <span style={{ color: 'var(--color-neutral-900)', fontWeight: 700 }}>{formattedTime}</span>
          </button>
        ) : (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '7px 16px',
              borderRadius: '9999px',
              backgroundColor: 'var(--color-neutral-200)',
              border: '1px solid var(--color-neutral-300)',
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--color-neutral-700)',
              flexShrink: 0,
              whiteSpace: 'nowrap',
              userSelect: 'none',
            }}
          >
            <span>{formattedDate}</span>
            <span style={{ color: 'var(--color-neutral-400)' }}>•</span>
            <span style={{ color: 'var(--color-neutral-900)', fontWeight: 700 }}>{formattedTime}</span>
          </div>
        )}

        {/* Main CTA with white plus icon */}
        {onQuickAction && (
          <div style={{ flexShrink: 0 }}>
            <Button
              variant="primary"
              size="md"
              icon={<Plus size={16} color="#FFFFFF" strokeWidth={2.5} />}
              onClick={onQuickAction}
            >
              {quickActionLabel.replace(/^\+\s*/, '')}
            </Button>
          </div>
        )}
      </div>

      {/* Monthly Business Calendar Modal - Strictly Admin Only */}
      {isAdmin && (
        <BusinessCalendarModal
          isOpen={isCalendarOpen}
          onClose={() => setIsCalendarOpen(false)}
        />
      )}
    </header>
  );
};
