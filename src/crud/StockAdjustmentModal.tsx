import React, { useState } from 'react';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';
import type { Product } from '../types';
import { dataService } from '../services/dataService';

interface StockAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  product: Product | null;
}

export const StockAdjustmentModal: React.FC<StockAdjustmentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  product,
}) => {
  const [adjustmentType, setAdjustmentType] = useState<'IN' | 'OUT' | 'DAMAGE'>('IN');
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState('Physical audit stock correction');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!product) return null;

  const currentStock = product.stockQuantity;
  let previewStock = currentStock;
  if (adjustmentType === 'IN') previewStock += quantity;
  else previewStock = Math.max(0, currentStock - quantity);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (quantity <= 0) {
      setError('Quantity must be greater than 0');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await dataService.adjustStock(product.id, quantity, adjustmentType, reason);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to adjust stock');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Adjust Inventory Stock"
      subtitle={`Product: ${product.name} (${product.sku})`}
      maxWidth="500px"
      footer={
        <>
          <Button variant="outlined" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} isLoading={loading} type="button">
            Confirm Adjustment
          </Button>
        </>
      }
    >
      {error && (
        <div style={{
          padding: '10px 14px',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'var(--color-danger-bg)',
          color: 'var(--color-danger)',
          fontSize: '13px',
          fontWeight: 600,
        }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Stock visual indicator */}
        <div style={{
          padding: '14px 18px',
          borderRadius: 'var(--radius-lg)',
          backgroundColor: 'var(--color-neutral-200)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div>
            <span style={{ fontSize: '12px', color: 'var(--color-neutral-500)', display: 'block' }}>Current Stock</span>
            <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-neutral-900)' }}>
              {currentStock} {product.unit}
            </span>
          </div>
          <div style={{ fontSize: '20px', color: 'var(--color-neutral-400)' }}>→</div>
          <div>
            <span style={{ fontSize: '12px', color: 'var(--color-neutral-500)', display: 'block' }}>New Calculated Stock</span>
            <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-primary-800)' }}>
              {previewStock} {product.unit}
            </span>
          </div>
        </div>

        <Select
          label="Adjustment Action"
          value={adjustmentType}
          onChange={(e) => setAdjustmentType(e.target.value as any)}
          options={[
            { value: 'IN', label: 'Stock In (+) / Found Excess Stock' },
            { value: 'OUT', label: 'Stock Out (-) / Internal Consumption' },
            { value: 'DAMAGE', label: 'Damaged / Broken Sample (-)' },
          ]}
        />

        <Input
          label="Adjustment Quantity *"
          type="number"
          min="1"
          value={quantity}
          onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
          required
        />

        <Input
          label="Reason / Audit Note *"
          placeholder="e.g. Physical stock count check, floor display sample"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          required
        />
      </form>
    </Modal>
  );
};
