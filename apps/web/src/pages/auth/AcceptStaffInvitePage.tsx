import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Users,
  Lock,
  ArrowRight,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Eye,
  EyeOff,
} from 'lucide-react';
import { API_BASE } from '../../config/api';

export const AcceptStaffInvitePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { setSession } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!token) {
      setErrorMessage('Invitation token is missing from the URL. Please verify your invitation link.');
      return;
    }

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

    try {
      const response = await fetch(`${API_BASE}/merchants/staff/accept-invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error?.message || 'Failed to accept staff invitation.');
      }

      setSession(data.data.accessToken, {
        id: data.data.user.id || data.data.user.userId,
        email: data.data.user.email,
        name: data.data.user.name,
        role: data.data.user.role,
        merchantId: data.data.merchant._id || data.data.user.merchantId,
        isStaff: data.data.user.isStaff,
        staffPermissions: data.data.user.staffPermissions,
      });

      navigate('/merchant', { replace: true });
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Error accepting invitation.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-8 bg-paper font-sans text-ink relative overflow-hidden">
      {/* Decorative ambient backdrop */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

      {/* Main card */}
      <div className="w-full max-w-md bg-card border border-brd rounded-2xl shadow-xl p-8 relative z-10 backdrop-blur-md">
        {/* Brand identity */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white mb-3 shadow-lg shadow-blue-500/20">
            <Users className="w-6 h-6" />
          </div>
          <h1 className="font-display font-extrabold text-2xl text-ink tracking-tight">
            Accept Staff Invitation
          </h1>
          <p className="text-xs text-mut mt-1">
            Join the store team on CartPilot with role-based fulfillment permissions
          </p>
        </div>

        {/* Warning if token missing */}
        {!token && (
          <div className="mb-5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>Invitation token is missing. Please click the full link sent by your store manager.</span>
          </div>
        )}

        {/* Error message */}
        {errorMessage && (
          <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-ink mb-1.5">Create Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-mut absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 8 chars, 1 uppercase, 1 digit"
                required
                disabled={isLoading || !token}
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-brd bg-paper/60 text-xs text-ink placeholder:text-mut focus:outline-none focus:ring-2 focus:ring-acc/20 focus:border-acc transition-all"
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
            <label className="block text-xs font-semibold text-ink mb-1.5">Confirm Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-mut absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                required
                disabled={isLoading || !token}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-brd bg-paper/60 text-xs text-ink placeholder:text-mut focus:outline-none focus:ring-2 focus:ring-acc/20 focus:border-acc transition-all"
              />
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-[11px] flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
            <span>Single-use invitation valid for 7 days with store access permissions.</span>
          </div>

          <button
            type="submit"
            disabled={isLoading || !token}
            className="w-full py-2.5 px-4 rounded-xl bg-acc text-white font-semibold text-xs hover:bg-blue-600 active:scale-[0.99] transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Joining Store Team...</span>
              </>
            ) : (
              <>
                <span>Accept Invitation & Join Store</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-5 pt-4 border-t border-brd text-center text-xs text-mut">
          <span>Already have an active account? </span>
          <Link to="/login" className="text-acc font-semibold hover:underline">
            Sign In here
          </Link>
        </div>
      </div>
    </div>
  );
};
