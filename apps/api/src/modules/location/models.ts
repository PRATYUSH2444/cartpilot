import mongoose, { Schema, Document } from 'mongoose';

// ── Service Areas ─────────────────────────────────────────────────────────────
export interface IServiceArea extends Document {
  pincode: string;
  city: string;
  district?: string;
  state: string;
  locality?: string;
  type: 'pincode' | 'city' | 'locality' | 'radius';
  centre?: {
    lat: number;
    lng: number;
  };
  radiusKm?: number;
  status: 'active' | 'planned' | 'paused';
  storeId?: string;
  launchDate?: Date;
  notes?: string;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ServiceAreaSchema = new Schema<IServiceArea>(
  {
    pincode: { type: String, required: true, trim: true, index: true },
    city: { type: String, required: true, trim: true, index: true },
    district: { type: String, trim: true },
    state: { type: String, required: true, trim: true },
    locality: { type: String, trim: true },
    type: {
      type: String,
      enum: ['pincode', 'city', 'locality', 'radius'],
      default: 'pincode',
    },
    centre: {
      lat: { type: Number },
      lng: { type: Number },
    },
    radiusKm: { type: Number, default: 25 },
    status: {
      type: String,
      enum: ['active', 'planned', 'paused'],
      default: 'active',
      index: true,
    },
    storeId: { type: String, trim: true },
    launchDate: { type: Date },
    notes: { type: String, trim: true },
    createdBy: { type: String, trim: true },
  },
  { timestamps: true }
);

ServiceAreaSchema.index({ status: 1, pincode: 1 });
ServiceAreaSchema.index({ city: 1, status: 1 });

export const ServiceAreaModel = mongoose.model<IServiceArea>(
  'ServiceArea',
  ServiceAreaSchema,
  'service_areas'
);

// ── Physical Stores / Dark Store Hubs ─────────────────────────────────────────
export interface IStore extends Document {
  storeId: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  serviceRadiusKm: number;
  status: 'active' | 'paused' | 'closed';
  createdAt: Date;
  updatedAt: Date;
}

const StoreSchema = new Schema<IStore>(
  {
    storeId: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    serviceRadiusKm: { type: Number, default: 30 },
    status: {
      type: String,
      enum: ['active', 'paused', 'closed'],
      default: 'active',
    },
  },
  { timestamps: true }
);

export const StoreModel = mongoose.model<IStore>('Store', StoreSchema, 'stores');

// ── Location Events (Analytics with 180-day TTL) ──────────────────────────────
export interface ILocationEvent extends Document {
  userIdHash?: string;
  sessionId: string;
  ts: Date;
  source: 'gps' | 'manual' | 'ip' | 'saved';
  accuracyBucket: string;
  latRounded?: number; // ~2 decimals for strict privacy
  lngRounded?: number;
  locality?: string;
  city?: string;
  district?: string;
  state?: string;
  pincode?: string;
  outcome:
    | 'serviceable'
    | 'not_serviceable'
    | 'denied'
    | 'timeout'
    | 'unavailable'
    | 'manual';
  serviceAreaId?: string;
  device: 'mobile' | 'tablet' | 'desktop';
}

const LocationEventSchema = new Schema<ILocationEvent>(
  {
    userIdHash: { type: String, trim: true },
    sessionId: { type: String, required: true, trim: true, index: true },
    ts: { type: Date, default: Date.now },
    source: {
      type: String,
      enum: ['gps', 'manual', 'ip', 'saved'],
      default: 'manual',
    },
    accuracyBucket: { type: String, default: 'unknown' },
    latRounded: { type: Number },
    lngRounded: { type: Number },
    locality: { type: String, trim: true },
    city: { type: String, trim: true, index: true },
    district: { type: String, trim: true },
    state: { type: String, trim: true },
    pincode: { type: String, trim: true, index: true },
    outcome: {
      type: String,
      enum: [
        'serviceable',
        'not_serviceable',
        'denied',
        'timeout',
        'unavailable',
        'manual',
      ],
      required: true,
      index: true,
    },
    serviceAreaId: { type: String, trim: true },
    device: {
      type: String,
      enum: ['mobile', 'tablet', 'desktop'],
      default: 'mobile',
    },
  },
  { timestamps: false }
);

// 180-day TTL index for automated data retention compliance
LocationEventSchema.index({ ts: 1 }, { expireAfterSeconds: 180 * 24 * 60 * 60 });
LocationEventSchema.index({ pincode: 1, ts: -1 });

export const LocationEventModel = mongoose.model<ILocationEvent>(
  'LocationEvent',
  LocationEventSchema,
  'location_events'
);

// ── Daily Location Demand Aggregations ────────────────────────────────────────
export interface ILocationDemandDaily extends Document {
  date: string; // YYYY-MM-DD
  pincode: string;
  city: string;
  state: string;
  locality?: string;
  queries: number;
  uniqueUsers: number;
  serviceable: boolean;
  waitlistCount?: number;
}

const LocationDemandDailySchema = new Schema<ILocationDemandDaily>(
  {
    date: { type: String, required: true, index: true },
    pincode: { type: String, required: true, index: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    locality: { type: String },
    queries: { type: Number, default: 1 },
    uniqueUsers: { type: Number, default: 1 },
    serviceable: { type: Boolean, default: false },
    waitlistCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

LocationDemandDailySchema.index({ date: 1, pincode: 1 }, { unique: true });

export const LocationDemandDailyModel = mongoose.model<ILocationDemandDaily>(
  'LocationDemandDaily',
  LocationDemandDailySchema,
  'location_demand_daily'
);

// ── Area Waitlist (Coming Soon Subscriptions) ─────────────────────────────────
export interface IAreaWaitlist extends Document {
  userId?: string;
  email: string;
  phone?: string;
  pincode: string;
  locality: string;
  city: string;
  state: string;
  consent: {
    textVersion: string;
    at: Date;
  };
  status: 'waiting' | 'notified' | 'converted';
  createdAt: Date;
  notifiedAt?: Date;
}

const AreaWaitlistSchema = new Schema<IAreaWaitlist>(
  {
    userId: { type: String, trim: true, index: true },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    phone: { type: String, trim: true },
    pincode: { type: String, required: true, trim: true, index: true },
    locality: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    consent: {
      textVersion: { type: String, default: 'v1.0' },
      at: { type: Date, default: Date.now },
    },
    status: {
      type: String,
      enum: ['waiting', 'notified', 'converted'],
      default: 'waiting',
      index: true,
    },
    notifiedAt: { type: Date },
  },
  { timestamps: true }
);

AreaWaitlistSchema.index({ email: 1, pincode: 1 }, { unique: true });

export const AreaWaitlistModel = mongoose.model<IAreaWaitlist>(
  'AreaWaitlist',
  AreaWaitlistSchema,
  'area_waitlist'
);

// ── Geocode Cache (TTL-indexed) ───────────────────────────────────────────────
export interface IGeocodeCache extends Document {
  key: string;
  normalisedResult: any;
  provider: string;
  createdAt: Date;
}

const GeocodeCacheSchema = new Schema<IGeocodeCache>(
  {
    key: { type: String, required: true, unique: true, index: true },
    normalisedResult: { type: Schema.Types.Mixed, required: true },
    provider: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

// Configurable TTL index: default 30 days
GeocodeCacheSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

export const GeocodeCacheModel = mongoose.model<IGeocodeCache>(
  'GeocodeCache',
  GeocodeCacheSchema,
  'geocode_cache'
);

// ── Global Serviceability Settings ────────────────────────────────────────────
export interface IServiceabilitySettings extends Document {
  key: string; // 'GLOBAL'
  enforcement: 'off' | 'report_only' | 'on';
  allowBrowseWhenUnserviceable: boolean;
  minDemandDisplayThreshold: number;
  deliverySlots: Array<{
    id: string;
    label: string;
    cutoffTime: string;
    startHour: number;
    endHour: number;
  }>;
  updatedBy?: string;
  updatedAt: Date;
}

const ServiceabilitySettingsSchema = new Schema<IServiceabilitySettings>(
  {
    key: { type: String, default: 'GLOBAL', unique: true },
    enforcement: {
      type: String,
      enum: ['off', 'report_only', 'on'],
      default: 'on',
    },
    allowBrowseWhenUnserviceable: { type: Boolean, default: false },
    minDemandDisplayThreshold: { type: Number, default: 3 },
    deliverySlots: [
      {
        id: { type: String },
        label: { type: String },
        cutoffTime: { type: String },
        startHour: { type: Number },
        endHour: { type: Number },
      },
    ],
    updatedBy: { type: String },
  },
  { timestamps: true }
);

export const ServiceabilitySettingsModel = mongoose.model<IServiceabilitySettings>(
  'ServiceabilitySettings',
  ServiceabilitySettingsSchema,
  'serviceability_settings'
);
