import { Request, Response } from 'express';
import { isDatabaseConnected } from '../../database/connection.js';

export function getLiveness(_req: Request, res: Response): void {
  res.status(200).json({
    success: true,
    data: {
      status: 'UP',
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      service: 'cartpilot-api',
      version: '0.1.0',
    },
  });
}

export function getReadiness(_req: Request, res: Response): void {
  const dbConnected = isDatabaseConnected();

  if (dbConnected) {
    res.status(200).json({
      success: true,
      data: {
        status: 'READY',
        dependencies: {
          database: 'CONNECTED',
        },
        timestamp: new Date().toISOString(),
      },
    });
  } else {
    res.status(503).json({
      success: false,
      error: {
        code: 'SERVICE_NOT_READY',
        message: 'Database connection is not currently established',
        details: {
          database: 'DISCONNECTED',
        },
      },
    });
  }
}
