import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Store,
  User,
  Mail,
  Lock,
  Phone,
  MapPin,
  AlertCircle,
  Loader2,
  ArrowRight,
  Eye,
  EyeOff,
  Building,
  ShieldCheck,
  CheckCircle2,
  Leaf,
  Sun,
  Moon,
  Sparkles,
  TrendingUp,
  CreditCard,
  ArrowLeft,
} from 'lucide-react';
import { API_BASE } from '../../config/api';

export const BecomeMerchantPage: React.FC = () => {
  const [storeName, setStoreName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('Patna');
  const [state, setState] = useState('Bihar');
  const [postalCode, setPostalCode] = useState('');
  const [pincodesInput, setPincodesInput] = useState('800001, 800013');
  const [vegetarianDeclaration, setVegetarianDeclaration] = useState(false);

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

  const { setSession } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
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

    if (!vegetarianDeclaration) {
      setErrorMessage(
        'You must certify that your store is 100% pure vegetarian before submitting your application.'
      );
      return;
    }

    const pincodes = pincodesInput
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);

    if (pincodes.length === 0 || !pincodes.every((p) => /^[1-9][0-9]{5}$/.test(p))) {
      setErrorMessage('Please provide valid 6-digit Indian PIN codes separated by commas.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE}/merchants/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          storeName: storeName.trim(),
          ownerName: ownerName.trim(),
          email: email.trim(),
          password,
          phone: phone.trim(),
          street: street.trim(),
          city: city.trim(),
          state: state.trim(),
          postalCode: postalCode.trim(),
          serviceAreaPincodes: pincodes,
          vegetarianDeclaration: true,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error?.message || 'Failed to submit merchant application.');
      }

      // Establish session with token and navigate to Merchant Workspace (which displays pending status)
      setSession(data.data.accessToken, {
        id: data.data.user.id || data.data.user.userId,
        email: data.data.user.email,
        name: data.data.user.name,
        role: data.data.user.role,
        merchantId: data.data.merchant._id || data.data.user.merchantId,
      });

      navigate('/merchant', { replace: true });
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Application submission failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full h-[100dvh] max-h-[100dvh] overflow-hidden flex flex-col lg:flex-row bg-[#FAFAF7] dark:bg-[#0E0F10] text-stone-900 dark:text-[#F2F3F4] font-sans antialiased">
      
      {/* ── Left Column: Value Proposition & Partner Brand Showcase ────── */}
      <aside className="hidden lg:flex lg:w-[40%] xl:w-[38%] shrink-0 h-full flex-col justify-between p-8 xl:p-10 border-r border-stone-200/80 dark:border-[#2A2D31] bg-stone-50/50 dark:bg-[#121416] relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-emerald-500/10 dark:bg-emerald-500/5 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full bg-emerald-600/10 dark:bg-emerald-600/5 blur-3xl pointer-events-none" />

        {/* Top Branding & Mode Switcher */}
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-700 text-white flex items-center justify-center shadow-xs">
              <Leaf className="w-5 h-5 fill-white" />
            </div>
            <div>
              <span className="font-heading font-black text-xl text-stone-900 dark:text-white tracking-tight">
                CartPilot
              </span>
              <span className="block text-[10px] font-mono uppercase tracking-wider text-emerald-700 dark:text-emerald-400 font-semibold">
                Merchant Partner Network
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-white dark:bg-[#1E2124] border border-stone-200 dark:border-[#2A2D31] text-stone-600 dark:text-stone-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors shadow-2xs cursor-pointer"
            title="Toggle Light / Dark Mode"
            aria-label="Toggle Theme"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>

        {/* Hero Narrative */}
        <div className="space-y-5 my-auto relative z-10 py-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100/70 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs font-semibold border border-emerald-200/60 dark:border-emerald-800/40">
            <Store className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Direct Merchant Onboarding</span>
          </div>

          <h1 className="text-3xl xl:text-4xl font-heading font-black tracking-tight leading-[1.15] text-stone-900 dark:text-white">
            Expand Your Store with <br />
            <span className="text-emerald-700 dark:text-emerald-400">Agentic Commerce</span>.
          </h1>

          <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed max-w-md">
            Join the certified vegetarian hyper-local marketplace. AI agents autonomously route grocery demand to your shelves with guaranteed morning and evening delivery fulfillment.
          </p>

          {/* Key Merchant Benefits */}
          <div className="grid grid-cols-2 gap-3 max-w-lg">
            <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-[#16181A]/80 border border-stone-200/80 dark:border-[#2A2D31] shadow-2xs backdrop-blur-xs space-y-1">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="font-heading font-bold text-xs text-stone-900 dark:text-white">0% Listing Fee</span>
              </div>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">Zero onboarding fee. Keep maximum margin on your sales.</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-[#16181A]/80 border border-stone-200/80 dark:border-[#2A2D31] shadow-2xs backdrop-blur-xs space-y-1">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="font-heading font-bold text-xs text-stone-900 dark:text-white">Next-Day Payout</span>
              </div>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">Daily bank settlement with transparent ledger tracking.</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-[#16181A]/80 border border-stone-200/80 dark:border-[#2A2D31] shadow-2xs backdrop-blur-xs space-y-1">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="font-heading font-bold text-xs text-stone-900 dark:text-white">100% Pure Veg</span>
              </div>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">High-trust consumer pool seeking meat-free groceries.</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-[#16181A]/80 border border-stone-200/80 dark:border-[#2A2D31] shadow-2xs backdrop-blur-xs space-y-1">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="font-heading font-bold text-xs text-stone-900 dark:text-white">Autonomous Flow</span>
              </div>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">Automated dispatch, packing slips, and inventory sync.</p>
            </div>
          </div>
        </div>

        {/* Bottom Social Proof */}
        <div className="pt-4 border-t border-stone-200/60 dark:border-[#2A2D31] flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 relative z-10">
          <div className="flex items-center gap-1.5 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Fast 24-hr verification</span>
          </div>
          <Link
            to="/login"
            className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 hover:underline font-semibold"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Sign In</span>
          </Link>
        </div>
      </aside>

      {/* ── Right Column: Application Form Panel (Scroll-Free Desktop) ───── */}
      <main className="flex-1 h-full flex flex-col justify-between items-center px-4 py-4 sm:px-8 sm:py-6 lg:px-8 lg:py-5 overflow-y-auto lg:overflow-hidden relative">
        
        {/* Mobile Header Bar (< 1024px) */}
        <div className="w-full flex lg:hidden items-center justify-between pb-3 shrink-0">
          <Link to="/login" className="flex items-center gap-2 text-xs font-semibold text-stone-600 dark:text-stone-300">
            <ArrowLeft className="w-4 h-4" />
            <span>Sign In</span>
          </Link>

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-700 text-white flex items-center justify-center shadow-2xs">
              <Store className="w-4 h-4" />
            </div>
            <span className="font-heading font-extrabold text-sm text-stone-900 dark:text-white">
              Merchant Partner
            </span>
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            className="p-1.5 rounded-xl bg-stone-100 dark:bg-[#1E2124] border border-stone-200 dark:border-[#2A2D31] text-stone-600 dark:text-stone-300"
            title="Toggle Theme"
          >
            {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Central Application Form Container */}
        <div className="w-full max-w-xl my-auto space-y-3">
          
          {/* Header Title */}
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-heading font-extrabold text-xl lg:text-2xl text-stone-900 dark:text-white tracking-tight">
                Partner Store Application
              </h2>
              <span className="text-[10px] font-mono uppercase bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-500/20">
                100% Veg
              </span>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              Enter your store details below to start receiving orders from CartPilot AI shoppers.
            </p>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="flex-1 font-medium">{errorMessage}</span>
            </div>
          )}

          {/* Application Form */}
          <form onSubmit={handleSubmit} className="space-y-2.5">
            {/* Row 1: Store Name & Owner Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-heading font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Store / Business Name
                </label>
                <div className="relative">
                  <Store className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    placeholder="Fresh Greens Organics"
                    required
                    className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-stone-200 dark:border-[#2A2D31] bg-white dark:bg-[#16181A] text-xs text-stone-900 dark:text-white placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-heading font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Owner / Manager Name
                </label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder="Ramesh Patel"
                    required
                    className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-stone-200 dark:border-[#2A2D31] bg-white dark:bg-[#16181A] text-xs text-stone-900 dark:text-white placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Row 2: Business Email & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-heading font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Business Email
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="partner@freshgreens.in"
                    required
                    className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-stone-200 dark:border-[#2A2D31] bg-white dark:bg-[#16181A] text-xs text-stone-900 dark:text-white placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-heading font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Contact Phone
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="9876543210"
                    required
                    className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-stone-200 dark:border-[#2A2D31] bg-white dark:bg-[#16181A] text-xs text-stone-900 dark:text-white placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Row 3: Password & Confirm Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-heading font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 8 chars, 1 uppercase, 1 digit"
                    required
                    className="w-full pl-9 pr-8 py-1.5 rounded-xl border border-stone-200 dark:border-[#2A2D31] bg-white dark:bg-[#16181A] text-xs text-stone-900 dark:text-white placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-heading font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    required
                    className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-stone-200 dark:border-[#2A2D31] bg-white dark:bg-[#16181A] text-xs text-stone-900 dark:text-white placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Row 4: Store Street Address & Service PIN Codes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-heading font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Street Address
                </label>
                <div className="relative">
                  <MapPin className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    placeholder="100 Feet Rd, Boring Road"
                    required
                    className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-stone-200 dark:border-[#2A2D31] bg-white dark:bg-[#16181A] text-xs text-stone-900 dark:text-white placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-heading font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Delivery PIN Codes
                </label>
                <div className="relative">
                  <Building className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={pincodesInput}
                    onChange={(e) => setPincodesInput(e.target.value)}
                    placeholder="800001, 800013, 800020"
                    required
                    className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-stone-200 dark:border-[#2A2D31] bg-white dark:bg-[#16181A] text-xs text-stone-900 dark:text-white placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Row 5: City, State, Postal Code */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[11px] font-heading font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  City
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Patna"
                  required
                  className="w-full px-2.5 py-1.5 rounded-xl border border-stone-200 dark:border-[#2A2D31] bg-white dark:bg-[#16181A] text-xs text-stone-900 dark:text-white placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 transition-all"
                />
              </div>

              <div>
                <label className="block text-[11px] font-heading font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  State
                </label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="Bihar"
                  required
                  className="w-full px-2.5 py-1.5 rounded-xl border border-stone-200 dark:border-[#2A2D31] bg-white dark:bg-[#16181A] text-xs text-stone-900 dark:text-white placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 transition-all"
                />
              </div>

              <div>
                <label className="block text-[11px] font-heading font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Postal Code
                </label>
                <input
                  type="text"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder="800001"
                  maxLength={6}
                  required
                  className="w-full px-2.5 py-1.5 rounded-xl border border-stone-200 dark:border-[#2A2D31] bg-white dark:bg-[#16181A] text-xs text-stone-900 dark:text-white placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 transition-all"
                />
              </div>
            </div>

            {/* Pure Vegetarian Certification Checkbox */}
            <div className="p-2.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/40">
              <label htmlFor="vegetarianDeclaration" className="flex items-start gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  id="vegetarianDeclaration"
                  checked={vegetarianDeclaration}
                  onChange={(e) => setVegetarianDeclaration(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-emerald-700 focus:ring-emerald-500 border-stone-300 dark:border-stone-700 cursor-pointer"
                  required
                />
                <span className="text-[11px] text-stone-700 dark:text-stone-300 leading-snug">
                  <strong className="text-emerald-800 dark:text-emerald-300">100% Vegetarian Pledge:</strong> I certify that all products listed by my store are free from meat, poultry, fish, seafood, and animal byproducts.
                </span>
              </label>
            </div>

            {/* Submit Action */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 active:scale-[0.99] text-white font-heading font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting Application...</span>
                </>
              ) : (
                <>
                  <span>Submit Merchant Application</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Direct Sign In Switcher */}
          <div className="pt-2 text-center text-xs text-stone-500 dark:text-stone-400">
            <span>Already registered as a merchant or shopper? </span>
            <Link to="/login" className="text-emerald-700 dark:text-emerald-400 font-bold hover:underline">
              Sign In here
            </Link>
          </div>
        </div>

        {/* Micro-Footer */}
        <div className="w-full pt-2 flex items-center justify-between text-[11px] text-stone-400 dark:text-stone-500 shrink-0 border-t border-stone-200/60 dark:border-[#2A2D31]">
          <span>© 2026 CartPilot Commerce Inc.</span>
          <div className="flex items-center gap-3">
            <Link to="/privacy" className="hover:underline">Privacy Policy</Link>
            <span>•</span>
            <Link to="/terms" className="hover:underline">Terms of Service</Link>
          </div>
        </div>
      </main>
    </div>
  );
};
