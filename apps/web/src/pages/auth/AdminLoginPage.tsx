import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  Mail,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  Copy,
  CheckCircle2,
  KeyRound,
  Radio,
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || '/api/v1';

export const AdminLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, token, setSession } = useAuth() as any;

  // Step: 'CREDENTIALS' -> 'MFA'
  const [step, setStep] = useState<'CREDENTIALS' | 'MFA'>('CREDENTIALS');
  const [email, setEmail] = useState('admin@cartpilot.com');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // MFA Challenge State
  const [mfaToken, setMfaToken] = useState<string | null>(null);
  const [simulatedMfaCode, setSimulatedMfaCode] = useState<string | null>(null);
  const [copiedPill, setCopiedPill] = useState(false);
  const [mfaDigits, setMfaDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [mfaCooldown, setMfaCooldown] = useState(300); // 5 minutes
  const digitRefs = useRef<(HTMLInputElement | null)[]>([]);

  // UI state
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already authenticated as Admin
  useEffect(() => {
    if (token && user && user.role === 'ADMIN') {
      navigate('/admin', { replace: true });
    }
  }, [token, user, navigate]);

  // MFA Countdown Timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 'MFA' && mfaCooldown > 0) {
      timer = setInterval(() => {
        setMfaCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, mfaCooldown]);

  // Step 1: Submit Credentials & Generate MFA Challenge
  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();
      setIsLoading(false);

      if (!res.ok || !data.success) {
        setErrorMessage(data.error?.message || 'Invalid administrator credentials');
        return;
      }

      if (data.data?.mfaRequired && data.data?.mfaToken) {
        setMfaToken(data.data.mfaToken);
        if (data.data.simulatedMfaCode) {
          setSimulatedMfaCode(data.data.simulatedMfaCode);
        }
        setStep('MFA');
        setMfaCooldown(data.data.expiresInSeconds || 300);
        setMfaDigits(['', '', '', '', '', '']);
        setTimeout(() => {
          digitRefs.current[0]?.focus();
        }, 100);
      } else {
        setErrorMessage('Unexpected response from authentication gate');
      }
    } catch {
      setIsLoading(false);
      setErrorMessage('Unable to connect to security gateway. Please verify network connectivity.');
    }
  };

  // Step 2: MFA Digit Handlers
  const handleDigitChange = (index: number, val: string) => {
    const cleaned = val.replace(/\D/g, '');
    if (!cleaned) {
      const copy = [...mfaDigits];
      copy[index] = '';
      setMfaDigits(copy);
      return;
    }

    const char = cleaned.slice(-1);
    const updated = [...mfaDigits];
    updated[index] = char;
    setMfaDigits(updated);

    if (index < 5 && char) {
      digitRefs.current[index + 1]?.focus();
    }

    if (index === 5 || updated.every((d) => d !== '')) {
      const fullCode = updated.join('');
      if (fullCode.length === 6) {
        handleMfaSubmit(fullCode);
      }
    }
  };

  const handleDigitKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !mfaDigits[index] && index > 0) {
      digitRefs.current[index - 1]?.focus();
    }
  };

  const handleDigitPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const chars = pasted.split('');
    const nextDigits = ['', '', '', '', '', ''];
    chars.forEach((c, idx) => {
      if (idx < 6) nextDigits[idx] = c;
    });
    setMfaDigits(nextDigits);

    if (chars.length === 6) {
      handleMfaSubmit(pasted);
    } else {
      const focusIndex = Math.min(chars.length, 5);
      digitRefs.current[focusIndex]?.focus();
    }
  };

  const autoFillSimulatedCode = (code: string) => {
    const chars = code.slice(0, 6).split('');
    const nextDigits = ['', '', '', '', '', ''];
    chars.forEach((c, idx) => {
      if (idx < 6) nextDigits[idx] = c;
    });
    setMfaDigits(nextDigits);
    setCopiedPill(true);
    setTimeout(() => setCopiedPill(false), 2000);
    handleMfaSubmit(code);
  };

  const handleMfaSubmit = async (codeToVerify?: string) => {
    const code = codeToVerify || mfaDigits.join('');
    if (!mfaToken || code.length !== 6) {
      setErrorMessage('Please enter the complete 6-digit MFA code');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`${API_BASE}/auth/admin/mfa/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mfaToken, code }),
      });

      const data = await res.json();
      setIsLoading(false);

      if (!res.ok || !data.success) {
        setErrorMessage(data.error?.message || 'Invalid or expired MFA verification code');
        setMfaDigits(['', '', '', '', '', '']);
        digitRefs.current[0]?.focus();
        return;
      }

      // Store authenticated admin session and redirect to Admin Control Center
      if (data.data?.accessToken && data.data?.user) {
        if (typeof setSession === 'function') {
          setSession(data.data.accessToken, data.data.user);
        } else {
          localStorage.setItem('cartpilot_token', data.data.accessToken);
          localStorage.setItem('cartpilot_user', JSON.stringify(data.data.user));
          window.location.href = '/admin';
          return;
        }
        navigate('/admin', { replace: true });
      }
    } catch {
      setIsLoading(false);
      setErrorMessage('MFA verification request failed. Please try again.');
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center px-4 py-8 bg-gradient-to-br from-slate-950 via-stone-900 to-emerald-950/60 font-sans text-white relative overflow-hidden selection:bg-emerald-500 selection:text-white">
      {/* Security Ambient Aurora Glows */}
      <div className="absolute top-1/4 -left-32 w-[500px] h-[500px] rounded-full bg-emerald-500/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-[520px] h-[520px] rounded-full bg-teal-500/10 blur-[140px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-emerald-600/5 blur-[160px] pointer-events-none" />

      {/* Glassmorphic Security Operations Card */}
      <div className="w-full max-w-[450px] bg-slate-900/80 backdrop-blur-3xl border border-slate-700/60 rounded-[32px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7),0_0_0_1px_rgba(255,255,255,0.08)_inset] p-7 sm:p-9 relative z-10 transition-all duration-300">
        
        {/* Top Header */}
        <div className="flex flex-col items-center text-center">
          <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-800 text-white flex items-center justify-center shadow-lg shadow-emerald-950/50 mb-3 border border-emerald-400/30">
            {step === 'CREDENTIALS' ? (
              <ShieldAlert className="w-7 h-7 text-emerald-300" />
            ) : (
              <KeyRound className="w-7 h-7 text-emerald-300 animate-pulse" />
            )}
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold tracking-wide uppercase mb-2">
            <Radio className="w-3 h-3 animate-ping text-emerald-400" />
            <span>Master Admin Gate · MFA Guard</span>
          </div>

          <h1 className="font-black text-2xl tracking-tight text-white">
            CartPilot Security Suite
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-xs">
            {step === 'CREDENTIALS'
              ? 'Authorized Personnel Only — Enter credentials to initiate multi-factor challenge'
              : 'Multi-Factor Challenge — Enter the 6-digit verification code'}
          </p>
        </div>

        {errorMessage && (
          <div className="mt-5 p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* -------------------- STEP 1: CREDENTIALS -------------------- */}
        {step === 'CREDENTIALS' ? (
          <form onSubmit={handleCredentialsSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Master Admin Email
              </label>
              <div className="relative flex items-center rounded-2xl bg-slate-800/80 border border-slate-700 px-4 py-3 shadow-inner focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all">
                <Mail className="w-4 h-4 text-slate-400 mr-2.5 flex-shrink-0" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@cartpilot.com"
                  required
                  className="w-full bg-transparent text-xs font-medium text-white placeholder:text-slate-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Master Password
              </label>
              <div className="relative flex items-center rounded-2xl bg-slate-800/80 border border-slate-700 px-4 py-3 shadow-inner focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all">
                <Lock className="w-4 h-4 text-slate-400 mr-2.5 flex-shrink-0" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full bg-transparent text-xs font-medium text-white placeholder:text-slate-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-slate-400 hover:text-slate-200 transition-colors cursor-pointer ml-1"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !password}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold text-xs shadow-lg shadow-emerald-950/60 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 cursor-pointer mt-4 active:scale-[0.99]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Initiating MFA Challenge...</span>
                </>
              ) : (
                <>
                  <span>Initiate MFA Challenge</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* 1-Tap Quick Fill Demo Credentials */}
            <div className="pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setEmail('admin@cartpilot.com');
                  setPassword('Admin1234!');
                  setErrorMessage(null);
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/20 text-emerald-300 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>1-Tap Fill: admin@cartpilot.com / Admin1234!</span>
              </button>
            </div>
          </form>
        ) : (
          /* -------------------- STEP 2: MFA CHALLENGE -------------------- */
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <button
                type="button"
                onClick={() => {
                  setStep('CREDENTIALS');
                  setErrorMessage(null);
                }}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white cursor-pointer transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
              <span className="text-[11px] font-mono text-emerald-400">
                Expires in {formatTimer(mfaCooldown)}
              </span>
            </div>

            {/* Simulated MFA Code Pill Banner for Developer Convenience */}
            {simulatedMfaCode && (
              <div
                onClick={() => autoFillSimulatedCode(simulatedMfaCode)}
                className="mb-4 p-2.5 px-3.5 rounded-2xl bg-slate-800 text-white shadow-lg flex items-center justify-between cursor-pointer hover:bg-slate-750 active:scale-[0.99] transition-all border border-slate-700"
              >
                <div className="flex items-center gap-2 text-xs truncate">
                  <span className="text-sm">🔑</span>
                  <span className="truncate text-slate-300">
                    MFA Code:{' '}
                    <span className="font-mono font-black text-emerald-400 tracking-wider text-sm">
                      {simulatedMfaCode}
                    </span>
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-700">
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

            {/* 6-Digit MFA Input Array */}
            <div className="flex items-center justify-center gap-2 sm:gap-2.5 my-6">
              {mfaDigits.map((digit, idx) => (
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
                  className={`w-11 h-14 sm:w-13 sm:h-16 text-center text-xl sm:text-2xl font-black rounded-2xl border-2 transition-all focus:outline-none ${
                    digit
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 shadow-sm'
                      : 'border-slate-700 bg-slate-800/80 text-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20'
                  }`}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={() => handleMfaSubmit()}
              disabled={mfaDigits.some((d) => d === '') || isLoading}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold text-xs shadow-lg shadow-emerald-950/60 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying MFA Code...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Verify MFA & Enter Command Center</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Security Legal Micro-Footer */}
        <div className="mt-7 pt-4 border-t border-slate-800 text-center text-[10px] text-slate-500">
          <span>All administrative actions are cryptographically signed and hash-chained. </span>
          <span className="text-slate-400 font-semibold">Strict audit logging active.</span>
        </div>
      </div>
    </div>
  );
};
