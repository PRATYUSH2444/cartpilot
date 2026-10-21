import {
  LLMProvider,
  AgentMessage,
  AgentToolDeclaration,
  LLMResponse,
} from './llm-provider.interface.js';

export class MockLLMProvider implements LLMProvider {
  public async generateResponse(
    messages: AgentMessage[],
    tools: AgentToolDeclaration[],
    systemPrompt: string
  ): Promise<LLMResponse> {
    const response = await this.evaluate(messages, tools, systemPrompt);
    return {
      ...response,
      isSimulated: true,
      provider: 'mock',
    };
  }

  private async evaluate(
    messages: AgentMessage[],
    _tools: AgentToolDeclaration[],
    _systemPrompt: string
  ): Promise<LLMResponse> {
    const lastMsg = messages[messages.length - 1];

    // 1. If previous turn was a tool execution response
    if (lastMsg && lastMsg.role === 'tool') {
      const toolName = lastMsg.toolCalls?.[0]?.name;
      const toolResult = lastMsg.toolResult;

      if (toolName === 'resolveRecipe') {
        const dish = toolResult?.dishName || 'Recipe';
        const matched = toolResult?.matchedItems || [];
        const missing = toolResult?.missingItems || [];

        if (missing.length > 0 && missing[0]?.isVegetarianViolation) {
          return {
            text: `I cannot fulfill this request: ${missing[0].reason} CartPilot operates an exclusively 100% certified vegetarian catalog.`,
          };
        }

        if (matched.length > 0) {
          // Trigger proposeCartItems so user gets a structured proposal card
          const proposalItems = matched.map((item: any) => ({
            productId: item.productId,
            quantity: item.packCount,
          }));

          return {
            text: `I have resolved the recipe for ${dish} (${toolResult.servings} servings)! Generating a cart proposal for your review...`,
            toolCalls: [
              {
                id: `call_${Date.now()}`,
                name: 'proposeCartItems',
                arguments: {
                  items: proposalItems,
                  rationale: `Ingredients for ${dish} (${toolResult.servings} servings)`,
                },
              },
            ],
          };
        }

        return {
          text: `I could not find matching catalog products for ${dish}. Some ingredients were missing: ${missing.map((m: any) => m.ingredientName).join(', ')}.`,
        };
      }

      if (toolName === 'proposeCartItems') {
        const total = toolResult?.pricing?.formatted?.total || '₹0.00';
        const itemCount = toolResult?.totalItems || 0;
        return {
          text: `I have assembled a proposal with ${itemCount} items totaling ${total}. Please review the items below. The AI proposes, but you decide!`,
        };
      }

      if (toolName === 'searchCatalog') {
        const products = toolResult?.products || [];
        if (products.length === 0) {
          return { text: 'No matching certified vegetarian products found in the catalog.' };
        }
        const summary = products
          .slice(0, 4)
          .map((p: any) => `• ${p.name} (${p.packageSize}${p.packageUnit}) — ${p.formattedPrice}`)
          .join('\n');
        return {
          text: `Here are the matching items found in the catalog:\n\n${summary}\n\nWould you like me to add any of these to your cart proposal?`,
        };
      }

      if (toolName === 'getCart') {
        const items = toolResult?.items || [];
        const total = toolResult?.pricing?.formatted?.total || '₹0.00';
        if (items.length === 0) {
          return {
            text: 'Your shopping cart is currently empty. What would you like to cook today?',
          };
        }
        const itemList = items
          .map((i: any) => `• ${i.name} × ${i.quantity} (${i.formattedItemTotal})`)
          .join('\n');
        return {
          text: `Here is your active cart:\n\n${itemList}\n\nAuthoritative Server Total: ${total}`,
        };
      }
    }

    // 2. Evaluate incoming user prompt
    const userText =
      messages
        .filter((m) => m.role === 'user')
        .slice(-1)[0]
        ?.content.toLowerCase() || '';

    // Prompt injection / security boundary attack detection (FR-14, SC-14)
    if (
      userText.includes('ignore') ||
      userText.includes('override') ||
      userText.includes('bypass') ||
      userText.includes('set price') ||
      userText.includes('delete order') ||
      userText.includes('execute payment') ||
      userText.includes('force checkout')
    ) {
      return {
        text: '🛡️ Security Policy: I am a policy-governed shopping assistant. I cannot modify database records directly, override authoritative server-side prices, bypass spending mandates, or execute payments. All checkout and payment actions require explicit human authorization.',
      };
    }

    // Recipe inquiry
    if (
      userText.includes('pulao') ||
      userText.includes('paneer butter masala') ||
      userText.includes('dal tadka') ||
      userText.includes('jeera rice') ||
      userText.includes('aloo matar') ||
      userText.includes('khichdi') ||
      userText.includes('biryani') ||
      userText.includes('recipe') ||
      userText.includes('cook') ||
      userText.includes('make')
    ) {
      let dishName = 'Paneer Pulao';
      if (userText.includes('butter masala')) dishName = 'Paneer Butter Masala';
      else if (userText.includes('dal tadka') || userText.includes('dal fry'))
        dishName = 'Dal Tadka';
      else if (userText.includes('jeera rice')) dishName = 'Jeera Rice';
      else if (userText.includes('aloo matar') || userText.includes('aloo mutter'))
        dishName = 'Aloo Matar';
      else if (userText.includes('khichdi')) dishName = 'Moong Dal Khichdi';
      else if (userText.includes('biryani')) dishName = 'Vegetable Biryani';
      else if (userText.includes('chicken')) dishName = 'Butter Chicken';

      // Extract servings if mentioned (e.g. "for 6", "6 people", "2 servings")
      const servingsMatch = userText.match(/(\d+)\s*(people|person|servings)?/);
      const servings = servingsMatch && Number(servingsMatch[1]) > 0 ? Number(servingsMatch[1]) : 4;

      return {
        text: `Looking up authentic recipe and calculating exact package sizes for ${dishName} (${servings} servings)...`,
        toolCalls: [
          {
            id: `call_${Date.now()}`,
            name: 'resolveRecipe',
            arguments: { dishName, servings },
          },
        ],
      };
    }

    // Search inquiry
    if (
      userText.includes('search') ||
      userText.includes('find') ||
      userText.includes('rice') ||
      userText.includes('ghee') ||
      userText.includes('paneer') ||
      userText.includes('peas') ||
      userText.includes('spices') ||
      userText.includes('oil')
    ) {
      let query = 'basmati rice';
      if (userText.includes('paneer')) query = 'paneer';
      else if (userText.includes('ghee')) query = 'cow ghee';
      else if (userText.includes('peas')) query = 'green peas';
      else if (userText.includes('spices') || userText.includes('jeera')) query = 'cumin seeds';
      else if (userText.includes('oil')) query = 'mustard oil';

      return {
        text: `Searching our vegetarian catalog for "${query}"...`,
        toolCalls: [
          {
            id: `call_${Date.now()}`,
            name: 'searchCatalog',
            arguments: { query, limit: 5 },
          },
        ],
      };
    }

    // Cart inquiry
    if (userText.includes('cart') || userText.includes('total') || userText.includes('my items')) {
      return {
        text: 'Checking your active cart...',
        toolCalls: [
          {
            id: `call_${Date.now()}`,
            name: 'getCart',
            arguments: {},
          },
        ],
      };
    }

    // Default general response
    return {
      text: 'Hello! I am CartPilot, your policy-governed shopping assistant. You can ask me to plan meals (e.g., "Paneer Pulao for 4 people"), find certified vegetarian ingredients, or inspect your cart and mandate limits. What can I help you with today?',
    };
  }
}
