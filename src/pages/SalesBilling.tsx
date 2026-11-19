import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  Receipt, 
  Printer, 
  ShoppingCart, 
  Barcode, 
  History,
  Edit3,
  IndianRupee,
  AlertCircle,
  Clock,
  User
} from 'lucide-react';
import { Header } from '../components/layout/Header';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Table, type TableColumn } from '../components/ui/Table';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { dataService } from '../services/dataService';
import type { Product, Customer, Sale, SaleItem } from '../types';
import { SaleCheckoutModal } from '../crud/SaleCheckoutModal';
import { InvoicePrintModal } from '../crud/InvoicePrintModal';
import { DeleteRecordModal } from '../crud/DeleteRecordModal';
import { InvoiceEditModal } from '../crud/InvoiceEditModal';
import { ReceivePaymentModal } from '../crud/ReceivePaymentModal';
import { CustomerDetailsModal } from '../crud/CustomerDetailsModal';
import { useAuth } from '../context/AuthContext';

export const SalesBilling: React.FC = () => {
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'pos' | 'history' | 'pending'>('pos');
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [salesHistory, setSalesHistory] = useState<Sale[]>([]);
  
  // POS Cart State
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [barcodeScanInput, setBarcodeScanInput] = useState('');

  // Modals
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [saleForPrint, setSaleForPrint] = useState<Sale | null>(null);

  // Invoice Edit & Payment Collection State
  const [saleForEdit, setSaleForEdit] = useState<Sale | null>(null);
  const [saleForReceivePayment, setSaleForReceivePayment] = useState<Sale | null>(null);
  const [customerForDetails, setCustomerForDetails] = useState<Customer | null>(null);

  // Pending Tab Filters
  const [pendingFilter, setPendingFilter] = useState<'ALL' | 'PARTIAL' | 'PENDING'>('ALL');
  const [pendingSearch, setPendingSearch] = useState<string>('');

  // Invoice Deletion & History Clear State
  const [saleToDelete, setSaleToDelete] = useState<Sale | null>(null);
  const [batchClearSalesOpen, setBatchClearSalesOpen] = useState<boolean>(false);

  // Custom Confirmation / Alert Popup Dialog State
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: React.ReactNode;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'primary' | 'info';
    isAlertOnly?: boolean;
    onConfirm?: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
  });

  const showNotice = (title: string, message: string, variant: 'warning' | 'danger' | 'info' = 'warning') => {
    setConfirmDialog({
      isOpen: true,
      title,
      message,
      confirmText: 'OK',
      variant,
      isAlertOnly: true,
      onConfirm: () => setConfirmDialog(prev => ({ ...prev, isOpen: false })),
    });
  };

  const loadData = async () => {
    const [pList, cList, sList] = await Promise.all([
      dataService.getProducts(),
      dataService.getCustomers(),
      dataService.getSales(),
    ]);
    setProducts(pList);
    setCustomers(cList);
    setSalesHistory(sList);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddToCart = (product: Product) => {
    if (product.stockQuantity <= 0) {
      showNotice('Item Out of Stock', `Cannot add "${product.name}" - Item is currently out of stock!`, 'warning');
      return;
    }

    const existingIndex = cart.findIndex(item => item.productId === product.id);
    if (existingIndex > -1) {
      const existing = cart[existingIndex];
      if (existing.quantity >= product.stockQuantity) {
        showNotice('Stock Limit Reached', `Cannot add more than available stock (${product.stockQuantity} ${product.unit})!`, 'warning');
        return;
      }
      const updated = [...cart];
      updated[existingIndex].quantity += 1;
      updated[existingIndex].total = updated[existingIndex].quantity * updated[existingIndex].unitPrice;
      setCart(updated);
    } else {
      setCart([
        ...cart,
        {
          productId: product.id,
          productName: product.name,
          sku: product.sku,
          unitPrice: product.sellingPrice,
          costPrice: product.costPrice,
          quantity: 1,
          unit: product.unit,
          total: product.sellingPrice,
        }
      ]);
    }
  };

  const handleUpdateQuantity = (productId: string, delta: number) => {
    const product = products.find(p => p.id === productId);
    const existingIndex = cart.findIndex(item => item.productId === productId);
    if (existingIndex === -1) return;

    const currentQty = cart[existingIndex].quantity;
    const newQty = currentQty + delta;

    if (newQty <= 0) {
      setCart(cart.filter(item => item.productId !== productId));
      return;
    }

    if (product && newQty > product.stockQuantity) {
      showNotice('Stock Limit Reached', `Cannot exceed available stock of ${product.stockQuantity} ${product.unit}!`, 'warning');
      return;
    }

    const updated = [...cart];
    updated[existingIndex].quantity = newQty;
    updated[existingIndex].total = newQty * updated[existingIndex].unitPrice;
    setCart(updated);
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart(cart.filter(item => item.productId !== productId));
  };

  const handleBarcodeScan = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && barcodeScanInput.trim()) {
      const match = products.find(p => p.barcode === barcodeScanInput.trim() || p.sku.toLowerCase() === barcodeScanInput.trim().toLowerCase());
      if (match) {
        handleAddToCart(match);
        setBarcodeScanInput('');
      } else {
        showNotice('Barcode Not Found', `No product found with barcode/SKU: ${barcodeScanInput}`, 'info');
      }
    }
  };

  const cartSubtotal = cart.reduce((sum, item) => sum + item.total, 0);

  const categories = ['ALL', ...Array.from(new Set(products.map(p => p.category)))];

  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'ALL' || p.category === selectedCategory;
    const matchesSearch = 
      p.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchFilter.toLowerCase()) ||
      (p.barcode && p.barcode.includes(searchFilter));
    return matchesCategory && matchesSearch;
  });

  const historyColumns: TableColumn<Sale>[] = [
    {
      header: 'Invoice #',
      accessor: (s) => (
        <div>
          <span style={{ fontWeight: 800, color: 'var(--color-primary-800)' }}>{s.invoiceNumber}</span>
          <span style={{ fontSize: '11px', color: 'var(--color-neutral-500)', display: 'block' }}>
            {new Date(s.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
          </span>
        </div>
      ),
    },
    {
      header: 'Customer',
      accessor: (s) => (
        <div>
          <div style={{ fontWeight: 700 }}>{s.customerName}</div>
          {s.customerPhone && <div style={{ fontSize: '11px', color: 'var(--color-neutral-500)' }}>{s.customerPhone}</div>}
        </div>
      ),
    },
    {
      header: 'Items Billed',
      accessor: (s) => (
        <span style={{ fontSize: '12px', color: 'var(--color-neutral-700)' }}>
          {s.items.length} items ({s.items.reduce((sum, i) => sum + i.quantity, 0)} units)
        </span>
      ),
    },
    {
      header: 'Payment Mode',
      accessor: (s) => (
        <div>
          <Badge variant="secondary">{s.paymentMethod}</Badge>
          {s.paymentMethod === 'Split (Cash + UPI)' && (
            <div style={{ fontSize: '10px', color: 'var(--color-neutral-600)', marginTop: '2px' }}>
              Cash: ₹{(s.cashAmount || 0).toLocaleString('en-IN')} | UPI: ₹{(s.upiAmount || 0).toLocaleString('en-IN')}
            </div>
          )}
        </div>
      ),
      align: 'center',
    },
    {
      header: 'Amount / Balance',
      accessor: (s) => {
        const paid = s.paidAmount !== undefined ? s.paidAmount : (s.paymentStatus === 'Pending' ? 0 : s.grandTotal);
        const pending = s.pendingAmount !== undefined ? s.pendingAmount : Math.max(0, s.grandTotal - paid);
        return (
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontWeight: 800, fontSize: '14px', color: 'var(--color-neutral-900)' }}>
              ₹{s.grandTotal.toLocaleString('en-IN')}
            </span>
            {pending > 0 ? (
              <div style={{ fontSize: '11px', color: 'var(--color-danger)', fontWeight: 700 }}>
                Pending: ₹{pending.toLocaleString('en-IN')}
              </div>
            ) : (
              <div style={{ fontSize: '11px', color: 'var(--color-success)', fontWeight: 600 }}>
                Paid: ₹{paid.toLocaleString('en-IN')}
              </div>
            )}
          </div>
        );
      },
      align: 'right',
    },
    {
      header: 'Status',
      accessor: (s) => {
        const st = s.paymentStatus || 'Paid';
        return (
          <Badge variant={st === 'Paid' ? 'success' : st === 'Partial' ? 'warning' : 'danger'}>
            {st === 'Paid' ? 'Paid' : st === 'Partial' ? 'Partial' : 'Pending'}
          </Badge>
        );
      },
      align: 'center',
    },
    {
      header: 'Actions',
      accessor: (s) => (
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '8px' }}>
          <Button
            variant="outlined"
            size="sm"
            icon={<Printer size={13} />}
            onClick={() => setSaleForPrint(s)}
          >
            Invoice
          </Button>
          {isAdmin && (
            <Button
              variant="secondary"
              size="sm"
              icon={<Edit3 size={13} />}
              onClick={() => setSaleForEdit(s)}
              title="Edit Invoice Details"
            >
              Edit
            </Button>
          )}
          {isAdmin && (
            <Button
              variant="danger"
              size="sm"
              icon={<Trash2 size={13} />}
              onClick={() => handleDeleteSale(s)}
              title="Delete Invoice & Restore Inventory"
            >
              Delete
            </Button>
          )}
        </div>
      ),
      align: 'right',
    },
  ];

  // Pending & Partial Payments Calculations
  const pendingInvoices = salesHistory.filter(s => {
    const paid = s.paidAmount !== undefined ? s.paidAmount : (s.paymentStatus === 'Pending' ? 0 : s.grandTotal);
    const pending = s.pendingAmount !== undefined ? s.pendingAmount : Math.max(0, s.grandTotal - paid);
    return s.paymentStatus === 'Pending' || s.paymentStatus === 'Partial' || pending > 0;
  });

  const partialInvoicesCount = pendingInvoices.filter(s => {
    const paid = s.paidAmount !== undefined ? s.paidAmount : (s.paymentStatus === 'Pending' ? 0 : s.grandTotal);
    const pending = s.pendingAmount !== undefined ? s.pendingAmount : Math.max(0, s.grandTotal - paid);
    return s.paymentStatus === 'Partial' || (paid > 0 && pending > 0);
  }).length;

  const fullyPendingCount = pendingInvoices.length - partialInvoicesCount;

  const totalPendingDueAmount = pendingInvoices.reduce((sum, s) => {
    const paid = s.paidAmount !== undefined ? s.paidAmount : (s.paymentStatus === 'Pending' ? 0 : s.grandTotal);
    const pending = s.pendingAmount !== undefined ? s.pendingAmount : Math.max(0, s.grandTotal - paid);
    return sum + pending;
  }, 0);

  const uniqueCustomersCount = new Set(
    pendingInvoices.map(s => s.customerId || s.customerPhone || s.customerName)
  ).size;

  const filteredPendingInvoices = pendingInvoices.filter(s => {
    const paid = s.paidAmount !== undefined ? s.paidAmount : (s.paymentStatus === 'Pending' ? 0 : s.grandTotal);
    const pending = s.pendingAmount !== undefined ? s.pendingAmount : Math.max(0, s.grandTotal - paid);
    const isPartial = s.paymentStatus === 'Partial' || (paid > 0 && pending > 0);

    if (pendingFilter === 'PARTIAL' && !isPartial) return false;
    if (pendingFilter === 'PENDING' && isPartial) return false;

    if (pendingSearch.trim()) {
      const q = pendingSearch.toLowerCase();
      const matchInv = s.invoiceNumber.toLowerCase().includes(q);
      const matchName = s.customerName.toLowerCase().includes(q);
      const matchPhone = s.customerPhone ? s.customerPhone.toLowerCase().includes(q) : false;
      return matchInv || matchName || matchPhone;
    }
    return true;
  });

  const pendingColumns: TableColumn<Sale>[] = [
    {
      header: 'Invoice # & Date',
      accessor: (s) => (
        <div>
          <div style={{ fontWeight: 800, fontSize: '13px', color: 'var(--color-primary-800)' }}>
            {s.invoiceNumber}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--color-neutral-500)', marginTop: '2px' }}>
            {new Date(s.createdAt).toLocaleDateString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
        </div>
      ),
    },
    {
      header: 'Customer Details',
      accessor: (s) => {
        const cust = customers.find(c => c.id === s.customerId || (s.customerPhone && c.phone === s.customerPhone));
        return (
          <div>
            <div
              style={{
                fontWeight: 700,
                fontSize: '13px',
                color: cust ? 'var(--color-primary-800)' : 'var(--color-neutral-900)',
                cursor: cust ? 'pointer' : 'default',
                textDecoration: cust ? 'underline' : 'none',
              }}
              onClick={() => {
                if (cust) setCustomerForDetails(cust);
              }}
              title={cust ? "Click to view full customer history" : undefined}
            >
              {s.customerName}
            </div>
            {s.customerPhone && (
              <div style={{ fontSize: '11px', color: 'var(--color-neutral-600)', marginTop: '1px' }}>
                📞 {s.customerPhone}
              </div>
            )}
            {s.customerGstin && (
              <div style={{ fontSize: '10px', color: 'var(--color-neutral-500)', marginTop: '1px' }}>
                GSTIN: {s.customerGstin}
              </div>
            )}
            {s.customerAddress && (
              <div style={{ fontSize: '10px', color: 'var(--color-neutral-400)', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                📍 {s.customerAddress}
              </div>
            )}
          </div>
        );
      },
    },
    {
      header: 'Billed Items',
      accessor: (s) => (
        <div>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-neutral-800)' }}>
            {s.items.length} items ({s.items.reduce((sum, i) => sum + i.quantity, 0)} units)
          </div>
          <div 
            style={{ fontSize: '11px', color: 'var(--color-neutral-500)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '2px' }} 
            title={s.items.map(i => `${i.productName} (x${i.quantity})`).join(', ')}
          >
            {s.items.map(i => i.productName).join(', ')}
          </div>
        </div>
      ),
    },
    {
      header: 'Total & Paid',
      accessor: (s) => {
        const paid = s.paidAmount !== undefined ? s.paidAmount : (s.paymentStatus === 'Pending' ? 0 : s.grandTotal);
        return (
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-neutral-900)' }}>
              ₹{s.grandTotal.toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-neutral-600)' }}>
              Paid: ₹{paid.toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: '10px', color: 'var(--color-neutral-500)' }}>
              via {s.paymentMethod}
            </div>
          </div>
        );
      },
      align: 'right',
    },
    {
      header: 'Pending Due Balance',
      accessor: (s) => {
        const paid = s.paidAmount !== undefined ? s.paidAmount : (s.paymentStatus === 'Pending' ? 0 : s.grandTotal);
        const pending = s.pendingAmount !== undefined ? s.pendingAmount : Math.max(0, s.grandTotal - paid);
        return (
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '15px', fontWeight: 900, color: '#DC2626' }}>
              ₹{pending.toLocaleString('en-IN')}
            </div>
          </div>
        );
      },
      align: 'right',
    },
    {
      header: 'Payment Status',
      accessor: (s) => {
        const paid = s.paidAmount !== undefined ? s.paidAmount : (s.paymentStatus === 'Pending' ? 0 : s.grandTotal);
        const pending = s.pendingAmount !== undefined ? s.pendingAmount : Math.max(0, s.grandTotal - paid);
        const isPartial = s.paymentStatus === 'Partial' || (paid > 0 && pending > 0);
        return (
          <Badge variant={isPartial ? 'warning' : 'danger'}>
            {isPartial ? 'Partial (Half Paid)' : 'Fully Pending'}
          </Badge>
        );
      },
      align: 'center',
    },
    {
      header: 'Actions',
      accessor: (s) => (
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '8px' }}>
          <Button
            variant="primary"
            size="sm"
            icon={<IndianRupee size={13} />}
            onClick={() => setSaleForReceivePayment(s)}
            title="Receive Payment against this bill"
          >
            Collect
          </Button>
          <Button
            variant="outlined"
            size="sm"
            icon={<Printer size={13} />}
            onClick={() => setSaleForPrint(s)}
            title="Print Invoice"
          >
            Invoice
          </Button>
          {isAdmin && (
            <Button
              variant="secondary"
              size="sm"
              icon={<Edit3 size={13} />}
              onClick={() => setSaleForEdit(s)}
              title="Edit Invoice Details"
            >
              Edit
            </Button>
          )}
        </div>
      ),
      align: 'right',
    },
  ];

  const handleDeleteSale = (sale: Sale) => {
    setSaleToDelete(sale);
  };

  return (
    <>
      <Header
        title="Billing & Sales (POS)"
        subtitle="Fast showroom billing, barcode checkout, and instant GST invoice printing"
        quickActionLabel={activeTab === 'pos' ? 'Pending Dues & Khata' : 'Back to POS'}
        onQuickAction={() => setActiveTab(activeTab === 'pos' ? 'pending' : 'pos')}
      />

      {/* Mode Switcher Tabs */}
      <div style={{
        padding: '16px 28px 0 28px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}>
        <button
          onClick={() => setActiveTab('pos')}
          style={{
            padding: '8px 20px',
            borderRadius: '9999px',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: '13px',
            backgroundColor: activeTab === 'pos' ? 'var(--color-primary-800)' : '#FFFFFF',
            color: activeTab === 'pos' ? '#FFFFFF' : 'var(--color-neutral-700)',
            boxShadow: activeTab === 'pos' ? '0 2px 8px rgba(6, 77, 61, 0.25)' : 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all var(--transition-fast)',
          }}
        >
          <ShoppingCart size={15} color={activeTab === 'pos' ? '#FFFFFF' : 'var(--color-neutral-600)'} />
          <span>Point of Sale (Active Cart: {cart.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          style={{
            padding: '8px 20px',
            borderRadius: '9999px',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: '13px',
            backgroundColor: activeTab === 'history' ? 'var(--color-primary-800)' : '#FFFFFF',
            color: activeTab === 'history' ? '#FFFFFF' : 'var(--color-neutral-700)',
            boxShadow: activeTab === 'history' ? '0 2px 8px rgba(6, 77, 61, 0.25)' : 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all var(--transition-fast)',
          }}
        >
          <History size={15} color={activeTab === 'history' ? '#FFFFFF' : 'var(--color-neutral-600)'} />
          <span>Sales Invoices History ({salesHistory.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('pending')}
          style={{
            padding: '8px 20px',
            borderRadius: '9999px',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: '13px',
            backgroundColor: activeTab === 'pending' ? '#DC2626' : '#FFFFFF',
            color: activeTab === 'pending' ? '#FFFFFF' : 'var(--color-neutral-700)',
            boxShadow: activeTab === 'pending' ? '0 2px 8px rgba(220, 38, 38, 0.25)' : 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all var(--transition-fast)',
          }}
        >
          <AlertCircle size={15} color={activeTab === 'pending' ? '#FFFFFF' : '#DC2626'} />
          <span>Pending & Partial Dues ({pendingInvoices.length})</span>
          {pendingInvoices.length > 0 && (
            <span style={{
              backgroundColor: activeTab === 'pending' ? 'rgba(255,255,255,0.25)' : '#FEE2E2',
              color: activeTab === 'pending' ? '#FFFFFF' : '#DC2626',
              padding: '2px 8px',
              borderRadius: '9999px',
              fontSize: '11px',
              fontWeight: 800,
            }}>
              ₹{totalPendingDueAmount.toLocaleString('en-IN')}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'pos' ? (
        /* POS 2-Column Layout */
        <div style={{
          padding: '20px 28px',
          display: 'grid',
          gridTemplateColumns: '1fr 400px',
          gap: '24px',
          flex: 1,
          overflow: 'hidden',
          height: 'calc(100vh - 160px)',
        }}>
          {/* Left Column: Product Selection Grid */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', overflow: 'hidden' }}>
            {/* Top Bar: Barcode scan + Search */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ flex: 1 }}>
                <Input
                  placeholder="Search item name or SKU..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  icon={<Search size={16} />}
                />
              </div>
              <div style={{ width: '240px' }}>
                <Input
                  placeholder="Scan Barcode (Enter)"
                  value={barcodeScanInput}
                  onChange={(e) => setBarcodeScanInput(e.target.value)}
                  onKeyDown={handleBarcodeScan}
                  icon={<Barcode size={16} />}
                />
              </div>
            </div>

            {/* Category Chips */}
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '9999px',
                    border: '1px solid var(--color-neutral-300)',
                    backgroundColor: selectedCategory === cat ? 'var(--color-primary-800)' : '#FFFFFF',
                    color: selectedCategory === cat ? '#FFFFFF' : 'var(--color-neutral-700)',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {cat === 'ALL' ? 'All Fixtures' : cat}
                </button>
              ))}
            </div>

            {/* Products Card Grid */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))',
              alignContent: 'start',
              gap: '14px',
              paddingRight: '6px',
            }}>
              {filteredProducts.map((p) => {
                const isOutOfStock = p.stockQuantity <= 0;
                return (
                  <div
                    key={p.id}
                    onClick={() => !isOutOfStock && handleAddToCart(p)}
                    style={{
                      padding: '14px',
                      backgroundColor: '#FFFFFF',
                      borderRadius: 'var(--radius-lg)',
                      border: '1px solid var(--color-neutral-300)',
                      cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                      opacity: isOutOfStock ? 0.6 : 1,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      height: '240px',
                      boxSizing: 'border-box',
                      transition: 'transform 0.12s ease, box-shadow 0.12s ease, border-color 0.12s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (!isOutOfStock) {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                        e.currentTarget.style.borderColor = 'var(--color-primary-300)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isOutOfStock) {
                        e.currentTarget.style.transform = 'none';
                        e.currentTarget.style.boxShadow = 'none';
                        e.currentTarget.style.borderColor = 'var(--color-neutral-300)';
                      }
                    }}
                  >
                    <div>
                      <div style={{
                        position: 'relative',
                        width: '100%',
                        height: '110px',
                        borderRadius: 'var(--radius-md)',
                        overflow: 'hidden',
                        marginBottom: '10px',
                        backgroundColor: 'var(--color-neutral-200)',
                      }}>
                        {p.imageUrl ? (
                          <img
                            src={p.imageUrl}
                            alt={p.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : null}
                        <span style={{
                          position: 'absolute',
                          top: '6px',
                          left: '6px',
                          fontSize: '10px',
                          fontWeight: 700,
                          backgroundColor: 'rgba(255, 255, 255, 0.92)',
                          color: 'var(--color-neutral-800)',
                          padding: '2px 7px',
                          borderRadius: '4px',
                          backdropFilter: 'blur(4px)',
                        }}>
                          {p.category}
                        </span>
                      </div>

                      <h4 style={{
                        fontSize: '13px',
                        fontWeight: 700,
                        color: 'var(--color-neutral-900)',
                        lineHeight: '1.3',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        height: '34px',
                      }}>
                        {p.name}
                      </h4>
                      <div style={{ fontSize: '11px', color: 'var(--color-neutral-500)', marginTop: '2px' }}>
                        {p.sku}
                      </div>
                    </div>

                    <div style={{
                      marginTop: '8px',
                      paddingTop: '8px',
                      borderTop: '1px solid var(--color-neutral-200)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}>
                      <span style={{ fontSize: '15px', fontWeight: 800, color: 'var(--color-primary-800)' }}>
                        ₹{p.sellingPrice.toLocaleString('en-IN')}
                      </span>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        color: isOutOfStock ? 'var(--color-danger)' : p.stockQuantity <= p.minStockLevel ? 'var(--color-warning)' : 'var(--color-neutral-600)',
                      }}>
                        {p.stockQuantity} {p.unit}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Checkout Cart */}
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--color-neutral-300)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}>
            {/* Cart Header */}
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--color-neutral-300)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShoppingCart size={18} color="var(--color-primary-800)" />
                <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--color-neutral-900)' }}>
                  Current Bill Cart
                </h3>
              </div>
              {cart.length > 0 && (
                <button
                  onClick={() => setCart([])}
                  style={{ border: 'none', background: 'none', color: 'var(--color-danger)', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Clear All
                </button>
              )}
            </div>

            {/* Cart Items List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '14px' }}>
              {cart.length === 0 ? (
                <div style={{ padding: '60px 16px', textAlign: 'center', color: 'var(--color-neutral-500)' }}>
                  <ShoppingCart size={32} color="var(--color-neutral-400)" style={{ margin: '0 auto 8px auto' }} />
                  <p style={{ fontSize: '13px', fontWeight: 600 }}>Cart is currently empty</p>
                  <p style={{ fontSize: '11px', marginTop: '2px' }}>Click items on the left or scan barcode to add to bill</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {cart.map((item) => (
                    <div
                      key={item.productId}
                      style={{
                        padding: '10px 12px',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'var(--color-neutral-200)',
                        border: '1px solid var(--color-neutral-300)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-neutral-900)' }}>
                            {item.productName}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--color-neutral-500)' }}>
                            ₹{item.unitPrice} / {item.unit}
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveFromCart(item.productId)}
                          style={{ border: 'none', background: 'none', color: 'var(--color-danger)', cursor: 'pointer', padding: '2px' }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            onClick={() => handleUpdateQuantity(item.productId, -1)}
                            style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '50%',
                              border: '1px solid var(--color-neutral-300)',
                              backgroundColor: '#FFFFFF',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Minus size={12} />
                          </button>
                          <span style={{ fontSize: '13px', fontWeight: 700, minWidth: '24px', textAlign: 'center' }}>
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => handleUpdateQuantity(item.productId, 1)}
                            style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '50%',
                              border: '1px solid var(--color-neutral-300)',
                              backgroundColor: '#FFFFFF',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Plus size={12} />
                          </button>
                        </div>

                        <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--color-primary-800)' }}>
                          ₹{item.total.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Cart Footer */}
            <div style={{
              padding: '16px 20px',
              borderTop: '1px solid var(--color-neutral-300)',
              backgroundColor: 'var(--color-neutral-100)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--color-neutral-600)' }}>
                <span>Subtotal ({cart.length} items):</span>
                <span style={{ fontWeight: 700, color: 'var(--color-neutral-900)' }}>
                  ₹{cartSubtotal.toLocaleString('en-IN')}
                </span>
              </div>

              <Button
                variant="tertiary"
                size="lg"
                disabled={cart.length === 0}
                icon={<Receipt size={17} />}
                onClick={() => setIsCheckoutModalOpen(true)}
                style={{ width: '100%', fontWeight: 800 }}
              >
                Checkout & Print Bill
              </Button>
            </div>
          </div>
        </div>
      ) : activeTab === 'history' ? (
        /* Sales Invoices History View */
        <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {isAdmin && salesHistory.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
              <Button
                variant="outlined"
                size="sm"
                icon={<Trash2 size={13} color="#DC2626" />}
                onClick={() => setBatchClearSalesOpen(true)}
                style={{ borderColor: 'rgba(239, 68, 68, 0.4)', color: '#DC2626', fontWeight: 700 }}
              >
                Clear Complete Sales History ({salesHistory.length} Invoices)
              </Button>
            </div>
          )}

          <Table
            columns={historyColumns}
            data={salesHistory}
            keyExtractor={(s) => s.id}
            emptyMessage="No completed invoices found."
          />
        </div>
      ) : (
        /* Pending & Partial Dues (Khata Tracker) View */
        <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Top KPI Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
            gap: '16px',
          }}>
            {/* Total Balance Due Card */}
            <div style={{
              background: 'linear-gradient(135deg, #FEF2F2 0%, #FFFFFF 100%)',
              border: '1px solid #FECACA',
              borderRadius: 'var(--radius-lg)',
              padding: '18px 20px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '14px',
              boxShadow: '0 2px 4px rgba(239, 68, 68, 0.05)',
            }}>
              <div style={{
                backgroundColor: '#FEE2E2',
                color: '#DC2626',
                padding: '10px',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <IndianRupee size={22} />
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#991B1B' }}>
                  Total Dues Outstanding
                </div>
                <div style={{ fontSize: '24px', fontWeight: 900, color: '#DC2626', marginTop: '2px' }}>
                  ₹{totalPendingDueAmount.toLocaleString('en-IN')}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-neutral-600)', marginTop: '2px' }}>
                  Across {pendingInvoices.length} pending / partial bills
                </div>
              </div>
            </div>

            {/* Half / Partial Payments Card */}
            <div style={{
              background: 'linear-gradient(135deg, #FFFBEB 0%, #FFFFFF 100%)',
              border: '1px solid #FDE68A',
              borderRadius: 'var(--radius-lg)',
              padding: '18px 20px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '14px',
              boxShadow: '0 2px 4px rgba(245, 158, 11, 0.05)',
            }}>
              <div style={{
                backgroundColor: '#FEF3C7',
                color: '#D97706',
                padding: '10px',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Clock size={22} />
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#B45309' }}>
                  Half / Partial Payments
                </div>
                <div style={{ fontSize: '24px', fontWeight: 900, color: '#D97706', marginTop: '2px' }}>
                  {partialInvoicesCount} <span style={{ fontSize: '14px', fontWeight: 600 }}>Invoices</span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-neutral-600)', marginTop: '2px' }}>
                  Deposit paid, remaining due
                </div>
              </div>
            </div>

            {/* Fully Pending Card */}
            <div style={{
              background: 'linear-gradient(135deg, #FFF1F2 0%, #FFFFFF 100%)',
              border: '1px solid #FECDD3',
              borderRadius: 'var(--radius-lg)',
              padding: '18px 20px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '14px',
              boxShadow: '0 2px 4px rgba(225, 29, 72, 0.05)',
            }}>
              <div style={{
                backgroundColor: '#FFE4E6',
                color: '#E11D48',
                padding: '10px',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <AlertCircle size={22} />
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#9F1239' }}>
                  Fully Unpaid (Pending)
                </div>
                <div style={{ fontSize: '24px', fontWeight: 900, color: '#E11D48', marginTop: '2px' }}>
                  {fullyPendingCount} <span style={{ fontSize: '14px', fontWeight: 600 }}>Invoices</span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-neutral-600)', marginTop: '2px' }}>
                  Zero payment collected on billing
                </div>
              </div>
            </div>

            {/* Customers with dues */}
            <div style={{
              background: '#FFFFFF',
              border: '1px solid var(--color-neutral-200)',
              borderRadius: 'var(--radius-lg)',
              padding: '18px 20px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '14px',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.03)',
            }}>
              <div style={{
                backgroundColor: 'var(--color-primary-50)',
                color: 'var(--color-primary-800)',
                padding: '10px',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <User size={22} />
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-neutral-600)' }}>
                  Customers in Khata
                </div>
                <div style={{ fontSize: '24px', fontWeight: 900, color: 'var(--color-neutral-900)', marginTop: '2px' }}>
                  {uniqueCustomersCount} <span style={{ fontSize: '14px', fontWeight: 600 }}>People</span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-neutral-600)', marginTop: '2px' }}>
                  Click customer to view history ledger
                </div>
              </div>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '16px',
            backgroundColor: '#FFFFFF',
            padding: '14px 18px',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--color-neutral-200)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setPendingFilter('ALL')}
                style={{
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid',
                  borderColor: pendingFilter === 'ALL' ? '#DC2626' : 'var(--color-neutral-300)',
                  backgroundColor: pendingFilter === 'ALL' ? '#DC2626' : '#FFFFFF',
                  color: pendingFilter === 'ALL' ? '#FFFFFF' : 'var(--color-neutral-700)',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                All Dues ({pendingInvoices.length})
              </button>
              <button
                type="button"
                onClick={() => setPendingFilter('PARTIAL')}
                style={{
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid',
                  borderColor: pendingFilter === 'PARTIAL' ? '#D97706' : 'var(--color-neutral-300)',
                  backgroundColor: pendingFilter === 'PARTIAL' ? '#D97706' : '#FFFFFF',
                  color: pendingFilter === 'PARTIAL' ? '#FFFFFF' : 'var(--color-neutral-700)',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                Half / Partial Payments ({partialInvoicesCount})
              </button>
              <button
                type="button"
                onClick={() => setPendingFilter('PENDING')}
                style={{
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid',
                  borderColor: pendingFilter === 'PENDING' ? '#E11D48' : 'var(--color-neutral-300)',
                  backgroundColor: pendingFilter === 'PENDING' ? '#E11D48' : '#FFFFFF',
                  color: pendingFilter === 'PENDING' ? '#FFFFFF' : 'var(--color-neutral-700)',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                Fully Pending ({fullyPendingCount})
              </button>
            </div>

            <div style={{ width: '320px' }}>
              <Input
                placeholder="Search customer, phone, or bill #..."
                value={pendingSearch}
                onChange={(e) => setPendingSearch(e.target.value)}
                icon={<Search size={15} color="var(--color-neutral-400)" />}
              />
            </div>
          </div>

          {/* Pending Invoices Table */}
          <Table
            columns={pendingColumns}
            data={filteredPendingInvoices}
            keyExtractor={(s) => s.id}
            emptyMessage={pendingSearch ? "No dues matched your search." : "No pending or partial payments found! All bills are settled."}
          />
        </div>
      )}

      {/* Modals */}
      <SaleCheckoutModal
        isOpen={isCheckoutModalOpen}
        onClose={() => setIsCheckoutModalOpen(false)}
        cartItems={cart}
        customers={customers}
        onSaleCompleted={(completedSale) => {
          setCart([]);
          loadData();
          setSaleForPrint(completedSale);
        }}
      />

      <InvoicePrintModal
        isOpen={!!saleForPrint}
        onClose={() => setSaleForPrint(null)}
        sale={saleForPrint}
        customers={customers}
      />

      {/* Edit Invoice Modal */}
      {saleForEdit && (
        <InvoiceEditModal
          isOpen={!!saleForEdit}
          onClose={() => setSaleForEdit(null)}
          sale={saleForEdit}
          customers={customers}
          products={products}
          onSaleUpdated={(updatedSale) => {
            setSaleForEdit(null);
            loadData();
            showNotice('Invoice Updated', `Invoice #${updatedSale.invoiceNumber} has been updated successfully. Inventory and customer balance synced!`, 'info');
          }}
        />
      )}

      {/* Receive / Collect Payment Modal */}
      {saleForReceivePayment && (
        <ReceivePaymentModal
          isOpen={!!saleForReceivePayment}
          onClose={() => setSaleForReceivePayment(null)}
          sale={saleForReceivePayment}
          onPaymentReceived={(updatedSale) => {
            setSaleForReceivePayment(null);
            loadData();
            showNotice('Payment Recorded', `Payment recorded successfully for invoice #${updatedSale.invoiceNumber}! Remaining balance: ₹${(updatedSale.pendingAmount || 0).toLocaleString('en-IN')}`, 'info');
          }}
        />
      )}

      {/* Customer Details Modal */}
      {customerForDetails && (
        <CustomerDetailsModal
          isOpen={!!customerForDetails}
          onClose={() => setCustomerForDetails(null)}
          customer={customerForDetails}
        />
      )}

      {/* Delete Single Invoice with Stock Choice */}
      {saleToDelete && (
        <DeleteRecordModal
          isOpen={!!saleToDelete}
          onClose={() => setSaleToDelete(null)}
          title={`Delete Invoice #${saleToDelete.invoiceNumber}`}
          subtitle={`Client: ${saleToDelete.customerName} • Total: ₹${saleToDelete.grandTotal.toLocaleString('en-IN')}`}
          recordType="sale"
          onConfirm={async (adjustStock) => {
            const id = saleToDelete.id;
            setSalesHistory(prev => prev.filter(s => s.id !== id));
            await dataService.deleteSale(id, adjustStock);
            await loadData();
          }}
        />
      )}

      {/* Batch Clear All Invoices with Stock Choice */}
      {batchClearSalesOpen && (
        <DeleteRecordModal
          isOpen={batchClearSalesOpen}
          onClose={() => setBatchClearSalesOpen(false)}
          title="Clear Complete Sales History"
          subtitle={`This will delete all ${salesHistory.length} completed invoice records from cloud database`}
          recordType="sale"
          isBatch={true}
          onConfirm={async (adjustStock) => {
            setSalesHistory([]);
            await dataService.clearAllSales(adjustStock);
            await loadData();
          }}
        />
      )}

      <ConfirmModal
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        cancelText={confirmDialog.cancelText}
        variant={confirmDialog.variant}
        isAlertOnly={confirmDialog.isAlertOnly}
      />
    </>
  );
};
