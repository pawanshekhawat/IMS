import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { dataService } from '../services/dataService';
import type { UserRole, UserSession } from '../types';

interface AuthContextType {
  user: UserSession | null;
  role: UserRole | null;
  isAdmin: boolean;
  isStaff: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateDisplayName: (newName: string) => Promise<boolean>;
  extendSession: (minutes?: number) => void;
  sessionRemainingMs: number | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionRemainingMs, setSessionRemainingMs] = useState<number | null>(null);

  const checkSessionValidity = () => {
    const active = authService.getActiveSession();
    if (!active) {
      if (user) {
        logout();
      }
      setSessionRemainingMs(null);
      return;
    }

    if (active.expiresAt) {
      const remaining = Math.max(0, active.expiresAt - Date.now());
      setSessionRemainingMs(remaining);
      if (remaining <= 0) {
        logout();
        return;
      }
    } else {
      setSessionRemainingMs(null);
    }

    if (!user || user.id !== active.id || user.expiresAt !== active.expiresAt) {
      setUser(active);
    }
  };

  useEffect(() => {
    checkSessionValidity();
    setIsLoading(false);

    // Heartbeat check every 2 seconds for auto-logout enforcement
    const interval = setInterval(checkSessionValidity, 2000);

    const onVisibilityOrFocus = () => {
      checkSessionValidity();
    };

    window.addEventListener('focus', onVisibilityOrFocus);
    window.addEventListener('visibilitychange', onVisibilityOrFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onVisibilityOrFocus);
      window.removeEventListener('visibilitychange', onVisibilityOrFocus);
    };
  }, [user]);

  const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const res = await authService.login(username, password);
    if (res.success && res.session) {
      dataService.invalidateCache();
      setUser(res.session);
      if (res.session.expiresAt) {
        setSessionRemainingMs(Math.max(0, res.session.expiresAt - Date.now()));
      }
      return { success: true };
    }
    return { success: false, error: res.error || 'Login failed' };
  };

  const logout = () => {
    dataService.invalidateCache();
    authService.logout();
    setUser(null);
    setSessionRemainingMs(null);
  };

  const extendSession = (minutes?: number) => {
    const updated = authService.extendAdminSession(minutes);
    if (updated) {
      setUser({ ...updated });
      if (updated.expiresAt) {
        setSessionRemainingMs(Math.max(0, updated.expiresAt - Date.now()));
      }
    }
  };

  const updateDisplayName = async (newName: string): Promise<boolean> => {
    const targetUsername = user?.username || 'admin';
    const ok = await authService.updateDisplayName(targetUsername, newName);
    if (ok) {
      const active = authService.getActiveSession();
      if (active) {
        setUser({ ...active });
      }
      return true;
    }
    return false;
  };

  const role = user?.role || null;
  const isAdmin = role === 'admin';
  const isStaff = role === 'staff';

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAdmin,
        isStaff,
        isLoading,
        login,
        logout,
        updateDisplayName,
        extendSession,
        sessionRemainingMs,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
