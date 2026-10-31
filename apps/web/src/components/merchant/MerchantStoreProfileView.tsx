import React, { useState, useEffect } from 'react';
import {
  Store,
  MapPin,
  Clock,
  Truck,
  CreditCard,
  FileText,
  Sparkles,
  Check,
  ShieldCheck,
  Plus,
  X,
} from 'lucide-react';
import { MerchantStoreData } from './types';

interface StoreProfileViewProps {
  store: MerchantStoreData | null;
  onSaveProfile: (updates: Partial<MerchantStoreData>) => Promise<void>;
  isSaving: boolean;
}

type ProfileTab =
  | 'basic'
  | 'hours'
  | 'address'
  | 'delivery'
  | 'payouts'
  | 'documents'
  | 'branding';

export const MerchantStoreProfileView: React.FC<StoreProfileViewProps> = ({
  store,
  onSaveProfile,
  isSaving,
}) => {
  const [activeTab, setActiveTab] = useState<ProfileTab>('basic');

  // Fields
  const [businessName, setBusinessName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [description, setDescription] = useState('');
  const [businessType, setBusinessType] = useState('Grocery & Organic Food');
  const [isOnline, setIsOnline] = useState(true);
  const [fssaiLicense, setFssaiLicense] = useState('11223344556677');

  // Address
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('Bengaluru');
  const [state, setState] = useState('Karnataka');
  const [postalCode, setPostalCode] = useState('560038');

  // Delivery
  const [servicePincodes, setServicePincodes] = useState<string[]>(['560001', '560034', '560102', '560103']);
  const [newPincodeInput, setNewPincodeInput] = useState('');

  // Bank
  const [accountHolder, setAccountHolder] = useState('Fresh Greens Retail Pvt Ltd');
  const [bankName, setBankName] = useState('HDFC Bank');
  const [accountNumber, setAccountNumber] = useState('•••• •••• 8829');
  const [ifsc, setIfsc] = useState('HDFC0001234');
  const [upiId, setUpiId] = useState('freshgreens@hdfcbank');

  useEffect(() => {
    if (store) {
      setBusinessName(store.businessName || '');
      setContactEmail(store.email || '');
      setContactPhone(store.phone || '');
      setDescription(store.description || 'We offer fresh, organic, and 100% vegetarian produce sourced directly from verified local farmers.');
      setIsOnline(store.isActive ?? true);
      if (store.address) {
        setStreet(store.address.street || '');
        setCity(store.address.city || 'Bengaluru');
        setState(store.address.state || 'Karnataka');
        setPostalCode(store.address.postalCode || '560038');
      }
      if (store.serviceAreaPincodes && store.serviceAreaPincodes.length > 0) {
        setServicePincodes(store.serviceAreaPincodes);
      }
    }
  }, [store]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSaveProfile({
      businessName,
      description,
      email: contactEmail,
      phone: contactPhone,
      isActive: isOnline,
      address: {
        street,
        city,
        state,
        postalCode,
      },
      serviceAreaPincodes: servicePincodes,
    });
  };

  const handleAddPincode = () => {
    const pin = newPincodeInput.trim();
    if (pin.length === 6 && !servicePincodes.includes(pin)) {
      setServicePincodes([...servicePincodes, pin]);
      setNewPincodeInput('');
    }
  };

  const handleRemovePincode = (pin: string) => {
    setServicePincodes(servicePincodes.filter((p) => p !== pin));
  };

  const tabs = [
    { id: 'basic', label: 'Basic Information', icon: Store },
    { id: 'hours', label: 'Operating Hours', icon: Clock },
    { id: 'address', label: 'Address & Location', icon: MapPin },
    { id: 'delivery', label: 'Delivery Settings', icon: Truck },
    { id: 'payouts', label: 'Bank & Payouts', icon: CreditCard },
    { id: 'documents', label: 'Documents & FSSAI', icon: FileText },
    { id: 'branding', label: 'Branding & Visuals', icon: Sparkles },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-display text-slate-900 dark:text-white tracking-tight">
            Store Profile
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Manage your store identity, operating hours, delivery radius and banking
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 shadow-xs"
        >
          {isSaving ? (
            <span>Saving...</span>
          ) : (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>Save Changes</span>
            </>
          )}
        </button>
      </div>

      {/* Main 2-Column Split: Left navigation tabs + Right Form */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden flex flex-col md:flex-row min-h-[560px]">
        {/* Left Sub-tabs */}
        <div className="w-full md:w-64 border-r border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 p-3 space-y-1 flex-shrink-0">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as ProfileTab)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors text-left ${
                  isActive
                    ? 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 font-semibold shadow-xs border border-slate-200/80 dark:border-slate-700'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-white/60 dark:hover:bg-slate-800/40'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Tab Content */}
        <div className="flex-1 p-6 md:p-8 overflow-y-auto text-xs">
          {/* 1. Basic Information */}
          {activeTab === 'basic' && (
            <div className="space-y-5 animate-in fade-in duration-150 max-w-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Basic Information
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                    Store Status: {isOnline ? 'Online' : 'Offline'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsOnline(!isOnline)}
                    className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                      isOnline ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition duration-200 ${
                        isOnline ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Store Business Name *
                </label>
                <input
                  type="text"
                  required
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Store Description
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Contact Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Contact Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Business Type
                  </label>
                  <input
                    type="text"
                    value={businessType}
                    onChange={(e) => setBusinessType(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    FSSAI License Number
                  </label>
                  <input
                    type="text"
                    value={fssaiLicense}
                    onChange={(e) => setFssaiLicense(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 2. Operating Hours */}
          {activeTab === 'hours' && (
            <div className="space-y-4 animate-in fade-in duration-150 max-w-2xl">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">
                Weekly Operating Hours
              </h3>
              <div className="space-y-2">
                {[
                  'Monday',
                  'Tuesday',
                  'Wednesday',
                  'Thursday',
                  'Friday',
                  'Saturday',
                  'Sunday',
                ].map((day) => (
                  <div
                    key={day}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800"
                  >
                    <span className="font-semibold text-slate-800 dark:text-slate-200 w-28">
                      {day}
                    </span>
                    <span className="font-mono text-emerald-600 font-medium">
                      07:00 AM – 10:30 PM
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                      Open
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. Address & Location */}
          {activeTab === 'address' && (
            <div className="space-y-4 animate-in fade-in duration-150 max-w-2xl">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">
                Store Physical Address & GPS Coordinates
              </h3>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Street Address *
                </label>
                <input
                  type="text"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  placeholder="Plot 12, 100ft Road, HAL 2nd Stage"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Postal Code
                  </label>
                  <input
                    type="text"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 4. Delivery Settings */}
          {activeTab === 'delivery' && (
            <div className="space-y-4 animate-in fade-in duration-150 max-w-2xl">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">
                Serviceable Delivery Areas (Pincodes)
              </h3>

              <div className="flex gap-2">
                <input
                  type="text"
                  maxLength={6}
                  value={newPincodeInput}
                  onChange={(e) => setNewPincodeInput(e.target.value)}
                  placeholder="Enter 6-digit Bengaluru pincode"
                  className="flex-1 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                />
                <button
                  type="button"
                  onClick={handleAddPincode}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Pincode</span>
                </button>
              </div>

              <div className="pt-2 flex flex-wrap gap-2">
                {servicePincodes.map((pin) => (
                  <span
                    key={pin}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
                  >
                    <span>{pin}</span>
                    <button
                      type="button"
                      onClick={() => handleRemovePincode(pin)}
                      className="text-slate-400 hover:text-rose-500"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 5. Bank & Payouts */}
          {activeTab === 'payouts' && (
            <div className="space-y-4 animate-in fade-in duration-150 max-w-2xl">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">
                Direct Bank Account & Payout Settlement
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Beneficiary Name
                  </label>
                  <input
                    type="text"
                    value={accountHolder}
                    onChange={(e) => setAccountHolder(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Bank Name
                  </label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Account Number
                  </label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    IFSC Code
                  </label>
                  <input
                    type="text"
                    value={ifsc}
                    onChange={(e) => setIfsc(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  UPI ID for Instant Settlement
                </label>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                  placeholder="merchant@bank"
                />
              </div>
            </div>
          )}

          {/* 6. Documents & FSSAI */}
          {activeTab === 'documents' && (
            <div className="space-y-4 animate-in fade-in duration-150 max-w-2xl">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">
                Statutory Compliance & FSSAI Certification
              </h3>
              <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 space-y-2">
                <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  <span>100% Pure Vegetarian Assurance Certified</span>
                </div>
                <p className="text-xs text-emerald-700 dark:text-emerald-400">
                  Your store has completed the compliance audit. Non-vegetarian SKUs are strictly blocked by system governance policy.
                </p>
              </div>
            </div>
          )}

          {/* 7. Branding */}
          {activeTab === 'branding' && (
            <div className="space-y-4 animate-in fade-in duration-150 max-w-2xl">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">
                Store Logo & Visual Assets
              </h3>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-2xl bg-emerald-600 text-white font-bold text-2xl flex items-center justify-center shadow-md">
                  🥬
                </div>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">Store Logo</p>
                  <p className="text-slate-400 text-[11px] mt-0.5">Recommended 512x512 PNG with transparent background</p>
                  <button
                    type="button"
                    className="mt-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50"
                  >
                    Change Logo
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
