import mongoose, { FilterQuery } from 'mongoose';
import { ProductModel, IProduct } from './product.model.js';
import { ProductSearchQuery } from './catalog.schema.js';
import { NotFoundError, BadRequestError } from '../../common/errors/app-error.js';

export interface CatalogSearchResult {
  products: IProduct[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class CatalogService {
  static async searchCatalog(params: ProductSearchQuery): Promise<CatalogSearchResult> {
    const filter: FilterQuery<IProduct> = {
      isActive: true,
      isVegetarian: true, // Non-negotiable vegetarian constraint
    };

    if (params.category) {
      filter.category = params.category;
    }

    if (params.merchantId) {
      if (!mongoose.Types.ObjectId.isValid(params.merchantId)) {
        throw new BadRequestError('Invalid merchantId filter format');
      }
      filter.merchantId = new mongoose.Types.ObjectId(params.merchantId);
    }

    if (params.minPricePaise !== undefined || params.maxPricePaise !== undefined) {
      filter.pricePaise = {};
      if (params.minPricePaise !== undefined) {
        filter.pricePaise.$gte = params.minPricePaise;
      }
      if (params.maxPricePaise !== undefined) {
        filter.pricePaise.$lte = params.maxPricePaise;
      }
    }

    if (params.inStockOnly) {
      filter.availableStock = { $gt: 0 };
    }

    if (params.query && params.query.trim().length > 0) {
      const cleanTerm = params.query.trim().toLowerCase();
      // Regex pattern escaping special characters for safe search
      const escapedTerm = cleanTerm.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
      const searchRegex = new RegExp(escapedTerm, 'i');

      filter.$or = [{ aliases: searchRegex }, { name: searchRegex }, { description: searchRegex }];
    }

    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      ProductModel.find(filter)
        .populate('merchantId', 'businessName slug rating')
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ProductModel.countDocuments(filter),
    ]);

    return {
      products: products as unknown as IProduct[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  static async getProductById(id: string): Promise<IProduct> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestError('Invalid product ID format');
    }

    const product = await ProductModel.findOne({ _id: id, isActive: true }).populate(
      'merchantId',
      'businessName slug rating contactEmail'
    );

    if (!product) {
      throw new NotFoundError('Product not found or inactive');
    }

    return product;
  }

  static async getCategories(): Promise<Array<{ category: string; count: number }>> {
    const aggregate = await ProductModel.aggregate([
      { $match: { isActive: true, isVegetarian: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    return aggregate.map((item) => ({
      category: item._id as string,
      count: item.count as number,
    }));
  }
}
