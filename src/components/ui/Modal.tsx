import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: string;
  closeOnBackdropClick?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth = '560px',
  closeOnBackdropClick = false,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && closeOnBackdropClick) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, closeOnBackdropClick]);

  if (!isOpen) return null;

  return (
    <div 
      className="modal-backdrop" 
      onClick={closeOnBackdropClick ? onClose : undefined}
    >
      <div 
        className="modal-content" 
        style={{ maxWidth }} 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--color-neutral-300)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-neutral-900)' }}>
              {title}
            </h3>
            {subtitle && (
              <p style={{ fontSize: '13px', color: 'var(--color-neutral-500)', marginTop: '2px' }}>
                {subtitle}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="btn-icon"
            style={{
              background: 'var(--color-neutral-250)',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-neutral-600)',
              transition: 'background 0.15s ease',
            }}
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{
          padding: '24px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}>
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div style={{
            padding: '16px 24px',
            borderTop: '1px solid var(--color-neutral-300)',
            backgroundColor: 'var(--color-neutral-100)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '12px',
          }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
