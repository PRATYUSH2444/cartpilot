import { env } from '../../config/env.config.js';
import { logger } from '../../common/logging/logger.js';
import { GeocodeCacheModel } from './models.js';
import { buildLocalityLabel } from './label-builder.js';

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
  source: 'google' | 'openstreetmap' | 'cache';
  label?: string;
  subLabel?: string;
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
   * Geocodes an address, place name, or PIN code into geographic coordinates.
   * Caches results in MongoDB with 30-day TTL to avoid repeated external API requests.
   */
  public static async geocode(query: string): Promise<GeocodeResult | null> {
    const cleanQuery = query.trim();
    if (!cleanQuery) return null;

    const cacheKey = `geo:${cleanQuery.toLowerCase()}`;

    // 0. Check TTL-indexed MongoDB cache
    try {
      const cached = await GeocodeCacheModel.findOne({ key: cacheKey }).lean();
      if (cached && cached.normalisedResult) {
        return {
          ...(cached.normalisedResult as GeocodeResult),
          source: 'cache',
        };
      }
    } catch {
      // Non-fatal cache lookup miss
    }

    let result: GeocodeResult | null = null;

    // 1. Google Maps Platform Geocoding API if configured
    if (env.GOOGLE_MAPS_API_KEY && env.GOOGLE_MAPS_API_KEY !== 'your_google_maps_key_here') {
      try {
        const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(cleanQuery)}&components=country:IN&key=${env.GOOGLE_MAPS_API_KEY}`;
        const res = await fetch(url);
        if (res.ok) {
          const data = (await res.json()) as any;
          if (data.results && data.results.length > 0) {
            const first = data.results[0];
            const loc = first.geometry.location;
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
              if (c.types.includes('sublocality') || c.types.includes('neighborhood') || c.types.includes('sublocality_level_1')) {
                locality = c.long_name;
              }
              if (c.types.includes('locality')) city = c.long_name;
              if (c.types.includes('administrative_area_level_2')) district = c.long_name;
              if (c.types.includes('administrative_area_level_1')) state = c.long_name;
              if (c.types.includes('postal_code')) pincode = c.long_name;
              if (c.types.includes('country')) country = c.long_name;
            });

            const labels = buildLocalityLabel(
              {
                houseFlat,
                street,
                locality,
                city,
                district,
                state,
                pincode,
                country,
                rawFormatted: first.formatted_address,
              },
              first.formatted_address
            );

            result = {
              latitude: loc.lat,
              longitude: loc.lng,
              formattedAddress: first.formatted_address,
              houseFlat,
              street,
              locality: labels.locality,
              city: labels.city,
              district: labels.district,
              state: labels.state,
              pincode: labels.pincode,
              country,
              placeId: first.place_id,
              source: 'google',
              label: labels.label,
              subLabel: labels.subLabel,
            };
          }
        }
      } catch (err) {
        logger.warn({ err }, 'Google Maps Geocoding failed, trying OpenStreetMap');
      }
    }

    // 2. OpenStreetMap Nominatim with India country filter
    if (!result) {
      try {
        const osmUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cleanQuery)}&countrycodes=in&format=json&addressdetails=1&limit=1`;
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
            const locality = addr.suburb || addr.neighbourhood || addr.subdivision || addr.residential || addr.road || '';
            const city = addr.city || addr.town || addr.village || addr.municipality || '';
            const district = addr.county || addr.state_district || '';
            const state = addr.state || '';
            const pincode = addr.postcode || '';

            const labels = buildLocalityLabel(
              {
                houseFlat: addr.house_number || addr.building,
                street: addr.road || addr.street,
                locality,
                city,
                district,
                state,
                pincode,
                country: addr.country || 'India',
                rawFormatted: item.display_name,
              },
              item.display_name
            );

            result = {
              latitude: parseFloat(item.lat),
              longitude: parseFloat(item.lon),
              formattedAddress: item.display_name,
              houseFlat: addr.house_number || addr.building || '',
              street: addr.road || addr.street || '',
              locality: labels.locality,
              city: labels.city,
              district: labels.district,
              state: labels.state,
              pincode: labels.pincode,
              country: addr.country || 'India',
              placeId: item.place_id?.toString(),
              source: 'openstreetmap',
              label: labels.label,
              subLabel: labels.subLabel,
            };
          }
        }
      } catch (err) {
        logger.warn({ err, cleanQuery }, 'OpenStreetMap Nominatim geocoding failed');
      }
    }

    // Cache valid result in MongoDB
    if (result) {
      try {
        await GeocodeCacheModel.updateOne(
          { key: cacheKey },
          { $set: { normalisedResult: result, provider: result.source, createdAt: new Date() } },
          { upsert: true }
        );
      } catch {
        // Non-fatal cache write failure
      }
    }

    return result;
  }

  /**
   * Reverse-geocodes latitude and longitude coordinates into a human-readable address.
   * Returns locality-friendly labels with granular unit details (tower, flat, floor) stripped.
   */
  public static async reverseGeocode(lat: number, lng: number): Promise<GeocodeResult | null> {
    if (isNaN(lat) || isNaN(lng)) return null;

    // Cache key rounded to ~4 decimal places (~11m precision)
    const latRounded = Math.round(lat * 10000) / 10000;
    const lngRounded = Math.round(lng * 10000) / 10000;
    const cacheKey = `rev:${latRounded},${lngRounded}`;

    try {
      const cached = await GeocodeCacheModel.findOne({ key: cacheKey }).lean();
      if (cached && cached.normalisedResult) {
        return {
          ...(cached.normalisedResult as GeocodeResult),
          source: 'cache',
        };
      }
    } catch {
      // Non-fatal cache lookup miss
    }

    let result: GeocodeResult | null = null;

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
              if (c.types.includes('sublocality') || c.types.includes('neighborhood') || c.types.includes('sublocality_level_1')) {
                locality = c.long_name;
              }
              if (c.types.includes('locality')) city = c.long_name;
              if (c.types.includes('administrative_area_level_2')) district = c.long_name;
              if (c.types.includes('administrative_area_level_1')) state = c.long_name;
              if (c.types.includes('postal_code')) pincode = c.long_name;
              if (c.types.includes('country')) country = c.long_name;
            });

            const labels = buildLocalityLabel(
              {
                houseFlat,
                street,
                locality,
                city,
                district,
                state,
                pincode,
                country,
                rawFormatted: first.formatted_address,
              },
              first.formatted_address
            );

            result = {
              latitude: lat,
              longitude: lng,
              formattedAddress: first.formatted_address,
              houseFlat,
              street,
              locality: labels.locality,
              city: labels.city,
              district: labels.district,
              state: labels.state,
              pincode: labels.pincode,
              country,
              placeId: first.place_id,
              source: 'google',
              label: labels.label,
              subLabel: labels.subLabel,
            };
          }
        }
      } catch (err) {
        logger.warn({ err, lat, lng }, 'Google Maps Reverse Geocoding failed, falling back to OSM');
      }
    }

    // 2. OpenStreetMap Nominatim
    if (!result) {
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
            const city = addr.city || addr.town || addr.village || addr.municipality || '';
            const district = addr.county || addr.state_district || '';
            const state = addr.state || '';
            const pincode = addr.postcode || '';

            const labels = buildLocalityLabel(
              {
                houseFlat: addr.house_number || addr.building,
                street: addr.road || addr.street,
                locality,
                city,
                district,
                state,
                pincode,
                country: addr.country || 'India',
                rawFormatted: item.display_name,
              },
              item.display_name
            );

            result = {
              latitude: parseFloat(item.lat),
              longitude: parseFloat(item.lon),
              formattedAddress: item.display_name,
              houseFlat: addr.house_number || addr.building || '',
              street: addr.road || addr.street || '',
              locality: labels.locality,
              city: labels.city,
              district: labels.district,
              state: labels.state,
              pincode: labels.pincode,
              country: addr.country || 'India',
              placeId: item.place_id?.toString(),
              source: 'openstreetmap',
              label: labels.label,
              subLabel: labels.subLabel,
            };
          }
        }
      } catch (err) {
        logger.warn({ err, lat, lng }, 'Reverse geocoding failed');
      }
    }

    // Fallback if network offline or no place found
    if (!result) {
      result = {
        latitude: lat,
        longitude: lng,
        formattedAddress: `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`,
        locality: 'Current Location',
        city: '',
        district: '',
        state: '',
        pincode: '',
        country: 'India',
        source: 'openstreetmap',
        label: 'Current Location',
        subLabel: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      };
    }

    // Write to cache
    try {
      await GeocodeCacheModel.updateOne(
        { key: cacheKey },
        { $set: { normalisedResult: result, provider: result.source, createdAt: new Date() } },
        { upsert: true }
      );
    } catch {
      // Non-fatal cache write failure
    }

    return result;
  }

  /**
   * Autocomplete search for address and landmark suggestions across India
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
          if (data.predictions && data.predictions.length > 0) {
            return data.predictions.map((p: any) => ({
              placeId: p.place_id,
              description: p.description,
              mainText: p.structured_formatting?.main_text || p.description,
              secondaryText: p.structured_formatting?.secondary_text || '',
            }));
          }
        }
      } catch (err) {
        logger.warn({ err, cleanQuery }, 'Google Places autocomplete failed, falling back to OSM');
      }
    }

    // 2. OpenStreetMap Nominatim fallback
    try {
      const osmUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cleanQuery)}&countrycodes=in&format=json&addressdetails=1&limit=6`;
      const res = await fetch(osmUrl, {
        headers: {
          'User-Agent': 'CartPilot-AgenticCommerce/1.0',
        },
      });

      if (res.ok) {
        const list = (await res.json()) as any[];
        if (list && list.length > 0) {
          return list.map((item) => {
            const parts = item.display_name.split(',');
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
   * Haversine formula to compute distance between two coordinates in kilometers.
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
   * Compatibility wrapper for checking serviceability (delegates to dynamic database configuration)
   */
  public static async checkServiceability(
    customerLat?: number,
    customerLng?: number,
    pincode?: string
  ): Promise<ServiceabilityCheckResult> {
    // Dynamically check against active service areas and stores
    try {
      const { LocationService } = await import('./location.service.js');
      const resolved = await LocationService.resolveLocation({
        lat: customerLat,
        lng: customerLng,
        pincode,
        source: 'manual',
      });

      return {
        isServiceable: resolved.serviceability.isServiceable,
        distanceKm: resolved.serviceability.distanceKm || 0,
        estimatedMinutes: 0,
        deliveryFeePaise: 0,
        freeDeliveryThresholdPaise: 39900,
        pincode: resolved.location.pincode || pincode,
        message: resolved.serviceability.message,
      };
    } catch {
      // Safe fallback
      return {
        isServiceable: true,
        distanceKm: 0,
        estimatedMinutes: 0,
        deliveryFeePaise: 0,
        freeDeliveryThresholdPaise: 39900,
        message: 'Delivery service operational',
      };
    }
  }
}
