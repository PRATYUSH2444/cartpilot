import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  X,
  MapPin,
  Home,
  Briefcase,
  Plus,
  Check,
  Trash2,
  Edit2,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ArrowLeft,
  Navigation,
  Search,
  Crosshair,
  Building,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { UserAddress, ServiceabilityInfo, AddressType } from '../../types';
import { API_BASE } from '../../config/api';
import { useAuth } from '../../context/AuthContext';
import { useLocation } from '../../context/LocationContext';

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
  latitude?: number;
  longitude?: number;
  isDefault: boolean;
}

const INITIAL_FORM: AddressFormData = {
  fullName: '',
  phone: '',
  houseFlat: '',
  apartmentStreet: '',
  areaLocality: '',
  landmark: '',
  city: 'Patna',
  state: 'Bihar',
  pincode: '800001',
  addressType: 'HOME',
  deliveryInstructions: '',
  isDefault: false,
};

interface AutocompleteSuggestion {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
  latitude?: number;
  longitude?: number;
}

export const AddressModal: React.FC<AddressModalProps> = ({
  isOpen,
  onClose,
  token,
  selectedAddressId,
  onSelectAddress,
}) => {
  const { authFetch, user } = useAuth();
  const {
    selectedAddress,
    savedAddresses,
    serviceability,
    detectCurrentLocation,
    isDetectingLocation,
    selectAddress,
    refreshAddresses,
  } = useLocation();

  const [addresses, setAddresses] = useState<UserAddress[]>(savedAddresses);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [viewState, setViewState] = useState<'LIST' | 'PIN_PREVIEW' | 'FORM'>('LIST');
  const [formData, setFormData] = useState<AddressFormData>(INITIAL_FORM);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Search & Autocomplete State
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<AutocompleteSuggestion[]>([]);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Pinned location for interactive preview
  const [pinnedLocation, setPinnedLocation] = useState<{
    lat: number;
    lng: number;
    formattedAddress: string;
    locality: string;
    city: string;
    state: string;
    pincode: string;
    serviceability?: ServiceabilityInfo | null;
  } | null>(null);

  // Live Pincode Serviceability Check state
  const [formServiceability, setFormServiceability] = useState<ServiceabilityInfo | null>(serviceability);
  const [isCheckingPincode, setIsCheckingPincode] = useState<boolean>(false);
  const [pincodeError, setPincodeError] = useState<string | null>(null);

  // Sync saved addresses
  const loadAddresses = useCallback(async () => {
    if (!token && !authFetch) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await authFetch(`${API_BASE}/addresses`);
      const data = await res.json();
      if (res.ok && data.success) {
        setAddresses(data.data || []);
      }
    } catch {
      setError('Unable to load saved addresses');
    } finally {
      setIsLoading(false);
    }
  }, [authFetch, token]);

  useEffect(() => {
    if (isOpen) {
      loadAddresses();
      setViewState('LIST');
      setSearchQuery('');
      setSuggestions([]);
      setError(null);
      setFormData(INITIAL_FORM);
    }
  }, [isOpen, loadAddresses]);

  // Debounced Place Autocomplete
  useEffect(() => {
    const query = searchQuery.trim();
    if (!query || query.length < 2) {
      setSuggestions([]);
      setIsSearching(false);
      return;
    }

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`${API_BASE}/location/autocomplete?q=${encodeURIComponent(query)}`);
        const json = await res.json();
        if (res.ok && json.success) {
          setSuggestions(json.data || []);
        }
      } catch (err) {
        console.warn('Autocomplete fetch failed:', err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchQuery]);

  // Handle GPS location detection click
  const handleUseCurrentLocation = async () => {
    setError(null);
    try {
      const detected = await detectCurrentLocation();
      if (detected) {
        // Transition directly to address details form with detected GPS locality pre-filled
        setFormData({
          ...INITIAL_FORM,
          fullName: user?.name || '',
          phone: user?.phone || '',
          houseFlat: detected.houseFlat && !detected.houseFlat.includes('Location') ? detected.houseFlat : '',
          apartmentStreet: detected.apartmentStreet || detected.areaLocality || '',
          areaLocality: detected.areaLocality || 'Patna',
          landmark: detected.landmark || '',
          city: detected.city || 'Patna',
          state: detected.state || 'Bihar',
          pincode: detected.pincode || '800001',
          latitude: detected.latitude,
          longitude: detected.longitude,
          isDefault: addresses.length === 0,
        });

        // Run serviceability check for coordinates
        if (detected.latitude && detected.longitude) {
          const servRes = await fetch(`${API_BASE}/location/serviceability`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              latitude: detected.latitude,
              longitude: detected.longitude,
              pincode: detected.pincode,
            }),
          });
          const servJson = await servRes.json();
          setFormServiceability(servJson.data || null);
        }

        setViewState('FORM');
      } else {
        setError('Could not detect location. Please search for your locality or building manually.');
      }
    } catch (err: any) {
      setError(err.message || 'Location access was denied or timed out');
    }
  };

  // Select place from autocomplete
  const handleSelectSuggestion = async (item: AutocompleteSuggestion) => {
    setSearchQuery('');
    setSuggestions([]);
    setIsLoading(true);

    try {
      let lat = item.latitude;
      let lng = item.longitude;
      let geoData: any = null;

      if (!lat || !lng) {
        // Geocode the selected place
        const geoRes = await fetch(`${API_BASE}/location/geocode?q=${encodeURIComponent(item.description)}`);
        const geoJson = await geoRes.json();
        if (geoJson.success && geoJson.data) {
          lat = geoJson.data.latitude;
          lng = geoJson.data.longitude;
          geoData = geoJson.data;
        }
      }

      if (lat && lng) {
        if (!geoData) {
          const revRes = await fetch(`${API_BASE}/location/reverse-geocode?lat=${lat}&lng=${lng}`);
          const revJson = await revRes.json();
          geoData = revJson.data || {};
        }

        // Check serviceability for coordinates
        const servRes = await fetch(`${API_BASE}/location/serviceability`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ latitude: lat, longitude: lng, pincode: geoData.pincode }),
        });
        const servJson = await servRes.json();
        const serv = servJson.data || null;

        // Transition directly to address details form with selected location
        setFormData({
          ...INITIAL_FORM,
          fullName: user?.name || '',
          phone: user?.phone || '',
          houseFlat: '',
          apartmentStreet: item.mainText || geoData.street || geoData.locality || '',
          areaLocality: geoData.locality || item.mainText || 'Patna',
          landmark: '',
          city: geoData.city || 'Patna',
          state: geoData.state || 'Bihar',
          pincode: geoData.pincode || '800001',
          latitude: lat,
          longitude: lng,
          isDefault: addresses.length === 0,
        });

        setPinnedLocation({
          lat,
          lng,
          formattedAddress: item.description || geoData.formattedAddress,
          locality: geoData.locality || item.mainText,
          city: geoData.city || 'Patna',
          state: geoData.state || 'Bihar',
          pincode: geoData.pincode || '800001',
          serviceability: serv,
        });

        setFormServiceability(serv);
        setViewState('FORM');
      } else {
        setError('Could not pinpoint selected location. Please enter details manually.');
      }
    } catch {
      setError('Error resolving place coordinates');
    } finally {
      setIsLoading(false);
    }
  };

  // Confirm pinned location into Form view
  const handleConfirmPinnedLocation = () => {
    if (!pinnedLocation) return;

    setFormData({
      ...INITIAL_FORM,
      fullName: user?.name || '',
      phone: user?.phone || '',
      houseFlat: '',
      apartmentStreet: pinnedLocation.locality || pinnedLocation.formattedAddress.split(',')[0] || '',
      areaLocality: pinnedLocation.locality || 'Patna',
      city: pinnedLocation.city || 'Patna',
      state: pinnedLocation.state || 'Bihar',
      pincode: pinnedLocation.pincode || '800001',
      latitude: pinnedLocation.lat,
      longitude: pinnedLocation.lng,
      isDefault: addresses.length === 0,
    });
    setFormServiceability(pinnedLocation.serviceability || null);
    setViewState('FORM');
  };

  // Debounced check for pincode serviceability in form
  useEffect(() => {
    if (viewState !== 'FORM') return;
    const cleanPin = formData.pincode.trim();
    if (!/^[1-9][0-9]{5}$/.test(cleanPin)) {
      setFormServiceability(null);
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
        const res = await fetch(`${API_BASE}/location/serviceability`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pincode: cleanPin,
            latitude: formData.latitude,
            longitude: formData.longitude,
          }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setFormServiceability(data.data);
        } else {
          setPincodeError(data.error?.message || 'Unable to verify pincode');
        }
      } catch {
        setPincodeError('Network error checking serviceability');
      } finally {
        setIsCheckingPincode(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [formData.pincode, formData.latitude, formData.longitude, viewState]);

  const handleStartAdd = () => {
    setFormData({
      ...INITIAL_FORM,
      fullName: user?.name || '',
      phone: user?.phone || '',
      isDefault: addresses.length === 0,
    });
    setFormServiceability(null);
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
      latitude: addr.latitude,
      longitude: addr.longitude,
      isDefault: addr.isDefault,
    });
    setFormServiceability(null);
    setPincodeError(null);
    setViewState('FORM');
  };

  const handleDelete = async (addressId: string) => {
    if (!token && !authFetch) return;
    if (!window.confirm('Are you sure you want to delete this address?')) return;

    try {
      const res = await authFetch(`${API_BASE}/addresses/${addressId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        await loadAddresses();
        await refreshAddresses();
      } else {
        const data = await res.json();
        alert(data.error?.message || 'Could not delete address');
      }
    } catch {
      alert('Network error while deleting address');
    }
  };

  const handleSetDefault = async (address: UserAddress) => {
    if (!token && !authFetch) return;
    try {
      const res = await authFetch(`${API_BASE}/addresses/${address._id}/default`, {
        method: 'POST',
      });
      if (res.ok) {
        if (onSelectAddress) {
          onSelectAddress({ ...address, isDefault: true });
        }
        await selectAddress({ ...address, isDefault: true });
        await loadAddresses();
        await refreshAddresses();
      }
    } catch {
      alert('Error updating default address');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.houseFlat.trim() ||
      !formData.apartmentStreet.trim() ||
      !formData.pincode.trim()
    ) {
      setError('Please fill in your flat/house number and street name');
      return;
    }

    if (!/^[1-9][0-9]{5}$/.test(formData.pincode.trim())) {
      setError('Please provide a valid 6-digit Indian PIN code');
      return;
    }

    setIsSaving(true);
    setError(null);

    const payload = {
      fullName: (formData.fullName || user?.name || 'Customer').trim(),
      phone: (formData.phone || user?.phone || '9999999999').trim(),
      houseFlat: formData.houseFlat.trim(),
      apartmentStreet: formData.apartmentStreet.trim(),
      areaLocality: (formData.areaLocality || 'Patna').trim(),
      landmark: formData.landmark.trim(),
      city: (formData.city || 'Patna').trim(),
      state: (formData.state || 'Bihar').trim(),
      pincode: (formData.pincode || '800001').trim(),
      addressType: formData.addressType,
      deliveryInstructions: formData.deliveryInstructions.trim(),
      latitude: formData.latitude,
      longitude: formData.longitude,
      isDefault: formData.isDefault || addresses.length === 0,
    };

    // Guest / non-logged in flow: Save to local state and storage
    if (!token || !authFetch) {
      const localAddress: UserAddress = {
        _id: formData.id || `local_${Date.now()}`,
        userId: 'guest',
        ...payload,
        isServiceable: formServiceability?.isServiceable ?? true,
      };

      const updated = [localAddress, ...addresses.filter((a) => a._id !== localAddress._id)];
      setAddresses(updated);
      try {
        localStorage.setItem('cartpilot_saved_addresses', JSON.stringify(updated));
      } catch {}

      if (onSelectAddress) {
        onSelectAddress(localAddress);
      }
      await selectAddress(localAddress);
      setIsSaving(false);
      onClose();
      return;
    }

    // Authenticated user API flow
    try {
      const url = formData.id ? `${API_BASE}/addresses/${formData.id}` : `${API_BASE}/addresses`;
      const method = formData.id ? 'PUT' : 'POST';

      const res = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        const saved: UserAddress = data.data;
        if (onSelectAddress) {
          onSelectAddress(saved);
        }
        await selectAddress(saved);
        await loadAddresses();
        await refreshAddresses();
        onClose();
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
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/60 backdrop-blur-sm animate-in fade-in duration-150"
    >
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-850/70">
          <div className="flex items-center gap-2.5">
            {viewState !== 'LIST' && (
              <button
                type="button"
                onClick={() => setViewState('LIST')}
                className="p-1 rounded-xl text-stone-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-200/60 dark:hover:bg-stone-800 transition-colors"
                title="Back to saved addresses"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
              <MapPin className="w-4.5 h-4.5" />
            </div>
            <div>
              <h2 id="address-modal-title" className="text-base font-extrabold text-stone-900 dark:text-white tracking-tight">
                {viewState === 'LIST'
                  ? 'Select Delivery Location'
                  : viewState === 'PIN_PREVIEW'
                  ? 'Confirm Location Pin'
                  : formData.id
                  ? 'Edit Delivery Address'
                  : 'Add Address Details'}
              </h2>
              <p className="text-[11px] text-stone-500 font-medium">
                {viewState === 'LIST'
                  ? 'Serving Patna, Bihar • Morning & Evening Delivery Slots'
                  : viewState === 'PIN_PREVIEW'
                  ? 'Review pin coordinates and Patna serviceability'
                  : 'Enter complete house & floor details'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          {/* VIEW: MAIN LIST & LOCATION SELECTION */}
          {viewState === 'LIST' && (
            <div className="space-y-4">
              {/* 1. Instant Search Autocomplete Input */}
              <div className="relative">
                <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search area, apartment, street or landmark…"
                  className="w-full pl-10 pr-10 py-3 rounded-2xl bg-stone-50 dark:bg-stone-850 border border-stone-200 dark:border-stone-750 text-xs font-semibold text-stone-900 dark:text-white placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all shadow-inner"
                />
                {isSearching && (
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                    <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" />
                  </div>
                )}
                {searchQuery && !isSearching && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setSuggestions([]);
                    }}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Autocomplete Dropdown List */}
              {suggestions.length > 0 && (
                <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-xl overflow-hidden divide-y divide-stone-100 dark:divide-stone-800">
                  {suggestions.map((item) => (
                    <button
                      key={item.placeId}
                      type="button"
                      onClick={() => handleSelectSuggestion(item)}
                      className="w-full p-3 text-left hover:bg-stone-50 dark:hover:bg-stone-800/80 transition-colors flex items-start gap-3 group cursor-pointer"
                    >
                      <div className="p-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-500 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors mt-0.5">
                        <Building className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-stone-900 dark:text-white truncate">
                          {item.mainText}
                        </p>
                        <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate mt-0.5">
                          {item.secondaryText || item.description}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-stone-300 dark:text-stone-600 group-hover:text-emerald-600 transition-colors my-auto" />
                    </button>
                  ))}
                </div>
              )}

              {/* 2. Primary Action: One-Tap GPS Current Location */}
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                disabled={isDetectingLocation}
                className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-700/20 active:scale-[0.99] transition-all flex items-center justify-between group cursor-pointer disabled:opacity-60"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center">
                    {isDetectingLocation ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Crosshair className="w-5 h-5 text-white animate-pulse" />
                    )}
                  </div>
                  <div className="text-left">
                    <span className="text-xs font-black block tracking-tight">
                      {isDetectingLocation ? 'Detecting Precise GPS Location…' : 'Use Current Location'}
                    </span>
                    <span className="text-[11px] text-emerald-100 font-medium block">
                      Using device GPS • Accurate pin location in Patna
                    </span>
                  </div>
                </div>
                <div className="px-2.5 py-1 rounded-full bg-white/20 text-[10px] font-black uppercase tracking-wider">
                  GPS
                </div>
              </button>

              {/* 3. Divider: Saved Delivery Addresses */}
              <div className="pt-2 flex items-center justify-between">
                <span className="text-xs font-extrabold text-stone-900 dark:text-white uppercase tracking-wider">
                  Saved Addresses ({addresses.length})
                </span>
                <button
                  type="button"
                  onClick={handleStartAdd}
                  className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add New</span>
                </button>
              </div>

              {isLoading ? (
                <div className="py-10 flex flex-col items-center justify-center gap-2 text-stone-400">
                  <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
                  <span className="text-xs font-medium">Checking saved locations…</span>
                </div>
              ) : addresses.length === 0 ? (
                <div className="py-8 text-center text-stone-400 border border-dashed border-stone-200 dark:border-stone-800 rounded-3xl p-6 bg-stone-50/50 dark:bg-stone-850/50">
                  <Navigation className="w-10 h-10 mx-auto mb-2 text-emerald-600/40" />
                  <p className="font-bold text-xs text-stone-900 dark:text-white">No saved addresses yet</p>
                  <p className="text-[11px] text-stone-500 mt-1">
                    Use your current location above or tap Add New to save your home address in Patna.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {addresses.map((addr) => {
                    const isSelected =
                      selectedAddressId === addr._id ||
                      (!selectedAddressId && selectedAddress?._id === addr._id) ||
                      (!selectedAddressId && addr.isDefault);

                    return (
                      <div
                        key={addr._id}
                        className={`p-4 rounded-3xl border transition-all relative ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/30 shadow-md ring-2 ring-emerald-500/20'
                            : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-850 hover:border-stone-300'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="w-7 h-7 rounded-xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-bold">
                              {addr.addressType === 'HOME' ? (
                                <Home className="w-3.5 h-3.5" />
                              ) : addr.addressType === 'WORK' ? (
                                <Briefcase className="w-3.5 h-3.5" />
                              ) : (
                                <MapPin className="w-3.5 h-3.5" />
                              )}
                            </div>
                            <span className="font-extrabold text-xs text-stone-900 dark:text-white capitalize">
                              {addr.addressType.toLowerCase()}
                            </span>
                            {addr.isDefault && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                                Default
                              </span>
                            )}
                            {addr.isServiceable ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                                <Check className="w-2.5 h-2.5" />
                                Next-Day Slot
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/10 text-amber-600 border border-amber-500/20 flex items-center gap-1">
                                <ShieldAlert className="w-2.5 h-2.5" />
                                Outside Patna
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleStartEdit(addr)}
                              className="p-1.5 text-stone-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl transition-colors cursor-pointer"
                              title="Edit address"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(addr._id)}
                              className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-colors cursor-pointer"
                              title="Delete address"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Address Details */}
                        <div className="mt-2.5 text-xs text-stone-600 dark:text-stone-300 space-y-0.5">
                          <p className="font-bold text-stone-900 dark:text-white">
                            {addr.fullName} · {addr.phone}
                          </p>
                          <p className="leading-snug">
                            {addr.houseFlat}, {addr.apartmentStreet}
                          </p>
                          <p className="text-stone-500 dark:text-stone-400">
                            {addr.areaLocality ? `${addr.areaLocality}, ` : ''}
                            {addr.city}, {addr.state} — {addr.pincode}
                          </p>
                          {addr.latitude && addr.longitude && (
                            <p className="text-[10px] font-mono text-stone-400">
                              GPS: {addr.latitude.toFixed(4)}, {addr.longitude.toFixed(4)}
                            </p>
                          )}
                          {addr.landmark && (
                            <p className="text-stone-400 text-[11px]">Landmark: {addr.landmark}</p>
                          )}
                        </div>

                        {/* Deliver Here Action */}
                        <div className="mt-3 pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
                          {!addr.isDefault ? (
                            <button
                              type="button"
                              onClick={() => handleSetDefault(addr)}
                              className="text-[11px] text-stone-500 hover:text-emerald-700 font-bold transition-colors cursor-pointer"
                            >
                              Set as default
                            </button>
                          ) : (
                            <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                              <Check className="w-3 h-3" /> Default Address
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              selectAddress(addr);
                              if (onSelectAddress) onSelectAddress(addr);
                              onClose();
                            }}
                            className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-emerald-700 text-white shadow-xs'
                                : 'bg-stone-100 dark:bg-stone-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-stone-800 dark:text-stone-200'
                            }`}
                          >
                            {isSelected ? (
                              <>
                                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
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
          )}

          {/* VIEW: PIN & SERVICEABILITY PREVIEW */}
          {viewState === 'PIN_PREVIEW' && pinnedLocation && (
            <div className="space-y-4">
              {/* Visual Map/Pin Radar Card */}
              <div className="relative rounded-3xl bg-gradient-to-br from-stone-900 via-stone-900 to-stone-950 p-5 border border-stone-800 shadow-xl overflow-hidden text-white">
                <div className="absolute right-0 top-0 w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

                <div className="flex items-center gap-3 relative z-10">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner">
                    <Crosshair className="w-6 h-6 animate-pulse" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 block">
                      Target Delivery Point
                    </span>
                    <h3 className="font-extrabold text-sm truncate">{pinnedLocation.locality}</h3>
                    <p className="text-[11px] text-stone-400 font-mono mt-0.5">
                      {pinnedLocation.lat.toFixed(5)}, {pinnedLocation.lng.toFixed(5)}
                    </p>
                  </div>
                </div>

                {/* Serviceability Banner */}
                <div className="mt-4 pt-3 border-t border-stone-800/80">
                  {pinnedLocation.serviceability?.isServiceable ? (
                    <div className="flex items-center justify-between text-xs font-bold text-emerald-400">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Serviceable in Patna (Next-Day Slot)</span>
                      </div>
                      <span className="font-mono text-white">
                        {pinnedLocation.serviceability.distanceKm} km from hub
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between text-xs font-bold text-amber-400">
                      <div className="flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4 text-amber-400" />
                        <span>Outside Patna Delivery Radius</span>
                      </div>
                      <span className="font-mono text-white">
                        {pinnedLocation.serviceability?.distanceKm} km
                      </span>
                    </div>
                  )}
                  <p className="text-[11px] text-stone-400 mt-1">
                    {pinnedLocation.serviceability?.message || pinnedLocation.formattedAddress}
                  </p>
                </div>
              </div>

              {/* Confirm & Proceed Button */}
              <button
                type="button"
                onClick={handleConfirmPinnedLocation}
                className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-700/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Enter Complete House & Floor Details</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* VIEW: ADD / EDIT ADDRESS FORM */}
          {viewState === 'FORM' && (
            <form onSubmit={handleSave} className="space-y-4">
              {/* Address Type Selector */}
              <div>
                <label className="block text-xs font-bold text-stone-900 dark:text-white mb-1.5">
                  Save Address As
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['HOME', 'WORK', 'OTHER'] as AddressType[]).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setFormData({ ...formData, addressType: type })}
                      className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-2xl border text-xs font-black transition-all cursor-pointer ${
                        formData.addressType === type
                          ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/20'
                          : 'border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-850 text-stone-700 dark:text-stone-300'
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

              {/* Recipient Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-900 dark:text-white mb-1">
                    Receiver's Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="e.g. Priya Sharma"
                    className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-850 border border-stone-200 dark:border-stone-750 rounded-2xl text-xs font-bold text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-900 dark:text-white mb-1">
                    Phone Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-850 border border-stone-200 dark:border-stone-750 rounded-2xl text-xs font-bold text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Pincode with Live Verification */}
              <div>
                <label className="block text-xs font-bold text-stone-900 dark:text-white mb-1">
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
                    className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-850 border border-stone-200 dark:border-stone-750 rounded-2xl text-xs font-mono font-bold text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  />
                  {isCheckingPincode && (
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                      <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                    </div>
                  )}
                </div>

                {/* Serviceability feedback chip */}
                {formServiceability && (
                  <div
                    className={`mt-2 p-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 ${
                      formServiceability.isServiceable
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                        : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                    }`}
                  >
                    {formServiceability.isServiceable ? (
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
                    ) : (
                      <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-600" />
                    )}
                    <span>{formServiceability.message}</span>
                  </div>
                )}
                {pincodeError && <p className="mt-1 text-[11px] text-rose-500 font-semibold">{pincodeError}</p>}
              </div>

              {/* Address Lines */}
              <div>
                <label className="block text-xs font-bold text-stone-900 dark:text-white mb-1">
                  Flat / House / Floor / Building <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.houseFlat}
                  onChange={(e) => setFormData({ ...formData, houseFlat: e.target.value })}
                  placeholder="e.g. Flat 402, Lotus Orchid Apartments"
                  className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-850 border border-stone-200 dark:border-stone-750 rounded-2xl text-xs font-bold text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-900 dark:text-white mb-1">
                  Street / Road / Society <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.apartmentStreet}
                  onChange={(e) => setFormData({ ...formData, apartmentStreet: e.target.value })}
                  placeholder="e.g. Green Glen Layout, Bellandur"
                  className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-850 border border-stone-200 dark:border-stone-750 rounded-2xl text-xs font-bold text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-900 dark:text-white mb-1">Area / Locality</label>
                  <input
                    type="text"
                    value={formData.areaLocality}
                    onChange={(e) => setFormData({ ...formData, areaLocality: e.target.value })}
                    placeholder="e.g. Outer Ring Road"
                    className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-850 border border-stone-200 dark:border-stone-750 rounded-2xl text-xs font-bold text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-900 dark:text-white mb-1">Nearby Landmark</label>
                  <input
                    type="text"
                    value={formData.landmark}
                    onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
                    placeholder="e.g. Opposite Central Mall"
                    className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-850 border border-stone-200 dark:border-stone-750 rounded-2xl text-xs font-bold text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-900 dark:text-white mb-1">City</label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-850 border border-stone-200 dark:border-stone-750 rounded-2xl text-xs font-bold text-stone-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-900 dark:text-white mb-1">State</label>
                  <input
                    type="text"
                    required
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-850 border border-stone-200 dark:border-stone-750 rounded-2xl text-xs font-bold text-stone-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Set Default Toggle */}
              <label className="flex items-center gap-2.5 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={formData.isDefault}
                  onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                  className="w-4 h-4 rounded-md border-stone-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-xs font-bold text-stone-800 dark:text-stone-200">
                  Make this my default delivery address
                </span>
              </label>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setViewState('LIST')}
                  disabled={isSaving}
                  className="px-4 py-2.5 rounded-2xl text-xs font-bold text-stone-500 hover:text-stone-900 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 rounded-2xl text-xs font-extrabold bg-emerald-700 hover:bg-emerald-600 text-white transition-all flex items-center gap-2 shadow-md disabled:opacity-50 cursor-pointer"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving Address…</span>
                    </>
                  ) : (
                    <span>Save Address</span>
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
