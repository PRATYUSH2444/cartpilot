import mongoose, { Schema, Document, Model } from 'mongoose';

export type IngredientRole = 'core' | 'optional' | 'pantry';

export interface IRecipeIngredient {
  key: string; // Canonical lowercase identifier (e.g. 'paneer', 'basmati_rice', 'tomato')
  name: string; // Human readable name (e.g. 'Fresh Malai Paneer')
  qtyPerServing: number; // Base quantity per 1 serving
  unit: 'g' | 'kg' | 'ml' | 'l' | 'tsp' | 'tbsp' | 'piece';
  role: IngredientRole; // 'core' (essential), 'optional' (flavor enhancer), 'pantry' (oil/salt/spices)
  scale?: 'linear' | 'sub'; // 'linear' for main items, 'sub' for spices/oil
  alt?: string[]; // Alternative canonical keys (e.g. ['tofu', 'soya_chunks'])
}

export interface IRecipePlan extends Document {
  _id: mongoose.Types.ObjectId;
  dishKey: string; // Normalized lowercase lookup key (e.g. 'paneer_butter_masala')
  dishName: string; // Display title (e.g. 'Paneer Butter Masala')
  cuisine: string; // e.g. 'North Indian', 'South Indian'
  diet: 'VEGETARIAN';
  servingsBase: number;
  ingredients: IRecipeIngredient[];
  sourceModel: string; // 'seed' | 'gemini-3.1-flash-lite' | 'gemini-2.5-flash-lite'
  hits: number; // Cache hit counter
  createdAt: Date;
  updatedAt: Date;
}

const RecipeIngredientSchema = new Schema<IRecipeIngredient>(
  {
    key: { type: String, required: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    qtyPerServing: { type: Number, required: true, min: 0.1 },
    unit: {
      type: String,
      enum: ['g', 'kg', 'ml', 'l', 'tsp', 'tbsp', 'piece'],
      required: true,
      lowercase: true,
    },
    role: {
      type: String,
      enum: ['core', 'optional', 'pantry'],
      default: 'core',
    },
    scale: {
      type: String,
      enum: ['linear', 'sub'],
      default: 'linear',
    },
    alt: { type: [String], default: [] },
  },
  { _id: false }
);

const RecipePlanSchema = new Schema<IRecipePlan>(
  {
    dishKey: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    dishName: { type: String, required: true, trim: true },
    cuisine: { type: String, default: 'Indian', trim: true },
    diet: { type: String, default: 'VEGETARIAN', enum: ['VEGETARIAN'] },
    servingsBase: { type: Number, required: true, default: 4, min: 1 },
    ingredients: { type: [RecipeIngredientSchema], required: true },
    sourceModel: { type: String, default: 'seed' },
    hits: { type: Number, default: 1, min: 0 },
  },
  {
    timestamps: true,
  }
);

RecipePlanSchema.index({ dishKey: 1 });
RecipePlanSchema.index({ hits: -1 });

export const RecipePlanModel: Model<IRecipePlan> =
  mongoose.models.RecipePlan || mongoose.model<IRecipePlan>('RecipePlan', RecipePlanSchema);
