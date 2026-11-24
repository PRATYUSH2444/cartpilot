import { ProductModel, IProduct } from './product.model.js';
import { PricingService } from '../pricing/pricing.service.js';
import { logger } from '../../common/logging/logger.js';

export interface RawIngredientInput {
  name: string;
  quantity: number;
  unit: string;
  category?: string;
  isMandatory?: boolean;
  suggestedAlternative?: string;
}

export interface MatchedIngredientResult {
  ingredientName: string;
  requiredAmount: number;
  requiredUnit: string;
  status: 'AVAILABLE' | 'PARTIALLY_AVAILABLE' | 'OUT_OF_STOCK' | 'NOT_LISTED' | 'ALTERNATIVE_AVAILABLE';
  isMandatory: boolean;
  matchedProduct?: {
    id: string;
    name: string;
    category: string;
    packageSize: number;
    packageUnit: string;
    unitPricePaise: number;
    formattedUnitPrice: string;
    availableStock: number;
  };
  packCount: number;
  subtotalPaise: number;
  formattedSubtotal: string;
  surplusNote?: string;
  alternativeSuggestion?: {
    name: string;
    reason: string;
    availableProduct?: {
      id: string;
      name: string;
      packageSize: number;
      packageUnit: string;
      pricePaise: number;
      formattedPrice: string;
      availableStock: number;
    };
  };
}

export interface DynamicRecipeMatchingResult {
  dishName: string;
  servings: number;
  cuisine?: string;
  description?: string;
  instructions?: string[];
  totalIngredientsCount: number;
  availableCount: number;
  missingCount: number;
  items: MatchedIngredientResult[];
  availableItems: MatchedIngredientResult[];
  missingItems: MatchedIngredientResult[];
  pricing: {
    subtotalPaise: number;
    taxPaise: number;
    deliveryFeePaise: number;
    totalPaise: number;
    formatted: {
      subtotal: string;
      tax: string;
      delivery: string;
      total: string;
    };
  };
}

// Comprehensive Hindi / English / Regional culinary synonym dictionary
const INGREDIENT_SYNONYMS: Record<string, string[]> = {
  mushroom: ['mushroom', 'mushrooms', 'khumb', 'khumbi', 'button mushroom'],
  capsicum: ['capsicum', 'bell pepper', 'shimla mirch', 'green pepper'],
  onion: ['onion', 'onions', 'pyaz', 'kanda', 'red onion'],
  tomato: ['tomato', 'tomatoes', 'tamatar', 'country tomato', 'hybrid tomato'],
  potato: ['potato', 'potatoes', 'aloo', 'batata'],
  garlic: ['garlic', 'lasun', 'lahsun', 'garlic cloves'],
  ginger: ['ginger', 'adrak', 'fresh ginger'],
  chilli: ['chilli', 'chili', 'mirch', 'hari mirch', 'green chilli', 'green chilies'],
  spinach: ['spinach', 'palak', 'baby spinach'],
  peas: ['peas', 'green peas', 'matar', 'mutter'],
  paneer: ['paneer', 'cottage cheese', 'malai paneer', 'chenna'],
  tofu: ['tofu', 'soya paneer', 'soy tofu'],
  rice: ['rice', 'basmati', 'basmati rice', 'chawal', 'sona masoori'],
  flour: ['atta', 'wheat flour', 'gehu ka atta', 'whole wheat'],
  maida: ['maida', 'all purpose flour', 'refined flour'],
  besan: ['besan', 'gram flour', 'chickpea flour'],
  cornflour: ['cornflour', 'corn starch', 'corn flour'],
  ghee: ['ghee', 'desi ghee', 'cow ghee', 'clarified butter'],
  oil: ['oil', 'cooking oil', 'sunflower oil', 'mustard oil', 'sarson ka tel', 'tel'],
  dal: ['dal', 'daal', 'lentil', 'lentils', 'toor dal', 'moong dal', 'chana dal', 'urad dal'],
  coriander: ['coriander', 'dhania', 'cilantro', 'coriander leaves', 'dhania patta'],
  mint: ['mint', 'pudina', 'mint leaves'],
  cumin: ['cumin', 'jeera', 'zeera', 'cumin seeds'],
  mustard: ['mustard', 'rai', 'sarson', 'mustard seeds'],
  turmeric: ['turmeric', 'haldi', 'turmeric powder'],
  garam_masala: ['garam masala', 'shahi garam masala', 'mixed spices'],
  cashew: ['cashew', 'kaju', 'cashew nuts', 'cashew paste'],
  almond: ['almond', 'badam', 'almonds'],
  curd: ['curd', 'dahi', 'yogurt'],
  butter: ['butter', 'makhan', 'white butter'],
  soy_sauce: ['soy sauce', 'soya sauce', 'dark soy sauce'],
};

