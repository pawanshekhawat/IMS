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
  History 
} from 'lucide-react';
import { Header } from '../components/layout/Header';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Table, type TableColumn } from '../components/ui/Table';
import { dataService } from '../services/dataService';
import type { Product, Customer, Sale, SaleItem } from '../types';
import { SaleCheckoutModal } from '../crud/SaleCheckoutModal';
import { InvoicePrintModal } from '../crud/InvoicePrintModal';

export const SalesBilling: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'pos' | 'history'>('pos');
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
      alert(`Cannot add "${product.name}" - Item is out of stock!`);
      return;
    }

    const existingIndex = cart.findIndex(item => item.productId === product.id);
    if (existingIndex > -1) {
      const existing = cart[existingIndex];
      if (existing.quantity >= product.stockQuantity) {
        alert(`Cannot add more than available stock (${product.stockQuantity} ${product.unit})!`);
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
      alert(`Cannot exceed available stock of ${product.stockQuantity}!`);
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
        alert(`No product found with barcode/SKU: ${barcodeScanInput}`);
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
      accessor: (s) => <Badge variant="secondary">{s.paymentMethod}</Badge>,
      align: 'center',
    },
    {
      header: 'Grand Total',
      accessor: (s) => (
        <span style={{ fontWeight: 800, fontSize: '14px', color: 'var(--color-neutral-900)' }}>
          ₹{s.grandTotal.toLocaleString('en-IN')}
        </span>
      ),
      align: 'right',
    },
    {
      header: 'Status',
      accessor: () => <Badge variant="success">Paid</Badge>,
      align: 'center',
    },
    {
      header: 'Print / View',
      accessor: (s) => (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="outlined"
            size="sm"
            icon={<Printer size={13} />}
            onClick={() => setSaleForPrint(s)}
          >
            Invoice
          </Button>
        </div>
      ),
      align: 'right',
    },
  ];

  return (
    <>
      <Header
        title="Billing & Sales (POS)"
        subtitle="Fast showroom billing, barcode checkout, and instant GST invoice printing"
        quickActionLabel={activeTab === 'pos' ? 'View Sales History' : 'Back to POS'}
        onQuickAction={() => setActiveTab(activeTab === 'pos' ? 'history' : 'pos')}
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
      ) : (
        /* Sales Invoices History View */
        <div style={{ padding: '24px 28px' }}>
          <Table
            columns={historyColumns}
            data={salesHistory}
            keyExtractor={(s) => s.id}
            emptyMessage="No completed invoices found."
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
      />
    </>
  );
};
