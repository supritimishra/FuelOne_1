import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { fetchJSON } from '@/lib/api';

interface User {
  id: string;
  email: string;
  username?: string;
  fullName?: string;
  roles?: string[];
  tenant?: {
    id: string;
    organizationName: string;
  };
}

interface AuthContextType {
  user: User | null;
  organizationName: string | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  getAuthHeaders: () => HeadersInit;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [organizationName, setOrganizationName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    try {
      console.log('🔄 [AUTH] Fetching user profile...');
      
      // Since cookies are HTTP-only, we can't read them directly
      // The /api/auth/me endpoint will handle authentication via cookies
      const response = await fetchJSON('/api/auth/me');
      
      if (response.ok) {
        const userData = await response.json();
        console.log('✅ [AUTH] User data received:', {
          email: userData.email,
          organizationName: userData.tenant?.organizationName,
          tenantId: userData.tenant?.id
        });
        setUser(userData);
        setOrganizationName(userData.tenant?.organizationName || null);
      } else {
        console.log('❌ [AUTH] Failed to fetch user data, status:', response.status);
        setUser(null);
        setOrganizationName(null);
      }
    } catch (error) {
      console.error('❌ [AUTH] Error fetching user:', error);
      setUser(null);
      setOrganizationName(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const refreshUser = async () => {
    setLoading(true);
    await fetchUser();
  };

  const signOut = async () => {
    try {
      await fetchJSON('/api/auth/logout', { method: 'POST' });
      
      setUser(null);
      setOrganizationName(null);
      
      // Clear cookies manually
      document.cookie.split(";").forEach(c => {
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
      
      // Clear storage
      localStorage.clear();
      sessionStorage.clear();
      
      // Force redirect
      window.location.href = "/login";
    } catch (error) {
      console.error("SignOut error:", error);
      // Force redirect even on error
      window.location.href = "/login";
    }
  };

  const getAuthHeaders = (): HeadersInit => {
    return {
      'Content-Type': 'application/json',
    };
  };

  const value = {
    user,
    organizationName,
    loading,
    signOut,
    refreshUser,
    getAuthHeaders,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

