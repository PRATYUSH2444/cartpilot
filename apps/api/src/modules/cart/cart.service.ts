import mongoose from 'mongoose';
import { CartModel, ICart } from './cart.model.js';
import { ProductModel, IProduct } from '../catalog/product.model.js';
import { PricingService, CalculatedPricing } from '../pricing/pricing.service.js';
import { AppError, NotFoundError } from '../../common/errors/app-error.js';

export interface PopulatedCartItem {
  productId: string;
  name: string;
  slug: string;
  category: string;
  pricePaise: number;
  packageSize: number;
  packageUnit: string;
  availableStock: number;
  imageUrl?: string;
  quantity: number;
  itemTotalPaise: number;
  formattedItemTotal: string;
  addedAt: Date;
}

export interface CartResponse {
  id: string;
  userId: string;
  version: number;
  status: string;
  items: PopulatedCartItem[];
  pricing: CalculatedPricing;
  itemCount: number;
}

export class CartService {
  /**
   * Retrieves or creates an active cart for the specified user and computes authoritative pricing.
   */
  public static async getOrCreateActiveCart(userId: string): Promise<CartResponse> {
    const userObjectId = new mongoose.Types.ObjectId(userId);

    let cart = await CartModel.findOne({ userId: userObjectId, status: 'ACTIVE' });
    if (!cart) {
      cart = await CartModel.create({
        userId: userObjectId,
        items: [],
        version: 1,
        status: 'ACTIVE',
      });
    }

    return this.buildCartResponse(cart);
  }

  /**
   * Adds an item to the user's active cart. Atomic stock safety & monotonic version increment.
   */
  public static async addItem(
    userId: string,
    productId: string,
    quantity: number
  ): Promise<CartResponse> {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const productObjectId = new mongoose.Types.ObjectId(productId);

    // 1. Validate Product existence, activity, and stock
    const product = await ProductModel.findOne({ _id: productObjectId, isActive: true });
    if (!product) {
      throw new NotFoundError('Product not found or is currently unavailable');
    }

    // 2. Fetch or create cart
    let cart = await CartModel.findOne({ userId: userObjectId, status: 'ACTIVE' });
    if (!cart) {
      cart = new CartModel({
        userId: userObjectId,
        items: [],
        version: 1,
        status: 'ACTIVE',
      });
    }

    // 3. Check existing quantity
    const existingIndex = cart.items.findIndex((item) => item.productId.equals(productObjectId));
    const existingItem = existingIndex > -1 ? cart.items[existingIndex] : undefined;
    const existingQty = existingItem ? existingItem.quantity : 0;
    const requestedTotalQty = existingQty + quantity;

    if (requestedTotalQty > product.availableStock) {
      throw new AppError(
        'INSUFFICIENT_STOCK',
        `Requested quantity (${requestedTotalQty}) exceeds available stock (${product.availableStock}) for ${product.name}`,
        409,
        { availableStock: product.availableStock, requestedQuantity: requestedTotalQty }
      );
    }

    // 4. Update cart items array
    if (existingItem) {
      existingItem.quantity = requestedTotalQty;
      existingItem.addedAt = new Date();
    } else {
      cart.items.push({
        productId: productObjectId,
        quantity,
        addedAt: new Date(),
      });
    }

    // Monotonic version bump
    cart.version += 1;
    await cart.save();

    return this.buildCartResponse(cart);
  }

