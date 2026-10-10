import mongoose from 'mongoose';
import { MerchantModel, IMerchant } from './merchant.model.js';
import { ProductModel, IProduct } from '../catalog/product.model.js';
import { NotFoundError, BadRequestError } from '../../common/errors/app-error.js';

export class MerchantService {
  static async listActiveMerchants(): Promise<IMerchant[]> {
    return MerchantModel.find({ isActive: true }).sort({ rating: -1, businessName: 1 });
  }

  static async getMerchantById(id: string): Promise<IMerchant> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestError('Invalid merchant ID format');
    }
    const merchant = await MerchantModel.findById(id);
    if (!merchant || !merchant.isActive) {
      throw new NotFoundError('Merchant not found or inactive');
    }
    return merchant;
  }

  static async getMerchantBySlug(slug: string): Promise<IMerchant> {
    const merchant = await MerchantModel.findOne({ slug: slug.toLowerCase(), isActive: true });
    if (!merchant) {
      throw new NotFoundError(`Merchant with slug '${slug}' not found`);
    }
    return merchant;
  }

  static async getMerchantProducts(merchantId: string): Promise<IProduct[]> {
    if (!mongoose.Types.ObjectId.isValid(merchantId)) {
      throw new BadRequestError('Invalid merchant ID format');
    }
    return ProductModel.find({ merchantId, isActive: true }).sort({ name: 1 });
  }
}
