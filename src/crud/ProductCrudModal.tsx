import React, { useState, useEffect } from 'react';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';
import type { Product, Supplier } from '../types';
import { dataService } from '../services/dataService';

interface ProductCrudModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  productToEdit?: Product | null;
  suppliers: Supplier[];
}

const CATEGORIES = [
  'Chandeliers',
  'COB & Downlights',
  'Track Lighting',
  'Strip & Profile Lights',
  'Drivers & Power',
  'Outdoor & Facade',
  'Decorative Pendants',
  'Switches & Automation',
  'Bulbs & Tubes',
  'Other Fixtures'
];

const UNITS = [
  { value: 'pcs', label: 'Pieces (pcs)' },
  { value: 'meters', label: 'Meters (m)' },
  { value: 'rolls', label: 'Rolls (5m/10m)' },
  { value: 'sets', label: 'Sets' },
  { value: 'boxes', label: 'Boxes' },
];

export const ProductCrudModal: React.FC<ProductCrudModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  productToEdit,
  suppliers,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    barcode: '',
    category: CATEGORIES[0],
    description: '',
    costPrice: 0,
    sellingPrice: 0,
    stockQuantity: 0,
    minStockLevel: 5,
    unit: 'pcs',
    location: '',
    supplierId: suppliers[0]?.id || '',
    imageUrl: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (productToEdit) {
      setFormData({
        name: productToEdit.name,
        sku: productToEdit.sku,
        barcode: productToEdit.barcode || '',
        category: productToEdit.category,
        description: productToEdit.description || '',
        costPrice: productToEdit.costPrice,
        sellingPrice: productToEdit.sellingPrice,
        stockQuantity: productToEdit.stockQuantity,
        minStockLevel: productToEdit.minStockLevel,
        unit: productToEdit.unit,
        location: productToEdit.location || '',
        supplierId: productToEdit.supplierId || suppliers[0]?.id || '',
        imageUrl: productToEdit.imageUrl || '',
      });
    } else {
      // Auto-generate SKU & Barcode for fresh item
      const randomCode = Math.floor(1000 + Math.random() * 9000);
      setFormData({
        name: '',
        sku: `LGT-${randomCode}`,
        barcode: `890${Math.floor(100000000 + Math.random() * 900000000)}`,
        category: CATEGORIES[0],
        description: '',
        costPrice: 0,
        sellingPrice: 0,
        stockQuantity: 10,
        minStockLevel: 4,
        unit: 'pcs',
        location: 'Aisle 1',
        supplierId: suppliers[0]?.id || '',
        imageUrl: '',
      });
    }
    setError('');
  }, [productToEdit, isOpen, suppliers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Product name is required');
      return;
    }
    if (formData.sellingPrice < 0 || formData.costPrice < 0) {
      setError('Prices cannot be negative');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const selectedSupplier = suppliers.find(s => s.id === formData.supplierId);
      const payload = {
        ...formData,
        costPrice: Number(formData.costPrice),
        sellingPrice: Number(formData.sellingPrice),
        stockQuantity: Number(formData.stockQuantity),
        minStockLevel: Number(formData.minStockLevel),
        supplierName: selectedSupplier ? selectedSupplier.name : undefined,
      };

      if (productToEdit) {
        await dataService.updateProduct(productToEdit.id, payload);
      } else {
        await dataService.createProduct(payload);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={productToEdit ? 'Edit Product Item' : 'Add New Product'}
      subtitle={productToEdit ? `Updating ${productToEdit.name}` : 'Create a new stock item in inventory'}
      maxWidth="680px"
      footer={
        <>
          <Button variant="outlined" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} isLoading={loading} type="button">
            {productToEdit ? 'Update Product' : 'Save to Inventory'}
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

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Input
          label="Product Name *"
          placeholder="e.g. 15W Surface COB Downlight 4000K"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <Input
            label="SKU Code"
            value={formData.sku}
            onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
            placeholder="e.g. LGT-COB-101"
          />
          <Input
            label="Barcode"
            value={formData.barcode}
            onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
            placeholder="Scan or enter barcode"
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <Select
            label="Category"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            options={CATEGORIES.map(c => ({ value: c, label: c }))}
          />
          <Select
            label="Measurement Unit"
            value={formData.unit}
            onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
            options={UNITS}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <Input
            label="Cost / Purchase Price (₹)"
            type="number"
            min="0"
            step="0.01"
            value={formData.costPrice}
            onChange={(e) => setFormData({ ...formData, costPrice: Number(e.target.value) })}
          />
          <Input
            label="Selling / MRP Price (₹) *"
            type="number"
            min="0"
            step="0.01"
            value={formData.sellingPrice}
            onChange={(e) => setFormData({ ...formData, sellingPrice: Number(e.target.value) })}
            required
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
          <Input
            label="Opening Stock"
            type="number"
            min="0"
            value={formData.stockQuantity}
            onChange={(e) => setFormData({ ...formData, stockQuantity: Number(e.target.value) })}
          />
          <Input
            label="Low Stock Alert Qty"
            type="number"
            min="1"
            value={formData.minStockLevel}
            onChange={(e) => setFormData({ ...formData, minStockLevel: Number(e.target.value) })}
          />
          <Input
            label="Shelf / Rack Location"
            placeholder="e.g. Rack B - Pod 2"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          />
        </div>

        <Select
          label="Primary Supplier"
          value={formData.supplierId}
          onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
          options={suppliers.map(s => ({ value: s.id, label: `${s.name} (${s.contactPerson})` }))}
        />

        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <Input
              label="Product Image URL (e.g. Unsplash or e-commerce CDN)"
              placeholder="https://images.unsplash.com/photo-..."
              value={formData.imageUrl}
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
            />
          </div>
          {formData.imageUrl && (
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
              border: '1px solid var(--color-neutral-300)',
              backgroundColor: '#FFFFFF',
              flexShrink: 0,
              marginTop: '22px',
            }}>
              <img
                src={formData.imageUrl}
                alt="Preview"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
          )}
        </div>

        <Input
          label="Item Description / Specifications"
          placeholder="e.g. IP65 Waterproof, 3000K Warm White, 2 Year Warranty"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
      </form>
    </Modal>
  );
};
