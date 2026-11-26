import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { SignInButton } from '@clerk/clerk-react';
import { useAuth, UserRole } from '../../context/AuthContext';
import {
  ShieldCheck,
  Lock,
  Mail,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  Leaf,
  Truck,
  Copy,
  CheckCircle2,
  Smartphone,
  MapPin,
  Sparkles,
  Store,
  Compass,
  Zap,
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

  // Mode: 'PHONE' (default shopper quick-commerce flow) vs 'MERCHANT' (store partner gateway)
  const [authMode, setAuthMode] = useState<'PHONE' | 'MERCHANT'>('PHONE');

  // Phone OTP state
  const [phoneStep, setPhoneStep] = useState<'NUMBER' | 'OTP'>('NUMBER');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '']);
  const [simulatedCode, setSimulatedCode] = useState<string | null>(null);
  const [copiedPill, setCopiedPill] = useState(false);
  const [phoneCooldown, setPhoneCooldown] = useState(60);
  const digitRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Location Auto-Detection State (Blinkit / Instamart style)
  const [detectedLocation, setDetectedLocation] = useState<string>('HSR Layout, Bengaluru');
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  // Email/Password state (for Merchant Partner)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

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

  // HTML5 Live Geolocation Detection
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setDetectedLocation('HSR Layout, Bengaluru (Active Zone)');
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
        setDetectedLocation('HSR Layout, Bengaluru (Verified Zone)');
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

  // --- Email/Password Handlers (Merchant) ---
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
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-8 bg-gradient-to-br from-emerald-50 via-stone-50 to-emerald-100/40 dark:from-stone-950 dark:via-stone-900 dark:to-emerald-950/30 font-sans text-ink relative overflow-hidden selection:bg-emerald-500 selection:text-white">
      {/* Dynamic ambient glassmorphic aurora glow */}
      <div className="absolute top-1/4 -left-28 w-96 h-96 rounded-full bg-emerald-400/20 dark:bg-emerald-600/10 blur-[100px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 -right-28 w-96 h-96 rounded-full bg-teal-400/20 dark:bg-teal-600/10 blur-[100px] pointer-events-none animate-pulse" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-emerald-300/10 dark:bg-emerald-500/5 blur-[120px] pointer-events-none" />

      {/* Main Container Card: Sleek 2-column glassmorphic shell */}
      <div className="w-full max-w-md lg:max-w-5xl xl:max-w-6xl bg-white/80 dark:bg-stone-900/85 backdrop-blur-2xl border border-white/60 dark:border-stone-800 rounded-[2.5rem] shadow-[0_25px_60px_-15px_rgba(16,185,129,0.18)] overflow-hidden relative z-10 lg:grid lg:grid-cols-12 min-h-[640px]">
        
        {/* Left Column: Rich Branded Gen-Z / AI Showcase (Desktop) */}
        <div className="hidden lg:flex lg:col-span-6 bg-gradient-to-br from-emerald-800 via-emerald-900 to-stone-950 text-white p-10 lg:p-12 flex-col justify-between relative overflow-hidden">
          {/* Subtle glowing ambient particles */}
          <div className="absolute -top-16 -left-16 w-60 h-60 bg-emerald-400/25 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -right-16 w-60 h-60 bg-teal-300/20 rounded-full blur-3xl pointer-events-none" />

          {/* Top Brand & Mission */}
          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white text-emerald-800 flex items-center justify-center shadow-xl shadow-emerald-950/40">
                <Leaf className="w-7 h-7 text-emerald-600 fill-emerald-600" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-2xl tracking-tight text-white">CartPilot</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-400/25 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-400/40 backdrop-blur-sm">
                    100% Veg
                  </span>
                </div>
                <p className="text-emerald-200/90 text-xs font-medium">100% Pure Vegetarian · Express Delivery</p>
              </div>
            </div>

            <div className="pt-4 space-y-3">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-emerald-200 border border-white/15">
                <Truck className="w-3.5 h-3.5 text-emerald-300" />
                <span>Midnight Cutoff · 6 AM – 9 AM Delivery</span>
              </div>
              <h2 className="text-3xl xl:text-4xl font-black leading-tight text-white tracking-tight">
                Farm-Fresh Groceries & Agentic AI Meal Planning.
              </h2>
              <p className="text-emerald-100/80 text-sm leading-relaxed max-w-md">
                Experience ultra-fast vegetarian delivery, autonomous cart generation with personalized spending mandates, and instant OTP access.
              </p>
            </div>
          </div>

          {/* Middle Interactive Gen-Z Chips */}
          <div className="relative z-10 py-5 space-y-3 border-y border-emerald-700/50 my-6">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0 text-emerald-300">
                <Leaf className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-white">100% Certified Vegetarian</h4>
                <p className="text-xs text-emerald-200/75">Zero meat, zero fish, zero eggs. Strictly certified vegetarian organic farms.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0 text-emerald-300">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-white">AI-Powered Autonomous Shopping</h4>
                <p className="text-xs text-emerald-200/75">Tell CartPilot what you want to cook. It calculates recipes, checks pantry, and builds your cart.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0 text-emerald-300">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-white">₹100 Instant Wallet Welcome Bonus</h4>
                <p className="text-xs text-emerald-200/75">Add ₹999 to your wallet and instantly receive ₹100 extra shopping credits.</p>
              </div>
            </div>
          </div>

          {/* Bottom Social Proof Metrics */}
          <div className="relative z-10 flex items-center justify-between text-xs text-emerald-100/90 pt-1">
            <div>
              <span className="block font-black text-xl text-white">50,000+</span>
              <span className="text-[11px] text-emerald-200/70">Happy Households</span>
            </div>
            <div className="w-px h-8 bg-emerald-700/60" />
            <div>
              <span className="block font-black text-xl text-white">4.9 / 5.0</span>
              <span className="text-[11px] text-emerald-200/70">Customer Rating</span>
            </div>
            <div className="w-px h-8 bg-emerald-700/60" />
            <div>
              <span className="block font-black text-xl text-white">100%</span>
              <span className="text-[11px] text-emerald-200/70">Pure Vegetarian</span>
            </div>
          </div>
        </div>

        {/* Right Column: Forms & Controls */}
        <div className="w-full lg:col-span-6 flex flex-col justify-between bg-card/60 backdrop-blur-xl">
          
          {/* Top Mode Navigation Tabs */}
          <div className="grid grid-cols-2 border-b border-brd bg-stone-100/70 dark:bg-stone-900/70 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setAuthMode('PHONE');
                setErrorMessage(null);
              }}
              className={`py-4 px-4 flex items-center justify-center gap-2 transition-all cursor-pointer border-b-2 ${
                authMode === 'PHONE'
                  ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 bg-white dark:bg-stone-900 shadow-2xs font-extrabold'
                  : 'border-transparent text-mut hover:text-ink'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>Shopper Quick Login</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('MERCHANT');
                setErrorMessage(null);
              }}
              className={`py-4 px-4 flex items-center justify-center gap-2 transition-all cursor-pointer border-b-2 ${
                authMode === 'MERCHANT'
                  ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 bg-white dark:bg-stone-900 shadow-2xs font-extrabold'
                  : 'border-transparent text-mut hover:text-ink'
              }`}
            >
              <Store className="w-4 h-4" />
              <span>Merchant Partner Hub</span>
            </button>
          </div>

          {/* -------------------- SHOPPER PHONE OTP MODE -------------------- */}
          {authMode === 'PHONE' ? (
            <div>
              {phoneStep === 'NUMBER' ? (
                <div>
                  {/* Mobile Header Banner (Visible on mobile/tablet) */}
                  <div className="block lg:hidden relative h-40 bg-gradient-to-b from-emerald-600 to-emerald-700 flex flex-col items-center justify-center text-center p-4 overflow-hidden">
                    <div className="relative z-10 flex flex-col items-center">
                      <div className="w-11 h-11 rounded-2xl bg-white text-emerald-700 flex items-center justify-center shadow-md mb-2">
                        <Leaf className="w-6 h-6 text-emerald-600 fill-emerald-600" />
                      </div>
                      <h1 className="font-extrabold text-2xl text-white tracking-tight flex items-center gap-1.5">
                        CartPilot
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-800/80 text-emerald-200 px-2 py-0.5 rounded-full border border-emerald-400/30">
                          100% Veg
                        </span>
                      </h1>
                      <p className="text-emerald-100 text-xs font-medium mt-0.5">
                        100% Pure Vegetarian · Express Delivery
                      </p>
                    </div>
                  </div>

                  {/* Form Body */}
                  <div className="p-7 sm:p-9">
                    <div className="text-center mb-5">
                      <h2 className="font-black text-2xl text-ink tracking-tight">Welcome to CartPilot</h2>
                      <p className="text-xs sm:text-sm text-mut mt-1">
                        Fresh Fruits & Veggies Delivered Every Morning
                      </p>
                    </div>

                    {/* Blinkit-Style Live Delivery Zone Bar */}
                    <div className="flex items-center justify-between p-2.5 px-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs mb-5 shadow-2xs">
                      <div className="flex items-center gap-2 truncate">
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                        </span>
                        <MapPin className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                        <span className="text-emerald-950 dark:text-emerald-200 font-semibold truncate text-[11px]">
                          Delivering to: <span className="font-bold">{detectedLocation}</span>
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleDetectLocation}
                        disabled={isDetectingLocation}
                        className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 hover:underline flex-shrink-0 cursor-pointer ml-2 flex items-center gap-1"
                      >
                        <Compass className="w-3 h-3" />
                        <span>{isDetectingLocation ? 'Detecting...' : 'Detect GPS'}</span>
                      </button>
                    </div>

                    {errorMessage && (
                      <div className="mb-4 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <span>{errorMessage}</span>
                      </div>
                    )}

                    <form onSubmit={handleSendPhoneOtp} className="space-y-4">
                      <div>
                        <div className="flex items-center rounded-2xl border-2 border-emerald-500/80 bg-paper p-1 px-3.5 shadow-sm focus-within:ring-4 focus-within:ring-emerald-500/15 focus-within:border-emerald-600 transition-all">
                          <div className="flex items-center gap-1.5 pr-3 border-r border-brd text-ink font-bold text-sm select-none">
                            <span className="text-base" role="img" aria-label="India flag">
                              🇮🇳
                            </span>
                            <span>+91</span>
                          </div>
                          <input
                            type="tel"
                            value={phoneNumber}
                            onChange={handlePhoneChange}
                            placeholder="Enter mobile number"
                            autoFocus
                            maxLength={10}
                            className="w-full pl-3 py-3 bg-transparent text-sm font-semibold text-ink placeholder:text-mut focus:outline-none tracking-wide"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={phoneNumber.length !== 10 || isLoading}
                        className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-md shadow-emerald-600/25 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Sending OTP...</span>
                          </>
                        ) : (
                          <span>Continue with OTP</span>
                        )}
                      </button>
                    </form>

                    <div className="flex items-center justify-center gap-1.5 text-[11px] text-mut mt-3.5 font-medium">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Instant 100% verified sign-in with 4-digit code</span>
                    </div>

                    {/* Google OAuth & 1-Click Shopper Instant Access */}
                    <div className="mt-4 pt-3 border-t border-brd/70 space-y-2.5">
                      {Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY) ? (
                        <SignInButton mode="modal">
                          <button
                            type="button"
                            className="w-full py-3 px-4 rounded-2xl bg-paper hover:bg-paper/80 border border-brd text-ink font-bold text-xs flex items-center justify-center gap-2.5 transition-colors cursor-pointer shadow-2xs"
                          >
                            <svg className="w-4 h-4" viewBox="0 0 24 24">
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
                            <span>Sign in with Google</span>
                          </button>
                        </SignInButton>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleQuickLogin('CUSTOMER')}
                          className="w-full py-2.5 px-4 rounded-2xl bg-paper hover:bg-paper/80 border border-brd text-ink font-bold text-xs flex items-center justify-center gap-2.5 transition-colors cursor-pointer shadow-2xs"
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24">
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
                          <span>Sign in with Google (Shopper Demo)</span>
                        </button>
                      )}

                      {/* 1-Tap Shopper Demo Button (NO ADMIN, NO MERCHANT) */}
                      <button
                        type="button"
                        onClick={() => handleQuickLogin('CUSTOMER')}
                        className="w-full py-2.5 px-3 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-200 font-extrabold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Zap className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Instant 1-Tap Shopper Access</span>
                      </button>
                    </div>

                    {/* Gen-Z Feature Micro-Cards */}
                    <div className="grid grid-cols-2 gap-2.5 mt-5 pt-4 border-t border-brd">
                      <div className="p-3 rounded-2xl bg-emerald-500/5 border border-emerald-500/15 text-left">
                        <div className="w-7 h-7 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-1.5">
                          <Leaf className="w-4 h-4" />
                        </div>
                        <div className="font-bold text-[11px] text-ink">Farm Fresh Daily</div>
                        <div className="text-[10px] text-mut">100% Certified Vegetarian</div>
                      </div>

                      <div className="p-3 rounded-2xl bg-emerald-500/5 border border-emerald-500/15 text-left">
                        <div className="w-7 h-7 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-1.5">
                          <Truck className="w-4 h-4" />
                        </div>
                        <div className="font-bold text-[11px] text-ink">Morning Delivery</div>
                        <div className="text-[10px] text-mut">Fresh at your doorstep 6–9 AM</div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Phone OTP Verification Screen */
                <div className="p-7 sm:p-9">
                  <div className="flex items-center justify-between mb-4">
                    <button
                      type="button"
                      onClick={() => {
                        setPhoneStep('NUMBER');
                        setErrorMessage(null);
                      }}
                      className="w-9 h-9 rounded-2xl bg-paper border border-brd text-mut hover:text-ink flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
                      aria-label="Back to mobile number"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                    <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      CartPilot Secure Auth
                    </div>
                    <div className="w-9" />
                  </div>

                  {/* Simulated SMS Pill Banner */}
                  {simulatedCode && (
                    <div
                      onClick={() => autoFillSimulatedCode(simulatedCode)}
                      className="mb-5 p-3 px-4 rounded-2xl bg-stone-900 text-white shadow-xl flex items-center justify-between cursor-pointer hover:bg-stone-800 active:scale-[0.99] transition-all border border-stone-700 animate-in slide-in-from-top-4"
                    >
                      <div className="flex items-center gap-2 text-xs truncate">
                        <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-white flex-shrink-0 text-[10px]">
                          💬
                        </div>
                        <span className="truncate text-stone-200">
                          AD-CARTPLT · Code is{' '}
                          <span className="font-mono font-black text-white tracking-widest text-sm">
                            {simulatedCode}
                          </span>
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-stone-800 px-2.5 py-1 rounded-xl border border-stone-700">
                        {copiedPill ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
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

                  <div className="text-center my-6">
                    <h2 className="font-black text-2xl text-ink tracking-tight">Verify your number</h2>
                    <p className="text-xs text-mut mt-1.5">
                      Enter the 4-digit verification code sent to{' '}
                      <span className="font-bold text-ink">+91 {phoneNumber}</span>
                    </p>
                  </div>

                  {errorMessage && (
                    <div className="mb-5 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-center gap-3.5 my-6">
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
                        className={`w-14 h-16 text-center text-2xl font-black rounded-2xl border-2 transition-all focus:outline-none ${
                          digit
                            ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 shadow-sm'
                            : 'border-brd bg-paper text-ink focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15'
                        }`}
                      />
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => verifyPhoneOtp(otpDigits.join(''))}
                    disabled={otpDigits.some((d) => d === '') || isLoading}
                    className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-md shadow-emerald-600/25 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 cursor-pointer mb-5 active:scale-[0.99]"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Verifying Code...</span>
                      </>
                    ) : (
                      <span>Verify & Enter Store</span>
                    )}
                  </button>

                  <div className="text-center text-xs">
                    <span className="text-mut block mb-1">Didn&apos;t receive the OTP?</span>
                    {phoneCooldown > 0 ? (
                      <span className="font-semibold text-ink">
                        Resend in{' '}
                        <span className="text-emerald-600 font-bold">
                          00:{phoneCooldown < 10 ? `0${phoneCooldown}` : phoneCooldown}s
                        </span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResendPhoneOtp}
                        disabled={isLoading}
                        className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
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
            <div className="p-8 sm:p-10">
              <div className="flex flex-col items-center text-center mb-6">
                <div className="w-12 h-12 rounded-2xl bg-emerald-700 flex items-center justify-center text-white mb-3 shadow-lg shadow-emerald-800/20">
                  <Store className="w-6 h-6" />
                </div>
                <div className="flex items-center gap-2">
                  <h1 className="font-black text-2xl text-ink tracking-tight">
                    Merchant Partner Hub
                  </h1>
                  <span className="text-[10px] font-mono uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-500/20">
                    Store Partner
                  </span>
                </div>
                <p className="text-xs text-mut mt-1">Manage orders, store inventory, and live grocery catalog</p>
              </div>

              {errorMessage && (
                <div className="mb-5 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-ink mb-1.5">Merchant Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-mut absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="merchant@freshgrocers.com"
                      required
                      className="w-full pl-10 pr-4 py-3 rounded-2xl border border-brd bg-paper text-xs text-ink placeholder:text-mut focus:outline-none focus:ring-4 focus:ring-emerald-500/15 focus:border-emerald-600 transition-all font-medium"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-ink">Password</label>
                    <Link
                      to="/forgot-password"
                      className="text-[11px] text-emerald-600 hover:underline font-semibold"
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
                      className="w-full pl-10 pr-10 py-3 rounded-2xl border border-brd bg-paper text-xs text-ink placeholder:text-mut focus:outline-none focus:ring-4 focus:ring-emerald-500/15 focus:border-emerald-600 transition-all font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-mut hover:text-ink transition-colors cursor-pointer"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 px-4 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs shadow-md shadow-emerald-700/20 flex items-center justify-center gap-2 mt-2 disabled:opacity-50 cursor-pointer active:scale-[0.99] transition-all"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Authenticating Merchant...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In to Merchant Hub</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Instant 1-Click Demo Merchant Access */}
              <div className="mt-5 pt-4 border-t border-brd space-y-2">
                <button
                  type="button"
                  onClick={() => handleQuickLogin('MERCHANT')}
                  disabled={isLoading}
                  className="w-full py-2.5 px-3 rounded-2xl bg-blue-500/10 hover:bg-blue-500/15 border border-blue-500/20 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Store className="w-3.5 h-3.5" />
                  <span>Instant 1-Tap Demo Merchant Access</span>
                </button>
              </div>

              <div className="mt-5 pt-4 border-t border-brd text-center text-xs space-y-2">
                <div className="text-mut text-[11px]">
                  <span>New store partner? </span>
                  <Link
                    to="/become-merchant"
                    className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
                  >
                    Apply to Sell on CartPilot →
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Clean Footer Link */}
          <div className="p-4 px-6 border-t border-brd/60 text-center text-[11px] text-mut bg-paper/30">
            <span>By signing in, you agree to CartPilot&apos;s </span>
            <span className="underline cursor-pointer hover:text-ink">Terms of Service</span>
            <span> and </span>
            <span className="underline cursor-pointer hover:text-ink">Privacy Policy</span>
          </div>
        </div>
      </div>
    </div>
  );
};
