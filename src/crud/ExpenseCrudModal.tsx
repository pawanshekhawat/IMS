import React, { useState } from 'react';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';
import type { ExpenseCategory, PaymentMethod } from '../types';
import { dataService } from '../services/dataService';

interface ExpenseCrudModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'Showroom Rent',
  'Electricity & Utilities',
  'Staff Wages',
  'Logistics & Freight',
  'Marketing & Ads',
  'Display & Maintenance',
  'Tea & Refreshments',
  'Misc Store Supplies',
];

const PAYMENT_METHODS: PaymentMethod[] = ['UPI', 'Cash', 'Card', 'Store Credit'];

export const ExpenseCrudModal: React.FC<ExpenseCrudModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    title: '',
    category: EXPENSE_CATEGORIES[0],
    amount: 0,
    paymentMethod: PAYMENT_METHODS[0],
    paidTo: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setError('Expense description is required');
      return;
    }
    if (formData.amount <= 0) {
      setError('Amount must be greater than 0');
      return;
    }
    if (!formData.paidTo.trim()) {
      setError('Recipient / Payee name is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await dataService.createExpense({
        ...formData,
        amount: Number(formData.amount),
      });

      setFormData({
        title: '',
        category: EXPENSE_CATEGORIES[0],
        amount: 0,
        paymentMethod: PAYMENT_METHODS[0],
        paidTo: '',
        date: new Date().toISOString().split('T')[0],
        notes: '',
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to record expense');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Showroom Expense"
      subtitle="Log store overheads, utilities, wages, or maintenance"
      maxWidth="540px"
      footer={
        <>
          <Button variant="outlined" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} isLoading={loading} type="button">
            Save Expense
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
        <Input
          label="Expense Title / Description *"
          placeholder="e.g. Monthly Power Bill or Courier Freight"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
        />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <Select
            label="Category"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value as ExpenseCategory })}
            options={EXPENSE_CATEGORIES.map(c => ({ value: c, label: c }))}
          />
          <Input
            label="Amount (₹) *"
            type="number"
            min="1"
            step="0.01"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
            required
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <Select
            label="Payment Mode"
            value={formData.paymentMethod}
            onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as PaymentMethod })}
            options={PAYMENT_METHODS.map(m => ({ value: m, label: m }))}
          />
          <Input
            label="Date *"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            required
          />
        </div>

        <Input
          label="Paid To (Beneficiary/Vendor) *"
          placeholder="e.g. Uttarakhand Power Corp / Landlord"
          value={formData.paidTo}
          onChange={(e) => setFormData({ ...formData, paidTo: e.target.value })}
          required
        />

        <Input
          label="Additional Remarks"
          placeholder="Voucher or transaction reference"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
        />
      </form>
    </Modal>
  );
};
