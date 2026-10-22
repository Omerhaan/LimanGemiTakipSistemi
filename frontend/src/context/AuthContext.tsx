import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { User, UserRole, LoginRequest } from '../types';
import { authService } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  role: UserRole | null;
  loading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
  hasRole: (roles: UserRole[]) => boolean;
  isAdmin: boolean;
  isOperator: boolean;
  isViewer: boolean;
  // Yetki ayrımı (RBAC)
  canManageSystem: boolean;      // Admin: Gemi Sicili, Liman Tanımları, Mürettebat Sicili
  canManageOperations: boolean;  // Admin & Operator: Ziyaretler, Yük İşlemleri, Görev Atamaları
  canDelete: boolean;            // Sadece Admin: Kritik verileri silme
  canEdit: boolean;              // Geriye dönük uyumluluk
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => authService.getStoredUser());
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('liman_token'));
  const [loading, setLoading] = useState<boolean>(true);

  // Auto-login or verify current token on mount
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('liman_token');
      if (storedToken) {
        try {
          const currentUser = await authService.getCurrentUser();
          if (currentUser) {
            setUser(currentUser);
            setToken(storedToken);
          } else {
            // Token expired or invalid
            authService.logout();
            setUser(null);
            setToken(null);
          }
        } catch {
          // If offline/mock fallback to stored user
          const storedUser = authService.getStoredUser();
          if (storedUser) {
            setUser(storedUser);
          }
        }
      }
      setLoading(false);
    };

    initAuth();

    const handleAuthChange = () => {
      const storedToken = localStorage.getItem('liman_token');
      setToken(storedToken);
      setUser(authService.getStoredUser());
    };

    window.addEventListener('auth-changed', handleAuthChange);
    return () => window.removeEventListener('auth-changed', handleAuthChange);
  }, []);

  const login = useCallback(async (credentials: LoginRequest) => {
    const response = await authService.login(credentials);
    const resolvedUser: User = response.user || {
      id: response.id || 1,
      username: response.username || credentials.username,
      email: response.email || '',
      fullName: response.fullName || response.username || credentials.username,
      role: (response.role || 'Viewer') as UserRole,
    };
    setToken(response.token);
    setUser(resolvedUser);
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setToken(null);
    setUser(null);
  }, []);

  const currentRoleLower = (user?.role || '').toLowerCase();

  const hasRole = useCallback((roles: UserRole[]): boolean => {
    if (!user) return false;
    return roles.some((r) => r.toLowerCase() === currentRoleLower);
  }, [user, currentRoleLower]);

  const isAdmin = currentRoleLower === 'admin';
  const isOperator = currentRoleLower === 'operator';
  const isViewer = currentRoleLower === 'viewer';

  // Master veri yönetimi (Gemi Sicili, Liman Tanımları, Mürettebat Sicili): Sadece Admin
  const canManageSystem = isAdmin;

  // Operasyonel veri yönetimi (Ziyaretler, Yükler, Gemi-Personel Atamaları): Admin & Operator
  const canManageOperations = isAdmin || isOperator;

  // Kritik verileri silme: Sadece Admin
  const canDelete = isAdmin;

  // Geriye dönük uyumluluk için
  const canEdit = canManageOperations;

  const contextValue = useMemo(() => ({
    user,
    token,
    role: user?.role ?? null,
    loading,
    login,
    logout,
    hasRole,
    isAdmin,
    isOperator,
    isViewer,
    canManageSystem,
    canManageOperations,
    canDelete,
    canEdit,
  }), [
    user, token, loading, login, logout, hasRole, 
    isAdmin, isOperator, isViewer, 
    canManageSystem, canManageOperations, canDelete, canEdit
  ]);

  return (
    <AuthContext.Provider value={contextValue}>
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
