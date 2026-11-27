import { LLMFactory } from '../../integrations/llm/llm-factory.js';
import { AgentMessage } from '../../integrations/llm/llm-provider.interface.js';
import { ToolSandbox, ToolExecutionRecord } from './tools/tool-sandbox.js';
import { logger } from '../../common/logging/logger.js';
import { AppError } from '../../common/errors/app-error.js';

export interface AgentTurnResult {
  content: string;
  toolCalls: ToolExecutionRecord[];
  cardType?: 'rules' | 'items' | 'cart' | 'approval' | 'payment' | 'order' | 'proof';
  cardData?: Record<string, any>;
}

/**
 * Compacts verbose tool outputs to minimal essentials before sending to LLM.
 * Saves ~80% of tokens while preserving all facts needed for conversational responses.
 */
function compactToolResult(toolName: string, result: any): any {
  if (!result || typeof result !== 'object') return result;

  if (toolName === 'matchIngredientsToCatalog') {
    return {
      dishName: result.dishName,
      availableCount: result.availableCount,
      missingCount: result.missingCount,
      available: (result.availableItems || []).map((i: any) => ({
        name: i.name,
        product: i.matchedProduct?.name,
        price: i.matchedProduct?.price,
        unit: i.unit,
      })),
      missing: (result.missingItems || []).map((i: any) => ({
        name: i.name,
        unit: i.unit,
        suggestion: i.substitutionSuggestion,
      })),
    };
  }

  if (toolName === 'getCart') {
    return {
      itemCount: result.itemCount || result.items?.length,
      totalAmount: result.totalAmount || result.subtotal,
      items: (result.items || []).map((i: any) => ({
        name: i.product?.name || i.name,
        qty: i.quantity,
        price: i.unitPrice || i.price,
      })),
    };
  }

  return result;
}

export class AgentService {
  private static readonly SYSTEM_PROMPT = `
You are CartPilot, a policy-controlled autonomous AI grocery and culinary intelligence engine.
You specialize in 100% certified vegetarian groceries, authentic cooking, recipe formulation, ingredient discovery, and budget-governed shopping.

CORE OPERATIONAL ARCHITECTURE:
AI reasons & proposes → backend tools validate against live MongoDB catalog → policy engine governs spending → customer confirms payment.

CRITICAL BEHAVIORS & CAPABILITIES:
1. ARBITRARY & DYNAMIC RECIPES:
   - When a user asks for ANY dish (e.g. "Mushroom Chilli for 4", "Bengali vegetarian dinner", "Thai red curry", "Paneer Pulao", "Dal Tadka", "What can I cook with potatoes, spinach, and paneer?"):
     a) Reason dynamically about the authentic culinary ingredients, realistic quantities, and units.
     b) Call the tool "matchIngredientsToCatalog" with the dishName, servings, cuisine, step-by-step instructions, and the exhaustive list of required ingredients (name, quantity, unit, isMandatory).
     c) The tool will inspect the live store catalogue in MongoDB and report which ingredients are AVAILABLE (with real prices, package sizes, and stock) and which are MISSING or have culinary alternatives.
     d) Provide a clear, helpful culinary explanation. Clearly distinguish what is in stock and ready to buy versus what the customer might need to source separately or substitute.

2. CULINARY QUESTIONS & ADVICE:
   - When the user asks general cooking, food, or grocery questions (e.g. "What is the difference between basmati and sona masoori?", "Can I replace cream with cashew paste?", "How do I make crispy mushrooms?"):
     Answer naturally, knowledgeably, and warmly using your AI culinary expertise. No tool call is necessary unless product search or purchase is requested.

3. RECIPE MODIFICATION & CONVERSATIONAL CONTINUITY:
   - When a user says "Make it for 8 people", "Remove garlic", "Make it cheaper", or "Replace paneer with tofu":
     Remember the active recipe from the conversational context, update the ingredients and quantities accordingly, and re-invoke "matchIngredientsToCatalog".

4. CART ACTIONS & SHOPPING:
   - If the user asks to add items to their cart (e.g. "Add all available ingredients to my cart", "Add the mushrooms"):
     Call "addCartItem" for each available product.
   - If the user asks to see their cart:
     Call "getCart".
   - If the user asks about their spending rules, budget, or mandate limits:
     Call "getSpendingRules".

5. CATALOG & INVENTORY BOUNDARIES:
   - NEVER invent or hallucinate product prices, stock levels, or store availability. All commercial pricing, stock, and SKU data MUST come strictly from tool results.
   - 100% CERTIFIED VEGETARIAN INVARIANT: The catalog contains exclusively certified vegetarian products. If a user asks for meat, poultry, seafood, or eggs, politely decline and recommend protein-rich vegetarian alternatives (such as fresh malai paneer, organic tofu, or lentils).
   - CHECKOUT & PAYMENT SECURITY: You can never initiate checkouts or process payments autonomously. Adding to cart is permitted; final payment requires explicit human confirmation.

6. GREETINGS & CASUAL MESSAGES:
   - When the user sends a simple greeting (e.g. "Hi", "Hello", "Hey", "Good morning"):
     Respond warmly, naturally, and concisely in ONE short sentence (e.g. "Hello! What delicious vegetarian meal or grocery list can I help you put together today?").
     NEVER regurgitate your entire system description, operational architecture, or multi-paragraph introductory pitches on simple greetings.

7. BUDGET AS CONVERSATIONAL PLANNING CONSTRAINT:
   - When the user states a budget in chat (e.g. "Weekly budget ₹1500", "Dinner under ₹500", "Groceries within ₹2000"):
     Treat this strictly as a conversational planning constraint for recipes and grocery baskets. Acknowledge the budget target warmly, ask 1-2 brief clarifying questions (such as household size or favorite cuisines), and assemble an ingredient list that stays within this target.
     CRITICAL INVARIANT: NEVER call mandate-updating tools or alter the user's account spending rules or policy limits based on a conversational planning request. Mandates are account-level governance controls that require explicit settings management.
`.trim();

