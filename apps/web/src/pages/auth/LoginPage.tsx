import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { SignInButton } from '@clerk/clerk-react';
import { useAuth, UserRole } from '../../context/AuthContext';
import {
  Lock,
  Mail,
  CreditCard,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  Leaf,
  Copy,
  CheckCircle2,
  MapPin,
  Compass,
  ChevronDown,
  ShoppingBag,
  Store,
  ShieldCheck,
  Sparkles,
  Clock,
  Sun,
  Moon,
  User,
} from 'lucide-react';
import { DEMO_CREDENTIALS } from '../../config/demo-credentials';

export const LoginPage: React.FC = () => {
  const {
    login,
    register,
    sendPhoneOtp,
    loginWithPhoneOtp,
    user,
    isAuthenticated,
    isLoading: authLoading,
  } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  // Mode: 'SHOPPER' | 'MERCHANT' | 'REGISTER'
  const [authMode, setAuthMode] = useState<'SHOPPER' | 'MERCHANT' | 'REGISTER'>('SHOPPER');

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

  // Phone OTP state
  const [phoneStep, setPhoneStep] = useState<'NUMBER' | 'OTP'>('NUMBER');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '']);
  const [simulatedCode, setSimulatedCode] = useState<string | null>(null);
  const [copiedPill, setCopiedPill] = useState(false);
  const [phoneCooldown, setPhoneCooldown] = useState(60);
  const digitRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Email & Password state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Register form specific state
  const [registerName, setRegisterName] = useState('');
  const [registerPhone, setRegisterPhone] = useState('');

  // Location Auto-Detection State
  const [detectedLocation, setDetectedLocation] = useState<string>('Boring Road, Patna');
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  // Common UI state
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Redirect target after authentication
  const from = (location.state as any)?.from?.pathname;

  const redirectAfterAuth = (userRole: UserRole) => {
    if (from && from !== '/login') {
      navigate(from, { replace: true });
      return;
    }
    if (userRole === 'MERCHANT') {
      navigate('/merchant', { replace: true });
    } else if (userRole === 'ADMIN') {
      navigate('/admin', { replace: true });
    } else {
      navigate('/shopper', { replace: true });
    }
  };

  // Immediate synchronous guard: never render login page if already authenticated
  if (!authLoading && isAuthenticated && user) {
    const target = user.role === 'MERCHANT' ? '/merchant' : user.role === 'ADMIN' ? '/admin' : '/shopper';
    if (typeof window !== 'undefined') {
      window.history.replaceState({ cartpilotApp: true, tab: 'home' }, '', target);
    }
    return <Navigate to={target} replace />;
  }

  // Countdown timer for phone OTP resend
  useEffect(() => {
    if (phoneStep !== 'OTP' || phoneCooldown <= 0) return;
    const interval = setInterval(() => {
      setPhoneCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [phoneStep, phoneCooldown]);

  // Geolocation detection
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setDetectedLocation('Patna Hub (GPS Unavailable)');
      return;
    }

    setIsDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude.toFixed(2);
        const lng = pos.coords.longitude.toFixed(2);
        setDetectedLocation(`GPS: ${lat}°N, ${lng}°E (Patna Hub)`);
        setIsDetectingLocation(false);
      },
      (err) => {
        console.warn('Geolocation access denied or unavailable:', err.message);
        setDetectedLocation('Boring Road, Patna');
        setIsDetectingLocation(false);
      },
      { timeout: 7000 }
    );
  };

  // --- Phone OTP Handlers ---
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 10);
    setPhoneNumber(raw);
    if (errorMessage) setErrorMessage(null);
  };

  const handleSendPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phoneNumber.length !== 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    const fullPhone = `+91${phoneNumber}`;
    const result = await sendPhoneOtp(fullPhone, 'PHONE_LOGIN');
    setIsLoading(false);

    if (result.success) {
      if (result.simulatedCode) {
        setSimulatedCode(result.simulatedCode);
      }
      setPhoneStep('OTP');
      setPhoneCooldown(60);
      setOtpDigits(['', '', '', '']);
      setTimeout(() => {
        digitRefs.current[0]?.focus();
      }, 100);
    } else {
      setErrorMessage(result.error || 'Unable to send OTP. Please try again.');
    }
  };

  const handleResendPhoneOtp = async () => {
    if (phoneCooldown > 0 || isLoading) return;
    setIsLoading(true);
    setErrorMessage(null);

    const fullPhone = `+91${phoneNumber}`;
    const result = await sendPhoneOtp(fullPhone, 'PHONE_LOGIN');
    setIsLoading(false);

    if (result.success) {
      if (result.simulatedCode) {
        setSimulatedCode(result.simulatedCode);
      }
      setPhoneCooldown(60);
      setOtpDigits(['', '', '', '']);
      setTimeout(() => {
        digitRefs.current[0]?.focus();
      }, 100);
    } else {
      setErrorMessage(result.error || 'Unable to resend OTP. Please try again.');
    }
  };

  const handleDigitChange = (index: number, value: string) => {
    const sanitized = value.replace(/\D/g, '').slice(-1);
    const next = [...otpDigits];
    next[index] = sanitized;
    setOtpDigits(next);

    if (sanitized && index < 3) {
      digitRefs.current[index + 1]?.focus();
    }

    const fullCode = next.join('');
    if (fullCode.length === 4) {
      verifyPhoneOtp(fullCode);
    }
  };

  const handleDigitKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      digitRefs.current[index - 1]?.focus();
    }
  };

  const handlePasteOtp = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    if (!pasted) return;

    const chars = pasted.split('');
    const nextDigits = ['', '', '', ''];
    chars.forEach((c, idx) => {
      if (idx < 4) nextDigits[idx] = c;
    });
    setOtpDigits(nextDigits);

    if (chars.length === 4) {
      verifyPhoneOtp(pasted);
    } else {
      const focusIndex = Math.min(chars.length, 3);
      digitRefs.current[focusIndex]?.focus();
    }
  };

  const autoFillSimulatedCode = (code: string) => {
    const chars = code.slice(0, 4).split('');
    const nextDigits = ['', '', '', ''];
    chars.forEach((c, idx) => {
      if (idx < 4) nextDigits[idx] = c;
    });
    setOtpDigits(nextDigits);
    setCopiedPill(true);
    setTimeout(() => setCopiedPill(false), 2000);
    verifyPhoneOtp(code);
  };

  const verifyPhoneOtp = async (codeToVerify: string) => {
    setIsLoading(true);
    setErrorMessage(null);

    const fullPhone = `+91${phoneNumber}`;
    const result = await loginWithPhoneOtp(fullPhone, codeToVerify);
    setIsLoading(false);

    if (result.success && result.role) {
      redirectAfterAuth(result.role);
    } else {
      setErrorMessage(result.error || 'Invalid OTP code. Please try again.');
      setOtpDigits(['', '', '', '']);
      digitRefs.current[0]?.focus();
    }
  };

  // --- Email/Password Handlers (Merchant Partner) ---
  const handleEmailLogin = async (
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
      redirectAfterAuth(result.role);
    } else {
      setErrorMessage(result.error || 'Login failed. Please check your credentials.');
    }
  };

  // --- Quick 1-Tap Demo Logins ---
  const handleQuickLogin = (role: UserRole) => {
    const target = DEMO_CREDENTIALS?.[role] || {
      CUSTOMER: { email: 'customer@example.com', password: 'Customer1234!' },
      MERCHANT: { email: 'merchant@example.com', password: 'Merchant1234!' },
      ADMIN: { email: 'admin@example.com', password: 'Admin1234!' },
    }[role];

    if (!target) return;
    setEmail(target.email);
    setPassword(target.password);
    handleEmailLogin(undefined, target.email, target.password);
  };

  // --- Registration Handler (Inline Create Account) ---
  const handleRegisterShopper = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!registerName.trim()) {
      setErrorMessage('Please enter your full name');
      return;
    }
    if (!email.trim()) {
      setErrorMessage('Please enter your email address');
      return;
    }
    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters');
      return;
    }

    setIsLoading(true);
    const result = await register(
      registerName.trim(),
      email.trim(),
      password,
      registerPhone ? `+91${registerPhone}` : undefined
    );
    setIsLoading(false);

    if (result.success) {
      navigate('/shopper', { replace: true });
    } else {
      setErrorMessage(result.error || 'Registration failed. Please try again.');
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
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center shadow-sm">
              <Leaf className="w-5 h-5 fill-white" />
            </div>
            <div>
              <span className="font-heading font-extrabold text-xl tracking-tight text-stone-900 dark:text-white leading-none block">
                CartPilot
              </span>
              <span className="text-[10px] font-mono tracking-widest text-emerald-700 dark:text-emerald-400 font-bold uppercase mt-0.5 block">
                SMART GROCERY GATEWAY
              </span>
            </div>
          </div>

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
              <span>Next-Gen Pure-Veg Commerce</span>
            </div>
            <h1 className="text-3xl xl:text-4xl font-heading font-black tracking-tight leading-[1.15] text-stone-900 dark:text-white">
              Autonomous Groceries, <br />
              <span className="text-emerald-700 dark:text-emerald-400">Policy-Controlled</span>.
            </h1>
            <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed max-w-md">
              Order fresh farm harvests till midnight. Guaranteed morning and evening delivery slots with bank-grade budget mandates.
            </p>
          </div>

          {/* Key Value Cards */}
          <div className="grid grid-cols-2 gap-3 max-w-lg">
            <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-[#16181A]/80 border border-stone-200/80 dark:border-[#2A2D31] shadow-2xs backdrop-blur-xs space-y-1">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="font-heading font-bold text-xs text-stone-900 dark:text-white">100% Vegetarian</span>
              </div>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">Strictly meat-free, organic certified pantry items.</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-[#16181A]/80 border border-stone-200/80 dark:border-[#2A2D31] shadow-2xs backdrop-blur-xs space-y-1">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="font-heading font-bold text-xs text-stone-900 dark:text-white">Next-Day Slots</span>
              </div>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">Morning 6–10 AM or Evening 5–9 PM scheduled drops.</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-[#16181A]/80 border border-stone-200/80 dark:border-[#2A2D31] shadow-2xs backdrop-blur-xs space-y-1">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="font-heading font-bold text-xs text-stone-900 dark:text-white">Instant Ledger</span>
              </div>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">1-tap wallet checkout with zero gateway friction.</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-[#16181A]/80 border border-stone-200/80 dark:border-[#2A2D31] shadow-2xs backdrop-blur-xs space-y-1">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="font-heading font-bold text-xs text-stone-900 dark:text-white">AI Meal Planner</span>
              </div>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">Recipe-to-cart autonomous ingredient matching.</p>
            </div>
          </div>
        </div>

        {/* Bottom Social Proof */}
        <div className="pt-4 border-t border-stone-200/60 dark:border-[#2A2D31] flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 relative z-10">
          <div className="flex items-center gap-1.5 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>10,000+ orders delivered</span>
          </div>
          <span>Patna & Bihar Hubs</span>
        </div>
      </aside>

      {/* ── Right Column: Authentication Form Panel ─────────────────────────── */}
      <main className="flex-1 h-full flex flex-col justify-between items-center px-4 py-5 sm:px-8 sm:py-8 lg:px-10 lg:py-6 overflow-y-auto lg:overflow-hidden relative">
        
        {/* Mobile Header Bar (Screen < 1024px) */}
        <div className="w-full flex lg:hidden items-center justify-between pb-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-700 text-white flex items-center justify-center shadow-2xs">
              <Leaf className="w-4 h-4 fill-white" />
            </div>
            <span className="font-heading font-extrabold text-lg text-stone-900 dark:text-white tracking-tight">
              CartPilot
            </span>
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            className="p-1.5 rounded-xl bg-stone-100 dark:bg-[#1E2124] border border-stone-200 dark:border-[#2A2D31] text-stone-600 dark:text-stone-300"
            title="Toggle Theme"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>

        {/* Central Auth Container */}
        <div className="w-full max-w-md my-auto space-y-4">
          
          {/* Tri-Pill Mode Switcher (Shopper, Merchant, Register) */}
          <div className="flex items-center p-1 rounded-2xl bg-stone-100 dark:bg-[#16181A] border border-stone-200/80 dark:border-[#2A2D31] shadow-2xs">
            <button
              type="button"
              onClick={() => {
                setAuthMode('SHOPPER');
                setPhoneStep('NUMBER');
                setErrorMessage(null);
              }}
              className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-heading font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                authMode === 'SHOPPER'
                  ? 'bg-white dark:bg-[#1E2124] text-emerald-800 dark:text-white shadow-2xs border border-stone-200/60 dark:border-[#2A2D31]'
                  : 'text-stone-500 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Shopper</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setAuthMode('MERCHANT');
                setErrorMessage(null);
              }}
              className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-heading font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                authMode === 'MERCHANT'
                  ? 'bg-white dark:bg-[#1E2124] text-emerald-800 dark:text-white shadow-2xs border border-stone-200/60 dark:border-[#2A2D31]'
                  : 'text-stone-500 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              <span>Merchant</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setAuthMode('REGISTER');
                setErrorMessage(null);
              }}
              className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-heading font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                authMode === 'REGISTER'
                  ? 'bg-white dark:bg-[#1E2124] text-emerald-800 dark:text-white shadow-2xs border border-stone-200/60 dark:border-[#2A2D31]'
                  : 'text-stone-500 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>New User</span>
            </button>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="truncate">{errorMessage}</span>
            </div>
          )}

          {/* ── Mode A: Shopper Login Form ──────────────────────────────────── */}
          {authMode === 'SHOPPER' && (
            <div className="space-y-3.5">
              {phoneStep === 'NUMBER' ? (
                <>
                  {/* Delivery Location Indicator with Detect GPS */}
                  <div className="flex items-center justify-between p-2 px-3 rounded-xl bg-white dark:bg-[#16181A] border border-stone-200/80 dark:border-[#2A2D31] text-xs shadow-2xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="relative flex h-2 w-2 shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                      </span>
                      <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span className="text-stone-700 dark:text-stone-300 font-medium truncate text-[11px]">
                        Delivering to: <strong className="text-stone-900 dark:text-white">{detectedLocation}</strong>
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleDetectLocation}
                      disabled={isDetectingLocation}
                      className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 hover:underline shrink-0 cursor-pointer ml-2 flex items-center gap-1"
                    >
                      <Compass className="w-3 h-3" />
                      <span>{isDetectingLocation ? 'Locating...' : 'Detect GPS'}</span>
                    </button>
                  </div>

                  {/* Phone OTP Submit Form */}
                  <form onSubmit={handleSendPhoneOtp} className="space-y-3">
                    <div>
                      <label className="block text-xs font-heading font-bold text-stone-700 dark:text-stone-300 mb-1">
                        Mobile Number
                      </label>
                      <div className="flex items-center rounded-xl bg-white dark:bg-[#16181A] border border-stone-300 dark:border-[#2A2D31] px-3.5 py-2.5 focus-within:border-emerald-600 dark:focus-within:border-emerald-500 shadow-2xs transition-colors">
                        <span className="text-xs font-bold text-stone-800 dark:text-stone-200 flex items-center gap-1 shrink-0 select-none mr-2">
                          <span>🇮🇳</span>
                          <span>+91</span>
                          <ChevronDown className="w-3 h-3 text-stone-400" />
                        </span>
                        <input
                          type="tel"
                          value={phoneNumber}
                          onChange={handlePhoneChange}
                          placeholder="Enter 10-digit mobile number"
                          maxLength={10}
                          autoFocus
                          className="w-full bg-transparent text-xs font-semibold text-stone-900 dark:text-white placeholder:text-stone-400 focus:outline-none"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={phoneNumber.length !== 10 || isLoading}
                      className="w-full py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:scale-[0.99] text-white font-heading font-bold text-xs flex items-center justify-between shadow-md transition-all disabled:opacity-40 cursor-pointer"
                    >
                      {isLoading ? (
                        <div className="w-full flex items-center justify-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Sending OTP...</span>
                        </div>
                      ) : (
                        <>
                          <span className="flex-1 text-center">Continue with OTP</span>
                          <span className="w-6 h-6 rounded-lg bg-emerald-800 flex items-center justify-center text-white shrink-0">
                            <ArrowRight className="w-3.5 h-3.5" />
                          </span>
                        </>
                      )}
                    </button>
                  </form>

                  {/* Divider */}
                  <div className="relative my-3 flex items-center justify-center">
                    <div className="w-full border-t border-stone-200 dark:border-[#2A2D31]" />
                    <span className="absolute px-3 bg-[#FAFAF7] dark:bg-[#0E0F10] text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                      OR
                    </span>
                  </div>

                  {/* Google OAuth & 1-Tap Demo Buttons */}
                  <div className="space-y-2">
                    {Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY) ? (
                      <SignInButton mode="modal" forceRedirectUrl="/shopper">
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
                          <span>Continue with Google</span>
                        </button>
                      </SignInButton>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleQuickLogin('CUSTOMER')}
                        className="w-full py-2.5 px-4 rounded-xl bg-white dark:bg-[#16181A] hover:bg-stone-50 dark:hover:bg-[#1E2124] border border-stone-300 dark:border-[#2A2D31] text-stone-800 dark:text-stone-200 font-bold text-xs flex items-center justify-center gap-2.5 transition-colors cursor-pointer shadow-2xs"
                      >
                        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                        </svg>
                        <span>Continue with Google</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleQuickLogin('CUSTOMER')}
                      className="w-full py-2 px-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100/60 dark:hover:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Instant 1-Tap Demo Shopper Access</span>
                    </button>
                  </div>
                </>
              ) : (
                /* Step 2: OTP Verification */
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => {
                        setPhoneStep('NUMBER');
                        setErrorMessage(null);
                      }}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Change Number</span>
                    </button>
                    <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                      4-Digit OTP
                    </span>
                  </div>

                  {/* Simulated Code Quick-Fill Helper */}
                  {simulatedCode && (
                    <div
                      onClick={() => autoFillSimulatedCode(simulatedCode)}
                      className="p-2 px-3 rounded-xl bg-stone-900 dark:bg-[#1E2124] text-white flex items-center justify-between cursor-pointer hover:bg-stone-800 transition-colors border border-stone-700"
                    >
                      <span className="text-xs">
                        Demo Code: <strong className="font-mono text-emerald-400">{simulatedCode}</strong>
                      </span>
                      <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                        {copiedPill ? <CheckCircle2 className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedPill ? 'Applied' : 'Tap to Fill'}</span>
                      </span>
                    </div>
                  )}

                  <div className="text-center space-y-1">
                    <h2 className="font-heading font-extrabold text-lg text-stone-900 dark:text-white">
                      Verify Phone Number
                    </h2>
                    <p className="text-xs text-stone-500 dark:text-stone-400">
                      Enter the 4-digit code sent to +91 {phoneNumber}
                    </p>
                  </div>

                  {/* 4 OTP Digits */}
                  <div className="flex items-center justify-center gap-3">
                    {otpDigits.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={(el) => (digitRefs.current[idx] = el)}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleDigitChange(idx, e.target.value)}
                        onKeyDown={(e) => handleDigitKeyDown(idx, e)}
                        onPaste={handlePasteOtp}
                        className="w-12 h-12 text-center text-xl font-heading font-black rounded-xl bg-white dark:bg-[#16181A] border-2 border-stone-300 dark:border-[#2A2D31] focus:border-emerald-600 focus:outline-none shadow-2xs"
                      />
                    ))}
                  </div>

                  {/* Resend Timer */}
                  <div className="text-center text-xs text-stone-500 dark:text-stone-400">
                    {phoneCooldown > 0 ? (
                      <span>Resend OTP in 00:{phoneCooldown < 10 ? `0${phoneCooldown}` : phoneCooldown}s</span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResendPhoneOtp}
                        disabled={isLoading}
                        className="font-bold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
                      >
                        Resend OTP Code
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Mode B: Merchant Login Form ─────────────────────────────────── */}
          {authMode === 'MERCHANT' && (
            <form onSubmit={handleEmailLogin} className="space-y-3.5">
              <div className="text-left space-y-0.5 mb-2">
                <h2 className="font-heading font-extrabold text-lg text-stone-900 dark:text-white">
                  Merchant Partner Hub
                </h2>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Manage your pure-veg grocery catalog and fulfillment.
                </p>
              </div>

              <div>
                <label className="block text-xs font-heading font-bold text-stone-700 dark:text-stone-300 mb-1">
                  Merchant Email
                </label>
                <div className="flex items-center rounded-xl bg-white dark:bg-[#16181A] border border-stone-300 dark:border-[#2A2D31] px-3.5 py-2.5 focus-within:border-emerald-600 dark:focus-within:border-emerald-500 shadow-2xs transition-colors">
                  <Mail className="w-4 h-4 text-stone-400 mr-2 shrink-0" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="merchant@freshgrocers.com"
                    required
                    className="w-full bg-transparent text-xs font-medium text-stone-900 dark:text-white placeholder:text-stone-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-heading font-bold text-stone-700 dark:text-stone-300">
                    Password
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-[11px] text-emerald-700 dark:text-emerald-400 hover:underline font-semibold"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="flex items-center rounded-xl bg-white dark:bg-[#16181A] border border-stone-300 dark:border-[#2A2D31] px-3.5 py-2.5 focus-within:border-emerald-600 dark:focus-within:border-emerald-500 shadow-2xs transition-colors">
                  <Lock className="w-4 h-4 text-stone-400 mr-2 shrink-0" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    className="w-full bg-transparent text-xs font-medium text-stone-900 dark:text-white placeholder:text-stone-400 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:scale-[0.99] text-white font-heading font-bold text-xs flex items-center justify-between shadow-md transition-all cursor-pointer"
              >
                {isLoading ? (
                  <div className="w-full flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing in...</span>
                  </div>
                ) : (
                  <>
                    <span className="flex-1 text-center">Sign In to Merchant Hub</span>
                    <span className="w-6 h-6 rounded-lg bg-emerald-800 flex items-center justify-center text-white shrink-0">
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('MERCHANT')}
                className="w-full py-2 px-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100/60 dark:hover:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Store className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Instant 1-Tap Demo Merchant Access</span>
              </button>

              <div className="text-center text-xs text-stone-500 dark:text-stone-400 pt-1">
                <span>Want to sell on CartPilot? </span>
                <Link to="/become-merchant" className="font-bold text-emerald-700 dark:text-emerald-400 hover:underline">
                  Apply as a Merchant →
                </Link>
              </div>
            </form>
          )}

          {/* ── Mode C: Inline Registration (Create Account) ────────────────── */}
          {authMode === 'REGISTER' && (
            <form onSubmit={handleRegisterShopper} className="space-y-3">
              <div className="text-left space-y-0.5 mb-2">
                <h2 className="font-heading font-extrabold text-lg text-stone-900 dark:text-white">
                  Create Shopper Account
                </h2>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Join for policy-controlled pure-veg quick commerce.
                </p>
              </div>

              <div>
                <label className="block text-xs font-heading font-bold text-stone-700 dark:text-stone-300 mb-1">
                  Full Name
                </label>
                <div className="flex items-center rounded-xl bg-white dark:bg-[#16181A] border border-stone-300 dark:border-[#2A2D31] px-3.5 py-2.5 focus-within:border-emerald-600 dark:focus-within:border-emerald-500 shadow-2xs">
                  <User className="w-4 h-4 text-stone-400 mr-2 shrink-0" />
                  <input
                    type="text"
                    value={registerName}
                    onChange={(e) => setRegisterName(e.target.value)}
                    placeholder="Enter your full name"
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
                    placeholder="you@example.com"
                    required
                    className="w-full bg-transparent text-xs font-medium text-stone-900 dark:text-white placeholder:text-stone-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-heading font-bold text-stone-700 dark:text-stone-300 mb-1">
                    Phone (Optional)
                  </label>
                  <div className="flex items-center rounded-xl bg-white dark:bg-[#16181A] border border-stone-300 dark:border-[#2A2D31] px-3 py-2.5 focus-within:border-emerald-600 shadow-2xs">
                    <input
                      type="tel"
                      value={registerPhone}
                      onChange={(e) => setRegisterPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="10 digits"
                      className="w-full bg-transparent text-xs font-medium text-stone-900 dark:text-white placeholder:text-stone-400 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-heading font-bold text-stone-700 dark:text-stone-300 mb-1">
                    Password
                  </label>
                  <div className="flex items-center rounded-xl bg-white dark:bg-[#16181A] border border-stone-300 dark:border-[#2A2D31] px-3 py-2.5 focus-within:border-emerald-600 shadow-2xs">
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min 8 chars"
                      required
                      className="w-full bg-transparent text-xs font-medium text-stone-900 dark:text-white placeholder:text-stone-400 focus:outline-none"
                    />
                  </div>
                </div>
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

              <div className="text-center text-xs text-stone-500 dark:text-stone-400 pt-1">
                <span>Already have an account? </span>
                <button
                  type="button"
                  onClick={() => setAuthMode('SHOPPER')}
                  className="font-bold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
                >
                  Sign In →
                </button>
              </div>
            </form>
          )}
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
