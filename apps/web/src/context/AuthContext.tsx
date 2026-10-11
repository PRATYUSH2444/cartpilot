import React, { createContext, useContext, useState, useEffect } from 'react';

export type UserRole = 'CUSTOMER' | 'MERCHANT' | 'ADMIN';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  merchantId?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; role?: UserRole; error?: string }>;
  register: (
    name: string,
    email: string,
    password: string,
    phone?: string
  ) => Promise<{ success: boolean; role?: UserRole; error?: string }>;
  logout: () => Promise<void>;
  switchRoleQuick: (role: UserRole) => Promise<boolean>;
}

const API_BASE = 'http://localhost:5000/api/v1';
const TOKEN_KEY = 'cartpilot_auth_token';
const USER_KEY = 'cartpilot_user';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const savedUser = localStorage.getItem(USER_KEY);
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem(TOKEN_KEY);
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Validate session on mount
  useEffect(() => {
    const verifySession = async () => {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/auth/me`, {
          headers: { Authorization: `Bearer ${storedToken}` },
        });

        if (res.ok) {
          const data = await res.json();
          const profile: UserProfile = {
            id: data.data.id || data.data.userId,
            email: data.data.email,
            name: data.data.name,
            role: data.data.role,
            merchantId: data.data.merchantId,
          };
          setUser(profile);
          setToken(storedToken);
          localStorage.setItem(USER_KEY, JSON.stringify(profile));
        } else {
          // Token invalid or expired
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(USER_KEY);
          setUser(null);
          setToken(null);
        }
      } catch {
        // Network error during startup, preserve existing cached session if any
      } finally {
        setIsLoading(false);
      }
    };

    verifySession();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
        };

        setToken(accessToken);
        setUser(profile);
        localStorage.setItem(TOKEN_KEY, accessToken);
        localStorage.setItem(USER_KEY, JSON.stringify(profile));

        return { success: true, role: profile.role };
      } else {
        return { success: false, error: data.error?.message || 'Invalid credentials' };
      }
    } catch {
      return {
        success: false,
        error: 'Cannot reach backend server. Please verify API is running.',
      };
    }
  };

  const register = async (name: string, email: string, password: string, phone?: string) => {
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
        localStorage.setItem(TOKEN_KEY, accessToken);
        localStorage.setItem(USER_KEY, JSON.stringify(profile));

        return { success: true, role: profile.role };
      } else {
        return { success: false, error: data.error?.message || 'Registration failed' };
      }
    } catch {
      return {
        success: false,
        error: 'Cannot reach backend server. Please verify API is running.',
      };
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await fetch(`${API_BASE}/auth/logout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch {
      // Ignore network errors on logout
    } finally {
      setToken(null);
      setUser(null);
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }
  };

  // Development-mode quick login helper
  const switchRoleQuick = async (role: UserRole): Promise<boolean> => {
    const roleCreds = {
      CUSTOMER: { email: 'customer@example.com', password: 'Customer1234!' },
      MERCHANT: { email: 'merchant@example.com', password: 'Merchant1234!' },
      ADMIN: { email: 'admin@example.com', password: 'Admin1234!' },
    };

    const creds = roleCreds[role];
    const result = await login(creds.email, creds.password);
    return result.success;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        logout,
        switchRoleQuick,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
