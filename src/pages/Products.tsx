import React, { useState, useEffect } from 'react';
import { Edit2, Trash2 } from 'lucide-react';
import { Header } from '../components/layout/Header';
import { Badge } from '../components/ui/Badge';
import { Select } from '../components/ui/Select';
import { Table, type TableColumn } from '../components/ui/Table';
import { dataService } from '../services/dataService';
import type { Product, Supplier } from '../types';
import { ProductCrudModal } from '../crud/ProductCrudModal';
import { StockAdjustmentModal } from '../crud/StockAdjustmentModal';
import { useAuth } from '../context/AuthContext';

export const Products: React.FC = () => {
  const { isAdmin } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  
  // Modals state
  const [isCrudModalOpen, setIsCrudModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [productToAdjust, setProductToAdjust] = useState<Product | null>(null);

  const loadData = async () => {
    const [pList, sList] = await Promise.all([
      dataService.getProducts(),
      dataService.getSuppliers(),
    ]);
    setProducts(pList);
    setSuppliers(sList);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDeleteProduct = async (prod: Product) => {
    if (window.confirm(`Are you sure you want to delete ${prod.name}?`)) {
      setProducts(prev => prev.filter(p => p.id !== prod.id));
      try {
        await dataService.deleteProduct(prod.id);
      } catch (err: any) {
        alert(err.message || 'Failed to delete product.');
        loadData();
      }
    }
  };

  const categories = ['ALL', ...Array.from(new Set(products.map(p => p.category)))];

  const filteredProducts = products.filter((p) => {
    const matchesSearch = 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.barcode && p.barcode.includes(searchQuery)) ||
      (p.location && p.location.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = categoryFilter === 'ALL' || p.category === categoryFilter;
    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const columns: TableColumn<Product>[] = [
    {
      header: 'Product Details',
      accessor: (p) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {p.imageUrl ? (
            <img
              src={p.imageUrl}
              alt={p.name}
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '8px',
                objectFit: 'cover',
                border: '1px solid var(--color-neutral-300)',
                backgroundColor: '#FFFFFF',
                flexShrink: 0,
              }}
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '8px',
              backgroundColor: 'var(--color-neutral-200)',
              border: '1px solid var(--color-neutral-300)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '10px',
              color: 'var(--color-neutral-500)',
              fontWeight: 600,
              flexShrink: 0,
            }}>
              No Img
            </div>
          )}
          <div>
            <div style={{ fontWeight: 700, color: 'var(--color-neutral-900)', fontSize: '13px' }}>
              {p.name}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-neutral-500)', marginTop: '2px', display: 'flex', gap: '8px' }}>
              <span>SKU: <strong>{p.sku}</strong></span>
              {p.barcode && <span>• Barcode: {p.barcode}</span>}
            </div>
          </div>
        </div>
      ),
    },
    {
      header: 'Category',
      accessor: (p) => (
        <span style={{
          fontSize: '12px',
          fontWeight: 600,
          color: 'var(--color-neutral-700)',
          backgroundColor: 'var(--color-neutral-200)',
          padding: '4px 8px',
          borderRadius: '6px',
        }}>
          {p.category}
        </span>
      ),
    },
    ...(isAdmin ? [
      {
        header: 'Cost Price',
        accessor: (p: Product) => <span style={{ color: 'var(--color-neutral-600)' }}>₹{p.costPrice.toLocaleString('en-IN')}</span>,
        align: 'right' as const,
      },
    ] : []),
    {
      header: 'Selling Price (MRP)',
      accessor: (p) => (
        <span style={{ fontWeight: 700, color: 'var(--color-primary-800)' }}>
          ₹{p.sellingPrice.toLocaleString('en-IN')}
        </span>
      ),
      align: 'right',
    },
    ...(isAdmin ? [
      {
        header: 'Margin %',
        accessor: (p: Product) => {
          const margin = p.sellingPrice > 0 ? Math.round(((p.sellingPrice - p.costPrice) / p.sellingPrice) * 100) : 0;
          return (
            <span style={{ fontSize: '12px', fontWeight: 700, color: margin >= 30 ? 'var(--color-success)' : 'var(--color-neutral-600)' }}>
              {margin}%
            </span>
          );
        },
        align: 'center' as const,
      },
    ] : []),
    {
      header: 'Stock Qty',
      accessor: (p) => (
        <div style={{ textAlign: 'center' }}>
          <span style={{
            fontWeight: 800,
            fontSize: '14px',
            color: p.stockQuantity === 0 ? 'var(--color-danger)' : p.stockQuantity <= p.minStockLevel ? 'var(--color-warning)' : 'var(--color-neutral-900)',
          }}>
            {p.stockQuantity}
          </span>
          <span style={{ fontSize: '11px', color: 'var(--color-neutral-500)', marginLeft: '4px' }}>
            {p.unit}
          </span>
        </div>
      ),
      align: 'center',
    },
    {
      header: 'Status',
      accessor: (p) => {
        if (p.stockQuantity === 0) return <Badge variant="danger">Out of Stock</Badge>;
        if (p.stockQuantity <= p.minStockLevel) return <Badge variant="warning">Low Stock</Badge>;
        return <Badge variant="success">In Stock</Badge>;
      },
      align: 'center',
    },
    {
      header: 'Shelf / Location',
      accessor: (p) => <span style={{ fontSize: '12px', color: 'var(--color-neutral-500)' }}>{p.location || '—'}</span>,
    },
    ...(isAdmin ? [
      {
        header: 'Actions',
        accessor: (p: Product) => (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
            <button
              onClick={() => setProductToAdjust(p)}
              title="Adjust Stock (+ / -)"
              style={{
                padding: '6px 10px',
                borderRadius: '9999px',
                backgroundColor: 'var(--color-neutral-200)',
                border: '1px solid var(--color-neutral-300)',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: 700,
                color: 'var(--color-neutral-800)',
              }}
            >
              Adjust
            </button>
            <button
              onClick={() => {
                setProductToEdit(p);
                setIsCrudModalOpen(true);
              }}
              title="Edit Details"
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                border: 'none',
                backgroundColor: 'var(--color-neutral-200)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-neutral-700)',
              }}
            >
              <Edit2 size={13} />
            </button>
            <button
              onClick={() => handleDeleteProduct(p)}
              title="Delete Product"
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                border: 'none',
                backgroundColor: 'var(--color-danger-bg)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-danger)',
              }}
            >
              <Trash2 size={13} />
            </button>
          </div>
        ),
        align: 'right' as const,
      },
    ] : []),
  ];

  return (
    <>
      <Header
        title="Products & Lighting Catalog"
        subtitle="Manage showroom inventory, pricing, SKUs, and stock limits"
        quickActionLabel={isAdmin ? "Add Product" : undefined}
        onQuickAction={isAdmin ? () => {
          setProductToEdit(null);
          setIsCrudModalOpen(true);
        } : undefined}
        onSearch={setSearchQuery}
      />

      <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Filters Bar */}
        <div style={{
          padding: '14px 20px',
          backgroundColor: '#FFFFFF',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--color-neutral-300)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ width: '200px' }}>
              <Select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                options={categories.map(c => ({ value: c, label: c === 'ALL' ? 'All Categories' : c }))}
              />
            </div>

            <div style={{ width: '180px' }}>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={[
                  { value: 'ALL', label: 'All Statuses' },
                  { value: 'in_stock', label: 'In Stock' },
                  { value: 'low_stock', label: 'Low Stock' },
                  { value: 'out_of_stock', label: 'Out of Stock' },
                ]}
              />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-neutral-600)' }}>
              Showing {filteredProducts.length} of {products.length} products
            </span>
          </div>
        </div>

        {/* Products Table */}
        <Table
          columns={columns}
          data={filteredProducts}
          keyExtractor={(p) => p.id}
          emptyMessage="No lighting fixtures match your search or filter."
        />
      </div>

      <ProductCrudModal
        isOpen={isCrudModalOpen}
        onClose={() => {
          setIsCrudModalOpen(false);
          setProductToEdit(null);
        }}
        onSuccess={loadData}
        productToEdit={productToEdit}
        suppliers={suppliers}
      />

      <StockAdjustmentModal
        isOpen={!!productToAdjust}
        onClose={() => setProductToAdjust(null)}
        onSuccess={loadData}
        product={productToAdjust}
      />
    </>
  );
};
