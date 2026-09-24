import React, { useState, useEffect } from 'react';
import { Edit2, Trash2, Phone, Mail, MapPin } from 'lucide-react';
import { Header } from '../components/layout/Header';
import { Table, type TableColumn } from '../components/ui/Table';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { dataService } from '../services/dataService';
import type { Customer } from '../types';
import { CustomerCrudModal } from '../crud/CustomerCrudModal';

export const Customers: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);

  // Custom confirmation modal state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: React.ReactNode;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'primary' | 'info';
    isAlertOnly?: boolean;
    onConfirm?: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
  });

  const showNotice = (title: string, message: string, variant: 'warning' | 'danger' | 'info' = 'warning') => {
    setConfirmDialog({
      isOpen: true,
      title,
      message,
      confirmText: 'OK',
      variant,
      isAlertOnly: true,
      onConfirm: () => setConfirmDialog(prev => ({ ...prev, isOpen: false })),
    });
  };

  const loadData = async () => {
    const list = await dataService.getCustomers();
    setCustomers(list);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = (cust: Customer) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Customer',
      message: `Are you sure you want to delete customer "${cust.name}" (${cust.phone})?\n\nThis will remove their contact info and profile.`,
      confirmText: 'Yes, Delete',
      variant: 'danger',
      isAlertOnly: false,
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        setCustomers(prev => prev.filter(c => c.id !== cust.id));
        try {
          await dataService.deleteCustomer(cust.id);
        } catch (err: any) {
          showNotice('Delete Failed', err.message || 'Failed to delete customer.', 'danger');
          loadData();
        }
      },
    });
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone.includes(searchQuery) ||
    (c.gstin && c.gstin.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (c.address && c.address.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const columns: TableColumn<Customer>[] = [
    {
      header: 'Customer / Client Name',
      accessor: (c) => (
        <div>
          <div style={{ fontWeight: 700, color: 'var(--color-neutral-900)', fontSize: '13px' }}>
            {c.name}
          </div>
          {c.gstin && (
            <div style={{ fontSize: '11px', color: 'var(--color-neutral-500)', marginTop: '2px' }}>
              GSTIN: <strong>{c.gstin}</strong>
            </div>
          )}
        </div>
      ),
    },
    {
      header: 'Contact Info',
      accessor: (c) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--color-neutral-800)' }}>
            <Phone size={12} color="var(--color-neutral-500)" />
            <span>{c.phone}</span>
          </div>
          {c.email && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--color-neutral-500)' }}>
              <Mail size={12} color="var(--color-neutral-500)" />
              <span>{c.email}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      header: 'Location / Address',
      accessor: (c) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--color-neutral-600)' }}>
          <MapPin size={13} color="var(--color-neutral-400)" />
          <span>{c.address || 'Local Showroom Walk-in'}</span>
        </div>
      ),
    },
    {
      header: 'Total Lifetime Spend',
      accessor: (c) => (
        <span style={{ fontWeight: 800, color: 'var(--color-primary-800)', fontSize: '14px' }}>
          ₹{c.totalPurchases.toLocaleString('en-IN')}
        </span>
      ),
      align: 'right',
    },
    {
      header: 'Outstanding Due',
      accessor: (c) => (
        <span style={{
          fontWeight: 700,
          color: c.outstandingBalance > 0 ? 'var(--color-danger)' : 'var(--color-neutral-500)',
          fontSize: '13px',
        }}>
          {c.outstandingBalance > 0 ? `₹${c.outstandingBalance.toLocaleString('en-IN')}` : '₹0 (Clear)'}
        </span>
      ),
      align: 'right',
    },
    {
      header: 'Actions',
      accessor: (c) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
          <button
            onClick={() => {
              setCustomerToEdit(c);
              setIsModalOpen(true);
            }}
            title="Edit Customer"
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
            onClick={() => handleDelete(c)}
            title="Delete Customer"
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
      align: 'right',
    },
  ];

  return (
    <>
      <Header
        title="Customer Directory"
        subtitle="Manage regular clients, interior decorators, architects, and hotels"
        quickActionLabel="Add Customer"
        onQuickAction={() => {
          setCustomerToEdit(null);
          setIsModalOpen(true);
        }}
        onSearch={setSearchQuery}
      />

      <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <Table
          columns={columns}
          data={filteredCustomers}
          keyExtractor={(c) => c.id}
          emptyMessage="No customers found matching your search."
        />
      </div>

      <CustomerCrudModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setCustomerToEdit(null);
        }}
        onSuccess={loadData}
        customerToEdit={customerToEdit}
      />

      <ConfirmModal
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        cancelText={confirmDialog.cancelText}
        variant={confirmDialog.variant}
        isAlertOnly={confirmDialog.isAlertOnly}
      />
    </>
  );
};
