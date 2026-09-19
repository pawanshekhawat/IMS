import React, { useState, useEffect } from 'react';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import type { Customer } from '../types';
import { dataService } from '../services/dataService';

interface CustomerCrudModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  customerToEdit?: Customer | null;
}

export const CustomerCrudModal: React.FC<CustomerCrudModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  customerToEdit,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    gstin: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (customerToEdit) {
      setFormData({
        name: customerToEdit.name,
        phone: customerToEdit.phone,
        email: customerToEdit.email || '',
        address: customerToEdit.address || '',
        gstin: customerToEdit.gstin || '',
      });
    } else {
      setFormData({
        name: '',
        phone: '',
        email: '',
        address: '',
        gstin: '',
      });
    }
    setError('');
  }, [customerToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Customer name is required');
      return;
    }
    if (!formData.phone.trim()) {
      setError('Phone number is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (customerToEdit) {
        await dataService.updateCustomer(customerToEdit.id, formData);
      } else {
        await dataService.createCustomer(formData);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save customer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={customerToEdit ? 'Edit Customer' : 'Add New Customer'}
      subtitle={customerToEdit ? `Updating profile of ${customerToEdit.name}` : 'Register a new customer or contractor'}
      maxWidth="540px"
      footer={
        <>
          <Button variant="outlined" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} isLoading={loading} type="button">
            {customerToEdit ? 'Update Customer' : 'Save Customer'}
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
          label="Full Name / Company *"
          placeholder="e.g. Hotel Hilltop / Rajesh Sharma"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <Input
            label="Mobile Number *"
            placeholder="+91 98765 43210"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            required
          />
          <Input
            label="Email Address"
            type="email"
            placeholder="client@example.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
        </div>

        <Input
          label="GSTIN (Optional)"
          placeholder="e.g. 05AABCH4321A1ZB"
          value={formData.gstin}
          onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
        />

        <Input
          label="Billing / Delivery Address"
          placeholder="e.g. Mall Road, Mussoorie / Rajpur Road, Dehradun"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
        />
      </form>
    </Modal>
  );
};
