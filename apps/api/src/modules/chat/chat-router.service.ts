import { CatalogMatcherService, CatalogMatchResult } from '../recipe/catalog-matcher.service.js';
import { RecipePlannerService } from '../recipe/recipe-planner.service.js';
import { CartModel } from '../cart/cart.model.js';
import { logger } from '../../common/logging/logger.js';

export interface RouterResult {
  handled: boolean;
  content: string;
  cardType?: 'items' | 'cart' | 'rules' | 'approval' | 'order';
  cardData?: Record<string, any>;
  sessionStateUpdate?: {
    activeDish?: string;
    activeServings?: number;
    budgetTargetPaise?: number;
  };
}

const GREETING_REGEX = /^(hi|hello|hey|namaste|namaskar|good\s+morning|good\s+afternoon|good\s+evening|pranam|yo|hola)\b[!\.\?]*$/i;
const THANKS_REGEX = /^(thanks|thank\s+you|dhanyawad|shukriya|thx|tq|ty|many\s+thanks)\b[!\.\?]*$/i;
const HELP_REGEX = /^(help|what\s+can\s+you\s+do|who\s+are\s+you|how\s+does\s+this\s+work|about)\b[!\.\?]*$/i;
const SERVINGS_REGEX = /(?:for|serves?|make\s+it\s+for|feeds?)\s+(\d+)(?:\s*(?:people|persons?|members?|guests?|servings?))?/i;
const SERVINGS_ONLY_REGEX = /^(\d+)\s*(?:people|persons?|members?|servings?)?$/i;

const NON_VEG_WORDS = [
  'chicken',
  'mutton',
  'egg',
  'eggs',
  'fish',
  'prawn',
  'prawns',
  'crab',
  'meat',
  'bacon',
  'ham',
  'pork',
  'beef',
  'murgi',
  'anda',
  'machhli',
  'gosht',
];

export class ChatRouterService {
  /**
   * Evaluates incoming message against deterministic rules.
   * Resolves greetings, thanks, non-veg guardrails, servings adjustments, and dish planning
   * with MINIMAL or ZERO LLM token overhead.
   */
  public static async route(
    userId: string,
    userText: string,
    sessionState: { activeDish?: string; activeServings?: number; budgetTargetPaise?: number } = {}
  ): Promise<RouterResult> {
    const trimmed = userText.trim();
    const lower = trimmed.toLowerCase();

    // ── 1. Greetings (0 LLM Tokens) ──────────────────────────────────────────
    if (GREETING_REGEX.test(lower)) {
      return {
        handled: true,
        content:
          'Namaste! Welcome to CartPilot. Tell me what dish you would like to cook (e.g. "Paneer Butter Masala for 4") or your budget, and I will assemble an authentic vegetarian ingredient cart for you!',
      };
    }

    // ── 2. Gratitude (0 LLM Tokens) ──────────────────────────────────────────
    if (THANKS_REGEX.test(lower)) {
      return {
        handled: true,
        content:
          "You're very welcome! Let me know if you would like recipe ingredients for another meal, or if you're ready to proceed to checkout.",
      };
    }

    // ── 3. Help & Capabilities (0 LLM Tokens) ────────────────────────────────
    if (HELP_REGEX.test(lower)) {
      return {
        handled: true,
        content:
          'I am your AI Grocery & Culinary Companion for CartPilot! Here is what I can do for you:\n• Name any dish (e.g. "Paneer Pulao for 4") to generate fresh vegetarian ingredients matched to our catalog.\n• Adjust servings on the fly (e.g. "Make it for 6").\n• Set a budget constraint (e.g. "Weekly budget ₹1500").\n• Review and add items directly to your cart with one tap.',
      };
    }

    // ── 4. Cart Intent (0 LLM Tokens) ────────────────────────────────────────
    if (/^(show\s+cart|view\s+cart|my\s+cart|what\s+is\s+in\s+my\s+cart)$/i.test(lower)) {
      const cart = await CartModel.findOne({ userId }).lean();
      return {
        handled: true,
        content: cart && cart.items.length > 0
          ? `Here is your current cart containing ${cart.items.length} item(s). You can review or proceed to checkout:`
          : 'Your cart is currently empty. Tell me what you would like to cook and I will assemble fresh ingredients for you!',
        cardType: cart && cart.items.length > 0 ? 'cart' : undefined,
        cardData: cart ? (cart as any) : undefined,
      };
    }

    // ── 5. Budget Target Setting (0 LLM Tokens) ──────────────────────────────
    const budgetMatch = lower.match(/(?:budget|spend|within|under)\s*(?:of)?\s*₹?\s*(\d{2,6})/i);
    let budgetTargetPaise: number | undefined;
    if (budgetMatch && budgetMatch[1]) {
      const rupees = parseInt(budgetMatch[1], 10);
      budgetTargetPaise = rupees * 100;
    }

    // ── 6. Servings Rescaling on Active Dish (0 LLM Tokens) ───────────────────
    let servingsMatch = lower.match(SERVINGS_REGEX) || lower.match(SERVINGS_ONLY_REGEX);
    if (servingsMatch && servingsMatch[1] && sessionState.activeDish) {
      const newServings = parseInt(servingsMatch[1], 10);
      if (newServings > 0 && newServings <= 50) {
        logger.info({ dish: sessionState.activeDish, newServings }, 'Rescaling active dish servings in pure code');
        const planned = await RecipePlannerService.getOrPlanRecipe(sessionState.activeDish, newServings);
        const matchResult = await CatalogMatcherService.matchRecipeToCatalog(
          planned.dishKey,
          planned.dishName,
          planned.ingredients,
          newServings
        );

        return {
          handled: true,
          content: `I've rescaled the ingredients for **${planned.dishName}** to serve **${newServings} people**. All items have been re-matched to our live store inventory:`,
          cardType: 'items',
          cardData: this.formatCardData(matchResult),
          sessionStateUpdate: {
            activeDish: planned.dishName,
            activeServings: newServings,
          },
        };
      }
    }

    // ── 7. Non-Veg Request Guardrail (100% Vegetarian Notice) ────────────────
    const containsNonVeg = NON_VEG_WORDS.some((word) => lower.includes(word));
    let nonVegNoticePrefix = '';
    let sanitizedQuery = trimmed;

    if (containsNonVeg) {
      nonVegNoticePrefix =
        '🌿 **Note**: Our store catalog is strictly 100% pure vegetarian! I have converted your dish to our gourmet vegetarian version.\n\n';

      // Clean non-veg words and replace with vegetarian alternatives
      sanitizedQuery = sanitizedQuery
        .replace(/chicken\s+paneer/gi, 'Paneer')
        .replace(/chicken|mutton|gosht|pork|beef|fish|machhli|prawns?|egg|eggs|anda|murgi/gi, 'Paneer')
        .trim();
    }

    // ── 8. Dish / Recipe Request Detection ───────────────────────────────────
    // Extract servings if present in query
    let requestedServings = sessionState.activeServings || 4;
    const embeddedServings = sanitizedQuery.match(SERVINGS_REGEX);
    if (embeddedServings && embeddedServings[1]) {
      requestedServings = parseInt(embeddedServings[1], 10);
      sanitizedQuery = sanitizedQuery.replace(SERVINGS_REGEX, '').trim();
    }

    // Clean dish phrase
    let dishName = sanitizedQuery
      .replace(/^(i\s+want\s+to\s+cook|can\s+you\s+make|recipe\s+for|ingredients\s+for|how\s+to\s+make|prepare|cook|make)\s+/i, '')
      .replace(/\s+(recipe|curry|gravy|dinner|lunch|breakfast)$/i, '')
      .trim();

    if (dishName.length < 3) {
      dishName = sanitizedQuery;
    }

    // Plan recipe: Check Seed -> Check Cache -> Single Token-Lean LLM call
    try {
      const planned = await RecipePlannerService.getOrPlanRecipe(dishName, requestedServings);
      const matchResult = await CatalogMatcherService.matchRecipeToCatalog(
        planned.dishKey,
        planned.dishName,
        planned.ingredients,
        requestedServings
      );

      const responseContent = `${nonVegNoticePrefix}Here are the freshly matched ingredients for **${planned.dishName}** (serves ${requestedServings}). You can add all items to your cart with 1 tap or customize each ingredient below:`;

      return {
        handled: true,
        content: responseContent,
        cardType: 'items',
        cardData: this.formatCardData(matchResult),
        sessionStateUpdate: {
          activeDish: planned.dishName,
          activeServings: requestedServings,
          budgetTargetPaise,
        },
      };
    } catch (err: any) {
      logger.error({ err }, 'Error planning recipe in ChatRouterService');
      return {
        handled: false,
        content: '',
      };
    }
  }

