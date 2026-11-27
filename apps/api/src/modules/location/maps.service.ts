import { env } from '../../config/env.config.js';
import { logger } from '../../common/logging/logger.js';
import { MerchantModel } from '../merchants/merchant.model.js';

export interface GeocodeResult {
  latitude: number;
  longitude: number;
  formattedAddress: string;
  houseFlat?: string;
  street?: string;
  locality?: string;
  city?: string;
  district?: string;
  state?: string;
  pincode?: string;
  country?: string;
  placeId?: string;
  source: 'google' | 'openstreetmap';
}

export interface PlaceAutocompleteItem {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
  latitude?: number;
  longitude?: number;
}

export interface ServiceabilityCheckResult {
  isServiceable: boolean;
  distanceKm: number;
  estimatedMinutes: number;
  deliveryFeePaise: number;
  freeDeliveryThresholdPaise: number;
  message: string;
  pincode?: string;
  nearestMerchant?: {
    id: string;
    businessName: string;
    distanceKm: number;
  };
}

export class MapsService {
  /**
   * Geocodes an address or location query into geographic coordinates.
   */
  public static async geocode(query: string): Promise<GeocodeResult | null> {
    const cleanQuery = query.trim();
    if (!cleanQuery) return null;

    // 1. Google Maps Platform Geocoding API if configured
    if (env.GOOGLE_MAPS_API_KEY && env.GOOGLE_MAPS_API_KEY !== 'your_google_maps_key_here') {
      try {
        const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(cleanQuery)}&key=${env.GOOGLE_MAPS_API_KEY}`;
        const res = await fetch(url);
        if (res.ok) {
          const data = (await res.json()) as any;
          if (data.results && data.results.length > 0) {
            const first = data.results[0];
            const loc = first.geometry.location;
            const components = first.address_components || [];

            let locality = '';
            let city = '';
            let district = '';
            let state = '';
            let pincode = '';
            let country = 'India';

            components.forEach((c: any) => {
              if (c.types.includes('sublocality') || c.types.includes('neighborhood')) locality = c.long_name;
              if (c.types.includes('locality')) city = c.long_name;
              if (c.types.includes('administrative_area_level_2')) district = c.long_name;
              if (c.types.includes('administrative_area_level_1')) state = c.long_name;
              if (c.types.includes('postal_code')) pincode = c.long_name;
              if (c.types.includes('country')) country = c.long_name;
            });

            return {
              latitude: loc.lat,
              longitude: loc.lng,
              formattedAddress: first.formatted_address,
              locality: locality || city,
              city: city || district || 'Bengaluru',
              district,
              state: state || 'Karnataka',
              pincode,
              country,
              placeId: first.place_id,
              source: 'google',
            };
          }
        }
      } catch (err) {
        logger.warn({ err }, 'Google Maps Geocoding failed, trying OpenStreetMap');
      }
    }

    // 2. OpenStreetMap Nominatim (Open, reliable, zero secret required)
    try {
      const osmUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cleanQuery)}&format=json&addressdetails=1&limit=1`;
      const res = await fetch(osmUrl, {
        headers: {
          'User-Agent': 'CartPilot-AgenticCommerce/1.0',
        },
      });

      if (res.ok) {
        const list = (await res.json()) as any[];
        if (list && list.length > 0) {
          const item = list[0];
          const addr = item.address || {};
          return {
            latitude: parseFloat(item.lat),
            longitude: parseFloat(item.lon),
            formattedAddress: item.display_name,
            street: addr.road || addr.street,
            locality: addr.suburb || addr.neighbourhood || addr.subdivision,
            city: addr.city || addr.town || addr.village || 'Bengaluru',
            district: addr.county || addr.state_district,
            state: addr.state || 'Karnataka',
            pincode: addr.postcode,
            country: addr.country || 'India',
            placeId: item.place_id?.toString(),
            source: 'openstreetmap',
          };
        }
      }
    } catch (err) {
      logger.warn({ err, cleanQuery }, 'OpenStreetMap Nominatim geocoding failed');
    }

    // Default safe fallback if network offline
    return {
      latitude: 12.9298,
      longitude: 77.6848,
      formattedAddress: `${cleanQuery}, Bengaluru, Karnataka`,
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560103',
      country: 'India',
      source: 'openstreetmap',
    };
  }

