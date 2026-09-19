import React, { useState, useEffect, useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  TrendingUp, 
  TrendingDown, 
  ShoppingBag, 
  Receipt, 
  DollarSign, 
  Package, 
  ArrowUpRight, 
  ArrowDownRight 
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { dataService } from '../../services/dataService';
import type { Sale, Expense, Purchase, StockMovement } from '../../types';

interface BusinessCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface DayFinancials {
  dateStr: string; // YYYY-MM-DD
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  sales: Sale[];
  expenses: Expense[];
  purchases: Purchase[];
  movements: StockMovement[];
  totalRevenue: number;
  totalCogs: number;
  grossMargin: number;
  totalExpenses: number;
  netProfit: number;
  hasActivity: boolean;
}

export const BusinessCalendarModal: React.FC<BusinessCalendarModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [selectedDay, setSelectedDay] = useState<DayFinancials | null>(null);

  // Load all business transactions from IndexedDB
  const loadTransactions = async () => {
    try {
      const [allSales, allExpenses, allPurchases, allMovements] = await Promise.all([
        dataService.getSales(),
        dataService.getExpenses(),
        dataService.getPurchases(),
        dataService.getStockMovements(),
      ]);
      setSales(allSales);
      setExpenses(allExpenses);
      setPurchases(allPurchases);
      setMovements(allMovements);
    } catch (err) {
      console.error('Failed to load calendar transactions:', err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadTransactions();
    }
  }, [isOpen]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  const monthName = currentDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleGoToToday = () => {
    setCurrentDate(new Date());
  };

  // Helper to format currency
  const formatINR = (amount: number) => {
    const rounded = Math.round(amount);
    return `₹${rounded.toLocaleString('en-IN')}`;
  };

  // Build calendar matrix
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sun
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDaysCount = new Date(year, month, 0).getDate();

    const todayStr = new Date().toISOString().split('T')[0];

    // Map sales by YYYY-MM-DD
    const salesByDate: Record<string, Sale[]> = {};
    for (const s of sales) {
      const d = s.createdAt.split('T')[0];
      if (!salesByDate[d]) salesByDate[d] = [];
      salesByDate[d].push(s);
    }

    // Map expenses by YYYY-MM-DD
    const expensesByDate: Record<string, Expense[]> = {};
    for (const e of expenses) {
      const d = e.date ? e.date.split('T')[0] : e.createdAt.split('T')[0];
      if (!expensesByDate[d]) expensesByDate[d] = [];
      expensesByDate[d].push(e);
    }

    // Map purchases by YYYY-MM-DD
    const purchasesByDate: Record<string, Purchase[]> = {};
    for (const p of purchases) {
      const d = p.orderDate ? p.orderDate.split('T')[0] : p.createdAt.split('T')[0];
      if (!purchasesByDate[d]) purchasesByDate[d] = [];
      purchasesByDate[d].push(p);
    }

    // Map movements by YYYY-MM-DD
    const movementsByDate: Record<string, StockMovement[]> = {};
    for (const m of movements) {
      const d = m.date.split('T')[0];
      if (!movementsByDate[d]) movementsByDate[d] = [];
      movementsByDate[d].push(m);
    }

    const computeDay = (y: number, m: number, day: number, isCurrent: boolean): DayFinancials => {
      const mm = String(m + 1).padStart(2, '0');
      const dd = String(day).padStart(2, '0');
      const dateStr = `${y}-${mm}-${dd}`;

      const daySales = salesByDate[dateStr] || [];
      const dayExpenses = expensesByDate[dateStr] || [];
      const dayPurchases = purchasesByDate[dateStr] || [];
      const dayMovements = movementsByDate[dateStr] || [];

      let totalRevenue = 0;
      let totalCogs = 0;
      let grossMargin = 0;

      for (const s of daySales) {
        totalRevenue += s.grandTotal;
        for (const item of s.items) {
          const cost = item.costPrice * item.quantity;
          totalCogs += cost;
          grossMargin += (item.unitPrice - item.costPrice) * item.quantity;
        }
      }

      const totalExpenses = dayExpenses.reduce((sum, e) => sum + e.amount, 0);
      const netProfit = grossMargin - totalExpenses;
      const hasActivity = daySales.length > 0 || dayExpenses.length > 0 || dayPurchases.length > 0 || dayMovements.length > 0;

      return {
        dateStr,
        dayNumber: day,
        isCurrentMonth: isCurrent,
        isToday: dateStr === todayStr,
        sales: daySales,
        expenses: dayExpenses,
        purchases: dayPurchases,
        movements: dayMovements,
        totalRevenue,
        totalCogs,
        grossMargin,
        totalExpenses,
        netProfit,
        hasActivity,
      };
    };

    const days: DayFinancials[] = [];

    // 1. Previous month trailing days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const prevDay = prevMonthDaysCount - i;
      const prevM = month === 0 ? 11 : month - 1;
      const prevY = month === 0 ? year - 1 : year;
      days.push(computeDay(prevY, prevM, prevDay, false));
    }

    // 2. Current month days
    for (let d = 1; d <= totalDaysInMonth; d++) {
      days.push(computeDay(year, month, d, true));
    }

    // 3. Next month leading days (fill grid to 35 or 42 cells)
    const remainingCells = (7 - (days.length % 7)) % 7;
    for (let nextD = 1; nextD <= remainingCells; nextD++) {
      const nextM = month === 11 ? 0 : month + 1;
      const nextY = month === 11 ? year + 1 : year;
      days.push(computeDay(nextY, nextM, nextD, false));
    }

    return days;
  }, [year, month, sales, expenses, purchases, movements]);

  // Calculate Month Total Profit
  const monthTotals = useMemo(() => {
    let profit = 0;
    let revenue = 0;
    let totalExp = 0;
    for (const d of calendarDays) {
      if (d.isCurrentMonth) {
        profit += d.netProfit;
        revenue += d.totalRevenue;
        totalExp += d.totalExpenses;
      }
    }
    return { profit, revenue, totalExp };
  }, [calendarDays]);

  const weekDayHeaders = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Business Financial Calendar"
        subtitle={`Daily net profit tracker and transaction breakdown for ${monthName}`}
        maxWidth="1020px"
        footer={
          <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '13px', color: 'var(--color-neutral-600)' }}>
                Month Performance:
              </span>
              <span style={{
                fontSize: '14px',
                fontWeight: 800,
                color: monthTotals.profit >= 0 ? 'var(--color-primary-800)' : 'var(--color-danger)',
              }}>
                Net Profit: {formatINR(monthTotals.profit)}
              </span>
              <span style={{ color: 'var(--color-neutral-400)' }}>•</span>
              <span style={{ fontSize: '12px', color: 'var(--color-neutral-600)' }}>
                Revenue: {formatINR(monthTotals.revenue)}
              </span>
            </div>

            <Button variant="outlined" onClick={onClose} type="button">
              Close Calendar
            </Button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Calendar Header Controls */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: 'var(--color-neutral-100)',
            border: '1px solid var(--color-neutral-300)',
            flexWrap: 'wrap',
            gap: '12px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-primary-50)',
                color: 'var(--color-primary-800)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <CalendarIcon size={20} />
              </div>

              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-neutral-900)', lineHeight: 1.2 }}>
                  {monthName}
                </h2>
                <p style={{ fontSize: '12px', color: 'var(--color-neutral-500)' }}>
                  Click any date to view sales, POs, expenses & receipts
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                onClick={handlePrevMonth}
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-neutral-300)',
                  backgroundColor: '#FFFFFF',
                  color: 'var(--color-neutral-800)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s ease',
                }}
                title="Previous Month"
              >
                <ChevronLeft size={18} />
              </button>

              <Button variant="secondary" size="sm" onClick={handleGoToToday} type="button">
                Today
              </Button>

              <button
                type="button"
                onClick={handleNextMonth}
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-neutral-300)',
                  backgroundColor: '#FFFFFF',
                  color: 'var(--color-neutral-800)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s ease',
                }}
                title="Next Month"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          {/* 7-Day Calendar Grid (as requested in screenshot) */}
          <div style={{
            border: '1px solid var(--color-neutral-300)',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            backgroundColor: '#FFFFFF',
            boxShadow: 'var(--shadow-sm)',
          }}>
            {/* Weekday Headers */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              borderBottom: '1.5px solid var(--color-neutral-300)',
              backgroundColor: 'var(--color-neutral-200)',
            }}>
              {weekDayHeaders.map((day, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '10px 8px',
                    textAlign: 'center',
                    fontSize: '12px',
                    fontWeight: 800,
                    color: idx === 0 ? 'var(--color-danger)' : 'var(--color-neutral-800)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Grid Days */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              backgroundColor: 'var(--color-neutral-300)',
              gap: '1px',
            }}>
              {calendarDays.map((dayData, idx) => {
                const isSelected = selectedDay?.dateStr === dayData.dateStr;
                const hasProfit = dayData.netProfit > 0;
                const hasLoss = dayData.netProfit < 0;

                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedDay(dayData)}
                    style={{
                      minHeight: '86px',
                      padding: '8px',
                      backgroundColor: dayData.isToday
                        ? 'var(--color-primary-50)'
                        : dayData.isCurrentMonth
                        ? '#FFFFFF'
                        : 'var(--color-neutral-100)',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      transition: 'background-color 0.12s ease, transform 0.12s ease',
                      outline: isSelected ? '2px solid var(--color-primary-800)' : 'none',
                      position: 'relative',
                    }}
                    onMouseEnter={(e) => {
                      if (!dayData.isToday) {
                        e.currentTarget.style.backgroundColor = 'var(--color-neutral-200)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = dayData.isToday
                        ? 'var(--color-primary-50)'
                        : dayData.isCurrentMonth
                        ? '#FFFFFF'
                        : 'var(--color-neutral-100)';
                    }}
                  >
                    {/* Top Row: Date Number & Today Indicator */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      {dayData.isToday ? (
                        <span style={{
                          fontSize: '10px',
                          fontWeight: 800,
                          backgroundColor: 'var(--color-primary-800)',
                          color: '#FFFFFF',
                          padding: '1px 6px',
                          borderRadius: '4px',
                        }}>
                          Today
                        </span>
                      ) : <span />}

                      <span style={{
                        fontSize: '13px',
                        fontWeight: dayData.isToday ? 900 : 700,
                        color: dayData.isCurrentMonth
                          ? (dayData.isToday ? 'var(--color-primary-800)' : 'var(--color-neutral-900)')
                          : 'var(--color-neutral-400)',
                      }}>
                        {dayData.dayNumber}
                      </span>
                    </div>

                    {/* Middle: PROFIT ONLY (As user requested) */}
                    <div style={{ marginTop: 'auto', marginBottom: 'auto', textAlign: 'center', padding: '4px 0' }}>
                      {dayData.hasActivity ? (
                        <div style={{
                          display: 'inline-flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          backgroundColor: hasProfit
                            ? 'var(--color-success-bg)'
                            : hasLoss
                            ? 'var(--color-danger-bg)'
                            : 'var(--color-neutral-250)',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                        }}>
                          <span style={{
                            fontSize: '9px',
                            fontWeight: 700,
                            color: hasProfit
                              ? 'var(--color-success)'
                              : hasLoss
                              ? 'var(--color-danger)'
                              : 'var(--color-neutral-600)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.02em',
                          }}>
                            {hasProfit ? 'Profit' : hasLoss ? 'Loss' : 'Net'}
                          </span>
                          <span style={{
                            fontSize: '12px',
                            fontWeight: 900,
                            color: hasProfit
                              ? '#15803d'
                              : hasLoss
                              ? '#b91c1c'
                              : 'var(--color-neutral-800)',
                          }}>
                            {hasProfit ? `+${formatINR(dayData.netProfit)}` : formatINR(dayData.netProfit)}
                          </span>
                        </div>
                      ) : (
                        <div style={{ height: '24px' }} />
                      )}
                    </div>

                    {/* Bottom: Mini activity indicator dots */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', height: '12px' }}>
                      {dayData.sales.length > 0 && (
                        <span
                          style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: 'var(--color-primary-800)' }}
                          title={`${dayData.sales.length} sale(s)`}
                        />
                      )}
                      {dayData.expenses.length > 0 && (
                        <span
                          style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: 'var(--color-danger)' }}
                          title={`${dayData.expenses.length} expense(s)`}
                        />
                      )}
                      {dayData.purchases.length > 0 && (
                        <span
                          style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: 'var(--color-info)' }}
                          title={`${dayData.purchases.length} purchase(s)`}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Modal>

      {/* Day Details Modal (Opens when user clicks on a particular day/date) */}
      {selectedDay && (
        <DayDetailModal
          isOpen={!!selectedDay}
          onClose={() => setSelectedDay(null)}
          dayData={selectedDay}
          formatINR={formatINR}
        />
      )}
    </>
  );
};

