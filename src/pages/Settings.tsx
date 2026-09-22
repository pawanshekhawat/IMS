import React, { useState } from 'react';
import { 
  RefreshCw, 
  CheckCircle, 
  RotateCcw,
  Store,
  Download,
  AlertCircle,
  ArrowUpCircle,
  Sparkles,
  Cloud,
  Server,
  Key,
} from 'lucide-react';
import { Header } from '../components/layout/Header';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { dataService } from '../services/dataService';
import { authService } from '../services/authService';
import { updateService, type UpdateInfo } from '../services/updateService';
import { getSupabaseCredentials, saveSupabaseCredentials, isSupabaseConfigured, getSupabase } from '../services/supabaseClient';

export const Settings: React.FC = () => {
  const [updateStatus, setUpdateStatus] = useState<'idle' | 'checking' | 'latest' | 'available' | 'downloading' | 'ready' | 'error'>('idle');
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [reseedLoading, setReseedLoading] = useState(false);
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [newStaffPassword, setNewStaffPassword] = useState('');
  const [passwordFeedback, setPasswordFeedback] = useState<string | null>(null);
  const [autoUpdateEnabled, setAutoUpdateEnabled] = useState<boolean>(() => {
    return localStorage.getItem('auto_update_enabled') !== 'false';
  });

  // Supabase Configuration State
  const initialCreds = getSupabaseCredentials();
  const [supabaseUrl, setSupabaseUrl] = useState(initialCreds.url);
  const [supabaseKey, setSupabaseKey] = useState(initialCreds.key);
  const [supabaseFeedback, setSupabaseFeedback] = useState<string | null>(null);
  const [supabaseStatus, setSupabaseStatus] = useState<'idle' | 'testing' | 'connected' | 'error'>(
    isSupabaseConfigured() ? 'connected' : 'idle'
  );

  const handleToggleAutoUpdate = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.checked;
    setAutoUpdateEnabled(val);
    localStorage.setItem('auto_update_enabled', String(val));
  };

  const handleUpdateAdminPassword = async () => {
    if (!newAdminPassword.trim()) return;
    const ok = await authService.updatePassword('admin', newAdminPassword.trim());
    if (ok) {
      setPasswordFeedback('Admin password updated successfully!');
      setNewAdminPassword('');
      setTimeout(() => setPasswordFeedback(null), 4000);
    }
  };

  const handleUpdateStaffPassword = async () => {
    if (!newStaffPassword.trim()) return;
    const ok = await authService.updatePassword('staff', newStaffPassword.trim());
    if (ok) {
      setPasswordFeedback('Staff password updated successfully!');
      setNewStaffPassword('');
      setTimeout(() => setPasswordFeedback(null), 4000);
    }
  };
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

  const handleCheckUpdates = async () => {
    setUpdateStatus('checking');
    setUpdateError(null);
    try {
      const info = await updateService.checkForUpdates();
      setUpdateInfo(info);
      if (info.available) {
        setUpdateStatus('available');
      } else {
        setUpdateStatus('latest');
      }
    } catch (err: any) {
      setUpdateStatus('error');
      setUpdateError(err?.message || 'Failed to check for updates from GitHub');
    }
  };

  const handleInstallUpdate = async () => {
    if (!updateInfo?.rawUpdate) {
      window.open('https://github.com/pawanshekhawat/IMS/releases', '_blank');
      return;
    }
    setUpdateStatus('downloading');
    setDownloadProgress(0);
    setUpdateError(null);
    try {
      await updateService.downloadAndInstall(updateInfo.rawUpdate, (p) => {
        setDownloadProgress(p.percent);
      });
      setUpdateStatus('ready');
    } catch (err: any) {
      setUpdateStatus('error');
      setUpdateError(err?.message || 'Failed to download and install update');
    }
  };

  const handleRelaunch = async () => {
    try {
      await updateService.relaunch();
    } catch (err: any) {
      alert('Please restart the application manually: ' + (err?.message || ''));
    }
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

  const handleSaveSupabase = () => {
    saveSupabaseCredentials(supabaseUrl, supabaseKey);
    setSupabaseFeedback('Supabase credentials saved successfully!');
    setTimeout(() => setSupabaseFeedback(null), 3000);
  };

  const handleTestConnection = async () => {
    setSupabaseStatus('testing');
    setSupabaseFeedback(null);
    try {
      saveSupabaseCredentials(supabaseUrl, supabaseKey);
      const client = getSupabase();
      if (!client) {
        setSupabaseStatus('error');
        setSupabaseFeedback('Invalid URL or Anon Key. Please check the credentials.');
        return;
      }
      const { error } = await client.from('products').select('id').limit(1);
      if (error) {
        setSupabaseStatus('error');
        setSupabaseFeedback(`Connected to Supabase endpoint, but table query returned: ${error.message}. (Did you run supabase/schema.sql in SQL Editor?)`);
      } else {
        setSupabaseStatus('connected');
        setSupabaseFeedback('✓ Connected to Supabase Cloud PostgreSQL successfully!');
      }
    } catch (err: any) {
      setSupabaseStatus('error');
      setSupabaseFeedback(err?.message || 'Connection failed.');
    }
  };

  const handleResetData = async () => {
    if (window.confirm('Clear all local data and reset showroom inventory, sales, and purchases to 0?')) {
      setReseedLoading(true);
      await dataService.resetToSampleData();
      setReseedLoading(false);
      alert('All showroom tables reset to clean 0!');
      window.location.reload();
    }
  };

  return (
    <>
      <Header
        title="App Settings & System Controls"
        subtitle="OTA desktop updates, showroom store profile, and database management"
        quickActionLabel="Reset Data to 0"
        onQuickAction={handleResetData}
      />

      <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* 1. OTA Desktop App Updates */}
        <Card
          title="🚀 Over-The-Air (OTA) App Updates"
          subtitle="Tauri auto-updater distributes zero-lag executable updates directly across client machines via GitHub Releases"
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
                  <Badge variant={updateStatus === 'available' ? 'warning' : 'success'}>
                    Version {updateService.getCurrentVersion()} {updateStatus === 'available' ? '• Update Available' : '(Latest)'}
                  </Badge>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--color-neutral-500)', marginTop: '4px' }}>
                  Channel: GitHub Releases Stable • Endpoint: pawanshekhawat/IMS
                </p>
              </div>

              <Button
                variant="primary"
                icon={<RefreshCw size={15} color="#FFFFFF" className={updateStatus === 'checking' ? 'animate-spin' : ''} />}
                onClick={handleCheckUpdates}
                disabled={updateStatus === 'checking' || updateStatus === 'downloading'}
              >
                {updateStatus === 'checking' ? 'Connecting to GitHub...' : 'Check for Updates'}
              </Button>
            </div>

            {/* Auto-Update & Auto-Restart Setting */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 18px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--color-neutral-100)',
              border: '1px solid var(--color-neutral-250)',
              flexWrap: 'wrap',
              gap: '10px',
            }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-neutral-900)' }}>
                  Automatic Background Updates & Auto-Restart
                </div>
                <div style={{ fontSize: '11px', color: 'var(--color-neutral-500)', marginTop: '2px' }}>
                  When new versions are published to GitHub Releases, silently download in background and auto-restart app when ready.
                </div>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 600, color: 'var(--color-neutral-800)' }}>
                <input
                  type="checkbox"
                  checked={autoUpdateEnabled}
                  onChange={handleToggleAutoUpdate}
                  style={{ width: '16px', height: '16px', accentColor: 'var(--color-primary-800)' }}
                />
                {autoUpdateEnabled ? 'Enabled' : 'Disabled'}
              </label>
            </div>

            {/* Update Available Banner & Action */}
            {updateStatus === 'available' && updateInfo && (
              <div style={{
                padding: '18px 20px',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'var(--color-warning-bg)',
                border: '1px solid #fcd34d',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Sparkles size={18} color="var(--color-warning)" />
                    <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--color-warning)' }}>
                      New Version v{updateInfo.latestVersion} Available!
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--color-neutral-600)' }}>
                      (You are running v{updateInfo.currentVersion})
                    </span>
                  </div>

                  <Button
                    variant="primary"
                    size="sm"
                    icon={<Download size={14} color="#FFFFFF" />}
                    onClick={handleInstallUpdate}
                  >
                    Download & Install Update
                  </Button>
                </div>

                {updateInfo.notes && (
                  <div style={{
                    padding: '12px 14px',
                    backgroundColor: '#FFFFFF',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-neutral-300)',
                    fontSize: '12px',
                    color: 'var(--color-neutral-700)',
                    lineHeight: 1.5,
                  }}>
                    <div style={{ fontWeight: 700, marginBottom: '4px', color: 'var(--color-neutral-900)' }}>Release Notes:</div>
                    {updateInfo.notes}
                  </div>
                )}
              </div>
            )}

            {/* Downloading Progress Bar */}
            {updateStatus === 'downloading' && (
              <div style={{
                padding: '16px 20px',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'var(--color-neutral-100)',
                border: '1px solid var(--color-neutral-300)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 700, color: 'var(--color-neutral-800)' }}>
                  <span>Downloading update package from GitHub Releases...</span>
                  <span>{downloadProgress}%</span>
                </div>
                <div style={{
                  width: '100%',
                  height: '8px',
                  backgroundColor: 'var(--color-neutral-250)',
                  borderRadius: '9999px',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%',
                    width: `${downloadProgress}%`,
                    backgroundColor: 'var(--color-primary-800)',
                    transition: 'width 0.2s ease',
                  }} />
                </div>
              </div>
            )}

            {/* Ready to Relaunch Banner */}
            {updateStatus === 'ready' && (
              <div style={{
                padding: '16px 20px',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: '#dcfce7',
                border: '1px solid #86efac',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle size={18} color="var(--color-success)" />
                  <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--color-success)' }}>
                    Update successfully downloaded and verified! Relaunch application to finish.
                  </span>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  icon={<ArrowUpCircle size={15} color="#FFFFFF" />}
                  onClick={handleRelaunch}
                >
                  Relaunch Application Now
                </Button>
              </div>
            )}

            {/* Already Up to Date Message */}
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

            {/* Error Message */}
            {updateStatus === 'error' && updateError && (
              <div style={{
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-danger-bg)',
                color: 'var(--color-danger)',
                fontSize: '13px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <AlertCircle size={16} />
                <span>{updateError}</span>
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

        {/* 3. User Accounts & Access Security */}
        <Card
          title="🔐 User Accounts & Access Passwords"
          subtitle="Manage passwords for Admin and Counter Staff accounts"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '16px',
            }}>
              {/* Admin Password Box */}
              <div style={{
                padding: '16px 18px',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'var(--color-neutral-200)',
                border: '1px solid var(--color-neutral-300)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--color-neutral-900)' }}>
                      Admin Account (Owner)
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--color-neutral-500)' }}>
                      User ID: <strong>admin</strong> • Session-protected
                    </div>
                  </div>
                  <Badge variant="primary">Admin</Badge>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="password"
                    placeholder="New admin password"
                    value={newAdminPassword}
                    onChange={(e) => setNewAdminPassword(e.target.value)}
                    className="input-base"
                    style={{ flex: 1, height: '36px', fontSize: '12px' }}
                  />
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={handleUpdateAdminPassword}
                    disabled={!newAdminPassword.trim()}
                  >
                    Save
                  </Button>
                </div>
              </div>

              {/* Staff Password Box */}
              <div style={{
                padding: '16px 18px',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'var(--color-neutral-200)',
                border: '1px solid var(--color-neutral-300)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--color-neutral-900)' }}>
                      Staff Account (Counter POS)
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--color-neutral-500)' }}>
                      User ID: <strong>staff</strong> • Persistent Login
                    </div>
                  </div>
                  <Badge variant="warning">Staff</Badge>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="password"
                    placeholder="New staff password"
                    value={newStaffPassword}
                    onChange={(e) => setNewStaffPassword(e.target.value)}
                    className="input-base"
                    style={{ flex: 1, height: '36px', fontSize: '12px' }}
                  />
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={handleUpdateStaffPassword}
                    disabled={!newStaffPassword.trim()}
                  >
                    Save
                  </Button>
                </div>
              </div>
            </div>

            {passwordFeedback && (
              <div style={{
                fontSize: '12px',
                fontWeight: 700,
                color: 'var(--color-success)',
                padding: '8px 12px',
                backgroundColor: '#dcfce7',
                borderRadius: 'var(--radius-md)',
                display: 'inline-block',
              }}>
                ✓ {passwordFeedback}
              </div>
            )}
          </div>
        </Card>

        {/* 4. Supabase Cloud Database Configuration */}
        <Card
          title="☁️ Supabase Cloud Database"
          subtitle="Real-time PostgreSQL backend syncing products, sales, and showroom inventory across all systems"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Status Banner */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 18px',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: supabaseStatus === 'connected' ? '#ecfdf5' : 'var(--color-neutral-200)',
              border: `1px solid ${supabaseStatus === 'connected' ? '#a7f3d0' : 'var(--color-neutral-300)'}`,
              flexWrap: 'wrap',
              gap: '12px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Cloud size={20} color={supabaseStatus === 'connected' ? 'var(--color-primary-800)' : 'var(--color-neutral-600)'} />
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--color-neutral-900)' }}>
                    Supabase PostgreSQL Cloud Connection
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-neutral-500)', marginTop: '2px' }}>
                    {supabaseStatus === 'connected'
                      ? 'Live cloud synchronization active across all devices and branches'
                      : 'Paste your project URL and anon public key below or configure them in .env'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Badge variant={supabaseStatus === 'connected' ? 'success' : 'warning'}>
                  {supabaseStatus === 'connected' ? '● Live Connected' : '● Offline / Clean 0 State'}
                </Badge>
                <Button
                  size="sm"
                  variant="outlined"
                  icon={<RefreshCw size={13} className={supabaseStatus === 'testing' ? 'animate-spin' : ''} />}
                  onClick={handleTestConnection}
                  disabled={supabaseStatus === 'testing'}
                >
                  {supabaseStatus === 'testing' ? 'Testing...' : 'Test Connection'}
                </Button>
              </div>
            </div>

            {/* Inputs */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <Input
                label="Supabase Project URL"
                value={supabaseUrl}
                onChange={(e) => setSupabaseUrl(e.target.value)}
                placeholder="https://baciicxeyqvjmbfgcjbm.supabase.co"
                icon={<Server size={15} />}
              />
              <Input
                label="Supabase Anon Key (Public)"
                type="password"
                value={supabaseKey}
                onChange={(e) => setSupabaseKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                icon={<Key size={15} />}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ fontSize: '11px', color: 'var(--color-neutral-500)' }}>
                Find your Anon Key in: <strong>Supabase Dashboard &gt; Project Settings &gt; API &gt; Project API keys (anon public)</strong>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <Button
                  variant="outlined"
                  size="sm"
                  icon={<RotateCcw size={13} />}
                  onClick={handleResetData}
                  isLoading={reseedLoading}
                  title="Clear all stored data to 0"
                >
                  Clear All Data to 0
                </Button>

                <Button
                  variant="primary"
                  size="sm"
                  icon={<CheckCircle size={14} color="#FFFFFF" />}
                  onClick={handleSaveSupabase}
                >
                  Save Supabase Settings
                </Button>
              </div>
            </div>

            {supabaseFeedback && (
              <div style={{
                fontSize: '12px',
                fontWeight: 600,
                color: supabaseStatus === 'error' ? 'var(--color-danger)' : 'var(--color-success)',
                padding: '8px 12px',
                backgroundColor: supabaseStatus === 'error' ? 'var(--color-danger-bg)' : '#dcfce7',
                borderRadius: 'var(--radius-md)',
                border: `1px solid ${supabaseStatus === 'error' ? '#fca5a5' : '#86efac'}`,
              }}>
                {supabaseFeedback}
              </div>
            )}
          </div>
        </Card>
      </div>
    </>
  );
};
