import React, { useState, useEffect } from 'react';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import type { Supplier } from '../types';
import { dataService } from '../services/dataService';

interface SupplierCrudModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  supplierToEdit?: Supplier | null;
}

export const SupplierCrudModal: React.FC<SupplierCrudModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  supplierToEdit,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    gstin: '',
    paymentTerms: 'Net 30 Days',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (supplierToEdit) {
      setFormData({
        name: supplierToEdit.name,
        contactPerson: supplierToEdit.contactPerson,
        phone: supplierToEdit.phone,
        email: supplierToEdit.email || '',
        address: supplierToEdit.address || '',
        gstin: supplierToEdit.gstin || '',
        paymentTerms: supplierToEdit.paymentTerms || 'Net 30 Days',
      });
    } else {
      setFormData({
        name: '',
        contactPerson: '',
        phone: '',
        email: '',
        address: '',
        gstin: '',
        paymentTerms: 'Net 30 Days',
      });
    }
    setError('');
  }, [supplierToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Supplier company name is required');
      return;
    }
    if (!formData.contactPerson.trim()) {
      setError('Contact person name is required');
      return;
    }
    if (!formData.phone.trim()) {
      setError('Phone number is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (supplierToEdit) {
        await dataService.updateSupplier(supplierToEdit.id, formData);
      } else {
        await dataService.createSupplier(formData);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save supplier');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={supplierToEdit ? 'Edit Supplier' : 'Add New Lighting Vendor / Supplier'}
      subtitle={supplierToEdit ? `Updating ${supplierToEdit.name}` : 'Register a manufacturer or distributor'}
      maxWidth="560px"
      footer={
        <>
          <Button variant="outlined" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} isLoading={loading} type="button">
            {supplierToEdit ? 'Update Supplier' : 'Save Supplier'}
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
          label="Vendor / Company Name *"
          placeholder="e.g. Havells India Lighting / Philips Lumileds"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <Input
            label="Key Contact Person *"
            placeholder="e.g. Vikram Joshi"
            value={formData.contactPerson}
            onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
            required
          />
          <Input
            label="Phone / Mobile *"
            placeholder="+91 98110 00000"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            required
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <Input
            label="Email Address"
            type="email"
            placeholder="orders@vendor.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
          <Input
            label="GSTIN Number"
            placeholder="07AAACH1234F1Z8"
            value={formData.gstin}
            onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <Input
            label="Payment Terms"
            placeholder="e.g. Net 30 Days / COD"
            value={formData.paymentTerms}
            onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
          />
          <Input
            label="Warehouse / Office Address"
            placeholder="City, State"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          />
        </div>
      </form>
    </Modal>
  );
};
