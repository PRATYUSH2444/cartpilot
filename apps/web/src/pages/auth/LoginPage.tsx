import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth, UserRole } from '../../context/AuthContext';
import {
  ShieldCheck,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  User,
  Store,
  ShieldAlert,
  Eye,
  EyeOff,
} from 'lucide-react';

import { DEMO_CREDENTIALS } from '../../config/demo-credentials';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showDevShortcuts, setShowDevShortcuts] = useState(true);

  const { login, user, isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // If already authenticated, redirect straight to user's authorized workspace or saved redirect
  React.useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      let targetPath = '';
      try {
        targetPath = sessionStorage.getItem('cartpilot_redirect') || '';
        sessionStorage.removeItem('cartpilot_redirect');
      } catch {}

      if (!targetPath || targetPath === '/login') {
        targetPath = user.role === 'MERCHANT' ? '/merchant' : user.role === 'ADMIN' ? '/admin' : '/shopper';
      }
      navigate(targetPath, { replace: true });
    }
  }, [authLoading, isAuthenticated, user, navigate]);

  const handleLogin = async (
    e?: React.FormEvent,
    customEmail?: string,
    customPassword?: string
  ) => {
    if (e) e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    const loginEmail = customEmail || email;
    const loginPassword = customPassword || password;

    const result = await login(loginEmail, loginPassword);
    setIsLoading(false);

    if (result.success && result.role) {
      let destination = '';
      try {
        destination = sessionStorage.getItem('cartpilot_redirect') || '';
        sessionStorage.removeItem('cartpilot_redirect');
      } catch {}

      const locationState = location.state as { from?: { pathname?: string } } | null;
      const fromPath = destination || locationState?.from?.pathname;

      if (fromPath && fromPath !== '/login') {
        navigate(fromPath, { replace: true });
        return;
      }
      if (result.role === 'CUSTOMER') {
        navigate('/shopper', { replace: true });
      } else if (result.role === 'MERCHANT') {
        navigate('/merchant', { replace: true });
      } else if (result.role === 'ADMIN') {
        navigate('/admin', { replace: true });
      }
    } else {
      setErrorMessage(result.error || 'Login failed. Please check your email and password.');
    }
  };

  const handleQuickLogin = (role: UserRole) => {
    if (!DEMO_CREDENTIALS) return;
    const target = DEMO_CREDENTIALS[role];
    if (!target) return;
    setEmail(target.email);
    setPassword(target.password);
    handleLogin(undefined, target.email, target.password);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-8 bg-paper font-sans text-ink relative overflow-hidden">
      {/* Decorative ambient backdrop */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 rounded-full bg-acc/10 blur-3xl pointer-events-none" />

      {/* Main card */}
      <div className="w-full max-w-md bg-card border border-brd rounded-2xl shadow-xl p-8 relative z-10 backdrop-blur-md">
        {/* Brand identity */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-acc flex items-center justify-center text-white mb-3 shadow-lg shadow-acc/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div className="flex items-center gap-2">
            <h1 className="font-display font-extrabold text-2xl text-ink tracking-tight">
              CartPilot
            </h1>
            <span className="text-[10px] font-mono uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-500/20">
              100% Vegetarian
            </span>
          </div>
          <p className="text-xs text-mut mt-1">Policy-Controlled Agentic Commerce Gateway</p>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Sign In Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-ink mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-mut absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-brd bg-paper/60 text-xs text-ink placeholder:text-mut focus:outline-none focus:ring-2 focus:ring-acc/20 focus:border-acc transition-all"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-ink">Password</label>
              <Link
                to="/forgot-password"
                className="text-[11px] text-acc hover:underline font-medium"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-mut absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-brd bg-paper/60 text-xs text-ink placeholder:text-mut focus:outline-none focus:ring-2 focus:ring-acc/20 focus:border-acc transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-mut hover:text-ink transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 rounded-xl bg-acc text-white font-semibold text-xs hover:bg-blue-600 active:scale-[0.99] transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <span>Sign In to Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Links to register and become merchant */}
        <div className="mt-5 pt-4 border-t border-brd text-center text-xs space-y-2">
          <div className="text-mut">
            <span>Don&apos;t have an account? </span>
            <Link to="/register" className="text-acc font-semibold hover:underline">
              Create Customer Account
            </Link>
          </div>
          <div className="text-mut text-[11px]">
            <span>Want to sell on CartPilot? </span>
            <Link to="/become-merchant" className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline">
              Apply as a Merchant →
            </Link>
          </div>
        </div>

        {/* Development Quick-Fill Accordion (Gated behind import.meta.env.DEV) */}
        {import.meta.env.DEV && DEMO_CREDENTIALS && (
          <div className="mt-6 pt-4 border-t border-dashed border-brd">
            <button
              type="button"
              onClick={() => setShowDevShortcuts(!showDevShortcuts)}
              className="w-full flex items-center justify-between text-[11px] font-semibold text-mut hover:text-ink transition-colors py-1"
            >
              <span className="flex items-center gap-1.5">
                <span>🛠️ Development Quick Sign-In</span>
                <span className="text-[9px] uppercase px-1.5 py-0.2 bg-paper rounded border border-brd">
                  Pre-Seeded
                </span>
              </span>
              {showDevShortcuts ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>

            {showDevShortcuts && (
              <div className="mt-2.5 space-y-1.5">
                <button
                  type="button"
                  onClick={() => handleQuickLogin('CUSTOMER')}
                  disabled={isLoading}
                  className="w-full p-2 rounded-lg bg-paper/80 hover:bg-paper border border-brd text-left flex items-center justify-between text-xs transition-colors group"
                >
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-emerald-500" />
                    <div>
                      <span className="font-semibold text-ink block text-[11px]">
                        Shopper (Priya Sharma)
                      </span>
                      <span className="font-mono text-[10px] text-mut">customer@example.com</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-acc font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    Sign In →
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLogin('MERCHANT')}
                  disabled={isLoading}
                  className="w-full p-2 rounded-lg bg-paper/80 hover:bg-paper border border-brd text-left flex items-center justify-between text-xs transition-colors group"
                >
                  <div className="flex items-center gap-2">
                    <Store className="w-3.5 h-3.5 text-blue-500" />
                    <div>
                      <span className="font-semibold text-ink block text-[11px]">
                        Merchant (Fresh Greens Organics)
                      </span>
                      <span className="font-mono text-[10px] text-mut">merchant@example.com</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-acc font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    Sign In →
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLogin('ADMIN')}
                  disabled={isLoading}
                  className="w-full p-2 rounded-lg bg-paper/80 hover:bg-paper border border-brd text-left flex items-center justify-between text-xs transition-colors group"
                >
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-3.5 h-3.5 text-purple-500" />
                    <div>
                      <span className="font-semibold text-ink block text-[11px]">
                        Administrator (Compliance & GRC)
                      </span>
                      <span className="font-mono text-[10px] text-mut">admin@example.com</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-acc font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    Sign In →
                  </span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
