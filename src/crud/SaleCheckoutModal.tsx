import React, { useState, useEffect } from 'react';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';
import type { Customer, SaleItem, PaymentMethod, PaymentStatus, Sale } from '../types';
import { dataService } from '../services/dataService';

interface SaleCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: SaleItem[];
  customers: Customer[];
  onSaleCompleted: (completedSale: Sale) => void;
}

const PAYMENT_METHODS: PaymentMethod[] = ['UPI', 'Cash', 'Split (Cash + UPI)', 'Card', 'Store Credit'];

export const SaleCheckoutModal: React.FC<SaleCheckoutModalProps> = ({
  isOpen,
  onClose,
  cartItems,
  customers,
  onSaleCompleted,
}) => {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [taxRate, setTaxRate] = useState<number>(18); // default 18% GST for lighting fixtures
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Payment states
  const [paidAmountInput, setPaidAmountInput] = useState<string>('');
  const [isCustomPaid, setIsCustomPaid] = useState<boolean>(false);
  const [cashAmountInput, setCashAmountInput] = useState<string>('');
  const [upiAmountInput, setUpiAmountInput] = useState<string>('');

  const subtotal = cartItems.reduce((sum, item) => sum + item.total, 0);
  const taxAmount = (subtotal * taxRate) / 100;
  const grandTotal = Math.max(0, subtotal + taxAmount - discountAmount);

  // Sync default paid amount with grandTotal unless staff customized it
  useEffect(() => {
    if (paymentMethod === 'Split (Cash + UPI)') {
      if (!isCustomPaid) {
        const half = Math.round(grandTotal / 2);
        setCashAmountInput(String(half));
        setUpiAmountInput(String(grandTotal - half));
      }
    } else {
      if (!isCustomPaid) {
        setPaidAmountInput(String(grandTotal));
      }
    }
  }, [grandTotal, paymentMethod, isCustomPaid]);

  // Reset states when modal re-opens
  useEffect(() => {
    if (isOpen) {
      setIsCustomPaid(false);
      setPaidAmountInput(String(grandTotal));
      setCashAmountInput('');
      setUpiAmountInput('');
      setError('');
    }
  }, [isOpen]);

  const effectiveCashAmount = paymentMethod === 'Split (Cash + UPI)' ? Number(cashAmountInput || 0) : 0;
  const effectiveUpiAmount = paymentMethod === 'Split (Cash + UPI)' ? Number(upiAmountInput || 0) : 0;

  const effectivePaidAmount = paymentMethod === 'Split (Cash + UPI)'
    ? effectiveCashAmount + effectiveUpiAmount
    : Number(paidAmountInput || 0);

  const pendingAmount = Math.max(0, grandTotal - effectivePaidAmount);

  const calculatedPaymentStatus: PaymentStatus =
    effectivePaidAmount >= grandTotal
      ? 'Paid'
      : effectivePaidAmount > 0
        ? 'Partial'
        : 'Pending';

  const handleCustomerSelect = (custId: string) => {
    setSelectedCustomerId(custId);
    if (!custId) {
      setCustomerName('');
      setCustomerPhone('');
    } else {
      const cust = customers.find(c => c.id === custId);
      if (cust) {
        setCustomerName(cust.name);
        setCustomerPhone(cust.phone);
      }
    }
  };

  const handleSetFullPayment = () => {
    setIsCustomPaid(false);
    if (paymentMethod === 'Split (Cash + UPI)') {
      const half = Math.round(grandTotal / 2);
      setCashAmountInput(String(half));
      setUpiAmountInput(String(grandTotal - half));
    } else {
      setPaidAmountInput(String(grandTotal));
    }
  };

  const handleProcessCheckout = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (cartItems.length === 0) {
      setError('Cart is empty. Please add items before checking out.');
      return;
    }
    if (!customerName.trim()) {
      setError('Customer name is required. Please enter the customer name.');
      return;
    }
    if (effectivePaidAmount < 0) {
      setError('Paid amount cannot be negative.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const createdSale = await dataService.createSale({
        customerId: selectedCustomerId || undefined,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim() || undefined,
        items: cartItems,
        subtotal,
        taxRate,
        taxAmount,
        discountAmount,
        grandTotal,
        paidAmount: effectivePaidAmount,
        pendingAmount,
        cashAmount: paymentMethod === 'Split (Cash + UPI)' ? effectiveCashAmount : undefined,
        upiAmount: paymentMethod === 'Split (Cash + UPI)' ? effectiveUpiAmount : undefined,
        paymentMethod,
        paymentStatus: calculatedPaymentStatus,
        notes: notes.trim() || undefined,
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
      maxWidth="620px"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', width: '100%' }}>
          <Button variant="outlined" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button
            variant="tertiary"
            onClick={() => handleProcessCheckout()}
            isLoading={loading}
            type="button"
            style={{ fontWeight: 800 }}
          >
            Confirm & Print Bill (₹{grandTotal.toLocaleString('en-IN')})
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
            label="Select Existing Customer (Optional)"
            value={selectedCustomerId}
            onChange={(e) => handleCustomerSelect(e.target.value)}
            options={[
              { value: '', label: '-- New / Direct Customer (Enter Details Below) --' },
              ...customers.map(c => ({ value: c.id, label: `${c.name} (${c.phone || 'No phone'})` }))
            ]}
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Input
              label="Customer Name *"
              placeholder="Enter customer name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              required
            />
            <Input
              label="Phone Number"
              placeholder="+91 Mobile number"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
            />
          </div>
        </div>

        {/* Payment Method & GST */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <Select
            label="Payment Mode"
            value={paymentMethod}
            onChange={(e) => {
              setPaymentMethod(e.target.value as PaymentMethod);
              setIsCustomPaid(false);
            }}
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

        {/* Split Payment (Cash + UPI) Fields OR Single Mode Paid Amount */}
        {paymentMethod === 'Split (Cash + UPI)' ? (
          <div style={{
            padding: '14px 16px',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: 'rgba(6, 77, 61, 0.05)',
            border: '1.5px dashed var(--color-primary-600)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-primary-900)' }}>
                Split Payment Breakdown
              </span>
              <button
                type="button"
                onClick={handleSetFullPayment}
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'var(--color-primary-700)',
                  background: 'none',
                  border: 'none',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                }}
              >
                Auto Split (50/50)
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <Input
                label="Cash Amount (₹)"
                type="number"
                min="0"
                value={cashAmountInput}
                onChange={(e) => {
                  setIsCustomPaid(true);
                  setCashAmountInput(e.target.value);
                }}
                placeholder="0"
              />
              <Input
                label="UPI Amount (₹)"
                type="number"
                min="0"
                value={upiAmountInput}
                onChange={(e) => {
                  setIsCustomPaid(true);
                  setUpiAmountInput(e.target.value);
                }}
                placeholder="0"
              />
            </div>
          </div>
        ) : (
          <div style={{
            padding: '14px 16px',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: 'var(--color-neutral-250)',
            border: '1px solid var(--color-neutral-300)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-neutral-800)' }}>
                Paid Amount (Partial / Full)
              </span>
              {effectivePaidAmount !== grandTotal && (
                <button
                  type="button"
                  onClick={handleSetFullPayment}
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: 'var(--color-primary-700)',
                    background: 'none',
                    border: 'none',
                    textDecoration: 'underline',
                    cursor: 'pointer',
                  }}
                >
                  Pay Full (₹{grandTotal.toLocaleString('en-IN')})
                </button>
              )}
            </div>

            <Input
              label="Amount Received (₹)"
              type="number"
              min="0"
              max={grandTotal * 2}
              value={paidAmountInput}
              onChange={(e) => {
                setIsCustomPaid(true);
                setPaidAmountInput(e.target.value);
              }}
              placeholder={`₹${grandTotal}`}
            />
          </div>
        )}

        {/* Payment Status & Pending Balance Indicator */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '10px 14px',
          borderRadius: 'var(--radius-md)',
          backgroundColor: pendingAmount > 0 ? '#FEF2F2' : '#F0FDF4',
          border: pendingAmount > 0 ? '1px solid #FCA5A5' : '1px solid #86EFAC',
        }}>
          <div>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 700, color: pendingAmount > 0 ? '#991B1B' : '#166534' }}>
              Payment Status: {calculatedPaymentStatus === 'Paid' ? 'Fully Paid' : calculatedPaymentStatus === 'Partial' ? 'Partial Payment' : 'Pending'}
            </span>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>
              Paid: <strong>₹{effectivePaidAmount.toLocaleString('en-IN')}</strong>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 700, color: pendingAmount > 0 ? '#DC2626' : '#16A34A' }}>
              Pending Balance
            </span>
            <div style={{ fontSize: '18px', fontWeight: 800, color: pendingAmount > 0 ? '#DC2626' : '#16A34A' }}>
              ₹{pendingAmount.toLocaleString('en-IN')}
            </div>
          </div>
        </div>

        {/* Discounts & Notes */}
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
