import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth, UserRole } from '../../context/AuthContext';
import {
  ShieldCheck,
  Lock,
  Mail,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  User,
  Store,
  ShieldAlert,
  Eye,
  EyeOff,
  Leaf,
  Truck,
  Copy,
  CheckCircle2,
  Smartphone,
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

  // Mode: 'PHONE' (default shopper quick-commerce flow) vs 'EMAIL' (password/merchant/admin)
  const [authMode, setAuthMode] = useState<'PHONE' | 'EMAIL'>('PHONE');

  // Phone OTP state
  const [phoneStep, setPhoneStep] = useState<'NUMBER' | 'OTP'>('NUMBER');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '']);
  const [simulatedCode, setSimulatedCode] = useState<string | null>(null);
  const [copiedPill, setCopiedPill] = useState(false);
  const [phoneCooldown, setPhoneCooldown] = useState(60);
  const digitRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Email/Password state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showDevShortcuts, setShowDevShortcuts] = useState(true);

  // Common UI state
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // If already authenticated, redirect straight to user's authorized workspace
  useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      let targetPath = '';
      try {
        targetPath = sessionStorage.getItem('cartpilot_redirect') || '';
        sessionStorage.removeItem('cartpilot_redirect');
      } catch {}

      if (!targetPath || targetPath === '/login') {
        targetPath =
          user.role === 'MERCHANT' ? '/merchant' : user.role === 'ADMIN' ? '/admin' : '/shopper';
      }
      navigate(targetPath, { replace: true });
    }
  }, [authLoading, isAuthenticated, user, navigate]);

  // Countdown for Phone OTP resend
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (authMode === 'PHONE' && phoneStep === 'OTP' && phoneCooldown > 0) {
      timer = setInterval(() => {
        setPhoneCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [authMode, phoneStep, phoneCooldown]);

  const redirectAfterAuth = (role: UserRole) => {
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
    if (role === 'CUSTOMER') {
      navigate('/shopper', { replace: true });
    } else if (role === 'MERCHANT') {
      navigate('/merchant', { replace: true });
    } else if (role === 'ADMIN') {
      navigate('/admin', { replace: true });
    }
  };

  // --- Phone OTP Handlers ---
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 10);
    setPhoneNumber(raw);
    setErrorMessage(null);
  };

  const handleSendPhoneOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (phoneNumber.length < 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number.');
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

  // --- Email/Password Handlers ---
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
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-8 bg-paper font-sans text-ink relative overflow-hidden">
      {/* Decorative ambient backdrop */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 rounded-full bg-acc/10 blur-3xl pointer-events-none" />

      {/* Main Container Card */}
      <div className="w-full max-w-md bg-card border border-brd rounded-3xl shadow-2xl overflow-hidden relative z-10 backdrop-blur-md">
        {/* Top Header Mode Tabs */}
        <div className="grid grid-cols-2 border-b border-brd bg-paper/60 text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setAuthMode('PHONE');
              setErrorMessage(null);
            }}
            className={`py-3 px-4 flex items-center justify-center gap-2 transition-colors cursor-pointer border-b-2 ${
              authMode === 'PHONE'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-stone-900'
                : 'border-transparent text-mut hover:text-ink'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Mobile OTP (Shopper)</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMode('EMAIL');
              setErrorMessage(null);
            }}
            className={`py-3 px-4 flex items-center justify-center gap-2 transition-colors cursor-pointer border-b-2 ${
              authMode === 'EMAIL'
                ? 'border-acc text-acc bg-white dark:bg-stone-900'
                : 'border-transparent text-mut hover:text-ink'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Staff & Password</span>
          </button>
        </div>

        {/* -------------------- PHONE OTP MODE -------------------- */}
        {authMode === 'PHONE' ? (
          <div>
            {phoneStep === 'NUMBER' ? (
              <div>
                {/* Reference Banner: Fresh Produce Header */}
                <div className="relative h-44 bg-gradient-to-b from-emerald-600 to-emerald-700 flex flex-col items-center justify-center text-center p-4 overflow-hidden">
                  <div className="absolute -top-4 -left-4 w-28 h-28 bg-emerald-500/30 rounded-full blur-xl pointer-events-none" />
                  <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-emerald-400/20 rounded-full blur-xl pointer-events-none" />

                  <div className="relative z-10 flex flex-col items-center">
                    <div className="w-12 h-12 rounded-2xl bg-white text-emerald-700 flex items-center justify-center shadow-md mb-2">
                      <Leaf className="w-7 h-7 text-emerald-600 fill-emerald-600" />
                    </div>
                    <h1 className="font-extrabold text-2xl text-white tracking-tight flex items-center gap-1.5">
                      CartPilot
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-800/80 text-emerald-200 px-2 py-0.5 rounded-full border border-emerald-400/30">
                        100% Veg
                      </span>
                    </h1>
                    <p className="text-emerald-100 text-xs font-medium mt-1">
                      Fresh Pick · Fayda Quick
                    </p>
                  </div>

                  <div className="absolute bottom-2 left-4 text-2xl select-none opacity-85">🥦</div>
                  <div className="absolute bottom-3 right-4 text-2xl select-none opacity-85">🍎</div>
                  <div className="absolute top-3 left-4 text-xl select-none opacity-80">🥕</div>
                  <div className="absolute top-3 right-5 text-xl select-none opacity-80">🍋</div>
                </div>

                {/* Form Body */}
                <div className="p-7">
                  <div className="text-center mb-5">
                    <h2 className="font-bold text-lg text-ink">Welcome to CartPilot</h2>
                    <p className="text-xs text-mut mt-1">
                      Fresh Fruits & Veggies Delivered Every Morning
                    </p>
                  </div>

                  {errorMessage && (
                    <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  <form onSubmit={handleSendPhoneOtp} className="space-y-4">
                    <div>
                      <div className="flex items-center rounded-2xl border-2 border-emerald-500 bg-paper p-1 px-3 shadow-sm focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all">
                        <div className="flex items-center gap-1.5 pr-2.5 border-r border-brd text-ink font-semibold text-sm select-none">
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
                          className="w-full pl-3 py-2.5 bg-transparent text-sm font-medium text-ink placeholder:text-mut focus:outline-none"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={phoneNumber.length !== 10 || isLoading}
                      className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Sending OTP...</span>
                        </>
                      ) : (
                        <span>Continue</span>
                      )}
                    </button>
                  </form>

                  <div className="flex items-center justify-center gap-1.5 text-[11px] text-mut mt-4 font-medium">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Secure login with OTP verification</span>
                  </div>

                  {/* Feature Cards matching reference */}
                  <div className="grid grid-cols-2 gap-2.5 mt-5 pt-4 border-t border-brd">
                    <div className="p-3 rounded-2xl bg-emerald-500/5 border border-emerald-500/15 text-left">
                      <div className="w-7 h-7 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-1.5">
                        <Leaf className="w-4 h-4" />
                      </div>
                      <div className="font-bold text-[11px] text-ink">Farm Fresh Daily</div>
                      <div className="text-[10px] text-mut">Handpicked for you</div>
                    </div>

                    <div className="p-3 rounded-2xl bg-emerald-500/5 border border-emerald-500/15 text-left">
                      <div className="w-7 h-7 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-1.5">
                        <Truck className="w-4 h-4" />
                      </div>
                      <div className="font-bold text-[11px] text-ink">Morning Delivery</div>
                      <div className="text-[10px] text-mut">Fresh at your doorstep</div>
                    </div>
                  </div>

                  <p className="text-[10px] text-center text-mut mt-5">
                    By continuing, you agree to our{' '}
                    <span className="underline cursor-pointer hover:text-ink">Terms of Service</span>
                  </p>
                </div>
              </div>
            ) : (
              /* Phone OTP Verification Screen */
              <div className="p-7">
                <div className="flex items-center justify-between mb-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPhoneStep('NUMBER');
                      setErrorMessage(null);
                    }}
                    className="w-8 h-8 rounded-full bg-paper border border-brd text-mut hover:text-ink flex items-center justify-center transition-colors cursor-pointer"
                    aria-label="Back to mobile number"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    CartPilot Auth
                  </div>
                  <div className="w-8" />
                </div>

                {/* Simulated SMS Pill Banner */}
                {simulatedCode && (
                  <div
                    onClick={() => autoFillSimulatedCode(simulatedCode)}
                    className="mb-5 p-2.5 px-3.5 rounded-2xl bg-stone-900 text-white shadow-xl flex items-center justify-between cursor-pointer hover:bg-stone-800 active:scale-[0.99] transition-all border border-stone-700 animate-in slide-in-from-top-4"
                  >
                    <div className="flex items-center gap-2 text-xs truncate">
                      <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white flex-shrink-0">
                        💬
                      </div>
                      <span className="truncate text-stone-200">
                        AD-CARTPLT · Code is{' '}
                        <span className="font-bold text-white tracking-widest">
                          {simulatedCode}
                        </span>
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-stone-800 px-2 py-1 rounded-lg border border-stone-700">
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
                  <h2 className="font-bold text-xl text-ink">Verify your number</h2>
                  <p className="text-xs text-mut mt-1">
                    Enter the 4-digit code sent to{' '}
                    <span className="font-semibold text-ink">+91 {phoneNumber}</span>
                  </p>
                </div>

                {errorMessage && (
                  <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <div className="flex items-center justify-center gap-3 my-6">
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
                      className={`w-14 h-14 text-center text-2xl font-bold rounded-2xl border-2 transition-all focus:outline-none ${
                        digit
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'border-brd bg-paper text-ink focus:border-emerald-500'
                      }`}
                    />
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => verifyPhoneOtp(otpDigits.join(''))}
                  disabled={otpDigits.some((d) => d === '') || isLoading}
                  className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 cursor-pointer mb-5"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Verifying Code...</span>
                    </>
                  ) : (
                    <span>Verify & Continue</span>
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
          /* -------------------- EMAIL & PASSWORD / STAFF MODE -------------------- */
          <div className="p-8">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-acc flex items-center justify-center text-white mb-3 shadow-lg shadow-acc/20">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-2">
                <h1 className="font-display font-extrabold text-2xl text-ink tracking-tight">
                  Staff Gateway
                </h1>
                <span className="text-[10px] font-mono uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-500/20">
                  Role-Based
                </span>
              </div>
              <p className="text-xs text-mut mt-1">Merchant, Admin, & Registered Shoppers</p>
            </div>

            {errorMessage && (
              <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleEmailLogin} className="space-y-4">
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
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-mut hover:text-ink transition-colors cursor-pointer"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-xl bg-acc text-white font-semibold text-xs hover:bg-blue-600 active:scale-[0.99] transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 mt-2 disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In with Password</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-5 pt-4 border-t border-brd text-center text-xs space-y-2">
              <div className="text-mut">
                <span>Don&apos;t have an account? </span>
                <Link to="/register" className="text-acc font-semibold hover:underline">
                  Create Customer Account
                </Link>
              </div>
              <div className="text-mut text-[11px]">
                <span>Want to sell on CartPilot? </span>
                <Link
                  to="/become-merchant"
                  className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
                >
                  Apply as a Merchant →
                </Link>
              </div>
            </div>

            {/* Development Quick-Fill Accordion */}
            {DEMO_CREDENTIALS && (
              <div className="mt-6 pt-4 border-t border-dashed border-brd">
                <button
                  type="button"
                  onClick={() => setShowDevShortcuts(!showDevShortcuts)}
                  className="w-full flex items-center justify-between text-[11px] font-semibold text-mut hover:text-ink transition-colors py-1 cursor-pointer"
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
                      className="w-full p-2 rounded-lg bg-paper/80 hover:bg-paper border border-brd text-left flex items-center justify-between text-xs transition-colors group cursor-pointer"
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
                      className="w-full p-2 rounded-lg bg-paper/80 hover:bg-paper border border-brd text-left flex items-center justify-between text-xs transition-colors group cursor-pointer"
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
                      className="w-full p-2 rounded-lg bg-paper/80 hover:bg-paper border border-brd text-left flex items-center justify-between text-xs transition-colors group cursor-pointer"
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
        )}
      </div>
    </div>
  );
};
