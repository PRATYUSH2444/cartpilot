import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { UserAddress, ServiceabilityInfo } from '../types';
import { API_BASE } from '../config/api';
import { useAuth } from './AuthContext';

interface Coordinates {
  latitude: number;
  longitude: number;
}

export type LocationPermissionState = 'prompt' | 'granted' | 'denied' | 'unavailable';

interface LocationContextType {
  currentCoordinates: Coordinates | null;
  selectedAddress: UserAddress | null;
  savedAddresses: UserAddress[];
  serviceability: ServiceabilityInfo | null;
  isDetectingLocation: boolean;
  locationError: string | null;
  locationPermission: LocationPermissionState;
  isAddressModalOpen: boolean;
  openAddressModal: () => void;
  closeAddressModal: () => void;
  detectCurrentLocation: () => Promise<UserAddress | null>;
  selectAddress: (address: UserAddress) => Promise<void>;
  setManualLocation: (lat: number, lng: number, addressInfo?: Partial<UserAddress>) => Promise<UserAddress | null>;
  refreshAddresses: () => Promise<void>;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

const STORAGE_KEY = 'cartpilot_selected_address';
const COORDS_KEY = 'cartpilot_current_coords';

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

  const [selectedAddress, setSelectedAddress] = useState<UserAddress | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [savedAddresses, setSavedAddresses] = useState<UserAddress[]>([]);
  const [serviceability, setServiceability] = useState<ServiceabilityInfo | null>(null);
  const [isDetectingLocation, setIsDetectingLocation] = useState<boolean>(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationPermission, setLocationPermission] = useState<LocationPermissionState>('prompt');
  const [isAddressModalOpen, setIsAddressModalOpen] = useState<boolean>(false);

