import crypto from 'crypto';
import {
  ServiceAreaModel,
  StoreModel,
  LocationEventModel,
  LocationDemandDailyModel,
  AreaWaitlistModel,
  ServiceabilitySettingsModel,
  IServiceArea,
} from './models.js';
import { MapsService, GeocodeResult } from './maps.service.js';
import { buildLocalityLabel, LocalityLabelResult } from './label-builder.js';
import { realtimeService } from '../realtime/websocket.service.js';
import { logger } from '../../common/logging/logger.js';

export interface ResolveLocationInput {
  lat?: number;
  lng?: number;
  pincode?: string;
  placeId?: string;
  accuracyM?: number;
  source?: 'gps' | 'manual' | 'ip' | 'saved';
  sessionId?: string;
  userId?: string;
  device?: 'mobile' | 'tablet' | 'desktop';
}

export interface ServiceabilityResult {
  status: 'serviceable' | 'not_serviceable';
  enforcement: 'off' | 'report_only' | 'on';
  isServiceable: boolean;
  serviceAreaId?: string;
  storeId?: string;
  distanceKm?: number;
  deliverySlots: Array<{ id: string; label: string; cutoffTime: string; startHour: number; endHour: number }>;
  waitlistCount: number;
  demandCount: number;
  message: string;
}

export interface ResolveLocationResponse {
  location: LocalityLabelResult & {
    lat?: number;
    lng?: number;
    source: string;
    placeId?: string;
  };
  serviceability: ServiceabilityResult;
}

export class LocationService {
  /**
   * Helper: Hashes user ID or IP for DPDP-compliant analytics
   */
  private static hashIdentifier(raw: string): string {
    return crypto.createHash('sha256').update(raw).digest('hex').substring(0, 16);
  }

  /**
   * Gets or initializes global serviceability settings
   */
  public static async getSettings() {
    let settings = await ServiceabilitySettingsModel.findOne({ key: 'GLOBAL' });
    if (!settings) {
      settings = await ServiceabilitySettingsModel.create({
        key: 'GLOBAL',
        enforcement: 'on',
        allowBrowseWhenUnserviceable: false,
        minDemandDisplayThreshold: 3,
        deliverySlots: [
          { id: 'morning', label: 'Morning Slot (6:00 AM – 10:00 AM)', cutoffTime: '00:00', startHour: 6, endHour: 10 },
          { id: 'evening', label: 'Evening Slot (5:00 PM – 9:00 PM)', cutoffTime: '15:00', startHour: 17, endHour: 21 },
        ],
      });
    }
    return settings;
  }

  /**
   * Resolves location, derives clean locality labels, checks serviceability,
   * records analytics, and updates daily demand aggregations.
   */
  public static async resolveLocation(input: ResolveLocationInput): Promise<ResolveLocationResponse> {
    const settings = await this.getSettings();
    let geo: GeocodeResult | null = null;

    if (input.placeId) {
      geo = await MapsService.getPlaceDetails(input.placeId);
    } else if (input.lat !== undefined && input.lng !== undefined && !isNaN(input.lat) && !isNaN(input.lng)) {
      geo = await MapsService.reverseGeocode(input.lat, input.lng);
    } else if (input.pincode) {
      geo = await MapsService.geocode(input.pincode.trim());
    }

    // Fallback if geocoding failed or no coordinates
    if (!geo) {
      geo = {
        latitude: input.lat || 0,
        longitude: input.lng || 0,
        formattedAddress: input.pincode ? `PIN Code ${input.pincode}` : 'Current Location',
        locality: '',
        city: '',
        district: '',
        state: '',
        pincode: input.pincode || '',
        country: 'India',
        source: 'openstreetmap',
      };
    }

    // Build clean locality-friendly labels (stripping towers, flats, unit numbers)
    const labelResult = buildLocalityLabel(
      {
        houseFlat: geo.houseFlat,
        street: geo.street,
        locality: geo.locality,
        city: geo.city,
        district: geo.district,
        state: geo.state,
        pincode: geo.pincode || input.pincode,
        country: geo.country,
        rawFormatted: geo.formattedAddress,
      },
      geo.formattedAddress
    );

    const effectiveLat = geo.latitude || input.lat;
    const effectiveLng = geo.longitude || input.lng;
    const effectivePincode = input.pincode || labelResult.pincode || '';

    // Check serviceability against DB
    const serviceability = await this.checkServiceabilityInternal({
      lat: effectiveLat,
      lng: effectiveLng,
      pincode: effectivePincode,
      city: labelResult.city,
      locality: labelResult.locality,
      enforcement: settings.enforcement,
      deliverySlots: settings.deliverySlots,
    });

    // Record DPDP-compliant analytics asynchronously
    this.recordLocationEventAsync({
      input,
      labelResult: { ...labelResult, pincode: effectivePincode },
      lat: effectiveLat,
      lng: effectiveLng,
      serviceability,
    });

    return {
      location: {
        ...labelResult,
        pincode: effectivePincode,
        lat: effectiveLat,
        lng: effectiveLng,
        source: input.source || 'manual',
        placeId: geo.placeId,
      },
      serviceability,
    };
  }

