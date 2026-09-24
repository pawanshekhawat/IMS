import React from 'react';
import { AlertTriangle, AlertCircle, Info, CheckCircle2 } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title: string;
  message: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary' | 'info';
  isAlertOnly?: boolean;
  isLoading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  isAlertOnly = false,
  isLoading = false,
}) => {
  const getIcon = () => {
    switch (variant) {
      case 'danger':
        return (
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            backgroundColor: 'rgba(239, 68, 68, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#DC2626',
            flexShrink: 0,
          }}>
            <AlertTriangle size={24} />
          </div>
        );
      case 'warning':
        return (
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            backgroundColor: 'rgba(245, 158, 11, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#D97706',
            flexShrink: 0,
          }}>
            <AlertCircle size={24} />
          </div>
        );
      case 'info':
        return (
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            backgroundColor: 'rgba(59, 130, 246, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#2563EB',
            flexShrink: 0,
          }}>
            <Info size={24} />
          </div>
        );
      default:
        return (
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            backgroundColor: 'rgba(6, 77, 61, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-primary-800)',
            flexShrink: 0,
          }}>
            <CheckCircle2 size={24} />
          </div>
        );
    }
  };

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    } else {
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      maxWidth="460px"
      closeOnBackdropClick={!isLoading}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', width: '100%' }}>
          {!isAlertOnly && (
            <Button
              variant="outlined"
              onClick={onClose}
              disabled={isLoading}
              type="button"
            >
              {cancelText}
            </Button>
          )}
          <Button
            variant={variant === 'danger' ? 'danger' : 'primary'}
            onClick={handleConfirm}
            isLoading={isLoading}
            type="button"
          >
            {isAlertOnly ? (confirmText === 'Confirm' ? 'OK' : confirmText) : confirmText}
          </Button>
        </div>
      }
    >
      <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
        {getIcon()}
        <div style={{ flex: 1, fontSize: '14px', color: 'var(--color-neutral-700)', lineHeight: '1.5' }}>
          {typeof message === 'string' ? (
            <p style={{ margin: 0, whiteSpace: 'pre-line' }}>{message}</p>
          ) : (
            message
          )}
        </div>
      </div>
    </Modal>
  );
};