  // Check serviceability for coordinates or pincode
  const checkServiceability = useCallback(async (lat?: number, lng?: number, pincode?: string) => {
    try {
      const res = await fetch(`${API_BASE}/location/serviceability`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ latitude: lat, longitude: lng, pincode }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.data) {
        setServiceability(data.data);
        return data.data as ServiceabilityInfo;
      }
    } catch (e) {
      console.warn('Serviceability check failed:', e);
    }
    return null;
  }, []);

  // Fetch saved addresses from server if authenticated
  const refreshAddresses = useCallback(async () => {
    if (!token && !authFetch) return;
    try {
      const res = await authFetch(`${API_BASE}/addresses`);
      if (res.ok) {
        const data = await res.json();
        const addrs: UserAddress[] = data.data || [];
        setSavedAddresses(addrs);

        // If no selected address yet, pick default or first
        if (!selectedAddress && addrs.length > 0) {
          const def = addrs.find((a) => a.isDefault) || addrs[0];
          if (def) {
            setSelectedAddress(def);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(def));
            if (def.latitude && def.longitude) {
              checkServiceability(def.latitude, def.longitude, def.pincode);
            }
          }
        }
      }
    } catch (err) {
      console.warn('Failed to load saved addresses:', err);
    }
  }, [authFetch, token, selectedAddress, checkServiceability]);

  // Automatic browser geolocation detection
  const detectCurrentLocation = useCallback(async (): Promise<UserAddress | null> => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setLocationPermission('unavailable');
      setLocationError('Geolocation is not supported by your browser');
      return null;
    }

    setIsDetectingLocation(true);
    setLocationError(null);

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const coords = { latitude: lat, longitude: lng };

          setCurrentCoordinates(coords);
          setLocationPermission('granted');
          localStorage.setItem(COORDS_KEY, JSON.stringify(coords));

          try {
            // 1. Reverse-geocode coordinates to readable address
            const revRes = await fetch(`${API_BASE}/location/reverse-geocode?lat=${lat}&lng=${lng}`);
            const revData = await revRes.json();
            const geo = revData.data || {};

            // 2. Check real-time serviceability
            const serv = await checkServiceability(lat, lng, geo.pincode);

            // 3. Assemble unified address object
            const detectedAddress: UserAddress = {
              _id: `gps_${Date.now()}`,
              userId: user?.id || 'guest',
              fullName: user?.name || 'Customer',
              phone: user?.phone || '',
              houseFlat: geo.houseFlat || 'Current Location',
              apartmentStreet: geo.street || geo.locality || 'GPS Location',
              areaLocality: geo.locality || geo.city || 'Near You',
              landmark: '',
              city: geo.city || 'Bengaluru',
              state: geo.state || 'Karnataka',
              pincode: geo.pincode || '560001',
              addressType: 'OTHER',
              latitude: lat,
              longitude: lng,
              isDefault: true,
              isServiceable: serv?.isServiceable ?? true,
            };

            setSelectedAddress(detectedAddress);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(detectedAddress));
            setIsDetectingLocation(false);
            resolve(detectedAddress);
          } catch (err: any) {
            console.error('Reverse geocode failed:', err);
            setIsDetectingLocation(false);
            resolve(null);
          }
        },
        (error) => {
          setIsDetectingLocation(false);
          if (error.code === error.PERMISSION_DENIED) {
            setLocationPermission('denied');
            setLocationError('Location permission denied. Please search or pick your address manually.');
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            setLocationPermission('unavailable');
            setLocationError('GPS signal unavailable. Please select your address manually.');
          } else if (error.code === error.TIMEOUT) {
            setLocationPermission('unavailable');
            setLocationError('Location request timed out. Please try again.');
          } else {
            setLocationError(error.message || 'Unable to retrieve location');
          }
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        }
      );
    });
  }, [checkServiceability, user]);

  // Set manual location from map or search autocomplete
  const setManualLocation = useCallback(
    async (lat: number, lng: number, addressInfo?: Partial<UserAddress>): Promise<UserAddress | null> => {
      setIsDetectingLocation(true);
      setLocationError(null);

      try {
        const revRes = await fetch(`${API_BASE}/location/reverse-geocode?lat=${lat}&lng=${lng}`);
        const revData = await revRes.json();
        const geo = revData.data || {};

        const serv = await checkServiceability(lat, lng, addressInfo?.pincode || geo.pincode);

        const newAddr: UserAddress = {
          _id: addressInfo?._id || `manual_${Date.now()}`,
          userId: user?.id || 'guest',
          fullName: addressInfo?.fullName || user?.name || 'Customer',
          phone: addressInfo?.phone || user?.phone || '',
          houseFlat: addressInfo?.houseFlat || geo.houseFlat || 'Selected Location',
          apartmentStreet: addressInfo?.apartmentStreet || geo.street || geo.locality || 'Road',
          areaLocality: addressInfo?.areaLocality || geo.locality || geo.city || 'Locality',
          landmark: addressInfo?.landmark || '',
          city: addressInfo?.city || geo.city || 'Bengaluru',
          state: addressInfo?.state || geo.state || 'Karnataka',
          pincode: addressInfo?.pincode || geo.pincode || '560001',
          addressType: addressInfo?.addressType || 'OTHER',
          latitude: lat,
          longitude: lng,
          isDefault: true,
          isServiceable: serv?.isServiceable ?? true,
        };

        const coords = { latitude: lat, longitude: lng };
        setCurrentCoordinates(coords);
        localStorage.setItem(COORDS_KEY, JSON.stringify(coords));

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
    [checkServiceability, user]
  );

  // Select a saved address
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

  // Initial load effect: load saved addresses or detect location
  useEffect(() => {
    refreshAddresses();

    // If no address selected at all, attempt graceful initial location detection
    if (!selectedAddress && !currentCoordinates) {
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
  }, []); // Run once on app mount

  const openAddressModal = useCallback(() => setIsAddressModalOpen(true), []);
  const closeAddressModal = useCallback(() => setIsAddressModalOpen(false), []);

  return (
    <LocationContext.Provider
      value={{
        currentCoordinates,
        selectedAddress,
        savedAddresses,
        serviceability,
        isDetectingLocation,
        locationError,
        locationPermission,
        isAddressModalOpen,
        openAddressModal,
        closeAddressModal,
        detectCurrentLocation,
        selectAddress,
        setManualLocation,
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