  /**
   * Internal serviceability verification engine
   */
  private static async checkServiceabilityInternal(params: {
    lat?: number;
    lng?: number;
    pincode?: string;
    city?: string;
    locality?: string;
    enforcement: 'off' | 'report_only' | 'on';
    deliverySlots: any[];
  }): Promise<ServiceabilityResult> {
    const { lat, lng, pincode, city, locality, enforcement, deliverySlots } = params;

    // Retrieve active service areas and physical stores
    const [activeAreas, activeStores] = await Promise.all([
      ServiceAreaModel.find({ status: 'active' }).lean(),
      StoreModel.find({ status: 'active' }).lean(),
    ]);

    // Count existing waitlist & demand for this area
    const [waitlistCount, demandRecord] = await Promise.all([
      pincode ? AreaWaitlistModel.countDocuments({ pincode: pincode.trim(), status: 'waiting' }) : 0,
      pincode ? LocationDemandDailyModel.findOne({ pincode: pincode.trim() }).sort({ date: -1 }).lean() : null,
    ]);

    const demandCount = (demandRecord?.uniqueUsers || 0) + (waitlistCount || 0);

    // Fail-safe: If enforcement is ON but NO service areas are configured yet in the DB,
    // run in report_only mode so shoppers are not completely blocked.
    const effectiveEnforcement =
      enforcement === 'on' && activeAreas.length === 0 && activeStores.length === 0
        ? 'report_only'
        : enforcement;

    if (effectiveEnforcement === 'off') {
      return {
        status: 'serviceable',
        enforcement: 'off',
        isServiceable: true,
        deliverySlots,
        waitlistCount,
        demandCount,
        message: 'All locations currently serviceable (Enforcement: Off)',
      };
    }

    let matchedArea: IServiceArea | null = null;
    let matchedStoreId: string | undefined;
    let minDistanceKm: number | undefined;

    // 1. PIN code direct match
    if (pincode) {
      const pin = pincode.trim();
      matchedArea = (activeAreas.find((a) => a.pincode === pin) as unknown as IServiceArea) || null;
    }

    // 2. City or Locality match if no pincode match
    if (!matchedArea && city) {
      matchedArea =
        (activeAreas.find(
          (a) => a.city.toLowerCase() === city.toLowerCase() && a.type === 'city'
        ) as unknown as IServiceArea) || null;
    }

    // 3. Proximity match against active Stores or radius-based ServiceAreas
    if (lat !== undefined && lng !== undefined && !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
      for (const store of activeStores) {
        const dist = MapsService.calculateDistanceKm(lat, lng, store.lat, store.lng);
        if (minDistanceKm === undefined || dist < minDistanceKm) {
          minDistanceKm = dist;
        }
        if (dist <= (store.serviceRadiusKm || 25)) {
          matchedStoreId = store.storeId;
          break;
        }
      }

      if (!matchedArea && !matchedStoreId) {
        for (const area of activeAreas) {
          if (area.type === 'radius' && area.centre?.lat && area.centre?.lng) {
            const dist = MapsService.calculateDistanceKm(lat, lng, area.centre.lat, area.centre.lng);
            if (minDistanceKm === undefined || dist < minDistanceKm) {
              minDistanceKm = dist;
            }
            if (dist <= (area.radiusKm || 25)) {
              matchedArea = area as unknown as IServiceArea;
              break;
            }
          }
        }
      }
    }

    const isMatch = Boolean(matchedArea || matchedStoreId);

    if (isMatch) {
      return {
        status: 'serviceable',
        enforcement: effectiveEnforcement,
        isServiceable: true,
        serviceAreaId: matchedArea?._id?.toString(),
        storeId: matchedStoreId || matchedArea?.storeId,
        distanceKm: minDistanceKm,
        deliverySlots,
        waitlistCount,
        demandCount,
        message: `Delivery available in ${locality || city || 'your locality'}! Order before midnight for fresh morning delivery.`,
      };
    }

    // Location is unserviceable
    const isServiceableInReportOnly = effectiveEnforcement === 'report_only';
    const displayLocation = locality || city || (pincode ? `PIN ${pincode}` : 'your location');

    return {
      status: isServiceableInReportOnly ? 'serviceable' : 'not_serviceable',
      enforcement: effectiveEnforcement,
      isServiceable: isServiceableInReportOnly,
      distanceKm: minDistanceKm,
      deliverySlots: isServiceableInReportOnly ? deliverySlots : [],
      waitlistCount,
      demandCount,
      message: `We're not in ${displayLocation} yet. We're working hard to bring fresh groceries to your doorstep!`,
    };
  }

