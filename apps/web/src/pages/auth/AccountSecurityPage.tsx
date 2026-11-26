import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ShieldCheck,
  Smartphone,
  Laptop,
  Globe,
  Trash2,
  LogOut,
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowLeft,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { API_BASE } from '../../config/api';

interface SessionItem {
  id: string;
  deviceInfo: string;
  ipAddress: string;
  lastUsedAt: string;
  createdAt: string;
  isCurrent: boolean;
}

export const AccountSecurityPage: React.FC = () => {
  const { user, token, logoutAll, authFetch } = useAuth();
  const navigate = useNavigate();

  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [sessionError, setSessionError] = useState<string | null>(null);

  // Change password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);

  const fetchSessions = useCallback(async () => {
    if (!token) return;
    setIsLoadingSessions(true);
    setSessionError(null);
    try {
      const res = await authFetch(`${API_BASE}/auth/sessions`);
      const data = await res.json();
      if (res.ok && data.success) {
        setSessions(data.data);
      } else {
        setSessionError(data.error?.message || 'Failed to load active sessions');
      }
    } catch {
      setSessionError('Network error connecting to session registry');
    } finally {
      setIsLoadingSessions(false);
    }
  }, [token]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleRevokeSession = async (sessionId: string) => {
    if (!token) return;
    try {
      const res = await authFetch(`${API_BASE}/auth/sessions/${sessionId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      }
    } catch {
      // Ignored
    }
  };

  const handleSignOutEverywhere = async () => {
    if (window.confirm('Are you sure you want to terminate all active sessions across all devices?')) {
      await logoutAll();
      navigate('/login', { replace: true });
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordStatus(null);

    if (newPassword.length < 8) {
      setPasswordStatus({ type: 'error', message: 'New password must be at least 8 characters long.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordStatus({ type: 'error', message: 'New passwords do not match.' });
      return;
    }

    setIsSubmittingPassword(true);
    try {
      const endpoint = user?.mustChangePassword
        ? `${API_BASE}/auth/force-change-password`
        : `${API_BASE}/auth/change-password`;

      const body = user?.mustChangePassword
        ? { newPassword }
        : { currentPassword, newPassword };

      const res = await authFetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setPasswordStatus({
          type: 'success',
          message: 'Password updated successfully! Other sessions have been revoked.',
        });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        fetchSessions();
      } else {
        setPasswordStatus({
          type: 'error',
          message: data.error?.message || 'Failed to update password.',
        });
      }
    } catch {
      setPasswordStatus({
        type: 'error',
        message: 'Network error submitting password update.',
      });
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  const workspaceRoute = user?.role === 'ADMIN' ? '/admin' : user?.role === 'MERCHANT' ? '/merchant' : '/shopper';

  return (
    <div className="min-h-screen bg-paper text-ink font-sans p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Navigation Header */}
        <div className="flex items-center justify-between pb-4 border-b border-brd">
          <Link
            to={workspaceRoute}
            className="inline-flex items-center gap-2 text-xs font-semibold text-mut hover:text-ink transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Workspace</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-xs font-mono font-medium text-mut">{user?.email}</span>
          </div>
        </div>

        {/* Forced Password Change Notice Banner */}
        {user?.mustChangePassword && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs">
              <span className="font-bold text-amber-600 block text-sm">Action Required: Change Administrator Password</span>
              <p className="text-mut">
                This administrator account was provisioned with a temporary password. You must establish a personalized, secure password to access administrative controls.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Active Sessions Panel */}
          <div className="bg-card border border-brd rounded-2xl p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-acc/10 flex items-center justify-center text-acc">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-sm text-ink">Active Sessions</h3>
                  <p className="text-[11px] text-mut">Authorized devices and tokens</p>
                </div>
              </div>
              <button
                onClick={handleSignOutEverywhere}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-500/20 text-rose-500 hover:bg-rose-500/10 text-xs font-semibold transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Revoke All</span>
              </button>
            </div>

            {sessionError && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{sessionError}</span>
              </div>
            )}

            {isLoadingSessions ? (
              <div className="py-8 flex items-center justify-center gap-2 text-xs text-mut">
                <Loader2 className="w-4 h-4 animate-spin text-acc" />
                <span>Scanning active session families...</span>
              </div>
            ) : sessions.length === 0 ? (
              <p className="text-xs text-mut py-4 text-center">No active sessions found.</p>
            ) : (
              <div className="space-y-2.5">
                {sessions.map((s) => {
                  const isMobile = s.deviceInfo.toLowerCase().includes('ios') || s.deviceInfo.toLowerCase().includes('android');
                  return (
                    <div
                      key={s.id}
                      className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-colors ${
                        s.isCurrent ? 'bg-emerald-500/5 border-emerald-500/30' : 'bg-paper/40 border-brd'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${s.isCurrent ? 'bg-emerald-500/15 text-emerald-600' : 'bg-paper text-mut'}`}>
                          {isMobile ? <Smartphone className="w-4 h-4" /> : <Laptop className="w-4 h-4" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-ink text-[11px]">{s.deviceInfo}</span>
                            {s.isCurrent && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-600 uppercase">
                                Current
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-mut font-mono block">IP: {s.ipAddress}</span>
                        </div>
                      </div>

                      {!s.isCurrent && (
                        <button
                          onClick={() => handleRevokeSession(s.id)}
                          title="Revoke Session"
                          className="p-1.5 rounded-lg text-mut hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Change Password Panel */}
          <div className="bg-card border border-brd rounded-2xl p-6 shadow-sm space-y-5">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-acc/10 flex items-center justify-center text-acc">
                <KeyRound className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-sm text-ink">Change Password</h3>
                <p className="text-[11px] text-mut">Revokes other device sessions automatically</p>
              </div>
            </div>

            {passwordStatus && (
              <div
                className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                  passwordStatus.type === 'success'
                    ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-600'
                    : 'bg-rose-500/10 border border-rose-500/20 text-rose-500'
                }`}
              >
                {passwordStatus.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                <span>{passwordStatus.message}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-3.5">
              {!user?.mustChangePassword && (
                <div>
                  <label className="block text-[11px] font-semibold text-ink mb-1">Current Password</label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full text-xs px-3 py-2 rounded-xl border border-brd bg-paper text-ink focus:outline-none focus:ring-1 focus:ring-acc"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-mut hover:text-ink"
                    >
                      {showCurrentPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-semibold text-ink mb-1">New Password (at least 8 chars)</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full text-xs px-3 py-2 rounded-xl border border-brd bg-paper text-ink focus:outline-none focus:ring-1 focus:ring-acc"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-mut hover:text-ink"
                  >
                    {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-ink mb-1">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full text-xs px-3 py-2 rounded-xl border border-brd bg-paper text-ink focus:outline-none focus:ring-1 focus:ring-acc"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingPassword}
                className="w-full py-2.5 rounded-xl bg-acc text-white text-xs font-semibold flex items-center justify-center gap-2 hover:bg-acc/90 transition-all disabled:opacity-50 shadow-sm"
              >
                {isSubmittingPassword ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Updating Password...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Save New Password</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
