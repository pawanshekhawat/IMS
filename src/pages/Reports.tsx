import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  Award 
} from 'lucide-react';
import { Header } from '../components/layout/Header';
import { Card } from '../components/ui/Card';
import { StatCard } from '../components/ui/StatCard';
import { dataService } from '../services/dataService';
import type { Product, Sale, Expense } from '../types';

export const Reports: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  useEffect(() => {
    const load = async () => {
      const [s, p, e] = await Promise.all([
        dataService.getSales(),
        dataService.getProducts(),
        dataService.getExpenses(),
      ]);
      setSales(s);
      setProducts(p);
      setExpenses(e);
    };
    load();
  }, []);

  const totalRevenue = sales.reduce((sum, s) => sum + s.grandTotal, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  // Compute Cost of Goods Sold (COGS)
  let totalCOGS = 0;
  sales.forEach(sale => {
    sale.items.forEach(item => {
      totalCOGS += (item.costPrice || 0) * item.quantity;
    });
  });

  const grossProfit = totalRevenue - totalCOGS;
  const netProfit = grossProfit - totalExpenses;
  const grossMargin = totalRevenue > 0 ? Math.round((grossProfit / totalRevenue) * 100) : 0;

  // Category Breakdown
  const categoryMap: { [cat: string]: { count: number; value: number } } = {};
  products.forEach(p => {
    if (!categoryMap[p.category]) categoryMap[p.category] = { count: 0, value: 0 };
    categoryMap[p.category].count += p.stockQuantity;
    categoryMap[p.category].value += p.costPrice * p.stockQuantity;
  });

  // Top Selling Items
  const productSalesCount: { [id: string]: { name: string; qty: number; revenue: number } } = {};
  sales.forEach(s => {
    s.items.forEach(i => {
      if (!productSalesCount[i.productId]) {
        productSalesCount[i.productId] = { name: i.productName, qty: 0, revenue: 0 };
      }
      productSalesCount[i.productId].qty += i.quantity;
      productSalesCount[i.productId].revenue += i.total;
    });
  });

  const topSellers = Object.values(productSalesCount).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

  const handleExportCSV = () => {
    const headers = ['Invoice No', 'Date', 'Customer', 'Items Count', 'Grand Total', 'Payment Mode'];
    const rows = sales.map(s => [
      s.invoiceNumber,
      s.createdAt.split('T')[0],
      `"${s.customerName}"`,
      s.items.length,
      s.grandTotal,
      s.paymentMethod,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Garhwal_Lights_Sales_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <Header
        title="Business Reports & Analytics"
        subtitle="Gross margin, category valuation, top selling lighting fixtures, and CSV export"
        quickActionLabel="Export Sales CSV"
        onQuickAction={handleExportCSV}
      />

      <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Top Financial Health Tiles */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '18px',
        }}>
          <StatCard
            label="Gross Showroom Revenue"
            value={`₹${totalRevenue.toLocaleString('en-IN')}`}
            subtext={`${sales.length} total invoices billed`}
            icon={<TrendingUp size={20} />}
            variant="primary"
          />
          <StatCard
            label="Cost of Goods Sold (COGS)"
            value={`₹${totalCOGS.toLocaleString('en-IN')}`}
            subtext="Wholesale purchase base cost"
            icon={<DollarSign size={20} />}
            variant="neutral"
          />
          <StatCard
            label="Gross Trading Margin"
            value={`${grossMargin}%`}
            subtext={`Gross Profit: ₹${grossProfit.toLocaleString('en-IN')}`}
            icon={<Award size={20} />}
            variant="secondary"
          />
          <StatCard
            label="Net Operating Profit"
            value={`₹${netProfit.toLocaleString('en-IN')}`}
            subtext={`After ₹${totalExpenses.toLocaleString('en-IN')} overheads`}
            icon={<BarChart3 size={20} />}
            variant={netProfit >= 0 ? 'secondary' : 'danger'}
          />
        </div>

        {/* 2 Column Visual Breakdown */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '24px' }}>
          {/* Category Inventory Breakdown */}
          <Card
            title="Lighting Category Stock Valuation"
            subtitle="Capital invested across display categories"
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {Object.entries(categoryMap).map(([cat, info]) => {
                const totalVal = Object.values(categoryMap).reduce((s, c) => s + c.value, 0) || 1;
                const pct = Math.round((info.value / totalVal) * 100);
                return (
                  <div key={cat} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                      <span style={{ fontWeight: 700, color: 'var(--color-neutral-900)' }}>{cat}</span>
                      <span style={{ color: 'var(--color-neutral-600)' }}>
                        ₹{info.value.toLocaleString('en-IN')} ({pct}%) • {info.count} units
                      </span>
                    </div>
                    {/* Progress bar */}
                    <div style={{
                      width: '100%',
                      height: '8px',
                      borderRadius: '9999px',
                      backgroundColor: 'var(--color-neutral-250)',
                      overflow: 'hidden',
                    }}>
                      <div style={{
                        width: `${pct}%`,
                        height: '100%',
                        backgroundColor: 'var(--color-primary-800)',
                        borderRadius: '9999px',
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Top Selling Fixtures */}
          <Card
            title="🏆 Best Selling Lighting Fixtures"
            subtitle="Ranked by total revenue generated"
          >
            {topSellers.length === 0 ? (
              <p style={{ padding: '24px 0', textAlign: 'center', color: 'var(--color-neutral-500)', fontSize: '13px' }}>
                No sales data yet.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {topSellers.map((item, index) => (
                  <div
                    key={index}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-lg)',
                      backgroundColor: 'var(--color-neutral-200)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '50%',
                        backgroundColor: index === 0 ? 'var(--color-tertiary-500)' : 'var(--color-neutral-300)',
                        color: index === 0 ? 'var(--color-primary-900)' : 'var(--color-neutral-700)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '12px',
                      }}>
                        {index + 1}
                      </span>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-neutral-900)' }}>
                          {item.name}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--color-neutral-500)' }}>
                          {item.qty} units sold
                        </div>
                      </div>
                    </div>

                    <span style={{ fontWeight: 800, color: 'var(--color-primary-800)', fontSize: '14px' }}>
                      ₹{item.revenue.toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </>
  );
};
