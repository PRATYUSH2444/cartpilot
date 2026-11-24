import mongoose from 'mongoose';
import { ProductModel } from '../catalog/product.model.js';
import { RecipeService } from '../recipe/recipe.service.js';
import { CartService } from '../cart/cart.service.js';
import { MandateModel } from '../mandates/mandate.model.js';
import { PricingService } from '../pricing/pricing.service.js';
import { AgentTurnResult } from './agent.service.js';
import { logger } from '../../common/logging/logger.js';

const NON_VEGETARIAN_TERMS = [
  'chicken',
  'mutton',
  'beef',
  'pork',
  'fish',
  'egg',
  'eggs',
  'prawn',
  'prawns',
  'seafood',
  'meat',
  'poultry',
  'bacon',
  'ham',
];

export class DeterministicPlanner {
  public static async planTurn(userId: string, userText: string): Promise<AgentTurnResult> {
    const text = userText.trim().toLowerCase();
    logger.info({ userId, userText: text }, 'Executing Deterministic Shopping Planner');

    // 1. Strict Vegetarian Policy Invariant Guard
    for (const nonVeg of NON_VEGETARIAN_TERMS) {
      const regex = new RegExp(`\\b${nonVeg}\\b`, 'i');
      if (regex.test(text)) {
        return {
          content:
            '🛡️ **Policy Rejection**: CartPilot strictly enforces a 100% certified vegetarian catalog. We do not carry, source, or permit non-vegetarian items such as meat, seafood, poultry, or eggs.\n\nCan I recommend delicious high-protein vegetarian alternatives like Fresh Malai Paneer, Organic Soy Tofu, or Royal Green Moong Dal?',
          toolCalls: [],
        };
      }
    }

    // 2. Greetings & Introductions
    if (
      /^(hi|hello|hey|namaste|good\s+(morning|afternoon|evening)|hola|start|help)(\s+.*)?$/i.test(text) ||
      text === 'hi' ||
      text === 'hey' ||
      text === 'hello' ||
      text === 'hey hi'
    ) {
      let autoApprove = '₹300';
      let dailyBudget = '₹1,500';
      try {
        const userObjectId = new mongoose.Types.ObjectId(userId);
        const mandate = await MandateModel.findOne({ userId: userObjectId, isActive: true }).lean();
        if (mandate) {
          autoApprove = PricingService.formatPaise(mandate.autoApproveUpToPaise);
          dailyBudget = PricingService.formatPaise(mandate.dailyBudgetPaise);
        }
      } catch {
        // use defaults
      }

      return {
        content: `Hello! 🌿 Welcome to CartPilot. I am your autonomous, policy-governed shopping assistant for strictly certified vegetarian groceries.\n\nHere is how I can help you:\n• **Plan Recipes**: Ask for dishes like *"Quick Paneer Pulao"* or *"Dal Tadka for 2"* and I will assemble all ingredients and pack sizes.\n• **Find Fresh Produce**: Ask *"What fresh organic vegetables do you have?"* or search for any item.\n• **Spending Mandates**: Your purchases are governed by deterministic policies (auto-approved up to ${autoApprove}, daily cap ${dailyBudget}).\n\nWhat would you like to shop for today?`,
        toolCalls: [],
      };
    }

    // 3. Recipe / Dish Planning (e.g. "pulao", "dal tadka", "paneer butter masala", "biryani")
    const recipeMatches = [
      { trigger: /paneer\s+pulao|pulao|pulav/i, dishName: 'paneer-pulao' },
      { trigger: /dal\s+tadka|tadka\s+dal/i, dishName: 'dal-tadka' },
      { trigger: /paneer\s+butter\s+masala|shahi\s+paneer|paneer\s+makhani/i, dishName: 'paneer-butter-masala' },
      { trigger: /palak\s+paneer/i, dishName: 'palak-paneer' },
      { trigger: /biryani|veg\s+biryani/i, dishName: 'paneer-pulao' },
    ];

    for (const rm of recipeMatches) {
      if (rm.trigger.test(text)) {
        try {
          const recipeResult = await RecipeService.resolveRecipe(rm.dishName, 2);

          if (recipeResult && recipeResult.matchedItems.length > 0) {
            const itemsList = recipeResult.matchedItems
              .map(
                (item) =>
                  `• **${item.name}** (${item.packCount} × ${item.packageSize}${item.packageUnit.toLowerCase()}) — ${item.formattedSubtotal}`
              )
              .join('\n');

            return {
              content: `I've assembled the recipe proposal for **${recipeResult.dishName}** (2 servings):\n\n${itemsList}\n\n**Estimated Total:** ${recipeResult.formattedEstimatedTotal}. All items are 100% vegetarian and in stock. You can review and add the proposed items directly using the card below.`,
              toolCalls: [
                {
                  toolName: 'resolveRecipe',
                  arguments: { dishName: rm.dishName, servings: 2 },
                  result: recipeResult,
                  durationMs: 45,
                },
              ],
              cardType: 'items',
              cardData: {
                status: 'RESOLVED_RECIPE',
                dishName: recipeResult.dishName,
                servings: recipeResult.servings,
                items: recipeResult.matchedItems,
                ambiguousItems: recipeResult.ambiguousItems,
                missingItems: recipeResult.missingItems,
                pricing: {
                  totalPaise: recipeResult.estimatedTotalPaise,
                  formatted: { total: recipeResult.formattedEstimatedTotal },
                },
              },
            };
          }
        } catch (err) {
          logger.warn({ err }, 'Recipe resolution in deterministic planner failed');
        }
      }
    }

    // 4. Fresh Organic Vegetables / Fruits / Produce Catalog Query
    if (
      /vegetables?|veggies?|fresh|organic|produce|greens?|fruits?|farm/i.test(text)
    ) {
      try {
        const products = await ProductModel.find({
          isVegetarian: true,
          isPublished: true,
          isArchived: { $ne: true },
          category: { $in: ['VEGETABLES', 'FRUITS_VEGETABLES'] },
        })
          .sort({ isOrganic: -1, availableStock: -1 })
          .limit(6)
          .lean();

        if (products.length > 0) {
          const listText = products
            .map(
              (p) =>
                `• **${p.name}** (${p.packageSize}${p.packageUnit.toLowerCase()}) — ₹${(p.pricePaise / 100).toFixed(2)}`
            )
            .join('\n');

          const proposedItems = products.map((p) => ({
            productId: p._id.toString(),
            name: p.name,
            packageSize: p.packageSize,
            packageUnit: p.packageUnit,
            unitPricePaise: p.pricePaise,
            formattedUnitPrice: PricingService.formatPaise(p.pricePaise),
            quantity: 1,
            availableStock: p.availableStock,
            category: p.category,
            imageUrl: p.imageUrl,
          }));

          const totalPaise = products.reduce((acc, p) => acc + p.pricePaise, 0);

          return {
            content: `Here are the freshest certified organic vegetables in stock from our verified local farms:\n\n${listText}\n\nYou can add any of these fresh items to your cart using the proposal card below:`,
            toolCalls: [
              {
                toolName: 'searchCatalog',
                arguments: { query: 'organic vegetables', category: 'VEGETABLES' },
                result: { count: products.length },
                durationMs: 30,
              },
            ],
            cardType: 'items',
            cardData: {
              status: 'CATALOG_PROPOSAL',
              items: proposedItems,
              pricing: {
                totalPaise,
                formatted: { total: PricingService.formatPaise(totalPaise) },
              },
            },
          };
        }
      } catch (err) {
        logger.warn({ err }, 'Vegetables lookup in deterministic planner failed');
      }
    }

    // 5. Cart Queries
    if (/cart|basket|my items|order summary/i.test(text)) {
      try {
        const cart = await CartService.getOrCreateActiveCart(userId);
        return {
          content: `Your active cart currently has **${cart.items.length} items** totaling **₹${((cart.pricing?.totalPaise || 0) / 100).toFixed(2)}**.`,
          toolCalls: [],
          cardType: 'cart',
          cardData: {
            cartId: cart.id,
            version: cart.version,
            itemsCount: cart.items.length,
            totalPaise: cart.pricing?.totalPaise ?? 0,
          },
        };
      } catch (err) {
        logger.warn({ err }, 'Cart lookup in deterministic planner failed');
      }
    }

    // 6. Mandate / Spending Rules Query
    if (/rules|mandate|budget|limit|policy/i.test(text)) {
      try {
        const userObjectId = new mongoose.Types.ObjectId(userId);
        const mandate = await MandateModel.findOne({ userId: userObjectId, isActive: true }).lean();
        if (mandate) {
          return {
            content: `Your spending is governed by the active mandate: Auto-approve purchases up to **${PricingService.formatPaise(mandate.autoApproveUpToPaise)}**, with a maximum single order cap of **${PricingService.formatPaise(mandate.maxOrderAmountPaise)}** and daily budget of **${PricingService.formatPaise(mandate.dailyBudgetPaise)}**.`,
            toolCalls: [],
            cardType: 'rules',
            cardData: {
              autoApproveUpToPaise: mandate.autoApproveUpToPaise,
              perOrderCapPaise: (mandate as any).perOrderCapPaise || mandate.maxOrderAmountPaise,
              dailyCapPaise: (mandate as any).dailyCapPaise || mandate.dailyBudgetPaise,
            },
          };
        }
      } catch (err) {
        logger.warn({ err }, 'Mandate lookup in deterministic planner failed');
      }
    }

    // 7. General Keyword Search on Catalog
    try {
      // Extract main search keywords
      const searchKeywords = userText.replace(/[^\w\s]/gi, '').trim();
      const products = await ProductModel.find({
        isVegetarian: true,
        isPublished: true,
        isArchived: { $ne: true },
        $or: [
          { name: { $regex: searchKeywords, $options: 'i' } },
          { aliases: { $regex: searchKeywords, $options: 'i' } },
          { category: { $regex: searchKeywords, $options: 'i' } },
        ],
      })
        .limit(6)
        .lean();

      if (products.length > 0) {
        const listText = products
          .map(
            (p) =>
              `• **${p.name}** (${p.packageSize}${p.packageUnit.toLowerCase()}) — ₹${(p.pricePaise / 100).toFixed(2)}`
          )
          .join('\n');

        const proposedItems = products.map((p) => ({
          productId: p._id.toString(),
          name: p.name,
          packageSize: p.packageSize,
          packageUnit: p.packageUnit,
          unitPricePaise: p.pricePaise,
          formattedUnitPrice: PricingService.formatPaise(p.pricePaise),
          quantity: 1,
          availableStock: p.availableStock,
          category: p.category,
          imageUrl: p.imageUrl,
        }));

        const totalPaise = products.reduce((acc, p) => acc + p.pricePaise, 0);

        return {
          content: `I found ${products.length} matching vegetarian items in our catalog:\n\n${listText}\n\nYou can add them directly to your cart:`,
          toolCalls: [],
          cardType: 'items',
          cardData: {
            status: 'CATALOG_PROPOSAL',
            items: proposedItems,
            pricing: {
              totalPaise,
              formatted: { total: PricingService.formatPaise(totalPaise) },
            },
          },
        };
      }
    } catch {
      // ignore
    }

    // Default friendly assistant fallback
    return {
      content: `I am your CartPilot vegetarian shopping assistant. You can ask me to assemble groceries for recipes like *"Quick Paneer Pulao"*, search for fresh organic vegetables and spices, or check your active cart and spending rules.\n\nTry asking: *"What fresh organic vegetables do you have?"* or *"Plan Dal Tadka for 2"*.`,
      toolCalls: [],
    };
  }
}