  /**
   * Updates the quantity of a specific product in the cart.
   * If quantity is 0, the item is removed.
   */
  public static async updateItemQuantity(
    userId: string,
    productId: string,
    quantity: number
  ): Promise<CartResponse> {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const productObjectId = new mongoose.Types.ObjectId(productId);

    const cart = await CartModel.findOne({ userId: userObjectId, status: 'ACTIVE' });
    if (!cart) {
      throw new NotFoundError('Active cart not found');
    }

    const itemIndex = cart.items.findIndex((item) => item.productId.equals(productObjectId));
    if (itemIndex === -1) {
      throw new NotFoundError('Item not found in your cart');
    }

    if (quantity === 0) {
      cart.items.splice(itemIndex, 1);
    } else {
      const product = await ProductModel.findOne({ _id: productObjectId, isActive: true });
      if (!product) {
        throw new NotFoundError('Product not found or unavailable');
      }

      if (quantity > product.availableStock) {
        throw new AppError(
          'INSUFFICIENT_STOCK',
          `Requested quantity (${quantity}) exceeds available stock (${product.availableStock}) for ${product.name}`,
          409,
          { availableStock: product.availableStock, requestedQuantity: quantity }
        );
      }

      const currentItem = cart.items[itemIndex];
      if (currentItem) {
        currentItem.quantity = quantity;
      }
    }

    cart.version += 1;
    await cart.save();

    return this.buildCartResponse(cart);
  }

  /**
   * Removes a specific item from the cart.
   */
  public static async removeItem(userId: string, productId: string): Promise<CartResponse> {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const productObjectId = new mongoose.Types.ObjectId(productId);

    const cart = await CartModel.findOne({ userId: userObjectId, status: 'ACTIVE' });
    if (!cart) {
      throw new NotFoundError('Active cart not found');
    }

    const initialLength = cart.items.length;
    cart.items = cart.items.filter((item) => !item.productId.equals(productObjectId));

    if (cart.items.length === initialLength) {
      throw new NotFoundError('Item not found in your cart');
    }

    cart.version += 1;
    await cart.save();

    return this.buildCartResponse(cart);
  }

  /**
   * Clears all items in the active cart.
   */
  public static async clearCart(userId: string): Promise<CartResponse> {
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const cart = await CartModel.findOne({ userId: userObjectId, status: 'ACTIVE' });
    if (!cart) {
      return this.getOrCreateActiveCart(userId);
    }

    cart.items = [];
    cart.version += 1;
    await cart.save();

    return this.buildCartResponse(cart);
  }

  /**
   * Helper that populates product details and applies authoritative pure server pricing.
   */
  private static async buildCartResponse(cart: ICart): Promise<CartResponse> {
    if (cart.items.length === 0) {
      const pricing = PricingService.calculate([]);
      return {
        id: cart._id.toString(),
        userId: cart.userId.toString(),
        version: cart.version,
        status: cart.status,
        items: [],
        pricing,
        itemCount: 0,
      };
    }

    const productIds = cart.items.map((i) => i.productId);
    const products = await ProductModel.find({ _id: { $in: productIds } });
    const productMap = new Map<string, IProduct>();
    for (const prod of products) {
      productMap.set(prod._id.toString(), prod);
    }

    const populatedItems: PopulatedCartItem[] = [];
    const pricingItems: { productId: string; pricePaise: number; quantity: number }[] = [];

    for (const cartItem of cart.items) {
      const prod = productMap.get(cartItem.productId.toString());
      if (prod && prod.isActive) {
        const itemTotalPaise = prod.pricePaise * cartItem.quantity;
        populatedItems.push({
          productId: prod._id.toString(),
          name: prod.name,
          slug: prod.slug,
          category: prod.category,
          pricePaise: prod.pricePaise,
          packageSize: prod.packageSize,
          packageUnit: prod.packageUnit,
          availableStock: prod.availableStock,
          imageUrl: prod.imageUrl,
          quantity: cartItem.quantity,
          itemTotalPaise,
          formattedItemTotal: PricingService.formatPaise(itemTotalPaise),
          addedAt: cartItem.addedAt,
        });

        pricingItems.push({
          productId: prod._id.toString(),
          pricePaise: prod.pricePaise,
          quantity: cartItem.quantity,
        });
      }
    }

    const pricing = PricingService.calculate(pricingItems);
    const totalItemCount = populatedItems.reduce((acc, it) => acc + it.quantity, 0);

    return {
      id: cart._id.toString(),
      userId: cart.userId.toString(),
      version: cart.version,
      status: cart.status,
      items: populatedItems,
      pricing,
      itemCount: totalItemCount,
    };
  }
}
