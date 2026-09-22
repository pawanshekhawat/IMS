import { check, Update } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';
import { isTauri } from '@tauri-apps/api/core';

export interface UpdateInfo {
  available: boolean;
  currentVersion: string;
  latestVersion: string;
  notes?: string;
  publishedAt?: string;
  rawUpdate?: Update | null;
}

export type ProgressCallback = (progress: {
  percent: number;
  downloadedBytes: number;
  totalBytes: number;
}) => void;

class UpdateService {
  public async checkForUpdates(): Promise<UpdateInfo> {
    const currentVersion = '1.0.0';

    if (isTauri()) {
      try {
        const update = await check();
        if (update) {
          return {
            available: true,
            currentVersion: update.currentVersion || currentVersion,
            latestVersion: update.version,
            notes: update.body || 'Performance enhancements and stability updates.',
            rawUpdate: update,
          };
        }
        return {
          available: false,
          currentVersion,
          latestVersion: currentVersion,
        };
      } catch (err) {
        console.warn('Tauri native update check failed, falling back to GitHub API', err);
      }
    }

    // Fallback or Web Dev check via GitHub Public API
    try {
      const res = await fetch('https://api.github.com/repos/pawanshekhawat/IMS/releases/latest');
      if (res.ok) {
        const data = await res.json();
        const latestTag = (data.tag_name || '').replace(/^v/, '');
        const isHigher = this.compareVersions(latestTag, currentVersion) > 0;
        return {
          available: isHigher,
          currentVersion,
          latestVersion: latestTag || currentVersion,
          notes: data.body || 'New features and showroom improvements.',
          publishedAt: data.published_at,
        };
      }
    } catch {
      // Offline or rate-limited
    }

    return {
      available: false,
      currentVersion,
      latestVersion: currentVersion,
    };
  }

  public async downloadAndInstall(
    update: Update,
    onProgress?: ProgressCallback
  ): Promise<void> {
    let downloaded = 0;
    let total = 0;

    await update.downloadAndInstall((event) => {
      switch (event.event) {
        case 'Started':
          total = event.data.contentLength || 0;
          onProgress?.({
            percent: 0,
            downloadedBytes: 0,
            totalBytes: total,
          });
          break;
        case 'Progress':
          downloaded += event.data.chunkLength;
          onProgress?.({
            percent: total > 0 ? Math.round((downloaded / total) * 100) : 50,
            downloadedBytes: downloaded,
            totalBytes: total,
          });
          break;
        case 'Finished':
          onProgress?.({
            percent: 100,
            downloadedBytes: total || downloaded,
            totalBytes: total || downloaded,
          });
          break;
      }
    });
  }

  public async relaunch(): Promise<void> {
    if (isTauri()) {
      await relaunch();
    } else {
      window.location.reload();
    }
  }

  private compareVersions(v1: string, v2: string): number {
    const parts1 = v1.split('.').map(n => parseInt(n, 10) || 0);
    const parts2 = v2.split('.').map(n => parseInt(n, 10) || 0);
    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const p1 = parts1[i] || 0;
      const p2 = parts2[i] || 0;
      if (p1 > p2) return 1;
      if (p1 < p2) return -1;
    }
    return 0;
  }
}

export const updateService = new UpdateService();
