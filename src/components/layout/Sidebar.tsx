import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
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
  LogOut,
  UserCheck,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { updateService } from '../../services/updateService';

interface SidebarProps {
  onNewSaleClick?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onNewSaleClick: _onNewSaleClick }) => {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();

  const allNavItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard, roles: ['admin'] },
    { 
      label: 'Billing & Sales', 
      path: '/sales', 
      icon: Receipt,
      roles: ['admin', 'staff']
    },
    { label: 'Products', path: '/products', icon: Package, roles: ['admin', 'staff'] },
    { label: 'Customers', path: '/customers', icon: Users, roles: ['admin', 'staff'] },
    { label: 'Inventory', path: '/inventory', icon: Warehouse, roles: ['admin', 'staff'] },
    { label: 'Purchases', path: '/purchases', icon: ShoppingBag, roles: ['admin'] },
    { label: 'Suppliers', path: '/suppliers', icon: Truck, roles: ['admin'] },
    { label: 'Expenses', path: '/expenses', icon: ReceiptText, roles: ['admin'] },
    { label: 'Reports', path: '/reports', icon: BarChart3, roles: ['admin'] },
    { label: 'App Updates', path: '/updates', icon: RefreshCw, roles: ['admin', 'staff'] },
    { label: 'Settings', path: '/settings', icon: Settings, roles: ['admin'] },
  ];

  const currentRole = role || 'staff';
  const navItems = allNavItems.filter(item => item.roles.includes(currentRole));

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

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
          padding: '0 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderBottom: '1px solid var(--color-neutral-250)',
          minHeight: '72px',
          height: '72px',
          boxSizing: 'border-box',
        }}
      >
        <img
          src="/garhwal-lights-logo-landscape-trns.png"
          alt="Garhwal Lights"
          style={{
            maxWidth: '100%',
            height: '70px',
            maxHeight: '70px',
            objectFit: 'contain',
            filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.05))',
          }}
        />
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
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* App Version & Quick Update Shortcut */}
      <div style={{ padding: '0 12px 10px' }}>
        <button
          type="button"
          onClick={() => navigate('/updates')}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '7px 10px',
            backgroundColor: 'var(--color-neutral-150, #F3F4F6)',
            border: '1px solid var(--color-neutral-300, #E5E7EB)',
            borderRadius: 'var(--radius-md, 8px)',
            fontSize: '11px',
            fontWeight: 600,
            color: 'var(--color-neutral-700)',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#ECFDF5';
            e.currentTarget.style.borderColor = '#A7F3D0';
            e.currentTarget.style.color = '#065F46';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--color-neutral-150, #F3F4F6)';
            e.currentTarget.style.borderColor = 'var(--color-neutral-300, #E5E7EB)';
            e.currentTarget.style.color = 'var(--color-neutral-700)';
          }}
          title="Click to check for software updates"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <RefreshCw size={12} color="var(--color-primary-600)" />
            <span>v{updateService.getCurrentVersion()}</span>
          </div>
          <span style={{ fontSize: '10px', color: 'var(--color-primary-700)', fontWeight: 700 }}>
            Update App →
          </span>
        </button>
      </div>

      {/* Current User & Logout */}
      <div
        style={{
          padding: '14px 18px',
          borderTop: '1px solid var(--color-neutral-250)',
          backgroundColor: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: currentRole === 'admin' ? 'var(--color-primary-100)' : 'var(--color-neutral-200)',
              color: currentRole === 'admin' ? 'var(--color-primary-800)' : 'var(--color-neutral-700)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <UserCheck size={16} />
          </div>
          <div style={{ minWidth: 0, overflow: 'hidden' }}>
            <div style={{
              fontSize: '13px',
              fontWeight: 700,
              color: 'var(--color-neutral-900)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {user?.displayName || (currentRole === 'admin' ? 'Admin' : 'Staff')}
            </div>
            <div style={{
              fontSize: '11px',
              fontWeight: 600,
              color: currentRole === 'admin' ? 'var(--color-primary-700)' : 'var(--color-neutral-500)',
              textTransform: 'capitalize',
            }}>
              {currentRole === 'admin' ? 'Admin' : 'Staff'}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            padding: '6px 10px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-neutral-300)',
            backgroundColor: 'var(--color-neutral-100)',
            color: 'var(--color-neutral-700)',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--color-danger-bg)';
            e.currentTarget.style.borderColor = '#fca5a5';
            e.currentTarget.style.color = 'var(--color-danger)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--color-neutral-100)';
            e.currentTarget.style.borderColor = 'var(--color-neutral-300)';
            e.currentTarget.style.color = 'var(--color-neutral-700)';
          }}
          title="Logout from this account"
        >
          <LogOut size={14} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};
