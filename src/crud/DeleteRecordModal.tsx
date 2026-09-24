import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';

export interface DeleteRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  recordType: 'sale' | 'purchase';
  isBatch?: boolean;
  onConfirm: (adjustStock: boolean) => Promise<void>;
}

export const DeleteRecordModal: React.FC<DeleteRecordModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  recordType,
  isBatch = false,
  onConfirm,
}) => {
  // adjustStock = false: "stocks are out, only delete invoice/history, don't refill stock"
  const [adjustStock, setAdjustStock] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExecute = async () => {
    setLoading(true);
    setError(null);
    try {
      await onConfirm(adjustStock);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to delete record.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => !loading && onClose()}
      title={title}
      subtitle={subtitle}
      maxWidth="540px"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', width: '100%' }}>
          <Button variant="outlined" onClick={onClose} disabled={loading} type="button">
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleExecute}
            isLoading={loading}
            type="button"
            style={{ fontWeight: 800 }}
          >
            {adjustStock 
              ? (recordType === 'sale' ? 'Delete & Refill Stock' : 'Delete & Deduct Stock')
              : 'Delete (Keep Stock As Is)'}
          </Button>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {error && (
          <div style={{
            padding: '10px 14px',
            backgroundColor: 'var(--color-danger-bg)',
            color: 'var(--color-danger)',
            borderRadius: 'var(--radius-md)',
            fontSize: '13px',
            fontWeight: 600,
          }}>
            {error}
          </div>
        )}

        <div style={{
          fontSize: '13px',
          color: 'var(--color-neutral-600)',
          lineHeight: '1.5',
        }}>
          {isBatch
            ? `Please select how you want the system to handle your physical inventory stock while clearing records:`
            : `How would you like to handle inventory stock for this deleted ${recordType === 'sale' ? 'sales invoice' : 'purchase order'}?`}
        </div>

        {/* Option A: Delete Record Only, Do NOT touch stock (Recommended) */}
        <div
          onClick={() => setAdjustStock(false)}
          style={{
            border: `2px solid ${!adjustStock ? 'var(--color-primary-600)' : 'var(--color-neutral-300)'}`,
            backgroundColor: !adjustStock ? 'rgba(6, 77, 61, 0.04)' : 'var(--color-neutral-100)',
            borderRadius: 'var(--radius-lg)',
            padding: '14px 16px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            display: 'flex',
            gap: '14px',
            alignItems: 'flex-start',
          }}
        >
          <input
            type="radio"
            checked={!adjustStock}
            onChange={() => setAdjustStock(false)}
            style={{ marginTop: '3px', cursor: 'pointer' }}
          />
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
              <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--color-neutral-900)' }}>
                {recordType === 'sale'
                  ? 'Delete Record Only (Do NOT refill stock)'
                  : 'Delete Record Only (Keep Current Stock)'}
              </span>
              <span style={{
                fontSize: '10px',
                fontWeight: 700,
                color: 'var(--color-primary-800)',
                backgroundColor: 'rgba(6, 77, 61, 0.12)',
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                whiteSpace: 'nowrap',
              }}>
                Recommended
              </span>
            </div>

            <p style={{ fontSize: '12px', color: 'var(--color-neutral-600)', margin: '4px 0 0 0', lineHeight: '1.4' }}>
              {recordType === 'sale'
                ? 'Stock remains deducted/sold because items are physically out of the store. Perfect for clearing old bills or cleaning history without altering live inventory counts.'
                : 'Deletes the PO entry from history while preserving current stock quantities already sitting on your showroom shelves.'}
            </p>
          </div>
        </div>

        {/* Option B: Delete & Adjust Stock */}
        <div
          onClick={() => setAdjustStock(true)}
          style={{
            border: `2px solid ${adjustStock ? '#DC2626' : 'var(--color-neutral-300)'}`,
            backgroundColor: adjustStock ? 'rgba(239, 68, 68, 0.04)' : 'var(--color-neutral-100)',
            borderRadius: 'var(--radius-lg)',
            padding: '14px 16px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            display: 'flex',
            gap: '14px',
            alignItems: 'flex-start',
          }}
        >
          <input
            type="radio"
            checked={adjustStock}
            onChange={() => setAdjustStock(true)}
            style={{ marginTop: '3px', cursor: 'pointer' }}
          />
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
              <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--color-neutral-900)' }}>
                {recordType === 'sale'
                  ? 'Delete & Refill Stock (Return items to inventory)'
                  : 'Delete & Deduct Items from Stock'}
              </span>
              <span style={{
                fontSize: '10px',
                fontWeight: 700,
                color: '#B91C1C',
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                whiteSpace: 'nowrap',
              }}>
                Stock Adjustment
              </span>
            </div>

            <p style={{ fontSize: '12px', color: 'var(--color-neutral-600)', margin: '4px 0 0 0', lineHeight: '1.4' }}>
              {recordType === 'sale'
                ? 'Adds all sold item quantities back into your live catalog inventory. Use this only if the sale was cancelled or returned by the client.'
                : 'Reverses the inward stock addition by subtracting the received item quantities from your active inventory.'}
            </p>
          </div>
        </div>

        {/* Warning Note */}
        <div style={{
          display: 'flex',
          gap: '10px',
          alignItems: 'center',
          padding: '10px 14px',
          backgroundColor: '#FFFBEB',
          border: '1px solid #FDE68A',
          borderRadius: 'var(--radius-md)',
          color: '#92400E',
          fontSize: '12px',
        }}>
          <AlertTriangle size={16} style={{ flexShrink: 0 }} />
          <span>
            {isBatch 
              ? 'Warning: This action will permanently remove history records from the cloud database.'
              : 'Deleted invoice and transaction records cannot be undone.'}
          </span>
        </div>
      </div>
    </Modal>
  );
};
