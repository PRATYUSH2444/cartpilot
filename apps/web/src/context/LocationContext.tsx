import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { UserAddress, ServiceabilityInfo, LocalityLabelInfo } from '../types';
import { API_BASE } from '../config/api';
import { useAuth } from './AuthContext';
import { LocationService } from '../services/LocationService';

interface Coordinates {
  latitude: number;
  longitude: number;
}

export type LocationPermissionState = 'prompt' | 'granted' | 'denied' | 'unavailable';

export interface LocationContextType {
  currentLocation: LocalityLabelInfo | null;
  currentCoordinates: Coordinates | null;
  selectedAddress: UserAddress | null;
  savedAddresses: UserAddress[];
  serviceability: ServiceabilityInfo | null;
  isDetectingLocation: boolean;
  gpsAccuracyM: number | null;
  locationError: string | null;
  locationPermission: LocationPermissionState;
  isAddressModalOpen: boolean;
  isCelebrationBannerVisible: boolean;
  dismissCelebrationBanner: () => void;
  openAddressModal: () => void;
  closeAddressModal: () => void;
  detectCurrentLocation: () => Promise<UserAddress | null>;
  selectAddress: (address: UserAddress) => Promise<void>;
  setManualLocation: (latOrPin: number | string, lng?: number, addressInfo?: Partial<UserAddress>) => Promise<UserAddress | null>;
  joinWaitlist: (email: string, phone?: string, consent?: boolean) => Promise<{ success: boolean; message: string; waitlistCount: number }>;
  refreshAddresses: () => Promise<void>;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

const STORAGE_KEY = 'cartpilot_selected_address';
const COORDS_KEY = 'cartpilot_current_coords';
const SAVED_ADDRS_KEY = 'cartpilot_saved_addresses';
const CURRENT_LOC_KEY = 'cartpilot_current_locality';

export const LocationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { authFetch, token, user } = useAuth();

