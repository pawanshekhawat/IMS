import React, { useState, useEffect } from 'react';
import { 
  RefreshCw, 
  CheckCircle,
  Store,
  Download,
  AlertCircle,
  ArrowUpCircle,
  Sparkles,
  User,
  Lock,
  Eye,
  EyeOff,
  KeyRound,
} from 'lucide-react';
import { Header } from '../components/layout/Header';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import { updateService, type UpdateInfo } from '../services/updateService';

export const Settings: React.FC = () => {
  const { user, updateDisplayName } = useAuth();
  const [adminDisplayName, setAdminDisplayName] = useState(
    user?.displayName || 'Himanshu Choudhary (Owner)'
  );
  const [nameSaving, setNameSaving] = useState(false);
  const [nameFeedback, setNameFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (user?.displayName) {
      setAdminDisplayName(user.displayName);
    }
  }, [user?.displayName]);

  const handleUpdateAdminName = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = adminDisplayName.trim();
    if (!trimmed) return;
    setNameSaving(true);
    try {
      const ok = await updateDisplayName(trimmed);
      setNameSaving(false);
      if (ok) {
        setNameFeedback('Administrator name updated successfully in Supabase cloud!');
        setTimeout(() => setNameFeedback(null), 4000);
      }
    } catch (err: any) {
      setNameSaving(false);
      alert(err?.message || 'Failed to update name in Supabase');
    }
  };

  const [updateStatus, setUpdateStatus] = useState<'idle' | 'checking' | 'latest' | 'available' | 'downloading' | 'ready' | 'error'>('idle');
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [updateError, setUpdateError] = useState<string | null>(null);

  // Admin Master Password States
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [confirmAdminPassword, setConfirmAdminPassword] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [adminPasswordSaving, setAdminPasswordSaving] = useState(false);
  const [adminPasswordFeedback, setAdminPasswordFeedback] = useState<string | null>(null);
  const [adminPasswordError, setAdminPasswordError] = useState<string | null>(null);

  // Staff Password States
  const [newStaffPassword, setNewStaffPassword] = useState('');
  const [showStaffPassword, setShowStaffPassword] = useState(false);
  const [staffPasswordSaving, setStaffPasswordSaving] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState<string | null>(null);
  const [staffPasswordError, setStaffPasswordError] = useState<string | null>(null);

  const [autoUpdateEnabled, setAutoUpdateEnabled] = useState<boolean>(() => {
    return localStorage.getItem('auto_update_enabled') !== 'false';
  });

  const handleToggleAutoUpdate = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.checked;
    setAutoUpdateEnabled(val);
    localStorage.setItem('auto_update_enabled', String(val));
  };

  const handleUpdateAdminPassword = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanPass = newAdminPassword.trim();
    const cleanConfirm = confirmAdminPassword.trim();

    if (!cleanPass) {
      setAdminPasswordError('Please enter a new admin password.');
      return;
    }

    if (cleanPass.length < 4) {
      setAdminPasswordError('Password must be at least 4 characters long.');
      return;
    }

    if (cleanPass !== cleanConfirm) {
      setAdminPasswordError('Passwords do not match. Please re-enter.');
      return;
    }

    setAdminPasswordError(null);
    setAdminPasswordSaving(true);
    try {
      const ok = await authService.updatePassword('admin', cleanPass);
      setAdminPasswordSaving(false);
      if (ok) {
        setAdminPasswordFeedback('Admin master password updated successfully in Supabase cloud!');
        setNewAdminPassword('');
        setConfirmAdminPassword('');
        setTimeout(() => setAdminPasswordFeedback(null), 5000);
      }
    } catch (err: any) {
      setAdminPasswordSaving(false);
      setAdminPasswordError(err?.message || 'Failed to update admin password in Supabase.');
    }
  };

  const handleUpdateStaffPassword = async () => {
    const cleanPass = newStaffPassword.trim();
    if (!cleanPass) return;
    setStaffPasswordError(null);
    setStaffPasswordSaving(true);
    try {
      const ok = await authService.updatePassword('staff', cleanPass);
      setStaffPasswordSaving(false);
      if (ok) {
        setPasswordFeedback('Staff password updated successfully in Supabase cloud!');
        setNewStaffPassword('');
        setTimeout(() => setPasswordFeedback(null), 4000);
      }
    } catch (err: any) {
      setStaffPasswordSaving(false);
      setStaffPasswordError(err?.message || 'Failed to update staff password in Supabase');
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

  return (
    <>
      <Header
        title="App Settings & System Controls"
        subtitle="OTA desktop updates, showroom store profile, and database management"
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

        {/* 3. Administrator Profile & Security */}
        <Card
          title="👤 Administrator Profile & Master Password"
          subtitle="Customize the owner / administrator display name and update the master login password"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
              gap: '20px',
            }}>
              {/* Box 1: Owner / Admin Display Name */}
              <div style={{
                padding: '18px 20px',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'var(--color-neutral-200)',
                border: '1px solid var(--color-neutral-300)',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--color-neutral-900)' }}>
                      Administrator Identity
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--color-neutral-500)' }}>
                      User ID: <strong>admin</strong> • Owner Permissions
                    </div>
                  </div>
                  <Badge variant="success">Administrator</Badge>
                </div>

                <form onSubmit={handleUpdateAdminName} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--color-neutral-700)' }}>
                    Owner / Admin Display Name
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                      <input
                        type="text"
                        placeholder="e.g. Himanshu Choudhary (Owner)"
                        value={adminDisplayName}
                        onChange={(e) => setAdminDisplayName(e.target.value)}
                        className="input-base"
                        style={{ width: '100%', height: '38px', fontSize: '12px', paddingLeft: '34px' }}
                      />
                      <User size={15} color="var(--color-neutral-500)" style={{ position: 'absolute', left: '10px', top: '11px', pointerEvents: 'none' }} />
                    </div>
                    <Button
                      size="sm"
                      variant="primary"
                      type="submit"
                      disabled={!adminDisplayName.trim() || nameSaving}
                    >
                      {nameSaving ? 'Saving...' : 'Save'}
                    </Button>
                  </div>
                  {nameFeedback && (
                    <div style={{
                      fontSize: '12px',
                      fontWeight: 700,
                      color: 'var(--color-success)',
                      padding: '8px 12px',
                      backgroundColor: '#dcfce7',
                      borderRadius: 'var(--radius-md)',
                    }}>
                      ✓ {nameFeedback}
                    </div>
                  )}
                </form>
              </div>

              {/* Box 2: Owner / Admin Password Change */}
              <div style={{
                padding: '18px 20px',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'var(--color-neutral-200)',
                border: '1px solid var(--color-neutral-300)',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--color-neutral-900)' }}>
                      Admin Master Password
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--color-neutral-500)' }}>
                      User ID: <strong>admin</strong> • Master Login Control
                    </div>
                  </div>
                  <Badge variant="primary">Security</Badge>
                </div>

                <form onSubmit={handleUpdateAdminPassword} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showAdminPassword ? 'text' : 'password'}
                      placeholder="New Admin Password"
                      value={newAdminPassword}
                      onChange={(e) => setNewAdminPassword(e.target.value)}
                      className="input-base"
                      style={{ width: '100%', height: '38px', fontSize: '12px', paddingLeft: '34px', paddingRight: '36px' }}
                    />
                    <Lock size={15} color="var(--color-neutral-500)" style={{ position: 'absolute', left: '10px', top: '11px', pointerEvents: 'none' }} />
                    <button
                      type="button"
                      onClick={() => setShowAdminPassword(!showAdminPassword)}
                      style={{
                        position: 'absolute',
                        right: '8px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        color: 'var(--color-neutral-500)',
                      }}
                      tabIndex={-1}
                      aria-label={showAdminPassword ? 'Hide password' : 'Show password'}
                    >
                      {showAdminPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                      <input
                        type={showAdminPassword ? 'text' : 'password'}
                        placeholder="Confirm New Password"
                        value={confirmAdminPassword}
                        onChange={(e) => setConfirmAdminPassword(e.target.value)}
                        className="input-base"
                        style={{ width: '100%', height: '38px', fontSize: '12px', paddingLeft: '34px' }}
                      />
                      <KeyRound size={15} color="var(--color-neutral-500)" style={{ position: 'absolute', left: '10px', top: '11px', pointerEvents: 'none' }} />
                    </div>
                    <Button
                      size="sm"
                      variant="primary"
                      type="submit"
                      disabled={!newAdminPassword.trim() || !confirmAdminPassword.trim() || adminPasswordSaving}
                    >
                      {adminPasswordSaving ? 'Updating...' : 'Update Password'}
                    </Button>
                  </div>

                  {adminPasswordError && (
                    <div style={{
                      fontSize: '12px',
                      fontWeight: 600,
                      color: 'var(--color-danger)',
                      padding: '8px 12px',
                      backgroundColor: 'var(--color-danger-bg)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid #fca5a5',
                    }}>
                      ⚠️ {adminPasswordError}
                    </div>
                  )}

                  {adminPasswordFeedback && (
                    <div style={{
                      fontSize: '12px',
                      fontWeight: 700,
                      color: 'var(--color-success)',
                      padding: '8px 12px',
                      backgroundColor: '#dcfce7',
                      borderRadius: 'var(--radius-md)',
                    }}>
                      ✓ {adminPasswordFeedback}
                    </div>
                  )}
                </form>
              </div>
            </div>
          </div>
        </Card>

        {/* 4. Staff Access & Counter Credentials */}
        <Card
          title="🔐 Staff Counter Account & Password"
          subtitle="Manage login passcode for Showroom Counter Staff account"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr',
              maxWidth: '520px',
              gap: '16px',
            }}>
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
                  <div style={{ position: 'relative', flex: 1 }}>
                    <input
                      type={showStaffPassword ? 'text' : 'password'}
                      placeholder="New staff password"
                      value={newStaffPassword}
                      onChange={(e) => setNewStaffPassword(e.target.value)}
                      className="input-base"
                      style={{ width: '100%', height: '38px', fontSize: '12px', paddingLeft: '32px', paddingRight: '36px' }}
                    />
                    <Lock size={15} color="var(--color-neutral-500)" style={{ position: 'absolute', left: '10px', top: '11px', pointerEvents: 'none' }} />
                    <button
                      type="button"
                      onClick={() => setShowStaffPassword(!showStaffPassword)}
                      style={{
                        position: 'absolute',
                        right: '8px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        color: 'var(--color-neutral-500)',
                      }}
                      tabIndex={-1}
                      aria-label={showStaffPassword ? 'Hide password' : 'Show password'}
                    >
                      {showStaffPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={handleUpdateStaffPassword}
                    disabled={!newStaffPassword.trim() || staffPasswordSaving}
                  >
                    {staffPasswordSaving ? 'Saving...' : 'Save Password'}
                  </Button>
                </div>
              </div>
            </div>

            {staffPasswordError && (
              <div style={{
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--color-danger)',
                padding: '8px 12px',
                backgroundColor: 'var(--color-danger-bg)',
                borderRadius: 'var(--radius-md)',
                display: 'inline-block',
                maxWidth: '520px',
              }}>
                ⚠️ {staffPasswordError}
              </div>
            )}

            {passwordFeedback && (
              <div style={{
                fontSize: '12px',
                fontWeight: 700,
                color: 'var(--color-success)',
                padding: '8px 12px',
                backgroundColor: '#dcfce7',
                borderRadius: 'var(--radius-md)',
                display: 'inline-block',
                maxWidth: '520px',
              }}>
                ✓ {passwordFeedback}
              </div>
            )}
          </div>
        </Card>
      </div>
    </>
  );
};
