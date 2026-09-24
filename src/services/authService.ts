import type { UserSession } from '../types';
import { getRequiredSupabase } from './supabaseClient';
import { rateLimiter } from './rateLimiter';

const STAFF_SESSION_KEY = 'gl_ims_staff_session';
const ADMIN_SESSION_KEY = 'gl_ims_admin_session';
const ADMIN_TIMEOUT_KEY = 'gl_ims_admin_timeout_mins';

// Clean up any legacy local account credentials from browser storage
try {
  localStorage.removeItem('gl_ims_user_accounts');
} catch {
  // ignore
}

class AuthService {
  public getAdminTimeoutMinutes(): number {
    try {
      const stored = localStorage.getItem(ADMIN_TIMEOUT_KEY);
      if (stored) {
        const val = parseInt(stored, 10);
        if (!isNaN(val) && val > 0) return val;
      }
    } catch {
      // ignore
    }
    return 60; // Default 1 hour (60 minutes)
  }

  public setAdminTimeoutMinutes(mins: number): void {
    const validMins = Math.max(1, Math.round(mins));
    try {
      localStorage.setItem(ADMIN_TIMEOUT_KEY, String(validMins));
    } catch {
      // ignore
    }

    const active = this.getActiveSession();
    if (active && active.role === 'admin') {
      active.timeoutMinutes = validMins;
      this.persistSession(active);
    }
  }

  public recordHeartbeat(): void {
    const now = Date.now();
    try {
      localStorage.setItem('gl_ims_admin_last_active', String(now));
      localStorage.removeItem('gl_ims_admin_closed_at');
    } catch {
      // ignore
    }
  }

  public recordAppClosed(): void {
    const now = Date.now();
    try {
      localStorage.setItem('gl_ims_admin_closed_at', String(now));
      localStorage.setItem('gl_ims_admin_last_active', String(now));
    } catch {
      // ignore
    }
  }

  public extendAdminSession(_extraMinutes?: number): UserSession | null {
    const active = this.getActiveSession();
    if (active && active.role === 'admin') {
      this.recordHeartbeat();
      return active;
    }
    return null;
  }

  public async updatePassword(username: string, newPassword: string): Promise<boolean> {
    const cleanUsername = username.trim().toLowerCase();
    const cleanPassword = newPassword.trim();
    if (!cleanPassword) return false;

    // Rate limit: max 3 attempts per 2 minutes
    rateLimiter.enforceLimit('admin_update_password', 3, 2 * 60 * 1000, 'update account password');

    const supabase = getRequiredSupabase();
    const { error } = await supabase
      .from('app_users')
      .update({ password_hash: cleanPassword })
      .eq('username', cleanUsername);

    if (error) {
      console.error('Failed to update password in Supabase app_users table:', error);
      throw new Error(`Failed to update password in cloud database: ${error.message}`);
    }

    return true;
  }

  public async updateDisplayName(username: string, newDisplayName: string): Promise<boolean> {
    const cleanUsername = username.trim().toLowerCase();
    const cleanName = newDisplayName.trim();
    if (!cleanName) return false;

    // Rate limit: max 5 attempts per minute
    rateLimiter.enforceLimit('admin_update_display_name', 5, 60 * 1000, 'update showroom name');

    const supabase = getRequiredSupabase();
    const { error } = await supabase
      .from('app_users')
      .update({ display_name: cleanName })
      .eq('username', cleanUsername);

    if (error) {
      console.error('Failed to update display name in Supabase app_users table:', error);
      throw new Error(`Failed to update display name in cloud database: ${error.message}`);
    }

    // Also update active session if it matches
    const active = this.getActiveSession();
    if (active && active.username.toLowerCase() === cleanUsername) {
      active.displayName = cleanName;
      this.persistSession(active);
    }

    return true;
  }

  public async login(
    username: string,
    password: string
  ): Promise<{ success: boolean; session?: UserSession; error?: string }> {
    const cleanUsername = username.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanUsername || !cleanPassword) {
      return { success: false, error: 'Please enter both User ID and Password.' };
    }

    // 1. Rate Limiting Check: Block if under lockout (brute-force) or rapid burst spam
    const rateCheck = rateLimiter.checkLoginRateLimit(cleanUsername);
    if (!rateCheck.allowed) {
      return { success: false, error: rateCheck.error };
    }

