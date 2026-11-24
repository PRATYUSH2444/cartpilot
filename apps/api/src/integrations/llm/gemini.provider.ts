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
            const resp =
              typeof m.toolResult === 'object' && m.toolResult !== null && !Array.isArray(m.toolResult)
                ? m.toolResult
                : { result: m.toolResult };

            return {
              role: 'function',
              parts: [
                {
                  functionResponse: {
                    name: m.toolCalls?.[0]?.name || 'tool_response',
                    response: resp,
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

      const candidateModels = [this.model, 'gemini-2.0-flash', 'gemini-1.5-flash'].filter(
        (m, idx, arr) => arr.indexOf(m) === idx
      );

      let response: Response | null = null;
      let lastErrorText = '';

      for (const modelCandidate of candidateModels) {
        try {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelCandidate}:generateContent?key=${this.apiKey}`;
          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
            signal: AbortSignal.timeout(8000),
          });

          if (res.ok) {
            response = res;
            break;
          }

          lastErrorText = await res.text().catch(() => '');
          logger.warn(
            { model: modelCandidate, status: res.status, error: lastErrorText },
            'Gemini candidate model returned non-OK status'
          );
        } catch (err: any) {
          logger.warn({ model: modelCandidate, err: err?.message }, 'Gemini model request failed');
        }
      }

      if (!response || !response.ok) {
        let parsedMessage = 'Gemini AI service is momentarily busy';
        try {
          const errObj = JSON.parse(lastErrorText);
          parsedMessage = errObj.error?.message || lastErrorText;
        } catch {
          if (lastErrorText) parsedMessage = lastErrorText;
        }

        throw new AppError(
          'AI_SERVICE_UNAVAILABLE',
          `Gemini AI service: ${parsedMessage}`,
          503
        );
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
