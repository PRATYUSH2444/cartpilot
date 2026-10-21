import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Mail, ArrowLeft, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { API_BASE } from '../../config/api';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devResetLink, setDevResetLink] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to dispatch reset instructions.');
      }

      setIsSubmitted(true);
      if (data.data?.devResetLink) {
        setDevResetLink(data.data.devResetLink);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-8 bg-paper font-sans text-ink relative overflow-hidden">
      {/* Decorative ambient backdrop */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 rounded-full bg-acc/10 blur-3xl pointer-events-none" />

      {/* Main card */}
      <div className="w-full max-w-md bg-card border border-brd rounded-2xl shadow-xl p-8 relative z-10 backdrop-blur-md">
        {/* Brand identity */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-acc flex items-center justify-center text-white mb-3 shadow-lg shadow-acc/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="font-display font-extrabold text-2xl text-ink tracking-tight">
            Reset Password
          </h1>
          <p className="text-xs text-mut mt-1">
            Enter your account email to receive cryptographic password reset instructions
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {isSubmitted ? (
          <div className="text-center py-4 space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-ink mb-1">Recovery Link Dispatched</h3>
              <p className="text-xs text-mut">
                If an account exists for <strong className="text-ink">{email}</strong>, a secure
                reset token has been issued.
              </p>
            </div>

            {devResetLink && import.meta.env.DEV && (
              <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-left text-xs space-y-1">
                <span className="font-semibold block">[Development Simulator]</span>
                <p className="text-[11px] text-mut">Console email link simulated:</p>
                <Link
                  to={devResetLink}
                  className="font-mono text-[11px] text-acc underline break-all block"
                >
                  {window.location.origin + devResetLink}
                </Link>
              </div>
            )}

            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs text-acc font-semibold hover:underline mt-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Sign In</span>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
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
                  disabled={isLoading}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-brd bg-paper/60 text-xs text-ink placeholder:text-mut focus:outline-none focus:ring-2 focus:ring-acc/20 focus:border-acc transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-xl bg-acc text-white font-semibold text-xs hover:bg-blue-600 active:scale-[0.99] transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Dispatching...</span>
                </>
              ) : (
                <span>Send Password Reset Link</span>
              )}
            </button>

            <div className="text-center pt-3">
              <Link
                to="/login"
                className="inline-flex items-center gap-1 text-xs text-mut hover:text-ink transition-colors font-medium"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Sign In</span>
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