    let supabase;
    try {
      supabase = getRequiredSupabase();
    } catch {
      return { 
        success: false, 
        error: 'Unable to connect to Supabase Cloud Database. Please check your internet connection.' 
      };
    }

    try {
      const { data, error } = await supabase
        .from('app_users')
        .select('*')
        .eq('username', cleanUsername)
        .maybeSingle();

      if (error) {
        console.error('Supabase authentication query error:', error);
        return { 
          success: false, 
          error: `Cloud database error: ${error.message || 'Unable to authenticate. Check internet connection.'}` 
        };
      }

      if (!data) {
        const failResult = rateLimiter.recordFailedLogin(cleanUsername);
        return { 
          success: false, 
          error: failResult.locked
            ? failResult.error
            : `User ID '${cleanUsername}' does not exist in the showroom cloud database. (${failResult.remainingAttempts} attempt(s) remaining)`
        };
      }

      if (data.password_hash !== cleanPassword) {
        const failResult = rateLimiter.recordFailedLogin(cleanUsername);
        return { 
          success: false, 
          error: failResult.locked
            ? failResult.error
            : `Incorrect password. (${failResult.remainingAttempts} attempt(s) remaining before temporary lockout)`
        };
      }

      // Successful authentication: clear any failed attempt history
      rateLimiter.recordSuccessfulLogin(cleanUsername);

      // Determine timeout for admin session
      const timeoutMinutes = data.role === 'admin' ? this.getAdminTimeoutMinutes() : undefined;

      const session: UserSession = {
        id: data.id,
        username: data.username,
        displayName: data.display_name || (data.role === 'admin' ? 'Owner' : 'Showroom Billing Staff'),
        role: data.role as 'admin' | 'staff',
        loginTime: new Date().toISOString(),
        lastActiveTime: Date.now(),
        timeoutMinutes,
      };

      if (data.role === 'admin') {
        this.recordHeartbeat();
      }

      this.persistSession(session);
      return { success: true, session };
    } catch (err: any) {
      console.error('Network error during Supabase login:', err);
      return { 
        success: false, 
        error: 'Network connection failure. Please ensure your computer is connected to the internet.' 
      };
    }
  }

  private persistSession(session: UserSession): void {
    if (session.role === 'staff') {
      try {
        localStorage.setItem(STAFF_SESSION_KEY, JSON.stringify(session));
        localStorage.removeItem(ADMIN_SESSION_KEY);
        sessionStorage.removeItem(ADMIN_SESSION_KEY);
      } catch (e) {
        console.error('Error saving staff session', e);
      }
    } else {
      try {
        localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
        localStorage.removeItem(STAFF_SESSION_KEY);
        sessionStorage.removeItem(ADMIN_SESSION_KEY);
      } catch (e) {
        console.error('Error saving admin session', e);
      }
    }
  }

  public getActiveSession(): UserSession | null {
    // 1. Check if admin session is active in localStorage
    try {
      const adminData = localStorage.getItem(ADMIN_SESSION_KEY) || sessionStorage.getItem(ADMIN_SESSION_KEY);
      if (adminData) {
        const session = JSON.parse(adminData) as UserSession;
        if (session.role === 'admin') {
          const timeoutMins = this.getAdminTimeoutMinutes();
          const maxInactiveMs = timeoutMins * 60 * 1000;
          const closedAt = Number(localStorage.getItem('gl_ims_admin_closed_at')) || 0;
          const lastActive = Number(localStorage.getItem('gl_ims_admin_last_active')) || session.lastActiveTime || 0;
          const referenceTime = closedAt || lastActive;

          // Check if app was closed or inactive for longer than the timeout
          if (referenceTime && (Date.now() - referenceTime) > maxInactiveMs) {
            console.warn(`Admin session expired: app was closed for over ${timeoutMins} minutes.`);
            this.logout();
            return null;
          }

          // User is currently using the app: keep session refreshed
          this.recordHeartbeat();
          return session;
        }
        return session;
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
      localStorage.removeItem(ADMIN_SESSION_KEY);
      sessionStorage.removeItem(ADMIN_SESSION_KEY);
      localStorage.removeItem(STAFF_SESSION_KEY);
      localStorage.removeItem('gl_ims_admin_closed_at');
      localStorage.removeItem('gl_ims_admin_last_active');
    } catch (e) {
      console.error('Error clearing sessions', e);
    }
  }
}

export const authService = new AuthService();
