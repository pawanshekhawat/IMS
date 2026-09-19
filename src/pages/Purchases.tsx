import React, { useState, useEffect } from 'react';
import { CheckCircle, PackageCheck } from 'lucide-react';
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

  const filteredPurchases = purchases.filter(p =>
    p.poNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.supplierName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const columns: TableColumn<Purchase>[] = [
    {
      header: 'PO Number & Date',
      accessor: (p) => (
        <div>
          <span style={{ fontWeight: 800, color: 'var(--color-primary-800)', fontSize: '13px' }}>
            {p.poNumber}
          </span>
          <span style={{ fontSize: '11px', color: 'var(--color-neutral-500)', display: 'block' }}>
            Ordered: {p.orderDate}
          </span>
        </div>
      ),
    },
    {
      header: 'Vendor / Supplier',
      accessor: (p) => (
        <span style={{ fontWeight: 700, color: 'var(--color-neutral-900)', fontSize: '13px' }}>
          {p.supplierName}
        </span>
      ),
    },
    {
      header: 'Items Ordered',
      accessor: (p) => (
        <div>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-neutral-800)' }}>
            {p.items.length} product lines
          </span>
          <div style={{ fontSize: '11px', color: 'var(--color-neutral-500)' }}>
            {p.items.map(i => `${i.productName} (x${i.quantity})`).slice(0, 2).join(', ')}
            {p.items.length > 2 && '...'}
          </div>
        </div>
      ),
    },
    {
      header: 'Total Value',
      accessor: (p) => (
        <span style={{ fontWeight: 800, color: 'var(--color-neutral-900)', fontSize: '14px' }}>
          ₹{p.totalAmount.toLocaleString('en-IN')}
        </span>
      ),
      align: 'right',
    },
    {
      header: 'Order Status',
      accessor: (p) => {
        if (p.status === 'Received') return <Badge variant="success">Stock Received</Badge>;
        if (p.status === 'Ordered') return <Badge variant="warning">Awaiting Delivery</Badge>;
        return <Badge variant="neutral">{p.status}</Badge>;
      },
      align: 'center',
    },
    {
      header: 'Payment',
      accessor: (p) => (
        <Badge variant={p.paymentStatus === 'Paid' ? 'success' : 'neutral'}>
          {p.paymentStatus}
        </Badge>
      ),
      align: 'center',
    },
    {
      header: 'Actions',
      accessor: (p) => (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
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
          ) : (
            <span style={{ fontSize: '12px', color: 'var(--color-success)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <CheckCircle size={14} /> Received ({p.receivedDate})
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
