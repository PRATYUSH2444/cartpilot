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
        const res = await fetch(`${API_BASE}/users/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok && data.success) {
          const u: UserProfile = data.data;
          setProfile(u);
          setName(u.name || '');
          setPhone(u.phone || '');
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

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setIsSaving(true);
    setStatusMessage(null);

    try {
      const res = await fetch(`${API_BASE}/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
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
      const res = await fetch(`${API_BASE}/users/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
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
        <div className="flex border-b border-brd px-6 bg-card">
          <button
            type="button"
            onClick={() => { setActiveTab('PROFILE'); setStatusMessage(null); }}
            className={`py-3 px-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'PROFILE'
                ? 'border-acc text-acc'
                : 'border-transparent text-mut hover:text-ink'
            }`}
          >
            <User className="w-4 h-4" />
            Profile Details
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('PREFERENCES'); setStatusMessage(null); }}
            className={`py-3 px-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'PREFERENCES'
                ? 'border-acc text-acc'
                : 'border-transparent text-mut hover:text-ink'
            }`}
          >
            <Bell className="w-4 h-4" />
            Preferences
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('SECURITY'); setStatusMessage(null); }}
            className={`py-3 px-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'SECURITY'
                ? 'border-acc text-acc'
                : 'border-transparent text-mut hover:text-ink'
            }`}
          >
            <Shield className="w-4 h-4" />
            Security & Login
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {statusMessage && (
            <div
              className={`p-3 rounded-xl border flex items-center gap-2 text-xs ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-mut">
              <Loader2 className="w-6 h-6 animate-spin text-acc" />
              <span className="text-xs">Loading profile information...</span>
            </div>
          ) : activeTab === 'PROFILE' ? (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              {/* Email (Read-Only) */}
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">Email Address</label>
                <div className="flex items-center gap-2 px-3 py-2 bg-card-top/50 border border-brd rounded-xl text-xs text-mut">
                  <Mail className="w-4 h-4 text-mut" />
                  <span className="flex-1 font-mono">{profile?.email}</span>
                  <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    Verified
                  </span>
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-mut absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your full name"
                    className="w-full pl-9 pr-3 py-2 bg-card border border-brd rounded-xl text-xs text-ink placeholder:text-mut focus:outline-hidden focus:border-acc"
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">Phone Number</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-mut absolute left-3 top-2.5" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full pl-9 pr-3 py-2 bg-card border border-brd rounded-xl text-xs text-ink placeholder:text-mut focus:outline-hidden focus:border-acc"
                  />
                </div>
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

              {/* Save Button */}
              <div className="pt-3 border-t border-brd flex justify-end">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-acc hover:bg-acc/90 text-paper dark:text-ink transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  Save Profile Changes
                </button>
              </div>
            </form>
          ) : activeTab === 'PREFERENCES' ? (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              {/* Vegetarian Catalog Invariant Notice */}
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-semibold text-xs mb-1">
                  <Leaf className="w-4 h-4" />
                  CartPilot 100% Vegetarian Invariant
                </div>
                <p className="text-[11px] text-emerald-800/80 dark:text-emerald-300/80">
                  All products available on CartPilot are strictly vegetarian and FSSAI certified. No non-vegetarian items can be ordered or suggested.
                </p>
              </div>

              {/* Additional Dietary Tags */}
              <div>
                <label className="block text-xs font-semibold text-ink mb-2">Dietary Preferences</label>
                <div className="flex flex-wrap gap-2">
                  {['VEGETARIAN', 'VEGAN', 'JAIN', 'ORGANIC_ONLY', 'GLUTEN_FREE'].map((diet) => {
                    const isSelected = dietaryPrefs.includes(diet);
                    return (
                      <button
                        key={diet}
                        type="button"
                        onClick={() => {
                          if (diet === 'VEGETARIAN') return; // Cannot uncheck vegetarian
                          setDietaryPrefs(
                            isSelected
                              ? dietaryPrefs.filter((d) => d !== diet)
                              : [...dietaryPrefs, diet]
                          );
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                          isSelected
                            ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-700 dark:text-emerald-300'
                            : 'bg-card border-brd text-mut hover:text-ink'
                        }`}
                      >
                        {diet.replace('_', ' ')}
                        {diet === 'VEGETARIAN' && ' (Required)'}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Notification Preferences */}
              <div className="pt-2 border-t border-brd space-y-3">
                <label className="block text-xs font-semibold text-ink">Notification Channels</label>
                <div className="space-y-2">
                  {[
                    { key: 'email', label: 'Email Order Summaries & Receipts' },
                    { key: 'sms', label: 'SMS Delivery Status Updates' },
                    { key: 'push', label: 'Push Notifications (Order arrived, Agent alerts)' },
                    { key: 'inApp', label: 'In-App Notifications' },
                  ].map((item) => (
                    <label key={item.key} className="flex items-center justify-between p-2.5 rounded-xl bg-card border border-brd cursor-pointer hover:bg-card-top transition-colors">
                      <span className="text-xs text-ink font-medium">{item.label}</span>
                      <input
                        type="checkbox"
                        checked={notifications[item.key as keyof INotificationPreferences]}
                        onChange={(e) =>
                          setNotifications({
                            ...notifications,
                            [item.key]: e.target.checked,
                          })
                        }
                        className="w-4 h-4 rounded-sm text-acc focus:ring-acc"
                      />
                    </label>
                  ))}
                </div>
              </div>

              {/* Save Button */}
              <div className="pt-3 border-t border-brd flex justify-end">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-acc hover:bg-acc/90 text-paper dark:text-ink transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  Update Preferences
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5 text-xs text-amber-700 dark:text-amber-400">
                <Lock className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Security Session Invalidation</p>
                  <p className="text-[11px] mt-0.5 text-amber-800/80 dark:text-amber-300/80">
                    Changing your password will automatically invalidate your active tokens on all other devices.
                  </p>
                </div>
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
                    placeholder="Enter current password"
                    className="w-full pl-9 pr-3 py-2 bg-card border border-brd rounded-xl text-xs text-ink placeholder:text-mut focus:outline-hidden focus:border-acc"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  New Password (min. 8 characters)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-mut absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new strong password"
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
                  <span>Spending Rules</span>
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
