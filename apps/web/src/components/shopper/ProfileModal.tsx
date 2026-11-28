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
  Camera,
} from 'lucide-react';
import { UserProfile, UserGender, INotificationPreferences } from '../../types';
import { API_BASE } from '../../config/api';
import { useAuth, isPlaceholderEmail } from '../../context/AuthContext';
import { AvatarModal } from './AvatarModal';

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
  const { authFetch, setUserProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<'PROFILE' | 'SECURITY' | 'PREFERENCES'>('PROFILE');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Profile Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
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

  // Avatar Modal state
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);

  const handleSaveAvatarFromModal = async (newAvatarUrl: string): Promise<boolean> => {
    try {
      if (setUserProfile) {
        (setUserProfile as any)({
          ...(profile || {}),
          avatarUrl: newAvatarUrl,
        });
      }

      const res = await authFetch(`${API_BASE}/users/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatarUrl: newAvatarUrl }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setProfile((prev) => (prev ? { ...prev, avatarUrl: newAvatarUrl } : null));
        if (setUserProfile && data.data) {
          (setUserProfile as any)({
            ...(profile || {}),
            ...data.data,
            avatarUrl: data.data.avatarUrl || newAvatarUrl,
          });
        }
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

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
          const isPlaceholder = isPlaceholderEmail(u.email);
          setEmail(isPlaceholder ? '' : (u.displayEmail || u.email || ''));
          setPhone(u.phone || '');
          setIsPhoneVerified(Boolean(u.isPhoneVerified && u.phone));
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
        if (setUserProfile) {
          (setUserProfile as any)({
            ...(profile || {}),
            phone: phone.trim(),
            isPhoneVerified: true,
            hasPhone: true,
          });
        }
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
      const isPlaceholder = isPlaceholderEmail(profile?.email);
      const payload: Record<string, any> = {
        name: name.trim(),
        phone: phone.trim(),
        gender,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        dietaryPreferences: dietaryPrefs,
        notificationPreferences: notifications,
      };

      if (email.trim() && (isPlaceholder || !profile?.email || email.trim().toLowerCase() !== profile.email.toLowerCase())) {
        payload.email = email.trim().toLowerCase();
      }

      const res = await authFetch(`${API_BASE}/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        const updated = data.data;
        setProfile(updated);
        const updatedIsPlaceholder = isPlaceholderEmail(updated.email);
        setEmail(updatedIsPlaceholder ? '' : (updated.displayEmail || updated.email || ''));
        if (setUserProfile) {
          (setUserProfile as any)({
            ...(profile || {}),
            ...updated,
            email: updatedIsPlaceholder ? '' : updated.email,
            displayEmail: updatedIsPlaceholder ? '' : updated.email,
            hasRealEmail: !updatedIsPlaceholder,
            hasPhone: Boolean(updated.phone && updated.phone.trim()),
          });
        }
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
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150"
    >
      <div className="bg-white dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col text-stone-900 dark:text-zinc-100">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 dark:border-zinc-800 bg-stone-50/80 dark:bg-zinc-900/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-sm">
              {profile?.name ? profile.name[0].toUpperCase() : 'U'}
            </div>
            <div>
              <h2 id="profile-modal-title" className="text-sm font-bold text-stone-900 dark:text-white">
                {profile?.name || 'Customer Account'}
              </h2>
              <p className="text-[11px] text-stone-500 dark:text-zinc-400">{profile?.email || 'Logged in shopper'}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-stone-200 dark:border-zinc-800 px-6 bg-stone-50/40 dark:bg-zinc-900/40 gap-6">
          <button
            type="button"
            onClick={() => { setActiveTab('PROFILE'); setStatusMessage(null); }}
            className={`py-3 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'PROFILE'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 dark:border-emerald-400'
                : 'border-transparent text-stone-500 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            Personal Details
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('PREFERENCES'); setStatusMessage(null); }}
            className={`py-3 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'PREFERENCES'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 dark:border-emerald-400'
                : 'border-transparent text-stone-500 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            Preferences & Diet
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('SECURITY'); setStatusMessage(null); }}
            className={`py-3 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'SECURITY'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 dark:border-emerald-400'
                : 'border-transparent text-stone-500 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-white'
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
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-stone-400 dark:text-zinc-400">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-600 dark:text-emerald-400" />
              <span className="text-xs">Loading profile data...</span>
            </div>
          ) : activeTab === 'PROFILE' ? (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              {/* Profile Avatar Card */}
              <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-stone-50 dark:bg-zinc-900 border border-stone-200/80 dark:border-zinc-800">
                <div className="relative w-14 h-14 rounded-full border-2 border-stone-200 dark:border-zinc-700 p-0.5 shrink-0 overflow-hidden">
                  {profile?.avatarUrl ? (
                    <img
                      src={profile.avatarUrl}
                      alt={name}
                      className="w-full h-full rounded-full object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : null}
                  {!profile?.avatarUrl && (
                    <div className="w-full h-full rounded-full bg-stone-900 dark:bg-zinc-800 text-white font-bold text-lg flex items-center justify-center">
                      {name ? name.charAt(0).toUpperCase() : 'P'}
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-stone-900 dark:text-white">Profile Photo</div>
                  <div className="text-[11px] text-stone-500 dark:text-zinc-400">
                    Visible across your orders and account
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAvatarModalOpen(true)}
                    className="mt-1 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>{profile?.avatarUrl ? 'Change Photo' : 'Upload or Take Photo'}</span>
                  </button>
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-stone-900 dark:text-white mb-1">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-stone-400 dark:text-zinc-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full pl-9 pr-3 py-2 bg-stone-50 dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-xl text-xs text-stone-900 dark:text-white placeholder:text-stone-400 dark:placeholder:text-zinc-500 focus:outline-hidden focus:border-emerald-500 dark:focus:border-emerald-400"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-stone-900 dark:text-white">Email Address</label>
                  {isPlaceholderEmail(profile?.email) ? (
                    <span className="text-[10px] text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800 font-semibold">
                      + Add for Order Invoices
                    </span>
                  ) : profile?.isEmailVerified ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                    </span>
                  ) : (
                    <span className="text-[10px] text-stone-400 dark:text-zinc-500 uppercase tracking-wider font-semibold">
                      Primary Identifier
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-400 dark:text-zinc-500 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email (e.g. name@example.com)"
                    className="w-full pl-9 pr-3 py-2 bg-stone-50 dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-xl text-xs text-stone-900 dark:text-white placeholder:text-stone-400 dark:placeholder:text-zinc-500 focus:outline-hidden focus:border-emerald-500 dark:focus:border-emerald-400"
                  />
                </div>
                {isPlaceholderEmail(profile?.email) && (
                  <p className="mt-1.5 text-[11px] text-stone-500 dark:text-zinc-400">
                    You signed in via mobile OTP. Add your real email to receive order invoices, receipts, and delivery notifications.
                  </p>
                )}
              </div>

              {/* Phone with Verification */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-stone-900 dark:text-white">Phone Number</label>
                  {isPhoneVerified ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                    </span>
                  ) : phone.trim().length >= 10 ? (
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={isSendingOtp}
                      className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                    >
                      {isSendingOtp && <Loader2 className="w-3 h-3 animate-spin" />}
                      Verify via OTP
                    </button>
                  ) : (
                    <span className="text-[10px] text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800 font-semibold">
                      + Add Phone
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Phone className="w-4 h-4 text-stone-400 dark:text-zinc-500 absolute left-3 top-2.5" />
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
                    className="w-full pl-9 pr-3 py-2 bg-stone-50 dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-xl text-xs text-stone-900 dark:text-white placeholder:text-stone-400 dark:placeholder:text-zinc-500 focus:outline-hidden focus:border-emerald-500 dark:focus:border-emerald-400"
                  />
                </div>

                {showOtpInput && (
                  <div className="mt-2.5 p-3 rounded-xl bg-stone-50 dark:bg-zinc-900/80 border border-stone-200 dark:border-zinc-800 space-y-2">
                    <div className="text-[11px] text-stone-500 dark:text-zinc-400">Enter 6-digit verification code sent to {phone}:</div>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        maxLength={6}
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                        placeholder="123456"
                        className="w-32 px-3 py-1.5 text-center font-mono tracking-widest text-sm bg-white dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-lg text-stone-900 dark:text-white focus:outline-none focus:border-emerald-500"
                      />
                      <button
                        type="button"
                        onClick={handleVerifyOtp}
                        disabled={isVerifyingOtp || otpCode.length < 6}
                        className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold disabled:opacity-50 transition-opacity flex items-center gap-1.5 cursor-pointer"
                      >
                        {isVerifyingOtp && <Loader2 className="w-3 h-3 animate-spin" />}
                        Verify
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowOtpInput(false)}
                        className="text-xs text-stone-500 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-white px-2 py-1 cursor-pointer"
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
                  <label className="block text-xs font-semibold text-stone-900 dark:text-white mb-1">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as UserGender)}
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-xl text-xs text-stone-900 dark:text-white focus:outline-hidden focus:border-emerald-500 dark:focus:border-emerald-400"
                  >
                    <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
                    <option value="FEMALE">Female</option>
                    <option value="MALE">Male</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-900 dark:text-white mb-1">Date of Birth</label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-stone-400 dark:text-zinc-500 absolute left-3 top-2.5" />
                    <input
                      type="date"
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-stone-50 dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-xl text-xs text-stone-900 dark:text-white focus:outline-hidden focus:border-emerald-500 dark:focus:border-emerald-400"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-stone-200 dark:border-zinc-800 flex justify-end">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
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
                <label className="block text-xs font-semibold text-stone-900 dark:text-white mb-1">Dietary Preference</label>
                <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-500/30 rounded-xl flex items-start gap-2.5">
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
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                          active
                            ? 'bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-bold'
                            : 'bg-stone-50 dark:bg-zinc-900 border-stone-200 dark:border-zinc-800 text-stone-600 dark:text-zinc-300 hover:text-stone-900 dark:hover:text-white'
                        }`}
                      >
                        {tag === 'VEGETARIAN' ? '🌱 100% Vegetarian (Mandatory)' : tag ? tag.replace(/_/g, ' ') : ''}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Notification Preferences */}
              <div className="pt-4 border-t border-stone-200 dark:border-zinc-800 space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <Bell className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <h4 className="text-xs font-semibold text-stone-900 dark:text-white">Order & Assistant Notifications</h4>
                </div>

                <label className="flex items-center justify-between p-2.5 rounded-xl border border-stone-200 dark:border-zinc-800 hover:bg-stone-50 dark:hover:bg-zinc-900/60 cursor-pointer">
                  <div>
                    <div className="text-xs font-medium text-stone-900 dark:text-white">Email Notifications</div>
                    <div className="text-[11px] text-stone-500 dark:text-zinc-400">Order invoices, dispatch updates & policy audit reports</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications.email}
                    onChange={(e) => setNotifications({ ...notifications, email: e.target.checked })}
                    className="w-4 h-4 accent-emerald-600 rounded"
                  />
                </label>

                <label className="flex items-center justify-between p-2.5 rounded-xl border border-stone-200 dark:border-zinc-800 hover:bg-stone-50 dark:hover:bg-zinc-900/60 cursor-pointer">
                  <div>
                    <div className="text-xs font-medium text-stone-900 dark:text-white">SMS Alerts</div>
                    <div className="text-[11px] text-stone-500 dark:text-zinc-400">Express delivery dispatch and driver arrival OTPs</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications.sms}
                    onChange={(e) => setNotifications({ ...notifications, sms: e.target.checked })}
                    className="w-4 h-4 accent-emerald-600 rounded"
                  />
                </label>

                <label className="flex items-center justify-between p-2.5 rounded-xl border border-stone-200 dark:border-zinc-800 hover:bg-stone-50 dark:hover:bg-zinc-900/60 cursor-pointer">
                  <div>
                    <div className="text-xs font-medium text-stone-900 dark:text-white">Push Notifications</div>
                    <div className="text-[11px] text-stone-500 dark:text-zinc-400">Autonomous assistant approval requests and cart alerts</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications.push}
                    onChange={(e) => setNotifications({ ...notifications, push: e.target.checked })}
                    className="w-4 h-4 accent-emerald-600 rounded"
                  />
                </label>
              </div>

              <div className="pt-3 border-t border-stone-200 dark:border-zinc-800 flex justify-end">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
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
                <label className="block text-xs font-semibold text-stone-900 dark:text-white mb-1">Current Password</label>
                <div className="relative">
                  <Key className="w-4 h-4 text-stone-400 dark:text-zinc-500 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current account password"
                    className="w-full pl-9 pr-3 py-2 bg-stone-50 dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-xl text-xs text-stone-900 dark:text-white placeholder:text-stone-400 dark:placeholder:text-zinc-500 focus:outline-hidden focus:border-emerald-500 dark:focus:border-emerald-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-900 dark:text-white mb-1">New Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 dark:text-zinc-500 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    className="w-full pl-9 pr-3 py-2 bg-stone-50 dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-xl text-xs text-stone-900 dark:text-white placeholder:text-stone-400 dark:placeholder:text-zinc-500 focus:outline-hidden focus:border-emerald-500 dark:focus:border-emerald-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-900 dark:text-white mb-1">Confirm New Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 dark:text-zinc-500 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-type new password"
                    className="w-full pl-9 pr-3 py-2 bg-stone-50 dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-xl text-xs text-stone-900 dark:text-white placeholder:text-stone-400 dark:placeholder:text-zinc-500 focus:outline-hidden focus:border-emerald-500 dark:focus:border-emerald-400"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-stone-200 dark:border-zinc-800 flex justify-end">
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {isChangingPassword ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  Change Password & Revoke Old Sessions
                </button>
              </div>
            </form>
          )}

          {/* Quick Account Navigation Links */}
          <div className="pt-4 mt-6 border-t border-stone-200 dark:border-zinc-800">
            <h4 className="text-[11px] font-bold text-stone-400 dark:text-zinc-500 uppercase tracking-wider mb-2">
              Account Shortcuts
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {onOpenAddresses && (
                <button
                  type="button"
                  onClick={() => { onClose(); onOpenAddresses(); }}
                  className="p-2.5 rounded-xl border border-stone-200 dark:border-zinc-800 hover:border-emerald-500/50 hover:bg-emerald-50/50 dark:hover:bg-zinc-900 text-left flex items-center gap-2 text-xs text-stone-800 dark:text-zinc-200 transition-colors cursor-pointer"
                >
                  <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Addresses</span>
                </button>
              )}
              {onOpenOrders && (
                <button
                  type="button"
                  onClick={() => { onClose(); onOpenOrders(); }}
                  className="p-2.5 rounded-xl border border-stone-200 dark:border-zinc-800 hover:border-emerald-500/50 hover:bg-emerald-50/50 dark:hover:bg-zinc-900 text-left flex items-center gap-2 text-xs text-stone-800 dark:text-zinc-200 transition-colors cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Past Orders</span>
                </button>
              )}
              {onOpenRules && (
                <button
                  type="button"
                  onClick={() => { onClose(); onOpenRules(); }}
                  className="p-2.5 rounded-xl border border-stone-200 dark:border-zinc-800 hover:border-purple-500/50 hover:bg-purple-50/50 dark:hover:bg-zinc-900 text-left flex items-center gap-2 text-xs text-stone-800 dark:text-zinc-200 transition-colors cursor-pointer"
                >
                  <Shield className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span>Rules</span>
                </button>
              )}
            </div>

            {onLogout && (
              <div className="mt-4 pt-3 border-t border-stone-200/60 dark:border-zinc-800/60 flex justify-end">
                <button
                  type="button"
                  onClick={() => { onClose(); onLogout(); }}
                  className="text-xs text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out of CartPilot
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* ── Avatar Modal ── */}
      <AvatarModal
        isOpen={isAvatarModalOpen}
        onClose={() => setIsAvatarModalOpen(false)}
        currentAvatarUrl={profile?.avatarUrl || ''}
        userName={name || 'Shopper'}
        userInitial={name ? name.charAt(0).toUpperCase() : 'P'}
        onSaveAvatar={handleSaveAvatarFromModal}
      />
    </div>
  );
};
