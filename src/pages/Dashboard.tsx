import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Package, 
  AlertTriangle, 
  Receipt, 
  Plus, 
  ArrowRight, 
  Wallet, 
  ShoppingBag, 
  Printer 
} from 'lucide-react';
import { Header } from '../components/layout/Header';
import { StatCard } from '../components/ui/StatCard';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { dataService } from '../services/dataService';
import type { DashboardStats, Product, Sale } from '../types';
import { InvoicePrintModal } from '../crud/InvoicePrintModal';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [recentSales, setRecentSales] = useState<Sale[]>([]);
  const [selectedSaleForPrint, setSelectedSaleForPrint] = useState<Sale | null>(null);

  const loadData = async () => {
    const s = await dataService.getDashboardStats();
    setStats(s);

    const allProds = await dataService.getProducts();
    setLowStockProducts(allProds.filter(p => p.stockQuantity <= p.minStockLevel));

    const sales = await dataService.getSales();
    setRecentSales(sales.slice(0, 5));
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <>
      <Header
        title="Showroom Overview"
        subtitle="Garhwal Lights • Live Retail & Stock Dashboard"
        quickActionLabel="New Bill"
        onQuickAction={() => navigate('/sales')}
        lowStockCount={stats?.lowStockCount || 0}
        outOfStockCount={stats?.outOfStockCount || 0}
        onAlertClick={() => navigate('/inventory?filter=low')}
        onOutOfStockClick={() => navigate('/inventory?filter=out')}
      />

      <div style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '28px' }}>
        {/* KPI Stat Cards Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '20px',
        }}>
          <StatCard
            label="Total Inventory Value"
            value={`₹${(stats?.totalInventoryValue || 0).toLocaleString('en-IN')}`}
            subtext={`Retail Est: ₹${(stats?.retailValue || 0).toLocaleString('en-IN')}`}
            icon={<Package size={20} />}
            variant="primary"
          />

          <StatCard
            label="Today's Sales"
            value={`₹${(stats?.todaySalesTotal || 0).toLocaleString('en-IN')}`}
            subtext={`${stats?.todayOrdersCount || 0} completed invoices today`}
            icon={<Receipt size={20} />}
            variant="secondary"
            trend={{ value: '14.2% vs yesterday', isPositive: true }}
          />

          <StatCard
            label="Restock Alerts"
            value={`${(stats?.lowStockCount || 0) + (stats?.outOfStockCount || 0)} Items`}
            subtext={
              (stats?.outOfStockCount || 0) > 0 && (stats?.lowStockCount || 0) > 0
                ? `${stats?.outOfStockCount} out of stock • ${stats?.lowStockCount} low stock`
                : (stats?.outOfStockCount || 0) > 0
                ? `${stats?.outOfStockCount} completely out of stock`
                : (stats?.lowStockCount || 0) > 0
                ? `${stats?.lowStockCount} items running low`
                : 'All items comfortably stocked'
            }
            icon={<AlertTriangle size={20} />}
            variant={(stats?.outOfStockCount || 0) > 0 ? 'danger' : (stats?.lowStockCount || 0) > 0 ? 'warning' : 'neutral'}
          />

          <StatCard
            label="Net Monthly Cashflow"
            value={`₹${((stats?.monthlySalesTotal || 0) - (stats?.monthlyExpensesTotal || 0)).toLocaleString('en-IN')}`}
            subtext={`Sales ₹${(stats?.monthlySalesTotal || 0).toLocaleString('en-IN')} | Exp ₹${(stats?.monthlyExpensesTotal || 0).toLocaleString('en-IN')}`}
            icon={<Wallet size={20} />}
            variant="primary"
          />
        </div>

        {/* Quick Launch Bar */}
        <div style={{
          padding: '16px 20px',
          backgroundColor: '#FFFFFF',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--color-neutral-300)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-neutral-800)' }}>
              ⚡ Quick Actions:
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <Button
              variant="tertiary"
              size="sm"
              icon={<Receipt size={15} />}
              onClick={() => navigate('/sales')}
            >
              Start Billing (POS)
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={<Plus size={15} />}
              onClick={() => navigate('/products')}
            >
              Add Product
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={<ShoppingBag size={15} />}
              onClick={() => navigate('/purchases')}
            >
              Create Purchase Order
            </Button>
            <Button
              variant="outlined"
              size="sm"
              icon={<Wallet size={15} />}
              onClick={() => navigate('/expenses')}
            >
              Record Expense
            </Button>
          </div>
        </div>

        {/* 2 Columns: Low Stock Alerts & Recent Sales */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {/* Low Stock Watchlist */}
          <Card
            title="⚠️ Stock Attention Needed"
            subtitle="Items below minimum threshold requiring vendor purchase"
            action={
              <Button
                variant="outlined"
                size="sm"
                icon={<ArrowRight size={14} />}
                iconPosition="right"
                onClick={() => navigate('/inventory?filter=' + ((stats?.outOfStockCount || 0) > 0 ? 'out' : 'low'))}
              >
                View All
              </Button>
            }
          >
            {lowStockProducts.length === 0 ? (
              <p style={{ padding: '24px 0', textAlign: 'center', color: 'var(--color-neutral-500)', fontSize: '13px' }}>
                All products are comfortably stocked!
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {lowStockProducts.slice(0, 4).map((p) => (
                  <div
                    key={p.id}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-lg)',
                      backgroundColor: 'var(--color-neutral-200)',
                      border: '1px solid var(--color-neutral-300)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-neutral-900)' }}>
                        {p.name}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--color-neutral-500)', marginTop: '2px' }}>
                        SKU: {p.sku} • Supplier: {p.supplierName || 'Wholesale'}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{
                          fontSize: '14px',
                          fontWeight: 800,
                          color: p.stockQuantity === 0 ? 'var(--color-danger)' : 'var(--color-warning)',
                        }}>
                          {p.stockQuantity} {p.unit}
                        </span>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: 600,
                          color: p.stockQuantity === 0 ? 'var(--color-danger)' : 'var(--color-warning)',
                          display: 'block',
                        }}>
                          {p.stockQuantity === 0 ? 'Out of Stock' : `Min: ${p.minStockLevel}`}
                        </span>
                      </div>
                      <Button
                        variant="outlined"
                        size="sm"
                        onClick={() => navigate('/purchases')}
                      >
                        Order
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Recent Invoices */}
          <Card
            title="🧾 Recent Sales Activity"
            subtitle="Latest retail & contractor transactions"
            action={
              <Button
                variant="outlined"
                size="sm"
                icon={<ArrowRight size={14} />}
                iconPosition="right"
                onClick={() => navigate('/sales')}
              >
                Show All
              </Button>
            }
          >
            {recentSales.length === 0 ? (
              <p style={{ padding: '24px 0', textAlign: 'center', color: 'var(--color-neutral-500)', fontSize: '13px' }}>
                No recent sales. Launch billing to create the first invoice!
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {recentSales.map((sale) => (
                  <div
                    key={sale.id}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-lg)',
                      backgroundColor: 'var(--color-neutral-200)',
                      border: '1px solid var(--color-neutral-300)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--color-neutral-900)' }}>
                          {sale.customerName}
                        </span>
                        <Badge variant="primary" size="sm">
                          {sale.paymentMethod}
                        </Badge>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--color-neutral-500)', marginTop: '2px' }}>
                        {sale.invoiceNumber} • {sale.items.length} items
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '15px', fontWeight: 800, color: 'var(--color-primary-800)' }}>
                        ₹{sale.grandTotal.toLocaleString('en-IN')}
                      </span>
                      <button
                        onClick={() => setSelectedSaleForPrint(sale)}
                        title="Print / View Invoice"
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: 'var(--color-neutral-600)',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        <Printer size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      <InvoicePrintModal
        isOpen={!!selectedSaleForPrint}
        onClose={() => setSelectedSaleForPrint(null)}
        sale={selectedSaleForPrint}
      />
    </>
  );
};
