import { z } from 'zod';
import { CatalogService } from '../../catalog/catalog.service.js';
import { CartService } from '../../cart/cart.service.js';
import { RecipeService } from '../../recipe/recipe.service.js';
import { PricingService } from '../../pricing/pricing.service.js';
import { ProductCategory } from '../../catalog/product.model.js';
import { BadRequestError } from '../../../common/errors/app-error.js';

export interface ToolDefinition<TInput = any, TOutput = any> {
  name: string;
  description: string;
  schema: z.ZodSchema<TInput>;
  parametersJsonSchema: Record<string, any>;
  execute: (input: TInput, context: { userId: string }) => Promise<TOutput>;
}

// 1. searchCatalog Tool
const SearchCatalogInputSchema = z.object({
  query: z.string().min(1, 'Search query cannot be empty').trim(),
  category: z
    .enum(['GRAINS', 'PULSES', 'DAIRY', 'VEGETABLES', 'SPICES', 'OILS', 'CONDIMENTS'])
    .optional(),
  limit: z.coerce.number().int().min(1).max(20).default(6),
});

export const searchCatalogTool: ToolDefinition = {
  name: 'searchCatalog',
  description:
    'Search the certified vegetarian grocery catalog by product name, category, or alias keywords (e.g. "paneer", "basmati", "pyaz", "ghee").',
  schema: SearchCatalogInputSchema,
  parametersJsonSchema: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Search term or product alias' },
      category: {
        type: 'string',
        enum: ['GRAINS', 'PULSES', 'DAIRY', 'VEGETABLES', 'SPICES', 'OILS', 'CONDIMENTS'],
        description: 'Optional category filter',
      },
      limit: { type: 'integer', description: 'Max items to return (1-20)', default: 6 },
    },
    required: ['query'],
  },
  execute: async (input, _context) => {
    const result = await CatalogService.searchCatalog({
      page: 1,
      query: input.query,
      category: input.category as ProductCategory,
      limit: input.limit,
    });

    return {
      totalFound: result.total,
      products: result.products.map((p) => ({
        id: p._id.toString(),
        name: p.name,
        category: p.category,
        packageSize: p.packageSize,
        packageUnit: p.packageUnit,
        pricePaise: p.pricePaise,
        formattedPrice: PricingService.formatPaise(p.pricePaise),
        availableStock: p.availableStock,
        aliases: p.aliases,
      })),
    };
  },
};

// 2. getProductDetails Tool
const GetProductDetailsInputSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
});

export const getProductDetailsTool: ToolDefinition = {
  name: 'getProductDetails',
  description:
    'Retrieve real-time product specification, unit package size, and inventory stock by product ID.',
  schema: GetProductDetailsInputSchema,
  parametersJsonSchema: {
    type: 'object',
    properties: {
      productId: { type: 'string', description: 'MongoDB ObjectId of the catalog product' },
    },
    required: ['productId'],
  },
  execute: async (input, _context) => {
    const product = await CatalogService.getProductById(input.productId);
    return {
      id: product._id.toString(),
      name: product.name,
      description: product.description,
      category: product.category,
      pricePaise: product.pricePaise,
      formattedPrice: PricingService.formatPaise(product.pricePaise),
      packageSize: product.packageSize,
      packageUnit: product.packageUnit,
      availableStock: product.availableStock,
      isVegetarian: product.isVegetarian,
      aliases: product.aliases,
    };
  },
};

// 3. resolveRecipe Tool
const ResolveRecipeToolInputSchema = z.object({
  dishName: z.string().min(1, 'Dish name is required').trim(),
  servings: z.coerce.number().int().positive().max(50).default(4),
  ingredients: z.array(z.string().trim()).optional(),
});

export const resolveRecipeTool: ToolDefinition = {
  name: 'resolveRecipe',
  description:
    'Decompose an Indian culinary recipe (e.g. "Paneer Pulao", "Dal Tadka", "Aloo Matar") into required ingredients, match them to catalog SKUs, and compute optimal package pack counts without partial packages.',
  schema: ResolveRecipeToolInputSchema,
  parametersJsonSchema: {
    type: 'object',
    properties: {
      dishName: { type: 'string', description: 'Name of the dish or meal' },
      servings: {
        type: 'integer',
        description: 'Number of people/servings to prepare',
        default: 4,
      },
      ingredients: {
        type: 'array',
        items: { type: 'string' },
        description: 'Optional explicit list of ingredient names',
      },
    },
    required: ['dishName'],
  },
  execute: async (input, _context) => {
    const resolution = await RecipeService.resolveRecipe(
      input.dishName,
      input.servings,
      input.ingredients
    );

    return {
      dishName: resolution.dishName,
      servings: resolution.servings,
      description: resolution.description,
      matchedItemsCount: resolution.matchedItems.length,
      matchedItems: resolution.matchedItems.map((m) => ({
        ingredientName: m.ingredientName,
        productId: m.productId,
        name: m.name,
        packCount: m.packCount,
        packageSize: m.packageSize,
        packageUnit: m.packageUnit,
        unitPricePaise: m.unitPricePaise,
        formattedUnitPrice: m.formattedUnitPrice,
        subtotalPaise: m.subtotalPaise,
        formattedSubtotal: m.formattedSubtotal,
        isOptional: m.isOptional,
        explain: m.explain,
      })),
      ambiguousItems: resolution.ambiguousItems,
      missingItems: resolution.missingItems,
      estimatedTotalPaise: resolution.estimatedTotalPaise,
      formattedEstimatedTotal: resolution.formattedEstimatedTotal,
      budgetComparison: resolution.budgetComparison,
    };
  },
};

