import type { UserAccount, UserSession } from '../types';
import { getSupabase } from './supabaseClient';

const ACCOUNTS_STORAGE_KEY = 'gl_ims_user_accounts';
const STAFF_SESSION_KEY = 'gl_ims_staff_session';
const ADMIN_SESSION_KEY = 'gl_ims_admin_session';

// Defaults read dynamically from .env with standard fallbacks
const getEnvDefaultAccounts = (): UserAccount[] => [
  {
    id: 'user_admin_01',
    username: (import.meta.env.VITE_ADMIN_ID || 'admin').trim().toLowerCase(),
    passwordHash: (import.meta.env.VITE_ADMIN_PASSWORD || 'admin123').trim(),
    displayName: 'Pawan Shekhawat (Owner)',
    role: 'admin',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'user_staff_01',
    username: (import.meta.env.VITE_STAFF_ID || 'staff').trim().toLowerCase(),
    passwordHash: (import.meta.env.VITE_STAFF_PASSWORD || 'staff123').trim(),
    displayName: 'Showroom Billing Staff',
    role: 'staff',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
];

class AuthService {
  private getStoredAccounts(): UserAccount[] {
    const defaults = getEnvDefaultAccounts();
    try {
      const data = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
      if (data) {
        const accounts: UserAccount[] = JSON.parse(data);
        if (Array.isArray(accounts) && accounts.length > 0) {
          // Merge with any env overrides if usernames match
          return accounts.map(acc => {
            const matchedEnv = defaults.find(d => d.role === acc.role);
            if (matchedEnv) {
              return {
                ...acc,
                username: acc.username || matchedEnv.username,
                passwordHash: acc.passwordHash || matchedEnv.passwordHash,
              };
            }
            return acc;
          });
        }
      }
    } catch {
      // fallback
    }
    this.saveAccounts(defaults);
    return defaults;
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

  public async updatePassword(username: string, newPassword: string): Promise<boolean> {
    const cleanUsername = username.trim().toLowerCase();
    const accounts = this.getStoredAccounts();
    const target = accounts.find(a => a.username.toLowerCase() === cleanUsername);
    if (!target) return false;

    target.passwordHash = newPassword;
    this.saveAccounts(accounts);

    // Also update in Supabase database if configured
    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase
          .from('app_users')
          .update({ password_hash: newPassword })
          .eq('username', cleanUsername);
      } catch (err) {
        console.warn('Could not sync password update to Supabase app_users table:', err);
      }
    }

    return true;
  }

  public async login(
    username: string, 
    password: string
  ): Promise<{ success: boolean; session?: UserSession; error?: string }> {
    const cleanUsername = username.trim().toLowerCase();
    const supabase = getSupabase();

    // 1. Try authenticating via Supabase 'app_users' table if online & configured
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('app_users')
          .select('*')
          .eq('username', cleanUsername)
          .maybeSingle();

        if (!error && data) {
          if (data.password_hash === password) {
            const session: UserSession = {
              id: data.id,
              username: data.username,
              displayName: data.display_name,
              role: data.role as 'admin' | 'staff',
              loginTime: new Date().toISOString(),
            };
            this.persistSession(session);
            return { success: true, session };
          } else {
            return { success: false, error: 'Incorrect password. Please try again.' };
          }
        }
      } catch (err) {
        console.warn('Supabase authentication check failed, falling back to local/env:', err);
      }
    }

    // 2. Fallback to .env and local account storage
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

    this.persistSession(session);
    return { success: true, session };
  }

  private persistSession(session: UserSession): void {
    if (session.role === 'staff') {
      try {
        localStorage.setItem(STAFF_SESSION_KEY, JSON.stringify(session));
        sessionStorage.removeItem(ADMIN_SESSION_KEY);
      } catch (e) {
        console.error('Error saving staff session', e);
      }
    } else {
      try {
        sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
        localStorage.removeItem(STAFF_SESSION_KEY);
      } catch (e) {
        console.error('Error saving admin session', e);
      }
    }
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

  public isAuthenticated(): boolean {
    return this.getActiveSession() !== null;
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
