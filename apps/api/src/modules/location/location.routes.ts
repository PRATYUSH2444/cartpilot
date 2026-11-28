import { Router, Request, Response, NextFunction } from 'express';
import { MapsService } from './maps.service.js';
import { LocationService } from './location.service.js';
import { requireAuth, requireRole, AuthenticatedRequest } from '../../common/middleware/auth.js';
import { ServiceAreaModel } from './models.js';

export const locationRouter = Router();

/**
 * GET /api/v1/location/geocode
 */
locationRouter.get('/geocode', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = (req.query.q || req.query.address) as string;
    if (!query) {
      res.status(400).json({ success: false, error: { message: 'Query parameter q or address is required' } });
      return;
    }

    const result = await MapsService.geocode(query);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/location/reverse-geocode
 */
locationRouter.get('/reverse-geocode', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const lat = parseFloat((req.query.lat || req.query.latitude) as string);
    const lng = parseFloat((req.query.lng || req.query.longitude || req.query.lon) as string);

    if (isNaN(lat) || isNaN(lng)) {
      res.status(400).json({ success: false, error: { message: 'Valid numeric lat and lng parameters are required' } });
      return;
    }

    const result = await MapsService.reverseGeocode(lat, lng);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/location/autocomplete
 */
locationRouter.get('/autocomplete', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = (req.query.q || req.query.input || '') as string;
    if (!input || input.trim().length < 2) {
      res.status(200).json({ success: true, data: [] });
      return;
    }

    const results = await MapsService.autocomplete(input);
    res.status(200).json({
      success: true,
      data: results,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/location/place-details
 */
locationRouter.get('/place-details', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const placeId = req.query.placeId as string;
    if (!placeId) {
      res.status(400).json({ success: false, error: { message: 'placeId is required' } });
      return;
    }

    const result = await MapsService.getPlaceDetails(placeId);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/location/resolve
 * Live resolution of GPS coordinates, manual address, or PIN code into
 * clean locality-level display strings & real-time serviceability verdict.
 */
locationRouter.post('/resolve', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const lat = parseFloat((req.body?.lat ?? req.body?.latitude) as string);
    const lng = parseFloat((req.body?.lng ?? req.body?.longitude) as string);
    const pincode = req.body?.pincode as string | undefined;
    const placeId = req.body?.placeId as string | undefined;
    const accuracyM = req.body?.accuracyM ? parseFloat(req.body.accuracyM) : undefined;
    const source = req.body?.source || 'manual';
    const sessionId = (req.body?.sessionId || req.headers['x-session-id'] || 'session_' + Date.now()) as string;
    const device = (req.body?.device || 'mobile') as 'mobile' | 'tablet' | 'desktop';

    const userId = (req as AuthenticatedRequest).user?.userId;

    const resolved = await LocationService.resolveLocation({
      lat: isNaN(lat) ? undefined : lat,
      lng: isNaN(lng) ? undefined : lng,
      pincode: pincode?.trim(),
      placeId,
      accuracyM,
      source,
      sessionId,
      userId,
      device,
    });

    res.status(200).json({
      success: true,
      data: resolved,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST & GET /api/v1/location/serviceability (Compatibility endpoint)
 */
const handleServiceability = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const lat = parseFloat((req.body?.lat ?? req.body?.latitude ?? req.query.lat ?? req.query.latitude) as string);
    const lng = parseFloat((req.body?.lng ?? req.body?.longitude ?? req.query.lng ?? req.query.longitude) as string);
    const pincode = (req.body?.pincode ?? req.query.pincode) as string | undefined;

    const result = await MapsService.checkServiceability(
      isNaN(lat) ? undefined : lat,
      isNaN(lng) ? undefined : lng,
      pincode
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

locationRouter.get('/serviceability', handleServiceability);
locationRouter.post('/serviceability', handleServiceability);

/**
 * GET /api/v1/location/service-info
 * Returns live active delivery areas, cities, and scheduled slots
 */
locationRouter.get('/service-info', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const [settings, activeAreas] = await Promise.all([
      LocationService.getSettings(),
      ServiceAreaModel.find({ status: 'active' }).select('pincode city locality state type').lean(),
    ]);

    const activeCities = Array.from(new Set(activeAreas.map((a) => a.city))).filter(Boolean);

    res.status(200).json({
      success: true,
      data: {
        enforcement: settings.enforcement,
        deliverySlots: settings.deliverySlots,
        minDemandDisplayThreshold: settings.minDemandDisplayThreshold,
        activeCities,
        totalActiveAreas: activeAreas.length,
        deliveryModel: 'NEXT_DAY_SCHEDULED',
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/location/waitlist
 * Subscribes user to the "Coming Soon" notification list for unserviceable areas
 */
locationRouter.post('/waitlist', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, phone, pincode, locality, city, state, consentTextVersion } = req.body || {};

    if (!email || !pincode) {
      res.status(400).json({
        success: false,
        error: { message: 'Email and PIN code are required to join the waitlist' },
      });
      return;
    }

    const userId = (req as AuthenticatedRequest).user?.userId;

    const result = await LocationService.joinWaitlist({
      userId,
      email,
      phone,
      pincode,
      locality: locality || 'Your Area',
      city: city || 'Your City',
      state: state || 'Your State',
      consentTextVersion,
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
});

// ── Admin Protected Endpoints ──────────────────────────────────────────────────

/**
 * GET /api/v1/location/admin/areas
 */
locationRouter.get('/admin/areas', requireAuth, requireRole('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { city, status, search } = req.query;
    const areas = await LocationService.listServiceAreas({
      city: city as string,
      status: status as string,
      search: search as string,
    });

    res.status(200).json({ success: true, data: areas });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/location/admin/areas
 */
locationRouter.post('/admin/areas', requireAuth, requireRole('ADMIN'), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const area = await LocationService.createServiceArea({
      ...req.body,
      createdBy: req.user?.email,
    });

    res.status(201).json({ success: true, data: area });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/v1/location/admin/areas/:id
 */
locationRouter.put('/admin/areas/:id', requireAuth, requireRole('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const areaId = req.params.id as string;
    const area = await LocationService.updateServiceArea(areaId, req.body);
    res.status(200).json({ success: true, data: area });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/v1/location/admin/areas/:id
 */
locationRouter.delete('/admin/areas/:id', requireAuth, requireRole('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const areaId = req.params.id as string;
    const result = await LocationService.deleteServiceArea(areaId);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/location/admin/areas/bulk
 */
locationRouter.post('/admin/areas/bulk', requireAuth, requireRole('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const areas = req.body?.areas || [];
    if (!Array.isArray(areas) || areas.length === 0) {
      res.status(400).json({ success: false, error: { message: 'areas array is required' } });
      return;
    }

    const result = await LocationService.bulkImportServiceAreas(areas);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/location/admin/settings
 */
locationRouter.get('/admin/settings', requireAuth, requireRole('ADMIN'), async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const settings = await LocationService.getSettings();
    res.status(200).json({ success: true, data: settings });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/v1/location/admin/settings
 */
locationRouter.put('/admin/settings', requireAuth, requireRole('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const settings = await LocationService.updateSettings(req.body);
    res.status(200).json({ success: true, data: settings });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/location/admin/demand-analytics
 */
locationRouter.get('/admin/demand-analytics', requireAuth, requireRole('ADMIN'), async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const analytics = await LocationService.getDemandAnalytics();
    res.status(200).json({ success: true, data: analytics });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/location/admin/areas/:pincode/notify
 */
locationRouter.post('/admin/areas/:pincode/notify', requireAuth, requireRole('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const pincode = req.params.pincode as string;
    const result = await LocationService.notifyWaitlistSubscribers(pincode);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});
