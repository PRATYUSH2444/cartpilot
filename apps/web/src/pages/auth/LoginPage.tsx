import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { SignInButton } from '@clerk/clerk-react';
import { useAuth, UserRole } from '../../context/AuthContext';
import {
  Lock,
  Mail,
  Phone,
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
  ShoppingCart,
  Store,
} from 'lucide-react';
import { DEMO_CREDENTIALS } from '../../config/demo-credentials';

export const LoginPage: React.FC = () => {
  const {
    login,
    sendPhoneOtp,
    loginWithPhoneOtp,
    user,
    isAuthenticated,
    isLoading: authLoading,
  } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  // Mode: 'SHOPPER' (default shopper quick-commerce flow) vs 'MERCHANT' (store partner gateway)
  const [authMode, setAuthMode] = useState<'SHOPPER' | 'MERCHANT'>('SHOPPER');

  // Phone OTP state
  const [phoneStep, setPhoneStep] = useState<'NUMBER' | 'OTP'>('NUMBER');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '']);
  const [simulatedCode, setSimulatedCode] = useState<string | null>(null);
  const [copiedPill, setCopiedPill] = useState(false);
  const [phoneCooldown, setPhoneCooldown] = useState(60);
  const digitRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Email state (shared / shopper optional identifier / merchant login)
  const [email, setEmail] = useState('');

  // Password state (for Merchant Partner)
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Location Auto-Detection State (Blinkit / Instamart style)
  const [detectedLocation, setDetectedLocation] = useState<string>('HSR Layout, Bengaluru');
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

  // If already authenticated and not loading, redirect immediately
  useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      redirectAfterAuth(user.role);
    }
  }, [authLoading, isAuthenticated, user]);

  // Countdown timer for phone OTP resend
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (phoneStep === 'OTP' && phoneCooldown > 0) {
      timer = setInterval(() => {
        setPhoneCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [phoneStep, phoneCooldown]);

  // HTML5 Live Geolocation Detection (Blinkit/Instamart style)
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setDetectedLocation('HSR Layout, Bengaluru');
      return;
    }
    setIsDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude.toFixed(2);
        const lng = pos.coords.longitude.toFixed(2);
        setDetectedLocation(`GPS: ${lat}°N, ${lng}°E (Express Hub)`);
        setIsDetectingLocation(false);
      },
      (err) => {
        console.warn('Geolocation access denied or unavailable:', err.message);
        setDetectedLocation('HSR Layout, Bengaluru');
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
      digitRefs.current[0]?.focus();
    } else {
      setErrorMessage(result.error || 'Unable to resend OTP.');
    }
  };

  const handleDigitChange = (index: number, val: string) => {
    const cleaned = val.replace(/\D/g, '');
    if (!cleaned) {
      const copy = [...otpDigits];
      copy[index] = '';
      setOtpDigits(copy);
      return;
    }

    const char = cleaned.slice(-1);
    const updated = [...otpDigits];
    updated[index] = char;
    setOtpDigits(updated);

    if (index < 3 && char) {
      digitRefs.current[index + 1]?.focus();
    }

    if (index === 3 || updated.every((d) => d !== '')) {
      const completeCode = updated.join('');
      if (completeCode.length === 4) {
        verifyPhoneOtp(completeCode);
      }
    }
  };

  const handleDigitKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      digitRefs.current[index - 1]?.focus();
    }
  };

  const handleDigitPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
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
      setErrorMessage(result.error || 'Login failed. Please check your email and password.');
    }
  };

  const handleQuickLogin = (role: UserRole) => {
    if (!DEMO_CREDENTIALS) return;
    const target = DEMO_CREDENTIALS[role];
    if (!target) return;
    setEmail(target.email);
    setPassword(target.password);
    handleEmailLogin(undefined, target.email, target.password);
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center px-4 py-8 sm:py-12 bg-gradient-to-br from-[#EBF7F0] via-[#F4FBF7] to-[#DFEDE4] dark:from-stone-950 dark:via-stone-900 dark:to-emerald-950/40 font-sans text-slate-900 dark:text-white relative overflow-hidden selection:bg-[#0a5c36] selection:text-white">
      {/* Dynamic Ambient Fluid Wave Background / Neomorphic Auroras */}
      <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-emerald-300/25 dark:bg-emerald-600/10 blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute -bottom-32 -right-32 w-[520px] h-[520px] rounded-full bg-teal-300/25 dark:bg-teal-600/10 blur-[130px] pointer-events-none animate-pulse" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-emerald-200/20 dark:bg-emerald-500/5 blur-[150px] pointer-events-none" />

      {/* Decorative Organic Fluid SVG Wave (Matching reference design subtle ribbon) */}
      <svg
        className="absolute inset-0 w-full h-full object-cover pointer-events-none opacity-40 dark:opacity-10"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1440 900"
        fill="none"
      >
        <path
          d="M-100 200 C 300 100, 500 500, 900 350 C 1200 250, 1400 450, 1600 300"
          stroke="url(#wave-gradient)"
          strokeWidth="120"
          strokeLinecap="round"
          className="blur-3xl"
        />
        <defs>
          <linearGradient id="wave-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#A7F3D0" stopOpacity="0.4" />
            <stop offset="50%" stopColor="#6EE7B7" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#34D399" stopOpacity="0.2" />
          </linearGradient>
        </defs>
      </svg>

      {/* Ultra-Premium Glassmorphic Authentication Card */}
      <div className="w-full max-w-[420px] sm:max-w-[440px] bg-white/55 dark:bg-stone-900/60 backdrop-blur-2xl border-2 border-white/80 dark:border-white/15 rounded-[38px] sm:rounded-[42px] shadow-[0_32px_80px_-16px_rgba(10,92,54,0.18),inset_0_1px_2px_rgba(255,255,255,0.95)] dark:shadow-[0_32px_80px_-16px_rgba(0,0,0,0.6)] p-6 sm:p-8 relative z-10 transition-all duration-300">
        
        {/* Top Centered Brand Logo */}
        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-2xl bg-[#0a5c36] text-white flex items-center justify-center shadow-lg shadow-[#0a5c36]/25 hover:scale-105 transition-transform duration-200">
            <Leaf className="w-6 h-6 fill-white text-white" />
          </div>
          <h1 className="font-black text-2xl tracking-tight text-slate-900 dark:text-white mt-2.5">
            CartPilot
          </h1>

          {/* Sub-brand Divider */}
          <div className="flex items-center justify-center gap-2 text-[10px] font-bold tracking-widest text-slate-400 dark:text-slate-500 uppercase mt-1">
            <span className="w-6 h-px bg-slate-300 dark:bg-stone-700" />
            <span>SMART GROCERY PLATFORM</span>
            <span className="w-6 h-px bg-slate-300 dark:bg-stone-700" />
          </div>

          {/* Dual-Pill Role Switcher (Matching Exact Reference Layout) */}
          <div className="mt-5 inline-flex p-1 rounded-full bg-white/40 dark:bg-stone-800/40 backdrop-blur-md border border-white/60 dark:border-stone-700/60 shadow-xs">
            <button
              type="button"
              onClick={() => {
                setAuthMode('SHOPPER');
                setErrorMessage(null);
              }}
              className={`py-2 px-4 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                authMode === 'SHOPPER'
                  ? 'bg-[#0a5c36] text-white shadow-md shadow-[#0a5c36]/25'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Shopper Login</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('MERCHANT');
                setErrorMessage(null);
              }}
              className={`py-2 px-4 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                authMode === 'MERCHANT'
                  ? 'bg-[#0a5c36] text-white shadow-md shadow-[#0a5c36]/25'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              <span>Merchant Login</span>
            </button>
          </div>
        </div>

        {/* -------------------- SHOPPER QUICK-COMMERCE AUTH FLOW -------------------- */}
        {authMode === 'SHOPPER' ? (
          <div>
            {phoneStep === 'NUMBER' ? (
              <div className="mt-6">
                {/* Heading & Subtitle */}
                <div className="text-center mb-5">
                  <h2 className="font-extrabold text-2xl text-slate-900 dark:text-white tracking-tight">
                    Welcome to <span className="text-[#0a5c36] dark:text-emerald-400">CartPilot</span>
                  </h2>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
                    Fresh Groceries, Smarter & Faster
                  </p>
                </div>

                {/* Blinkit / Instamart Live Location Indicator Bar */}
                <div className="flex items-center justify-between p-2 px-3 rounded-full bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/40 text-xs mb-5 shadow-2xs backdrop-blur-xs">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="relative flex h-2 w-2 flex-shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <MapPin className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 flex-shrink-0" />
                    <span className="text-emerald-950 dark:text-emerald-200 font-semibold truncate text-[11px]">
                      Delivering to: <span className="font-bold">{detectedLocation}</span>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleDetectLocation}
                    disabled={isDetectingLocation}
                    className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 hover:underline flex-shrink-0 cursor-pointer ml-1.5 flex items-center gap-0.5"
                  >
                    <Compass className="w-3 h-3" />
                    <span>{isDetectingLocation ? 'Locating...' : 'Detect GPS'}</span>
                  </button>
                </div>

                {errorMessage && (
                  <div className="mb-4 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Main Form Fields */}
                <form onSubmit={handleSendPhoneOtp} className="space-y-3.5">
                  {/* Email Address Pill Input */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                      Email Address
                    </label>
                    <div className="relative flex items-center rounded-full bg-white/60 dark:bg-stone-800/60 backdrop-blur-md border border-white/90 dark:border-stone-700/90 px-4 py-3.5 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] hover:border-emerald-500/70 focus-within:border-[#0a5c36] focus-within:ring-2 focus-within:ring-[#0a5c36]/20 transition-all">
                      <Mail className="w-4 h-4 text-slate-400 mr-2.5 flex-shrink-0" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email address"
                        className="w-full bg-transparent text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Phone Number Pill Input */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                      Phone Number
                    </label>
                    <div className="relative flex items-center rounded-full bg-white/60 dark:bg-stone-800/60 backdrop-blur-md border border-white/90 dark:border-stone-700/90 px-4 py-3.5 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] hover:border-emerald-500/70 focus-within:border-[#0a5c36] focus-within:ring-2 focus-within:ring-[#0a5c36]/20 transition-all">
                      <Phone className="w-4 h-4 text-slate-400 mr-2 flex-shrink-0" />
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 select-none flex-shrink-0">
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full overflow-hidden text-sm flex-shrink-0 shadow-2xs">🇮🇳</span>
                        <span>+91</span>
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                      <span className="mx-2.5 h-4 w-px bg-slate-300 dark:bg-stone-600 flex-shrink-0" />
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={handlePhoneChange}
                        placeholder="Enter your mobile number"
                        maxLength={10}
                        autoFocus
                        className="w-full bg-transparent text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none tracking-wide"
                      />
                    </div>
                  </div>

                  {/* Primary Glowing Action Button (With Reference Circular Arrow Badge) */}
                  <button
                    type="submit"
                    disabled={phoneNumber.length !== 10 || isLoading}
                    className="w-full py-3.5 pl-6 pr-3 rounded-full bg-gradient-to-r from-[#047857] via-[#059669] to-[#047857] hover:from-[#065f46] hover:to-[#047857] text-white font-bold text-sm shadow-[0_10px_25px_-5px_rgba(5,150,105,0.4)] hover:shadow-[0_12px_28px_-5px_rgba(5,150,105,0.5)] disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-between cursor-pointer mt-4 group active:scale-[0.99]"
                  >
                    {isLoading ? (
                      <div className="w-full flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Sending OTP...</span>
                      </div>
                    ) : (
                      <>
                        <span className="flex-1 text-center font-bold">Continue with OTP</span>
                        <span className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-emerald-700 shadow-xs flex-shrink-0 group-hover:translate-x-0.5 transition-transform">
                          <ArrowRight className="w-4 h-4" />
                        </span>
                      </>
                    )}
                  </button>
                </form>

                {/* Subtle Divider with Floating OR Pill */}
                <div className="relative my-4 flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-300/60 dark:border-stone-700/60" />
                  </div>
                  <span className="relative px-3.5 py-0.5 rounded-full bg-white/80 dark:bg-stone-800/80 backdrop-blur-md border border-white/90 dark:border-stone-700 text-[10px] font-extrabold text-slate-400 dark:text-slate-400 uppercase tracking-widest shadow-2xs">
                    OR
                  </span>
                </div>

                {/* Google Sign-In Pill Button (Clerk OAuth or Fallback) */}
                {Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY) ? (
                  <SignInButton mode="modal">
                    <button
                      type="button"
                      className="w-full py-3.5 px-4 rounded-full bg-white/65 dark:bg-stone-800/65 hover:bg-white/90 dark:hover:bg-stone-750 backdrop-blur-md border border-white/90 dark:border-stone-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-2.5 shadow-2xs hover:shadow transition-all cursor-pointer active:scale-[0.99]"
                    >
                      <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                        />
                      </svg>
                      <span>Continue with Google</span>
                    </button>
                  </SignInButton>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleQuickLogin('CUSTOMER')}
                    className="w-full py-3.5 px-4 rounded-full bg-white/65 dark:bg-stone-800/65 hover:bg-white/90 dark:hover:bg-stone-750 backdrop-blur-md border border-white/90 dark:border-stone-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-2.5 shadow-2xs hover:shadow transition-all cursor-pointer active:scale-[0.99]"
                  >
                    <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>Continue with Google</span>
                  </button>
                )}

                {/* Footer Link */}
                <div className="mt-5 text-center text-xs text-slate-500 dark:text-slate-400">
                  <span>New to CartPilot? </span>
                  <Link
                    to="/register"
                    className="font-bold text-[#0a5c36] dark:text-emerald-400 hover:underline inline-flex items-center gap-1"
                  >
                    <span>Create an account</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ) : (
              /* Phone OTP Verification Screen */
              <div className="mt-5">
                <div className="flex items-center justify-between mb-3">
                  <button
                    type="button"
                    onClick={() => {
                      setPhoneStep('NUMBER');
                      setErrorMessage(null);
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back</span>
                  </button>
                  <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                    4-Digit Verification
                  </span>
                </div>

                {/* Simulated SMS Pill Banner (Automatic Developer Convenience) */}
                {simulatedCode && (
                  <div
                    onClick={() => autoFillSimulatedCode(simulatedCode)}
                    className="mb-4 p-2.5 px-3.5 rounded-2xl bg-stone-900 text-white shadow-lg flex items-center justify-between cursor-pointer hover:bg-stone-800 active:scale-[0.99] transition-all border border-stone-700"
                  >
                    <div className="flex items-center gap-2 text-xs truncate">
                      <span className="text-sm">💬</span>
                      <span className="truncate text-stone-200">
                        Code:{' '}
                        <span className="font-mono font-black text-emerald-400 tracking-wider text-sm">
                          {simulatedCode}
                        </span>
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-stone-800 px-2 py-0.5 rounded-lg border border-stone-700">
                      {copiedPill ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Filled</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Auto-fill</span>
                        </>
                      )}
                    </div>
                  </div>
                )}

                <div className="text-center my-4">
                  <h2 className="font-extrabold text-xl text-slate-900 dark:text-white tracking-tight">
                    Verify your number
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Enter the 4-digit code sent to{' '}
                    <span className="font-bold text-slate-800 dark:text-slate-200">+91 {phoneNumber}</span>
                  </p>
                </div>

                {errorMessage && (
                  <div className="mb-4 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* 4 Large Frosted OTP Input Digits */}
                <div className="flex items-center justify-center gap-3 my-5">
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => {
                        digitRefs.current[idx] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleDigitChange(idx, e.target.value)}
                      onKeyDown={(e) => handleDigitKeyDown(idx, e)}
                      onPaste={handleDigitPaste}
                      className={`w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-black rounded-2xl border-2 transition-all focus:outline-none ${
                        digit
                          ? 'border-[#0a5c36] bg-emerald-50 dark:bg-emerald-950/30 text-[#0a5c36] dark:text-emerald-400 shadow-sm'
                          : 'border-slate-200 dark:border-stone-700 bg-white/80 dark:bg-stone-800/80 text-slate-900 dark:text-white focus:border-[#0a5c36] focus:ring-4 focus:ring-[#0a5c36]/15'
                      }`}
                    />
                  ))}
                </div>

                {/* Verify Button */}
                <button
                  type="button"
                  onClick={() => verifyPhoneOtp(otpDigits.join(''))}
                  disabled={otpDigits.some((d) => d === '') || isLoading}
                  className="w-full py-3.5 pl-6 pr-3 rounded-full bg-gradient-to-r from-[#047857] via-[#059669] to-[#047857] hover:from-[#065f46] hover:to-[#047857] text-white font-bold text-sm shadow-[0_10px_25px_-5px_rgba(5,150,105,0.4)] disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-between cursor-pointer mb-4 group active:scale-[0.99]"
                >
                  {isLoading ? (
                    <div className="w-full flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Verifying Code...</span>
                    </div>
                  ) : (
                    <>
                      <span className="flex-1 text-center font-bold">Verify & Continue</span>
                      <span className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-emerald-700 shadow-xs flex-shrink-0 group-hover:translate-x-0.5 transition-transform">
                        <ArrowRight className="w-4 h-4" />
                      </span>
                    </>
                  )}
                </button>

                {/* Resend OTP */}
                <div className="text-center text-xs">
                  <span className="text-slate-500 dark:text-slate-400 block mb-1">Didn&apos;t receive the code?</span>
                  {phoneCooldown > 0 ? (
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      Resend in{' '}
                      <span className="text-[#0a5c36] dark:text-emerald-400 font-bold">
                        00:{phoneCooldown < 10 ? `0${phoneCooldown}` : phoneCooldown}s
                      </span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendPhoneOtp}
                      disabled={isLoading}
                      className="font-bold text-[#0a5c36] dark:text-emerald-400 hover:underline cursor-pointer"
                    >
                      Resend OTP
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* -------------------- MERCHANT PARTNER HUB -------------------- */
          <div className="mt-6">
            <div className="text-center mb-5">
              <h2 className="font-extrabold text-2xl text-slate-900 dark:text-white tracking-tight">
                Merchant Partner Hub
              </h2>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
                Sign in to manage your store catalog and orders
              </p>
            </div>

            {errorMessage && (
              <div className="mb-4 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleEmailLogin} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                  Merchant Email Address
                </label>
                <div className="relative flex items-center rounded-full bg-white/60 dark:bg-stone-800/60 backdrop-blur-md border border-white/90 dark:border-stone-700/90 px-4 py-3.5 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] hover:border-emerald-500/70 focus-within:border-[#0a5c36] focus-within:ring-2 focus-within:ring-[#0a5c36]/20 transition-all">
                  <Mail className="w-4 h-4 text-slate-400 mr-2.5 flex-shrink-0" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="merchant@freshgrocers.com"
                    required
                    className="w-full bg-transparent text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                    Password
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-[11px] text-[#0a5c36] dark:text-emerald-400 hover:underline font-semibold"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative flex items-center rounded-full bg-white/60 dark:bg-stone-800/60 backdrop-blur-md border border-white/90 dark:border-stone-700/90 px-4 py-3.5 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] hover:border-emerald-500/70 focus-within:border-[#0a5c36] focus-within:ring-2 focus-within:ring-[#0a5c36]/20 transition-all">
                  <Lock className="w-4 h-4 text-slate-400 mr-2.5 flex-shrink-0" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    className="w-full bg-transparent text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer ml-1"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 pl-6 pr-3 rounded-full bg-gradient-to-r from-[#047857] via-[#059669] to-[#047857] hover:from-[#065f46] hover:to-[#047857] text-white font-bold text-sm shadow-[0_10px_25px_-5px_rgba(5,150,105,0.4)] hover:shadow-[0_12px_28px_-5px_rgba(5,150,105,0.5)] disabled:opacity-50 cursor-pointer active:scale-[0.99] transition-all flex items-center justify-between mt-4 group"
              >
                {isLoading ? (
                  <div className="w-full flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing in...</span>
                  </div>
                ) : (
                  <>
                    <span className="flex-1 text-center font-bold">Sign In to Merchant Hub</span>
                    <span className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-emerald-700 shadow-xs flex-shrink-0 group-hover:translate-x-0.5 transition-transform">
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  </>
                )}
              </button>
            </form>

            {/* Instant Demo Merchant Access */}
            <div className="mt-4 pt-3 border-t border-slate-200/80 dark:border-stone-700/80">
              <button
                type="button"
                onClick={() => handleQuickLogin('MERCHANT')}
                disabled={isLoading}
                className="w-full py-2.5 px-3 rounded-full bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/20 text-[#0a5c36] dark:text-emerald-300 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Store className="w-3.5 h-3.5" />
                <span>Instant 1-Tap Demo Merchant Access</span>
              </button>
            </div>

            {/* Merchant Onboarding Link */}
            <div className="mt-4 text-center text-xs text-slate-500 dark:text-slate-400">
              <span>Want to sell on CartPilot? </span>
              <Link
                to="/become-merchant"
                className="font-bold text-[#0a5c36] dark:text-emerald-400 hover:underline"
              >
                Apply as a Merchant →
              </Link>
            </div>
          </div>
        )}

        {/* Legal Micro-Footer */}
        <div className="mt-6 pt-4 border-t border-slate-200/60 dark:border-stone-700/60 text-center text-[10px] text-slate-400 dark:text-slate-500 flex flex-col items-center gap-1.5">
          <div>
            <span>By continuing, you agree to our </span>
            <span className="underline hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer">Terms of Service</span>
            <span> & </span>
            <span className="underline hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer">Privacy Policy</span>
          </div>
          <Link
            to="/admin/login"
            className="hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors inline-flex items-center gap-1 opacity-70 hover:opacity-100"
            title="Master Admin Security Gateway"
          >
            <Lock className="w-2.5 h-2.5" />
            <span>Master Admin Portal</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
