import React, { useState, useEffect, useMemo } from 'react';
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  FileText, 
  Calendar, 
  Receipt, 
  Package, 
  Printer, 
  Edit2, 
  AlertCircle, 
  CheckCircle2, 
  Search 
} from 'lucide-react';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { dataService } from '../services/dataService';
import type { Customer, Sale } from '../types';
import { InvoicePrintModal } from './InvoicePrintModal';

interface CustomerDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  onEditCustomer?: (customer: Customer) => void;
}

export const CustomerDetailsModal: React.FC<CustomerDetailsModalProps> = ({
  isOpen,
  onClose,
  customer,
  onEditCustomer,
}) => {
  const [activeTab, setActiveTab] = useState<'invoices' | 'items'>('invoices');
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [saleForPrint, setSaleForPrint] = useState<Sale | null>(null);

  useEffect(() => {
    if (isOpen && customer) {
      setLoading(true);
      dataService.getSales()
        .then(allSales => {
          // Filter sales belonging to this customer
          const filtered = allSales.filter(s => 
            (s.customerId && s.customerId === customer.id) ||
            (customer.phone && s.customerPhone && s.customerPhone.trim() === customer.phone.trim()) ||
            (s.customerName && s.customerName.trim().toLowerCase() === customer.name.trim().toLowerCase())
          );
          setSales(filtered);
        })
        .catch(err => {
          console.error('Failed to load customer sales:', err);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isOpen, customer]);

  // Aggregate purchased items breakdown
  const purchasedItemsSummary = useMemo(() => {
    const map = new Map<string, {
      productId: string;
      productName: string;
      sku: string;
      unit: string;
      totalQuantity: number;
      totalSpent: number;
      lastPurchasedDate: string;
      invoiceCount: number;
    }>();

    sales.forEach(sale => {
      sale.items.forEach(item => {
        const key = item.productId || item.sku || item.productName;
        const existing = map.get(key);
        if (existing) {
          existing.totalQuantity += item.quantity;
          existing.totalSpent += item.total;
          existing.invoiceCount += 1;
          if (new Date(sale.createdAt) > new Date(existing.lastPurchasedDate)) {
            existing.lastPurchasedDate = sale.createdAt;
          }
        } else {
          map.set(key, {
            productId: item.productId,
            productName: item.productName,
            sku: item.sku,
            unit: item.unit,
            totalQuantity: item.quantity,
            totalSpent: item.total,
            lastPurchasedDate: sale.createdAt,
            invoiceCount: 1,
          });
        }
      });
    });

    return Array.from(map.values()).sort((a, b) => b.totalSpent - a.totalSpent);
  }, [sales]);

  if (!customer) return null;

  const totalUnitsBought = purchasedItemsSummary.reduce((sum, i) => sum + i.totalQuantity, 0);

  const filteredInvoices = sales.filter(s => 
    s.invoiceNumber.toLowerCase().includes(searchFilter.toLowerCase()) ||
    s.items.some(i => i.productName.toLowerCase().includes(searchFilter.toLowerCase()))
  );

  const filteredItems = purchasedItemsSummary.filter(i => 
    i.productName.toLowerCase().includes(searchFilter.toLowerCase()) ||
    i.sku.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Customer Profile & Purchase History"
        subtitle={`Viewing full records, past invoices, and orders for ${customer.name}`}
        maxWidth="820px"
        footer={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <div style={{ fontSize: '12px', color: 'var(--color-neutral-500)' }}>
              Customer ID: <code style={{ color: 'var(--color-neutral-700)' }}>{customer.id}</code>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              {onEditCustomer && (
                <Button
                  variant="outlined"
                  size="md"
                  icon={<Edit2 size={14} />}
                  onClick={() => {
                    onClose();
                    onEditCustomer(customer);
                  }}
                  type="button"
                >
                  Edit Customer Profile
                </Button>
              )}
              <Button variant="primary" size="md" onClick={onClose} type="button">
                Done
              </Button>
            </div>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Customer Overview Card */}
          <div style={{
            padding: '18px 22px',
            backgroundColor: '#FFFFFF',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--color-neutral-300)',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            boxShadow: 'var(--shadow-sm)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(6, 77, 61, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--color-primary-800)',
                  }}>
                    <User size={22} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-neutral-900)', margin: 0 }}>
                      {customer.name}
                    </h3>
                    <div style={{ fontSize: '12px', color: 'var(--color-neutral-500)', marginTop: '2px' }}>
                      Registered Customer • Added on {new Date(customer.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Outstanding Alert Badge */}
              <div>
                {customer.outstandingBalance > 0 ? (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: '#FEF2F2',
                    border: '1px solid #FCA5A5',
                    color: '#DC2626',
                    fontSize: '12px',
                    fontWeight: 700,
                  }}>
                    <AlertCircle size={15} />
                    <span>Balance Due: ₹{customer.outstandingBalance.toLocaleString('en-IN')}</span>
                  </div>
                ) : (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: '#F0FDF4',
                    border: '1px solid #86EFAC',
                    color: '#16A34A',
                    fontSize: '12px',
                    fontWeight: 700,
                  }}>
                    <CheckCircle2 size={15} />
                    <span>All Accounts Clear</span>
                  </div>
                )}
              </div>
            </div>

            {/* Contact & GST Details Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '12px',
              paddingTop: '12px',
              borderTop: '1px solid var(--color-neutral-200)',
              fontSize: '12px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-neutral-700)' }}>
                <Phone size={14} color="var(--color-neutral-500)" />
                <span>Mobile: <strong style={{ color: 'var(--color-neutral-900)' }}>{customer.phone || 'None'}</strong></span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-neutral-700)' }}>
                <Mail size={14} color="var(--color-neutral-500)" />
                <span>Email: <strong style={{ color: 'var(--color-neutral-900)' }}>{customer.email || 'None'}</strong></span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-neutral-700)' }}>
                <FileText size={14} color="var(--color-neutral-500)" />
                <span>GSTIN: <strong style={{ color: customer.gstin ? 'var(--color-primary-800)' : 'var(--color-neutral-500)' }}>{customer.gstin || 'Unregistered'}</strong></span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-neutral-700)', gridColumn: 'span 2' }}>
                <MapPin size={14} color="var(--color-neutral-500)" style={{ flexShrink: 0 }} />
                <span>Address: <strong style={{ color: 'var(--color-neutral-900)' }}>{customer.address || 'Local Showroom Walk-in'}</strong></span>
              </div>
            </div>
          </div>

          {/* Quick Metrics Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '12px',
          }}>
            <div style={{
              padding: '12px 16px',
              backgroundColor: 'var(--color-neutral-100)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--color-neutral-300)',
            }}>
              <span style={{ fontSize: '11px', color: 'var(--color-neutral-500)', fontWeight: 700, textTransform: 'uppercase' }}>
                Total Purchases
              </span>
              <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-primary-800)', marginTop: '2px' }}>
                ₹{customer.totalPurchases.toLocaleString('en-IN')}
              </div>
            </div>

            <div style={{
              padding: '12px 16px',
              backgroundColor: 'var(--color-neutral-100)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--color-neutral-300)',
            }}>
              <span style={{ fontSize: '11px', color: 'var(--color-neutral-500)', fontWeight: 700, textTransform: 'uppercase' }}>
                Total Invoices
              </span>
              <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-neutral-900)', marginTop: '2px' }}>
                {sales.length}
              </div>
            </div>

            <div style={{
              padding: '12px 16px',
              backgroundColor: 'var(--color-neutral-100)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--color-neutral-300)',
            }}>
              <span style={{ fontSize: '11px', color: 'var(--color-neutral-500)', fontWeight: 700, textTransform: 'uppercase' }}>
                Units Purchased
              </span>
              <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-neutral-900)', marginTop: '2px' }}>
                {totalUnitsBought}
              </div>
            </div>

            <div style={{
              padding: '12px 16px',
              backgroundColor: customer.outstandingBalance > 0 ? '#FEF2F2' : 'var(--color-neutral-100)',
              borderRadius: 'var(--radius-lg)',
              border: customer.outstandingBalance > 0 ? '1px solid #FCA5A5' : '1px solid var(--color-neutral-300)',
            }}>
              <span style={{ fontSize: '11px', color: customer.outstandingBalance > 0 ? '#DC2626' : 'var(--color-neutral-500)', fontWeight: 700, textTransform: 'uppercase' }}>
                Outstanding Due
              </span>
              <div style={{ fontSize: '18px', fontWeight: 800, color: customer.outstandingBalance > 0 ? '#DC2626' : 'var(--color-success)', marginTop: '2px' }}>
                ₹{customer.outstandingBalance.toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          {/* Tabs & Search Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid var(--color-neutral-300)', paddingBottom: '12px' }}>
            <div style={{ display: 'inline-flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setActiveTab('invoices')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 16px',
                  borderRadius: 'var(--radius-full)',
                  border: 'none',
                  backgroundColor: activeTab === 'invoices' ? 'var(--color-primary-800)' : 'var(--color-neutral-200)',
                  color: activeTab === 'invoices' ? '#FFFFFF' : 'var(--color-neutral-700)',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <Receipt size={14} />
                All Invoices List ({sales.length})
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('items')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 16px',
                  borderRadius: 'var(--radius-full)',
                  border: 'none',
                  backgroundColor: activeTab === 'items' ? 'var(--color-primary-800)' : 'var(--color-neutral-200)',
                  color: activeTab === 'items' ? '#FFFFFF' : 'var(--color-neutral-700)',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <Package size={14} />
                Previous Purchases Breakdown ({purchasedItemsSummary.length})
              </button>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#FFFFFF',
              border: '1px solid var(--color-neutral-300)',
              borderRadius: 'var(--radius-md)',
              padding: '5px 10px',
              width: '220px',
            }}>
              <Search size={14} color="var(--color-neutral-400)" />
              <input
                type="text"
                placeholder={activeTab === 'invoices' ? 'Search invoice # or item...' : 'Search product name/SKU...'}
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                style={{
                  border: 'none',
                  outline: 'none',
                  fontSize: '12px',
                  width: '100%',
                  color: 'var(--color-neutral-900)',
                }}
              />
            </div>
          </div>

          {/* Tab 1: All Invoices List */}
          {activeTab === 'invoices' && (
            <div>
              {loading ? (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-neutral-500)', fontSize: '13px' }}>
                  Loading customer invoices...
                </div>
              ) : filteredInvoices.length === 0 ? (
                <div style={{
                  padding: '40px',
                  textAlign: 'center',
                  color: 'var(--color-neutral-500)',
                  backgroundColor: 'var(--color-neutral-100)',
                  borderRadius: 'var(--radius-lg)',
                }}>
                  <Receipt size={32} color="var(--color-neutral-400)" style={{ margin: '0 auto 8px auto' }} />
                  <p style={{ margin: 0, fontWeight: 700 }}>No invoices found</p>
                  <p style={{ margin: '2px 0 0 0', fontSize: '12px' }}>This customer has no billed transactions yet.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '340px', overflowY: 'auto' }}>
                  {filteredInvoices.map((sale) => {
                    const paid = sale.paidAmount !== undefined ? sale.paidAmount : (sale.paymentStatus === 'Pending' ? 0 : sale.grandTotal);
                    const pending = sale.pendingAmount !== undefined ? sale.pendingAmount : Math.max(0, sale.grandTotal - paid);

                    return (
                      <div
                        key={sale.id}
                        style={{
                          padding: '12px 16px',
                          borderRadius: 'var(--radius-lg)',
                          backgroundColor: '#FFFFFF',
                          border: '1px solid var(--color-neutral-300)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '12px',
                          transition: 'background-color 0.15s ease',
                        }}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontWeight: 800, fontSize: '13px', color: 'var(--color-primary-800)' }}>
                              {sale.invoiceNumber}
                            </span>
                            <Badge variant={sale.paymentStatus === 'Paid' ? 'success' : sale.paymentStatus === 'Partial' ? 'warning' : 'danger'}>
                              {sale.paymentStatus}
                            </Badge>
                            <span style={{ fontSize: '11px', color: 'var(--color-neutral-500)' }}>
                              via {sale.paymentMethod}
                            </span>
                          </div>

                          <div style={{ fontSize: '11px', color: 'var(--color-neutral-500)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Calendar size={11} />
                            <span>
                              {new Date(sale.createdAt).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            <span>•</span>
                            <span>{sale.items.length} items ({sale.items.reduce((s, i) => s + i.quantity, 0)} units)</span>
                          </div>

                          {/* Quick Items Preview */}
                          <div style={{ fontSize: '11px', color: 'var(--color-neutral-600)', marginTop: '2px' }}>
                            {sale.items.map(i => `${i.productName} (x${i.quantity})`).join(', ')}
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--color-neutral-900)' }}>
                              ₹{sale.grandTotal.toLocaleString('en-IN')}
                            </div>
                            {pending > 0 ? (
                              <div style={{ fontSize: '11px', color: 'var(--color-danger)', fontWeight: 700 }}>
                                Due: ₹{pending.toLocaleString('en-IN')}
                              </div>
                            ) : (
                              <div style={{ fontSize: '11px', color: 'var(--color-success)', fontWeight: 600 }}>
                                Paid: ₹{paid.toLocaleString('en-IN')}
                              </div>
                            )}
                          </div>

                          <Button
                            variant="outlined"
                            size="sm"
                            icon={<Printer size={13} />}
                            onClick={() => setSaleForPrint(sale)}
                            type="button"
                          >
                            Invoice
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Previous Purchases (Items Bought Breakdown) */}
          {activeTab === 'items' && (
            <div>
              {purchasedItemsSummary.length === 0 ? (
                <div style={{
                  padding: '40px',
                  textAlign: 'center',
                  color: 'var(--color-neutral-500)',
                  backgroundColor: 'var(--color-neutral-100)',
                  borderRadius: 'var(--radius-lg)',
                }}>
                  <Package size={32} color="var(--color-neutral-400)" style={{ margin: '0 auto 8px auto' }} />
                  <p style={{ margin: 0, fontWeight: 700 }}>No purchased products found</p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto', maxHeight: '340px', overflowY: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
                    <thead>
                      <tr style={{ backgroundColor: 'var(--color-neutral-200)', borderBottom: '1.5px solid var(--color-neutral-300)' }}>
                        <th style={{ padding: '8px 10px', fontWeight: 700 }}>Product / Fixture Name</th>
                        <th style={{ padding: '8px 10px', fontWeight: 700 }}>SKU</th>
                        <th style={{ padding: '8px 10px', fontWeight: 700, textAlign: 'center' }}>Total Qty</th>
                        <th style={{ padding: '8px 10px', fontWeight: 700, textAlign: 'right' }}>Total Spent</th>
                        <th style={{ padding: '8px 10px', fontWeight: 700 }}>Last Purchased</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredItems.map((item, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid var(--color-neutral-200)' }}>
                          <td style={{ padding: '10px', fontWeight: 700, color: 'var(--color-neutral-900)' }}>
                            {item.productName}
                          </td>
                          <td style={{ padding: '10px', color: 'var(--color-neutral-500)', fontSize: '11px' }}>
                            {item.sku}
                          </td>
                          <td style={{ padding: '10px', textAlign: 'center', fontWeight: 700, color: 'var(--color-primary-800)' }}>
                            {item.totalQuantity} {item.unit}
                          </td>
                          <td style={{ padding: '10px', textAlign: 'right', fontWeight: 700, color: 'var(--color-neutral-900)' }}>
                            ₹{item.totalSpent.toLocaleString('en-IN')}
                          </td>
                          <td style={{ padding: '10px', color: 'var(--color-neutral-600)', fontSize: '11px' }}>
                            {new Date(item.lastPurchasedDate).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>

      {/* Embedded Invoice Print Modal so user can directly inspect & print any invoice */}
      <InvoicePrintModal
        isOpen={!!saleForPrint}
        onClose={() => setSaleForPrint(null)}
        sale={saleForPrint}
        customer={customer}
      />
    </>
  );
};
