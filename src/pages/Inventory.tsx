import React, { useState, useEffect } from 'react';
import { 
  Warehouse, 
  ArrowUpRight, 
  ArrowDownLeft, 
  AlertTriangle, 
  History 
} from 'lucide-react';
import { Header } from '../components/layout/Header';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Table, type TableColumn } from '../components/ui/Table';
import { dataService } from '../services/dataService';
import type { Product, StockMovement } from '../types';
import { StockAdjustmentModal } from '../crud/StockAdjustmentModal';

export const Inventory: React.FC = () => {
  const [activeView, setActiveView] = useState<'levels' | 'movements'>('levels');
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'ALL' | 'LOW' | 'OUT'>('ALL');
  const [selectedProductForAdjust, setSelectedProductForAdjust] = useState<Product | null>(null);

  const loadData = async () => {
    const [pList, mList] = await Promise.all([
      dataService.getProducts(),
      dataService.getStockMovements(),
    ]);
    setProducts(pList);
    setMovements(mList);
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredProducts = products.filter(p => {
    const matchesSearch = 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.location && p.location.toLowerCase().includes(searchQuery.toLowerCase()));

    if (filterMode === 'OUT') return matchesSearch && p.stockQuantity === 0;
    if (filterMode === 'LOW') return matchesSearch && p.stockQuantity <= p.minStockLevel && p.stockQuantity > 0;
    return matchesSearch;
  });

  const levelColumns: TableColumn<Product>[] = [
    {
      header: 'Item & SKU',
      accessor: (p) => (
        <div>
          <div style={{ fontWeight: 700, color: 'var(--color-neutral-900)', fontSize: '13px' }}>
            {p.name}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--color-neutral-500)', marginTop: '2px' }}>
            SKU: {p.sku} • Location: {p.location || 'Showroom Floor'}
          </div>
        </div>
      ),
    },
    {
      header: 'Category',
      accessor: (p) => <span style={{ fontSize: '12px', color: 'var(--color-neutral-700)' }}>{p.category}</span>,
    },
    {
      header: 'Stock on Hand',
      accessor: (p) => (
        <div style={{ textAlign: 'center' }}>
          <span style={{
            fontSize: '15px',
            fontWeight: 800,
            color: p.stockQuantity === 0 ? 'var(--color-danger)' : p.stockQuantity <= p.minStockLevel ? 'var(--color-warning)' : 'var(--color-neutral-900)',
          }}>
            {p.stockQuantity}
          </span>
          <span style={{ fontSize: '11px', color: 'var(--color-neutral-500)', marginLeft: '4px' }}>{p.unit}</span>
        </div>
      ),
      align: 'center',
    },
    {
      header: 'Threshold Limit',
      accessor: (p) => <span style={{ fontSize: '12px', color: 'var(--color-neutral-600)' }}>{p.minStockLevel} {p.unit}</span>,
      align: 'center',
    },
    {
      header: 'Stock Valuation',
      accessor: (p) => (
        <span style={{ fontWeight: 700, color: 'var(--color-neutral-800)', fontSize: '13px' }}>
          ₹{(p.costPrice * p.stockQuantity).toLocaleString('en-IN')}
        </span>
      ),
      align: 'right',
    },
    {
      header: 'Status',
      accessor: (p) => {
        if (p.stockQuantity === 0) return <Badge variant="danger">Out of Stock</Badge>;
        if (p.stockQuantity <= p.minStockLevel) return <Badge variant="warning">Low Stock</Badge>;
        return <Badge variant="success">Healthy</Badge>;
      },
      align: 'center',
    },
    {
      header: 'Adjustment',
      accessor: (p) => (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setSelectedProductForAdjust(p)}
          >
            Adjust Stock
          </Button>
        </div>
      ),
      align: 'right',
    },
  ];

  const movementColumns: TableColumn<StockMovement>[] = [
    {
      header: 'Timestamp',
      accessor: (m) => (
        <span style={{ fontSize: '12px', color: 'var(--color-neutral-600)' }}>
          {new Date(m.date).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
        </span>
      ),
    },
    {
      header: 'Product',
      accessor: (m) => (
        <span style={{ fontWeight: 700, color: 'var(--color-neutral-900)', fontSize: '13px' }}>
          {m.productName}
        </span>
      ),
    },
    {
      header: 'Movement Type',
      accessor: (m) => {
        if (m.type === 'IN') {
          return (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--color-success)', fontWeight: 700, fontSize: '12px' }}>
              <ArrowDownLeft size={14} /> Stock In (+)
            </span>
          );
        }
        if (m.type === 'OUT') {
          return (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--color-primary-800)', fontWeight: 700, fontSize: '12px' }}>
              <ArrowUpRight size={14} /> Sale Out (-)
            </span>
          );
        }
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--color-danger)', fontWeight: 700, fontSize: '12px' }}>
            <AlertTriangle size={14} /> {m.type}
          </span>
        );
      },
    },
    {
      header: 'Qty Changed',
      accessor: (m) => (
        <span style={{ fontWeight: 800, fontSize: '13px' }}>
          {m.type === 'IN' ? `+${m.quantity}` : `-${m.quantity}`}
        </span>
      ),
      align: 'center',
    },
    {
      header: 'Before → After',
      accessor: (m) => (
        <span style={{ fontSize: '12px', color: 'var(--color-neutral-600)' }}>
          {m.previousStock} → <strong>{m.newStock}</strong>
        </span>
      ),
      align: 'center',
    },
    {
      header: 'Reference & Reason',
      accessor: (m) => (
        <div>
          <span style={{ fontWeight: 600, fontSize: '12px' }}>{m.referenceId}</span>
          <span style={{ fontSize: '11px', color: 'var(--color-neutral-500)', display: 'block' }}>
            {m.reason}
          </span>
        </div>
      ),
    },
  ];

  return (
    <>
      <Header
        title="Inventory & Stock Management"
        subtitle="Live warehouse stock tracking, threshold warnings, and movement audit log"
        onSearch={setSearchQuery}
      />

      <div style={{ padding: '20px 28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Navigation Switcher */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => setActiveView('levels')}
              style={{
                padding: '8px 20px',
                borderRadius: '9999px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '13px',
                backgroundColor: activeView === 'levels' ? 'var(--color-primary-800)' : '#FFFFFF',
                color: activeView === 'levels' ? '#FFFFFF' : 'var(--color-neutral-700)',
                boxShadow: activeView === 'levels' ? '0 2px 8px rgba(6, 77, 61, 0.25)' : 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Warehouse size={15} />
              <span>Stock Quantities</span>
            </button>

            <button
              onClick={() => setActiveView('movements')}
              style={{
                padding: '8px 20px',
                borderRadius: '9999px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '13px',
                backgroundColor: activeView === 'movements' ? 'var(--color-primary-800)' : '#FFFFFF',
                color: activeView === 'movements' ? '#FFFFFF' : 'var(--color-neutral-700)',
                boxShadow: activeView === 'movements' ? '0 2px 8px rgba(6, 77, 61, 0.25)' : 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <History size={15} />
              <span>Movement Audit Trail ({movements.length})</span>
            </button>
          </div>

          {activeView === 'levels' && (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setFilterMode('ALL')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '9999px',
                  border: '1px solid var(--color-neutral-300)',
                  backgroundColor: filterMode === 'ALL' ? 'var(--color-neutral-800)' : '#FFFFFF',
                  color: filterMode === 'ALL' ? '#FFFFFF' : 'var(--color-neutral-700)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                All ({products.length})
              </button>
              <button
                onClick={() => setFilterMode('LOW')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '9999px',
                  border: '1px solid #fcd34d',
                  backgroundColor: filterMode === 'LOW' ? 'var(--color-warning)' : 'var(--color-warning-bg)',
                  color: filterMode === 'LOW' ? '#FFFFFF' : 'var(--color-warning)',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Low Stock
              </button>
              <button
                onClick={() => setFilterMode('OUT')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '9999px',
                  border: '1px solid #fca5a5',
                  backgroundColor: filterMode === 'OUT' ? 'var(--color-danger)' : 'var(--color-danger-bg)',
                  color: filterMode === 'OUT' ? '#FFFFFF' : 'var(--color-danger)',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Out of Stock
              </button>
            </div>
          )}
        </div>

        {/* Active Content Table */}
        {activeView === 'levels' ? (
          <Table
            columns={levelColumns}
            data={filteredProducts}
            keyExtractor={(p) => p.id}
            emptyMessage="No stock items match your filter."
          />
        ) : (
          <Table
            columns={movementColumns}
            data={movements}
            keyExtractor={(m) => m.id}
            emptyMessage="No stock movement audit records found."
          />
        )}
      </div>

      <StockAdjustmentModal
        isOpen={!!selectedProductForAdjust}
        onClose={() => setSelectedProductForAdjust(null)}
        onSuccess={loadData}
        product={selectedProductForAdjust}
      />
    </>
  );
};