  const [currentCoordinates, setCurrentCoordinates] = useState<Coordinates | null>(() => {
    try {
      const stored = localStorage.getItem(COORDS_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [currentLocation, setCurrentLocation] = useState<LocalityLabelInfo | null>(() => {
    try {
      const stored = localStorage.getItem(CURRENT_LOC_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [selectedAddress, setSelectedAddress] = useState<UserAddress | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [savedAddresses, setSavedAddresses] = useState<UserAddress[]>(() => {
    try {
      const local = localStorage.getItem(SAVED_ADDRS_KEY);
      return local ? JSON.parse(local) : [];
    } catch {
      return [];
    }
  });

  const [serviceability, setServiceability] = useState<ServiceabilityInfo | null>(null);
  const [isDetectingLocation, setIsDetectingLocation] = useState<boolean>(false);
  const [gpsAccuracyM, setGpsAccuracyM] = useState<number | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationPermission, setLocationPermission] = useState<LocationPermissionState>('prompt');
  const [isAddressModalOpen, setIsAddressModalOpen] = useState<boolean>(false);
  const [isCelebrationBannerVisible, setIsCelebrationBannerVisible] = useState<boolean>(false);

  // Check serviceability directly against backend resolve endpoint
  const checkServiceability = useCallback(async (lat?: number, lng?: number, pincode?: string) => {
    try {
      const resolved = await LocationService.resolveLocation({
        lat,
        lng,
        pincode,
        source: lat && lng ? 'gps' : 'manual',
      });

      setServiceability(resolved.serviceability);
      if (resolved.location) {
        setCurrentLocation(resolved.location);
        localStorage.setItem(CURRENT_LOC_KEY, JSON.stringify(resolved.location));
      }
      return resolved.serviceability;
    } catch (e: any) {
      console.warn('Serviceability resolve failed:', e);
      return null;
    }
  }, []);

  // Fetch saved addresses from server if authenticated
  const refreshAddresses = useCallback(async () => {
    if (!token || !user || !authFetch) {
      try {
        const local = localStorage.getItem(SAVED_ADDRS_KEY);
        if (local) setSavedAddresses(JSON.parse(local));
      } catch {}
      return;
    }

    try {
      const res = await authFetch(`${API_BASE}/addresses`);
      if (res.ok) {
        const data = await res.json();
        const addrs: UserAddress[] = data.data || [];
        setSavedAddresses(addrs);
        try {
          localStorage.setItem(SAVED_ADDRS_KEY, JSON.stringify(addrs));
        } catch {}

        if (!selectedAddress && addrs.length > 0) {
          const def = addrs.find((a) => a.isDefault) || addrs[0];
          if (def) {
            setSelectedAddress(def);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(def));
            checkServiceability(def.latitude, def.longitude, def.pincode);
          }
        }
      }
    } catch {
      // Quiet fallback
    }
  }, [authFetch, token, user, selectedAddress, checkServiceability]);

  /**
   * Refined live browser geolocation using multi-sample watchPosition
   */
  const detectCurrentLocation = useCallback(async (): Promise<UserAddress | null> => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setLocationPermission('unavailable');
      setLocationError('Geolocation is not supported by your browser');
      return null;
    }

    setIsDetectingLocation(true);
    setLocationError(null);

    try {
      // 1. Collect refined multi-sample GPS readings
      const sample = await LocationService.getRefinedCoordinates((acc) => {
        setGpsAccuracyM(Math.round(acc));
      });

      const lat = sample.latitude;
      const lng = sample.longitude;
      const coords = { latitude: lat, longitude: lng };

      setCurrentCoordinates(coords);
      setGpsAccuracyM(Math.round(sample.accuracyM));
      setLocationPermission('granted');
      localStorage.setItem(COORDS_KEY, JSON.stringify(coords));

      // 2. Resolve via live API with clean locality label builder
      const resolved = await LocationService.resolveLocation({
        lat,
        lng,
        accuracyM: sample.accuracyM,
        source: 'gps',
      });

      const loc = resolved.location;
      const serv = resolved.serviceability;

      setCurrentLocation(loc);
      setServiceability(serv);
      localStorage.setItem(CURRENT_LOC_KEY, JSON.stringify(loc));

      // 3. Assemble unified user address object
      const detectedAddress: UserAddress = {
        _id: `gps_${Date.now()}`,
        userId: user?.id || 'guest',
        fullName: user?.name || 'Customer',
        phone: user?.phone || '',
        houseFlat: loc.locality || 'Detected Location',
        apartmentStreet: loc.label,
        areaLocality: loc.locality,
        landmark: '',
        city: loc.city,
        state: loc.state,
        pincode: loc.pincode,
        addressType: 'HOME',
        latitude: lat,
        longitude: lng,
        isDefault: true,
        isServiceable: serv.isServiceable,
      };

      setSelectedAddress(detectedAddress);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(detectedAddress));
      setIsDetectingLocation(false);
      return detectedAddress;
    } catch (err: any) {
      setIsDetectingLocation(false);
      if (err.code === 1) {
        setLocationPermission('denied');
        setLocationError('Location permission denied. Please enter your PIN or locality manually.');
      } else {
        setLocationError(err.message || 'Unable to retrieve precise GPS signal');
      }
      return null;
    }
  }, [user]);

  /**
   * Set manual location from search autocomplete or PIN code
   */
  const setManualLocation = useCallback(
    async (
      latOrPin: number | string,
      lng?: number,
      addressInfo?: Partial<UserAddress>
    ): Promise<UserAddress | null> => {
      setIsDetectingLocation(true);
      setLocationError(null);

      try {
        const isCoords = typeof latOrPin === 'number' && typeof lng === 'number';
        const resolved = await LocationService.resolveLocation({
          lat: isCoords ? (latOrPin as number) : undefined,
          lng: isCoords ? lng : undefined,
          pincode: !isCoords ? String(latOrPin).trim() : addressInfo?.pincode,
          source: 'manual',
        });

        const loc = resolved.location;
        const serv = resolved.serviceability;

        setCurrentLocation(loc);
        setServiceability(serv);
        localStorage.setItem(CURRENT_LOC_KEY, JSON.stringify(loc));

        if (loc.lat && loc.lng) {
          const coords = { latitude: loc.lat, longitude: loc.lng };
          setCurrentCoordinates(coords);
          localStorage.setItem(COORDS_KEY, JSON.stringify(coords));
        }

        const newAddr: UserAddress = {
          _id: addressInfo?._id || `manual_${Date.now()}`,
          userId: user?.id || 'guest',
          fullName: addressInfo?.fullName || user?.name || 'Customer',
          phone: addressInfo?.phone || user?.phone || '',
          houseFlat: addressInfo?.houseFlat || loc.locality,
          apartmentStreet: addressInfo?.apartmentStreet || loc.label,
          areaLocality: loc.locality,
          landmark: addressInfo?.landmark || '',
          city: loc.city,
          state: loc.state,
          pincode: loc.pincode,
          addressType: addressInfo?.addressType || 'HOME',
          latitude: loc.lat,
          longitude: loc.lng,
          isDefault: true,
          isServiceable: serv.isServiceable,
        };

        setSelectedAddress(newAddr);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newAddr));
        setIsDetectingLocation(false);
        return newAddr;
      } catch (err: any) {
        setIsDetectingLocation(false);
        setLocationError(err.message || 'Failed to resolve location');
        return null;
      }
    },
    [user]
  );

  /**
   * Select a saved address
   */
  const selectAddress = useCallback(
    async (addr: UserAddress) => {
      setSelectedAddress(addr);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(addr));

      if (addr.latitude && addr.longitude) {
        const coords = { latitude: addr.latitude, longitude: addr.longitude };
        setCurrentCoordinates(coords);
        localStorage.setItem(COORDS_KEY, JSON.stringify(coords));
        await checkServiceability(addr.latitude, addr.longitude, addr.pincode);
      } else if (addr.pincode) {
        await checkServiceability(undefined, undefined, addr.pincode);
      }
    },
    [checkServiceability]
  );

