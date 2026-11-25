import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  ArrowLeft,
  ShieldCheck,
  Truck,
  Leaf,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Copy,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface PhoneLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const PhoneLoginModal: React.FC<PhoneLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { sendPhoneOtp, loginWithPhoneOtp } = useAuth();

  // Step 1: phone input, Step 2: otp verification
  const [step, setStep] = useState<'PHONE' | 'OTP'>('PHONE');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '']);
  const [simulatedCode, setSimulatedCode] = useState<string | null>(null);
  const [copiedPill, setCopiedPill] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(60);

  const digitRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Reset modal state when opened
  useEffect(() => {
    if (isOpen) {
      setStep('PHONE');
      setPhoneNumber('');
      setOtpDigits(['', '', '', '']);
      setSimulatedCode(null);
      setErrorMessage(null);
      setIsLoading(false);
      setCooldown(60);
    }
  }, [isOpen]);

  // Timer countdown for OTP resend
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 'OTP' && cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, cooldown]);

  if (!isOpen) return null;

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 10);
    setPhoneNumber(raw);
    setErrorMessage(null);
  };

  const handleSendOtp = async (e?: React.FormEvent) => {
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
      setStep('OTP');
      setCooldown(60);
      setOtpDigits(['', '', '', '']);
      setTimeout(() => {
        digitRefs.current[0]?.focus();
      }, 100);
    } else {
      setErrorMessage(result.error || 'Unable to send OTP. Please try again.');
    }
  };

  const handleResendOtp = async () => {
    if (cooldown > 0 || isLoading) return;
    setIsLoading(true);
    setErrorMessage(null);

    const fullPhone = `+91${phoneNumber}`;
    const result = await sendPhoneOtp(fullPhone, 'PHONE_LOGIN');
    setIsLoading(false);

    if (result.success) {
      if (result.simulatedCode) {
        setSimulatedCode(result.simulatedCode);
      }
      setCooldown(60);
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

    // Handle single digit
    const char = cleaned.slice(-1);
    const updated = [...otpDigits];
    updated[index] = char;
    setOtpDigits(updated);

    // Auto-advance
    if (index < 3 && char) {
      digitRefs.current[index + 1]?.focus();
    }

    // Check if all 4 digits are filled -> trigger auto verify
    if (index === 3 || updated.every((d) => d !== '')) {
      const completeCode = updated.join('');
      if (completeCode.length === 4) {
        triggerVerification(completeCode);
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
      triggerVerification(pasted);
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
    triggerVerification(code);
  };

  const triggerVerification = async (codeToVerify: string) => {
    setIsLoading(true);
    setErrorMessage(null);

    const fullPhone = `+91${phoneNumber}`;
    const result = await loginWithPhoneOtp(fullPhone, codeToVerify);
    setIsLoading(false);

    if (result.success) {
      onSuccess?.();
      onClose();
    } else {
      setErrorMessage(result.error || 'Invalid OTP code. Please try again.');
      setOtpDigits(['', '', '', '']);
      digitRefs.current[0]?.focus();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm bg-white dark:bg-stone-900 rounded-3xl shadow-2xl overflow-hidden border border-emerald-500/20 text-stone-800 dark:text-stone-100">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-black/20 hover:bg-black/30 text-white flex items-center justify-center transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {step === 'PHONE' ? (
          <div>
            {/* Top Fresh Produce Banner (Reference: SBZee header style) */}
            <div className="relative h-44 bg-gradient-to-b from-emerald-600 to-emerald-700 flex flex-col items-center justify-center text-center p-4 overflow-hidden">
              {/* Decorative fruits/veggies background badges */}
              <div className="absolute -top-4 -left-4 w-28 h-28 bg-emerald-500/30 rounded-full blur-xl pointer-events-none" />
              <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-emerald-400/20 rounded-full blur-xl pointer-events-none" />

              {/* Logo & Headline */}
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

              {/* Decorative Veggie Emoticons */}
              <div className="absolute bottom-2 left-4 text-2xl select-none opacity-85">🥦</div>
              <div className="absolute bottom-3 right-4 text-2xl select-none opacity-85">🍎</div>
              <div className="absolute top-3 left-4 text-xl select-none opacity-80">🥕</div>
              <div className="absolute top-3 right-5 text-xl select-none opacity-80">🍋</div>
            </div>

            {/* Bottom Content Body */}
            <div className="p-6 pt-5">
              <div className="text-center mb-5">
                <h2 className="font-bold text-lg text-stone-900 dark:text-white">
                  Welcome to CartPilot
                </h2>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                  Fresh Fruits & Veggies Delivered Every Morning
                </p>
              </div>

              {errorMessage && (
                <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Mobile Number Input Form */}
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <div className="flex items-center rounded-2xl border-2 border-emerald-500 bg-white dark:bg-stone-800 p-1 px-3 shadow-sm focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all">
                    {/* Country Code with Indian Flag */}
                    <div className="flex items-center gap-1.5 pr-2.5 border-r border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-200 font-semibold text-sm select-none">
                      <span className="text-base" role="img" aria-label="India flag">
                        🇮🇳
                      </span>
                      <span>+91</span>
                    </div>

                    {/* 10-Digit Mobile Input */}
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={handlePhoneChange}
                      placeholder="Enter mobile number"
                      autoFocus
                      maxLength={10}
                      className="w-full pl-3 py-2.5 bg-transparent text-sm font-medium text-stone-900 dark:text-white placeholder:text-stone-400 focus:outline-none"
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

              {/* Security Badge */}
              <div className="flex items-center justify-center gap-1.5 text-[11px] text-stone-500 dark:text-stone-400 mt-4 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Secure login with OTP verification</span>
              </div>

              {/* Feature Highlights Matching Reference */}
              <div className="grid grid-cols-2 gap-2.5 mt-5 pt-4 border-t border-stone-100 dark:border-stone-800">
                <div className="p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 text-left">
                  <div className="w-7 h-7 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-700 dark:text-emerald-300 mb-1.5">
                    <Leaf className="w-4 h-4" />
                  </div>
                  <div className="font-bold text-[11px] text-stone-800 dark:text-stone-100">
                    Farm Fresh Daily
                  </div>
                  <div className="text-[10px] text-stone-500 dark:text-stone-400">
                    Handpicked for you
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 text-left">
                  <div className="w-7 h-7 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-700 dark:text-emerald-300 mb-1.5">
                    <Truck className="w-4 h-4" />
                  </div>
                  <div className="font-bold text-[11px] text-stone-800 dark:text-stone-100">
                    Morning Delivery
                  </div>
                  <div className="text-[10px] text-stone-500 dark:text-stone-400">
                    Fresh at your doorstep
                  </div>
                </div>
              </div>

              {/* Terms & Privacy */}
              <p className="text-[10px] text-center text-stone-400 mt-5">
                By continuing, you agree to our{' '}
                <a href="/terms" className="underline hover:text-stone-600 dark:hover:text-stone-200">
                  Terms of Service
                </a>
              </p>
            </div>
          </div>
        ) : (
          /* Step 2: 4-Digit OTP Screen (Reference: SBZee verification screen) */
          <div className="p-6">
            {/* Header with Back Arrow */}
            <div className="flex items-center justify-between mb-2">
              <button
                type="button"
                onClick={() => setStep('PHONE')}
                className="w-8 h-8 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 flex items-center justify-center hover:bg-stone-200 transition-colors cursor-pointer"
                aria-label="Back to phone number"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                CartPilot Auth
              </div>
              <div className="w-8" />
            </div>

            {/* Simulated SMS Push Notification Banner (Matches Reference UI Pill) */}
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
                    <span className="font-bold text-white tracking-widest">{simulatedCode}</span>
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

            {/* Verification Heading */}
            <div className="text-center my-6">
              <h2 className="font-bold text-xl text-stone-900 dark:text-white">
                Verify your number
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                Enter the 4-digit code sent to{' '}
                <span className="font-semibold text-stone-800 dark:text-stone-200">
                  +91 {phoneNumber}
                </span>
              </p>
            </div>

            {errorMessage && (
              <div className="mb-5 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* 4-Digit Input Boxes */}
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
                      ? 'border-emerald-500 bg-emerald-50/30 text-emerald-700 dark:text-emerald-300 dark:bg-emerald-950/20'
                      : 'border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white focus:border-emerald-500'
                  }`}
                />
              ))}
            </div>

            {/* Manual Verify Button if auto-submit didn't run */}
            <button
              type="button"
              onClick={() => triggerVerification(otpDigits.join(''))}
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

            {/* Resend Cooldown Countdown */}
            <div className="text-center text-xs">
              <span className="text-stone-500 dark:text-stone-400 block mb-1">
                Didn&apos;t receive the OTP?
              </span>
              {cooldown > 0 ? (
                <span className="font-semibold text-stone-700 dark:text-stone-300">
                  Resend in{' '}
                  <span className="text-emerald-600 font-bold">
                    00:{cooldown < 10 ? `0${cooldown}` : cooldown}s
                  </span>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleResendOtp}
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
    </div>
  );
};
