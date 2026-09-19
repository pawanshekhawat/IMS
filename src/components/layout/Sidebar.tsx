import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Receipt,
  Users,
  ShoppingBag,
  Truck,
  Warehouse,
  ReceiptText,
  BarChart3,
  Settings,
  Sparkles,
} from 'lucide-react';

interface SidebarProps {
  onNewSaleClick?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onNewSaleClick }) => {
  const navItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'Products', path: '/products', icon: Package },
    { 
      label: 'Billing & Sales', 
      path: '/sales', 
      icon: Receipt,
      badge: 'New Sale'
    },
    { label: 'Customers', path: '/customers', icon: Users },
    { label: 'Purchases', path: '/purchases', icon: ShoppingBag },
    { label: 'Suppliers', path: '/suppliers', icon: Truck },
    { label: 'Inventory', path: '/inventory', icon: Warehouse },
    { label: 'Expenses', path: '/expenses', icon: ReceiptText },
    { label: 'Reports', path: '/reports', icon: BarChart3 },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <aside
      style={{
        width: '260px',
        minWidth: '260px',
        maxWidth: '260px',
        flexShrink: 0,
        height: '100vh',
        backgroundColor: '#FFFFFF',
        borderRight: '1px solid var(--color-neutral-300)',
        display: 'flex',
        flexDirection: 'column',
        userSelect: 'none',
        zIndex: 10,
      }}
    >
      {/* Brand Header */}
      <div
        style={{
          padding: '24px 20px 20px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          borderBottom: '1px solid var(--color-neutral-250)',
        }}
      >
        <div
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            backgroundColor: 'var(--color-primary-800)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            boxShadow: '0 4px 10px rgba(6, 77, 61, 0.2)',
            flexShrink: 0,
          }}
        >
          <Sparkles size={22} color="var(--color-tertiary-500)" />
        </div>
        <div>
          <h1
            style={{
              fontSize: '16px',
              fontWeight: 800,
              color: 'var(--color-neutral-900)',
              lineHeight: 1.2,
            }}
          >
            Garhwal Lights
          </h1>
          <p
            style={{
              fontSize: '12px',
              fontWeight: 500,
              color: 'var(--color-neutral-500)',
            }}
          >
            Retail & Showroom
          </p>
        </div>
      </div>

      {/* Navigation List */}
      <nav
        style={{
          flex: 1,
          padding: '18px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          overflowY: 'auto',
        }}
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '11px 16px',
                borderRadius: '9999px', // pill shape as per design
                textDecoration: 'none',
                backgroundColor: isActive ? 'var(--color-primary-800)' : 'transparent',
                color: isActive ? '#FFFFFF' : 'var(--color-neutral-700)',
                fontWeight: isActive ? 700 : 600,
                fontSize: '14px',
                transition: 'all var(--transition-fast)',
              })}
              onMouseEnter={(e) => {
                if (!e.currentTarget.classList.contains('active')) {
                  e.currentTarget.style.backgroundColor = 'var(--color-neutral-200)';
                }
              }}
              onMouseLeave={(e) => {
                if (!e.currentTarget.classList.contains('active')) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              {({ isActive }) => (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Icon
                      size={19}
                      color={isActive ? '#FFFFFF' : 'var(--color-neutral-600)'}
                      strokeWidth={isActive ? 2.3 : 1.9}
                    />
                    <span
                      style={{
                        color: isActive ? '#FFFFFF' : 'var(--color-neutral-800)',
                        fontWeight: isActive ? 700 : 600,
                        letterSpacing: '-0.01em',
                      }}
                    >
                      {item.label}
                    </span>
                  </div>

                  {item.badge && (
                    <span
                      onClick={(e) => {
                        if (onNewSaleClick) {
                          e.preventDefault();
                          onNewSaleClick();
                        }
                      }}
                      style={{
                        backgroundColor: 'var(--color-tertiary-500)',
                        color: 'var(--color-primary-900)',
                        fontSize: '11px',
                        fontWeight: 800,
                        padding: '3px 9px',
                        borderRadius: '9999px',
                        letterSpacing: '0.02em',
                        lineHeight: 1,
                        boxShadow: '0 2px 6px rgba(132, 204, 22, 0.4)',
                        cursor: 'pointer',
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Database Mode Status */}
      <div
        style={{
          padding: '16px 20px',
          borderTop: '1px solid var(--color-neutral-250)',
          backgroundColor: 'var(--color-neutral-100)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-success)',
              boxShadow: '0 0 8px rgba(22, 163, 74, 0.6)',
            }}
          />
          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-neutral-700)' }}>
            Local Storage
          </span>
          <span
            style={{
              marginLeft: 'auto',
              fontSize: '10px',
              fontWeight: 700,
              backgroundColor: 'var(--color-neutral-250)',
              color: 'var(--color-neutral-600)',
              padding: '2px 6px',
              borderRadius: '4px',
            }}
          >
            Offline
          </span>
        </div>
        <p style={{ fontSize: '11px', color: 'var(--color-neutral-500)', marginTop: '4px' }}>
          Supabase Sync Ready
        </p>
      </div>
    </aside>
  );
};
