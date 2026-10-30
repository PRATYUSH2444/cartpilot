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
    this.model = model || env.GEMINI_MODEL || 'gemini-1.5-flash';
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
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error(
          { status: response.status, errorText },
          'Gemini API call failed'
        );

        let parsedError = errorText;
        try {
          const errJson = JSON.parse(errorText);
          parsedError = errJson.error?.message || errorText;
        } catch {
          // ignore parse error
        }

        if (env.NODE_ENV === 'production') {
          throw new AppError(
            'AI_SERVICE_UNAVAILABLE',
            `Conversational AI service error from Gemini API: ${parsedError}`,
            503
          );
        }

        return {
          text: `⚠️ **Gemini API Error (${response.status})**: ${parsedError}. Please verify that GEMINI_API_KEY is active and has access to ${this.model}.`,
          isSimulated: false,
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
