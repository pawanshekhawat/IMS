import type { UserSession } from '../types';
import { getRequiredSupabase } from './supabaseClient';

const STAFF_SESSION_KEY = 'gl_ims_staff_session';
const ADMIN_SESSION_KEY = 'gl_ims_admin_session';

// Clean up any legacy local account credentials from browser storage
try {
  localStorage.removeItem('gl_ims_user_accounts');
} catch {
  // ignore
}

class AuthService {
  public async updatePassword(username: string, newPassword: string): Promise<boolean> {
    const cleanUsername = username.trim().toLowerCase();
    const cleanPassword = newPassword.trim();
    if (!cleanPassword) return false;

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
      if (active.role === 'staff') {
        try {
          localStorage.setItem(STAFF_SESSION_KEY, JSON.stringify(active));
        } catch {
          // ignore
        }
      } else {
        try {
          sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(active));
        } catch {
          // ignore
        }
      }
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
        return { 
          success: false, 
          error: `User ID '${cleanUsername}' does not exist in the showroom cloud database.` 
        };
      }

      if (data.password_hash !== cleanPassword) {
        return { 
          success: false, 
          error: 'Incorrect password. Please verify and try again.' 
        };
      }

      const session: UserSession = {
        id: data.id,
        username: data.username,
        displayName: data.display_name || (data.role === 'admin' ? 'Owner' : 'Showroom Billing Staff'),
        role: data.role as 'admin' | 'staff',
        loginTime: new Date().toISOString(),
      };

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
