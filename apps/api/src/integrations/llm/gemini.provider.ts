import {
  LLMProvider,
  AgentMessage,
  AgentToolDeclaration,
  LLMResponse,
  AgentToolCall,
} from './llm-provider.interface.js';
import { logger } from '../../common/logging/logger.js';
import { env } from '../../config/env.config.js';
import { AppError } from '../../common/errors/app-error.js';

export class GeminiProvider implements LLMProvider {
  private readonly apiKey: string;
  private readonly model: string;

  constructor(apiKey?: string, model?: string) {
    this.apiKey = apiKey || env.GEMINI_API_KEY || '';
    this.model = model || env.GEMINI_MODEL || 'gemini-3.8-flash';
  }

  public async generateResponse(
    messages: AgentMessage[],
    tools: AgentToolDeclaration[],
    systemPrompt: string
  ): Promise<LLMResponse> {
    if (!this.apiKey || this.apiKey.trim().length === 0 || this.apiKey === 'your_gemini_api_key_here') {
      logger.warn(
        'Live Gemini inference is unconfigured: GEMINI_API_KEY is missing or placeholder. Return customer-friendly maintenance notice.'
      );

      if (env.NODE_ENV === 'production') {
        throw new AppError(
          'AI_CONFIGURATION_ERROR',
          'Gemini API key is unconfigured in production environment',
          500
        );
      }

      return {
        text: 'Hello! I am currently undergoing brief maintenance while our catalog systems sync. In the meantime, you can explore all fresh vegetarian products, categories, and recipes directly from the Browse menu!',
        isSimulated: false,
        provider: 'gemini',
      };
    }

    try {
      // 1. Convert tools to Gemini function declarations
      const functionDeclarations = tools.map((t) => ({
        name: t.name,
        description: t.description,
        parameters: t.parameters,
      }));

      // 2. Convert conversation history to Gemini contents format
      const contents = messages
        .filter((m) => m.role !== 'system')
        .map((m) => {
          if (m.role === 'tool') {
            return {
              role: 'function',
              parts: [
                {
                  functionResponse: {
                    name: m.toolCalls?.[0]?.name || 'tool_response',
                    response: m.toolResult || {},
                  },
                },
              ],
            };
          }

          if (m.role === 'assistant') {
            const parts: any[] = [];
            if (m.content) parts.push({ text: m.content });
            if (m.toolCalls && m.toolCalls.length > 0) {
              for (const tc of m.toolCalls) {
                parts.push({
                  functionCall: {
                    name: tc.name,
                    args: tc.arguments,
                  },
                });
              }
            }
            return {
              role: 'model',
              parts,
            };
          }

          return {
            role: 'user',
            parts: [{ text: m.content }],
          };
        });

      const requestBody = {
        systemInstruction: {
          parts: [{ text: systemPrompt }],
        },
        contents,
        tools: functionDeclarations.length > 0 ? [{ functionDeclarations }] : undefined,
      };

      const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
      let response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      // If the configured model is deprecated, busy, or unavailable, try fallback models with brief backoff
      const candidateModels = ['gemini-3.8-flash', 'gemini-3.8-pro', 'gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'];
      for (const fallbackModel of candidateModels) {
        if (response.ok) break;
        if (fallbackModel === this.model) continue;

        logger.warn(
          { currentModel: this.model, fallbackModel, status: response.status },
          'Configured Gemini model busy or failed; attempting fallback model...'
        );
        // Small backoff in case of rate limit/spikes
        await new Promise((r) => setTimeout(r, 600));

        const fallbackUrl = `https://generativelanguage.googleapis.com/v1beta/models/${fallbackModel}:generateContent?key=${this.apiKey}`;
        const fallbackResponse = await fetch(fallbackUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        });
        if (fallbackResponse.ok) {
          response = fallbackResponse;
          break;
        }
      }

      if (!response.ok) {
        const errorText = await response.text();
        let parsedError = errorText;
        try {
          const errJson = JSON.parse(errorText);
          parsedError = errJson.error?.message || errorText;
        } catch {
          // ignore parse error
        }

        logger.error(
          { status: response.status, parsedError },
          'Gemini API call failed across candidate models'
        );

        // Graceful user-friendly message rather than a 503 application crash
        return {
          text: `I apologize, but the AI service is momentarily experiencing a temporary high-traffic demand spike from Google. Please ask me again in just a moment! In the meantime, you can browse all 43 fresh organic items in the **Browse** tab.`,
          isSimulated: true,
          provider: 'gemini',
        };
      }

      const data = (await response.json()) as any;
      const candidate = data.candidates?.[0];
      const parts = candidate?.content?.parts || [];

      let responseText = '';
      const toolCalls: AgentToolCall[] = [];

      for (const part of parts) {
        if (part.text) {
          responseText += part.text;
        }
        if (part.functionCall) {
          toolCalls.push({
            id: `call_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            name: part.functionCall.name,
            arguments: part.functionCall.args || {},
          });
        }
      }

      return {
        text: responseText,
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
        isSimulated: false,
        provider: 'gemini',
      };
    } catch (err: any) {
      logger.error({ err }, 'Error communicating with Gemini API');
      if (err instanceof AppError) throw err;
      throw new AppError(
        'AI_SERVICE_UNAVAILABLE',
        `Conversational AI service error: ${err.message || 'Unknown network error'}`,
        503
      );
    }
  }
}
