import mongoose, { Schema, Document, Model } from 'mongoose';

export type ProductCategory =
  'GRAINS' | 'PULSES' | 'DAIRY' | 'VEGETABLES' | 'SPICES' | 'OILS' | 'CONDIMENTS';

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
  isVegetarian: boolean; // Strictly vegetarian
  isActive: boolean;
  imageUrl?: string;
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
      enum: ['GRAINS', 'PULSES', 'DAIRY', 'VEGETABLES', 'SPICES', 'OILS', 'CONDIMENTS'],
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