// Culinary alternative fallbacks when an ingredient is not in stock
const CULINARY_ALTERNATIVES: Record<string, { name: string; reason: string }> = {
  cornflour: { name: 'Refined Wheat Flour (Maida)', reason: 'Works as an effective thickening agent for gravies and batters' },
  tofu: { name: 'Fresh Malai Paneer', reason: 'High-protein vegetarian cottage cheese with similar texture' },
  cashew_paste: { name: 'Fresh Malai Paneer or Curd', reason: 'Provides creamy richness and body to curries' },
  cream: { name: 'Pure Cow Milk / Malai', reason: 'Fresh dairy substitute for richness in sauces' },
  mushroom: { name: 'Fresh Malai Paneer / Green Capsicum', reason: 'Great umami texture alternative in stir-fries' },
  soy_sauce: { name: 'Tamarind + Jaggery + Pinch of Salt', reason: 'Provides savory umami and depth of flavor' },
};

export class IngredientIntelligenceService {
  /**
   * Normalizes an ingredient query term using synonyms, plurals, and regional roots.
   */
  public static normalizeIngredientName(name: string): string[] {
    const clean = name.trim().toLowerCase().replace(/[^\w\s]/g, '');
    const tokens = clean.split(/\s+/);
    const searchTerms = new Set<string>();

    searchTerms.add(clean);
    for (const t of tokens) {
      if (t.length > 2) searchTerms.add(t);
      // Remove trailing 's' or 'es' for plurals
      if (t.endsWith('es')) searchTerms.add(t.slice(0, -2));
      else if (t.endsWith('s')) searchTerms.add(t.slice(0, -1));
    }

    // Check synonym map
    for (const [key, synonyms] of Object.entries(INGREDIENT_SYNONYMS)) {
      for (const syn of synonyms) {
        if (clean.includes(syn) || syn.includes(clean)) {
          searchTerms.add(key.replace('_', ' '));
          synonyms.forEach((s) => searchTerms.add(s));
          break;
        }
      }
    }

    return Array.from(searchTerms);
  }

  /**
   * Normalizes unit and quantity into standard metric units (G or ML).
   */
  public static normalizeUnit(quantity: number, rawUnit: string): { amount: number; unit: 'G' | 'KG' | 'ML' | 'L' | 'PIECE' } {
    const u = rawUnit.trim().toLowerCase();
    if (u === 'kg' || u === 'kilogram' || u === 'kgs') {
      return { amount: quantity * 1000, unit: 'G' };
    }
    if (u === 'l' || u === 'litre' || u === 'liter' || u === 'litres') {
      return { amount: quantity * 1000, unit: 'ML' };
    }
    if (u === 'tbsp' || u === 'tablespoon' || u === 'tablespoons') {
      return { amount: quantity * 15, unit: 'G' };
    }
    if (u === 'tsp' || u === 'teaspoon' || u === 'teaspoons') {
      return { amount: quantity * 5, unit: 'G' };
    }
    if (u === 'cup' || u === 'cups') {
      return { amount: quantity * 200, unit: 'G' };
    }
    if (u === 'pinch' || u === 'pinches') {
      return { amount: quantity * 2, unit: 'G' };
    }
    if (u === 'piece' || u === 'pieces' || u === 'pc' || u === 'pcs') {
      return { amount: quantity, unit: 'PIECE' };
    }
    if (u === 'ml' || u === 'millilitre') {
      return { amount: quantity, unit: 'ML' };
    }
    return { amount: quantity, unit: 'G' };
  }

