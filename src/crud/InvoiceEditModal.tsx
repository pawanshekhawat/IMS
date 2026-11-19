import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Trash2, 
  Plus, 
  Minus, 
  ShoppingBag 
} from 'lucide-react';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';
import type { Customer, Product, Sale, SaleItem, PaymentMethod, PaymentStatus } from '../types';
import { dataService } from '../services/dataService';

interface InvoiceEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: Sale | null;
  customers: Customer[];
  products: Product[];
  onSaleUpdated: (updatedSale: Sale) => void;
}

const PAYMENT_METHODS: PaymentMethod[] = ['UPI', 'Cash', 'Split (Cash + UPI)', 'Card', 'Store Credit'];

export const InvoiceEditModal: React.FC<InvoiceEditModalProps> = ({
  isOpen,
  onClose,
  sale,
  customers,
  products,
  onSaleUpdated,
}) => {
  const [invoiceDate, setInvoiceDate] = useState<string>('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerGstin, setCustomerGstin] = useState('');

  // Items
  const [items, setItems] = useState<SaleItem[]>([]);
  const [selectedProductIdToAdd, setSelectedProductIdToAdd] = useState<string>('');

  // Financials & Tax
  const [taxMode, setTaxMode] = useState<'included' | 'added'>('included');
  const [discountAmount, setDiscountAmount] = useState<number>(0);

  // Payments
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [paidAmountInput, setPaidAmountInput] = useState<string>('');
  const [cashAmountInput, setCashAmountInput] = useState<string>('');
  const [upiAmountInput, setUpiAmountInput] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [adjustStock, setAdjustStock] = useState<boolean>(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Initialize form state when sale opens
  useEffect(() => {
    if (sale && isOpen) {
      // Format date for datetime-local (YYYY-MM-DDTHH:mm)
      try {
        const d = new Date(sale.createdAt);
        const pad = (n: number) => String(n).padStart(2, '0');
        const formatted = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
        setInvoiceDate(formatted);
      } catch {
        setInvoiceDate('');
      }

      setSelectedCustomerId(sale.customerId || '');
      setCustomerName(sale.customerName || '');
      setCustomerPhone(sale.customerPhone || '');
      setCustomerAddress(sale.customerAddress || '');
      setCustomerGstin(sale.customerGstin || '');

      setItems(sale.items ? JSON.parse(JSON.stringify(sale.items)) : []);
      setTaxMode(sale.taxMode || (Math.abs(sale.grandTotal - (sale.subtotal - (sale.discountAmount || 0))) < 0.05 ? 'included' : 'added'));
      setDiscountAmount(sale.discountAmount || 0);

      setPaymentMethod(sale.paymentMethod || 'UPI');
      setPaidAmountInput(String(sale.paidAmount !== undefined ? sale.paidAmount : (sale.paymentStatus === 'Pending' ? 0 : sale.grandTotal)));
      setCashAmountInput(sale.cashAmount !== undefined ? String(sale.cashAmount) : '');
      setUpiAmountInput(sale.upiAmount !== undefined ? String(sale.upiAmount) : '');
      setNotes(sale.notes || '');
      setAdjustStock(true);
      setError('');
    }
  }, [sale, isOpen]);

  // Calculations
  const subtotal = items.reduce((sum, i) => sum + (i.unitPrice * i.quantity), 0);
  const taxRate = 18;

  let taxAmount = 0;
  let grandTotal = 0;

  if (taxMode === 'included') {
    // Reverted to 118: GST is calculated inside actual product price
    const netBase = Math.max(0, subtotal - discountAmount);
    taxAmount = Math.round(((netBase * 18 / 118) + Number.EPSILON) * 100) / 100;
    grandTotal = netBase;
  } else {
    // +18% added on top of subtotal
    taxAmount = Math.round(((subtotal * 18 / 100) + Number.EPSILON) * 100) / 100;
    grandTotal = Math.max(0, subtotal + taxAmount - discountAmount);
  }

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
      setCustomerAddress('');
      setCustomerGstin('');
    } else {
      const cust = customers.find(c => c.id === custId);
      if (cust) {
        setCustomerName(cust.name);
        setCustomerPhone(cust.phone || '');
        setCustomerAddress(cust.address || '');
        setCustomerGstin(cust.gstin || '');
      }
    }
  };

  const handleUpdateItemQuantity = (index: number, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveItem(index);
      return;
    }
    const updated = [...items];
    updated[index].quantity = newQty;
    updated[index].total = newQty * updated[index].unitPrice;
    setItems(updated);
  };

  const handleUpdateItemPrice = (index: number, newPrice: number) => {
    const updated = [...items];
    updated[index].unitPrice = Math.max(0, newPrice);
    updated[index].total = updated[index].quantity * updated[index].unitPrice;
    setItems(updated);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleAddItem = (productId: string) => {
    if (!productId) return;
    const prod = products.find(p => p.id === productId);
    if (!prod) return;

    const existingIdx = items.findIndex(i => i.productId === prod.id);
    if (existingIdx > -1) {
      handleUpdateItemQuantity(existingIdx, items[existingIdx].quantity + 1);
    } else {
      setItems([
        ...items,
        {
          productId: prod.id,
          productName: prod.name,
          sku: prod.sku,
          unitPrice: prod.sellingPrice,
          costPrice: prod.costPrice,
          quantity: 1,
          unit: prod.unit,
          total: prod.sellingPrice,
        }
      ]);
    }
    setSelectedProductIdToAdd('');
  };

  const handleSetFullPayment = () => {
    if (paymentMethod === 'Split (Cash + UPI)') {
      const half = Math.round(grandTotal / 2);
      setCashAmountInput(String(half));
      setUpiAmountInput(String(grandTotal - half));
    } else {
      setPaidAmountInput(String(grandTotal));
    }
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!sale) return;

    if (items.length === 0) {
      setError('Invoice must contain at least 1 item.');
      return;
    }
    if (!customerName.trim()) {
      setError('Customer name is required.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      let finalDateIso = sale.createdAt;
      if (invoiceDate) {
        finalDateIso = new Date(invoiceDate).toISOString();
      }

      const updated = await dataService.updateSale(sale.id, {
        createdAt: finalDateIso,
        customerId: selectedCustomerId || undefined,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim() || undefined,
        customerAddress: customerAddress.trim() || undefined,
        customerGstin: customerGstin.trim() || undefined,
        items,
        subtotal,
        taxRate,
        taxAmount,
        taxMode,
        discountAmount,
        grandTotal,
        paidAmount: effectivePaidAmount,
        pendingAmount,
        cashAmount: paymentMethod === 'Split (Cash + UPI)' ? effectiveCashAmount : undefined,
        upiAmount: paymentMethod === 'Split (Cash + UPI)' ? effectiveUpiAmount : undefined,
        paymentMethod,
        paymentStatus: calculatedPaymentStatus,
        notes: notes.trim() || undefined,
      }, adjustStock);

      onSaleUpdated(updated);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update invoice');
    } finally {
      setLoading(false);
    }
  };

  if (!sale) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit Invoice #${sale.invoiceNumber}`}
      subtitle={`Administrator mode • Modify invoice date, items, prices, customer details, and payments`}
      maxWidth="780px"
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--color-neutral-700)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={adjustStock}
                onChange={(e) => setAdjustStock(e.target.checked)}
                style={{ accentColor: 'var(--color-primary-800)' }}
              />
              Auto-sync inventory stock for item changes
            </label>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <Button variant="outlined" onClick={onClose} type="button">
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => handleSave()}
              isLoading={loading}
              type="button"
              style={{ fontWeight: 800 }}
            >
              Save Invoice Changes (₹{grandTotal.toLocaleString('en-IN')})
            </Button>
          </div>
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

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {/* Invoice Date & Time */}
        <div style={{
          padding: '12px 16px',
          backgroundColor: 'var(--color-neutral-100)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-neutral-300)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          flexWrap: 'wrap',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={18} color="var(--color-primary-800)" />
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-neutral-900)' }}>
                Invoice Date & Time
              </div>
              <div style={{ fontSize: '11px', color: 'var(--color-neutral-500)' }}>
                Original: {new Date(sale.createdAt).toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          <div style={{ width: '240px' }}>
            <Input
              type="datetime-local"
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
            />
          </div>
        </div>

        {/* Customer Information Section */}
        <div style={{
          padding: '14px 18px',
          backgroundColor: '#FFFFFF',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-neutral-300)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}>
          <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--color-neutral-900)' }}>
            Customer Details
          </div>

          <Select
            label="Pick Existing Customer (Optional)"
            value={selectedCustomerId}
            onChange={(e) => handleCustomerSelect(e.target.value)}
            options={[
              { value: '', label: '-- Direct / Custom Customer --' },
              ...customers.map(c => ({ value: c.id, label: `${c.name} (${c.phone || 'No phone'})` }))
            ]}
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Input
              label="Customer Name *"
              placeholder="Full name or company"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              required
            />
            <Input
              label="Mobile Number"
              placeholder="+91 Mobile number"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '12px' }}>
            <Input
              label="Billing / Delivery Address"
              placeholder="e.g. Piprali Road, Sikar"
              value={customerAddress}
              onChange={(e) => setCustomerAddress(e.target.value)}
            />
            <Input
              label="GSTIN (Optional)"
              placeholder="e.g. 05AAACG1234F1Z8"
              value={customerGstin}
              onChange={(e) => setCustomerGstin(e.target.value)}
            />
          </div>
        </div>

        {/* Itemized Products in Invoice */}
        <div style={{
          padding: '14px 18px',
          backgroundColor: '#FFFFFF',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-neutral-300)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--color-neutral-900)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShoppingBag size={16} color="var(--color-primary-800)" />
              <span>Products Billed ({items.length} items)</span>
            </div>

            {/* Quick Add Product Dropdown */}
            <div style={{ width: '280px' }}>
              <Select
                value={selectedProductIdToAdd}
                onChange={(e) => handleAddItem(e.target.value)}
                options={[
                  { value: '', label: '+ Add Product to Bill...' },
                  ...products.map(p => ({ value: p.id, label: `${p.name} (₹${p.sellingPrice})` }))
                ]}
              />
            </div>
          </div>

          {items.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-danger)', fontSize: '12px', fontWeight: 600 }}>
              No items in invoice. Please add at least 1 product using the dropdown above.
            </div>
          ) : (
            <div style={{ overflowX: 'auto', maxHeight: '240px', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--color-neutral-200)', borderBottom: '1.5px solid var(--color-neutral-300)' }}>
                    <th style={{ padding: '8px 10px', fontWeight: 700 }}>Item Description</th>
                    <th style={{ padding: '8px 10px', fontWeight: 700, width: '100px' }}>Rate (₹)</th>
                    <th style={{ padding: '8px 10px', fontWeight: 700, textAlign: 'center', width: '110px' }}>Qty</th>
                    <th style={{ padding: '8px 10px', fontWeight: 700, textAlign: 'right', width: '90px' }}>Total (₹)</th>
                    <th style={{ padding: '8px 10px', width: '40px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--color-neutral-200)' }}>
                      <td style={{ padding: '8px 10px' }}>
                        <div style={{ fontWeight: 700, color: 'var(--color-neutral-900)' }}>{item.productName}</div>
                        <div style={{ fontSize: '11px', color: 'var(--color-neutral-500)' }}>{item.sku}</div>
                      </td>
                      <td style={{ padding: '8px 10px' }}>
                        <input
                          type="number"
                          min="0"
                          value={item.unitPrice}
                          onChange={(e) => handleUpdateItemPrice(idx, Number(e.target.value))}
                          style={{
                            width: '85px',
                            padding: '4px 6px',
                            fontSize: '12px',
                            fontWeight: 700,
                            borderRadius: '4px',
                            border: '1px solid var(--color-neutral-300)',
                          }}
                        />
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <button
                            type="button"
                            onClick={() => handleUpdateItemQuantity(idx, item.quantity - 1)}
                            style={{
                              width: '22px',
                              height: '22px',
                              borderRadius: '50%',
                              border: '1px solid var(--color-neutral-300)',
                              backgroundColor: '#FFFFFF',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Minus size={11} />
                          </button>
                          <span style={{ fontWeight: 800, minWidth: '22px', textAlign: 'center' }}>
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleUpdateItemQuantity(idx, item.quantity + 1)}
                            style={{
                              width: '22px',
                              height: '22px',
                              borderRadius: '50%',
                              border: '1px solid var(--color-neutral-300)',
                              backgroundColor: '#FFFFFF',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Plus size={11} />
                          </button>
                        </div>
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 800, color: 'var(--color-primary-800)' }}>
                        ₹{item.total.toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          style={{
                            border: 'none',
                            background: 'none',
                            color: 'var(--color-danger)',
                            cursor: 'pointer',
                            padding: '2px',
                          }}
                          title="Remove item from invoice"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* GST & Discount Section */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <Select
            label="GST Billing Option"
            value={taxMode}
            onChange={(e) => setTaxMode(e.target.value as 'included' | 'added')}
            options={[
              { value: 'included', label: 'GST Already Paid / Included (Calculated in Price)' },
              { value: 'added', label: '+18% GST (Added on Subtotal)' },
            ]}
          />
          <Input
            label="Special Discount (₹)"
            type="number"
            min="0"
            value={discountAmount}
            onChange={(e) => setDiscountAmount(Number(e.target.value))}
          />
        </div>

        {/* Summary Highlight Banner */}
        <div style={{
          padding: '16px 20px',
          borderRadius: 'var(--radius-xl)',
          backgroundColor: 'var(--color-primary-800)',
          color: '#FFFFFF',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div>
            <span style={{ fontSize: '11px', color: 'var(--color-primary-300)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
              Updated Grand Total
            </span>
            <div style={{ fontSize: '24px', fontWeight: 800, marginTop: '2px' }}>
              ₹{grandTotal.toLocaleString('en-IN')}
            </div>
          </div>
          <div style={{ textAlign: 'right', fontSize: '12px', color: 'var(--color-primary-200)' }}>
            <div>Subtotal: ₹{subtotal.toLocaleString('en-IN')}</div>
            {taxAmount > 0 && (
              <div>
                {taxMode === 'included'
                  ? `GST (18% Already Paid): ₹${taxAmount.toLocaleString('en-IN')}`
                  : `GST (+18% Added): ₹${taxAmount.toLocaleString('en-IN')}`}
              </div>
            )}
            {discountAmount > 0 && <div style={{ color: 'var(--color-tertiary-400)' }}>Disc: -₹{discountAmount}</div>}
          </div>
        </div>

        {/* Payment Details */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <Select
            label="Payment Mode"
            value={paymentMethod}
            onChange={(e) => {
              setPaymentMethod(e.target.value as PaymentMethod);
            }}
            options={PAYMENT_METHODS.map(m => ({ value: m, label: m }))}
          />

          {paymentMethod === 'Split (Cash + UPI)' ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <Input
                label="Cash (₹)"
                type="number"
                min="0"
                value={cashAmountInput}
                onChange={(e) => {
                  setCashAmountInput(e.target.value);
                }}
              />
              <Input
                label="UPI (₹)"
                type="number"
                min="0"
                value={upiAmountInput}
                onChange={(e) => {
                  setUpiAmountInput(e.target.value);
                }}
              />
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-neutral-700)' }}>
                  Amount Received (₹)
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
                      cursor: 'pointer',
                      textDecoration: 'underline',
                    }}
                  >
                    Mark Fully Paid
                  </button>
                )}
              </div>
              <Input
                type="number"
                min="0"
                value={paidAmountInput}
                onChange={(e) => {
                  setPaidAmountInput(e.target.value);
                }}
                placeholder={`₹${grandTotal}`}
              />
            </div>
          )}
        </div>

        {/* Payment Status / Pending Alert Bar */}
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
              Payment Status: {calculatedPaymentStatus === 'Paid' ? 'Fully Paid' : calculatedPaymentStatus === 'Partial' ? 'Partial Payment (Half Paid)' : 'Pending (Unpaid)'}
            </span>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#374151' }}>
              Paid Amount: <strong>₹{effectivePaidAmount.toLocaleString('en-IN')}</strong>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 700, color: pendingAmount > 0 ? '#DC2626' : '#16A34A' }}>
              Pending Balance
            </span>
            <div style={{ fontSize: '17px', fontWeight: 800, color: pendingAmount > 0 ? '#DC2626' : '#16A34A' }}>
              ₹{pendingAmount.toLocaleString('en-IN')}
            </div>
          </div>
        </div>

        {/* Remarks / Notes */}
        <Input
          label="Remarks / Installation Notes"
          placeholder="e.g. Changed chandelier model per client request"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </form>
    </Modal>
  );
};
