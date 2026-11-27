import { Router, Request, Response } from 'express';
import { MapsService } from './maps.service.js';

export const locationRouter = Router();

/**
 * GET /api/v1/location/geocode
 */
locationRouter.get('/geocode', async (req: Request, res: Response) => {
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
});

/**
 * GET /api/v1/location/reverse-geocode
 */
locationRouter.get('/reverse-geocode', async (req: Request, res: Response) => {
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
});

/**
 * GET /api/v1/location/autocomplete
 */
locationRouter.get('/autocomplete', async (req: Request, res: Response) => {
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
});

/**
 * GET /api/v1/location/place-details
 */
locationRouter.get('/place-details', async (req: Request, res: Response) => {
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
});

/**
 * POST & GET /api/v1/location/serviceability
 */
const handleServiceability = async (req: Request, res: Response) => {
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
};

locationRouter.get('/serviceability', handleServiceability);
locationRouter.post('/serviceability', handleServiceability);

/**
 * GET /api/v1/location/config
 */
locationRouter.get('/config', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    data: {
      defaultCenter: {
        latitude: 25.5941,
        longitude: 85.1376,
        city: 'Patna',
        state: 'Bihar',
        locality: 'Boring Road',
        pincode: '800001',
      },
      standardDeliveryRadiusKm: 30,
      activeRegion: 'Patna, Bihar',
      deliveryModel: 'NEXT_DAY_SLOT',
      slots: [
        { id: 'morning', label: 'Morning Slot (7:00 AM - 10:00 AM)' },
        { id: 'evening', label: 'Evening Slot (5:00 PM - 9:00 PM)' },
      ],
      hasGoogleMaps: Boolean(process.env.GOOGLE_MAPS_API_KEY && process.env.GOOGLE_MAPS_API_KEY !== 'your_google_maps_key_here'),
    },
  });
});