  /**
   * Matches an arbitrary list of LLM-generated ingredients against the live MongoDB catalog.
   */
  public static async matchIngredientsToCatalog(
    ingredients: RawIngredientInput[],
    dishName = 'Custom Recipe',
    servings = 4,
    cuisine = 'Vegetarian',
    instructions: string[] = []
  ): Promise<DynamicRecipeMatchingResult> {
    logger.info(
      { dishName, servings, ingredientCount: ingredients.length },
      'Executing dynamic ingredient intelligence catalog matching'
    );

    const results: MatchedIngredientResult[] = [];
    let cumulativePaise = 0;

    for (const ing of ingredients) {
      const normalizedTerms = this.normalizeIngredientName(ing.name);
      const { amount, unit } = this.normalizeUnit(ing.quantity, ing.unit);

      // Search MongoDB for matching product
      let matchedProduct: IProduct | null = null;

      // 1. Exact alias or name search
      for (const term of normalizedTerms) {
        matchedProduct = await ProductModel.findOne({
          isVegetarian: true,
          isPublished: true,
          isArchived: { $ne: true },
          $or: [
            { aliases: { $in: [term] } },
            { name: { $regex: new RegExp(`\\b${term}\\b`, 'i') } },
          ],
        }).sort({ availableStock: -1 });

        if (matchedProduct) break;
      }

      // 2. Fallback fuzzy regex search if no exact alias hit
      if (!matchedProduct && normalizedTerms.length > 0) {
        const regexPatterns = normalizedTerms.map((t) => ({
          name: { $regex: new RegExp(t, 'i') },
        }));
        matchedProduct = await ProductModel.findOne({
          isVegetarian: true,
          isPublished: true,
          isArchived: { $ne: true },
          $or: regexPatterns,
        }).sort({ availableStock: -1 });
      }

      if (matchedProduct) {
        const isOutOfStock = matchedProduct.availableStock <= 0;
        const packSize = matchedProduct.packageSize || 100;

        // Calculate package count needed
        let packCount = 1;
        if (unit === 'G' && matchedProduct.packageUnit === 'G') {
          packCount = Math.max(1, Math.ceil(amount / packSize));
        } else if (unit === 'ML' && matchedProduct.packageUnit === 'ML') {
          packCount = Math.max(1, Math.ceil(amount / packSize));
        } else if (unit === 'PIECE' && matchedProduct.packageUnit === 'PIECE') {
          packCount = Math.max(1, Math.ceil(amount / packSize));
        }

        const subtotalPaise = isOutOfStock ? 0 : matchedProduct.pricePaise * packCount;
        cumulativePaise += subtotalPaise;

        const surplus = packCount * packSize - amount;
        const surplusNote =
          surplus > 0
            ? `${amount}${unit.toLowerCase()} required (${packCount} × ${packSize}${matchedProduct.packageUnit.toLowerCase()}, ${surplus}${matchedProduct.packageUnit.toLowerCase()} surplus)`
            : `${amount}${unit.toLowerCase()} required (exact match)`;

        results.push({
          ingredientName: ing.name,
          requiredAmount: amount,
          requiredUnit: unit,
          status: isOutOfStock ? 'OUT_OF_STOCK' : 'AVAILABLE',
          isMandatory: ing.isMandatory !== false,
          matchedProduct: {
            id: matchedProduct._id.toString(),
            name: matchedProduct.name,
            category: matchedProduct.category,
            packageSize: matchedProduct.packageSize,
            packageUnit: matchedProduct.packageUnit,
            unitPricePaise: matchedProduct.pricePaise,
            formattedUnitPrice: PricingService.formatPaise(matchedProduct.pricePaise),
            availableStock: matchedProduct.availableStock,
          },
          packCount,
          subtotalPaise,
          formattedSubtotal: PricingService.formatPaise(subtotalPaise),
          surplusNote,
        });
      } else {
        // Missing from store: Check if a culinary alternative can be suggested
        const cleanName = ing.name.toLowerCase();
        let altConfig: { name: string; reason: string } | undefined;

        for (const [key, alt] of Object.entries(CULINARY_ALTERNATIVES)) {
          if (cleanName.includes(key.replace('_', ' '))) {
            altConfig = alt;
            break;
          }
        }

        let alternativeProductResult: any = undefined;
        if (altConfig) {
          const altTerms = this.normalizeIngredientName(altConfig.name);
          const altProd = await ProductModel.findOne({
            isVegetarian: true,
            isPublished: true,
            isArchived: { $ne: true },
            availableStock: { $gt: 0 },
            $or: altTerms.map((t) => ({ name: { $regex: new RegExp(t, 'i') } })),
          });

          if (altProd) {
            alternativeProductResult = {
              id: altProd._id.toString(),
              name: altProd.name,
              packageSize: altProd.packageSize,
              packageUnit: altProd.packageUnit,
              pricePaise: altProd.pricePaise,
              formattedPrice: PricingService.formatPaise(altProd.pricePaise),
              availableStock: altProd.availableStock,
            };
          }
        }

        results.push({
          ingredientName: ing.name,
          requiredAmount: amount,
          requiredUnit: unit,
          status: alternativeProductResult ? 'ALTERNATIVE_AVAILABLE' : 'NOT_LISTED',
          isMandatory: ing.isMandatory !== false,
          packCount: 0,
          subtotalPaise: 0,
          formattedSubtotal: '₹0.00',
          surplusNote: 'Not currently listed in this store catalogue',
          alternativeSuggestion: altConfig
            ? {
                name: altConfig.name,
                reason: altConfig.reason,
                availableProduct: alternativeProductResult,
              }
            : undefined,
        });
      }
    }

    const availableItems = results.filter((r) => r.status === 'AVAILABLE');
    const missingItems = results.filter((r) => r.status !== 'AVAILABLE');

    // Authoritative Server-Side Pricing (5% GST + Delivery calculations)
    const pricingSummary = PricingService.calculate(
      availableItems.map((item) => ({
        productId: item.matchedProduct!.id,
        pricePaise: item.matchedProduct!.unitPricePaise,
        quantity: item.packCount,
      }))
    );

    return {
      dishName,
      servings,
      cuisine,
      instructions,
      totalIngredientsCount: results.length,
      availableCount: availableItems.length,
      missingCount: missingItems.length,
      items: results,
      availableItems,
      missingItems,
      pricing: {
        subtotalPaise: pricingSummary.subtotalPaise,
        taxPaise: pricingSummary.taxPaise,
        deliveryFeePaise: pricingSummary.deliveryFeePaise,
        totalPaise: pricingSummary.totalPaise,
        formatted: {
          subtotal: pricingSummary.formatted.subtotal,
          tax: pricingSummary.formatted.tax,
          delivery: pricingSummary.formatted.deliveryFee,
          total: pricingSummary.formatted.total,
        },
      },
    };
  }
}
