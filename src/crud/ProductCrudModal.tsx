import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Upload, 
  Link as LinkIcon, 
  X, 
  Barcode as BarcodeIcon, 
  Tag, 
  RotateCw
} from 'lucide-react';
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

const CATEGORY_PREFIXES: Record<string, string> = {
  'Chandeliers': 'CH',
  'COB & Downlights': 'COB',
  'Track Lighting': 'TRK',
  'Strip & Profile Lights': 'STR',
  'Drivers & Power': 'DRV',
  'Outdoor & Facade': 'WAL',
  'Decorative Pendants': 'PND',
  'Switches & Automation': 'SW',
  'Bulbs & Tubes': 'BLB',
  'Other Fixtures': 'FX',
};

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

  const [imageMode, setImageMode] = useState<'upload' | 'url'>('upload');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // SKU Auto-generator function
  const generateSku = (category: string) => {
    const prefix = CATEGORY_PREFIXES[category] || 'LGT';
    const randomNum = Math.floor(100 + Math.random() * 900);
    return `LGT-${prefix}-${randomNum}`;
  };

  // Barcode Auto-generator function (12-digit Indian Retail EAN/UPC style)
  const generateBarcode = () => {
    const randomDigits = Math.floor(100000000 + Math.random() * 900000000);
    return `890${randomDigits}`;
  };

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
      // If editing product with existing data URL or web url, set appropriate mode
      if (productToEdit.imageUrl?.startsWith('data:')) {
        setImageMode('upload');
      } else if (productToEdit.imageUrl) {
        setImageMode('url');
      }
    } else {
      // Auto-generate fresh SKU & Barcode for new item
      const initialCat = CATEGORIES[0];
      setFormData({
        name: '',
        sku: generateSku(initialCat),
        barcode: generateBarcode(),
        category: initialCat,
        description: '',
        costPrice: 0,
        sellingPrice: 0,
        stockQuantity: 10,
        minStockLevel: 4,
        unit: 'pcs',
        location: 'Aisle 1 - Shelf A',
        supplierId: suppliers[0]?.id || '',
        imageUrl: '',
      });
      setImageMode('upload');
    }
    setError('');
  }, [productToEdit, isOpen, suppliers]);

  // Handle Category Change (Optionally auto-update SKU prefix if adding fresh product)
  const handleCategoryChange = (newCat: string) => {
    if (!productToEdit) {
      setFormData(prev => ({
        ...prev,
        category: newCat,
        sku: generateSku(newCat),
      }));
    } else {
      setFormData(prev => ({ ...prev, category: newCat }));
    }
  };

  // File Upload Handler (Converts selected image file to Base64 data URL)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (JPG, PNG, WebP)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image size should be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setFormData(prev => ({ ...prev, imageUrl: reader.result as string }));
        setError('');
      }
    };
    reader.onerror = () => {
      setError('Failed to read image file');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setFormData(prev => ({ ...prev, imageUrl: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

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
        sku: formData.sku.trim() || generateSku(formData.category),
        barcode: formData.barcode.trim() || generateBarcode(),
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
      title={productToEdit ? 'Edit Product Item' : 'Add New Lighting Product'}
      subtitle={productToEdit ? `Updating details for ${productToEdit.name}` : 'Auto-generate SKU & Barcode, upload photo, and set showroom pricing'}
      maxWidth="720px"
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
          fontWeight: 700,
        }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {/* Basic Information */}
        <Input
          label="Product Name & Specification *"
          placeholder="e.g. 15W Surface COB Downlight (Deep Anti-Glare 4000K)"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />

        {/* Category & Unit */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '16px' }}>
          <Select
            label="Lighting Category"
            value={formData.category}
            onChange={(e) => handleCategoryChange(e.target.value)}
            options={CATEGORIES.map(c => ({ value: c, label: c }))}
          />
          <Select
            label="Measurement Unit"
            value={formData.unit}
            onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
            options={UNITS}
          />
        </div>

        {/* SKU & Barcode with Auto-Generation Buttons and Context Explanations */}
        <div style={{
          padding: '16px',
          borderRadius: 'var(--radius-lg)',
          backgroundColor: 'var(--color-neutral-200)',
          border: '1px solid var(--color-neutral-300)',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--color-neutral-900)' }}>
              Identification: SKU & Barcode Codes
            </span>
            <span style={{ fontSize: '11px', color: 'var(--color-neutral-500)' }}>
              Auto-generated for instant POS scanning and inventory tracking
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {/* SKU Code Field */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-neutral-800)' }}>
                  SKU Code (Internal)
                </label>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, sku: generateSku(formData.category) })}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '11px',
                    fontWeight: 700,
                    color: 'var(--color-primary-800)',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '2px 6px',
                    borderRadius: '4px',
                  }}
                  title="Generate new unique SKU"
                >
                  <Sparkles size={12} />
                  Auto-Generate
                </button>
              </div>
              <Input
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                placeholder="e.g. LGT-CH-195"
                icon={<Tag size={15} />}
              />
              <p style={{ fontSize: '11px', color: 'var(--color-neutral-500)', marginTop: '4px' }}>
                Human-readable code used by staff to search, identify, & order items.
              </p>
            </div>

            {/* Barcode Field */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-neutral-800)' }}>
                  Barcode (POS Scanner)
                </label>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, barcode: generateBarcode() })}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '11px',
                    fontWeight: 700,
                    color: 'var(--color-primary-800)',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '2px 6px',
                    borderRadius: '4px',
                  }}
                  title="Generate new numeric barcode"
                >
                  <RotateCw size={12} />
                  Auto-Generate
                </button>
              </div>
              <Input
                value={formData.barcode}
                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                placeholder="e.g. 890738195601"
                icon={<BarcodeIcon size={15} />}
              />
              <p style={{ fontSize: '11px', color: 'var(--color-neutral-500)', marginTop: '4px' }}>
                12-digit number read by handheld POS barcode scanners & printed on labels.
              </p>
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <Input
            label="Wholesale Cost Price (₹)"
            type="number"
            min="0"
            step="1"
            value={formData.costPrice}
            onChange={(e) => setFormData({ ...formData, costPrice: Number(e.target.value) })}
          />
          <Input
            label="Retail Selling Price / MRP (₹) *"
            type="number"
            min="0"
            step="1"
            value={formData.sellingPrice}
            onChange={(e) => setFormData({ ...formData, sellingPrice: Number(e.target.value) })}
            required
          />
        </div>

        {/* Stock & Location */}
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
            label="Showroom Shelf / Rack"
            placeholder="e.g. Rack 4 - Bin 02"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          />
        </div>

        {/* Primary Supplier */}
        <Select
          label="Primary Vendor / Supplier"
          value={formData.supplierId}
          onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
          options={suppliers.map(s => ({ value: s.id, label: `${s.name} (${s.contactPerson})` }))}
        />

        {/* Image Attachment: File Upload OR Web URL */}
        <div style={{
          padding: '16px',
          borderRadius: 'var(--radius-lg)',
          backgroundColor: '#FFFFFF',
          border: '1px solid var(--color-neutral-300)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
            <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-neutral-900)' }}>
              Product Image Attachment
            </label>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                type="button"
                onClick={() => setImageMode('upload')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '5px 12px',
                  borderRadius: '9999px',
                  border: '1px solid var(--color-neutral-300)',
                  backgroundColor: imageMode === 'upload' ? 'var(--color-primary-800)' : 'var(--color-neutral-200)',
                  color: imageMode === 'upload' ? '#FFFFFF' : 'var(--color-neutral-700)',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <Upload size={13} color={imageMode === 'upload' ? '#FFFFFF' : 'currentColor'} />
                Upload File
              </button>
              <button
                type="button"
                onClick={() => setImageMode('url')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '5px 12px',
                  borderRadius: '9999px',
                  border: '1px solid var(--color-neutral-300)',
                  backgroundColor: imageMode === 'url' ? 'var(--color-primary-800)' : 'var(--color-neutral-200)',
                  color: imageMode === 'url' ? '#FFFFFF' : 'var(--color-neutral-700)',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <LinkIcon size={13} color={imageMode === 'url' ? '#FFFFFF' : 'currentColor'} />
                Web URL Link
              </button>
            </div>
          </div>

          {/* Mode 1: File Upload */}
          {imageMode === 'upload' && (
            <div>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/png, image/jpeg, image/webp"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
                id="product-image-file-input"
              />
              <label
                htmlFor="product-image-file-input"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '20px',
                  borderRadius: 'var(--radius-md)',
                  border: '2px dashed var(--color-neutral-400)',
                  backgroundColor: 'var(--color-neutral-100)',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s ease',
                  textAlign: 'center',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-primary-50)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-neutral-100)')}
              >
                <Upload size={24} color="var(--color-primary-800)" style={{ marginBottom: '8px' }} />
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-neutral-800)' }}>
                  Click to select image file from computer
                </span>
                <span style={{ fontSize: '11px', color: 'var(--color-neutral-500)', marginTop: '2px' }}>
                  Supports PNG, JPG, JPEG, WebP (saves directly in offline local database)
                </span>
              </label>
            </div>
          )}

          {/* Mode 2: Web URL */}
          {imageMode === 'url' && (
            <Input
              placeholder="Paste public image link (e.g. https://cdn.shopify.com/...)"
              value={formData.imageUrl}
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
              icon={<LinkIcon size={16} />}
            />
          )}

          {/* Live Thumbnail Preview */}
          {formData.imageUrl && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--color-neutral-200)',
              border: '1px solid var(--color-neutral-300)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '54px',
                  height: '54px',
                  borderRadius: 'var(--radius-sm)',
                  overflow: 'hidden',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid var(--color-neutral-300)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
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
                <div>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-neutral-900)', display: 'block' }}>
                    Image Attached
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--color-neutral-500)' }}>
                    {formData.imageUrl.startsWith('data:') ? 'Local file uploaded (Base64 offline)' : 'Remote web CDN URL'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleRemoveImage}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '5px 10px',
                  borderRadius: '6px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid var(--color-danger)',
                  color: 'var(--color-danger)',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                <X size={13} />
                Remove
              </button>
            </div>
          )}
        </div>

        {/* Description / Tech Specs */}
        <Input
          label="Item Description / Technical Specifications"
          placeholder="e.g. Warm White 3000K, Bridgelux COB Chip, 2 Years Warranty, Die-Cast Aluminium"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
      </form>
    </Modal>
  );
};
