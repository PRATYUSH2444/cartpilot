import mongoose from 'mongoose';
import { StockReservationModel, IStockReservation } from './stock-reservation.model.js';
import { ProductModel } from '../catalog/product.model.js';
import { AppError } from '../../common/errors/app-error.js';
import { logger } from '../../common/logging/logger.js';

export interface ReservationItemInput {
  productId: string | mongoose.Types.ObjectId;
  quantity: number;
}

export class InventoryService {
  public static readonly RESERVATION_TTL_MS = 15 * 60 * 1000; // 15 Minutes TTL

  /**
   * Concurrency-safe atomic inventory reservation.
   * Decrements availableStock and increments reservedStock atomically.
   * If any line item cannot be fulfilled, rolls back all previous deductions.
   */
  public static async reserveStock(
    userId: string | mongoose.Types.ObjectId,
    cartId: string | mongoose.Types.ObjectId,
    items: ReservationItemInput[]
  ): Promise<IStockReservation> {
    if (!items || items.length === 0) {
      throw new AppError('EMPTY_RESERVATION', 'Cannot reserve stock for empty items', 400);
    }

    const reservedSoFar: { productId: mongoose.Types.ObjectId; quantity: number }[] = [];

    try {
      for (const item of items) {
        const productObjId = new mongoose.Types.ObjectId(item.productId);

        const updatedProduct = await ProductModel.findOneAndUpdate(
          {
            _id: productObjId,
            availableStock: { $gte: item.quantity },
            isActive: true,
          },
          {
            $inc: {
              availableStock: -item.quantity,
              reservedStock: item.quantity,
            },
          },
          { new: true }
        );

        if (!updatedProduct) {
          const product = await ProductModel.findById(productObjId);
          const productName = product ? product.name : item.productId.toString();
          const available = product ? product.availableStock : 0;

          throw new AppError(
            'INSUFFICIENT_STOCK',
            `Insufficient stock for "${productName}". Requested: ${item.quantity}, Available: ${available}`,
            409,
            { productId: item.productId, requested: item.quantity, available }
          );
        }

        reservedSoFar.push({ productId: productObjId, quantity: item.quantity });
      }

      const expiresAt = new Date(Date.now() + this.RESERVATION_TTL_MS);
      const reservation = await StockReservationModel.create({
        userId: new mongoose.Types.ObjectId(userId),
        cartId: new mongoose.Types.ObjectId(cartId),
        items: reservedSoFar,
        status: 'ACTIVE',
        expiresAt,
      });

      logger.info(
        { reservationId: reservation._id, userId, itemCount: items.length },
        'Stock reservation created successfully'
      );

      return reservation;
    } catch (err) {
      // Rollback any items reserved in this batch
      if (reservedSoFar.length > 0) {
        logger.warn(
          { count: reservedSoFar.length },
          'Rolling back partial stock reservations due to failure'
        );
        for (const reserved of reservedSoFar) {
          await ProductModel.updateOne(
            { _id: reserved.productId },
            {
              $inc: {
                availableStock: reserved.quantity,
                reservedStock: -reserved.quantity,
              },
            }
          );
        }
      }
      throw err;
    }
  }

  /**
   * Consumes an active stock reservation upon successful payment verification.
   * Permanently deducts reserved stock.
   */
  public static async consumeReservation(
    reservationId: string | mongoose.Types.ObjectId
  ): Promise<IStockReservation | null> {
    const reservation = await StockReservationModel.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(reservationId), status: 'ACTIVE' },
      { status: 'CONSUMED' },
      { new: true }
    );

    if (!reservation) {
      return null;
    }

    // Decrement reserved stock permanently
    for (const item of reservation.items) {
      await ProductModel.updateOne(
        { _id: item.productId },
        {
          $inc: { reservedStock: -item.quantity },
        }
      );
    }

    logger.info({ reservationId }, 'Stock reservation consumed permanently');
    return reservation;
  }

  /**
   * Releases an active stock reservation (e.g., checkout abandoned or payment failed).
   * Restores available stock and decrements reserved stock.
   */
  public static async releaseReservation(
    reservationId: string | mongoose.Types.ObjectId
  ): Promise<IStockReservation | null> {
    const reservation = await StockReservationModel.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(reservationId), status: 'ACTIVE' },
      { status: 'RELEASED' },
      { new: true }
    );

    if (!reservation) {
      return null;
    }

    // Restore stock
    for (const item of reservation.items) {
      await ProductModel.updateOne(
        { _id: item.productId },
        {
          $inc: {
            availableStock: item.quantity,
            reservedStock: -item.quantity,
          },
        }
      );
    }

    logger.info({ reservationId }, 'Stock reservation released; stock restored to catalog');
    return reservation;
  }

  /**
   * Sweeper job to identify and release expired reservations.
   */
  public static async sweepExpiredReservations(): Promise<number> {
    const now = new Date();
    const expiredReservations = await StockReservationModel.find({
      status: 'ACTIVE',
      expiresAt: { $lt: now },
    });

    let sweptCount = 0;
    for (const res of expiredReservations) {
      const updated = await StockReservationModel.findOneAndUpdate(
        { _id: res._id, status: 'ACTIVE' },
        { status: 'EXPIRED' },
        { new: true }
      );

      if (updated) {
        for (const item of res.items) {
          await ProductModel.updateOne(
            { _id: item.productId },
            {
              $inc: {
                availableStock: item.quantity,
                reservedStock: -item.quantity,
              },
            }
          );
        }
        sweptCount++;
      }
    }

    if (sweptCount > 0) {
      logger.info({ sweptCount }, 'Swept expired stock reservations and restored stock');
    }

    return sweptCount;
  }
}
