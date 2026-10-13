import { CatalogService } from '../catalog/catalog.service.js';
import { PricingService } from '../pricing/pricing.service.js';
import { IProduct } from '../catalog/product.model.js';
import { logger } from '../../common/logging/logger.js';

export interface CulinaryIngredientSpec {
  name: string;
  searchTerm: string;
  category?: string;
  baseAmountPerServing: number; // in unit (grams or ml or pieces)
  unit: 'G' | 'KG' | 'ML' | 'L' | 'PIECE';
  isMandatory: boolean;
}

export interface KnownRecipe {
  id: string;
  title: string;
  aliases: string[];
  description: string;
  defaultServings: number;
  ingredients: CulinaryIngredientSpec[];
}

export interface MatchedRecipeItem {
  ingredientName: string;
  productId: string;
  name: string;
  slug: string;
  category: string;
  packageSize: number;
  packageUnit: string;
  unitPricePaise: number;
  formattedUnitPrice: string;
  requiredAmount: number;
  requiredUnit: string;
  packCount: number;
  subtotalPaise: number;
  formattedSubtotal: string;
  availableStock: number;
  imageUrl?: string;
  isOptional?: boolean;
  explain?: {
    method: 'exact_alias' | 'text_search' | 'category_fallback';
    confidence: number;
    matchedAlias?: string;
    sourceStamp: string;
    leftoverAmount?: number;
    leftoverUnit?: string;
  };
}

export interface AmbiguousRecipeItem {
  ingredientName: string;
  reason: string;
  candidates: Array<{
    productId: string;
    name: string;
    packageSize: number;
    packageUnit: string;
    unitPricePaise: number;
    formattedUnitPrice: string;
    availableStock: number;
  }>;
}

export interface MissingRecipeItem {
  ingredientName: string;
  reason: string;
  isVegetarianViolation?: boolean;
}

export interface RecipeResolutionResult {
  dishName: string;
  servings: number;
  description: string;
  matchedItems: MatchedRecipeItem[];
  ambiguousItems: AmbiguousRecipeItem[];
  missingItems: MissingRecipeItem[];
  estimatedTotalPaise: number;
  formattedEstimatedTotal: string;
  budgetComparison?: {
    statedBudgetPaise: number;
    formattedStatedBudget: string;
    isUnderBudget: boolean;
    diffPaise: number;
    formattedDiff: string;
    statusText: string;
  };
}

const NON_VEGETARIAN_TERMS = new Set([
  'chicken',
  'mutton',
  'beef',
  'pork',
  'fish',
  'egg',
  'eggs',
  'prawn',
  'prawns',
  'shrimp',
  'crab',
  'meat',
  'bacon',
  'ham',
  'seafood',
  'poultry',
]);

