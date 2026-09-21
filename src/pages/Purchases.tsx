import React, { useState, useEffect } from 'react';
import { CheckCircle, PackageCheck, CreditCard } from 'lucide-react';
import { Header } from '../components/layout/Header';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Table, type TableColumn } from '../components/ui/Table';
import { dataService } from '../services/dataService';
import type { Purchase, Supplier, Product } from '../types';
import { PurchaseCrudModal } from '../crud/PurchaseCrudModal';

export const Purchases: React.FC = () => {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [receivingId, setReceivingId] = useState<string | null>(null);
  const [payingId, setPayingId] = useState<string | null>(null);

  const loadData = async () => {
    const [pList, sList, prList] = await Promise.all([
      dataService.getPurchases(),
      dataService.getSuppliers(),
      dataService.getProducts(),
    ]);
    setPurchases(pList);
    setSuppliers(sList);
    setProducts(prList);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleReceiveStock = async (po: Purchase) => {
    if (window.confirm(`Receive stock for ${po.poNumber}? This will automatically add items to your live inventory.`)) {
      setReceivingId(po.id);
      try {
        await dataService.receivePurchase(po.id);
        await loadData();
      } catch (err: any) {
        alert(err.message || 'Failed to receive stock');
      } finally {
        setReceivingId(null);
      }
    }
  };

  const handleUpdatePayment = async (po: Purchase, status: 'Paid' | 'Pending') => {
    const actionLabel = status === 'Paid' ? 'mark as Paid' : 'revert to Pending';
    if (window.confirm(`Are you sure you want to ${actionLabel} payment of ₹${po.totalAmount.toLocaleString('en-IN')} for ${po.poNumber} (${po.supplierName})?`)) {
      setPayingId(po.id);
      try {
        await dataService.updatePurchasePaymentStatus(po.id, status);
        await loadData();
      } catch (err: any) {
        alert(err.message || 'Failed to update payment status');
      } finally {
        setPayingId(null);
      }
    }
  };

  const filteredPurchases = purchases.filter(p =>
    p.poNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.supplierName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const [y, m, d] = dateStr.split('-');
      if (!y || !m || !d) return dateStr;
      const date = new Date(Number(y), Number(m) - 1, Number(d));
      return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const columns: TableColumn<Purchase>[] = [
    {
      header: 'PO Number & Date',
      width: '170px',
      accessor: (p) => (
        <div style={{ whiteSpace: 'nowrap' }}>
          <span style={{ fontWeight: 800, color: 'var(--color-primary-800)', fontSize: '13px' }}>
            {p.poNumber}
          </span>
          <span style={{ fontSize: '11px', color: 'var(--color-neutral-500)', display: 'block', marginTop: '2px' }}>
            Ordered: {formatDate(p.orderDate)}
          </span>
        </div>
      ),
    },
    {
      header: 'Vendor / Supplier',
      width: '200px',
      accessor: (p) => (
        <div style={{ fontWeight: 700, color: 'var(--color-neutral-900)', fontSize: '13px', lineHeight: 1.3 }}>
          {p.supplierName}
        </div>
      ),
    },
    {
      header: 'Items Ordered',
      accessor: (p) => (
        <div>
          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-neutral-800)' }}>
            {p.items.length} {p.items.length === 1 ? 'product line' : 'product lines'}
          </span>
          <div style={{
            fontSize: '11px',
            color: 'var(--color-neutral-500)',
            marginTop: '2px',
            lineHeight: 1.3,
            maxWidth: '320px',
          }}>
            {p.items.map(i => `${i.productName} (x${i.quantity})`).join(', ')}
          </div>
        </div>
      ),
    },
    {
      header: 'Total Value',
      width: '130px',
      accessor: (p) => (
        <span style={{ fontWeight: 800, color: 'var(--color-neutral-900)', fontSize: '14px', whiteSpace: 'nowrap' }}>
          ₹{p.totalAmount.toLocaleString('en-IN')}
        </span>
      ),
      align: 'right',
    },
    {
      header: 'Order Status',
      width: '150px',
      accessor: (p) => (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', whiteSpace: 'nowrap' }}>
          {p.status === 'Received' ? (
            <>
              <Badge variant="success">Stock Received</Badge>
              {p.receivedDate && (
                <span style={{ fontSize: '11px', color: 'var(--color-neutral-500)', fontWeight: 500 }}>
                  Rcvd: {formatDate(p.receivedDate)}
                </span>
              )}
            </>
          ) : (
            <>
              <Badge variant="warning">Awaiting Delivery</Badge>
              <span style={{ fontSize: '11px', color: 'var(--color-neutral-500)', fontWeight: 500 }}>
                In Transit
              </span>
            </>
          )}
        </div>
      ),
      align: 'center',
    },
    {
      header: 'Payment',
      width: '130px',
      accessor: (p) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <button
            type="button"
            onClick={() => handleUpdatePayment(p, p.paymentStatus === 'Paid' ? 'Pending' : 'Paid')}
            title={p.paymentStatus === 'Paid' ? 'Click to revert payment status' : 'Click to record payment made'}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              display: 'inline-flex',
            }}
          >
            <Badge variant={p.paymentStatus === 'Paid' ? 'success' : 'warning'}>
              {p.paymentStatus === 'Paid' ? '✓ Paid' : 'Pending'}
            </Badge>
          </button>
        </div>
      ),
      align: 'center',
    },
    {
      header: 'Actions',
      width: '160px',
      accessor: (p) => (
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', whiteSpace: 'nowrap' }}>
          {p.status !== 'Received' ? (
            <Button
              variant="tertiary"
              size="sm"
              icon={<PackageCheck size={14} />}
              isLoading={receivingId === p.id}
              onClick={() => handleReceiveStock(p)}
            >
              Inward Stock
            </Button>
          ) : p.paymentStatus !== 'Paid' ? (
            <Button
              variant="primary"
              size="sm"
              icon={<CreditCard size={14} color="#FFFFFF" />}
              isLoading={payingId === p.id}
              onClick={() => handleUpdatePayment(p, 'Paid')}
              title="Record payment made to supplier"
            >
              Mark Paid
            </Button>
          ) : (
            <span style={{
              fontSize: '12px',
              color: 'var(--color-success)',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}>
              <CheckCircle size={15} /> Settled
            </span>
          )}
        </div>
      ),
      align: 'right',
    },
  ];

  return (
    <>
      <Header
        title="Purchase Orders (PO)"
        subtitle="Manage restock orders, incoming shipments, and auto-inward into stock"
        quickActionLabel="Create PO"
        onQuickAction={() => setIsModalOpen(true)}
        onSearch={setSearchQuery}
      />

      <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <Table
          columns={columns}
          data={filteredPurchases}
          keyExtractor={(p) => p.id}
          emptyMessage="No purchase orders recorded yet."
        />
      </div>

      <PurchaseCrudModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={loadData}
        suppliers={suppliers}
        products={products}
      />
    </>
  );
};
