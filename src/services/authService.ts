import type { UserAccount, UserSession } from '../types';

const ACCOUNTS_STORAGE_KEY = 'gl_ims_user_accounts';
const STAFF_SESSION_KEY = 'gl_ims_staff_session';
const ADMIN_SESSION_KEY = 'gl_ims_admin_session';

const DEFAULT_ACCOUNTS: UserAccount[] = [
  {
    id: 'user_admin_01',
    username: 'admin',
    passwordHash: 'admin123',
    displayName: 'Pawan Shekhawat (Owner)',
    role: 'admin',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'user_staff_01',
    username: 'staff',
    passwordHash: 'staff123',
    displayName: 'Showroom Billing Staff',
    role: 'staff',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
];

class AuthService {
  private getStoredAccounts(): UserAccount[] {
    try {
      const data = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
      if (data) {
        const accounts = JSON.parse(data);
        if (Array.isArray(accounts) && accounts.length > 0) {
          return accounts;
        }
      }
    } catch {
      // fallback to defaults
    }
    this.saveAccounts(DEFAULT_ACCOUNTS);
    return DEFAULT_ACCOUNTS;
  }

  private saveAccounts(accounts: UserAccount[]): void {
    try {
      localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
    } catch (err) {
      console.error('Failed to save accounts to localStorage', err);
    }
  }

  public getAccounts(): UserAccount[] {
    return this.getStoredAccounts();
  }

  public updatePassword(username: string, newPassword: string): boolean {
    const accounts = this.getStoredAccounts();
    const target = accounts.find(a => a.username.toLowerCase() === username.toLowerCase());
    if (!target) return false;

    target.passwordHash = newPassword;
    this.saveAccounts(accounts);
    return true;
  }

  public login(username: string, password: string): { success: boolean; session?: UserSession; error?: string } {
    const cleanUsername = username.trim().toLowerCase();
    const accounts = this.getStoredAccounts();
    const account = accounts.find(a => a.username.toLowerCase() === cleanUsername);

    if (!account) {
      return { success: false, error: 'Invalid User ID. Please check your username.' };
    }

    if (account.passwordHash !== password) {
      return { success: false, error: 'Incorrect password. Please try again.' };
    }

    const session: UserSession = {
      id: account.id,
      username: account.username,
      displayName: account.displayName,
      role: account.role,
      loginTime: new Date().toISOString(),
    };

    if (account.role === 'staff') {
      // Staff session persists in localStorage so they don't have to enter password on every launch
      try {
        localStorage.setItem(STAFF_SESSION_KEY, JSON.stringify(session));
        // Clear any previous admin session
        sessionStorage.removeItem(ADMIN_SESSION_KEY);
      } catch (e) {
        console.error('Error saving staff session', e);
      }
    } else {
      // Admin session is stored in sessionStorage only: requires password on each new app launch
      try {
        sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
        // Also clear staff session so reopening the app doesn't automatically fall into staff
        localStorage.removeItem(STAFF_SESSION_KEY);
      } catch (e) {
        console.error('Error saving admin session', e);
      }
    }

    return { success: true, session };
  }

  public getActiveSession(): UserSession | null {
    // 1. Check if admin session is active in current session
    try {
      const adminData = sessionStorage.getItem(ADMIN_SESSION_KEY);
      if (adminData) {
        return JSON.parse(adminData) as UserSession;
      }
    } catch {
      // ignore
    }

    // 2. Check if persistent staff session exists in localStorage
    try {
      const staffData = localStorage.getItem(STAFF_SESSION_KEY);
      if (staffData) {
        return JSON.parse(staffData) as UserSession;
      }
    } catch {
      // ignore
    }

    return null;
  }

  public logout(): void {
    try {
      sessionStorage.removeItem(ADMIN_SESSION_KEY);
      localStorage.removeItem(STAFF_SESSION_KEY);
    } catch (e) {
      console.error('Error clearing sessions', e);
    }
  }
}

export const authService = new AuthService();
