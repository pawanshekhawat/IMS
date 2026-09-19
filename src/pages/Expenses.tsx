import React, { useState, useEffect } from 'react';
import { Trash2, ReceiptText, Zap, Home, Users } from 'lucide-react';
import { Header } from '../components/layout/Header';
import { Badge } from '../components/ui/Badge';
import { StatCard } from '../components/ui/StatCard';
import { Table, type TableColumn } from '../components/ui/Table';
import { dataService } from '../services/dataService';
import type { Expense } from '../types';
import { ExpenseCrudModal } from '../crud/ExpenseCrudModal';

export const Expenses: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadData = async () => {
    const list = await dataService.getExpenses();
    setExpenses(list);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async (exp: Expense) => {
    if (window.confirm(`Delete expense "${exp.title}" of ₹${exp.amount}?`)) {
      await dataService.deleteExpense(exp.id);
      loadData();
    }
  };

  const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);
  const rentTotal = expenses.filter(e => e.category === 'Showroom Rent').reduce((sum, e) => sum + e.amount, 0);
  const utilityTotal = expenses.filter(e => e.category === 'Electricity & Utilities').reduce((sum, e) => sum + e.amount, 0);
  const staffTotal = expenses.filter(e => e.category === 'Staff Wages').reduce((sum, e) => sum + e.amount, 0);

  const filteredExpenses = expenses.filter(e =>
    e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.paidTo.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.expenseNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const columns: TableColumn<Expense>[] = [
    {
      header: 'Expense Voucher & Date',
      accessor: (e) => (
        <div>
          <span style={{ fontWeight: 800, color: 'var(--color-primary-800)', fontSize: '13px' }}>
            {e.expenseNumber}
          </span>
          <span style={{ fontSize: '11px', color: 'var(--color-neutral-500)', display: 'block' }}>
            {e.date}
          </span>
        </div>
      ),
    },
    {
      header: 'Title / Description',
      accessor: (e) => (
        <div>
          <span style={{ fontWeight: 700, color: 'var(--color-neutral-900)', fontSize: '13px' }}>
            {e.title}
          </span>
          {e.notes && (
            <span style={{ fontSize: '11px', color: 'var(--color-neutral-500)', display: 'block' }}>
              {e.notes}
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'Category',
      accessor: (e) => (
        <span style={{
          fontSize: '12px',
          fontWeight: 600,
          backgroundColor: 'var(--color-neutral-200)',
          color: 'var(--color-neutral-800)',
          padding: '4px 8px',
          borderRadius: '6px',
        }}>
          {e.category}
        </span>
      ),
    },
    {
      header: 'Paid To',
      accessor: (e) => (
        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-neutral-700)' }}>
          {e.paidTo}
        </span>
      ),
    },
    {
      header: 'Payment Mode',
      accessor: (e) => <Badge variant="secondary">{e.paymentMethod}</Badge>,
      align: 'center',
    },
    {
      header: 'Amount',
      accessor: (e) => (
        <span style={{ fontWeight: 800, color: 'var(--color-danger)', fontSize: '14px' }}>
          ₹{e.amount.toLocaleString('en-IN')}
        </span>
      ),
      align: 'right',
    },
    {
      header: 'Actions',
      accessor: (e) => (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={() => handleDelete(e)}
            title="Delete Expense"
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
        title="Showroom Expenses"
        subtitle="Track rent, commercial electricity, staff wages, and showroom overheads"
        quickActionLabel="Record Expense"
        onQuickAction={() => setIsModalOpen(true)}
        onSearch={setSearchQuery}
      />

      <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Expense Category Stat Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '18px',
        }}>
          <StatCard
            label="Total Showroom Outflow"
            value={`₹${totalExpense.toLocaleString('en-IN')}`}
            subtext={`${expenses.length} logged expense entries`}
            icon={<ReceiptText size={20} />}
            variant="danger"
          />
          <StatCard
            label="Showroom Rent"
            value={`₹${rentTotal.toLocaleString('en-IN')}`}
            subtext="Monthly lease payments"
            icon={<Home size={20} />}
            variant="neutral"
          />
          <StatCard
            label="Power & Utilities"
            value={`₹${utilityTotal.toLocaleString('en-IN')}`}
            subtext="Electricity & display power"
            icon={<Zap size={20} />}
            variant="warning"
          />
          <StatCard
            label="Staff Wages & Advances"
            value={`₹${staffTotal.toLocaleString('en-IN')}`}
            subtext="Showroom sales assistance"
            icon={<Users size={20} />}
            variant="secondary"
          />
        </div>

        {/* Expenses List */}
        <Table
          columns={columns}
          data={filteredExpenses}
          keyExtractor={(e) => e.id}
          emptyMessage="No expenses recorded."
        />
      </div>

      <ExpenseCrudModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={loadData}
      />
    </>
  );
};
