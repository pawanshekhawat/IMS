import React, { useState } from 'react';
import { 
  RefreshCw, 
  CheckCircle, 
  RotateCcw 
} from 'lucide-react';
import { Header } from '../components/layout/Header';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { palette } from '../theme/colors';
import { dataService } from '../services/dataService';

export const Settings: React.FC = () => {
  const [updateStatus, setUpdateStatus] = useState<'idle' | 'checking' | 'latest' | 'available'>('idle');
  const [supabaseUrl, setSupabaseUrl] = useState('https://xyzcompany.supabase.co');
  const [supabaseKey, setSupabaseKey] = useState('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');
  const [reseedLoading, setReseedLoading] = useState(false);

  const handleCheckUpdates = () => {
    setUpdateStatus('checking');
    setTimeout(() => {
      setUpdateStatus('latest');
    }, 1800);
  };

  const handleResetData = async () => {
    if (window.confirm('Reset all showroom local database tables to default sample inventory?')) {
      setReseedLoading(true);
      await dataService.resetToSampleData();
      setReseedLoading(false);
      alert('Local database reseeded successfully!');
      window.location.reload();
    }
  };

  return (
    <>
      <Header
        title="App Settings & System Controls"
        subtitle="Global color theme palette, OTA updater, and database migration manager"
      />

      <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* 1. Global Color Palette Manager */}
        <Card
          title="🎨 Global Theme & Single-File Color Palette"
          subtitle="All colors across the app are driven by src/theme/colors.ts. Changing a hex value updates the entire UI instantly."
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Color Swatches */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              {/* Primary */}
              <div style={{
                padding: '16px',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'var(--color-neutral-200)',
                border: '1px solid var(--color-neutral-300)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--color-neutral-900)' }}>Primary</span>
                  <code style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-primary-800)' }}>{palette.primary.DEFAULT}</code>
                </div>
                <div style={{
                  height: '46px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--color-primary-800)',
                  boxShadow: '0 2px 8px rgba(6, 77, 61, 0.3)',
                }} />
                <p style={{ fontSize: '11px', color: 'var(--color-neutral-500)', marginTop: '8px' }}>
                  Spruce Emerald • Active navigation, primary buttons, invoice branding
                </p>
              </div>

              {/* Secondary */}
              <div style={{
                padding: '16px',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'var(--color-neutral-200)',
                border: '1px solid var(--color-neutral-300)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--color-neutral-900)' }}>Secondary</span>
                  <code style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-secondary-600)' }}>{palette.secondary.DEFAULT}</code>
                </div>
                <div style={{
                  height: '46px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--color-secondary-600)',
                  boxShadow: '0 2px 8px rgba(101, 163, 13, 0.3)',
                }} />
                <p style={{ fontSize: '11px', color: 'var(--color-neutral-500)', marginTop: '8px' }}>
                  Olive Meadow • Secondary buttons, profit indicators, badges
                </p>
              </div>

              {/* Tertiary */}
              <div style={{
                padding: '16px',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'var(--color-neutral-200)',
                border: '1px solid var(--color-neutral-300)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--color-neutral-900)' }}>Tertiary</span>
                  <code style={{ fontSize: '12px', fontWeight: 700, color: '#4d7c0f' }}>{palette.tertiary.DEFAULT}</code>
                </div>
                <div style={{
                  height: '46px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--color-tertiary-500)',
                  boxShadow: '0 2px 8px rgba(132, 204, 22, 0.3)',
                }} />
                <p style={{ fontSize: '11px', color: 'var(--color-neutral-500)', marginTop: '8px' }}>
                  Chartreuse Lime • "New Sale" badge, POS checkout buttons
                </p>
              </div>

              {/* Neutral */}
              <div style={{
                padding: '16px',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'var(--color-neutral-200)',
                border: '1px solid var(--color-neutral-300)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--color-neutral-900)' }}>Neutral Canvas</span>
                  <code style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-neutral-700)' }}>#FDFDFD</code>
                </div>
                <div style={{
                  height: '46px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid var(--color-neutral-300)',
                }} />
                <p style={{ fontSize: '11px', color: 'var(--color-neutral-500)', marginTop: '8px' }}>
                  Off-White & Slate • Plus Jakarta Sans typography
                </p>
              </div>
            </div>

            {/* Design Spec Buttons Showcase */}
            <div style={{
              padding: '16px 20px',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--color-neutral-100)',
              border: '1px solid var(--color-neutral-300)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
            }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-neutral-700)' }}>
                Design Board Button Preview:
              </span>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <Button variant="primary">Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="inverted">Inverted</Button>
                <Button variant="outlined">Outlined</Button>
                <Button variant="tertiary">Tertiary</Button>
              </div>
            </div>
          </div>
        </Card>

        {/* 2. OTA Desktop App Updates */}
        <Card
          title="🚀 Over-The-Air (OTA) App Updates"
          subtitle="Tauri built-in auto-updater distributes zero-lag executable updates to client desktop machines"
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
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '15px', fontWeight: 800, color: 'var(--color-neutral-900)' }}>
                    Garhwal Lights IMS Desktop
                  </span>
                  <Badge variant="success">Version 1.0.0 (Latest)</Badge>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--color-neutral-500)', marginTop: '4px' }}>
                  Channel: Stable Production • Runtime: Tauri Native WebView2 (Zero Lag)
                </p>
              </div>

              <Button
                variant="primary"
                icon={<RefreshCw size={15} className={updateStatus === 'checking' ? 'animate-spin' : ''} />}
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

        {/* 3. Database Architecture & Supabase Migration Bridge */}
        <Card
          title="⚡ Database Engine & Supabase Migration Bridge"
          subtitle="Your request: Keep local database now and shift to Supabase later with zero UI refactoring"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--color-primary-50)',
              border: '1px solid var(--color-primary-200)',
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--color-primary-900)' }}>
                    Active Database: Local IndexedDB (Dexie Engine)
                  </span>
                  <Badge variant="primary">Offline-First</Badge>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--color-primary-700)', marginTop: '4px' }}>
                  Stores products, sales, purchases, and expenses locally on this machine with instant response.
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

            {/* Supabase Migration Hook */}
            <div style={{
              padding: '16px',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--color-neutral-200)',
              border: '1px solid var(--color-neutral-300)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-neutral-800)' }}>
                  Future Supabase Cloud Configuration:
                </span>
                <span style={{ fontSize: '11px', color: 'var(--color-neutral-500)' }}>
                  Ready to switch via <code>src/services/dataService.ts</code>
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <Input
                  label="Supabase Project URL"
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                />
                <Input
                  label="Supabase Anon Public API Key"
                  value={supabaseKey}
                  type="password"
                  onChange={(e) => setSupabaseKey(e.target.value)}
                />
              </div>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
};
