import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Shield,
  Key,
  MapPin,
  FileText,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Mail,
  Phone,
  Calendar,
  Leaf,
  Bell,
  Lock,
} from 'lucide-react';
import { UserProfile, UserGender, INotificationPreferences } from '../../types';
import { API_BASE } from '../../config/api';
import { useAuth } from '../../context/AuthContext';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string | null;
  onOpenAddresses?: () => void;
  onOpenOrders?: () => void;
  onOpenRules?: () => void;
  onLogout?: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  token,
  onOpenAddresses,
  onOpenOrders,
  onOpenRules,
  onLogout,
}) => {
  const { authFetch } = useAuth();
  const [activeTab, setActiveTab] = useState<'PROFILE' | 'SECURITY' | 'PREFERENCES'>('PROFILE');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Profile Form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState<UserGender>('PREFER_NOT_TO_SAY');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [dietaryPrefs, setDietaryPrefs] = useState<string[]>(['VEGETARIAN']);
  const [notifications, setNotifications] = useState<INotificationPreferences>({
    email: true,
    sms: true,
    push: true,
    inApp: true,
  });

  // Phone OTP Verification state
  const [isPhoneVerified, setIsPhoneVerified] = useState<boolean>(false);
  const [showOtpInput, setShowOtpInput] = useState<boolean>(false);
  const [otpCode, setOtpCode] = useState<string>('');
  const [isSendingOtp, setIsSendingOtp] = useState<boolean>(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState<boolean>(false);
  const [otpNotice, setOtpNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Password Change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    if (!isOpen || !token) return;

    const fetchProfile = async () => {
      setIsLoading(true);
      setStatusMessage(null);
      try {
        const res = await authFetch(`${API_BASE}/users/profile`);
        const data = await res.json();
        if (res.ok && data.success) {
          const u: UserProfile = data.data;
          setProfile(u);
          setName(u.name || '');
          setPhone(u.phone || '');
          setIsPhoneVerified(Boolean(u.isPhoneVerified));
          setGender(u.gender || 'PREFER_NOT_TO_SAY');
          setDateOfBirth(u.dateOfBirth ? u.dateOfBirth.split('T')[0] : '');
          setDietaryPrefs(u.dietaryPreferences || ['VEGETARIAN']);
          if (u.notificationPreferences) {
            setNotifications(u.notificationPreferences);
          }
        } else {
          setStatusMessage({ type: 'error', text: data.error?.message || 'Failed to load profile' });
        }
      } catch {
        setStatusMessage({ type: 'error', text: 'Network error loading profile' });
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [isOpen, token]);

  const handleSendOtp = async () => {
    if (!token || !phone.trim()) return;
    setIsSendingOtp(true);
    setOtpNotice(null);
    try {
      const res = await authFetch(`${API_BASE}/auth/phone/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone: phone.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setShowOtpInput(true);
        setOtpNotice({ type: 'success', text: '6-digit OTP dispatched to your mobile number' });
      } else {
        setOtpNotice({ type: 'error', text: data.error || 'Failed to send OTP' });
      }
    } catch {
      setOtpNotice({ type: 'error', text: 'Network error sending verification code' });
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!token || !otpCode.trim()) return;
    setIsVerifyingOtp(true);
    setOtpNotice(null);
    try {
      const res = await authFetch(`${API_BASE}/auth/phone/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone: phone.trim(), code: otpCode.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsPhoneVerified(true);
        setShowOtpInput(false);
        setOtpCode('');
        setOtpNotice({ type: 'success', text: 'Phone number verified successfully!' });
      } else {
        setOtpNotice({ type: 'error', text: data.error || 'Invalid or expired OTP code' });
      }
    } catch {
      setOtpNotice({ type: 'error', text: 'Network error verifying code' });
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setIsSaving(true);
    setStatusMessage(null);

    try {
      const res = await authFetch(`${API_BASE}/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          gender,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
          dietaryPreferences: dietaryPrefs,
          notificationPreferences: notifications,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setProfile(data.data);
        setStatusMessage({ type: 'success', text: 'Profile updated successfully!' });
      } else {
        setStatusMessage({ type: 'error', text: data.error?.message || 'Could not update profile' });
      }
    } catch {
      setStatusMessage({ type: 'error', text: 'Network error updating profile' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (newPassword.length < 8) {
      setStatusMessage({ type: 'error', text: 'New password must be at least 8 characters long' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setStatusMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    setIsChangingPassword(true);
    setStatusMessage(null);

    try {
      const res = await authFetch(`${API_BASE}/users/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setStatusMessage({
          type: 'success',
          text: 'Password changed successfully! You may need to sign in again on other devices.',
        });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setStatusMessage({ type: 'error', text: data.error?.message || 'Failed to change password' });
      }
    } catch {
      setStatusMessage({ type: 'error', text: 'Network error updating password' });
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div className="bg-paper dark:bg-card border border-brd rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-brd bg-card-top/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-acc/10 text-acc flex items-center justify-center font-bold text-sm">
              {profile?.name ? profile.name[0].toUpperCase() : 'U'}
            </div>
            <div>
              <h2 id="profile-modal-title" className="text-sm font-semibold text-ink">
                {profile?.name || 'Customer Account'}
              </h2>
              <p className="text-[11px] text-mut">{profile?.email || 'Logged in shopper'}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-mut hover:text-ink hover:bg-paper transition-colors"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-brd px-6 bg-card-top/20 gap-6">
          <button
            type="button"
            onClick={() => { setActiveTab('PROFILE'); setStatusMessage(null); }}
            className={`py-3 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'PROFILE'
                ? 'border-acc text-acc'
                : 'border-transparent text-mut hover:text-ink'
            }`}
          >
            Personal Details
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('PREFERENCES'); setStatusMessage(null); }}
            className={`py-3 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'PREFERENCES'
                ? 'border-acc text-acc'
                : 'border-transparent text-mut hover:text-ink'
            }`}
          >
            Preferences & Diet
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('SECURITY'); setStatusMessage(null); }}
            className={`py-3 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'SECURITY'
                ? 'border-acc text-acc'
                : 'border-transparent text-mut hover:text-ink'
            }`}
          >
            Security & Login
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {statusMessage && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 text-emerald-800 dark:text-emerald-300'
                  : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 text-rose-800 dark:text-rose-300'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-mut">
              <Loader2 className="w-6 h-6 animate-spin text-acc" />
              <span className="text-xs">Loading profile data...</span>
            </div>
          ) : activeTab === 'PROFILE' ? (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-mut absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full pl-9 pr-3 py-2 bg-card border border-brd rounded-xl text-xs text-ink placeholder:text-mut focus:outline-hidden focus:border-acc"
                  />
                </div>
              </div>

              {/* Email (Readonly) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-ink">Email Address</label>
                  <span className="text-[10px] text-mut uppercase tracking-wider font-semibold">
                    Primary Identifier
                  </span>
                </div>
                <div className="relative">
                  <Mail className="w-4 h-4 text-mut absolute left-3 top-2.5" />
                  <input
                    type="email"
                    disabled
                    value={profile?.email || ''}
                    className="w-full pl-9 pr-3 py-2 bg-card-top/30 border border-brd/60 rounded-xl text-xs text-mut cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Phone with Verification */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-ink">Phone Number</label>
                  {isPhoneVerified ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                    </span>
                  ) : phone.trim().length >= 10 ? (
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={isSendingOtp}
                      className="text-[11px] font-semibold text-acc hover:underline flex items-center gap-1 disabled:opacity-50"
                    >
                      {isSendingOtp && <Loader2 className="w-3 h-3 animate-spin" />}
                      Verify via OTP
                    </button>
                  ) : null}
                </div>
                <div className="relative">
                  <Phone className="w-4 h-4 text-mut absolute left-3 top-2.5" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      if (e.target.value !== profile?.phone) {
                        setIsPhoneVerified(false);
                      }
                    }}
                    placeholder="+91 98765 43210"
                    className="w-full pl-9 pr-3 py-2 bg-card border border-brd rounded-xl text-xs text-ink placeholder:text-mut focus:outline-hidden focus:border-acc"
                  />
                </div>

                {showOtpInput && (
                  <div className="mt-2.5 p-3 rounded-xl bg-paper/80 border border-brd space-y-2">
                    <div className="text-[11px] text-mut">Enter 6-digit verification code sent to {phone}:</div>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        maxLength={6}
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                        placeholder="123456"
                        className="w-32 px-3 py-1.5 text-center font-mono tracking-widest text-sm bg-card border border-brd rounded-lg text-ink focus:outline-none focus:border-acc"
                      />
                      <button
                        type="button"
                        onClick={handleVerifyOtp}
                        disabled={isVerifyingOtp || otpCode.length < 6}
                        className="px-3.5 py-1.5 rounded-lg bg-acc text-white text-xs font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center gap-1.5"
                      >
                        {isVerifyingOtp && <Loader2 className="w-3 h-3 animate-spin" />}
                        Verify
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowOtpInput(false)}
                        className="text-xs text-mut hover:text-ink px-2 py-1"
                      >
                        Cancel
                      </button>
                    </div>
                    {otpNotice && (
                      <div
                        className={`text-[11px] ${
                          otpNotice.type === 'success' ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {otpNotice.text}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Gender and Date of Birth */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as UserGender)}
                    className="w-full px-3 py-2 bg-card border border-brd rounded-xl text-xs text-ink focus:outline-hidden focus:border-acc"
                  >
                    <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
                    <option value="FEMALE">Female</option>
                    <option value="MALE">Male</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Date of Birth</label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-mut absolute left-3 top-2.5" />
                    <input
                      type="date"
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-card border border-brd rounded-xl text-xs text-ink focus:outline-hidden focus:border-acc"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-brd flex justify-end">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-acc hover:opacity-90 text-white transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  Save Personal Details
                </button>
              </div>
            </form>
          ) : activeTab === 'PREFERENCES' ? (
            <form onSubmit={handleSaveProfile} className="space-y-6">
              {/* Dietary Invariant Display */}
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">Dietary Preference</label>
                <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-500/30 rounded-xl flex items-start gap-2.5">
                  <Leaf className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                  <div className="text-xs">
                    <span className="font-semibold text-emerald-900 dark:text-emerald-200">
                      Vegetarian Grocery Platform
                    </span>
                    <p className="text-emerald-700 dark:text-emerald-300 text-[11px] mt-0.5">
                      CartPilot curates vegetarian, fresh grocery essentials across all partner merchants.
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {['VEGETARIAN', 'VEGAN', 'JAIN', 'ORGANIC_ONLY', 'GLUTEN_FREE'].map((tag) => {
                    const active = dietaryPrefs.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          if (tag === 'VEGETARIAN') return;
                          setDietaryPrefs((prev) =>
                            active ? prev.filter((p) => p !== tag) : [...prev, tag]
                          );
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                          active
                            ? 'bg-acc/10 border-acc text-acc'
                            : 'bg-card border-brd text-mut hover:text-ink'
                        }`}
                      >
                        {tag === 'VEGETARIAN' ? '🌱 100% Vegetarian (Mandatory)' : tag ? tag.replace(/_/g, ' ') : ''}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Notification Preferences */}
              <div className="pt-4 border-t border-brd space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <Bell className="w-4 h-4 text-acc" />
                  <h4 className="text-xs font-semibold text-ink">Order & Assistant Notifications</h4>
                </div>

                <label className="flex items-center justify-between p-2.5 rounded-xl border border-brd hover:bg-card-top/20 cursor-pointer">
                  <div>
                    <div className="text-xs font-medium text-ink">Email Notifications</div>
                    <div className="text-[11px] text-mut">Order invoices, dispatch updates & policy audit reports</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications.email}
                    onChange={(e) => setNotifications({ ...notifications, email: e.target.checked })}
                    className="w-4 h-4 accent-acc rounded"
                  />
                </label>

                <label className="flex items-center justify-between p-2.5 rounded-xl border border-brd hover:bg-card-top/20 cursor-pointer">
                  <div>
                    <div className="text-xs font-medium text-ink">SMS Alerts</div>
                    <div className="text-[11px] text-mut">Express delivery dispatch and driver arrival OTPs</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications.sms}
                    onChange={(e) => setNotifications({ ...notifications, sms: e.target.checked })}
                    className="w-4 h-4 accent-acc rounded"
                  />
                </label>

                <label className="flex items-center justify-between p-2.5 rounded-xl border border-brd hover:bg-card-top/20 cursor-pointer">
                  <div>
                    <div className="text-xs font-medium text-ink">Push Notifications</div>
                    <div className="text-[11px] text-mut">Autonomous assistant approval requests and cart alerts</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications.push}
                    onChange={(e) => setNotifications({ ...notifications, push: e.target.checked })}
                    className="w-4 h-4 accent-acc rounded"
                  />
                </label>
              </div>

              <div className="pt-3 border-t border-brd flex justify-end">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-acc hover:opacity-90 text-white transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  Save Preferences
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
                <Lock className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                <span>
                  Changing your password increments your account security version and safely revokes all existing refresh tokens across other browsers.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">Current Password</label>
                <div className="relative">
                  <Key className="w-4 h-4 text-mut absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current account password"
                    className="w-full pl-9 pr-3 py-2 bg-card border border-brd rounded-xl text-xs text-ink placeholder:text-mut focus:outline-hidden focus:border-acc"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">New Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-mut absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    className="w-full pl-9 pr-3 py-2 bg-card border border-brd rounded-xl text-xs text-ink placeholder:text-mut focus:outline-hidden focus:border-acc"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">Confirm New Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-mut absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-type new password"
                    className="w-full pl-9 pr-3 py-2 bg-card border border-brd rounded-xl text-xs text-ink placeholder:text-mut focus:outline-hidden focus:border-acc"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-brd flex justify-end">
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  {isChangingPassword ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  Change Password & Revoke Old Sessions
                </button>
              </div>
            </form>
          )}

          {/* Quick Account Navigation Links */}
          <div className="pt-4 mt-6 border-t border-brd">
            <h4 className="text-[11px] font-semibold text-mut uppercase tracking-wider mb-2">
              Account Shortcuts
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {onOpenAddresses && (
                <button
                  type="button"
                  onClick={() => { onClose(); onOpenAddresses(); }}
                  className="p-2.5 rounded-xl border border-brd hover:border-acc/40 hover:bg-acc/5 text-left flex items-center gap-2 text-xs text-ink transition-colors"
                >
                  <MapPin className="w-4 h-4 text-acc" />
                  <span>Addresses</span>
                </button>
              )}
              {onOpenOrders && (
                <button
                  type="button"
                  onClick={() => { onClose(); onOpenOrders(); }}
                  className="p-2.5 rounded-xl border border-brd hover:border-acc/40 hover:bg-acc/5 text-left flex items-center gap-2 text-xs text-ink transition-colors"
                >
                  <FileText className="w-4 h-4 text-emerald-600" />
                  <span>Past Orders</span>
                </button>
              )}
              {onOpenRules && (
                <button
                  type="button"
                  onClick={() => { onClose(); onOpenRules(); }}
                  className="p-2.5 rounded-xl border border-brd hover:border-acc/40 hover:bg-acc/5 text-left flex items-center gap-2 text-xs text-ink transition-colors"
                >
                  <Shield className="w-4 h-4 text-purple-600" />
                  <span>Rules</span>
                </button>
              )}
            </div>

            {onLogout && (
              <div className="mt-4 pt-3 border-t border-brd/50 flex justify-end">
                <button
                  type="button"
                  onClick={() => { onClose(); onLogout(); }}
                  className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out of CartPilot
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
