import { API_BASE } from '../config/api';
import { LocalityLabelInfo, ServiceabilityInfo } from '../types';

export interface RefinedGpsSample {
  latitude: number;
  longitude: number;
  accuracyM: number;
  timestamp: number;
}

export interface ResolvedLocationPayload {
  location: LocalityLabelInfo;
  serviceability: ServiceabilityInfo;
}

export interface WaitlistJoinPayload {
  email: string;
  phone?: string;
  pincode: string;
  locality: string;
  city: string;
  state: string;
  consentTextVersion?: string;
}

export class LocationService {
  private static sessionId: string = (() => {
    try {
      const stored = sessionStorage.getItem('cartpilot_session_id');
      if (stored) return stored;
      const created = 'cp_sess_' + Math.random().toString(36).substring(2, 10);
      sessionStorage.setItem('cartpilot_session_id', created);
      return created;
    } catch {
      return 'cp_sess_' + Date.now();
    }
  })();

  /**
   * Refined live browser geolocation using multi-sample watchPosition
   * Discards early inaccurate GPS samples and picks the highest confidence fix (lowest accuracy in meters).
   */
  public static async getRefinedCoordinates(
    onProgress?: (accuracyM: number, elapsedMs: number) => void
  ): Promise<RefinedGpsSample> {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      throw new Error('Geolocation is not supported by your browser');
    }

    return new Promise((resolve, reject) => {
      let bestSample: RefinedGpsSample | null = null;
      let watchId: number | null = null;
      const startTime = Date.now();

      const finish = () => {
        if (watchId !== null) {
          navigator.geolocation.clearWatch(watchId);
          watchId = null;
        }
        if (bestSample) {
          resolve(bestSample);
        } else {
          reject(new Error('Unable to obtain reliable GPS coordinates'));
        }
      };

      // Maximum 8 seconds timeout for multi-sample refinement
      const timeoutId = setTimeout(finish, 8000);

      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const sample: RefinedGpsSample = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracyM: position.coords.accuracy,
            timestamp: position.timestamp,
          };

          const elapsed = Date.now() - startTime;
          onProgress?.(sample.accuracyM, elapsed);

          // Update best sample if accuracy is higher (lower meter error)
          if (!bestSample || sample.accuracyM < bestSample.accuracyM) {
            bestSample = sample;
          }

          // If accuracy is high quality (<= 40 meters), finish early
          if (sample.accuracyM <= 40) {
            clearTimeout(timeoutId);
            finish();
          }
        },
        (error) => {
          if (!bestSample) {
            clearTimeout(timeoutId);
            if (watchId !== null) navigator.geolocation.clearWatch(watchId);
            reject(error);
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 10000,
        }
      );
    });
  }

  /**
   * Resolves live coordinates or manual input via CartPilot API
   */
  public static async resolveLocation(params: {
    lat?: number;
    lng?: number;
    pincode?: string;
    placeId?: string;
    accuracyM?: number;
    source?: 'gps' | 'manual' | 'saved';
  }): Promise<ResolvedLocationPayload> {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const isTablet = typeof window !== 'undefined' && window.innerWidth >= 768 && window.innerWidth < 1024;
    const device = isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop';

    const res = await fetch(`${API_BASE}/location/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...params,
        sessionId: this.sessionId,
        device,
      }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error?.message || 'Failed to resolve location serviceability');
    }

    return data.data as ResolvedLocationPayload;
  }

  /**
   * Subscribes user to the Coming Soon Area Waitlist
   */
  public static async joinWaitlist(
    payload: WaitlistJoinPayload
  ): Promise<{ success: boolean; waitlistCount: number; message: string }> {
    const res = await fetch(`${API_BASE}/location/waitlist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error?.message || 'Failed to join waitlist');
    }

    return data.data;
  }

  /**
   * Fetches active platform delivery service regions & scheduled slots
   */
  public static async getServiceInfo(): Promise<{
    enforcement: 'off' | 'report_only' | 'on';
    deliverySlots: any[];
    activeCities: string[];
    totalActiveAreas: number;
    deliveryModel: string;
  }> {
    const res = await fetch(`${API_BASE}/location/service-info`);
    const data = await res.json();
    if (res.ok && data.success) {
      return data.data;
    }
    return {
      enforcement: 'on',
      deliverySlots: [],
      activeCities: [],
      totalActiveAreas: 0,
      deliveryModel: 'NEXT_DAY_SCHEDULED',
    };
  }
}
