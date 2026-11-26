import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match');
      return;
    }

    if (password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
      setErrorMessage(
        'Password must be at least 8 characters long and contain at least one uppercase letter and one number'
      );
      return;
    }

    setIsLoading(true);
    const result = await register(name, email, password, phone || undefined);
    setIsLoading(false);

    if (result.success) {
      navigate('/shopper', { replace: true });
    } else {
      setErrorMessage(result.error || 'Registration failed. Please check your details.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-8 bg-paper font-sans text-ink relative overflow-hidden">
      {/* Decorative ambient backdrop */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 rounded-full bg-acc/10 blur-3xl pointer-events-none" />

      {/* Main card: Responsive 2-column split on desktop */}
      <div className="w-full max-w-md lg:max-w-5xl xl:max-w-6xl bg-card border border-brd rounded-3xl shadow-2xl overflow-hidden relative z-10 backdrop-blur-md lg:grid lg:grid-cols-12 min-h-[620px]">
        {/* Left Column: Rich Branded Showcase (Desktop only) */}
        <div className="hidden lg:flex lg:col-span-5 bg-gradient-to-br from-emerald-800 via-emerald-900 to-stone-950 text-white p-10 lg:p-12 flex-col justify-between relative overflow-hidden">
          <div className="absolute -top-16 -left-16 w-56 h-56 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-16 -right-16 w-56 h-56 bg-emerald-400/20 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white text-emerald-800 flex items-center justify-center shadow-lg">
                <ShieldCheck className="w-7 h-7 text-emerald-600" />
              </div>
              <div>
                <span className="font-extrabold text-2xl tracking-tight text-white block">CartPilot</span>
                <span className="text-emerald-200/90 text-xs font-medium">Customer Registration</span>
              </div>
            </div>

            <div className="pt-4 space-y-2">
              <h2 className="text-3xl font-black leading-tight text-white tracking-tight">
                Join the Pure Veg Grocery Revolution.
              </h2>
              <p className="text-emerald-100/80 text-sm leading-relaxed">
                Enjoy automated morning deliveries, household budget guardrails, and fresh farm harvests delivered every morning.
              </p>
            </div>
          </div>

          <div className="relative z-10 py-5 space-y-3 border-y border-emerald-700/50 my-6">
            <div className="flex items-center gap-3 text-xs text-emerald-100">
              <CheckCircle2 className="w-4 h-4 text-emerald-300 flex-shrink-0" />
              <span>100% Certified Vegetarian Selection</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-emerald-100">
              <CheckCircle2 className="w-4 h-4 text-emerald-300 flex-shrink-0" />
              <span>Order Till Midnight · 6 AM – 9 AM Delivery</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-emerald-100">
              <CheckCircle2 className="w-4 h-4 text-emerald-300 flex-shrink-0" />
              <span>₹100 Wallet Bonus on ₹999 Top-Up</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-emerald-100">
              <CheckCircle2 className="w-4 h-4 text-emerald-300 flex-shrink-0" />
              <span>Agentic AI Recipe & Meal Planning</span>
            </div>
          </div>

          <div className="relative z-10 text-xs text-emerald-200/70">
            <span>Already registered? </span>
            <Link to="/login" className="text-white font-bold underline hover:text-emerald-300">
              Sign In to your account →
            </Link>
          </div>
        </div>

        {/* Right Column: Registration Form */}
        <div className="w-full lg:col-span-7 p-6 sm:p-10 flex flex-col justify-center">
        {/* Brand identity */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-acc flex items-center justify-center text-white mb-3 shadow-lg shadow-acc/20 lg:hidden">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div className="flex items-center gap-2">
            <h1 className="font-display font-extrabold text-2xl text-ink tracking-tight">
              Create Shopper Account
            </h1>
          </div>
          <p className="text-xs text-mut mt-1">
            Join CartPilot for policy-controlled autonomous grocery shopping
          </p>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Register Form */}
        <form onSubmit={handleRegister} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-ink mb-1">Full Name</label>
            <div className="relative">
              <User className="w-4 h-4 text-mut absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Priya Sharma"
                required
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-brd bg-paper/60 text-xs text-ink placeholder:text-mut focus:outline-none focus:ring-2 focus:ring-acc/20 focus:border-acc transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-mut absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="priya@example.com"
                required
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-brd bg-paper/60 text-xs text-ink placeholder:text-mut focus:outline-none focus:ring-2 focus:ring-acc/20 focus:border-acc transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink mb-1">
              Mobile Number (Optional)
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-mut absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-brd bg-paper/60 text-xs text-ink placeholder:text-mut focus:outline-none focus:ring-2 focus:ring-acc/20 focus:border-acc transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-mut absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 8 chars, 1 uppercase, 1 digit"
                required
                className="w-full pl-10 pr-10 py-2 rounded-xl border border-brd bg-paper/60 text-xs text-ink placeholder:text-mut focus:outline-none focus:ring-2 focus:ring-acc/20 focus:border-acc transition-all"
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

          <div>
            <label className="block text-xs font-semibold text-ink mb-1">Confirm Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-mut absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                required
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-brd bg-paper/60 text-xs text-ink placeholder:text-mut focus:outline-none focus:ring-2 focus:ring-acc/20 focus:border-acc transition-all"
              />
            </div>
          </div>

          {/* Vegetarian pledge banner */}
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[11px] flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
            <span>Pure vegetarian catalog guarantee: Zero meat, fish, or egg SKUs.</span>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 rounded-xl bg-acc text-white font-semibold text-xs hover:bg-blue-600 active:scale-[0.99] transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Creating Account...</span>
              </>
            ) : (
              <>
                <span>Complete Registration</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Links to login and merchant registration */}
        <div className="mt-5 pt-4 border-t border-brd text-center text-xs space-y-2">
          <div className="text-mut">
            <span>Already registered? </span>
            <Link to="/login" className="text-acc font-semibold hover:underline">
              Sign In here
            </Link>
          </div>
          <div className="text-mut text-[11px]">
            <span>Want to sell on CartPilot? </span>
            <Link to="/become-merchant" className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline">
              Apply as a Merchant →
            </Link>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};