const KNOWN_RECIPES: KnownRecipe[] = [
  {
    id: 'paneer-pulao',
    title: 'Paneer Pulao',
    aliases: ['paneer pulao', 'pulao', 'paneer pulav', 'veg paneer pulao', 'shahi pulao'],
    description:
      'Fragrant aromatic basmati rice cooked with malai paneer, fresh peas, and whole spices in pure cow ghee.',
    defaultServings: 4,
    ingredients: [
      {
        name: 'Royal Aged Basmati Rice',
        searchTerm: 'basmati rice',
        category: 'GRAINS',
        baseAmountPerServing: 100,
        unit: 'G',
        isMandatory: true,
      },
      {
        name: 'Fresh Malai Paneer',
        searchTerm: 'malai paneer',
        category: 'DAIRY',
        baseAmountPerServing: 75,
        unit: 'G',
        isMandatory: true,
      },
      {
        name: 'Farm Fresh Green Peas',
        searchTerm: 'green peas',
        category: 'VEGETABLES',
        baseAmountPerServing: 50,
        unit: 'G',
        isMandatory: true,
      },
      {
        name: 'Pure Desi Cow Ghee',
        searchTerm: 'cow ghee',
        category: 'OILS',
        baseAmountPerServing: 15,
        unit: 'ML',
        isMandatory: false,
      },
      {
        name: 'Whole Cumin Seeds (Jeera)',
        searchTerm: 'cumin seeds',
        category: 'SPICES',
        baseAmountPerServing: 3,
        unit: 'G',
        isMandatory: false,
      },
      {
        name: 'Royal Shahi Garam Masala',
        searchTerm: 'garam masala',
        category: 'SPICES',
        baseAmountPerServing: 3,
        unit: 'G',
        isMandatory: false,
      },
      {
        name: 'Red Onions (Nashik Fresh)',
        searchTerm: 'red onions',
        category: 'VEGETABLES',
        baseAmountPerServing: 50,
        unit: 'G',
        isMandatory: false,
      },
    ],
  },
  {
    id: 'paneer-butter-masala',
    title: 'Paneer Butter Masala',
    aliases: ['paneer butter masala', 'paneer makhani', 'shahi paneer', 'butter paneer'],
    description:
      'Rich and creamy tomato-cashew based gravy cooked with soft cubes of fresh cottage cheese.',
    defaultServings: 4,
    ingredients: [
      {
        name: 'Fresh Malai Paneer',
        searchTerm: 'malai paneer',
        category: 'DAIRY',
        baseAmountPerServing: 100,
        unit: 'G',
        isMandatory: true,
      },
      {
        name: 'Country Tomatoes (Nati)',
        searchTerm: 'tomatoes',
        category: 'VEGETABLES',
        baseAmountPerServing: 150,
        unit: 'G',
        isMandatory: true,
      },
      {
        name: 'Red Onions (Nashik Fresh)',
        searchTerm: 'red onions',
        category: 'VEGETABLES',
        baseAmountPerServing: 100,
        unit: 'G',
        isMandatory: true,
      },
      {
        name: 'Pure Desi Cow Ghee',
        searchTerm: 'cow ghee',
        category: 'OILS',
        baseAmountPerServing: 20,
        unit: 'ML',
        isMandatory: false,
      },
      {
        name: 'Fresh Ginger Root',
        searchTerm: 'ginger',
        category: 'VEGETABLES',
        baseAmountPerServing: 5,
        unit: 'G',
        isMandatory: false,
      },
      {
        name: 'Organic Garlic Bulbs',
        searchTerm: 'garlic',
        category: 'VEGETABLES',
        baseAmountPerServing: 5,
        unit: 'G',
        isMandatory: false,
      },
      {
        name: 'Pure Salem Turmeric Powder',
        searchTerm: 'turmeric',
        category: 'SPICES',
        baseAmountPerServing: 3,
        unit: 'G',
        isMandatory: false,
      },
      {
        name: 'Kashmiri Red Chilli Powder',
        searchTerm: 'kashmiri chilli',
        category: 'SPICES',
        baseAmountPerServing: 4,
        unit: 'G',
        isMandatory: false,
      },
      {
        name: 'Royal Shahi Garam Masala',
        searchTerm: 'garam masala',
        category: 'SPICES',
        baseAmountPerServing: 3,
        unit: 'G',
        isMandatory: false,
      },
    ],
  },
  {
    id: 'dal-tadka',
    title: 'Dal Tadka',
    aliases: ['dal tadka', 'dal fry', 'yellow dal', 'toor dal tadka', 'arhar dal'],
    description:
      'Comforting home-style yellow toor dal tempered with cumin, garlic, and desi ghee.',
    defaultServings: 4,
    ingredients: [
      {
        name: 'Unpolished Toor Dal',
        searchTerm: 'toor dal',
        category: 'PULSES',
        baseAmountPerServing: 75,
        unit: 'G',
        isMandatory: true,
      },
      {
        name: 'Country Tomatoes (Nati)',
        searchTerm: 'tomatoes',
        category: 'VEGETABLES',
        baseAmountPerServing: 50,
        unit: 'G',
        isMandatory: false,
      },
      {
        name: 'Red Onions (Nashik Fresh)',
        searchTerm: 'red onions',
        category: 'VEGETABLES',
        baseAmountPerServing: 50,
        unit: 'G',
        isMandatory: false,
      },
      {
        name: 'Whole Cumin Seeds (Jeera)',
        searchTerm: 'cumin seeds',
        category: 'SPICES',
        baseAmountPerServing: 4,
        unit: 'G',
        isMandatory: false,
      },
      {
        name: 'Organic Garlic Bulbs',
        searchTerm: 'garlic',
        category: 'VEGETABLES',
        baseAmountPerServing: 5,
        unit: 'G',
        isMandatory: false,
      },
      {
        name: 'Pure Desi Cow Ghee',
        searchTerm: 'cow ghee',
        category: 'OILS',
        baseAmountPerServing: 15,
        unit: 'ML',
        isMandatory: false,
      },
      {
        name: 'Pure Salem Turmeric Powder',
        searchTerm: 'turmeric',
        category: 'SPICES',
        baseAmountPerServing: 3,
        unit: 'G',
        isMandatory: false,
      },
    ],
  },
  {
    id: 'jeera-rice',
    title: 'Jeera Rice',
    aliases: ['jeera rice', 'zeera rice', 'cumin rice'],
    description:
      'Aromatic aged long grain basmati rice lightly tossed with toasted whole cumin seeds and ghee.',
    defaultServings: 4,
    ingredients: [
      {
        name: 'Royal Aged Basmati Rice',
        searchTerm: 'basmati rice',
        category: 'GRAINS',
        baseAmountPerServing: 100,
        unit: 'G',
        isMandatory: true,
      },
      {
        name: 'Pure Desi Cow Ghee',
        searchTerm: 'cow ghee',
        category: 'OILS',
        baseAmountPerServing: 15,
        unit: 'ML',
        isMandatory: false,
      },
      {
        name: 'Whole Cumin Seeds (Jeera)',
        searchTerm: 'cumin seeds',
        category: 'SPICES',
        baseAmountPerServing: 5,
        unit: 'G',
        isMandatory: true,
      },
    ],
  },
  {
    id: 'aloo-matar',
    title: 'Aloo Matar',
    aliases: ['aloo matar', 'aloo mutter', 'potato and peas curry'],
    description:
      'Classic North Indian homestyle curry of tender hill potatoes and sweet green peas in spiced tomato gravy.',
    defaultServings: 4,
    ingredients: [
      {
        name: 'Fresh Potatoes (Pahari)',
        searchTerm: 'potatoes',
        category: 'VEGETABLES',
        baseAmountPerServing: 100,
        unit: 'G',
        isMandatory: true,
      },
      {
        name: 'Farm Fresh Green Peas',
        searchTerm: 'green peas',
        category: 'VEGETABLES',
        baseAmountPerServing: 75,
        unit: 'G',
        isMandatory: true,
      },
      {
        name: 'Country Tomatoes (Nati)',
        searchTerm: 'tomatoes',
        category: 'VEGETABLES',
        baseAmountPerServing: 50,
        unit: 'G',
        isMandatory: false,
      },
      {
        name: 'Red Onions (Nashik Fresh)',
        searchTerm: 'red onions',
        category: 'VEGETABLES',
        baseAmountPerServing: 50,
        unit: 'G',
        isMandatory: false,
      },
      {
        name: 'Whole Cumin Seeds (Jeera)',
        searchTerm: 'cumin seeds',
        category: 'SPICES',
        baseAmountPerServing: 4,
        unit: 'G',
        isMandatory: false,
      },
      {
        name: 'Pure Salem Turmeric Powder',
        searchTerm: 'turmeric',
        category: 'SPICES',
        baseAmountPerServing: 3,
        unit: 'G',
        isMandatory: false,
      },
    ],
  },
  {
    id: 'moong-dal-khichdi',
    title: 'Moong Dal Khichdi',
    aliases: ['moong dal khichdi', 'khichdi', 'dal khichdi'],
    description:
      'Nourishing, light, and soothing one-pot rice and yellow split moong dal cooked with ghee and cumin.',
    defaultServings: 4,
    ingredients: [
      {
        name: 'Dhuli Moong Dal',
        searchTerm: 'moong dal',
        category: 'PULSES',
        baseAmountPerServing: 50,
        unit: 'G',
        isMandatory: true,
      },
      {
        name: 'Royal Aged Basmati Rice',
        searchTerm: 'basmati rice',
        category: 'GRAINS',
        baseAmountPerServing: 75,
        unit: 'G',
        isMandatory: true,
      },
      {
        name: 'Pure Desi Cow Ghee',
        searchTerm: 'cow ghee',
        category: 'OILS',
        baseAmountPerServing: 15,
        unit: 'ML',
        isMandatory: false,
      },
      {
        name: 'Whole Cumin Seeds (Jeera)',
        searchTerm: 'cumin seeds',
        category: 'SPICES',
        baseAmountPerServing: 5,
        unit: 'G',
        isMandatory: false,
      },
      {
        name: 'Pure Salem Turmeric Powder',
        searchTerm: 'turmeric',
        category: 'SPICES',
        baseAmountPerServing: 3,
        unit: 'G',
        isMandatory: false,
      },
    ],
  },
  {
    id: 'veg-biryani',
    title: 'Vegetable Biryani',
    aliases: ['veg biryani', 'vegetable biryani', 'dum biryani veg', 'shahi veg biryani'],
    description:
      'Layered royal dum cooked basmati rice with paneer cubes, fresh vegetables, fragrant mint, and whole spices.',
    defaultServings: 4,
    ingredients: [
      {
        name: 'Royal Aged Basmati Rice',
        searchTerm: 'basmati rice',
        category: 'GRAINS',
        baseAmountPerServing: 100,
        unit: 'G',
        isMandatory: true,
      },
      {
        name: 'Fresh Malai Paneer',
        searchTerm: 'malai paneer',
        category: 'DAIRY',
        baseAmountPerServing: 50,
        unit: 'G',
        isMandatory: false,
      },
      {
        name: 'Farm Fresh Green Peas',
        searchTerm: 'green peas',
        category: 'VEGETABLES',
        baseAmountPerServing: 50,
        unit: 'G',
        isMandatory: false,
      },
      {
        name: 'Fresh Potatoes (Pahari)',
        searchTerm: 'potatoes',
        category: 'VEGETABLES',
        baseAmountPerServing: 50,
        unit: 'G',
        isMandatory: false,
      },
      {
        name: 'Red Onions (Nashik Fresh)',
        searchTerm: 'red onions',
        category: 'VEGETABLES',
        baseAmountPerServing: 75,
        unit: 'G',
        isMandatory: false,
      },
      {
        name: 'Pure Desi Cow Ghee',
        searchTerm: 'cow ghee',
        category: 'OILS',
        baseAmountPerServing: 20,
        unit: 'ML',
        isMandatory: false,
      },
      {
        name: 'Royal Shahi Garam Masala',
        searchTerm: 'garam masala',
        category: 'SPICES',
        baseAmountPerServing: 5,
        unit: 'G',
        isMandatory: false,
      },
      {
        name: 'Fresh Mint Leaves',
        searchTerm: 'mint leaves',
        category: 'VEGETABLES',
        baseAmountPerServing: 10,
        unit: 'G',
        isMandatory: false,
      },
      {
        name: 'Fresh Coriander Leaves',
        searchTerm: 'coriander leaves',
        category: 'VEGETABLES',
        baseAmountPerServing: 10,
        unit: 'G',
        isMandatory: false,
      },
    ],
  },
];

