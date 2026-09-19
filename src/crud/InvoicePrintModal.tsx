import React, { useState } from 'react';
import { Printer, FileText, Receipt as ReceiptIcon } from 'lucide-react';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import type { Sale } from '../types';

interface InvoicePrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: Sale | null;
}

export const InvoicePrintModal: React.FC<InvoicePrintModalProps> = ({
  isOpen,
  onClose,
  sale,
}) => {
  const [printFormat, setPrintFormat] = useState<'A4' | 'Thermal'>('A4');

  if (!sale) return null;

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Date(sale.createdAt).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const formatCurrency = (amount: number) => {
    // Avoid ugly floating-point math like 30878.239999999998
    const rounded = Math.round((amount + Number.EPSILON) * 100) / 100;
    return rounded % 1 === 0
      ? rounded.toLocaleString('en-IN')
      : rounded.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Invoice & Receipt Preview"
      subtitle={`Invoice #${sale.invoiceNumber} • ${sale.customerName}`}
      maxWidth={printFormat === 'A4' ? '820px' : '540px'}
      footer={
        <div style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          flexWrap: 'wrap',
        }}>
          <Button variant="outlined" size="md" onClick={onClose} type="button">
            Close
          </Button>

          <Button
            variant="tertiary"
            size="md"
            icon={<Printer size={16} />}
            onClick={handlePrint}
            type="button"
            style={{ minWidth: '150px' }}
          >
            {printFormat === 'A4' ? 'Print A4 Invoice' : 'Print Thermal Slip'}
          </Button>
        </div>
      }
    >
      {/* Format Selector Pill Tabs (Screen Only - Hidden in Print) */}
      <div className="no-print" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '16px',
      }}>
        <div style={{
          display: 'inline-flex',
          padding: '4px',
          backgroundColor: 'var(--color-neutral-250)',
          borderRadius: 'var(--radius-full)',
          border: '1px solid var(--color-neutral-300)',
          gap: '6px',
        }}>
          <button
            type="button"
            onClick={() => setPrintFormat('A4')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 18px',
              borderRadius: 'var(--radius-full)',
              border: 'none',
              backgroundColor: printFormat === 'A4' ? 'var(--color-primary-800)' : 'transparent',
              color: printFormat === 'A4' ? '#FFFFFF' : 'var(--color-neutral-700)',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <FileText size={15} color={printFormat === 'A4' ? '#FFFFFF' : 'currentColor'} />
            A4 Tax Invoice
          </button>

          <button
            type="button"
            onClick={() => setPrintFormat('Thermal')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 18px',
              borderRadius: 'var(--radius-full)',
              border: 'none',
              backgroundColor: printFormat === 'Thermal' ? 'var(--color-primary-800)' : 'transparent',
              color: printFormat === 'Thermal' ? '#FFFFFF' : 'var(--color-neutral-700)',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <ReceiptIcon size={15} color={printFormat === 'Thermal' ? '#FFFFFF' : 'currentColor'} />
            80mm Thermal Slip
          </button>
        </div>
      </div>

      {/* Printable Paper Area */}
      <div className="printable-area" style={{ color: '#111827', fontSize: '13px', lineHeight: '1.4' }}>
        {printFormat === 'A4' ? (
          /* A4 Standard Tax Invoice Format */
          <div style={{
            border: '1px solid #E5E7EB',
            borderRadius: '8px',
            padding: '28px',
            backgroundColor: '#FFFFFF',
          }}>
            {/* Header / Store details */}
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #064D3D', paddingBottom: '16px' }}>
              <div>
                <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#064D3D', letterSpacing: '-0.02em', margin: 0 }}>
                  GARHWAL LIGHTS
                </h1>
                <p style={{ fontSize: '12px', fontWeight: 600, color: '#4B5563', margin: '2px 0 0 0' }}>
                  Architectural & Decorative Lighting Showroom
                </p>
                <p style={{ fontSize: '11px', color: '#6B7280', margin: '2px 0 0 0' }}>
                  14, Rajpur Road, Dehradun, Uttarakhand - 248001
                </p>
                <p style={{ fontSize: '11px', color: '#6B7280', margin: '2px 0 0 0' }}>
                  GSTIN: 05AAACG9999P1Z3 | Phone: +91 98970 00123
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{
                  display: 'inline-block',
                  backgroundColor: '#064D3D',
                  color: '#FFFFFF',
                  padding: '4px 12px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}>
                  Tax Invoice
                </span>
                <p style={{ fontSize: '13px', fontWeight: 700, margin: '8px 0 2px 0' }}>
                  {sale.invoiceNumber}
                </p>
                <p style={{ fontSize: '11px', color: '#6B7280', margin: 0 }}>
                  Date: {formattedDate}
                </p>
              </div>
            </div>

            {/* Bill To */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '16px 0',
              borderBottom: '1px solid #E5E7EB',
            }}>
              <div>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#9CA3AF', fontWeight: 700 }}>
                  Billed To:
                </span>
                <p style={{ fontSize: '14px', fontWeight: 700, margin: '2px 0 0 0', color: '#111827' }}>
                  {sale.customerName}
                </p>
                {sale.customerPhone && (
                  <p style={{ fontSize: '12px', color: '#4B5563', margin: '2px 0 0 0' }}>
                    Phone: {sale.customerPhone}
                  </p>
                )}
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#9CA3AF', fontWeight: 700 }}>
                  Payment Details:
                </span>
                <p style={{ fontSize: '12px', fontWeight: 600, color: '#111827', margin: '2px 0 0 0' }}>
                  Mode: <strong style={{ color: '#064D3D' }}>{sale.paymentMethod}</strong>
                </p>
                <p style={{ fontSize: '12px', fontWeight: 600, color: '#16A34A', margin: '2px 0 0 0' }}>
                  Status: <strong>{sale.paymentStatus}</strong>
                </p>
              </div>
            </div>

            {/* Itemized Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', margin: '20px 0', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#F3F4F6', borderBottom: '1.5px solid #D1D5DB' }}>
                  <th style={{ padding: '8px 10px', fontSize: '11px', fontWeight: 700, width: '30px' }}>#</th>
                  <th style={{ padding: '8px 10px', fontSize: '11px', fontWeight: 700 }}>Item Description</th>
                  <th style={{ padding: '8px 10px', fontSize: '11px', fontWeight: 700 }}>SKU</th>
                  <th style={{ padding: '8px 10px', fontSize: '11px', fontWeight: 700, textAlign: 'center' }}>Qty</th>
                  <th style={{ padding: '8px 10px', fontSize: '11px', fontWeight: 700, textAlign: 'right' }}>Unit Rate</th>
                  <th style={{ padding: '8px 10px', fontSize: '11px', fontWeight: 700, textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {sale.items.map((item, index) => (
                  <tr key={index} style={{ borderBottom: '1px solid #E5E7EB' }}>
                    <td style={{ padding: '10px', fontSize: '12px', color: '#6B7280' }}>{index + 1}</td>
                    <td style={{ padding: '10px', fontSize: '13px', fontWeight: 600 }}>{item.productName}</td>
                    <td style={{ padding: '10px', fontSize: '11px', color: '#6B7280' }}>{item.sku}</td>
                    <td style={{ padding: '10px', fontSize: '12px', textAlign: 'center' }}>{item.quantity} {item.unit}</td>
                    <td style={{ padding: '10px', fontSize: '12px', textAlign: 'right' }}>₹{formatCurrency(item.unitPrice)}</td>
                    <td style={{ padding: '10px', fontSize: '13px', fontWeight: 700, textAlign: 'right' }}>₹{formatCurrency(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Calculations & Summary */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
              <div style={{ width: '280px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#4B5563' }}>
                  <span>Subtotal:</span>
                  <span>₹{formatCurrency(sale.subtotal)}</span>
                </div>
                {sale.taxAmount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#4B5563' }}>
                    <span>GST ({sale.taxRate}% Included):</span>
                    <span>₹{formatCurrency(sale.taxAmount)}</span>
                  </div>
                )}
                {sale.discountAmount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#DC2626' }}>
                    <span>Discount:</span>
                    <span>-₹{formatCurrency(sale.discountAmount)}</span>
                  </div>
                )}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '16px',
                  fontWeight: 800,
                  color: '#064D3D',
                  borderTop: '2px solid #064D3D',
                  paddingTop: '8px',
                  marginTop: '4px',
                }}>
                  <span>Grand Total:</span>
                  <span>₹{formatCurrency(sale.grandTotal)}</span>
                </div>
              </div>
            </div>

            {/* Terms & Footer */}
            <div style={{ marginTop: '36px', paddingTop: '16px', borderTop: '1px dashed #D1D5DB', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div style={{ maxWidth: '400px', fontSize: '10px', color: '#6B7280' }}>
                <p style={{ fontWeight: 700, margin: '0 0 2px 0' }}>Terms & Conditions:</p>
                <p style={{ margin: 0 }}>1. Goods once sold can only be exchanged within 7 days in original condition.</p>
                <p style={{ margin: 0 }}>2. 1-2 Year Manufacturer Warranty on LED drivers, downlights & strip lights.</p>
                <p style={{ margin: 0 }}>3. Subject to Dehradun Jurisdiction.</p>
              </div>

              <div style={{ textAlign: 'center' }}>
                <div style={{ width: '140px', height: '40px', borderBottom: '1px solid #111827', margin: '0 auto 4px auto' }} />
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#374151' }}>For Garhwal Lights</span>
              </div>
            </div>
          </div>
        ) : (
          /* 80mm Thermal Receipt Format */
          <div style={{
            maxWidth: '340px',
            margin: '0 auto',
            padding: '20px',
            border: '1px dashed #9CA3AF',
            fontFamily: 'monospace',
            fontSize: '12px',
            backgroundColor: '#FAFAFA',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          }}>
            <div style={{ textAlign: 'center', marginBottom: '12px' }}>
              <h2 style={{ fontSize: '17px', fontWeight: 900, margin: 0, color: '#000' }}>GARHWAL LIGHTS</h2>
              <p style={{ margin: '2px 0', fontSize: '11px', color: '#374151' }}>Showroom - Dehradun</p>
              <p style={{ margin: '2px 0', fontSize: '10px', color: '#4B5563' }}>Ph: +91 98970 00123</p>
              <p style={{ margin: '6px 0 0 0', borderTop: '1px dashed #000', paddingTop: '6px', fontWeight: 700 }}>
                Inv: {sale.invoiceNumber}
              </p>
              <p style={{ margin: 0, fontSize: '10px', color: '#6B7280' }}>{formattedDate}</p>
            </div>

            <div style={{ borderTop: '1px dashed #000', borderBottom: '1px dashed #000', padding: '8px 0', margin: '8px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, paddingBottom: '4px' }}>
                <span>Item</span>
                <span>Qty x Rate</span>
                <span>Total</span>
              </div>
              {sale.items.map((i, idx) => (
                <div key={idx} style={{ marginTop: '6px' }}>
                  <div style={{ fontWeight: 700 }}>{i.productName}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#4B5563', fontSize: '11px', marginTop: '1px' }}>
                    <span>{i.quantity} {i.unit} @ ₹{formatCurrency(i.unitPrice)}</span>
                    <span style={{ fontWeight: 700, color: '#000' }}>₹{formatCurrency(i.total)}</span>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div>Subtotal: ₹{formatCurrency(sale.subtotal)}</div>
              {sale.taxAmount > 0 && <div>GST ({sale.taxRate}%): ₹{formatCurrency(sale.taxAmount)}</div>}
              {sale.discountAmount > 0 && <div style={{ color: '#DC2626' }}>Discount: -₹{formatCurrency(sale.discountAmount)}</div>}
              <div style={{
                fontSize: '15px',
                fontWeight: 900,
                borderTop: '1.5px solid #000',
                paddingTop: '6px',
                marginTop: '4px',
                color: '#000',
              }}>
                TOTAL: ₹{formatCurrency(sale.grandTotal)}
              </div>
              <div style={{ fontSize: '11px', color: '#4B5563' }}>Paid via: <strong>{sale.paymentMethod}</strong></div>
            </div>

            <div style={{ textAlign: 'center', marginTop: '18px', fontSize: '11px', borderTop: '1px dashed #D1D5DB', paddingTop: '10px' }}>
              <p style={{ margin: 0, fontWeight: 700 }}>Thank you for lighting your home with us!</p>
              <p style={{ margin: '2px 0 0 0', color: '#6B7280' }}>Please Visit Again</p>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
