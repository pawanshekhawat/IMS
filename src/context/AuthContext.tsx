import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';
import type { UserRole, UserSession } from '../types';

interface AuthContextType {
  user: UserSession | null;
  role: UserRole | null;
  isAdmin: boolean;
  isStaff: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing active session on mount
    const active = authService.getActiveSession();
    if (active) {
      setUser(active);
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const res = authService.login(username, password);
    if (res.success && res.session) {
      setUser(res.session);
      return { success: true };
    }
    return { success: false, error: res.error || 'Login failed' };
  };

  const logout = () => {
    authService.logout();
    setUser(null);
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
