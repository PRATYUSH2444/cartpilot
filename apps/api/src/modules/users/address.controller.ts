import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../common/middleware/auth.js';
import { AddressService } from './address.service.js';

export class AddressController {
  public static async listAddresses(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const addresses = await AddressService.getUserAddresses(req.user!.userId);
      res.status(200).json({
        success: true,
        data: addresses,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async getAddress(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const address = await AddressService.getAddressById(req.params.id as string, req.user!.userId);
      res.status(200).json({
        success: true,
        data: address,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async createAddress(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const address = await AddressService.createAddress(req.user!.userId, req.body);
      res.status(201).json({
        success: true,
        data: address,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async updateAddress(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const address = await AddressService.updateAddress(
        req.params.id as string,
        req.user!.userId,
        req.body
      );
      res.status(200).json({
        success: true,
        data: address,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async deleteAddress(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      await AddressService.deleteAddress(req.params.id as string, req.user!.userId);
      res.status(200).json({
        success: true,
        message: 'Address deleted successfully',
      });
    } catch (err) {
      next(err);
    }
  }

  public static async setDefaultAddress(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const address = await AddressService.setDefaultAddress(
        req.params.id as string,
        req.user!.userId
      );
      res.status(200).json({
        success: true,
        data: address,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async checkServiceability(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const pincode = (req.body?.pincode || req.query.pincode) as string;
      const result = AddressService.checkServiceability(pincode);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
}