  /**
   * Reverse-geocodes latitude and longitude coordinates into a human-readable address.
   */
  public static async reverseGeocode(lat: number, lng: number): Promise<GeocodeResult | null> {
    // 1. Google Maps Platform Reverse Geocoding if key configured
    if (env.GOOGLE_MAPS_API_KEY && env.GOOGLE_MAPS_API_KEY !== 'your_google_maps_key_here') {
      try {
        const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${env.GOOGLE_MAPS_API_KEY}`;
        const res = await fetch(url);
        if (res.ok) {
          const data = (await res.json()) as any;
          if (data.results && data.results.length > 0) {
            const first = data.results[0];
            const components = first.address_components || [];

            let houseFlat = '';
            let street = '';
            let locality = '';
            let city = '';
            let district = '';
            let state = '';
            let pincode = '';
            let country = 'India';

            components.forEach((c: any) => {
              if (c.types.includes('street_number')) houseFlat = c.long_name;
              if (c.types.includes('route')) street = c.long_name;
              if (c.types.includes('sublocality') || c.types.includes('neighborhood')) locality = c.long_name;
              if (c.types.includes('locality')) city = c.long_name;
              if (c.types.includes('administrative_area_level_2')) district = c.long_name;
              if (c.types.includes('administrative_area_level_1')) state = c.long_name;
              if (c.types.includes('postal_code')) pincode = c.long_name;
              if (c.types.includes('country')) country = c.long_name;
            });

            return {
              latitude: lat,
              longitude: lng,
              formattedAddress: first.formatted_address,
              houseFlat,
              street,
              locality: locality || street || city,
              city: city || district || 'Bengaluru',
              district,
              state: state || 'Karnataka',
              pincode,
              country,
              placeId: first.place_id,
              source: 'google',
            };
          }
        }
      } catch (err) {
        logger.warn({ err, lat, lng }, 'Google Maps Reverse Geocoding failed, falling back to OSM');
      }
    }

    // 2. OpenStreetMap Nominatim
    try {
      const osmUrl = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1&zoom=18`;
      const res = await fetch(osmUrl, {
        headers: {
          'User-Agent': 'CartPilot-AgenticCommerce/1.0',
        },
      });

      if (res.ok) {
        const item = (await res.json()) as any;
        if (item && item.lat && item.lon) {
          const addr = item.address || {};
          const locality = addr.suburb || addr.neighbourhood || addr.residential || addr.subdivision || addr.road || '';
          const city = addr.city || addr.town || addr.village || addr.municipality || 'Bengaluru';
          const district = addr.county || addr.state_district || '';
          const state = addr.state || 'Karnataka';
          const pincode = addr.postcode || '';

          return {
            latitude: parseFloat(item.lat),
            longitude: parseFloat(item.lon),
            formattedAddress: item.display_name,
            houseFlat: addr.house_number || addr.building || '',
            street: addr.road || addr.street || '',
            locality: locality || city,
            city,
            district,
            state,
            pincode,
            country: addr.country || 'India',
            placeId: item.place_id?.toString(),
            source: 'openstreetmap',
          };
        }
      }
    } catch (err) {
      logger.warn({ err, lat, lng }, 'Reverse geocoding failed');
    }

    // Return safe coordinates representation
    return {
      latitude: lat,
      longitude: lng,
      formattedAddress: `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`,
      city: 'Bengaluru',
      state: 'Karnataka',
      country: 'India',
      source: 'openstreetmap',
    };
  }

  /**
   * Places typeahead autocomplete for quick address lookup.
   */
  public static async autocomplete(query: string): Promise<PlaceAutocompleteItem[]> {
    const cleanQuery = query.trim();
    if (!cleanQuery || cleanQuery.length < 2) return [];

    // 1. Google Places Autocomplete if configured
    if (env.GOOGLE_MAPS_API_KEY && env.GOOGLE_MAPS_API_KEY !== 'your_google_maps_key_here') {
      try {
        const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(cleanQuery)}&components=country:in&key=${env.GOOGLE_MAPS_API_KEY}`;
        const res = await fetch(url);
        if (res.ok) {
          const data = (await res.json()) as any;
          if (data.predictions && Array.isArray(data.predictions)) {
            return data.predictions.map((p: any) => ({
              placeId: p.place_id,
              description: p.description,
              mainText: p.structured_formatting?.main_text || p.description.split(',')[0],
              secondaryText: p.structured_formatting?.secondary_text || '',
            }));
          }
        }
      } catch (err) {
        logger.warn({ err }, 'Google Places autocomplete failed, falling back to OSM');
      }
    }

    // 2. OpenStreetMap / Nominatim autocomplete fallback
    try {
      const osmUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cleanQuery)}&format=json&addressdetails=1&countrycodes=in&limit=6`;
      const res = await fetch(osmUrl, {
        headers: {
          'User-Agent': 'CartPilot-AgenticCommerce/1.0',
        },
      });

      if (res.ok) {
        const list = (await res.json()) as any[];
        if (Array.isArray(list)) {
          return list.map((item) => {
            const parts = (item.display_name || '').split(',');
            const mainText = parts[0]?.trim() || item.name || cleanQuery;
            const secondaryText = parts.slice(1, 4).join(',').trim();
            return {
              placeId: item.place_id?.toString() || `osm_${item.lat}_${item.lon}`,
              description: item.display_name,
              mainText,
              secondaryText,
              latitude: parseFloat(item.lat),
              longitude: parseFloat(item.lon),
            };
          });
        }
      }
    } catch (err) {
      logger.warn({ err, cleanQuery }, 'OSM autocomplete fallback failed');
    }

    return [];
  }

  /**
   * Resolves a placeId into exact coordinates and components.
   */
  public static async getPlaceDetails(placeId: string): Promise<GeocodeResult | null> {
    if (!placeId) return null;

    if (env.GOOGLE_MAPS_API_KEY && env.GOOGLE_MAPS_API_KEY !== 'your_google_maps_key_here' && !placeId.startsWith('osm_')) {
      try {
        const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${env.GOOGLE_MAPS_API_KEY}`;
        const res = await fetch(url);
        if (res.ok) {
          const data = (await res.json()) as any;
          if (data.result?.geometry?.location) {
            const loc = data.result.geometry.location;
            return await this.reverseGeocode(loc.lat, loc.lng);
          }
        }
      } catch (err) {
        logger.warn({ err, placeId }, 'Google Place details failed');
      }
    }

    return null;
  }

  /**
   * Haversine formula to compute great-circle distance between two geographic points in kilometers.
   */
  public static calculateDistanceKm(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Earth's mean radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return parseFloat((R * c).toFixed(2));
  }

  /**
   * Calculates realistic quick-commerce delivery time in minutes based on distance.
   */
  public static estimateDeliveryMinutes(distanceKm: number): number {
    // 8 mins store packing + 2.5 mins per km in urban traffic + 2 mins doorstep handoff
    const estimated = Math.round(8 + distanceKm * 2.5 + 2);
    return Math.max(12, Math.min(estimated, 45)); // Clamped between 12 and 45 mins
  }

  /**
   * Centralized Delivery Radius & Serviceability Engine:
   * Compares customer location against merchant dark-stores & fulfillment centers.
   */
  public static async checkServiceability(
    customerLat?: number,
    customerLng?: number,
    pincode?: string
  ): Promise<ServiceabilityCheckResult> {
    try {
      const merchants = await MerchantModel.find({
        isActive: true,
        status: 'APPROVED',
      }).lean();

      // Standard central default hub (Indiranagar / Bellandur tech corridor)
      const DEFAULT_HUB = {
        id: 'central_hub_01',
        businessName: 'CartPilot Darkstore #1 (Central)',
        latitude: 12.9716,
        longitude: 77.5946,
        deliveryRadiusKm: 15,
        serviceAreaPincodes: ['560001', '560034', '560102', '560103', '560038', '560008', '560095'],
      };

      const hubs =
        merchants.length > 0
          ? merchants.map((m) => ({
              id: m._id.toString(),
              businessName: m.businessName,
              latitude: (m.address as any)?.latitude || DEFAULT_HUB.latitude,
              longitude: (m.address as any)?.longitude || DEFAULT_HUB.longitude,
              deliveryRadiusKm: m.deliverySettings?.deliveryRadiusKm || 15,
              serviceAreaPincodes: m.serviceAreaPincodes || [],
            }))
          : [DEFAULT_HUB];

      // 1. Precise Coordinate Validation (Blinkit / Zepto Standard)
      if (
        customerLat !== undefined &&
        customerLng !== undefined &&
        !isNaN(customerLat) &&
        !isNaN(customerLng) &&
        customerLat !== 0 &&
        customerLng !== 0
      ) {
        let nearestHub = hubs[0] || DEFAULT_HUB;
        let minDistanceKm = Infinity;

        for (const hub of hubs) {
          const dist = this.calculateDistanceKm(customerLat, customerLng, hub.latitude, hub.longitude);
          if (dist < minDistanceKm) {
            minDistanceKm = dist;
            nearestHub = hub;
          }
        }

        const isServiceable = minDistanceKm <= (nearestHub.deliveryRadiusKm || 15);
        const estimatedMinutes = this.estimateDeliveryMinutes(minDistanceKm);
        const deliveryFeePaise = minDistanceKm <= 3 ? 0 : 3500;

        return {
          isServiceable,
          distanceKm: minDistanceKm,
          estimatedMinutes: isServiceable ? estimatedMinutes : 0,
          deliveryFeePaise,
          freeDeliveryThresholdPaise: 39900,
          pincode,
          nearestMerchant: {
            id: nearestHub.id,
            businessName: nearestHub.businessName,
            distanceKm: minDistanceKm,
          },
          message: isServiceable
            ? `Express delivery in ${estimatedMinutes} mins (${minDistanceKm} km from ${nearestHub.businessName})`
            : `Location is ${minDistanceKm} km away. We currently deliver within ${nearestHub.deliveryRadiusKm || 15} km of our fulfillment store.`,
        };
      }

      // 2. PIN code lookup fallback
      if (pincode) {
        const cleanPin = pincode.trim();
        const matched = hubs.find((h) => h.serviceAreaPincodes.includes(cleanPin));
        const isCommonMetro =
          cleanPin.startsWith('560') || cleanPin.startsWith('400') || cleanPin.startsWith('110') || cleanPin.startsWith('500');

        const isServiceable = Boolean(matched) || isCommonMetro;
        const distanceKm = isServiceable ? 3.8 : 22.0;
        const estimatedMinutes = isServiceable ? 20 : 0;

        return {
          isServiceable,
          distanceKm,
          estimatedMinutes,
          deliveryFeePaise: 3500,
          freeDeliveryThresholdPaise: 39900,
          pincode: cleanPin,
          message: isServiceable
            ? `PIN ${cleanPin} is inside our delivery radius (est. 18-25 mins)`
            : `PIN ${cleanPin} is currently outside our 30-minute delivery zone.`,
        };
      }

      // 3. Initial App Launch Default
      return {
        isServiceable: true,
        distanceKm: 2.1,
        estimatedMinutes: 15,
        deliveryFeePaise: 0,
        freeDeliveryThresholdPaise: 39900,
        message: '15-20 min quick delivery zone',
      };
    } catch (err) {
      logger.error({ err }, 'Error checking serviceability');
      return {
        isServiceable: true,
        distanceKm: 3.0,
        estimatedMinutes: 20,
        deliveryFeePaise: 3500,
        freeDeliveryThresholdPaise: 39900,
        message: 'Standard delivery zone (15-25 min)',
      };
    }
  }
}
