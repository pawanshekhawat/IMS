import React, { useState, useEffect } from 'react';
import { Edit2, Trash2, Phone, Mail } from 'lucide-react';
import { Header } from '../components/layout/Header';
import { Table, type TableColumn } from '../components/ui/Table';
import { dataService } from '../services/dataService';
import type { Supplier } from '../types';
import { SupplierCrudModal } from '../crud/SupplierCrudModal';

export const Suppliers: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [supplierToEdit, setSupplierToEdit] = useState<Supplier | null>(null);

  const loadData = async () => {
    const list = await dataService.getSuppliers();
    setSuppliers(list);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async (s: Supplier) => {
    if (window.confirm(`Are you sure you want to delete supplier ${s.name}?`)) {
      await dataService.deleteSupplier(s.id);
      loadData();
    }
  };

  const filteredSuppliers = suppliers.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.phone.includes(searchQuery) ||
    (s.gstin && s.gstin.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const columns: TableColumn<Supplier>[] = [
    {
      header: 'Vendor / Company',
      accessor: (s) => (
        <div>
          <div style={{ fontWeight: 700, color: 'var(--color-neutral-900)', fontSize: '13px' }}>
            {s.name}
          </div>
          {s.gstin && (
            <div style={{ fontSize: '11px', color: 'var(--color-neutral-500)', marginTop: '2px' }}>
              GSTIN: <strong>{s.gstin}</strong>
            </div>
          )}
        </div>
      ),
    },
    {
      header: 'Contact Person',
      accessor: (s) => (
        <span style={{ fontWeight: 600, color: 'var(--color-neutral-800)', fontSize: '13px' }}>
          {s.contactPerson}
        </span>
      ),
    },
    {
      header: 'Communication',
      accessor: (s) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
            <Phone size={12} color="var(--color-neutral-500)" />
            <span>{s.phone}</span>
          </div>
          {s.email && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--color-neutral-500)' }}>
              <Mail size={12} color="var(--color-neutral-500)" />
              <span>{s.email}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      header: 'Payment Terms',
      accessor: (s) => (
        <span style={{
          fontSize: '12px',
          fontWeight: 600,
          backgroundColor: 'var(--color-neutral-200)',
          color: 'var(--color-neutral-700)',
          padding: '4px 8px',
          borderRadius: '6px',
        }}>
          {s.paymentTerms || 'Net 30 Days'}
        </span>
      ),
    },
    {
      header: 'Payable Due',
      accessor: (s) => (
        <span style={{
          fontWeight: 800,
          color: s.balanceDue > 0 ? 'var(--color-danger)' : 'var(--color-success)',
          fontSize: '14px',
        }}>
          ₹{s.balanceDue.toLocaleString('en-IN')}
        </span>
      ),
      align: 'right',
    },
    {
      header: 'Actions',
      accessor: (s) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
          <button
            onClick={() => {
              setSupplierToEdit(s);
              setIsModalOpen(true);
            }}
            title="Edit Supplier"
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
            onClick={() => handleDelete(s)}
            title="Delete Supplier"
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
        title="Suppliers & Vendors"
        subtitle="Manage manufacturers, wholesale distributors, and payment ledgers"
        quickActionLabel="+ Add Supplier"
        onQuickAction={() => {
          setSupplierToEdit(null);
          setIsModalOpen(true);
        }}
        onSearch={setSearchQuery}
      />

      <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <Table
          columns={columns}
          data={filteredSuppliers}
          keyExtractor={(s) => s.id}
          emptyMessage="No suppliers registered."
        />
      </div>

      <SupplierCrudModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSupplierToEdit(null);
        }}
        onSuccess={loadData}
        supplierToEdit={supplierToEdit}
      />
    </>
  );
};
