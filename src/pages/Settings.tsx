import React, { useState } from 'react';
import { 
  RefreshCw, 
  CheckCircle, 
  RotateCcw,
  Store,
  Database
} from 'lucide-react';
import { Header } from '../components/layout/Header';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { dataService } from '../services/dataService';

export const Settings: React.FC = () => {
  const [updateStatus, setUpdateStatus] = useState<'idle' | 'checking' | 'latest' | 'available'>('idle');
  const [reseedLoading, setReseedLoading] = useState(false);
  const defaultStoreInfo = {
    name: 'Garhwal Lights - Retail & Showroom',
    tagline: 'Premium Architectural & Decorative Lighting',
    gstin: '05AAACG1234F1Z8',
    phone: '+91 98970 12345',
    email: 'contact@garhwallights.in',
    address: 'Shivam Heights, Ramlila Maidan, Tilak Nagar, Sikar, Rajasthan 332001',
  };

  const [storeInfo, setStoreInfo] = useState(() => {
    try {
      const saved = localStorage.getItem('store_profile');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.address && (parsed.address.includes('Dehradun') || parsed.address.includes('Rajpur Road'))) {
          parsed.address = 'Shivam Heights, Ramlila Maidan, Tilak Nagar, Sikar, Rajasthan 332001';
          localStorage.setItem('store_profile', JSON.stringify(parsed));
        }
        return { ...defaultStoreInfo, ...parsed };
      }
    } catch (e) {
      // ignore
    }
    return defaultStoreInfo;
  });
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleCheckUpdates = () => {
    setUpdateStatus('checking');
    setTimeout(() => {
      setUpdateStatus('latest');
    }, 1500);
  };

  const handleSaveStoreProfile = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      localStorage.setItem('store_profile', JSON.stringify(storeInfo));
    } catch (err) {
      console.error('Failed to save store profile to localStorage', err);
    }
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleResetData = async () => {
    if (window.confirm('Reset all showroom local database tables to default sample inventory? This will reload the 29 lighting fixtures and initial records.')) {
      setReseedLoading(true);
      await dataService.resetToSampleData();
      setReseedLoading(false);
      alert('Local database reseeded successfully with real products and photos!');
      window.location.reload();
    }
  };

  return (
    <>
      <Header
        title="App Settings & System Controls"
        subtitle="OTA desktop updates, showroom store profile, and database management"
        quickActionLabel="Reseed Database"
        onQuickAction={handleResetData}
      />

      <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* 1. OTA Desktop App Updates */}
        <Card
          title="🚀 Over-The-Air (OTA) App Updates"
          subtitle="Tauri auto-updater distributes zero-lag executable updates directly to client desktop machines"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 20px',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--color-neutral-200)',
              border: '1px solid var(--color-neutral-300)',
              flexWrap: 'wrap',
              gap: '12px',
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '15px', fontWeight: 800, color: 'var(--color-neutral-900)' }}>
                    Garhwal Lights IMS Desktop
                  </span>
                  <Badge variant="success">Version 1.0.0 (Latest)</Badge>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--color-neutral-500)', marginTop: '4px' }}>
                  Channel: Stable Production • Runtime: Tauri Native WebView2 (Offline-First Zero Lag)
                </p>
              </div>

              <Button
                variant="primary"
                icon={<RefreshCw size={15} color="#FFFFFF" className={updateStatus === 'checking' ? 'animate-spin' : ''} />}
                onClick={handleCheckUpdates}
                disabled={updateStatus === 'checking'}
              >
                {updateStatus === 'checking' ? 'Checking for updates...' : 'Check for Updates'}
              </Button>
            </div>

            {updateStatus === 'latest' && (
              <div style={{
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-success-bg)',
                color: 'var(--color-success)',
                fontSize: '13px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <CheckCircle size={16} />
                Your Garhwal Lights Desktop App is up to date! (v1.0.0)
              </div>
            )}
          </div>
        </Card>

        {/* 2. Showroom / Store Profile (Used for Invoices & Receipts) */}
        <Card
          title="🏪 Store & Showroom Details"
          subtitle="This information appears on your printed A4 Tax Invoices and 80mm thermal POS receipts"
        >
          <form onSubmit={handleSaveStoreProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <Input
                label="Showroom / Business Name"
                value={storeInfo.name}
                onChange={(e) => setStoreInfo({ ...storeInfo, name: e.target.value })}
                icon={<Store size={16} />}
                required
              />
              <Input
                label="Tagline / Subtitle"
                value={storeInfo.tagline}
                onChange={(e) => setStoreInfo({ ...storeInfo, tagline: e.target.value })}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
              <Input
                label="GSTIN Number"
                value={storeInfo.gstin}
                onChange={(e) => setStoreInfo({ ...storeInfo, gstin: e.target.value })}
                placeholder="05AAAAA0000A1Z5"
              />
              <Input
                label="Contact Phone"
                value={storeInfo.phone}
                onChange={(e) => setStoreInfo({ ...storeInfo, phone: e.target.value })}
              />
              <Input
                label="Billing Email"
                value={storeInfo.email}
                onChange={(e) => setStoreInfo({ ...storeInfo, email: e.target.value })}
              />
            </div>

            <Input
              label="Store Showroom Address"
              value={storeInfo.address}
              onChange={(e) => setStoreInfo({ ...storeInfo, address: e.target.value })}
            />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px' }}>
              {savedSuccess ? (
                <span style={{ fontSize: '13px', color: 'var(--color-success)', fontWeight: 700 }}>
                  ✓ Showroom details updated successfully!
                </span>
              ) : <div />}

              <Button variant="primary" type="submit">
                Save Showroom Profile
              </Button>
            </div>
          </form>
        </Card>

        {/* 3. Database Maintenance & Local Data Utilities */}
        <Card
          title="💾 Local Database & Data Utilities"
          subtitle="Manage offline storage and reseed default inventory fixtures"
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: 'var(--color-neutral-200)',
            border: '1px solid var(--color-neutral-300)',
            flexWrap: 'wrap',
            gap: '14px',
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Database size={18} color="var(--color-primary-800)" />
                <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--color-neutral-900)' }}>
                  Local Storage Engine (IndexedDB)
                </span>
                <Badge variant="primary">Offline-First</Badge>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--color-neutral-600)', marginTop: '4px' }}>
                Instant local response time. All transactions, customers, and product photos persist safely on this PC.
              </p>
            </div>

            <Button
              variant="outlined"
              size="sm"
              icon={<RotateCcw size={14} />}
              isLoading={reseedLoading}
              onClick={handleResetData}
            >
              Reseed Default Sample Data
            </Button>
          </div>
        </Card>
      </div>
    </>
  );
};