  /**
   * Logs location event & updates daily demand counters asynchronously
   */
  private static async recordLocationEventAsync(params: {
    input: ResolveLocationInput;
    labelResult: LocalityLabelResult;
    lat?: number;
    lng?: number;
    serviceability: ServiceabilityResult;
  }): Promise<void> {
    try {
      const { input, labelResult, lat, lng, serviceability } = params;
      const today = new Date().toISOString().slice(0, 10);
      const sessionId = input.sessionId || 'anon_' + Date.now();
      const userIdHash = input.userId ? this.hashIdentifier(input.userId) : undefined;

      // Privacy: Round coordinates to ~2 decimals (~1.1 km precision)
      const latRounded = lat ? Math.round(lat * 100) / 100 : undefined;
      const lngRounded = lng ? Math.round(lng * 100) / 100 : undefined;

      // Log event
      await LocationEventModel.create({
        userIdHash,
        sessionId,
        ts: new Date(),
        source: input.source || 'manual',
        accuracyBucket:
          input.accuracyM !== undefined
            ? input.accuracyM <= 30
              ? 'high (<30m)'
              : input.accuracyM <= 100
              ? 'medium (30-100m)'
              : 'low (>100m)'
            : 'unknown',
        latRounded,
        lngRounded,
        locality: labelResult.locality,
        city: labelResult.city,
        district: labelResult.district,
        state: labelResult.state,
        pincode: labelResult.pincode,
        outcome: serviceability.status,
        serviceAreaId: serviceability.serviceAreaId,
        device: input.device || 'mobile',
      });

      // Update daily aggregated demand
      if (labelResult.pincode) {
        await LocationDemandDailyModel.updateOne(
          { date: today, pincode: labelResult.pincode },
          {
            $setOnInsert: {
              city: labelResult.city,
              state: labelResult.state,
              locality: labelResult.locality,
              serviceable: serviceability.isServiceable,
            },
            $inc: { queries: 1, uniqueUsers: 1 },
          },
          { upsert: true }
        );
      }
    } catch (err) {
      logger.warn({ err }, 'Failed to record location analytics event');
    }
  }

  /**
   * Registers a customer on the "Coming Soon" Area Waitlist
   */
  public static async joinWaitlist(params: {
    userId?: string;
    email: string;
    phone?: string;
    pincode: string;
    locality: string;
    city: string;
    state: string;
    consentTextVersion?: string;
  }): Promise<{ success: boolean; waitlistCount: number; message: string }> {
    const cleanEmail = params.email.trim().toLowerCase();
    const cleanPincode = params.pincode.trim();

    if (!cleanEmail || !cleanPincode) {
      throw new Error('Email and PIN code are required to join the waitlist');
    }

    // Upsert waitlist entry
    await AreaWaitlistModel.updateOne(
      { email: cleanEmail, pincode: cleanPincode },
      {
        $set: {
          userId: params.userId,
          phone: params.phone?.trim(),
          locality: params.locality.trim(),
          city: params.city.trim(),
          state: params.state.trim(),
          consent: {
            textVersion: params.consentTextVersion || 'v1.0',
            at: new Date(),
          },
          status: 'waiting',
        },
      },
      { upsert: true }
    );

    // Increment waitlist count in daily aggregation
    const today = new Date().toISOString().slice(0, 10);
    await LocationDemandDailyModel.updateOne(
      { date: today, pincode: cleanPincode },
      {
        $setOnInsert: {
          city: params.city.trim(),
          state: params.state.trim(),
          locality: params.locality.trim(),
          serviceable: false,
        },
        $inc: { waitlistCount: 1 },
      },
      { upsert: true }
    );

    const totalWaiting = await AreaWaitlistModel.countDocuments({
      pincode: cleanPincode,
      status: 'waiting',
    });

    return {
      success: true,
      waitlistCount: totalWaiting,
      message: `You're on the list! We'll notify you the moment we launch in ${params.locality || params.city}.`,
    };
  }

  /**
   * Admin: List service areas with pagination & filtering
   */
  public static async listServiceAreas(filter?: { city?: string; status?: string; search?: string }) {
    const query: any = {};
    if (filter?.status) query.status = filter.status;
    if (filter?.city) query.city = new RegExp(filter.city, 'i');
    if (filter?.search) {
      query.$or = [
        { pincode: new RegExp(filter.search, 'i') },
        { city: new RegExp(filter.search, 'i') },
        { locality: new RegExp(filter.search, 'i') },
      ];
    }

    return ServiceAreaModel.find(query).sort({ status: 1, city: 1, pincode: 1 }).lean();
  }

