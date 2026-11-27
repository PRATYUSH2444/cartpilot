import { RecipePlanModel, IRecipeIngredient } from './recipe-plan.model.js';
import { SEED_RECIPES, DISH_ALIAS_MAP } from './recipe-seed.data.js';
import { env } from '../../config/env.config.js';
import { logger } from '../../common/logging/logger.js';

interface RawPlannerOutput {
  dish?: string;
  cuisine?: string;
  servingsBase?: number;
  ingredients?: Array<{
    key?: string;
    name?: string;
    qtyPerServing?: number;
    unit?: string;
    role?: 'core' | 'optional' | 'pantry';
  }>;
}

const NON_VEG_KEYS = new Set([
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
]);

export class RecipePlannerService {
  /**
   * Normalizes a dish query into a canonical slug/key for exact and alias lookups.
   */
  public static normalizeDishQuery(rawQuery: string): string {
    let clean = rawQuery
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Check alias map first
    if (DISH_ALIAS_MAP[clean]) {
      return DISH_ALIAS_MAP[clean]!;
    }

    // Try multi-word submatches
    for (const [alias, key] of Object.entries(DISH_ALIAS_MAP)) {
      if (clean.includes(alias)) {
        return key;
      }
    }

    return clean.replace(/\s+/g, '_');
  }

  /**
   * Retrieves an authentic recipe plan by checking:
   * 1. In-memory pre-seeded recipes (0 tokens, 0 ms)
   * 2. MongoDB recipe_plans cache (0 tokens, 5 ms)
   * 3. Token-lean Gemini AI Planner (1 single call with strict JSON schema)
   */
  public static async getOrPlanRecipe(
    dishQuery: string,
    requestedServings = 4
  ): Promise<{ dishKey: string; dishName: string; servingsBase: number; ingredients: IRecipeIngredient[]; fromCache: boolean }> {
    const dishKey = this.normalizeDishQuery(dishQuery);

    // 1. Check Pre-Seeded Recipes (Zero tokens, instant)
    const seed = SEED_RECIPES.find((r) => r.dishKey === dishKey);
    if (seed) {
      logger.info({ dishKey, dishName: seed.dishName }, '⚡ Recipe hit: Pre-seeded in-memory catalog');
      return {
        dishKey: seed.dishKey,
        dishName: seed.dishName,
        servingsBase: seed.servingsBase,
        ingredients: seed.ingredients,
        fromCache: true,
      };
    }

    // 2. Check Database Cache (Zero tokens, fast)
    try {
      const cached = await RecipePlanModel.findOne({ dishKey });
      if (cached) {
        cached.hits += 1;
        await cached.save().catch(() => {});
        logger.info({ dishKey, hits: cached.hits }, '⚡ Recipe hit: MongoDB recipe_plans cache');
        return {
          dishKey: cached.dishKey,
          dishName: cached.dishName,
          servingsBase: cached.servingsBase,
          ingredients: cached.ingredients,
          fromCache: true,
        };
      }
    } catch (dbErr) {
      logger.warn({ dbErr }, 'Cache lookup failed, proceeding to planning');
    }

    // 3. Token-Lean LLM Planning Call
    logger.info({ dishQuery, dishKey }, '🧠 Cache miss: Initiating single-shot token-lean AI recipe plan');
    const planned = await this.planWithGemini(dishQuery, requestedServings);

    // Save to cache for future requests
    try {
      await RecipePlanModel.create({
        dishKey,
        dishName: planned.dishName,
        cuisine: planned.cuisine || 'Indian',
        diet: 'VEGETARIAN',
        servingsBase: planned.servingsBase,
        ingredients: planned.ingredients,
        sourceModel: planned.modelUsed,
        hits: 1,
      });
      logger.info({ dishKey }, '💾 Saved new planned recipe to MongoDB cache');
    } catch (saveErr) {
      logger.warn({ saveErr }, 'Could not persist planned recipe to cache');
    }

    return {
      dishKey,
      dishName: planned.dishName,
      servingsBase: planned.servingsBase,
      ingredients: planned.ingredients,
      fromCache: false,
    };
  }

  /**
   * Calls Gemini with minimal input tokens, minimal thinking, and strict JSON output.
   * Model fallback chain: gemini-3.1-flash-lite -> gemini-2.5-flash-lite -> gemini-3-flash
   */
  private static async planWithGemini(
    dishQuery: string,
    servings: number
  ): Promise<{ dishName: string; cuisine: string; servingsBase: number; ingredients: IRecipeIngredient[]; modelUsed: string }> {
    const apiKey = env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      // Graceful fallback when API key is missing or unconfigured: return a safe vegetarian pantry plan
      return this.buildFallbackPlan(dishQuery, servings);
    }

    const modelsToTry = [
      'gemini-3.1-flash-lite',
      'gemini-2.5-flash-lite',
      'gemini-3-flash',
      env.GEMINI_MODEL || 'gemini-3.5-flash-lite',
    ];