// 4. getCart Tool
const GetCartInputSchema = z.object({});

export const getCartTool: ToolDefinition = {
  name: 'getCart',
  description:
    'Get the current authenticated customer’s shopping cart contents, active version number, and authoritative pure server-side price breakdown.',
  schema: GetCartInputSchema,
  parametersJsonSchema: {
    type: 'object',
    properties: {},
  },
  execute: async (_input, context) => {
    const cart = await CartService.getOrCreateActiveCart(context.userId);
    return {
      cartId: cart.id,
      version: cart.version,
      itemCount: cart.itemCount,
      items: cart.items.map((i) => ({
        productId: i.productId,
        name: i.name,
        quantity: i.quantity,
        unitPricePaise: i.pricePaise,
        itemTotalPaise: i.itemTotalPaise,
        formattedItemTotal: i.formattedItemTotal,
      })),
      pricing: cart.pricing,
    };
  },
};

// 5. proposeCartItems Tool
const ProposeCartItemsInputSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().min(1, 'Product ID is required'),
        quantity: z.coerce.number().int().positive().max(50),
      })
    )
    .min(1, 'At least one item must be proposed'),
  rationale: z.string().optional(),
});

export const proposeCartItemsTool: ToolDefinition = {
  name: 'proposeCartItems',
  description:
    'Generate a structured proposal card for grocery items to add to the cart. Does NOT execute payment or checkout; allows customer human-in-the-loop oversight to review and confirm.',
  schema: ProposeCartItemsInputSchema,
  parametersJsonSchema: {
    type: 'object',
    properties: {
      items: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            productId: { type: 'string', description: 'Catalog Product ID' },
            quantity: { type: 'integer', description: 'Quantity of packages' },
          },
          required: ['productId', 'quantity'],
        },
        description: 'Array of products and pack counts to propose',
      },
      rationale: { type: 'string', description: 'Explanation or recipe context for the proposal' },
    },
    required: ['items'],
  },
  execute: async (input, _context) => {
    // Validate products exist
    const itemsWithDetails = [];

    for (const reqItem of input.items) {
      try {
        const prod = await CatalogService.getProductById(reqItem.productId);
        const subtotal = prod.pricePaise * reqItem.quantity;

        itemsWithDetails.push({
          productId: prod._id.toString(),
          name: prod.name,
          category: prod.category,
          packageSize: prod.packageSize,
          packageUnit: prod.packageUnit,
          unitPricePaise: prod.pricePaise,
          formattedUnitPrice: PricingService.formatPaise(prod.pricePaise),
          quantity: reqItem.quantity,
          subtotalPaise: subtotal,
          formattedSubtotal: PricingService.formatPaise(subtotal),
          availableStock: prod.availableStock,
          imageUrl: prod.imageUrl,
          explain: {
            method: prod.aliases && prod.aliases.length > 0 ? 'exact_alias' : 'text_search',
            confidence: prod.aliases && prod.aliases.length > 0 ? 0.98 : 0.92,
            matchedAlias: prod.aliases?.[0] || prod.name,
            sourceStamp: 'Fresh Greens catalog, checked just now',
          },
        });
      } catch {
        throw new BadRequestError(
          `Invalid or missing product ID in proposal: ${reqItem.productId}`
        );
      }
    }

    const calculatedPricing = PricingService.calculate(
      itemsWithDetails.map((i) => ({
        productId: i.productId,
        pricePaise: i.unitPricePaise,
        quantity: i.quantity,
      }))
    );

    return {
      status: 'PROPOSED',
      rationale: input.rationale || 'Curated vegetarian cart proposal',
      items: itemsWithDetails,
      totalItems: itemsWithDetails.reduce((sum, i) => sum + i.quantity, 0),
      pricing: calculatedPricing,
    };
  },
};

// Strict Allowlist of permitted AI tools
export const ALLOWED_TOOLS: Record<string, ToolDefinition> = {
  searchCatalog: searchCatalogTool,
  getProductDetails: getProductDetailsTool,
  resolveRecipe: resolveRecipeTool,
  getCart: getCartTool,
  proposeCartItems: proposeCartItemsTool,
};