  /**
   * Formats CatalogMatchResult into the standard DynamicRecipeCardPayload expected by ItemsCard.tsx
   */
  private static formatCardData(match: CatalogMatchResult): Record<string, any> {
    return {
      status: 'DYNAMIC_RECIPE_MATCH',
      dishName: match.dishName,
      dishKey: match.dishKey,
      servings: match.servings,
      totalIngredientsCount: match.totalIngredientsCount,
      availableCount: match.availableCount,
      missingCount: match.missingCount,
      items: match.lines.map((line) => ({
        ingredientName: line.ingredientName,
        ingredientKey: line.ingredientKey,
        role: line.role,
        isPantry: line.isPantry,
        requiredAmount: line.requiredAmount,
        requiredUnit: line.requiredUnit,
        status: line.status === 'IN_STOCK' ? 'AVAILABLE' : line.status,
        statusLabel: line.statusLabel,
        packCount: line.packCount,
        quantity: line.packCount,
        subtotalPaise: line.subtotalPaise,
        formattedSubtotal: `₹${(line.subtotalPaise / 100).toFixed(2)}`,
        productId: line.product?.id,
        name: line.product?.name || line.ingredientName,
        packageSize: line.product?.packageSize,
        packageUnit: line.product?.packageUnit,
        pricePaise: line.product?.unitPricePaise,
        unitPricePaise: line.product?.unitPricePaise,
        formattedUnitPrice: line.product?.unitPricePaise
          ? `₹${(line.product.unitPricePaise / 100).toFixed(2)}`
          : undefined,
        availableStock: line.product?.availableStock ?? 0,
        imageUrl: line.product?.imageUrl,
        matchedProduct: line.product
          ? {
              id: line.product.id,
              name: line.product.name,
              packageSize: line.product.packageSize,
              packageUnit: line.product.packageUnit,
              unitPricePaise: line.product.unitPricePaise,
              formattedUnitPrice: `₹${(line.product.unitPricePaise / 100).toFixed(2)}`,
              availableStock: line.product.availableStock,
            }
          : undefined,
        alternatives: line.alternatives,
      })),
      pricing: {
        subtotalPaise: match.totalAvailablePaise,
        totalPaise: match.totalAvailablePaise,
        formatted: {
          subtotal: `₹${(match.totalAvailablePaise / 100).toFixed(2)}`,
          total: `₹${(match.totalAvailablePaise / 100).toFixed(2)}`,
        },
      },
    };
  }
}