  /**
   * Join waitlist for unserviceable area
   */
  const joinWaitlist = useCallback(
    async (email: string, phone?: string, consent = true) => {
      if (!currentLocation && !selectedAddress) {
        throw new Error('Please select or detect your location first');
      }

      const pincode = currentLocation?.pincode || selectedAddress?.pincode || '';
      const locality = currentLocation?.locality || selectedAddress?.areaLocality || 'My Area';
      const city = currentLocation?.city || selectedAddress?.city || 'My City';
      const state = currentLocation?.state || selectedAddress?.state || 'My State';

      const res = await LocationService.joinWaitlist({
        email,
        phone,
        pincode,
        locality,
        city,
        state,
        consentTextVersion: consent ? 'v1.0' : undefined,
      });

      // Update waitlist count in state
      setServiceability((prev) =>
        prev ? { ...prev, waitlistCount: res.waitlistCount } : null
      );

      return res;
    },
    [currentLocation, selectedAddress]
  );

  // Real-time Serviceability updates via WebSocket
  useEffect(() => {
    let ws: WebSocket | null = null;
    try {
      const wsUrl = API_BASE.replace(/^http/, 'ws') + '/ws';
      ws = new WebSocket(wsUrl);

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (
            payload.event === 'location.serviceability.changed' ||
            payload.type === 'location.serviceability.changed'
          ) {
            const changedArea = payload.data?.area;
            const currentPin = currentLocation?.pincode || selectedAddress?.pincode;

            if (changedArea && changedArea.pincode === currentPin && changedArea.status === 'active') {
              setServiceability((prev) =>
                prev ? { ...prev, status: 'serviceable', isServiceable: true } : null
              );
              setIsCelebrationBannerVisible(true);
            }
          }
        } catch {}
      };
    } catch {}

    return () => {
      if (ws) ws.close();
    };
  }, [currentLocation, selectedAddress]);

  // Initial load
  useEffect(() => {
    refreshAddresses();

    if (!currentLocation && !selectedAddress) {
      if (typeof navigator !== 'undefined' && navigator.permissions) {
        navigator.permissions
          .query({ name: 'geolocation' as PermissionName })
          .then((permissionStatus) => {
            setLocationPermission(permissionStatus.state as LocationPermissionState);
            if (permissionStatus.state === 'granted') {
              detectCurrentLocation();
            }
          })
          .catch(() => {});
      }
    } else if (selectedAddress?.latitude && selectedAddress?.longitude && !serviceability) {
      checkServiceability(selectedAddress.latitude, selectedAddress.longitude, selectedAddress.pincode);
    }
  }, []);

  const openAddressModal = useCallback(() => setIsAddressModalOpen(true), []);
  const closeAddressModal = useCallback(() => setIsAddressModalOpen(false), []);
  const dismissCelebrationBanner = useCallback(() => setIsCelebrationBannerVisible(false), []);

  return (
    <LocationContext.Provider
      value={{
        currentLocation,
        currentCoordinates,
        selectedAddress,
        savedAddresses,
        serviceability,
        isDetectingLocation,
        gpsAccuracyM,
        locationError,
        locationPermission,
        isAddressModalOpen,
        isCelebrationBannerVisible,
        dismissCelebrationBanner,
        openAddressModal,
        closeAddressModal,
        detectCurrentLocation,
        selectAddress,
        setManualLocation,
        joinWaitlist,
        refreshAddresses,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = (): LocationContextType => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};
