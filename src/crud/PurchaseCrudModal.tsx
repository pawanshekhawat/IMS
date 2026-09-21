import React, { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Modal } from '../components/ui/Modal';
import { Select } from '../components/ui/Select';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import type { Supplier, Product, PurchaseItem } from '../types';
import { dataService } from '../services/dataService';

interface PurchaseCrudModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  suppliers: Supplier[];
  products: Product[];
}

export const PurchaseCrudModal: React.FC<PurchaseCrudModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  suppliers,
  products,
}) => {
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id || '');
  const [items, setItems] = useState<PurchaseItem[]>([]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Local draft item state
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id || '');
  const [itemQuantity, setItemQuantity] = useState(10);
  const [itemCostPrice, setItemCostPrice] = useState(products[0]?.costPrice || 0);

  // Sync state when modal opens or products/suppliers change
  useEffect(() => {
    if (isOpen) {
      if (suppliers.length > 0 && (!supplierId || !suppliers.some(s => s.id === supplierId))) {
        setSupplierId(suppliers[0].id);
      }
      if (products.length > 0 && (!selectedProductId || !products.some(p => p.id === selectedProductId))) {
        setSelectedProductId(products[0].id);
        setItemCostPrice(products[0].costPrice || 0);
      }
      setError('');
    }
  }, [isOpen, suppliers, products]);

  const handleProductChange = (prodId: string) => {
    setSelectedProductId(prodId);
    const prod = products.find(p => p.id === prodId);
    if (prod) {
      setItemCostPrice(prod.costPrice);
    }
  };

  const handleAddItem = () => {
    const targetProdId = selectedProductId || products[0]?.id;
    const prod = products.find(p => p.id === targetProdId);
    if (!prod) {
      setError('Please select a product item from the catalog');
      return;
    }
    if (!itemQuantity || itemQuantity <= 0) {
      setError('Item order quantity must be greater than 0');
      return;
    }

    const price = itemCostPrice !== undefined && itemCostPrice >= 0 ? itemCostPrice : (prod.costPrice || 0);
    const existingIndex = items.findIndex(i => i.productId === prod.id);
    if (existingIndex > -1) {
      const updated = [...items];
      updated[existingIndex].quantity += itemQuantity;
      updated[existingIndex].costPrice = price;
      updated[existingIndex].total = updated[existingIndex].quantity * price;
      setItems(updated);
    } else {
      setItems([
        ...items,
        {
          productId: prod.id,
          productName: prod.name,
          costPrice: price,
          quantity: itemQuantity,
          unit: prod.unit || 'pcs',
          total: price * itemQuantity,
        }
      ]);
    }
    setError('');
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const totalAmount = items.reduce((sum, item) => sum + item.total, 0);

  const handleSubmit = async () => {
    if (items.length === 0) {
      setError('Please add at least one product item to the order');
      return;
    }
    const targetSupplierId = supplierId || suppliers[0]?.id;
    const sup = suppliers.find(s => s.id === targetSupplierId);
    if (!sup) {
      setError('Please select a supplier');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await dataService.createPurchase({
        supplierId: sup.id,
        supplierName: sup.name,
        items,
        totalAmount,
        paymentStatus: 'Pending',
        orderDate: new Date().toISOString().split('T')[0],
        notes,
      });

      setItems([]);
      setNotes('');
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create purchase order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Purchase Order (PO)"
      subtitle="Issue a new restock purchase order to a lighting vendor"
      maxWidth="720px"
      footer={
        <>
          <div style={{ marginRight: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', color: 'var(--color-neutral-600)' }}>Total Order Value:</span>
            <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-neutral-900)' }}>
              ₹{totalAmount.toLocaleString('en-IN')}
            </span>
          </div>
          <Button variant="outlined" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} isLoading={loading} type="button">
            Generate PO
          </Button>
        </>
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

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Select
          label="Select Supplier *"
          value={supplierId || (suppliers[0]?.id ?? '')}
          onChange={(e) => setSupplierId(e.target.value)}
          options={suppliers.map(s => ({ value: s.id, label: `${s.name} (${s.contactPerson})` }))}
        />

        {/* Item Addition Section */}
        <div style={{
          padding: '16px',
          borderRadius: 'var(--radius-lg)',
          backgroundColor: 'var(--color-neutral-200)',
          border: '1px solid var(--color-neutral-300)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}>
          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-neutral-800)' }}>
            Add Products to Purchase Order
          </span>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '12px', alignItems: 'end' }}>
            <Select
              label="Select Item"
              value={selectedProductId || (products[0]?.id ?? '')}
              onChange={(e) => handleProductChange(e.target.value)}
              options={products.map(p => ({ value: p.id, label: `${p.name} (Cur: ${p.stockQuantity} ${p.unit})` }))}
            />
            <Input
              label="Cost Price (₹)"
              type="number"
              min="0"
              value={itemCostPrice}
              onChange={(e) => setItemCostPrice(Number(e.target.value))}
            />
            <Input
              label="Order Qty"
              type="number"
              min="1"
              value={itemQuantity}
              onChange={(e) => setItemQuantity(Number(e.target.value))}
            />
            <Button
              variant="secondary"
              icon={<Plus size={16} />}
              onClick={handleAddItem}
              type="button"
              style={{ marginBottom: '2px' }}
            >
              Add
            </Button>
          </div>
        </div>

        {/* Items Table */}
        <div style={{
          maxHeight: '220px',
          overflowY: 'auto',
          border: '1px solid var(--color-neutral-300)',
          borderRadius: 'var(--radius-md)',
          backgroundColor: '#FFFFFF',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--color-neutral-200)', borderBottom: '1px solid var(--color-neutral-300)' }}>
                <th style={{ padding: '8px 12px', fontSize: '12px' }}>Product</th>
                <th style={{ padding: '8px 12px', fontSize: '12px', textAlign: 'right' }}>Cost</th>
                <th style={{ padding: '8px 12px', fontSize: '12px', textAlign: 'center' }}>Qty</th>
                <th style={{ padding: '8px 12px', fontSize: '12px', textAlign: 'right' }}>Total</th>
                <th style={{ padding: '8px 12px', width: '40px' }}></th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: 'var(--color-neutral-500)', fontSize: '13px' }}>
                    No products added yet. Pick items above to add.
                  </td>
                </tr>
              ) : (
                items.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--color-neutral-250)' }}>
                    <td style={{ padding: '10px 12px', fontSize: '13px', fontWeight: 600 }}>{item.productName}</td>
                    <td style={{ padding: '10px 12px', fontSize: '13px', textAlign: 'right' }}>₹{item.costPrice}</td>
                    <td style={{ padding: '10px 12px', fontSize: '13px', textAlign: 'center' }}>{item.quantity} {item.unit}</td>
                    <td style={{ padding: '10px 12px', fontSize: '13px', textAlign: 'right', fontWeight: 700 }}>₹{item.total.toLocaleString('en-IN')}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--color-danger)' }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Input
          label="Purchase Notes & Instructions"
          placeholder="e.g. Urgent restock for Mussoorie hotel project"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>
    </Modal>
  );
};
