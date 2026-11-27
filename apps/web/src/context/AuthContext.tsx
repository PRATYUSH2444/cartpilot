import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth as useClerkAuth, useUser as useClerkUser, useClerk } from '@clerk/clerk-react';
import { DEMO_CREDENTIALS } from '../config/demo-credentials';
import { API_BASE } from '../config/api';

const hasClerk = Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);

interface ClerkAuthBridgeProps {
  onClerkAuth: (authData: {
    isSignedIn: boolean;
    getToken: () => Promise<string | null>;
    clerkUser: any;
    signOut: () => Promise<void>;
  }) => void;
}

const ClerkBridge: React.FC<ClerkAuthBridgeProps> = ({ onClerkAuth }) => {
  const { isLoaded, isSignedIn, getToken } = useClerkAuth();
  const { user: clerkUser } = useClerkUser();
  const { signOut } = useClerk();

  useEffect(() => {
    if (!isLoaded) return;
    onClerkAuth({
      isSignedIn: Boolean(isSignedIn),
      getToken,
      clerkUser,
      signOut,
    });
  }, [isLoaded, isSignedIn, clerkUser, getToken, signOut, onClerkAuth]);

  return null;
};

export type UserRole = 'CUSTOMER' | 'MERCHANT' | 'ADMIN';

export type AuthStatus =
  | 'INITIALIZING'
  | 'AUTHENTICATED'
  | 'UNAUTHENTICATED'
  | 'REFRESHING'
  | 'SESSION_EXPIRED'
  | 'ERROR';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  clerkUserId?: string;
  merchantId?: string;
  isStaff?: boolean;
  staffPermissions?: string[];
  mustChangePassword?: boolean;
  isEmailVerified?: boolean;
  hasSeenTour?: boolean;
  experienceRating?: number;
}

export interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  authStatus: AuthStatus;
  isLoading: boolean;
  isAuthenticated: boolean;
  isSessionExpired: boolean;
  dismissSessionExpired: () => void;
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; role?: UserRole; error?: string; mustChangePassword?: boolean }>;
  sendPhoneOtp: (
    phone: string,
    purpose?: string
  ) => Promise<{
    success: boolean;
    error?: string;
    message?: string;
    simulatedCode?: string;
    expiresInSeconds?: number;
  }>;
  loginWithPhoneOtp: (
    phone: string,
    code: string,
    name?: string
  ) => Promise<{ success: boolean; role?: UserRole; error?: string }>;
  register: (
    name: string,
    email: string,
    password: string,
    phone?: string
  ) => Promise<{ success: boolean; role?: UserRole; error?: string }>;
  sendEmailVerification: () => Promise<{
    success: boolean;
    message?: string;
    simulatedCode?: string;
    expiresInSeconds?: number;
    error?: string;
  }>;
  verifyEmail: (code: string) => Promise<{
    success: boolean;
    message?: string;
    error?: string;
  }>;
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
  // Pure in-memory token state — XSS-safe (no access tokens in localStorage)
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [authStatus, setAuthStatus] = useState<AuthStatus>('INITIALIZING');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSessionExpired, setIsSessionExpired] = useState<boolean>(false);

  // Synchronization refs
  const latestTokenRef = useRef<string | null>(token);
  const activeRefreshPromiseRef = useRef<Promise<boolean> | null>(null);
  const authChannelRef = useRef<BroadcastChannel | null>(null);
  const clerkGetTokenRef = useRef<(() => Promise<string | null>) | null>(null);
  const clerkSignOutRef = useRef<(() => Promise<void>) | null>(null);
  const clerkUserIdRef = useRef<string | null>(null);

  const handleClerkAuth = useCallback(async ({ isSignedIn, getToken, clerkUser, signOut }: any) => {
    clerkGetTokenRef.current = getToken;
    clerkSignOutRef.current = signOut;

    if (isSignedIn && clerkUser) {
      try {
        const freshToken = await getToken();
        latestTokenRef.current = freshToken;
        setToken(freshToken);

        const email = clerkUser.primaryEmailAddress?.emailAddress;
        const phone = clerkUser.primaryPhoneNumber?.phoneNumber;
        const name = clerkUser.fullName || clerkUser.firstName || 'Shopper';

        clerkUserIdRef.current = clerkUser.id;
        try {
          localStorage.setItem('cartpilot_clerk_user_id', clerkUser.id);
          if (email) localStorage.setItem('cartpilot_user_email', email);
        } catch {}

        const res = await fetch(`${API_BASE}/auth/sync`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(freshToken ? { Authorization: `Bearer ${freshToken}` } : {}),
          },
          credentials: 'include',
          body: JSON.stringify({
            clerkUserId: clerkUser.id,
            email,
            name,
            phone,
            isEmailVerified: clerkUser.primaryEmailAddress?.verification?.status === 'verified',
            isPhoneVerified: clerkUser.primaryPhoneNumber?.verification?.status === 'verified',
          }),
        });

        if (res.ok) {
          const d = await res.json();
          const profile: UserProfile = {
            id: d.data.user.id,
            clerkUserId: clerkUser.id,
            email: d.data.user.email,
            name: d.data.user.name,
            role: d.data.user.role,
            phone: d.data.user.phone,
            merchantId: d.data.user.merchantId,
            isStaff: d.data.user.isStaff,
            staffPermissions: d.data.user.staffPermissions,
            mustChangePassword: d.data.user.mustChangePassword,
            isEmailVerified: d.data.user.isEmailVerified ?? (clerkUser.primaryEmailAddress?.verification?.status === 'verified'),
          };
          const resolvedToken = d.data.accessToken || freshToken;
          latestTokenRef.current = resolvedToken;
          setToken(resolvedToken);
          setUser(profile);
          setAuthStatus('AUTHENTICATED');
          setIsLoading(false);
          setIsSessionExpired(false);
          try {
            localStorage.setItem('cartpilot_has_session', 'true');
            localStorage.setItem('cartpilot_user_role', profile.role);
            localStorage.setItem('cartpilot_auth_provider', 'clerk');
          } catch {}
          return;
        }
      } catch (err) {
        console.warn('Clerk user sync error:', err);
      }
    } else if (hasClerk && !isSignedIn) {
      // CRITICAL SAFEGUARD: Do NOT wipe active Native or Admin sessions!
      // Only clear if the active provider was Clerk or no session exists.
      const authProvider = typeof window !== 'undefined' ? localStorage.getItem('cartpilot_auth_provider') : null;
      const storedRole = typeof window !== 'undefined' ? localStorage.getItem('cartpilot_user_role') || sessionStorage.getItem('cartpilot_user_role') : null;
      const hasNativeSession = typeof window !== 'undefined' && localStorage.getItem('cartpilot_has_session') === 'true';

      if (authProvider === 'native' || storedRole === 'ADMIN' || sessionStorage.getItem('cartpilot_admin_token') || (hasNativeSession && authProvider !== 'clerk')) {
        // Native JWT session is active — do not wipe it!
        return;
      }

      setUser(null);
      setToken(null);
      latestTokenRef.current = null;
      setAuthStatus('UNAUTHENTICATED');
      setIsLoading(false);
      try {
        localStorage.removeItem('cartpilot_has_session');
        localStorage.removeItem('cartpilot_user_role');
        localStorage.removeItem('cartpilot_auth_provider');
      } catch {}
    }
  }, []);

  useEffect(() => {
    latestTokenRef.current = token;
  }, [token]);

  // Derived convenience boolean
  const isAuthenticated = Boolean(user && token && (authStatus === 'AUTHENTICATED' || authStatus === 'REFRESHING'));

  // Single-flight atomic session refresh with mutex & cookie support
  const refreshSession = useCallback(async (): Promise<boolean> => {
    // If a refresh is already in-flight, reuse it (prevents concurrent race conditions)
    if (activeRefreshPromiseRef.current) {
      return activeRefreshPromiseRef.current;
    }

    const refreshPromise = (async (): Promise<boolean> => {
      const authProvider = typeof window !== 'undefined' ? localStorage.getItem('cartpilot_auth_provider') : null;

      // Handle Clerk session refresh: re-sync with backend to maintain valid backend JWT
      if (authProvider === 'clerk') {
        if (clerkGetTokenRef.current) {
          try {
            const freshClerkToken = await clerkGetTokenRef.current();
            if (freshClerkToken) {
              const clerkId = clerkUserIdRef.current || (typeof window !== 'undefined' ? localStorage.getItem('cartpilot_clerk_user_id') : null) || user?.clerkUserId || user?.id;
              const userEmail = user?.email || (typeof window !== 'undefined' ? localStorage.getItem('cartpilot_user_email') : null) || '';
              const res = await fetch(`${API_BASE}/auth/sync`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${freshClerkToken}`,
                },
                credentials: 'include',
                body: JSON.stringify({
                  clerkUserId: clerkId,
                  email: userEmail,
                  name: user?.name,
                }),
              });
              if (res.ok) {
                const d = await res.json();
                const resolvedToken = d.data?.accessToken || freshClerkToken;
                latestTokenRef.current = resolvedToken;
                setToken(resolvedToken);
                setAuthStatus('AUTHENTICATED');
                setIsSessionExpired(false);
                return true;
              }
              latestTokenRef.current = freshClerkToken;
              setToken(freshClerkToken);
              setAuthStatus('AUTHENTICATED');
              return true;
            }
          } catch (err) {
            console.warn('Clerk session re-sync error:', err);
          }
        }
        return false;
      }

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
            phone: data.data.user.phone,
            merchantId: data.data.user.merchantId,
            isStaff: data.data.user.isStaff,
            staffPermissions: data.data.user.staffPermissions,
            mustChangePassword: data.data.user.mustChangePassword,
            isEmailVerified: data.data.user.isEmailVerified,
          };

          latestTokenRef.current = data.data.accessToken;
          setToken(data.data.accessToken);
          setUser(profile);
          setAuthStatus('AUTHENTICATED');
          setIsSessionExpired(false);

          try {
            localStorage.setItem('cartpilot_has_session', 'true');
            localStorage.setItem('cartpilot_user_role', profile.role);
          } catch {}

          return true;
        } else {
          // Only clear if this was an active native session
          if (authProvider === 'native') {
            latestTokenRef.current = null;
            setToken(null);
            setUser(null);
            setAuthStatus('UNAUTHENTICATED');
            try {
              localStorage.removeItem('cartpilot_has_session');
              localStorage.removeItem('cartpilot_user_role');
              localStorage.removeItem('cartpilot_auth_provider');
            } catch {}
          }
          return false;
        }
      } catch {
        if (authProvider === 'native') {
          latestTokenRef.current = null;
          setToken(null);
          setUser(null);
          setAuthStatus('UNAUTHENTICATED');
        }
        return false;
      } finally {
        activeRefreshPromiseRef.current = null;
      }
    })();

    activeRefreshPromiseRef.current = refreshPromise;
    return refreshPromise;
  }, []);

  // BroadcastChannel multi-tab synchronization
  useEffect(() => {
    if (typeof window === 'undefined' || !('BroadcastChannel' in window)) return;
    try {
      const channel = new BroadcastChannel('cartpilot_auth_sync');
      authChannelRef.current = channel;

      channel.onmessage = (event) => {
        if (!event.data) return;
        const { type } = event.data;
        if (type === 'AUTH_LOGOUT') {
          latestTokenRef.current = null;
          setToken(null);
          setUser(null);
          setAuthStatus('UNAUTHENTICATED');
          try {
            localStorage.removeItem('cartpilot_has_session');
            localStorage.removeItem('cartpilot_user_role');
          } catch {}
        } else if (type === 'AUTH_LOGIN' || type === 'AUTH_REFRESH') {
          refreshSession();
        }
      };

      return () => {
        channel.close();
      };
    } catch {
      // BroadcastChannel optional fallback
    }
  }, [refreshSession]);

  // Proactive automated token refresh timer: refreshes before access token expires
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
          const timeUntilExp = expMs - now;

          // If already expired or expiring within 60s, refresh immediately
          if (timeUntilExp <= 60000) {
            refreshSession();
            return;
          }

          // Cap timer at 24 hours (86,400,000 ms) to avoid 32-bit signed int overflow in setTimeout (max ~24.8 days)
          const MAX_TIMEOUT_MS = 24 * 60 * 60 * 1000;
          const delay = Math.min(Math.max(timeUntilExp - 60000, 30000), MAX_TIMEOUT_MS);
          const timer = setTimeout(() => {
            refreshSession();
          }, delay);
          return () => clearTimeout(timer);
        }
      }
    } catch {
      // Fallback: 15 minutes
      const timer = setTimeout(() => {
        refreshSession();
      }, 15 * 60 * 1000);
      return () => clearTimeout(timer);
    }
  }, [token, refreshSession]);

  // Silent session restoration on application startup / refresh
  useEffect(() => {
    let isMounted = true;
    const initAuth = async () => {
      // 1. Check for private Master Admin session first
      if (typeof window !== 'undefined') {
        const adminToken = sessionStorage.getItem('cartpilot_admin_token');
        const adminUserStr = sessionStorage.getItem('cartpilot_admin_user');
        if (adminToken && adminUserStr) {
          try {
            const adminUser = JSON.parse(adminUserStr);
            if (adminUser.role === 'ADMIN') {
              latestTokenRef.current = adminToken;
              setToken(adminToken);
              setUser(adminUser);
              setAuthStatus('AUTHENTICATED');
              setIsLoading(false);
              return;
            }
          } catch {}
        }
      }

      const authProvider = typeof window !== 'undefined' ? localStorage.getItem('cartpilot_auth_provider') : null;
      const hasSession = typeof window !== 'undefined' && localStorage.getItem('cartpilot_has_session') === 'true';

      // When Clerk was specifically used to authenticate, Clerk handles restoration via ClerkBridge
      if (hasClerk && authProvider === 'clerk') {
        return;
      }

      try {
        setAuthStatus('INITIALIZING');
        setIsLoading(true);

        if (!hasSession) {
          if (isMounted) {
            setAuthStatus('UNAUTHENTICATED');
            setIsLoading(false);
          }
          return;
        }

        const restored = await refreshSession();
        if (!restored && isMounted) {
          setAuthStatus('UNAUTHENTICATED');
        }
      } catch {
        if (isMounted) setAuthStatus('UNAUTHENTICATED');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    initAuth();
    return () => {
      isMounted = false;
    };
  }, [refreshSession]);

  // Unified authenticated fetch with automatic token retrieval
  const authFetch = useCallback(
    async (url: string, options: RequestInit = {}): Promise<Response> => {
      const reqOptions: RequestInit = { ...options };
      const headers = new Headers(reqOptions.headers || {});

      // Use active backend JWT token; only fetch fresh Clerk token if current token is missing
      let currentToken = latestTokenRef.current;
      if (!currentToken && clerkGetTokenRef.current) {
        try {
          const fresh = await clerkGetTokenRef.current();
          if (fresh) {
            currentToken = fresh;
            latestTokenRef.current = fresh;
            setToken(fresh);
          }
        } catch {}
      }

      if (currentToken) {
        headers.set('Authorization', `Bearer ${currentToken}`);
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
          phone: data.data.user.phone,
          merchantId: data.data.user.merchantId,
          isStaff: data.data.user.isStaff,
          staffPermissions: data.data.user.staffPermissions,
          mustChangePassword: data.data.user.mustChangePassword,
          isEmailVerified: data.data.user.isEmailVerified,
        };

        latestTokenRef.current = accessToken;
        setToken(accessToken);
        setUser(profile);
        setAuthStatus('AUTHENTICATED');
        setIsSessionExpired(false);

        try {
          localStorage.setItem('cartpilot_has_session', 'true');
          localStorage.setItem('cartpilot_user_role', profile.role);
          localStorage.setItem('cartpilot_auth_provider', 'native');
          authChannelRef.current?.postMessage({
            type: 'AUTH_LOGIN',
            role: profile.role,
            user: profile,
          });
        } catch {}

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

  const sendPhoneOtp = async (phone: string, purpose: string = 'PHONE_LOGIN') => {
    try {
      const res = await fetch(`${API_BASE}/auth/phone/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ phone, purpose }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        return {
          success: true,
          message: data.data?.message || 'OTP sent successfully',
          simulatedCode: data.data?.simulatedCode,
          expiresInSeconds: data.data?.expiresInSeconds || 600,
        };
      } else {
        return {
          success: false,
          error: data.error?.message || data.message || 'Failed to send OTP. Please check the mobile number.',
        };
      }
    } catch {
      return {
        success: false,
        error: 'Cannot reach backend server. Please verify connection.',
      };
    }
  };

  const loginWithPhoneOtp = async (phone: string, code: string, name?: string) => {
    try {
      const res = await fetch(`${API_BASE}/auth/phone/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ phone, code, name }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const accessToken = data.data.accessToken;
        const profile: UserProfile = {
          id: data.data.user.id || data.data.user.userId,
          email: data.data.user.email,
          name: data.data.user.name,
          role: data.data.user.role,
          phone: data.data.user.phone,
          merchantId: data.data.user.merchantId,
          isStaff: data.data.user.isStaff,
          staffPermissions: data.data.user.staffPermissions,
          mustChangePassword: data.data.user.mustChangePassword,
          isEmailVerified: data.data.user.isEmailVerified,
        };

        latestTokenRef.current = accessToken;
        setToken(accessToken);
        setUser(profile);
        setAuthStatus('AUTHENTICATED');
        setIsSessionExpired(false);

        try {
          localStorage.setItem('cartpilot_has_session', 'true');
          localStorage.setItem('cartpilot_user_role', profile.role);
          localStorage.setItem('cartpilot_auth_provider', 'native');
          authChannelRef.current?.postMessage({
            type: 'AUTH_LOGIN',
            role: profile.role,
            user: profile,
          });
        } catch {}

        return {
          success: true,
          role: profile.role,
        };
      } else {
        return {
          success: false,
          error: data.error?.message || data.message || 'Invalid or expired OTP code.',
        };
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
          isEmailVerified: data.data.user.isEmailVerified ?? false,
        };

        latestTokenRef.current = accessToken;
        setToken(accessToken);
        setUser(profile);
        setAuthStatus('AUTHENTICATED');
        setIsSessionExpired(false);

        try {
          localStorage.setItem('cartpilot_has_session', 'true');
          localStorage.setItem('cartpilot_user_role', profile.role);
          localStorage.setItem('cartpilot_auth_provider', 'native');
          authChannelRef.current?.postMessage({
            type: 'AUTH_LOGIN',
            role: profile.role,
            user: profile,
          });
        } catch {}

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

  const sendEmailVerification = async () => {
    try {
      const res = await authFetch(`${API_BASE}/auth/email/send-verification`, {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        return {
          success: true,
          message: data.data?.message || 'Verification code sent to your email',
          simulatedCode: data.data?.simulatedCode,
          expiresInSeconds: data.data?.expiresInSeconds || 900,
        };
      } else {
        return {
          success: false,
          error: data.error?.message || data.message || 'Failed to send verification code',
        };
      }
    } catch {
      return {
        success: false,
        error: 'Network error sending verification email',
      };
    }
  };

  const verifyEmail = async (code: string) => {
    try {
      const res = await authFetch(`${API_BASE}/auth/email/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setUser((prev) => (prev ? { ...prev, isEmailVerified: true } : prev));
        return {
          success: true,
          message: data.data?.message || 'Email verified successfully',
        };
      } else {
        return {
          success: false,
          error: data.error?.message || data.message || 'Invalid or expired verification code',
        };
      }
    } catch {
      return {
        success: false,
        error: 'Network error verifying email',
      };
    }
  };

  const logout = async () => {
    try {
      if (clerkSignOutRef.current) {
        try {
          await clerkSignOutRef.current();
        } catch {}
      }
      if (latestTokenRef.current) {
        await fetch(`${API_BASE}/auth/logout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${latestTokenRef.current}` },
          credentials: 'include',
        });
      }
    } catch {
      // Ignored during client teardown
    } finally {
      latestTokenRef.current = null;
      setToken(null);
      setUser(null);
      setAuthStatus('UNAUTHENTICATED');
      setIsSessionExpired(false);
      try {
        localStorage.removeItem('cartpilot_has_session');
        localStorage.removeItem('cartpilot_user_role');
        localStorage.removeItem('cartpilot_auth_provider');
        if (clerkSignOutRef.current) {
          clerkSignOutRef.current().catch(() => {});
        }
        sessionStorage.removeItem('cartpilot_admin_token');
        sessionStorage.removeItem('cartpilot_admin_user');
        sessionStorage.removeItem('cartpilot_redirect');
        authChannelRef.current?.postMessage({ type: 'AUTH_LOGOUT' });
      } catch {}
    }
  };

  const logoutAll = async () => {
    try {
      if (latestTokenRef.current) {
        await fetch(`${API_BASE}/auth/logout-all`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${latestTokenRef.current}` },
          credentials: 'include',
        });
      }
    } catch {
      // Ignored
    } finally {
      latestTokenRef.current = null;
      setToken(null);
      setUser(null);
      setAuthStatus('UNAUTHENTICATED');
      setIsSessionExpired(false);
      try {
        localStorage.removeItem('cartpilot_has_session');
        localStorage.removeItem('cartpilot_user_role');
        localStorage.removeItem('cartpilot_auth_provider');
        if (clerkSignOutRef.current) {
          clerkSignOutRef.current().catch(() => {});
        }
        sessionStorage.removeItem('cartpilot_admin_token');
        sessionStorage.removeItem('cartpilot_admin_user');
        sessionStorage.removeItem('cartpilot_redirect');
        authChannelRef.current?.postMessage({ type: 'AUTH_LOGOUT' });
      } catch {}
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
    latestTokenRef.current = accessToken;
    setToken(accessToken);
    setUser(userProfile);
    setAuthStatus('AUTHENTICATED');
    setIsSessionExpired(false);
    try {
      localStorage.setItem('cartpilot_has_session', 'true');
      localStorage.setItem('cartpilot_user_role', userProfile.role);
      if (userProfile.role === 'ADMIN') {
        sessionStorage.setItem('cartpilot_admin_token', accessToken);
        sessionStorage.setItem('cartpilot_admin_user', JSON.stringify(userProfile));
      }
    } catch {}
  };

  return (
    <>
      {hasClerk && <ClerkBridge onClerkAuth={handleClerkAuth} />}
      <AuthContext.Provider
        value={{
          user,
          token,
          authStatus,
          isLoading,
          isAuthenticated,
          isSessionExpired,
          dismissSessionExpired,
          login,
          sendPhoneOtp,
          loginWithPhoneOtp,
          register,
          sendEmailVerification,
          verifyEmail,
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
    </>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
