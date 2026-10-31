import React, { useState } from 'react';
import {
  Bell,
  Lock,
  HelpCircle,
  Check,
  Phone,
  Mail,
} from 'lucide-react';

interface SettingsViewProps {
  initialSubTab?: 'notifications' | 'security' | 'support';
}

export const MerchantSettingsView: React.FC<SettingsViewProps> = ({ initialSubTab = 'notifications' }) => {
  const [activeTab, setActiveTab] = useState<'notifications' | 'security' | 'support'>(initialSubTab);

  // Notification Preferences
  const [emailNewOrders, setEmailNewOrders] = useState(true);
  const [emailDailyDigest, setEmailDailyDigest] = useState(true);
  const [smsUrgentAlerts, setSmsUrgentAlerts] = useState(true);
  const [inAppAudio, setInAppAudio] = useState(true);

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaved, setPasswordSaved] = useState(false);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword && newPassword === confirmPassword) {
      setPasswordSaved(true);
      setTimeout(() => setPasswordSaved(false), 3000);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold font-display text-slate-900 dark:text-white tracking-tight">
          Settings & Preferences
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Configure notifications, account credentials and merchant support channels
        </p>
      </div>

      {/* Settings Sub-tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-800 overflow-x-auto pb-px">
        {[
          { id: 'notifications', label: 'Notifications Preferences', icon: Bell },
          { id: 'security', label: 'Account & Security', icon: Lock },
          { id: 'support', label: 'Help & Support', icon: HelpCircle },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 whitespace-nowrap transition-colors ${
                isActive
                  ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      <div className="max-w-2xl text-xs space-y-6">
        {/* 1. Notifications */}
        {activeTab === 'notifications' && (
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800">
              Notification Channels
            </h3>

            <div className="space-y-4">
              <label className="flex items-start justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 cursor-pointer">
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">
                    Email Alert for New Customer Orders
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Receive instant email notification whenever a shopper completes checkout
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={emailNewOrders}
                  onChange={(e) => setEmailNewOrders(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 mt-1"
                />
              </label>

              <label className="flex items-start justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 cursor-pointer">
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">
                    Daily Settlement & Sales Digest
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Summary of daily gross revenue, commission deduction and net payable amount
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={emailDailyDigest}
                  onChange={(e) => setEmailDailyDigest(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 mt-1"
                />
              </label>

              <label className="flex items-start justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 cursor-pointer">
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">
                    SMS Alerts for Urgent Handover Deadlines
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Receive SMS notifications if a delivery partner arrives while order is still packing
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={smsUrgentAlerts}
                  onChange={(e) => setSmsUrgentAlerts(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 mt-1"
                />
              </label>

              <label className="flex items-start justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 cursor-pointer">
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">
                    In-App Audio Chime for New Incoming Orders
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Play a pleasant notification chime on the merchant dashboard when an order arrives
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={inAppAudio}
                  onChange={(e) => setInAppAudio(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 mt-1"
                />
              </label>
            </div>
          </div>
        )}

        {/* 2. Security */}
        {activeTab === 'security' && (
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800">
              Account Password & Security
            </h3>

            {passwordSaved && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-semibold flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Password updated successfully!</span>
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 shadow-xs"
              >
                Update Password
              </button>
            </form>
          </div>
        )}

        {/* 3. Support */}
        {activeTab === 'support' && (
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800">
              Merchant Partner Support
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-2">
                <div className="p-2 w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
                  <Phone className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-slate-900 dark:text-white">Partner Hotline</h4>
                <p className="text-slate-500 text-[11px]">
                  Priority assistance for live order emergencies and rider issues.
                </p>
                <a
                  href="tel:+918001234567"
                  className="font-mono font-bold text-emerald-600 block mt-1 hover:underline"
                >
                  +91 800 123 4567
                </a>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-2">
                <div className="p-2 w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
                  <Mail className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-slate-900 dark:text-white">Merchant Desk</h4>
                <p className="text-slate-500 text-[11px]">
                  Settlement queries, tax invoices and catalogue compliance questions.
                </p>
                <a
                  href="mailto:merchant-support@cartpilot.com"
                  className="font-mono font-bold text-emerald-600 block mt-1 hover:underline"
                >
                  merchant-support@cartpilot.com
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