  /**
   * Admin: Create a service area
   */
  public static async createServiceArea(data: Partial<IServiceArea>) {
    const area = await ServiceAreaModel.create(data);

    // Broadcast serviceability update to clients in real-time
    realtimeService.emitToAdmins('location.serviceability.changed', {
      action: 'created',
      area,
    });

    return area;
  }

  /**
   * Admin: Update service area
   */
  public static async updateServiceArea(id: string, data: Partial<IServiceArea>) {
    const area = await ServiceAreaModel.findByIdAndUpdate(id, { $set: data }, { new: true });
    if (!area) throw new Error('Service area not found');

    realtimeService.emitToAdmins('location.serviceability.changed', {
      action: 'updated',
      area,
    });

    return area;
  }

  /**
   * Admin: Delete service area
   */
  public static async deleteServiceArea(id: string) {
    const area = await ServiceAreaModel.findByIdAndDelete(id);
    if (!area) throw new Error('Service area not found');

    realtimeService.emitToAdmins('location.serviceability.changed', {
      action: 'deleted',
      id,
    });

    return { success: true };
  }

  /**
   * Admin: Bulk import service areas (e.g., CSV upload)
   */
  public static async bulkImportServiceAreas(areas: Array<Partial<IServiceArea>>) {
    const ops = areas.map((a) => ({
      updateOne: {
        filter: { pincode: a.pincode },
        update: { $set: { ...a, status: a.status || 'active' } },
        upsert: true,
      },
    }));

    const result = await ServiceAreaModel.bulkWrite(ops);

    realtimeService.emitToAdmins('location.serviceability.changed', {
      action: 'bulk_import',
      count: areas.length,
    });

    return result;
  }

  /**
   * Admin: Update serviceability settings
   */
  public static async updateSettings(data: {
    enforcement?: 'off' | 'report_only' | 'on';
    allowBrowseWhenUnserviceable?: boolean;
    minDemandDisplayThreshold?: number;
    deliverySlots?: any[];
  }) {
    const settings = await ServiceabilitySettingsModel.findOneAndUpdate(
      { key: 'GLOBAL' },
      { $set: data },
      { new: true, upsert: true }
    );

    realtimeService.emitToAdmins('location.settings.updated', settings);
    return settings;
  }

  /**
   * Admin: Retrieve Demand Dashboard analytics
   */
  public static async getDemandAnalytics() {
    // Top unserviceable PIN codes by waitlist subscribers & query frequency
    const topWaitlist = await AreaWaitlistModel.aggregate([
      { $match: { status: 'waiting' } },
      {
        $group: {
          _id: '$pincode',
          locality: { $first: '$locality' },
          city: { $first: '$city' },
          state: { $first: '$state' },
          waitlistCount: { $sum: 1 },
          firstRequest: { $min: '$createdAt' },
          lastRequest: { $max: '$createdAt' },
        },
      },
      { $sort: { waitlistCount: -1 } },
      { $limit: 25 },
    ]);

    const totalWaitlistSubscribers = await AreaWaitlistModel.countDocuments({ status: 'waiting' });
    const totalServiceAreas = await ServiceAreaModel.countDocuments();
    const activeServiceAreas = await ServiceAreaModel.countDocuments({ status: 'active' });

    // Recent 7 days unserviceable query trends
    const recentDemand = await LocationDemandDailyModel.find({ serviceable: false })
      .sort({ date: -1 })
      .limit(100)
      .lean();

    return {
      totalWaitlistSubscribers,
      totalServiceAreas,
      activeServiceAreas,
      topUnserviceableAreas: topWaitlist,
      recentDemand,
    };
  }

  /**
   * Admin: Notify waitlist subscribers when a PIN code launches
   */
  public static async notifyWaitlistSubscribers(pincode: string) {
    const waiting = await AreaWaitlistModel.find({ pincode: pincode.trim(), status: 'waiting' });
    if (waiting.length === 0) return { notifiedCount: 0 };

    await AreaWaitlistModel.updateMany(
      { pincode: pincode.trim(), status: 'waiting' },
      { $set: { status: 'notified', notifiedAt: new Date() } }
    );

    // Also activate or ensure ServiceArea exists
    await ServiceAreaModel.updateOne(
      { pincode: pincode.trim() },
      { $set: { status: 'active', launchDate: new Date() } },
      { upsert: false }
    );

    logger.info({ pincode, count: waiting.length }, 'Notified waitlist subscribers for newly launched area');
    return { notifiedCount: waiting.length };
  }
}
