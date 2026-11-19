import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';
import type { Sale, PaymentMethod, PaymentStatus } from '../types';
import { dataService } from '../services/dataService';

interface ReceivePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: Sale | null;
  onPaymentReceived: (updatedSale: Sale) => void;
}

const PAYMENT_METHODS: PaymentMethod[] = ['UPI', 'Cash', 'Split (Cash + UPI)', 'Card'];

export const ReceivePaymentModal: React.FC<ReceivePaymentModalProps> = ({
  isOpen,
  onClose,
  sale,
  onPaymentReceived,
}) => {
  const [receivingAmount, setReceivingAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [cashPart, setCashPart] = useState<string>('');
  const [upiPart, setUpiPart] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const currentPaid = sale?.paidAmount !== undefined 
    ? sale.paidAmount 
    : (sale?.paymentStatus === 'Pending' ? 0 : (sale?.grandTotal || 0));
  const currentPending = sale?.pendingAmount !== undefined 
    ? sale.pendingAmount 
    : Math.max(0, (sale?.grandTotal || 0) - currentPaid);

  useEffect(() => {
    if (sale && isOpen) {
      setReceivingAmount(String(currentPending));
      setPaymentMethod('UPI');
      setCashPart('');
      setUpiPart('');
      setNotes('');
      setError('');
    }
  }, [sale, isOpen, currentPending]);

  if (!sale) return null;

  const numReceiving = Number(receivingAmount) || 0;
  const newTotalPaid = currentPaid + numReceiving;
  const remainingPending = Math.max(0, sale.grandTotal - newTotalPaid);
  const newStatus: PaymentStatus = remainingPending === 0 ? 'Paid' : 'Partial';

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (numReceiving <= 0) {
      setError('Please enter a valid amount to receive.');
      return;
    }
    if (numReceiving > currentPending) {
      setError(`Amount cannot exceed the pending balance of ₹${currentPending.toLocaleString('en-IN')}.`);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const paymentDate = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
      const recordNote = `Received ₹${numReceiving.toLocaleString('en-IN')} via ${paymentMethod} on ${paymentDate}${notes.trim() ? ` (${notes.trim()})` : ''}`;
      const updatedNotes = sale.notes ? `${sale.notes}\n• ${recordNote}` : `• ${recordNote}`;

      const updated = await dataService.updateSale(sale.id, {
        paidAmount: newTotalPaid,
        pendingAmount: remainingPending,
        paymentStatus: newStatus,
        paymentMethod: paymentMethod, // updated last payment mode
        notes: updatedNotes,
      }, false); // don't adjust inventory for payment collection

      onPaymentReceived(updated);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to record payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Collect Due Balance • Invoice #${sale.invoiceNumber}`}
      subtitle={`Customer: ${sale.customerName} • Outstanding Due: ₹${currentPending.toLocaleString('en-IN')}`}
      maxWidth="500px"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', width: '100%' }}>
          <Button variant="outlined" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => handleSubmit()}
            isLoading={loading}
            type="button"
            style={{ fontWeight: 800 }}
          >
            Confirm Receipt (₹{numReceiving.toLocaleString('en-IN')})
          </Button>
        </div>
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
          marginBottom: '14px',
        }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Balance Status Banner */}
        <div style={{
          padding: '14px 18px',
          borderRadius: 'var(--radius-lg)',
          backgroundColor: 'var(--color-neutral-100)',
          border: '1px solid var(--color-neutral-300)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--color-neutral-500)', fontWeight: 700 }}>
              Invoice Total / Paid
            </div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-neutral-800)', marginTop: '2px' }}>
              ₹{sale.grandTotal.toLocaleString('en-IN')} (Paid: ₹{currentPaid.toLocaleString('en-IN')})
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--color-danger)', fontWeight: 700 }}>
              Current Pending Balance
            </div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-danger)', marginTop: '2px' }}>
              ₹{currentPending.toLocaleString('en-IN')}
            </div>
          </div>
        </div>

        {/* Amount Received Input */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-neutral-900)' }}>
              Amount Receiving Now (₹) *
            </span>
            <button
              type="button"
              onClick={() => setReceivingAmount(String(currentPending))}
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: 'var(--color-primary-800)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              Pay Full Pending (₹{currentPending.toLocaleString('en-IN')})
            </button>
          </div>
          <Input
            type="number"
            min="1"
            max={currentPending}
            value={receivingAmount}
            onChange={(e) => setReceivingAmount(e.target.value)}
            placeholder="0"
            required
          />
        </div>

        {/* Payment Method */}
        <Select
          label="Payment Received Via"
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
          options={PAYMENT_METHODS.map(m => ({ value: m, label: m }))}
        />

        {paymentMethod === 'Split (Cash + UPI)' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <Input
              label="Cash Amount (₹)"
              type="number"
              min="0"
              value={cashPart}
              onChange={(e) => setCashPart(e.target.value)}
              placeholder="Cash part"
            />
            <Input
              label="UPI Amount (₹)"
              type="number"
              min="0"
              value={upiPart}
              onChange={(e) => setUpiPart(e.target.value)}
              placeholder="UPI part"
            />
          </div>
        )}

        {/* Remaining Balance Preview Bar */}
        <div style={{
          padding: '10px 14px',
          borderRadius: 'var(--radius-md)',
          backgroundColor: remainingPending > 0 ? '#FEF2F2' : '#F0FDF4',
          border: remainingPending > 0 ? '1px solid #FCA5A5' : '1px solid #86EFAC',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {remainingPending > 0 ? (
              <AlertCircle size={16} color="#DC2626" />
            ) : (
              <CheckCircle2 size={16} color="#16A34A" />
            )}
            <span style={{ fontSize: '12px', fontWeight: 700, color: remainingPending > 0 ? '#991B1B' : '#166534' }}>
              {remainingPending > 0 ? `Remaining Due: ₹${remainingPending.toLocaleString('en-IN')} (Partial)` : 'Bill will be Marked Fully Paid!'}
            </span>
          </div>

          <span style={{ fontSize: '12px', fontWeight: 800, color: remainingPending > 0 ? '#DC2626' : '#16A34A' }}>
            New Status: {newStatus}
          </span>
        </div>

        {/* Payment Remarks */}
        <Input
          label="Receipt Remarks (Optional)"
          placeholder="e.g. Paid via GPay reference #..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </form>
    </Modal>
  );
};
