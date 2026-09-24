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

  const checkSessionValidity = () => {
    const active = authService.getActiveSession();
    if (!active) {
      if (user) {
        logout();
      }
      return;
    }

    if (!user || user.id !== active.id) {
      setUser(active);
    }
  };

  useEffect(() => {
    checkSessionValidity();
    setIsLoading(false);

    // 1. Keep session active while user is in the app (heartbeat every 5s)
    const heartbeatInterval = setInterval(() => {
      if (user?.role === 'admin') {
        authService.recordHeartbeat();
      }
    }, 5000);

    // 2. Track when user closes or leaves the app so the 1-hour grace timer starts
    const onAppClosed = () => {
      if (user?.role === 'admin') {
        authService.recordAppClosed();
      }
    };

    const onAppFocus = () => {
      checkSessionValidity();
      if (user?.role === 'admin') {
        authService.recordHeartbeat();
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        onAppClosed();
      } else {
        onAppFocus();
      }
    };

    window.addEventListener('beforeunload', onAppClosed);
    window.addEventListener('pagehide', onAppClosed);
    window.addEventListener('focus', onAppFocus);
    window.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      clearInterval(heartbeatInterval);
      window.removeEventListener('beforeunload', onAppClosed);
      window.removeEventListener('pagehide', onAppClosed);
      window.removeEventListener('focus', onAppFocus);
      window.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [user]);

  const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const res = await authService.login(username, password);
    if (res.success && res.session) {
      dataService.invalidateCache();
      setUser(res.session);
      return { success: true };
    }
    return { success: false, error: res.error || 'Login failed' };
  };

  const logout = () => {
    dataService.invalidateCache();
    authService.logout();
    setUser(null);
  };

  const extendSession = (minutes?: number) => {
    const updated = authService.extendAdminSession(minutes);
    if (updated) {
      setUser({ ...updated });
    }
  };

  const sessionRemainingMs = user?.expiresAt ? Math.max(0, user.expiresAt - Date.now()) : null;

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