export class RecipeService {
  /**
   * Resolves a culinary query or dish name into catalog SKUs, calculating pack sizes
   * to satisfy the required ingredient quantities without partial packages.
   */
  public static async resolveRecipe(
    dishName: string,
    servings = 4,
    customIngredients?: string[],
    budgetPaise?: number
  ): Promise<RecipeResolutionResult> {
    logger.info({ dishName, servings, customIngredients, budgetPaise }, 'Resolving recipe to catalog SKUs');

    const budgetMatch = dishName.match(/under\s*(?:₹|rs\.?|inr)?\s*(\d+)/i);
    const statedBudget =
      budgetPaise || (budgetMatch && budgetMatch[1] ? parseInt(budgetMatch[1], 10) * 100 : undefined);

    const cleanDish = dishName.trim().toLowerCase();
    const cleanDishTokens = cleanDish.split(/\s+/);

    // 1. Guard against non-vegetarian requests
    for (const token of cleanDishTokens) {
      if (NON_VEGETARIAN_TERMS.has(token)) {
        return {
          dishName,
          servings,
          description: 'CartPilot operates an exclusively 100% certified vegetarian catalog.',
          matchedItems: [],
          ambiguousItems: [],
          missingItems: [
            {
              ingredientName: token,
              reason:
                'CartPilot catalog strictly excludes non-vegetarian items (meat, poultry, fish, eggs).',
              isVegetarianViolation: true,
            },
          ],
          estimatedTotalPaise: 0,
          formattedEstimatedTotal: PricingService.formatPaise(0),
        };
      }
    }

    // 2. Locate known recipe template
    const matchedRecipe = KNOWN_RECIPES.find((r) =>
      r.aliases.some((alias) => cleanDish.includes(alias) || alias.includes(cleanDish))
    );

    // 3. Assemble ingredient specifications
    let ingredientSpecs: CulinaryIngredientSpec[] = [];

    if (customIngredients && customIngredients.length > 0) {
      // Build specs from custom ingredients
      ingredientSpecs = customIngredients.map((item) => ({
        name: item,
        searchTerm: item,
        baseAmountPerServing: 50, // standard default
        unit: 'G' as const,
        isMandatory: true,
      }));
    } else if (matchedRecipe) {
      ingredientSpecs = matchedRecipe.ingredients;
    } else {
      // Extract culinary candidate keywords from query
      const candidateTerms = cleanDishTokens.filter(
        (t) =>
          ![
            'for',
            'people',
            'person',
            'servings',
            'make',
            'cook',
            'prepare',
            'recipe',
            'with',
            'and',
            'the',
            'some',
            'please',
            'a',
            'in',
          ].includes(t) && isNaN(Number(t))
      );

      ingredientSpecs = candidateTerms.map((term) => ({
        name: term.charAt(0).toUpperCase() + term.slice(1),
        searchTerm: term,
        baseAmountPerServing: 50,
        unit: 'G' as const,
        isMandatory: true,
      }));
    }

    const matchedItems: MatchedRecipeItem[] = [];
    const ambiguousItems: AmbiguousRecipeItem[] = [];
    const missingItems: MissingRecipeItem[] = [];

    // 4. Resolve each ingredient against active catalog
    for (const spec of ingredientSpecs) {
      const ingredientLower = spec.searchTerm.toLowerCase();

      // Check if ingredient itself is non-vegetarian
      if (NON_VEGETARIAN_TERMS.has(ingredientLower)) {
        missingItems.push({
          ingredientName: spec.name,
          reason: 'Violates vegetarian catalog policy. Non-vegetarian items cannot be fulfilled.',
          isVegetarianViolation: true,
        });
        continue;
      }

      const totalRequiredAmount = spec.baseAmountPerServing * servings;

      // Query active catalog
      const searchRes = await CatalogService.searchCatalog({
        page: 1,
        query: spec.searchTerm,
        inStockOnly: false,
        limit: 10,
      });

      const products = searchRes.products;

      if (products.length === 0) {
        // Missing item (AC-A.3)
        missingItems.push({
          ingredientName: spec.name,
          reason: `No matching product currently stocked in catalog for "${spec.name}".`,
        });
        continue;
      }

      // Check for multiple close matches / package size alternatives (AC-A.3, SC-02)
      if (products.length > 1) {
        // Are there multiple distinct products with distinct package sizes or names?
        const distinctSizes = new Set(products.map((p) => `${p.packageSize}${p.packageUnit}`));
        if (distinctSizes.size > 1) {
          ambiguousItems.push({
            ingredientName: spec.name,
            reason: `Multiple package sizes and options available for "${spec.name}".`,
            candidates: products.map((p) => ({
              productId: p._id.toString(),
              name: p.name,
              packageSize: p.packageSize,
              packageUnit: p.packageUnit,
              unitPricePaise: p.pricePaise,
              formattedUnitPrice: PricingService.formatPaise(p.pricePaise),
              availableStock: p.availableStock,
            })),
          });
        }
      }

      // Pick the best match (minimum pack count that covers the required quantity)
      const selectedProduct = this.selectBestProductMatch(products, totalRequiredAmount, spec.unit);

      if (!selectedProduct) {
        missingItems.push({
          ingredientName: spec.name,
          reason: `Could not determine suitable product match for "${spec.name}".`,
        });
        continue;
      }

      // Pack size calculation: ceil(requiredAmount / packageSize)
      // Normalize units if needed (KG -> G, L -> ML)
      const normalizedPackageSize = this.normalizeUnit(
        selectedProduct.packageSize,
        selectedProduct.packageUnit
      );
      const normalizedRequiredAmount = this.normalizeUnit(totalRequiredAmount, spec.unit);

      const packCount = Math.max(1, Math.ceil(normalizedRequiredAmount / normalizedPackageSize));
      const subtotalPaise = packCount * selectedProduct.pricePaise;

      const totalProvidedAmount = packCount * normalizedPackageSize;
      const leftoverAmount = Math.max(0, totalProvidedAmount - normalizedRequiredAmount);
      const isExactAlias = selectedProduct.aliases?.some(
        (a) =>
          a.toLowerCase().includes(spec.searchTerm.toLowerCase()) ||
          spec.searchTerm.toLowerCase().includes(a.toLowerCase())
      );

      matchedItems.push({
        ingredientName: spec.name,
        productId: selectedProduct._id.toString(),
        name: selectedProduct.name,
        slug: selectedProduct.slug,
        category: selectedProduct.category,
        packageSize: selectedProduct.packageSize,
        packageUnit: selectedProduct.packageUnit,
        unitPricePaise: selectedProduct.pricePaise,
        formattedUnitPrice: PricingService.formatPaise(selectedProduct.pricePaise),
        requiredAmount: totalRequiredAmount,
        requiredUnit: spec.unit,
        packCount,
        subtotalPaise,
        formattedSubtotal: PricingService.formatPaise(subtotalPaise),
        availableStock: selectedProduct.availableStock,
        imageUrl: selectedProduct.imageUrl,
        isOptional: !spec.isMandatory,
        explain: {
          method: isExactAlias ? 'exact_alias' : 'text_search',
          confidence: isExactAlias ? 0.98 : 0.91,
          matchedAlias: selectedProduct.aliases?.[0] || selectedProduct.name,
          sourceStamp: 'Fresh Greens catalog, checked just now',
          leftoverAmount: leftoverAmount > 0 ? leftoverAmount : undefined,
          leftoverUnit: spec.unit,
        },
      });
    }

    const estimatedTotalPaise = matchedItems.reduce((sum, item) => sum + item.subtotalPaise, 0);

    let budgetComparison: RecipeResolutionResult['budgetComparison'] = undefined;
    if (statedBudget) {
      const diffPaise = Math.abs(estimatedTotalPaise - statedBudget);
      const isUnder = estimatedTotalPaise <= statedBudget;
      budgetComparison = {
        statedBudgetPaise: statedBudget,
        formattedStatedBudget: PricingService.formatPaise(statedBudget),
        isUnderBudget: isUnder,
        diffPaise,
        formattedDiff: PricingService.formatPaise(diffPaise),
        statusText: isUnder
          ? `Under budget by ${PricingService.formatPaise(diffPaise)}`
          : `Over budget by ${PricingService.formatPaise(diffPaise)}. Optional items can be removed to fit budget.`,
      };
    }

    return {
      dishName: matchedRecipe ? matchedRecipe.title : dishName,
      servings,
      description: matchedRecipe
        ? matchedRecipe.description
        : `Recipe resolution for ${servings} servings of ${dishName}.`,
      matchedItems,
      ambiguousItems,
      missingItems,
      estimatedTotalPaise,
      formattedEstimatedTotal: PricingService.formatPaise(estimatedTotalPaise),
      budgetComparison,
    };
  }

