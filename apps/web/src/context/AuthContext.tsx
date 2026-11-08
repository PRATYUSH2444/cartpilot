import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { DEMO_CREDENTIALS } from '../config/demo-credentials';
import { API_BASE } from '../config/api';

export type UserRole = 'CUSTOMER' | 'MERCHANT' | 'ADMIN';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  merchantId?: string;
  isStaff?: boolean;
  staffPermissions?: string[];
  mustChangePassword?: boolean;
}

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  isSessionExpired: boolean;
  dismissSessionExpired: () => void;
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; role?: UserRole; error?: string; mustChangePassword?: boolean }>;
  register: (
    name: string,
    email: string,
    password: string,
    phone?: string
  ) => Promise<{ success: boolean; role?: UserRole; error?: string }>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
  authFetch: (url: string, options?: RequestInit) => Promise<Response>;
  switchRoleQuick: (role: UserRole) => Promise<boolean>;
  setUserProfile: (user: UserProfile) => void;
  setSession: (token: string, user: UserProfile) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Pure in-memory token state — NO access or refresh tokens stored in localStorage (XSS-safe)
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSessionExpired, setIsSessionExpired] = useState<boolean>(false);
  const latestTokenRef = React.useRef<string | null>(token);

  useEffect(() => {
    latestTokenRef.current = token;
  }, [token]);

  // Silent session refresh via httpOnly, secure cookie on app startup
  const refreshSession = useCallback(async (): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({}),
      });

      if (res.ok) {
        const data = await res.json();
        const profile: UserProfile = {
          id: data.data.user.id || data.data.user.userId,
          email: data.data.user.email,
          name: data.data.user.name,
          role: data.data.user.role,
          merchantId: data.data.user.merchantId,
          isStaff: data.data.user.isStaff,
          staffPermissions: data.data.user.staffPermissions,
          mustChangePassword: data.data.user.mustChangePassword,
        };

        latestTokenRef.current = data.data.accessToken;
        setToken(data.data.accessToken);
        setUser(profile);
        setIsSessionExpired(false);
        try { localStorage.setItem('cartpilot_has_session', 'true'); } catch {}
        return true;
      } else {
        latestTokenRef.current = null;
        setToken(null);
        setUser(null);
        try { localStorage.removeItem('cartpilot_has_session'); } catch {}
        return false;
      }
    } catch {
      latestTokenRef.current = null;
      setToken(null);
      setUser(null);
      return false;
    }
  }, []);

  // Proactive automated token refresh timer: refreshes before access token expires (15m expiry)
  useEffect(() => {
    if (!token) return;
    try {
      const parts = token.split('.');
      if (parts.length >= 2) {
        const payloadBase64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        const decoded = JSON.parse(
          decodeURIComponent(
            atob(payloadBase64)
              .split('')
              .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
              .join('')
          )
        );
        if (decoded.exp) {
          const expMs = decoded.exp * 1000;
          const now = Date.now();
          // Proactively refresh 60 seconds before expiration (min 15 seconds)
          const delay = Math.max(expMs - now - 60000, 15000);
          const timer = setTimeout(() => {
            refreshSession();
          }, delay);
          return () => clearTimeout(timer);
        }
      }
    } catch {
      // Fallback: 10 minutes
      const timer = setTimeout(() => {
        refreshSession();
      }, 10 * 60 * 1000);
      return () => clearTimeout(timer);
    }
  }, [token, refreshSession]);

  // Unified authenticated fetch with automatic retry on 401
  const authFetch = useCallback(
    async (url: string, options: RequestInit = {}): Promise<Response> => {
      const reqOptions: RequestInit = { ...options };
      const headers = new Headers(reqOptions.headers || {});
      if (latestTokenRef.current) {
        headers.set('Authorization', `Bearer ${latestTokenRef.current}`);
      }
      reqOptions.headers = headers;
      reqOptions.credentials = reqOptions.credentials || 'include';

      let response = await fetch(url, reqOptions);

      // If token expired right at call time, refresh and retry once transparently
      if (response.status === 401) {
        const refreshed = await refreshSession();
        if (refreshed && latestTokenRef.current) {
          const retryHeaders = new Headers(options.headers || {});
          retryHeaders.set('Authorization', `Bearer ${latestTokenRef.current}`);
          reqOptions.headers = retryHeaders;
          response = await fetch(url, reqOptions);
        }
      }

      return response;
    },
    [refreshSession]
  );

  // Validate or silently re-authenticate session on mount
  useEffect(() => {
    const initAuth = async () => {
      let hasSession = false;
      try {
        hasSession = localStorage.getItem('cartpilot_has_session') === 'true';
      } catch {}

      if (hasSession) {
        await refreshSession();
      }
      setIsLoading(false);
    };
    initAuth();
  }, [refreshSession]);

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        const accessToken = data.data.accessToken;
        const profile: UserProfile = {
          id: data.data.user.id || data.data.user.userId,
          email: data.data.user.email,
          name: data.data.user.name,
          role: data.data.user.role,
          merchantId: data.data.user.merchantId,
          isStaff: data.data.user.isStaff,
          staffPermissions: data.data.user.staffPermissions,
          mustChangePassword: data.data.user.mustChangePassword,
        };

        setToken(accessToken);
        setUser(profile);
        setIsSessionExpired(false);

        return {
          success: true,
          role: profile.role,
          mustChangePassword: profile.mustChangePassword,
        };
      } else {
        return { success: false, error: data.error?.message || 'Invalid email or password' };
      }
    } catch {
      return {
        success: false,
        error: 'Cannot reach backend server. Please verify connection.',
      };
    }
  };

  const register = async (name: string, email: string, password: string, phone?: string) => {
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name, email, password, phone, role: 'CUSTOMER' }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        const accessToken = data.data.accessToken;
        const profile: UserProfile = {
          id: data.data.user.id || data.data.user.userId,
          email: data.data.user.email,
          name: data.data.user.name,
          role: data.data.user.role,
        };

        setToken(accessToken);
        setUser(profile);
        setIsSessionExpired(false);

        return { success: true, role: profile.role };
      } else {
        return { success: false, error: data.error?.message || 'Registration failed' };
      }
    } catch {
      return {
        success: false,
        error: 'Cannot reach backend server. Please verify connection.',
      };
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await fetch(`${API_BASE}/auth/logout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          credentials: 'include',
        });
      }
    } catch {
      // Ignored during client teardown
    } finally {
      setToken(null);
      setUser(null);
      setIsSessionExpired(false);
      try { localStorage.removeItem('cartpilot_has_session'); } catch {}
    }
  };

  const logoutAll = async () => {
    try {
      if (token) {
        await fetch(`${API_BASE}/auth/logout-all`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          credentials: 'include',
        });
      }
    } catch {
      // Ignored
    } finally {
      setToken(null);
      setUser(null);
      setIsSessionExpired(false);
    }
  };

  const switchRoleQuick = async (role: UserRole): Promise<boolean> => {
    if (DEMO_CREDENTIALS) {
      const creds = DEMO_CREDENTIALS[role];
      const result = await login(creds.email, creds.password);
      return result.success;
    }
    throw new Error('Quick role switcher is disabled in production environments.');
  };

  const dismissSessionExpired = () => {
    setIsSessionExpired(false);
  };

  const setSession = (accessToken: string, userProfile: UserProfile) => {
    setToken(accessToken);
    setUser(userProfile);
    setIsSessionExpired(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isSessionExpired,
        dismissSessionExpired,
        login,
        register,
        logout,
        logoutAll,
        refreshSession,
        authFetch,
        switchRoleQuick,
        setUserProfile: setUser,
        setSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