  public static async runTurn(
    userId: string,
    userText: string,
    history: Array<{ sender: 'USER' | 'AGENT' | 'SYSTEM'; content: string }> = []
  ): Promise<AgentTurnResult> {
    const provider = LLMFactory.getProvider();
    const toolDeclarations = ToolSandbox.getToolDeclarations();

    const messages: AgentMessage[] = [];

    // 1. Add historical context (compact: last 6 messages to prevent token exhaustion)
    const recentHistory = history.slice(-6);
    for (const item of recentHistory) {
      messages.push({
        role: item.sender === 'USER' ? 'user' : 'assistant',
        content: item.content,
      });
    }

    // 2. Add current user prompt
    messages.push({
      role: 'user',
      content: userText,
    });

    const recordedToolExecutions: ToolExecutionRecord[] = [];
    let detectedCardType: AgentTurnResult['cardType'];
    let detectedCardData: Record<string, any> | undefined;

    let finalContent = '';
    let loopCount = 0;
    const maxLoops = 3;

    try {
      while (loopCount < maxLoops) {
        loopCount++;

        const llmResponse = await provider.generateResponse(
          messages,
          toolDeclarations,
          this.SYSTEM_PROMPT
        );

        if (llmResponse.text) {
          finalContent = llmResponse.text;
        }

        // If no tool calls requested, the LLM has concluded its turn
        if (!llmResponse.toolCalls || llmResponse.toolCalls.length === 0) {
          break;
        }

        // Add assistant response with tool calls to conversation context
        messages.push({
          role: 'assistant',
          content: llmResponse.text || '',
          toolCalls: llmResponse.toolCalls,
        });

        // Execute each tool call within sandboxed boundaries
        for (const tc of llmResponse.toolCalls) {
          logger.info(
            { toolName: tc.name, args: tc.arguments, step: loopCount },
            'Executing agent tool call'
          );

          const execResult = await ToolSandbox.executeTool(tc.name, tc.arguments, {
            userId,
            currentStepCount: recordedToolExecutions.length,
          });

          recordedToolExecutions.push(execResult.record);

          // Check if tool produced a structured UI card
          if (tc.name === 'matchIngredientsToCatalog' && execResult.result) {
            detectedCardType = 'items';
            detectedCardData = {
              status: 'DYNAMIC_RECIPE_MATCH',
              dishName: execResult.result.dishName,
              servings: execResult.result.servings,
              cuisine: execResult.result.cuisine,
              instructions: execResult.result.instructions,
              totalIngredientsCount: execResult.result.totalIngredientsCount,
              availableCount: execResult.result.availableCount,
              missingCount: execResult.result.missingCount,
              items: execResult.result.items,
              availableItems: execResult.result.availableItems,
              missingItems: execResult.result.missingItems,
              pricing: execResult.result.pricing,
            };
          } else if (tc.name === 'proposeCartItems' && execResult.result) {
            detectedCardType = 'items';
            detectedCardData = execResult.result;
          } else if (
            (tc.name === 'getCart' || tc.name === 'addCartItem' || tc.name === 'removeCartItem') &&
            execResult.result
          ) {
            detectedCardType = 'cart';
            detectedCardData = execResult.result;
          } else if (tc.name === 'getSpendingRules' && execResult.result) {
            detectedCardType = 'rules';
            detectedCardData = execResult.result;
          }

          const compactRes = compactToolResult(tc.name, execResult.result);
          // Append compact tool execution output back to LLM context to conserve tokens
          messages.push({
            role: 'tool',
            content: execResult.error
              ? `Error executing ${tc.name}: ${execResult.error}`
              : JSON.stringify(compactRes),
            toolCalls: [tc],
            toolCallId: tc.id,
            toolResult: compactRes,
          });
        }
      }

      if (!finalContent.trim()) {
        finalContent =
          'I have analyzed your request and checked our live catalog. Please review the details above.';
      }

      return {
        content: finalContent,
        toolCalls: recordedToolExecutions,
        cardType: detectedCardType,
        cardData: detectedCardData,
      };
    } catch (err: any) {
      logger.error({ err }, 'Error in agent orchestration turn');
      throw new AppError(
        'AI_INFERENCE_ERROR',
        `The AI assistant is temporarily unavailable: ${err?.message || 'External provider error'}. Please try again in a moment.`,
        503
      );
    }
  }
}
