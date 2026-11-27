import mongoose, { Schema, Document, Model } from 'mongoose';

export type ProductCategory =
  | 'GRAINS'
  | 'PULSES'
  | 'DAIRY'
  | 'VEGETABLES'
  | 'SPICES'
  | 'OILS'
  | 'CONDIMENTS'
  | 'FRUITS_VEGETABLES'
  | 'DAIRY_BREAKFAST'
  | 'ATTA_RICE_DAL'
  | 'SNACKS_MUNCHIES'
  | 'COLD_DRINKS_JUICES'
  | 'BAKERY'
  | 'INSTANT_FROZEN_FOOD'
  | 'MASALA_DRY_FRUITS'
  | 'PERSONAL_CARE'
  | 'HOUSEHOLD_ESSENTIALS'
  | 'BABY_CARE'
  | 'PET_CARE';

export type PackageUnit = 'G' | 'KG' | 'ML' | 'L' | 'PIECE';

export interface IProduct extends Document {
  _id: mongoose.Types.ObjectId;
  merchantId: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  description: string;
  category: ProductCategory;
  pricePaise: number; // Integer paise (e.g. ₹45.00 -> 4500)
  packageSize: number; // e.g. 500
  packageUnit: PackageUnit; // e.g. 'G'
  availableStock: number;
  reservedStock: number;
  aliases: string[]; // Normalized aliases: ["pyaz", "kanda", "onion"]
  ingredientKeys: string[]; // Canonical lowercase ingredient keys: ["onion", "paneer"]
  isVegetarian: boolean; // Strictly vegetarian
  isActive: boolean;
  imageUrl?: string;
  brand?: string;
  subCategory?: string;
  mrpPaise?: number;
  rating?: number;
  reviewCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    merchantId: {
      type: Schema.Types.ObjectId,
      ref: 'Merchant',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: [
        'GRAINS',
        'PULSES',
        'DAIRY',
        'VEGETABLES',
        'SPICES',
        'OILS',
        'CONDIMENTS',
        'FRUITS_VEGETABLES',
        'DAIRY_BREAKFAST',
        'ATTA_RICE_DAL',
        'SNACKS_MUNCHIES',
        'COLD_DRINKS_JUICES',
        'BAKERY',
        'INSTANT_FROZEN_FOOD',
        'MASALA_DRY_FRUITS',
        'PERSONAL_CARE',
        'HOUSEHOLD_ESSENTIALS',
        'BABY_CARE',
        'PET_CARE',
      ],
      required: true,
      index: true,
    },
    pricePaise: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: Number.isInteger,
        message: 'pricePaise must be an integer representing currency in paise',
      },
    },
    packageSize: {
      type: Number,
      required: true,
      min: 1,
    },
    packageUnit: {
      type: String,
      enum: ['G', 'KG', 'ML', 'L', 'PIECE'],
      required: true,
    },
    availableStock: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
      validate: {
        validator: Number.isInteger,
        message: 'availableStock must be a non-negative integer',
      },
    },
    reservedStock: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
      validate: {
        validator: Number.isInteger,
        message: 'reservedStock must be a non-negative integer',
      },
    },
    aliases: {
      type: [String],
      default: [],
      index: true,
    },
    ingredientKeys: {
      type: [String],
      default: [],
      index: true,
    },
    isVegetarian: {
      type: Boolean,
      default: true,
      required: true,
      validate: {
        validator: (v: boolean) => v === true,
        message: 'CartPilot catalog accepts only strictly vegetarian products',
      },
    },
    isActive: {
      type: Boolean,
      default: true,
      required: true,
      index: true,
    },
    imageUrl: {
      type: String,
      trim: true,
    },
    brand: {
      type: String,
      trim: true,
    },
    subCategory: {
      type: String,
      trim: true,
      index: true,
    },
    mrpPaise: {
      type: Number,
      min: 0,
    },
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 4.8,
    },
    reviewCount: {
      type: Number,
      min: 0,
      default: 140,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Compound Index: Merchant SKU listing and category lookups
ProductSchema.index({ merchantId: 1, isActive: 1, category: 1 });

// Full text search index
ProductSchema.index(
  {
    name: 'text',
    description: 'text',
    aliases: 'text',
  },
  {
    weights: {
      name: 10,
      aliases: 8,
      description: 2,
    },
  }
);

export const ProductModel: Model<IProduct> =
  mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);
