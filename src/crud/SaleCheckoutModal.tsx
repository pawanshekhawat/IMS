import React, { useState } from 'react';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';
import type { Customer, SaleItem, PaymentMethod, Sale } from '../types';
import { dataService } from '../services/dataService';

interface SaleCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: SaleItem[];
  customers: Customer[];
  onSaleCompleted: (completedSale: Sale) => void;
}

const PAYMENT_METHODS: PaymentMethod[] = ['UPI', 'Cash', 'Card', 'Store Credit'];

export const SaleCheckoutModal: React.FC<SaleCheckoutModalProps> = ({
  isOpen,
  onClose,
  cartItems,
  customers,
  onSaleCompleted,
}) => {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [customerName, setCustomerName] = useState('Walk-in Retail Customer');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [taxRate, setTaxRate] = useState<number>(18); // default 18% GST for lighting fixtures
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const subtotal = cartItems.reduce((sum, item) => sum + item.total, 0);
  const taxAmount = (subtotal * taxRate) / 100;
  const grandTotal = Math.max(0, subtotal + taxAmount - discountAmount);

  const handleCustomerSelect = (custId: string) => {
    setSelectedCustomerId(custId);
    if (!custId) {
      setCustomerName('Walk-in Retail Customer');
      setCustomerPhone('');
    } else {
      const cust = customers.find(c => c.id === custId);
      if (cust) {
        setCustomerName(cust.name);
        setCustomerPhone(cust.phone);
      }
    }
  };

  const handleProcessCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) {
      setError('Cart is empty. Please add items before checking out.');
      return;
    }
    if (!customerName.trim()) {
      setError('Customer name is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const createdSale = await dataService.createSale({
        customerId: selectedCustomerId || undefined,
        customerName,
        customerPhone: customerPhone || undefined,
        items: cartItems,
        subtotal,
        taxRate,
        taxAmount,
        discountAmount,
        grandTotal,
        paymentMethod,
        paymentStatus: 'Paid',
        notes,
      });

      onSaleCompleted(createdSale);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to complete transaction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Complete Sale & Checkout"
      subtitle={`${cartItems.length} items in cart • Ready for billing`}
      maxWidth="600px"
      footer={
        <>
          <Button variant="outlined" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button
            variant="tertiary"
            onClick={handleProcessCheckout}
            isLoading={loading}
            type="button"
            style={{ fontWeight: 800 }}
          >
            Confirm & Print Bill (₹{grandTotal.toLocaleString('en-IN')})
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

      <form onSubmit={handleProcessCheckout} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Total Summary Highlight Banner */}
        <div style={{
          padding: '18px 22px',
          borderRadius: 'var(--radius-xl)',
          backgroundColor: 'var(--color-primary-800)',
          color: '#FFFFFF',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 4px 14px rgba(6, 77, 61, 0.25)',
        }}>
          <div>
            <span style={{ fontSize: '12px', color: 'var(--color-primary-300)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
              Amount Payable
            </span>
            <div style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-0.02em', marginTop: '2px' }}>
              ₹{grandTotal.toLocaleString('en-IN')}
            </div>
          </div>
          <div style={{ textAlign: 'right', fontSize: '12px', color: 'var(--color-primary-200)' }}>
            <div>Subtotal: ₹{subtotal.toLocaleString('en-IN')}</div>
            {taxAmount > 0 && <div>GST ({taxRate}%): ₹{taxAmount.toLocaleString('en-IN')}</div>}
            {discountAmount > 0 && <div style={{ color: 'var(--color-tertiary-400)' }}>Disc: -₹{discountAmount}</div>}
          </div>
        </div>

        {/* Customer Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <Select
            label="Select Existing Customer (or Walk-in)"
            value={selectedCustomerId}
            onChange={(e) => handleCustomerSelect(e.target.value)}
            options={[
              { value: '', label: '⚡ Walk-in Retail Customer' },
              ...customers.map(c => ({ value: c.id, label: `${c.name} (${c.phone})` }))
            ]}
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Input
              label="Customer Name *"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              required
            />
            <Input
              label="Phone Number"
              placeholder="+91"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
            />
          </div>
        </div>

        {/* Payment & Adjustments */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <Select
            label="Payment Method"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
            options={PAYMENT_METHODS.map(m => ({ value: m, label: m }))}
          />
          <Select
            label="GST Rate"
            value={taxRate}
            onChange={(e) => setTaxRate(Number(e.target.value))}
            options={[
              { value: 18, label: '18% GST (Standard Fixtures)' },
              { value: 12, label: '12% GST' },
              { value: 5, label: '5% GST' },
              { value: 0, label: '0% (Exempt / Bill without GST)' },
            ]}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <Input
            label="Special Discount (₹)"
            type="number"
            min="0"
            value={discountAmount}
            onChange={(e) => setDiscountAmount(Number(e.target.value))}
          />
          <Input
            label="Remarks / Installation Notes"
            placeholder="e.g. Technician Anand to install"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </form>
    </Modal>
  );
};