  /**
   * Selects best product from candidates to fulfill required amount.
   */
  private static selectBestProductMatch(
    products: IProduct[],
    requiredAmount: number,
    requiredUnit: string
  ): IProduct | undefined {
    if (products.length === 0) return undefined;
    if (products.length === 1) return products[0];

    // Score products by how closely 1 or 2 packs cover the required quantity without massive excess
    const normalizedReq = this.normalizeUnit(requiredAmount, requiredUnit);

    return products.slice().sort((a, b) => {
      const aPackSize = this.normalizeUnit(a.packageSize, a.packageUnit);
      const bPackSize = this.normalizeUnit(b.packageSize, b.packageUnit);

      const aPacks = Math.ceil(normalizedReq / aPackSize);
      const bPacks = Math.ceil(normalizedReq / bPackSize);

      const aTotal = aPacks * aPackSize;
      const bTotal = bPacks * bPackSize;

      const aExcess = aTotal - normalizedReq;
      const bExcess = bTotal - normalizedReq;

      // Prefer product with smaller total excess
      if (aExcess !== bExcess) {
        return aExcess - bExcess;
      }

      // Tie-breaker: lower unit price
      return a.pricePaise - b.pricePaise;
    })[0];
  }

  /**
   * Normalize package quantities to base units (G or ML).
   */
  private static normalizeUnit(amount: number, unit: string): number {
    const u = unit.toUpperCase();
    if (u === 'KG') return amount * 1000;
    if (u === 'L') return amount * 1000;
    return amount;
  }
}
