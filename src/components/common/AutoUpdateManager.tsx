import React, { useEffect, useState, useRef } from 'react';
import { ArrowUpCircle, RefreshCw, CheckCircle2, X, Clock, Sparkles } from 'lucide-react';
import { updateService, type UpdateInfo } from '../../services/updateService';
import { Button } from '../ui/Button';

export const AutoUpdateManager: React.FC = () => {
  const [status, setStatus] = useState<'idle' | 'checking' | 'downloading' | 'ready' | 'postponed'>('idle');
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [countdown, setCountdown] = useState<number>(5);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);
  const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Check if auto-update is enabled in settings (defaults to true)
    const isAutoUpdateEnabled = localStorage.getItem('auto_update_enabled') !== 'false';
    if (!isAutoUpdateEnabled) return;

    // Initial check 4 seconds after app starts
    const initialTimer = setTimeout(() => {
      runAutoUpdateCheck();
    }, 4000);

    // Periodic check every 30 minutes
    const intervalTimer = setInterval(() => {
      const currentAuto = localStorage.getItem('auto_update_enabled') !== 'false';
      if (currentAuto && status === 'idle') {
        runAutoUpdateCheck();
      }
    }, 1000 * 60 * 30);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(intervalTimer);
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }
    };
  }, [status]);

  const runAutoUpdateCheck = async () => {
    try {
      setStatus('checking');
      const info = await updateService.checkForUpdates();
      if (info && info.available && info.rawUpdate) {
        setUpdateInfo(info);
        setStatus('downloading');
        setProgress(0);

        // Automatically start download and installation
        await updateService.downloadAndInstall(info.rawUpdate, (p) => {
          setProgress(p.percent);
        });

        // Download finished and verified cryptographically
        setStatus('ready');
        startAutoRestartCountdown();
      } else {
        setStatus('idle');
      }
    } catch (err) {
      console.warn('[AutoUpdateManager] Background update check/download skipped:', err);
      setStatus('idle');
    }
  };

  const startAutoRestartCountdown = () => {
    setCountdown(5);
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
    }

    countdownTimerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
          handleRelaunchNow();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleRelaunchNow = async () => {
    try {
      await updateService.relaunch();
    } catch (err) {
      console.error('Failed to restart application:', err);
    }
  };

  const handlePostpone = () => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
    }
    setStatus('postponed');
    setIsDismissed(true);
  };

  if (isDismissed || status === 'idle' || status === 'checking') {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 99999,
        maxWidth: '420px',
        width: 'calc(100% - 48px)',
        backgroundColor: 'var(--color-surface, #FFFFFF)',
        borderRadius: '16px',
        border: '1.5px solid var(--color-primary-800, #064D3D)',
        boxShadow: '0 12px 32px -4px rgba(6, 77, 61, 0.25), 0 4px 12px rgba(0,0,0,0.08)',
        padding: '18px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>

      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              backgroundColor: 'var(--color-primary-100, #ECFDF5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-primary-800, #064D3D)',
              flexShrink: 0,
            }}
          >
            {status === 'downloading' ? (
              <RefreshCw size={18} className="animate-spin" />
            ) : status === 'ready' ? (
              <CheckCircle2 size={20} color="var(--color-success, #16A34A)" />
            ) : (
              <Sparkles size={18} />
            )}
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--color-neutral-900, #0C1711)' }}>
              {status === 'downloading'
                ? `Updating Garhwal Lights IMS (v${updateInfo?.latestVersion || ''})`
                : `Update Ready to Apply!`}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--color-neutral-500, #6B7280)', marginTop: '2px' }}>
              {status === 'downloading'
                ? 'Downloading new release files in the background...'
                : `Restarting automatically in ${countdown}s to finish install`}
            </div>
          </div>
        </div>

        <button
          onClick={handlePostpone}
          title="Postpone update"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
            color: 'var(--color-neutral-400, #9CA3AF)',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <X size={16} />
        </button>
      </div>

      {/* Downloading Progress Bar */}
      {status === 'downloading' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 700, color: 'var(--color-neutral-600)' }}>
            <span>Downloading update packages</span>
            <span>{progress}%</span>
          </div>
          <div
            style={{
              width: '100%',
              height: '6px',
              backgroundColor: 'var(--color-neutral-200, #E5E7EB)',
              borderRadius: '9999px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${progress}%`,
                backgroundColor: 'var(--color-primary-800, #064D3D)',
                borderRadius: '9999px',
                transition: 'width 0.25s ease',
              }}
            />
          </div>
        </div>
      )}

      {/* Ready / Restart Action Banner */}
      {status === 'ready' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
          <Button
            variant="primary"
            size="sm"
            style={{ flex: 1, padding: '8px 12px' }}
            icon={<ArrowUpCircle size={15} color="#FFFFFF" />}
            onClick={handleRelaunchNow}
          >
            Restart Now ({countdown}s)
          </Button>
          <Button
            variant="outlined"
            size="sm"
            icon={<Clock size={14} />}
            onClick={handlePostpone}
            title="Postpone restart for later"
          >
            Postpone
          </Button>
        </div>
      )}
    </div>
  );
};
