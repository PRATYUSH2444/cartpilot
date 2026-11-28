import React, { useState, useEffect } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { SignUpButton } from '@clerk/clerk-react';
import { useAuth } from '../../context/AuthContext';
import {
  ShieldCheck,
  Lock,
  Mail,
  User,
  Phone,
  ArrowRight,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Eye,
  EyeOff,
  Leaf,
  Sparkles,
  Clock,
  CreditCard,
  Sun,
  Moon,
} from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Light / Dark Theme State (Default to Light)
  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      return localStorage.getItem('cartpilot_theme') === 'dark';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      if (isDark) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('cartpilot_theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('cartpilot_theme', 'light');
      }
    } catch {}
  }, [isDark]);

  const toggleTheme = () => setIsDark((prev) => !prev);

  const { register, isAuthenticated, user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Immediate synchronous guard: never render register page if already authenticated
  if (!authLoading && isAuthenticated && user) {
    const target = user.role === 'MERCHANT' ? '/merchant' : user.role === 'ADMIN' ? '/admin' : '/shopper';
    return <Navigate to={target} replace />;
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim()) {
      setErrorMessage('Please enter your full name');
      return;
    }

    if (!email.trim()) {
      setErrorMessage('Please enter your email address');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match');
      return;
    }

    if (password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
      setErrorMessage(
        'Password must be at least 8 characters with at least one uppercase letter and one number'
      );
      return;
    }

    setIsLoading(true);
    const fullPhone = phone.trim() ? (phone.startsWith('+91') ? phone.trim() : `+91${phone.trim()}`) : undefined;
    const result = await register(name.trim(), email.trim(), password, fullPhone);
    setIsLoading(false);

    if (result.success) {
      navigate('/shopper', { replace: true });
    } else {
      setErrorMessage(result.error || 'Registration failed. Please check your details.');
    }
  };

  return (
    <div className="w-full h-[100dvh] max-h-[100dvh] overflow-hidden flex flex-col lg:flex-row bg-[#FAFAF7] dark:bg-[#0E0F10] text-stone-900 dark:text-[#F2F3F4] select-none transition-colors duration-200">
      
      {/* ── Left Column: Brand Showcase (Desktop only >= 1024px) ──────────────── */}
      <aside className="hidden lg:flex lg:w-[46%] xl:w-[44%] shrink-0 h-full flex-col justify-between p-8 xl:p-12 border-r border-stone-200/80 dark:border-[#2A2D31] bg-gradient-to-br from-white via-[#F7F8F5] to-emerald-50/25 dark:from-[#0E0F10] dark:via-[#14171A] dark:to-emerald-950/20 relative overflow-hidden">
        {/* Subtle Ambient Glow */}
        <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-emerald-500/10 dark:bg-emerald-500/5 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full bg-teal-500/10 dark:bg-teal-500/5 blur-3xl pointer-events-none" />

        {/* Top Header: Brand & Theme Toggle */}
        <div className="flex items-center justify-between relative z-10">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
              <Leaf className="w-5 h-5 fill-white" />
            </div>
            <div>
              <span className="font-heading font-extrabold text-xl tracking-tight text-stone-900 dark:text-white leading-none block">
                CartPilot
              </span>
              <span className="text-[10px] font-mono tracking-widest text-emerald-700 dark:text-emerald-400 font-bold uppercase mt-0.5 block">
                PURE VEGETARIAN COMMERCE
              </span>
            </div>
          </Link>

          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-white dark:bg-[#1E2124] border border-stone-200 dark:border-[#2A2D31] text-stone-600 dark:text-stone-300 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors cursor-pointer shadow-2xs"
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>

        {/* Hero Value Showcase */}
        <div className="my-auto py-6 space-y-6 relative z-10">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100/70 dark:bg-emerald-950/50 border border-emerald-300/50 dark:border-emerald-700/50 text-[11px] font-bold text-emerald-800 dark:text-emerald-300">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Shopper Membership</span>
            </div>
            <h1 className="text-3xl xl:text-4xl font-heading font-black tracking-tight leading-[1.15] text-stone-900 dark:text-white">
              Join the Pure Veg <br />
              <span className="text-emerald-700 dark:text-emerald-400">Grocery Revolution</span>.
            </h1>
            <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed max-w-md">
              Enjoy automated morning deliveries, household budget guardrails, and fresh farm harvests delivered every morning.
            </p>
          </div>

          {/* Key Value Cards */}
          <div className="grid grid-cols-2 gap-3 max-w-lg">
            <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-[#16181A]/80 border border-stone-200/80 dark:border-[#2A2D31] shadow-2xs backdrop-blur-xs space-y-1">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="font-heading font-bold text-xs text-stone-900 dark:text-white">100% Certified Veg</span>
              </div>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">Strictly meat-free, organic certified pantry items.</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-[#16181A]/80 border border-stone-200/80 dark:border-[#2A2D31] shadow-2xs backdrop-blur-xs space-y-1">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="font-heading font-bold text-xs text-stone-900 dark:text-white">Order Till Midnight</span>
              </div>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">Next-day morning drops 6:00 AM – 10:00 AM.</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-[#16181A]/80 border border-stone-200/80 dark:border-[#2A2D31] shadow-2xs backdrop-blur-xs space-y-1">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="font-heading font-bold text-xs text-stone-900 dark:text-white">Zero Gateway Fees</span>
              </div>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">1-tap wallet checkout with zero transaction fees.</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-[#16181A]/80 border border-stone-200/80 dark:border-[#2A2D31] shadow-2xs backdrop-blur-xs space-y-1">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="font-heading font-bold text-xs text-stone-900 dark:text-white">Agentic AI Recipes</span>
              </div>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">Automatic meal ingredient calculation & auto-cart.</p>
            </div>
          </div>
        </div>

        {/* Bottom Navigation */}
        <div className="pt-4 border-t border-stone-200/60 dark:border-[#2A2D31] flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 relative z-10">
          <span>Already registered with CartPilot?</span>
          <Link to="/login" className="font-bold text-emerald-700 dark:text-emerald-400 hover:underline">
            Sign In to account →
          </Link>
        </div>
      </aside>

      {/* ── Right Column: Registration Form Panel ───────────────────────────── */}
      <main className="flex-1 h-full flex flex-col justify-between items-center px-4 py-5 sm:px-8 sm:py-8 lg:px-10 lg:py-6 overflow-y-auto lg:overflow-hidden relative">
        
        {/* Mobile Header Bar */}
        <div className="w-full flex lg:hidden items-center justify-between pb-3 shrink-0">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-700 text-white flex items-center justify-center shadow-2xs">
              <Leaf className="w-4 h-4 fill-white" />
            </div>
            <span className="font-heading font-extrabold text-lg text-stone-900 dark:text-white tracking-tight">
              CartPilot
            </span>
          </Link>

          <button
            type="button"
            onClick={toggleTheme}
            className="p-1.5 rounded-xl bg-stone-100 dark:bg-[#1E2124] border border-stone-200 dark:border-[#2A2D31] text-stone-600 dark:text-stone-300"
            title="Toggle Theme"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>

        {/* Central Registration Form Card */}
        <div className="w-full max-w-md my-auto space-y-4">
          
          <div className="text-left space-y-0.5">
            <div className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100/70 dark:bg-emerald-950/50 px-2.5 py-0.5 rounded-full mb-1">
              <span>Quick Registration</span>
            </div>
            <h2 className="font-heading font-extrabold text-xl sm:text-2xl text-stone-900 dark:text-white tracking-tight">
              Create Shopper Account
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Join CartPilot for policy-controlled autonomous grocery shopping.
            </p>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="truncate">{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleRegister} className="space-y-3">
            <div>
              <label className="block text-xs font-heading font-bold text-stone-700 dark:text-stone-300 mb-1">
                Full Name
              </label>
              <div className="flex items-center rounded-xl bg-white dark:bg-[#16181A] border border-stone-300 dark:border-[#2A2D31] px-3.5 py-2.5 focus-within:border-emerald-600 dark:focus-within:border-emerald-500 shadow-2xs">
                <User className="w-4 h-4 text-stone-400 mr-2 shrink-0" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Priya Sharma"
                  required
                  className="w-full bg-transparent text-xs font-medium text-stone-900 dark:text-white placeholder:text-stone-400 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-heading font-bold text-stone-700 dark:text-stone-300 mb-1">
                Email Address
              </label>
              <div className="flex items-center rounded-xl bg-white dark:bg-[#16181A] border border-stone-300 dark:border-[#2A2D31] px-3.5 py-2.5 focus-within:border-emerald-600 dark:focus-within:border-emerald-500 shadow-2xs">
                <Mail className="w-4 h-4 text-stone-400 mr-2 shrink-0" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="priya@example.com"
                  required
                  className="w-full bg-transparent text-xs font-medium text-stone-900 dark:text-white placeholder:text-stone-400 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-heading font-bold text-stone-700 dark:text-stone-300 mb-1">
                Mobile Number (Optional)
              </label>
              <div className="flex items-center rounded-xl bg-white dark:bg-[#16181A] border border-stone-300 dark:border-[#2A2D31] px-3.5 py-2.5 focus-within:border-emerald-600 dark:focus-within:border-emerald-500 shadow-2xs">
                <Phone className="w-4 h-4 text-stone-400 mr-2 shrink-0" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="9876543210"
                  className="w-full bg-transparent text-xs font-medium text-stone-900 dark:text-white placeholder:text-stone-400 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-heading font-bold text-stone-700 dark:text-stone-300 mb-1">
                  Password
                </label>
                <div className="flex items-center rounded-xl bg-white dark:bg-[#16181A] border border-stone-300 dark:border-[#2A2D31] px-3 py-2.5 focus-within:border-emerald-600 shadow-2xs">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 8 chars"
                    required
                    className="w-full bg-transparent text-xs font-medium text-stone-900 dark:text-white placeholder:text-stone-400 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-colors ml-1"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-heading font-bold text-stone-700 dark:text-stone-300 mb-1">
                  Confirm Password
                </label>
                <div className="flex items-center rounded-xl bg-white dark:bg-[#16181A] border border-stone-300 dark:border-[#2A2D31] px-3 py-2.5 focus-within:border-emerald-600 shadow-2xs">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat"
                    required
                    className="w-full bg-transparent text-xs font-medium text-stone-900 dark:text-white placeholder:text-stone-400 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Pure Veg Pledge */}
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-[11px] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Pure vegetarian guarantee: Zero meat, seafood, or egg SKUs.</span>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:scale-[0.99] text-white font-heading font-bold text-xs flex items-center justify-between shadow-md transition-all cursor-pointer mt-2"
            >
              {isLoading ? (
                <div className="w-full flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating account...</span>
                </div>
              ) : (
                <>
                  <span className="flex-1 text-center">Create Shopper Account</span>
                  <span className="w-6 h-6 rounded-lg bg-emerald-800 flex items-center justify-center text-white shrink-0">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </>
              )}
            </button>
          </form>

          {/* Social Sign Up */}
          {Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY) && (
            <div className="pt-1">
              <SignUpButton mode="modal" forceRedirectUrl="/shopper">
                <button
                  type="button"
                  className="w-full py-2.5 px-4 rounded-xl bg-white dark:bg-[#16181A] hover:bg-stone-50 dark:hover:bg-[#1E2124] border border-stone-300 dark:border-[#2A2D31] text-stone-800 dark:text-stone-200 font-bold text-xs flex items-center justify-center gap-2.5 transition-colors cursor-pointer shadow-2xs"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>Sign up with Google</span>
                </button>
              </SignUpButton>
            </div>
          )}

          <div className="text-center text-xs text-stone-500 dark:text-stone-400 pt-1">
            <span>Already have an account? </span>
            <Link to="/login" className="font-bold text-emerald-700 dark:text-emerald-400 hover:underline">
              Sign In →
            </Link>
          </div>
        </div>

        {/* Bottom Micro Footer */}
        <div className="w-full text-center text-[11px] text-stone-400 dark:text-stone-500 pt-3 border-t border-stone-200/60 dark:border-[#2A2D31] shrink-0 flex flex-col sm:flex-row items-center justify-between gap-1.5">
          <span>By continuing, you agree to our Terms & Privacy Policy</span>
          <Link
            to="/admin/login"
            className="hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors inline-flex items-center gap-1 font-medium"
          >
            <Lock className="w-3 h-3" />
            <span>Master Admin</span>
          </Link>
        </div>
      </main>
    </div>
  );
};