/* Day Detail Modal: Showing complete details of purchases, sales, expenses, and profit */
interface DayDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  dayData: DayFinancials;
  formatINR: (val: number) => string;
}

const DayDetailModal: React.FC<DayDetailModalProps> = ({
  isOpen,
  onClose,
  dayData,
  formatINR,
}) => {
  const [activeTab, setActiveTab] = useState<'sales' | 'expenses' | 'purchases' | 'movements'>('sales');

  const formattedDate = new Date(`${dayData.dateStr}T12:00:00`).toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${formattedDate}`}
      subtitle="Complete business activity: sales, purchases, expenses & daily net margin"
      maxWidth="780px"
      footer={
        <Button variant="primary" onClick={onClose} type="button">
          Done
        </Button>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Top 4 Financial Summary Stat Cards for this day */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
          {/* Sales Revenue */}
          <div style={{
            padding: '14px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: '#FFFFFF',
            border: '1px solid var(--color-neutral-300)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--color-neutral-500)', marginBottom: '4px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>Sales Revenue</span>
              <Receipt size={14} color="var(--color-primary-800)" />
            </div>
            <div style={{ fontSize: '16px', fontWeight: 900, color: 'var(--color-neutral-900)' }}>
              {formatINR(dayData.totalRevenue)}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-neutral-500)', marginTop: '2px' }}>
              {dayData.sales.length} invoice(s)
            </div>
          </div>

          {/* Gross Margin */}
          <div style={{
            padding: '14px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: '#FFFFFF',
            border: '1px solid var(--color-neutral-300)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--color-neutral-500)', marginBottom: '4px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>Gross Margin</span>
              <TrendingUp size={14} color="#16a34a" />
            </div>
            <div style={{ fontSize: '16px', fontWeight: 900, color: '#16a34a' }}>
              {formatINR(dayData.grossMargin)}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-neutral-500)', marginTop: '2px' }}>
              Revenue - COGS
            </div>
          </div>

          {/* Showroom Expenses */}
          <div style={{
            padding: '14px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: '#FFFFFF',
            border: '1px solid var(--color-neutral-300)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--color-neutral-500)', marginBottom: '4px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>Expenses</span>
              <TrendingDown size={14} color="var(--color-danger)" />
            </div>
            <div style={{ fontSize: '16px', fontWeight: 900, color: 'var(--color-danger)' }}>
              {formatINR(dayData.totalExpenses)}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-neutral-500)', marginTop: '2px' }}>
              {dayData.expenses.length} expense(s)
            </div>
          </div>

          {/* Daily Net Profit */}
          <div style={{
            padding: '14px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: dayData.netProfit >= 0 ? 'var(--color-primary-50)' : 'var(--color-danger-bg)',
            border: `1px solid ${dayData.netProfit >= 0 ? 'var(--color-primary-300)' : '#fca5a5'}`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--color-neutral-500)', marginBottom: '4px' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: dayData.netProfit >= 0 ? 'var(--color-primary-900)' : '#991b1b' }}>
                Net Profit
              </span>
              <DollarSign size={15} color={dayData.netProfit >= 0 ? 'var(--color-primary-800)' : '#dc2626'} />
            </div>
            <div style={{
              fontSize: '18px',
              fontWeight: 900,
              color: dayData.netProfit >= 0 ? 'var(--color-primary-900)' : '#991b1b',
            }}>
              {formatINR(dayData.netProfit)}
            </div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: dayData.netProfit >= 0 ? 'var(--color-primary-700)' : '#b91c1c', marginTop: '2px' }}>
              {dayData.netProfit >= 0 ? '✓ Profitable Day' : '⚠ Loss / High Expenses'}
            </div>
          </div>
        </div>

        {/* Navigation Tabs for detailed breakdown */}
        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--color-neutral-300)', paddingBottom: '8px' }}>
          <button
            type="button"
            onClick={() => setActiveTab('sales')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '9999px',
              border: 'none',
              backgroundColor: activeTab === 'sales' ? 'var(--color-primary-800)' : 'transparent',
              color: activeTab === 'sales' ? '#FFFFFF' : 'var(--color-neutral-700)',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <Receipt size={14} />
            Sales Invoices ({dayData.sales.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('expenses')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '9999px',
              border: 'none',
              backgroundColor: activeTab === 'expenses' ? 'var(--color-primary-800)' : 'transparent',
              color: activeTab === 'expenses' ? '#FFFFFF' : 'var(--color-neutral-700)',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <DollarSign size={14} />
            Expenses ({dayData.expenses.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('purchases')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '9999px',
              border: 'none',
              backgroundColor: activeTab === 'purchases' ? 'var(--color-primary-800)' : 'transparent',
              color: activeTab === 'purchases' ? '#FFFFFF' : 'var(--color-neutral-700)',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <ShoppingBag size={14} />
            Purchases / POs ({dayData.purchases.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('movements')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '9999px',
              border: 'none',
              backgroundColor: activeTab === 'movements' ? 'var(--color-primary-800)' : 'transparent',
              color: activeTab === 'movements' ? '#FFFFFF' : 'var(--color-neutral-700)',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <Package size={14} />
            Stock Audit ({dayData.movements.length})
          </button>
        </div>

        {/* Tab Content 1: Sales Invoices */}
        {activeTab === 'sales' && (
          <div>
            {dayData.sales.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px', color: 'var(--color-neutral-500)', fontSize: '13px' }}>
                No invoices billed on this date.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {dayData.sales.map((sale) => (
                  <div
                    key={sale.id}
                    style={{
                      padding: '12px 16px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: '#FFFFFF',
                      border: '1px solid var(--color-neutral-300)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--color-neutral-900)' }}>
                          {sale.invoiceNumber}
                        </span>
                        <span style={{
                          fontSize: '11px',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          backgroundColor: 'var(--color-primary-50)',
                          color: 'var(--color-primary-800)',
                          fontWeight: 700,
                        }}>
                          {sale.paymentMethod}
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--color-neutral-600)', marginTop: '2px' }}>
                        Customer: <strong>{sale.customerName}</strong> • {sale.items.length} product(s)
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--color-primary-900)' }}>
                        {formatINR(sale.grandTotal)}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--color-neutral-500)' }}>
                        Tax: {formatINR(sale.taxAmount)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab Content 2: Showroom Expenses */}
        {activeTab === 'expenses' && (
          <div>
            {dayData.expenses.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px', color: 'var(--color-neutral-500)', fontSize: '13px' }}>
                No operational expenses recorded on this date.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {dayData.expenses.map((exp) => (
                  <div
                    key={exp.id}
                    style={{
                      padding: '12px 16px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: '#FFFFFF',
                      border: '1px solid var(--color-neutral-300)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-neutral-900)' }}>
                        {exp.title}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--color-neutral-500)', marginTop: '2px' }}>
                        Category: {exp.category} • Paid to: {exp.paidTo || 'N/A'} ({exp.paymentMethod})
                      </div>
                    </div>

                    <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--color-danger)' }}>
                      -{formatINR(exp.amount)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab Content 3: Purchases & POs */}
        {activeTab === 'purchases' && (
          <div>
            {dayData.purchases.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px', color: 'var(--color-neutral-500)', fontSize: '13px' }}>
                No purchase orders placed on this date.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {dayData.purchases.map((po) => (
                  <div
                    key={po.id}
                    style={{
                      padding: '12px 16px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: '#FFFFFF',
                      border: '1px solid var(--color-neutral-300)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--color-neutral-900)' }}>
                        {po.poNumber} • {po.supplierName}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--color-neutral-500)', marginTop: '2px' }}>
                        Status: <strong>{po.status}</strong> • {po.items.length} item(s) ordered
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--color-neutral-900)' }}>
                        {formatINR(po.totalAmount)}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--color-neutral-500)' }}>
                        Payment: {po.paymentStatus}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab Content 4: Stock Audit Trail */}
        {activeTab === 'movements' && (
          <div>
            {dayData.movements.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px', color: 'var(--color-neutral-500)', fontSize: '13px' }}>
                No inventory quantity adjustments recorded on this date.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {dayData.movements.map((mov) => (
                  <div
                    key={mov.id}
                    style={{
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: '#FFFFFF',
                      border: '1px solid var(--color-neutral-300)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-neutral-900)' }}>
                        {mov.productName}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--color-neutral-500)', marginTop: '2px' }}>
                        Reason: {mov.reason} {mov.referenceId ? `(${mov.referenceId})` : ''}
                      </div>
                    </div>

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '13px',
                      fontWeight: 800,
                      color: mov.type === 'IN' ? 'var(--color-success)' : 'var(--color-danger)',
                    }}>
                      {mov.type === 'IN' ? <ArrowDownRight size={15} /> : <ArrowUpRight size={15} />}
                      {mov.type === 'IN' ? `+${mov.quantity}` : `-${mov.quantity}`} pcs
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};
