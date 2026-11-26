import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  MapPin,
  Home,
  Briefcase,
  Plus,
  Check,
  Trash2,
  Edit2,
  Clock,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ArrowLeft,
  Navigation,
} from 'lucide-react';
import { UserAddress, ServiceabilityInfo, AddressType } from '../../types';
import { API_BASE } from '../../config/api';
import { useAuth } from '../../context/AuthContext';

interface AddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string | null;
  selectedAddressId?: string;
  onSelectAddress?: (address: UserAddress) => void;
}

interface AddressFormData {
  id?: string;
  fullName: string;
  phone: string;
  houseFlat: string;
  apartmentStreet: string;
  areaLocality: string;
  landmark: string;
  city: string;
  state: string;
  pincode: string;
  addressType: AddressType;
  deliveryInstructions: string;
  isDefault: boolean;
}

const INITIAL_FORM: AddressFormData = {
  fullName: '',
  phone: '',
  houseFlat: '',
  apartmentStreet: '',
  areaLocality: '',
  landmark: '',
  city: 'Bengaluru',
  state: 'Karnataka',
  pincode: '',
  addressType: 'HOME',
  deliveryInstructions: '',
  isDefault: false,
};

export const AddressModal: React.FC<AddressModalProps> = ({
  isOpen,
  onClose,
  token,
  selectedAddressId,
  onSelectAddress,
}) => {
  const { authFetch } = useAuth();
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [viewState, setViewState] = useState<'LIST' | 'FORM'>('LIST');
  const [formData, setFormData] = useState<AddressFormData>(INITIAL_FORM);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Live Pincode Serviceability Check state
  const [serviceability, setServiceability] = useState<ServiceabilityInfo | null>(null);
  const [isCheckingPincode, setIsCheckingPincode] = useState<boolean>(false);
  const [pincodeError, setPincodeError] = useState<string | null>(null);

  // Fetch addresses on modal open
  const fetchAddresses = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await authFetch(`${API_BASE}/addresses`);
      const data = await res.json();
      if (res.ok && data.success) {
        setAddresses(data.data);
      } else {
        setError(data.error?.message || 'Failed to load addresses');
      }
    } catch {
      setError('Network error while loading addresses');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (isOpen) {
      fetchAddresses();
      setViewState('LIST');
      setFormData(INITIAL_FORM);
      setServiceability(null);
    }
  }, [isOpen, fetchAddresses]);

  // Debounced check for pincode serviceability
  useEffect(() => {
    if (viewState !== 'FORM') return;
    const cleanPin = formData.pincode.trim();
    if (!/^[1-9][0-9]{5}$/.test(cleanPin)) {
      setServiceability(null);
      if (cleanPin.length === 6) {
        setPincodeError('Invalid 6-digit postal code');
      } else {
        setPincodeError(null);
      }
      return;
    }

    setPincodeError(null);
    setIsCheckingPincode(true);

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE}/addresses/serviceability?pincode=${cleanPin}`);
        const data = await res.json();
        if (res.ok && data.success) {
          setServiceability(data.data);
        } else {
          setPincodeError(data.error?.message || 'Unable to verify pincode');
          setServiceability(null);
        }
      } catch {
        setPincodeError('Network error checking serviceability');
        setServiceability(null);
      } finally {
        setIsCheckingPincode(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [formData.pincode, viewState]);

  const handleStartAdd = () => {
    setFormData({
      ...INITIAL_FORM,
      isDefault: addresses.length === 0,
    });
    setServiceability(null);
    setPincodeError(null);
    setViewState('FORM');
  };

  const handleStartEdit = (addr: UserAddress) => {
    setFormData({
      id: addr._id,
      fullName: addr.fullName,
      phone: addr.phone,
      houseFlat: addr.houseFlat,
      apartmentStreet: addr.apartmentStreet,
      areaLocality: addr.areaLocality,
      landmark: addr.landmark || '',
      city: addr.city,
      state: addr.state,
      pincode: addr.pincode,
      addressType: addr.addressType,
      deliveryInstructions: addr.deliveryInstructions || '',
      isDefault: addr.isDefault,
    });
    setServiceability(null);
    setPincodeError(null);
    setViewState('FORM');
  };

  const handleDelete = async (addressId: string) => {
    if (!token) return;
    if (!window.confirm('Are you sure you want to delete this address?')) return;

    try {
      const res = await authFetch(`${API_BASE}/addresses/${addressId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchAddresses();
      } else {
        const data = await res.json();
        alert(data.error?.message || 'Could not delete address');
      }
    } catch {
      alert('Network error while deleting address');
    }
  };

  const handleSetDefault = async (address: UserAddress) => {
    if (!token) return;
    try {
      const res = await authFetch(`${API_BASE}/addresses/${address._id}/default`, {
        method: 'POST',
      });
      if (res.ok) {
        if (onSelectAddress) {
          onSelectAddress({ ...address, isDefault: true });
        }
        fetchAddresses();
      }
    } catch {
      alert('Error updating default address');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (!formData.fullName.trim() || !formData.phone.trim() || !formData.houseFlat.trim() || !formData.apartmentStreet.trim() || !formData.pincode.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    if (!/^[1-9][0-9]{5}$/.test(formData.pincode.trim())) {
      setError('Please provide a valid 6-digit Indian PIN code');
      return;
    }

    setIsSaving(true);
    setError(null);

    const payload = {
      fullName: formData.fullName.trim(),
      phone: formData.phone.trim(),
      houseFlat: formData.houseFlat.trim(),
      apartmentStreet: formData.apartmentStreet.trim(),
      areaLocality: formData.areaLocality.trim(),
      landmark: formData.landmark.trim(),
      city: formData.city.trim(),
      state: formData.state.trim(),
      pincode: formData.pincode.trim(),
      addressType: formData.addressType,
      deliveryInstructions: formData.deliveryInstructions.trim(),
      isDefault: formData.isDefault,
    };

    try {
      const url = formData.id
        ? `${API_BASE}/addresses/${formData.id}`
        : `${API_BASE}/addresses`;
      const method = formData.id ? 'PUT' : 'POST';

      const res = await authFetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        if (onSelectAddress && (data.data.isDefault || addresses.length === 0)) {
          onSelectAddress(data.data);
        }
        setViewState('LIST');
        fetchAddresses();
      } else {
        setError(data.error?.message || 'Failed to save address');
      }
    } catch {
      setError('Network error saving address');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="address-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div className="bg-paper dark:bg-card border border-brd rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-brd bg-card-top/50">
          <div className="flex items-center gap-2">
            {viewState === 'FORM' && (
              <button
                type="button"
                onClick={() => setViewState('LIST')}
                className="p-1 rounded-lg text-mut hover:text-ink hover:bg-paper/50 transition-colors"
                title="Back to saved addresses"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <MapPin className="w-5 h-5 text-acc" />
            <h2 id="address-modal-title" className="text-base font-semibold text-ink">
              {viewState === 'LIST' ? 'Select Delivery Address' : formData.id ? 'Edit Address' : 'Add New Address'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-mut hover:text-ink hover:bg-paper/80 transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto flex-1">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 text-rose-600 dark:text-rose-400 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {viewState === 'LIST' ? (
            <div className="space-y-4">
              {/* Add New Button */}
              <button
                type="button"
                onClick={handleStartAdd}
                className="w-full flex items-center justify-center gap-2 p-3.5 border-2 border-dashed border-acc/40 hover:border-acc text-acc hover:bg-acc/5 rounded-xl font-medium text-sm transition-all"
              >
                <Plus className="w-4 h-4" />
                Add New Delivery Address
              </button>

              {isLoading ? (
                <div className="py-12 flex flex-col items-center justify-center gap-2 text-mut">
                  <Loader2 className="w-6 h-6 animate-spin text-acc" />
                  <span className="text-xs">Loading saved addresses...</span>
                </div>
              ) : addresses.length === 0 ? (
                <div className="py-10 text-center text-mut text-sm">
                  <Navigation className="w-10 h-10 mx-auto mb-2 opacity-40 text-acc" />
                  <p className="font-medium text-ink">No addresses saved yet</p>
                  <p className="text-xs mt-1">Add your home or office address for fast 15-30 min delivery.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {addresses.map((addr) => {
                    const isSelected = selectedAddressId === addr._id || (!selectedAddressId && addr.isDefault);
                    return (
                      <div
                        key={addr._id}
                        className={`p-4 rounded-xl border transition-all relative ${
                          isSelected
                            ? 'border-acc bg-acc/5 shadow-xs ring-1 ring-acc/30'
                            : 'border-brd bg-paper hover:border-brd-strong'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2">
                            {addr.addressType === 'HOME' ? (
                              <Home className="w-4 h-4 text-acc" />
                            ) : addr.addressType === 'WORK' ? (
                              <Briefcase className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <MapPin className="w-4 h-4 text-mut" />
                            )}
                            <span className="font-semibold text-sm text-ink capitalize">
                              {addr.addressType.toLowerCase()}
                            </span>
                            {addr.isDefault && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-acc/10 text-acc border border-acc/20">
                                Default
                              </span>
                            )}
                            {addr.isServiceable ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                                <Clock className="w-2.5 h-2.5" />
                                15-20 min
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/10 text-amber-600 border border-amber-500/20">
                                Standard zone
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleStartEdit(addr)}
                              className="p-1.5 text-mut hover:text-ink hover:bg-card-top rounded-lg transition-colors"
                              title="Edit address"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(addr._id)}
                              className="p-1.5 text-mut hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition-colors"
                              title="Delete address"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Address Details */}
                        <div className="mt-2 text-xs text-ink/80 space-y-0.5">
                          <p className="font-medium text-ink">
                            {addr.fullName} · {addr.phone}
                          </p>
                          <p>
                            {addr.houseFlat}, {addr.apartmentStreet}
                          </p>
                          <p>
                            {addr.areaLocality ? `${addr.areaLocality}, ` : ''}
                            {addr.city}, {addr.state} - {addr.pincode}
                          </p>
                          {addr.landmark && (
                            <p className="text-mut text-[11px]">Landmark: {addr.landmark}</p>
                          )}
                          {addr.deliveryInstructions && (
                            <p className="text-mut text-[11px] italic">
                              Instructions: "{addr.deliveryInstructions}"
                            </p>
                          )}
                        </div>

                        {/* Select / Default Trigger */}
                        <div className="mt-3 pt-3 border-t border-brd/50 flex items-center justify-between">
                          {!addr.isDefault && (
                            <button
                              type="button"
                              onClick={() => handleSetDefault(addr)}
                              className="text-[11px] text-mut hover:text-acc font-medium transition-colors cursor-pointer"
                            >
                              Set as default
                            </button>
                          )}
                          {addr.isDefault && <div />}

                          <button
                            type="button"
                            onClick={() => {
                              if (onSelectAddress) onSelectAddress(addr);
                              onClose();
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                              isSelected
                                ? 'bg-acc text-paper dark:text-ink shadow-xs'
                                : 'bg-card-top hover:bg-acc/10 text-ink border border-brd'
                            }`}
                          >
                            {isSelected ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                Delivering Here
                              </>
                            ) : (
                              'Deliver to this address'
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-4">
              {/* Address Type Selector */}
              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5">Address Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['HOME', 'WORK', 'OTHER'] as AddressType[]).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setFormData({ ...formData, addressType: type })}
                      className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-medium transition-all ${
                        formData.addressType === type
                          ? 'border-acc bg-acc/10 text-acc font-semibold ring-1 ring-acc/30'
                          : 'border-brd bg-card hover:bg-card-top text-ink'
                      }`}
                    >
                      {type === 'HOME' ? (
                        <Home className="w-3.5 h-3.5" />
                      ) : type === 'WORK' ? (
                        <Briefcase className="w-3.5 h-3.5" />
                      ) : (
                        <MapPin className="w-3.5 h-3.5" />
                      )}
                      <span className="capitalize">{type.toLowerCase()}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Recipient Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">
                    Recipient Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="e.g. Priya Sharma"
                    className="w-full px-3 py-2 bg-card border border-brd rounded-xl text-xs text-ink placeholder:text-mut focus:outline-hidden focus:border-acc focus:ring-1 focus:ring-acc"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">
                    Phone Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full px-3 py-2 bg-card border border-brd rounded-xl text-xs text-ink placeholder:text-mut focus:outline-hidden focus:border-acc focus:ring-1 focus:ring-acc"
                  />
                </div>
              </div>

              {/* Pincode with Live Verification */}
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  6-Digit Postal Code (PIN) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    maxLength={6}
                    required
                    value={formData.pincode}
                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value.replace(/\D/g, '') })}
                    placeholder="e.g. 560103"
                    className="w-full px-3 py-2 bg-card border border-brd rounded-xl text-xs font-mono text-ink placeholder:text-mut focus:outline-hidden focus:border-acc focus:ring-1 focus:ring-acc"
                  />
                  {isCheckingPincode && (
                    <div className="absolute right-3 top-2.5">
                      <Loader2 className="w-4 h-4 animate-spin text-acc" />
                    </div>
                  )}
                </div>

                {/* Serviceability feedback chip */}
                {serviceability && (
                  <div className={`mt-2 p-2 rounded-lg text-xs flex items-center gap-1.5 ${
                    serviceability.isServiceable
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                  }`}>
                    {serviceability.isServiceable ? (
                      <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    )}
                    <span>{serviceability.message}</span>
                  </div>
                )}
                {pincodeError && (
                  <p className="mt-1 text-[11px] text-rose-500">{pincodeError}</p>
                )}
              </div>

              {/* Address Lines */}
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Flat / House / Floor / Building <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.houseFlat}
                  onChange={(e) => setFormData({ ...formData, houseFlat: e.target.value })}
                  placeholder="e.g. Flat 402, Lotus Orchid Apartments"
                  className="w-full px-3 py-2 bg-card border border-brd rounded-xl text-xs text-ink placeholder:text-mut focus:outline-hidden focus:border-acc focus:ring-1 focus:ring-acc"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Street / Road / Society <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.apartmentStreet}
                  onChange={(e) => setFormData({ ...formData, apartmentStreet: e.target.value })}
                  placeholder="e.g. Green Glen Layout, Bellandur"
                  className="w-full px-3 py-2 bg-card border border-brd rounded-xl text-xs text-ink placeholder:text-mut focus:outline-hidden focus:border-acc focus:ring-1 focus:ring-acc"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Area / Locality</label>
                  <input
                    type="text"
                    value={formData.areaLocality}
                    onChange={(e) => setFormData({ ...formData, areaLocality: e.target.value })}
                    placeholder="e.g. Outer Ring Road"
                    className="w-full px-3 py-2 bg-card border border-brd rounded-xl text-xs text-ink placeholder:text-mut focus:outline-hidden focus:border-acc focus:ring-1 focus:ring-acc"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Nearby Landmark</label>
                  <input
                    type="text"
                    value={formData.landmark}
                    onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
                    placeholder="e.g. Opposite Central Mall"
                    className="w-full px-3 py-2 bg-card border border-brd rounded-xl text-xs text-ink placeholder:text-mut focus:outline-hidden focus:border-acc focus:ring-1 focus:ring-acc"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">City</label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3 py-2 bg-card border border-brd rounded-xl text-xs text-ink focus:outline-hidden focus:border-acc"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">State</label>
                  <input
                    type="text"
                    required
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full px-3 py-2 bg-card border border-brd rounded-xl text-xs text-ink focus:outline-hidden focus:border-acc"
                  />
                </div>
              </div>

              {/* Delivery Instructions */}
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Delivery Instructions (Optional)
                </label>
                <textarea
                  rows={2}
                  value={formData.deliveryInstructions}
                  onChange={(e) => setFormData({ ...formData, deliveryInstructions: e.target.value })}
                  placeholder="e.g. Leave with building security, do not ring doorbell"
                  className="w-full px-3 py-2 bg-card border border-brd rounded-xl text-xs text-ink placeholder:text-mut focus:outline-hidden focus:border-acc resize-none"
                />
              </div>

              {/* Set Default Toggle */}
              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={formData.isDefault}
                  onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                  className="w-4 h-4 rounded-sm border-brd text-acc focus:ring-acc"
                />
                <span className="text-xs font-medium text-ink">Make this my default delivery address</span>
              </label>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-brd flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setViewState('LIST')}
                  disabled={isSaving}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-mut hover:text-ink hover:bg-card-top transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-acc hover:bg-acc/90 text-paper dark:text-ink transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Address'
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