    const systemInstruction = `You are a strict JSON recipe planner for a 100% pure vegetarian grocery store.
Return ONLY valid JSON matching this exact schema:
{"dish":"string","cuisine":"string","servingsBase":${servings},"ingredients":[{"key":"canonical_lowercase_id","name":"Display Name","qtyPerServing":100,"unit":"g"|"ml"|"tsp"|"tbsp"|"piece","role":"core"|"optional"|"pantry"}]}
RULES:
1. Pure vegetarian ingredients only. If asked for meat or chicken, substitute paneer, soya chunks, or mushroom.
2. Max 14 essential ingredients.
3. key must be a lowercase underscore ID: e.g. paneer, butter, tomato, onion, cashew, jeera, ginger, garlic, salt.
4. Output raw JSON only. Absolutely NO Markdown backticks, NO prose, NO preamble.`;

    const userPrompt = `Dish: "${dishQuery}". Servings: ${servings}. Diet: Strictly Vegetarian.`;

    for (const model of modelsToTry) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

        const payload = {
          contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
          systemInstruction: { parts: [{ text: systemInstruction }] },
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 600,
            responseMimeType: 'application/json',
          },
        };

        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const errText = await res.text();
          logger.warn({ model, status: res.status, errText }, 'Gemini model attempt returned non-200');
          continue; // Try next model in fallback chain
        }

        const data: any = await res.json();
        const rawJsonText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!rawJsonText) {
          continue;
        }

        const cleaned = rawJsonText.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
        const parsed: RawPlannerOutput = JSON.parse(cleaned);

        if (parsed && Array.isArray(parsed.ingredients) && parsed.ingredients.length > 0) {
          const cleanIngredients: IRecipeIngredient[] = [];

          for (const item of parsed.ingredients.slice(0, 15)) {
            let key = (item.key || item.name || 'ingredient').toLowerCase().replace(/[^\w]/g, '_');
            let name = item.name || key.replace(/_/g, ' ');

            // Enforce vegetarian invariant: replace any stray non-veg keys
            if (NON_VEG_KEYS.has(key)) {
              key = 'paneer';
              name = 'Fresh Malai Paneer (Vegetarian Choice)';
            }

            const rawUnit = (item.unit || 'g').toLowerCase();
            const validUnit = ['g', 'kg', 'ml', 'l', 'tsp', 'tbsp', 'piece'].includes(rawUnit)
              ? (rawUnit as any)
              : 'g';

            cleanIngredients.push({
              key,
              name,
              qtyPerServing: Math.max(1, Number(item.qtyPerServing) || 50),
              unit: validUnit,
              role: item.role === 'pantry' || item.role === 'optional' ? item.role : 'core',
              scale: validUnit === 'tsp' || validUnit === 'tbsp' ? 'sub' : 'linear',
            });
          }

          return {
            dishName: parsed.dish || dishQuery,
            cuisine: parsed.cuisine || 'Indian',
            servingsBase: servings,
            ingredients: cleanIngredients,
            modelUsed: model,
          };
        }
      } catch (err: any) {
        logger.warn({ model, err: err?.message }, 'Error calling model in fallback chain');
      }
    }

    return this.buildFallbackPlan(dishQuery, servings);
  }

  /**
   * Deterministic fallback plan when all remote LLMs are unreachable or rate-limited.
   * Guarantees that the customer never experiences a silent crash or failed chat.
   */
  private static buildFallbackPlan(
    dishQuery: string,
    servings: number
  ): { dishName: string; cuisine: string; servingsBase: number; ingredients: IRecipeIngredient[]; modelUsed: string } {
    logger.info({ dishQuery }, 'Using deterministic culinary recipe template fallback');
    return {
      dishName: dishQuery,
      cuisine: 'Indian Vegetarian',
      servingsBase: servings,
      ingredients: [
        { key: 'paneer', name: 'Fresh Malai Paneer', qtyPerServing: 100, unit: 'g', role: 'core' },
        { key: 'tomato', name: 'Country Red Tomatoes', qtyPerServing: 100, unit: 'g', role: 'core' },
        { key: 'onion', name: 'Fresh Red Onions', qtyPerServing: 75, unit: 'g', role: 'core' },
        { key: 'ginger', name: 'Fresh Ginger Root', qtyPerServing: 5, unit: 'g', role: 'pantry' },
        { key: 'garlic', name: 'Fresh Garlic Cloves', qtyPerServing: 5, unit: 'g', role: 'pantry' },
        { key: 'ghee', name: 'Pure Desi Cow Ghee', qtyPerServing: 15, unit: 'ml', role: 'core' },
        { key: 'jeera', name: 'Whole Cumin Seeds (Jeera)', qtyPerServing: 1, unit: 'tsp', role: 'pantry', scale: 'sub' },
        { key: 'garam_masala', name: 'Shahi Garam Masala', qtyPerServing: 1, unit: 'tsp', role: 'pantry', scale: 'sub' },
        { key: 'salt', name: 'Table Salt', qtyPerServing: 1, unit: 'tsp', role: 'pantry', scale: 'sub' },
      ],
      modelUsed: 'deterministic_fallback',
    };
  }
}
