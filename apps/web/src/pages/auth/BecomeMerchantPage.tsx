import React, { useState } from 'react';
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
  const [city, setCity] = useState('Bengaluru');
  const [state, setState] = useState('Karnataka');
  const [postalCode, setPostalCode] = useState('');
  const [pincodesInput, setPincodesInput] = useState('560001, 560034');
  const [vegetarianDeclaration, setVegetarianDeclaration] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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
          storeName,
          ownerName,
          email,
          password,
          phone,
          street,
          city,
          state,
          postalCode,
          serviceAreaPincodes: pincodes,
          vegetarianDeclaration: true,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error?.message || 'Failed to submit merchant application.');
      }

      // Establish session with in-memory token and navigate to Merchant Workspace (which will show Pending state)
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
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 bg-paper font-sans text-ink relative overflow-hidden">
      {/* Decorative ambient backdrop */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

      {/* Main card */}
      <div className="w-full max-w-xl bg-card border border-brd rounded-2xl shadow-xl p-8 relative z-10 backdrop-blur-md">
        {/* Brand identity */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-emerald-500 flex items-center justify-center text-white mb-3 shadow-lg shadow-blue-500/20">
            <Store className="w-6 h-6" />
          </div>
          <div className="flex items-center gap-2">
            <h1 className="font-display font-extrabold text-2xl text-ink tracking-tight">
              Merchant Application
            </h1>
            <span className="text-[10px] font-mono uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-500/20">
              100% Vegetarian
            </span>
          </div>
          <p className="text-xs text-mut mt-1">
            Partner with CartPilot to offer verified vegetarian groceries to autonomous AI agents
          </p>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Application Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-ink mb-1">Store / Business Name</label>
              <div className="relative">
                <Store className="w-4 h-4 text-mut absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder="Fresh Greens Organics"
                  required
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-brd bg-paper/60 text-xs text-ink placeholder:text-mut focus:outline-none focus:ring-2 focus:ring-acc/20 focus:border-acc transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink mb-1">Owner / Manager Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-mut absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder="Ramesh Patel"
                  required
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-brd bg-paper/60 text-xs text-ink placeholder:text-mut focus:outline-none focus:ring-2 focus:ring-acc/20 focus:border-acc transition-all"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-ink mb-1">Business Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-mut absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contact@freshgreens.in"
                  required
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-brd bg-paper/60 text-xs text-ink placeholder:text-mut focus:outline-none focus:ring-2 focus:ring-acc/20 focus:border-acc transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink mb-1">Phone Number</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-mut absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="9876543210"
                  required
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-brd bg-paper/60 text-xs text-ink placeholder:text-mut focus:outline-none focus:ring-2 focus:ring-acc/20 focus:border-acc transition-all"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-ink mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-mut absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 8 chars, 1 uppercase, 1 digit"
                  required
                  className="w-full pl-10 pr-10 py-2 rounded-xl border border-brd bg-paper/60 text-xs text-ink placeholder:text-mut focus:outline-none focus:ring-2 focus:ring-acc/20 focus:border-acc transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-mut hover:text-ink transition-colors"
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
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink mb-1">Store Street Address</label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-mut absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                placeholder="100 Feet Rd, 4th Block, Koramangala"
                required
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-brd bg-paper/60 text-xs text-ink placeholder:text-mut focus:outline-none focus:ring-2 focus:ring-acc/20 focus:border-acc transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-ink mb-1">City</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Bengaluru"
                required
                className="w-full px-3 py-2 rounded-xl border border-brd bg-paper/60 text-xs text-ink placeholder:text-mut focus:outline-none focus:ring-2 focus:ring-acc/20 focus:border-acc transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink mb-1">State</label>
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="Karnataka"
                required
                className="w-full px-3 py-2 rounded-xl border border-brd bg-paper/60 text-xs text-ink placeholder:text-mut focus:outline-none focus:ring-2 focus:ring-acc/20 focus:border-acc transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink mb-1">Postal Code</label>
              <input
                type="text"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                placeholder="560034"
                maxLength={6}
                required
                className="w-full px-3 py-2 rounded-xl border border-brd bg-paper/60 text-xs text-ink placeholder:text-mut focus:outline-none focus:ring-2 focus:ring-acc/20 focus:border-acc transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink mb-1">
              Service Delivery PIN Codes (comma separated)
            </label>
            <div className="relative">
              <Building className="w-4 h-4 text-mut absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={pincodesInput}
                onChange={(e) => setPincodesInput(e.target.value)}
                placeholder="560001, 560034, 560095"
                required
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-brd bg-paper/60 text-xs text-ink placeholder:text-mut focus:outline-none focus:ring-2 focus:ring-acc/20 focus:border-acc transition-all"
              />
            </div>
            <p className="text-[10px] text-mut mt-1">
              CartPilot shoppers located in these pincodes will have access to your inventory.
            </p>
          </div>

          {/* Pure Vegetarian Pledge */}
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs space-y-2">
            <div className="flex items-start gap-2.5">
              <input
                type="checkbox"
                id="vegetarianDeclaration"
                checked={vegetarianDeclaration}
                onChange={(e) => setVegetarianDeclaration(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-brd"
                required
              />
              <label
                htmlFor="vegetarianDeclaration"
                className="text-[11px] font-medium text-emerald-700 dark:text-emerald-300 leading-snug cursor-pointer"
              >
                <strong>Solemn Vegetarian Certification:</strong> I certify that all products
                listed and sold by this store are 100% vegetarian, completely free from meat, fish,
                poultry, eggs, gelatin, or animal tallow, in full compliance with CartPilot
                algorithmic governance.
              </label>
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

        {/* Links to login */}
        <div className="mt-5 pt-4 border-t border-brd text-center text-xs text-mut">
          <span>Already registered as a merchant or customer? </span>
          <Link to="/login" className="text-acc font-semibold hover:underline">
            Sign In here
          </Link>
        </div>
      </div>
    </div>
  );
};
