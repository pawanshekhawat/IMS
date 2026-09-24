import React, { useState, useEffect } from 'react';
import { 
  RefreshCw, 
  Download, 
  CheckCircle, 
  AlertCircle, 
  ArrowUpCircle, 
  Sparkles, 
  Laptop,
  CheckCircle2
} from 'lucide-react';
import { Header } from '../components/layout/Header';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { updateService, type UpdateInfo } from '../services/updateService';

export const AppUpdates: React.FC = () => {
  const [updateStatus, setUpdateStatus] = useState<'idle' | 'checking' | 'latest' | 'available' | 'downloading' | 'ready' | 'error'>('idle');
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [autoUpdateEnabled, setAutoUpdateEnabled] = useState<boolean>(() => {
    return localStorage.getItem('auto_update_enabled') !== 'false';
  });
  const [noticeDialog, setNoticeDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
  }>({
    isOpen: false,
    title: '',
    message: '',
  });

  // Automatically check for updates on page mount
  useEffect(() => {
    handleCheckUpdates();
  }, []);

  const handleToggleAutoUpdate = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.checked;
    setAutoUpdateEnabled(val);
    localStorage.setItem('auto_update_enabled', String(val));
  };

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
      setUpdateError(err?.message || 'Failed to connect to update servers. Check your internet connection.');
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
      setUpdateError(err?.message || 'Failed to download and install update packages.');
    }
  };

  const handleRelaunch = async () => {
    try {
      await updateService.relaunch();
    } catch (err: any) {
      setNoticeDialog({
        isOpen: true,
        title: 'Restart Required',
        message: 'Please restart the application manually: ' + (err?.message || ''),
      });
    }
  };

  const currentVersion = updateService.getCurrentVersion();

  return (
    <>
      <Header
        title="Desktop App Updates"
        subtitle="Manage software releases and Over-The-Air (OTA) updates for this PC"
      />

      <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '960px' }}>
        {/* 1. Main Update Controller */}
        <Card
          title="🚀 Over-The-Air (OTA) Software Updates"
          subtitle="Keep this computer up to date with the latest features, security patches, and performance optimizations"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Current Installed Version Pill */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '18px 22px',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--color-neutral-200)',
              border: '1px solid var(--color-neutral-300)',
              flexWrap: 'wrap',
              gap: '14px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  backgroundColor: 'var(--color-primary-100)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-primary-800)',
                }}>
                  <Laptop size={22} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '16px', fontWeight: 800, color: 'var(--color-neutral-900)' }}>
                      Garhwal Lights IMS
                    </span>
                    <Badge variant={updateStatus === 'available' ? 'warning' : 'success'}>
                      v{currentVersion} {updateStatus === 'available' ? '• Update Available' : '(Current)'}
                    </Badge>
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--color-neutral-500)', marginTop: '3px' }}>
                    Release Channel: GitHub Stable • Auto-syncing across showroom PCs
                  </p>
                </div>
              </div>

              <Button
                variant="primary"
                icon={<RefreshCw size={15} color="#FFFFFF" className={updateStatus === 'checking' ? 'animate-spin' : ''} />}
                onClick={handleCheckUpdates}
                disabled={updateStatus === 'checking' || updateStatus === 'downloading'}
              >
                {updateStatus === 'checking' ? 'Checking for Updates...' : 'Check for Updates Now'}
              </Button>
            </div>

            {/* Background Auto-Update Switch */}
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
                  Automatic Background Downloads
                </div>
                <div style={{ fontSize: '11px', color: 'var(--color-neutral-500)', marginTop: '2px' }}>
                  When a new version is released, download silently in the background and notify when ready to restart.
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

            {/* Update Available Banner */}
            {updateStatus === 'available' && updateInfo && (
              <div style={{
                padding: '20px',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'var(--color-warning-bg)',
                border: '1.5px solid #fcd34d',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Sparkles size={20} color="var(--color-warning)" />
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--color-warning)' }}>
                        New Version v{updateInfo.latestVersion} is Ready to Install!
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--color-neutral-600)', marginTop: '2px' }}>
                        This update includes performance improvements and new features.
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="primary"
                    size="md"
                    icon={<Download size={15} color="#FFFFFF" />}
                    onClick={handleInstallUpdate}
                  >
                    Download & Install Update Now
                  </Button>
                </div>

                {updateInfo.notes && (
                  <div style={{
                    padding: '14px 16px',
                    backgroundColor: '#FFFFFF',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-neutral-300)',
                    fontSize: '12px',
                    color: 'var(--color-neutral-700)',
                    lineHeight: 1.6,
                  }}>
                    <div style={{ fontWeight: 700, marginBottom: '6px', color: 'var(--color-neutral-900)' }}>
                      What's New in v{updateInfo.latestVersion}:
                    </div>
                    {updateInfo.notes}
                  </div>
                )}
              </div>
            )}

            {/* Downloading Progress Bar */}
            {updateStatus === 'downloading' && (
              <div style={{
                padding: '20px',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'var(--color-primary-100)',
                border: '1.5px solid var(--color-primary-300)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <RefreshCw size={16} className="animate-spin" color="var(--color-primary-800)" />
                    <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--color-primary-900)' }}>
                      Downloading update files... ({downloadProgress}%)
                    </span>
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-primary-700)' }}>
                    Please do not close the app
                  </span>
                </div>

                <div style={{
                  width: '100%',
                  height: '8px',
                  backgroundColor: 'rgba(6, 77, 61, 0.15)',
                  borderRadius: '9999px',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    width: `${downloadProgress}%`,
                    height: '100%',
                    backgroundColor: 'var(--color-primary-800)',
                    borderRadius: '9999px',
                    transition: 'width 0.25s ease',
                  }} />
                </div>
              </div>
            )}

            {/* Download Complete & Ready to Relaunch */}
            {updateStatus === 'ready' && (
              <div style={{
                padding: '18px 20px',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'var(--color-success-bg)',
                border: '1.5px solid #86efac',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '14px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <CheckCircle size={22} color="var(--color-success)" />
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--color-success)' }}>
                      Update verified & ready to apply!
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--color-neutral-600)' }}>
                      Restart the application now to start using the new version.
                    </div>
                  </div>
                </div>
                <Button
                  variant="primary"
                  size="md"
                  icon={<ArrowUpCircle size={16} color="#FFFFFF" />}
                  onClick={handleRelaunch}
                >
                  Restart Application Now
                </Button>
              </div>
            )}

            {/* Up to Date Confirmation */}
            {updateStatus === 'latest' && (
              <div style={{
                padding: '14px 18px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-success-bg)',
                color: 'var(--color-success)',
                fontSize: '13px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}>
                <CheckCircle2 size={18} />
                <span>Your Garhwal Lights IMS is running the latest software version (v{currentVersion}). No update needed!</span>
              </div>
            )}

            {/* Error Message */}
            {updateStatus === 'error' && updateError && (
              <div style={{
                padding: '14px 18px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-danger-bg)',
                color: 'var(--color-danger)',
                fontSize: '13px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}>
                <AlertCircle size={18} />
                <span>{updateError}</span>
              </div>
            )}
          </div>
        </Card>
      </div>

      <ConfirmModal
        isOpen={noticeDialog.isOpen}
        onClose={() => setNoticeDialog(prev => ({ ...prev, isOpen: false }))}
        title={noticeDialog.title}
        message={noticeDialog.message}
        confirmText="OK"
        variant="warning"
        isAlertOnly={true}
      />
    </>
  );
};
export default AppUpdates;
