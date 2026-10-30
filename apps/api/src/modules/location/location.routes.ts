import { Router, Request, Response } from 'express';
import { MapsService } from './maps.service.js';

export const locationRouter = Router();

locationRouter.get('/geocode', async (req: Request, res: Response) => {
  const query = req.query.q as string;
  if (!query) {
    res.status(400).json({ success: false, error: 'Query parameter q is required' });
    return;
  }

  const result = await MapsService.geocode(query);
  res.status(200).json({
    success: true,
    data: result,
  });
});

locationRouter.get('/reverse-geocode', async (req: Request, res: Response) => {
  const lat = parseFloat(req.query.lat as string);
  const lng = parseFloat(req.query.lng as string);

  if (isNaN(lat) || isNaN(lng)) {
    res.status(400).json({ success: false, error: 'Valid numeric lat and lng parameters are required' });
    return;
  }

  const result = await MapsService.reverseGeocode(lat, lng);
  res.status(200).json({
    success: true,
    data: result,
  });
});
